import React, { useEffect, useState } from 'react'
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Pressable,
  Dimensions,
  StatusBar
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons'
import { Linking } from 'react-native'
import postPackageService from '@/services/postPackageService'
import contractTemplateService from '@/services/contractTemplateService'
import walletService from '@/services/walletService'
import { formatVND } from '@/utils/currency'

// Dynamic import WebView
let WebView: any = null
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  WebView = require('react-native-webview').WebView
} catch (e) {
  WebView = null
}

interface Props {
  visible: boolean
  postId?: string | null
  onClose: () => void
  onDone?: () => void
}

const COLORS = {
  primary: '#0284C7',
  background: '#F3F4F6',
  white: '#FFFFFF',
  textMain: '#111827',
  textSec: '#6B7280',
  border: '#E5E7EB',
  infoBg: '#E0F2FE',
  infoText: '#0369A1',
  success: '#10B981',
  danger: '#EF4444',
  warningBg: '#FEF3C7',
  warningText: '#B45309'
}

const { width } = Dimensions.get('window')

// --- COMPONENT: STEP INDICATOR ---
const StepIndicator: React.FC<{ step: number }> = ({ step }) => (
  <SafeAreaView edges={['top', 'left', 'right']} style={styles.stepContainer}>
    <View style={styles.stepWrapper}>
      {/* Line connecting steps */}
      <View style={styles.stepLineBase} />
      <View style={[styles.stepLineActive, { width: step === 2 ? '100%' : '0%' }]} />
      
      {/* Step 1 */}
      <View style={styles.stepItem}>
        <View style={[styles.stepCircle, step >= 1 && styles.stepCircleActive]}>
          {step > 1 ? <Ionicons name="checkmark" size={14} color="#fff" /> : <Text style={styles.stepNum}>1</Text>}
        </View>
        <Text style={[styles.stepText, step >= 1 && styles.stepTextActive]}>Hợp đồng</Text>
      </View>

      {/* Step 2 */}
      <View style={styles.stepItem}>
        <View style={[styles.stepCircle, step >= 2 && styles.stepCircleActive]}>
          <Text style={[styles.stepNum, step >= 2 && {color: '#fff'}]}>2</Text>
        </View>
        <Text style={[styles.stepText, step >= 2 && styles.stepTextActive]}>Thanh toán</Text>
      </View>
    </View>
  </SafeAreaView>
)

