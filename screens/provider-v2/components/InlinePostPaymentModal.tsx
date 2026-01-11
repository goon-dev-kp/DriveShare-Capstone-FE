import React, { useEffect, useState } from 'react'
import {
  Modal,

  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Dimensions,
  StatusBar
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { router } from 'expo-router'
import postPackageService from '@/services/postPackageService'
import walletService from '@/services/walletService'
import { formatVND } from '@/utils/currency'

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
  success: '#10B981',
  warningBg: '#FEF3C7',
  warningText: '#B45309',
  danger: '#EF4444' // Added danger color
}

const { width } = Dimensions.get('window')

// --- STEP INDICATOR COMPONENT ---
const StepIndicator: React.FC<{ step: number }> = ({ step }) => (
  <View style={styles.stepContainer}>
    <View style={styles.stepWrapper}>
      {/* Line connecting steps */}
      <View style={styles.stepLineBase} />
      <View style={[styles.stepLineActive, { width: step === 2 ? '100%' : '0%' }]} />
      
      {/* Step 1: Payment */}
      <View style={styles.stepItem}>
        <View style={[styles.stepCircle, step >= 1 && styles.stepCircleActive]}>
          {step > 1 ? <Ionicons name="checkmark" size={14} color="#fff" /> : <Text style={styles.stepNum}>1</Text>}
        </View>
        <Text style={[styles.stepText, step >= 1 && styles.stepTextActive]}>Thanh toán</Text>
      </View>

      {/* Step 2: Success */}
      <View style={styles.stepItem}>
        <View style={[styles.stepCircle, step >= 2 && styles.stepCircleActive]}>
          <Text style={[styles.stepNum, step >= 2 && {color: '#fff'}]}>2</Text>
        </View>
        <Text style={[styles.stepText, step >= 2 && styles.stepTextActive]}>Hoàn thành</Text>
      </View>
    </View>
  </View>
)

