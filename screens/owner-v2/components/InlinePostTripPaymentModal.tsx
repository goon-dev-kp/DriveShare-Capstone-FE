import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  Modal,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  SafeAreaView,
  StatusBar,
} from 'react-native'
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import postTripService from '@/services/postTripService'
import walletService from '@/services/walletService'
import { formatVND } from '@/utils/currency'

interface InlinePostTripPaymentModalProps {
  visible: boolean
  postId?: string
  onClose: () => void
  onDone: () => void
}

const COLORS = {
  primary: '#4F46E5',
  success: '#10B981',
  warning: '#F59E0B',
  white: '#FFFFFF',
  textMain: '#111827',
  textSec: '#6B7280',
}

const InlinePostTripPaymentModal: React.FC<InlinePostTripPaymentModalProps> = ({
  visible,
  postId,
  onClose,
  onDone,
}) => {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [postDetail, setPostDetail] = useState<any | null>(null)
  const [wallet, setWallet] = useState<any | null>(null)
  const [sufficientBalance, setSufficientBalance] = useState<boolean | null>(null)
  const [paying, setPaying] = useState(false)
  const [alertVisible, setAlertVisible] = useState(false)
  const [alertConfig, setAlertConfig] = useState({ title: '', message: '' })

  useEffect(() => {
    if (visible && postId) {
      fetchData()
    } else {
      reset()
    }
  }, [visible, postId])

  const reset = () => {
    setPostDetail(null)
    setWallet(null)
    setSufficientBalance(null)
    setLoading(false)
    setPaying(false)
    setAlertVisible(false)
  }

  const fetchData = async () => {
    setLoading(true)
    try {
      // Fetch post detail
      const postResp: any = await postTripService.getById(postId!)
      const post = postResp?.result ?? postResp
      setPostDetail(post)

      // Fetch wallet
      const walletResp: any = await walletService.getMyWallet()
      const myWallet = walletResp?.result ?? walletResp
      setWallet(myWallet)

      // Calculate total amount (KHÔNG bao gồm deposit - driver trả)
      const details = post?.postTripDetails || []
      let total = 0
      details.forEach((d: any) => {
        const count = d.requiredCount || 0
        const price = d.pricePerPerson || 0
        const bonus = d.bonusAmount || 0
        total += count * (price + bonus)
      })

      const balance = Number(myWallet?.balance ?? myWallet?.Balance ?? 0)
      setSufficientBalance(balance >= total)
    } catch (e: any) {
      setAlertConfig({ title: 'Lỗi', message: e?.message || 'Không thể tải thông tin' })
      setAlertVisible(true)
    } finally {
      setLoading(false)
    }
  }

  const handlePayment = async () => {
    if (!postId) return

    setPaying(true)
    try {
      // Calculate total amount
      const details = postDetail?.postTripDetails || []
      let total = 0
      details.forEach((d: any) => {
        const count = d.requiredCount || 0
        const price = d.pricePerPerson || 0
        const bonus = d.bonusAmount || 0
        total += count * (price + bonus)
      })

      // Create payment
      const paymentDto = {
        amount: total,
        type: 'POST_PAYMENT',
        tripId: null,
        postId: postId,
        description: `Thanh toán phí đăng bài tìm tài xế`,
      }

      const payResp: any = await walletService.createPayment(paymentDto)
      const ok = payResp?.isSuccess ?? payResp?.statusCode === 200

      if (!ok) throw new Error(payResp?.message || 'Thanh toán thất bại')

      // Update status to OPEN
      await postTripService.updateStatus(postId, 'OPEN')

      setAlertConfig({ 
        title: 'Thanh toán thành công', 
        message: 'Bài đăng của bạn đã được kích hoạt và sẵn sàng để tài xế nhận việc!' 
      })
      setAlertVisible(true)
    } catch (e: any) {
      setAlertConfig({ title: 'Lỗi thanh toán', message: e?.message || 'Không thể thanh toán' })
      setAlertVisible(true)
    } finally {
      setPaying(false)
    }
  }

  const calculateTotal = () => {
    if (!postDetail) return 0
    const details = postDetail?.postTripDetails || []
    let total = 0
    details.forEach((d: any) => {
      const count = d.requiredCount || 0
      const price = d.pricePerPerson || 0
      const bonus = d.bonusAmount || 0
      total += count * (price + bonus)
    })
    return total
  }

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#fff" />

        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.iconBtn}>
            <Ionicons name="close" size={24} color={COLORS.textMain} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Thanh Toán</Text>
          <View style={{ width: 24 }} />
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.loadingText}>Đang tải thông tin...</Text>
          </View>
        ) : (
          <>
            <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
              {/* Invoice Card */}
              <View style={styles.invoiceCard}>
                <Text style={styles.invoiceTitle}>HÓA ĐƠN ĐĂNG BÀI</Text>

                <View style={styles.invoiceRow}>
                  <Text style={styles.invLabel}>Dịch vụ:</Text>
                  <Text style={styles.invValue}>Tìm tài xế vận chuyển</Text>
                </View>

                <View style={styles.invoiceRow}>
                  <Text style={styles.invLabel}>Bài đăng:</Text>
                  <Text style={styles.invValue}>{postDetail?.title || 'N/A'}</Text>
                </View>

                <View style={styles.invoiceRow}>
                  <Text style={styles.invLabel}>Tổng phí tài xế:</Text>
                  <Text style={styles.invValue}>{formatVND(calculateTotal().toString())} đ</Text>
                </View>

                <View style={styles.dividerDashed} />

                <View style={styles.invoiceRow}>
                  <Text style={styles.invTotalLabel}>TỔNG CỘNG</Text>
                  <Text style={styles.invTotalValue}>{formatVND(calculateTotal().toString())} đ</Text>
                </View>

                {/* Wallet Info */}
                <View style={styles.walletInfo}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <Text style={{ color: COLORS.textSec }}>Số dư ví:</Text>
                    <Text style={{ fontWeight: '700' }}>
                      {wallet ? formatVND(Number(wallet.balance ?? wallet.Balance ?? 0).toString()) : '---'} đ
                    </Text>
                  </View>

                  {sufficientBalance === false && (
                    <View>
                      <View style={styles.balanceWarning}>
                        <Ionicons name="alert-circle" size={16} color={COLORS.warning} />
                        <Text style={{ color: COLORS.warning, marginLeft: 4, fontSize: 13 }}>
                          Số dư không đủ. Vui lòng nạp thêm.
                        </Text>
                      </View>
                      <TouchableOpacity
                        style={styles.topupButton}
                        onPress={() => {
                          const amountNeeded = calculateTotal()
                          const currentBalance = Number(wallet?.balance ?? wallet?.Balance ?? 0) || 0
                          const deficit = Math.max(0, amountNeeded - currentBalance)
                          // Đóng modal trước
                          onClose()
                          // Navigate đến wallet operations
                          setTimeout(() => {
                            router.push(`/(wallet)/wallet-operations?amount=${deficit}`)
                          }, 300)
                        }}
                      >
                        <MaterialCommunityIcons name="wallet-plus" size={20} color="#fff" />
                        <Text style={styles.topupButtonText}>Nạp tiền ngay</Text>
                      </TouchableOpacity>
                    </View>
                  )}

                  {sufficientBalance === true && (
                    <Text style={{ color: COLORS.success, fontSize: 13, marginTop: 4 }}>
                      ✓ Số dư hợp lệ
                    </Text>
                  )}
                </View>
              </View>
            </ScrollView>

            {/* Footer */}
            <View style={styles.footer}>
              <TouchableOpacity style={styles.btnSec} onPress={onClose}>
                <Text style={styles.btnSecText}>Hủy</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.btnPri, (paying || sufficientBalance === false) && styles.btnDisabled]}
                onPress={handlePayment}
                disabled={paying || sufficientBalance === false}
              >
                {paying ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.btnPriText}>Thanh toán</Text>
                )}
              </TouchableOpacity>
            </View>
          </>
        )}

        {/* Custom Alert Modal */}
        <Modal visible={alertVisible} transparent animationType="fade">
          <View style={styles.alertOverlay}>
            <View style={styles.alertBox}>
              <Text style={styles.alertTitle}>{alertConfig.title}</Text>
              <Text style={styles.alertMessage}>{alertConfig.message}</Text>
              <TouchableOpacity
                style={styles.alertButton}
                onPress={() => {
                  setAlertVisible(false)
                  if (alertConfig.title === 'Thanh toán thành công') {
                    onDone()
                    onClose()
                  }
                }}
              >
                <Text style={styles.alertButtonText}>OK</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    </Modal>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.white },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderColor: '#eee',
  },
  headerTitle: { fontSize: 18, fontWeight: '700', color: COLORS.textMain },
  iconBtn: { padding: 4 },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: { color: COLORS.textSec },
  scrollView: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 100 },
  invoiceCard: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#eee',
    elevation: 2,
  },
  invoiceTitle: {
    fontSize: 18,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 20,
  },
  invoiceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  invLabel: { color: COLORS.textSec },
  invValue: { fontWeight: '600', textAlign: 'right', flex: 1, marginLeft: 8 },
  dividerDashed: {
    height: 1,
    borderWidth: 1,
    borderColor: '#ccc',
    borderStyle: 'dashed',
    marginVertical: 16,
  },
  invTotalLabel: { fontSize: 16, fontWeight: '700' },
  invTotalValue: { fontSize: 18, fontWeight: '800', color: COLORS.primary },
  walletInfo: {
    marginTop: 20,
    padding: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
  },
  balanceWarning: { flexDirection: 'row', alignItems: 'center', marginTop: 6 },
  topupButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.warning,
    padding: 12,
    borderRadius: 8,
    marginTop: 12,
    gap: 6,
  },
  topupButtonText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  footer: {
    flexDirection: 'row',
    padding: 16,
    borderTopWidth: 1,
    borderColor: '#eee',
    backgroundColor: '#fff',
    gap: 12,
  },
  btnPri: {
    flex: 1,
    backgroundColor: COLORS.primary,
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  btnPriText: { color: '#fff', fontWeight: '700' },
  btnSec: {
    flex: 1,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  btnSecText: { color: COLORS.textMain, fontWeight: '600' },
  btnDisabled: { backgroundColor: '#9CA3AF', borderColor: '#9CA3AF' },
  alertOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  alertBox: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  alertTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.textMain,
    marginBottom: 12,
    textAlign: 'center',
  },
  alertMessage: {
    fontSize: 14,
    color: COLORS.textSec,
    marginBottom: 20,
    textAlign: 'center',
    lineHeight: 20,
  },
  alertButton: {
    backgroundColor: COLORS.primary,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  alertButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
})

export default InlinePostTripPaymentModal