const InlinePostSignModal: React.FC<Props> = ({ visible, postId, onClose, onDone }) => {
  const [step, setStep] = useState<number>(1) // 1=contract, 2=payment
  const [loading, setLoading] = useState(false)
  const [post, setPost] = useState<any>(null)
  const [contractTemplate, setContractTemplate] = useState<any | null>(null)
  const [acceptedTerms, setAcceptedTerms] = useState<boolean>(false)
  const [wallet, setWallet] = useState<any | null>(null)
  const [sufficientBalance, setSufficientBalance] = useState<boolean | null>(null)
  const [paymentLoading, setPaymentLoading] = useState(false)

  useEffect(() => {
    if (visible && postId) {
      fetchDetails()
      fetchContract()
      setStep(1)
      setAcceptedTerms(false)
      setWallet(null)
      setSufficientBalance(null)
    }
  }, [visible, postId])

  const fetchDetails = async () => {
    try {
      const res: any = await postPackageService.getPostPackageDetails(postId!)
      setPost(res?.result ?? res)
    } catch (e) { console.warn(e) }
  }

  const fetchContract = async () => {
    try {
      const resp: any = await contractTemplateService.getLatestProviderContract()
      setContractTemplate(resp?.result ?? resp)
    } catch (e) { console.warn(e) }
  }

  const handleSign = async () => {
    if (!postId || !acceptedTerms) return
    setLoading(true)
    try {
      // Update status -> AWAITING_PAYMENT
      const upd: any = await postPackageService.updatePostStatus(postId, 'AWAITING_PAYMENT')
      const ok = upd?.isSuccess ?? upd?.statusCode === 200
      if (!ok) throw new Error(upd?.message || 'Không thể cập nhật trạng thái')
      
      // Fetch wallet & check balance
      const w: any = await walletService.getMyWallet()
      const myw = w?.result ?? w
      setWallet(myw)
      
      const balance = Number(myw?.balance ?? myw?.Balance ?? 0) || 0
      const amount = Number(post?.offeredPrice ?? 0) || 0
      setSufficientBalance(balance >= amount)
      
      // Move to next step
      setStep(2)
    } catch (e: any) {
      alert(e?.message || 'Thất bại')
    } finally {
      setLoading(false)
    }
  }

  const handlePayment = async () => {
    if (!postId) return
    setPaymentLoading(true)
    try {
      const amount = Number(post?.offeredPrice ?? 0) || 0
      const dto = { 
        amount, 
        type: 'POST_PAYMENT', 
        tripId: null, 
        postId: postId, 
        description: `Thanh toán phí đăng bài: ${post?.packageCode}` 
      }
      const payResp: any = await walletService.createPayment(dto)
      const ok = payResp?.isSuccess ?? (payResp?.statusCode === 200 || payResp?.statusCode === 201)
      if (!ok) throw new Error(payResp?.message || 'Thanh toán thất bại')
      
      // Update status -> OPEN
      await postPackageService.updatePostStatus(postId, 'OPEN')
      
      onDone?.()
      onClose()
    } catch (err: any) {
      alert('Lỗi: ' + (err?.message || 'Không thể thanh toán'))
    } finally {
      setPaymentLoading(false)
    }
  }

  const handleBack = () => {
    if (step > 1) setStep(step - 1)
    else onClose()
  }

  const openContractExternally = () => {
    const url = contractTemplate?.fileUrl
    if (url) Linking.openURL(url)
  }

  return (
    <Modal visible={visible} animationType="slide" transparent={false} onRequestClose={onClose}>
      <SafeAreaView edges={['top', 'left', 'right']} style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#fff" />
        
        {/* 1. Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBack} style={styles.iconBtn}>
            <Ionicons name="arrow-back" size={22} color={COLORS.textMain} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            {step === 1 ? 'Ký Hợp Đồng' : 'Thanh Toán Phí'}
          </Text>
          <TouchableOpacity onPress={onClose} style={styles.iconBtn}>
            <Ionicons name="close" size={24} color={COLORS.textMain} />
          </TouchableOpacity>
        </View>

        {/* 2. Step Indicator */}
        <StepIndicator step={step} />

        {(!post) ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={COLORS.primary} />
          </View>
        ) : (
          <>
            <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
              
              {/* STEP 1: REVIEW CONTRACT & AUTHORIZE */}
              {step === 1 && (
                <>
                  {/* Info Banner */}
                  <View style={styles.infoBanner}>
                    <Ionicons name="shield-checkmark-outline" size={24} color={COLORS.infoText} style={{ marginRight: 10 }} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.infoTitle}>Ủy quyền ký tự động</Text>
                      <Text style={styles.infoDesc}>
                        Bằng việc xác nhận, bạn ủy quyền cho nền tảng <Text style={{fontWeight: '700'}}>tự động tạo hợp đồng điện tử</Text> với Chủ hàng (Owner) khi chuyến đi được chấp nhận.
                      </Text>
                    </View>
                  </View>

                  {/* Contract Paper View */}
                  <View style={styles.contractContainer}>
                    <View style={styles.contractHeader}>
                      <MaterialCommunityIcons name="file-document-outline" size={22} color={COLORS.primary} />
                      <Text style={styles.contractName}>
                        {contractTemplate?.contractTemplateName ?? 'HỢP ĐỒNG VẬN TẢI'}
                      </Text>
                    </View>
                    <View style={styles.divider} />
                    
                    {/* Content */}
                    <View style={{ minHeight: 200 }}>
                      {contractTemplate?.htmlContent && WebView ? (
                        <View style={{ height: 300 }}>
                          <WebView 
                            originWhitelist={["*"]} 
                            source={{ html: contractTemplate.htmlContent }} 
                            style={{ backgroundColor: 'transparent' }}
                          />
                        </View>
                      ) : (
                        <View>
                          {contractTemplate?.contractTerms ? (
                            contractTemplate.contractTerms.map((t: any, i: number) => (
                              <View key={i} style={{ marginBottom: 12 }}>
                                <Text style={styles.termTitle}>Điều {i + 1}:</Text>
                                <Text style={styles.termContent}>{t.content}</Text>
                              </View>
                            ))
                          ) : (
                            <Text style={{ textAlign: 'center', color: COLORS.textSec, fontStyle: 'italic', marginTop: 20 }}>
                              {contractTemplate?.fileUrl ? 'Nội dung hợp đồng nằm trong file đính kèm.' : 'Đang tải điều khoản...'}
                            </Text>
                          )}
                          
                          {contractTemplate?.fileUrl && (
                            <TouchableOpacity style={styles.externalLinkBtn} onPress={openContractExternally}>
                              <Text style={styles.externalLinkText}>Xem file hợp đồng đầy đủ</Text>
                              <Ionicons name="open-outline" size={16} color={COLORS.primary} />
                            </TouchableOpacity>
                          )}
                        </View>
                      )}
                    </View>
                  </View>
                  <View style={{height: 100}} /> 
                </>
              )}

              {/* STEP 2: PAYMENT INVOICE */}
              {step === 2 && (
                <View style={styles.invoiceContainer}>
                  <View style={styles.invoiceHeader}>
                    <Text style={styles.invoiceTitle}>HÓA ĐƠN ĐĂNG BÀI</Text>
                    <Text style={styles.invoiceDate}>{new Date().toLocaleDateString('vi-VN')}</Text>
                  </View>
                  
                  {/* <View style={styles.invoiceRow}>
                    <Text style={styles.invoiceLabel}>Mã bài đăng</Text>
                    <Text style={styles.invoiceValue}>{post.packageCode || '---'}</Text>
                  </View> */}
                  <View style={styles.invoiceRow}>
                    <Text style={styles.invoiceLabel}>Dịch vụ</Text>
                    <Text style={styles.invoiceValue}>Tìm xe vận chuyển</Text>
                  </View>
                  
                  <View style={styles.dividerDashed} />
                  
                  <View style={styles.invoiceRow}>
                    <Text style={styles.invoiceLabelTotal}>TỔNG CỘNG</Text>
                    <Text style={styles.invoiceValueTotal}>{formatVND(post.offeredPrice || 0)} đ</Text>
                  </View>

                  {/* Wallet Check Section */}
                  <View style={styles.walletBox}>
                    <View style={styles.walletRow}>
                      <View style={{flexDirection: 'row', alignItems: 'center'}}>
                        <Ionicons name="wallet-outline" size={20} color={COLORS.textSec} />
                        <Text style={styles.walletLabel}>Số dư ví hiện tại:</Text>
                      </View>
                      <Text style={styles.walletBalance}>
                        {wallet ? formatVND(Number(wallet.balance ?? wallet.Balance ?? 0)) : '---'} đ
                      </Text>
                    </View>

                    {sufficientBalance === false && (
                      <View style={styles.warningBox}>
                        <Ionicons name="alert-circle" size={20} color={COLORS.warningText} />
                        <Text style={styles.warningText}>Số dư không đủ. Vui lòng nạp thêm.</Text>
                      </View>
                    )}
                    {sufficientBalance === true && (
                      <View style={styles.successBox}>
                        <Ionicons name="checkmark-circle" size={20} color={COLORS.success} />
                        <Text style={styles.successText}>Số dư hợp lệ để thanh toán.</Text>
                      </View>
                    )}
                  </View>
                </View>
              )}

            </ScrollView>

            {/* STICKY FOOTER ACTION */}
            <View style={styles.footer}>
              {step === 1 && (
                <View>
                  <TouchableOpacity 
                    style={styles.checkboxContainer} 
                    activeOpacity={0.8}
                    onPress={() => setAcceptedTerms(!acceptedTerms)}
                  >
                    <View style={[styles.checkbox, acceptedTerms && styles.checkboxChecked]}>
                      {acceptedTerms && <Ionicons name="checkmark" size={14} color={COLORS.white} />}
                    </View>
                    <Text style={styles.checkboxText}>
                      Tôi đã đọc và đồng ý với điều khoản hợp đồng.
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity 
                    style={[styles.btnPrimary, (!acceptedTerms || loading) && styles.btnDisabled]} 
                    onPress={handleSign}
                    disabled={loading || !acceptedTerms}
                  >
                    {loading ? <ActivityIndicator color={COLORS.white} /> : <Text style={styles.btnText}>ĐỒNG Ý & TIẾP TỤC</Text>}
                  </TouchableOpacity>
                </View>
              )}

              {step === 2 && (
                <TouchableOpacity 
                  style={[styles.btnPrimary, (paymentLoading || sufficientBalance === false) && styles.btnDisabled]} 
                  onPress={handlePayment}
                  disabled={paymentLoading || sufficientBalance === false}
                >
                  {paymentLoading ? <ActivityIndicator color={COLORS.white} /> : <Text style={styles.btnText}>XÁC NHẬN THANH TOÁN</Text>}
                </TouchableOpacity>
              )}
            </View>
          </>
        )}
      </SafeAreaView>
    </Modal>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  
  // Header
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 12, backgroundColor: COLORS.white,
    borderBottomWidth: 1, borderColor: COLORS.border
  },
  headerTitle: { fontSize: 17, fontWeight: '700', color: COLORS.textMain },
  iconBtn: { padding: 4 },

  // Scroll Content
  scrollContent: { padding: 16, paddingBottom: 100 },

  // Step Indicator
  stepContainer: { backgroundColor: COLORS.white, paddingVertical: 16, paddingBottom: 12, borderBottomWidth: 1, borderColor: COLORS.border },
  stepWrapper: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', paddingHorizontal: 40, position: 'relative' },
  stepLineBase: { position: 'absolute', top: 12, left: 60, right: 60, height: 2, backgroundColor: '#E5E7EB', zIndex: -1 },
  stepLineActive: { position: 'absolute', top: 12, left: 60, height: 2, backgroundColor: COLORS.primary, zIndex: -1 },
  stepItem: { alignItems: 'center', backgroundColor: COLORS.white, paddingHorizontal: 4 },
  stepCircle: { width: 26, height: 26, borderRadius: 13, backgroundColor: '#E5E7EB', justifyContent: 'center', alignItems: 'center', marginBottom: 4 },
  stepCircleActive: { backgroundColor: COLORS.primary },
  stepNum: { fontSize: 12, fontWeight: '700', color: COLORS.textSec },
  stepText: { fontSize: 12, color: COLORS.textSec, fontWeight: '500' },
  stepTextActive: { color: COLORS.primary, fontWeight: '700' },

  // Info Banner
  infoBanner: {
    flexDirection: 'row', backgroundColor: COLORS.infoBg, padding: 12,
    borderRadius: 8, borderWidth: 1, borderColor: '#BAE6FD', marginBottom: 16, alignItems: 'flex-start'
  },
  infoTitle: { fontSize: 14, fontWeight: '700', color: COLORS.infoText, marginBottom: 2 },
  infoDesc: { fontSize: 13, color: '#0C4A6E', lineHeight: 18 },

  // Contract Style
  contractContainer: {
    backgroundColor: COLORS.white, borderRadius: 12, padding: 16,
    borderWidth: 1, borderColor: COLORS.border, shadowColor: '#000',
    shadowOpacity: 0.05, shadowRadius: 4, elevation: 1
  },
  contractHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  contractName: { fontSize: 15, fontWeight: '700', color: COLORS.textMain, marginLeft: 8, flex: 1, textTransform: 'uppercase' },
  divider: { height: 1, backgroundColor: COLORS.border, marginVertical: 12 },
  termTitle: { fontSize: 14, fontWeight: '700', color: COLORS.textMain, marginTop: 4 },
  termContent: { fontSize: 14, color: '#374151', lineHeight: 22, textAlign: 'justify' },
  externalLinkBtn: { flexDirection: 'row', alignItems: 'center', marginTop: 12, alignSelf: 'center' },
  externalLinkText: { color: COLORS.primary, fontWeight: '600', marginRight: 4 },

  // Invoice Style
  invoiceContainer: {
    backgroundColor: COLORS.white, borderRadius: 12, padding: 20,
    borderWidth: 1, borderColor: COLORS.border,
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, elevation: 2, marginBottom: 20
  },
  invoiceHeader: { alignItems: 'center', marginBottom: 20 },
  invoiceTitle: { fontSize: 18, fontWeight: '800', color: COLORS.textMain, letterSpacing: 1 },
  invoiceDate: { fontSize: 13, color: COLORS.textSec, marginTop: 4 },
  invoiceRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  invoiceLabel: { fontSize: 14, color: COLORS.textSec },
  invoiceValue: { fontSize: 14, fontWeight: '600', color: COLORS.textMain },
  dividerDashed: { height: 1, borderWidth: 1, borderColor: '#D1D5DB', borderStyle: 'dashed', borderRadius: 1, marginVertical: 16 },
  invoiceLabelTotal: { fontSize: 16, fontWeight: '700', color: COLORS.textMain },
  invoiceValueTotal: { fontSize: 20, fontWeight: '800', color: COLORS.primary },

  // Wallet Box
  walletBox: { marginTop: 24, backgroundColor: '#F9FAFB', padding: 12, borderRadius: 8 },
  walletRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  walletLabel: { fontSize: 13, color: COLORS.textSec, marginLeft: 6 },
  walletBalance: { fontSize: 14, fontWeight: '700', color: COLORS.textMain },
  warningBox: { flexDirection: 'row', alignItems: 'center', marginTop: 8, backgroundColor: COLORS.warningBg, padding: 8, borderRadius: 6 },
  warningText: { fontSize: 12, color: COLORS.warningText, marginLeft: 6, fontWeight: '500' },
  successBox: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
  successText: { fontSize: 12, color: COLORS.success, marginLeft: 6, fontWeight: '500' },

  // Sticky Footer
  footer: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: COLORS.white, padding: 16,
    borderTopWidth: 1, borderColor: COLORS.border,
    shadowColor: '#000', shadowOffset: { width: 0, height: -3 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 10
  },
  checkboxContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  checkbox: { width: 20, height: 20, borderRadius: 4, borderWidth: 2, borderColor: COLORS.textSec, marginRight: 10, justifyContent: 'center', alignItems: 'center' },
  checkboxChecked: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  checkboxText: { flex: 1, fontSize: 13, color: COLORS.textMain },
  btnPrimary: {
    backgroundColor: COLORS.primary, paddingVertical: 14, borderRadius: 8,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, elevation: 3
  },
  btnDisabled: { backgroundColor: '#9CA3AF', shadowOpacity: 0 },
  btnText: { color: COLORS.white, fontWeight: '700', fontSize: 15, textTransform: 'uppercase' }
})

export default InlinePostSignModal