const InlinePostPaymentModal: React.FC<Props> = ({ visible, postId, onClose, onDone }) => {
  const [step, setStep] = useState<number>(1) // 1=payment, 2=success
  const [post, setPost] = useState<any>(null)
  const [wallet, setWallet] = useState<any | null>(null)
  const [sufficientBalance, setSufficientBalance] = useState<boolean | null>(null)
  const [paymentLoading, setPaymentLoading] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (visible && postId) {
      fetchDetails()
      setStep(1)
      setWallet(null)
      setSufficientBalance(null)
    }
  }, [visible, postId])

  const fetchDetails = async () => {
    setLoading(true)
    try {
      // Fetch post details
      const res: any = await postPackageService.getPostPackageDetails(postId!)
      const postData = res?.result ?? res
      setPost(postData)
      
      // Fetch wallet & check balance
      const w: any = await walletService.getMyWallet()
      const myw = w?.result ?? w
      setWallet(myw)
      
      const balance = Number(myw?.balance ?? myw?.Balance ?? 0) || 0
      const amount = Number(postData?.offeredPrice ?? 0) || 0
      setSufficientBalance(balance >= amount)
    } catch (e) { 
      console.warn(e)
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
      
      // Move to success step
      setStep(2)
    } catch (err: any) {
      alert('Lỗi: ' + (err?.message || 'Không thể thanh toán'))
    } finally {
      setPaymentLoading(false)
    }
  }

  const handleComplete = () => {
    onDone?.()
    onClose()
  }

  const handleBack = () => {
    if (step > 1) setStep(step - 1)
    else onClose()
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
            {step === 1 ? 'Thanh Toán Phí' : 'Hoàn Thành'}
          </Text>
          <TouchableOpacity onPress={onClose} style={styles.iconBtn}>
            <Ionicons name="close" size={24} color={COLORS.textMain} />
          </TouchableOpacity>
        </View>

        {/* 2. Step Indicator */}
        <StepIndicator step={step} />

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={COLORS.primary} />
          </View>
        ) : (
          <>
            <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
              
              {/* STEP 1: PAYMENT INVOICE */}
              {step === 1 && post && (
                <View style={styles.invoiceContainer}>
                  <View style={styles.invoiceHeader}>
                    <Text style={styles.invoiceTitle}>HÓA ĐƠN ĐĂNG BÀI</Text>
                    <Text style={styles.invoiceDate}>{new Date().toLocaleDateString('vi-VN')}</Text>
                  </View>
                  
                  <View style={styles.invoiceRow}>
                    <Text style={styles.invoiceLabel}>Mã bài đăng</Text>
                    <Text style={styles.invoiceValue}>{post.packageCode || '---'}</Text>
                  </View>
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
                      <>
                        <View style={styles.warningBox}>
                          <Ionicons name="alert-circle" size={20} color={COLORS.warningText} />
                          <Text style={styles.warningText}>Số dư không đủ. Vui lòng nạp thêm.</Text>
                        </View>
                        <TouchableOpacity 
                          style={styles.topupBtn}
                          onPress={() => {
                            const needed = Number(post?.offeredPrice ?? 0) - Number(wallet?.balance ?? wallet?.Balance ?? 0)
                            onClose() // Close modal first
                            setTimeout(() => {
                              router.push(`/(wallet)/wallet-operations?amount=${Math.max(0, Math.ceil(needed))}`)
                            }, 300)
                          }}
                        >
                          <Ionicons name="wallet" size={18} color={COLORS.primary} />
                          <Text style={styles.topupBtnText}>Đi tới trang nạp tiền</Text>
                          <Ionicons name="arrow-forward" size={16} color={COLORS.primary} />
                        </TouchableOpacity>
                      </>
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

              {/* STEP 2: SUCCESS CONFIRMATION */}
              {step === 2 && (
                <View style={styles.successContainer}>
                  <View style={styles.successIcon}>
                    <Ionicons name="checkmark-circle" size={80} color={COLORS.success} />
                  </View>
                  <Text style={styles.successTitle}>Thanh toán thành công!</Text>
                  <Text style={styles.successMessage}>
                    Bài đăng của bạn đã được kích hoạt và sẵn sàng để các tài xế nhận chuyến.
                  </Text>
                  <View style={styles.successInfo}>
                    <View style={styles.successInfoRow}>
                      <Text style={styles.successInfoLabel}>Mã bài đăng:</Text>
                      <Text style={styles.successInfoValue}>{post?.packageCode}</Text>
                    </View>
                    <View style={styles.successInfoRow}>
                      <Text style={styles.successInfoLabel}>Trạng thái:</Text>
                      <Text style={[styles.successInfoValue, { color: COLORS.success }]}>OPEN</Text>
                    </View>
                  </View>
                </View>
              )}

            </ScrollView>

            {/* STICKY FOOTER ACTION */}
            <View style={styles.footer}>
              {step === 1 && (
                <TouchableOpacity 
                  style={[styles.btnPrimary, (paymentLoading || sufficientBalance === false) && styles.btnDisabled]} 
                  onPress={handlePayment}
                  disabled={paymentLoading || sufficientBalance === false}
                >
                  {paymentLoading ? <ActivityIndicator color={COLORS.white} /> : <Text style={styles.btnText}>XÁC NHẬN THANH TOÁN</Text>}
                </TouchableOpacity>
              )}

              {step === 2 && (
                <TouchableOpacity 
                  style={styles.btnPrimary} 
                  onPress={handleComplete}
                >
                  <Text style={styles.btnText}>HOÀN TẤT</Text>
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
  topupBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: '#E0F2FE',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.primary,
    gap: 6
  },
  topupBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.primary,
    flex: 1,
    textAlign: 'center'
  },
  successBox: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
  successText: { fontSize: 12, color: COLORS.success, marginLeft: 6, fontWeight: '500' },

  // Success Confirmation
  successContainer: {
    alignItems: 'center',
    padding: 24,
    backgroundColor: COLORS.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  successIcon: {
    marginBottom: 24,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.textMain,
    marginBottom: 12,
    textAlign: 'center',
  },
  successMessage: {
    fontSize: 15,
    color: COLORS.textSec,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
    paddingHorizontal: 16,
  },
  successInfo: {
    width: '100%',
    backgroundColor: '#F9FAFB',
    padding: 16,
    borderRadius: 8,
  },
  successInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  successInfoLabel: {
    fontSize: 14,
    color: COLORS.textSec,
  },
  successInfoValue: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textMain,
  },

  // Sticky Footer
  footer: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: COLORS.white, padding: 16,
    borderTopWidth: 1, borderColor: COLORS.border,
    shadowColor: '#000', shadowOffset: { width: 0, height: -3 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 10
  },
  btnPrimary: {
    backgroundColor: COLORS.primary, paddingVertical: 14, borderRadius: 8,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, elevation: 3
  },
  btnDisabled: { backgroundColor: '#9CA3AF', shadowOpacity: 0 },
  btnText: { color: COLORS.white, fontWeight: '700', fontSize: 15, textTransform: 'uppercase' }
})

export default InlinePostPaymentModal