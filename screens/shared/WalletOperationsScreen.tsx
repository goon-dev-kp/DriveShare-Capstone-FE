import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  StyleSheet,
  ScrollView,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  Image,
  Modal
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons'
import walletService from '@/services/walletService'
import { formatVND } from '@/utils/currency'

const COLORS = {
  primary: '#0284C7',
  background: '#F3F4F6',
  white: '#FFFFFF',
  textMain: '#111827',
  textSec: '#6B7280',
  border: '#E5E7EB',
  success: '#10B981',
  danger: '#EF4444',
  warning: '#F59E0B',
  infoBg: '#E0F2FE',
  infoText: '#0369A1'
}

interface Props {
  onBack?: () => void
  prefilledAmount?: string
}

export default function WalletOperationsScreen({ onBack, prefilledAmount = '' }: Props) {
  const [activeTab, setActiveTab] = useState<'topup' | 'withdraw'>('topup')
  const [wallet, setWallet] = useState<any>(null)
  const [loadingWallet, setLoadingWallet] = useState(false)
  const [amountInput, setAmountInput] = useState(prefilledAmount)
  const [description, setDescription] = useState('')
  const [processing, setProcessing] = useState(false)
  const [toast, setToast] = useState<{ visible: boolean; type: 'success' | 'error'; message: string }>({ visible: false, type: 'success', message: '' })
  const [qrModal, setQrModal] = useState<{ visible: boolean; qrUrl: string; amount: number; transferContent: string; transactionId: string } | null>(null)
  const [confirmDialog, setConfirmDialog] = useState<{ visible: boolean; title: string; message: string; onConfirm: () => void } | null>(null)

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ visible: true, type, message })
    setTimeout(() => setToast(t => ({ ...t, visible: false })), 3000)
  }

  useEffect(() => {
    fetchWallet()
  }, [])

  useEffect(() => {
    if (prefilledAmount) {
      setAmountInput(prefilledAmount)
    }
  }, [prefilledAmount])

  const fetchWallet = async () => {
    setLoadingWallet(true)
    try {
      const res: any = await walletService.getMyWallet()
      const walletData = res?.result ?? res
      setWallet(walletData)
    } catch (e) {
      console.warn(e)
    } finally {
      setLoadingWallet(false)
    }
  }

  const handleTopup = async () => {
    const amount = Math.floor(Number(amountInput || '0'))
    if (!amount || amount <= 0) {
      showToast('error', 'Vui lòng nhập số tiền hợp lệ.')
      return
    }
    if (amount < 10000) {
      showToast('error', 'Số tiền nạp tối thiểu là 10,000 VND.')
      return
    }

    setProcessing(true)
    try {
      const desc = description.trim() || 'Nạp tiền qua ứng dụng'
      const res: any = await walletService.createTopup(amount, desc)
      const ok = res?.isSuccess ?? res?.statusCode === 200
      
      if (!ok) {
        const errorMsg = res?.message || 'Nạp tiền thất bại'
        showToast('error', errorMsg)
        await fetchWallet()
        return
      }
      
      // Success: Show QR modal with transaction details
      const result = res.result
      setQrModal({
        visible: true,
        qrUrl: result.qrUrl,
        amount: result.amount,
        transferContent: result.transferContent,
        transactionId: result.transactionId
      })
      
      // Clear form
      setAmountInput('')
      setDescription('')
    } catch (err: any) {
      const errorMsg = err?.message || err?.response?.data?.message || 'Không thể nạp tiền'
      showToast('error', errorMsg)
      await fetchWallet()
    } finally {
      setProcessing(false)
    }
  }

  const handleWithdraw = async () => {
    const amount = Math.floor(Number(amountInput || '0'))
    const balance = Number(wallet?.balance ?? wallet?.Balance ?? 0)
    
    if (!amount || amount <= 0) {
      showToast('error', 'Vui lòng nhập số tiền hợp lệ.')
      return
    }
    if (amount < 10000) {
      showToast('error', 'Số tiền rút tối thiểu là 10,000 VND.')
      return
    }
    if (amount > balance) {
      showToast('error', 'Số dư không đủ để thực hiện giao dịch.')
      return
    }

    // Show confirmation dialog
    setConfirmDialog({
      visible: true,
      title: 'Xác nhận rút tiền',
      message: `Bạn muốn rút ${formatVND(amount)} VND từ ví?`,
      onConfirm: () => {
        setConfirmDialog(null)
        processWithdraw(amount)
      }
    })
  }

  const processWithdraw = async (amount: number) => {
    setProcessing(true)
    try {
      const desc = description.trim() || 'Rút tiền qua ứng dụng'
      const res: any = await walletService.requestWithdrawal(amount, desc)
      
      // Check response success
      const ok = res?.isSuccess ?? res?.statusCode === 200
      if (!ok) {
        const errorMsg = res?.message || 'Yêu cầu rút tiền thất bại'
        throw new Error(errorMsg)
      }
      
      // Success: Rút tiền thành công (backend đã trừ tiền ngay)
      showToast('success', `Rút ${formatVND(amount)} thành công! Tiền sẽ được chuyển về tài khoản.`)
      setAmountInput('')
      setDescription('')
      await fetchWallet()
    } catch (err: any) {
      const errorMessage = err?.message || err?.response?.data?.message || 'Không thể rút tiền'
      showToast('error', errorMessage)
    } finally {
      setProcessing(false)
    }
  }

  const closeQrModal = async () => {
    setQrModal(null)
    await fetchWallet()
  }

  const quickAmounts = [50000, 100000, 200000, 500000, 1000000]

  const renderQuickButtons = () => (
    <View style={styles.quickButtonsContainer}>
      <Text style={styles.quickLabel}>Chọn nhanh:</Text>
      <View style={styles.quickButtons}>
        {quickAmounts.map((amt) => (
          <TouchableOpacity
            key={amt}
            style={[
              styles.quickBtn,
              Number(amountInput) === amt && styles.quickBtnActive
            ]}
            onPress={() => setAmountInput(String(amt))}
          >
            <Text style={[
              styles.quickBtnText,
              Number(amountInput) === amt && styles.quickBtnTextActive
            ]}>
              {formatVND(amt)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  )

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={onBack} 
          style={styles.backBtn}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={24} color={COLORS.textMain} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Quản Lý Ví</Text>
        <View style={styles.headerRight} />
      </View>

      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          
          {/* Wallet Balance Card */}
          <View style={styles.balanceCard}>
            <View style={styles.balanceHeader}>
              <Ionicons name="wallet" size={24} color={COLORS.primary} />
              <Text style={styles.balanceLabel}>Số dư hiện tại</Text>
            </View>
            {loadingWallet ? (
              <ActivityIndicator color={COLORS.primary} style={{ marginTop: 8 }} />
            ) : (
              <Text style={styles.balanceAmount}>
                {wallet ? formatVND(Number(wallet.balance ?? wallet.Balance ?? 0)) : '---'} đ
              </Text>
            )}
            <TouchableOpacity onPress={fetchWallet} style={styles.refreshBtn}>
              <Ionicons name="refresh" size={16} color={COLORS.primary} />
              <Text style={styles.refreshText}>Làm mới</Text>
            </TouchableOpacity>
          </View>

          {/* Tabs */}
          <View style={styles.tabContainer}>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'topup' && styles.activeTab]}
              onPress={() => setActiveTab('topup')}
            >
              <MaterialCommunityIcons 
                name="plus-circle" 
                size={20} 
                color={activeTab === 'topup' ? COLORS.primary : COLORS.textSec} 
              />
              <Text style={[styles.tabText, activeTab === 'topup' && styles.activeTabText]}>
                Nạp tiền
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.tab, activeTab === 'withdraw' && styles.activeTab]}
              onPress={() => setActiveTab('withdraw')}
            >
              <MaterialCommunityIcons 
                name="minus-circle" 
                size={20} 
                color={activeTab === 'withdraw' ? COLORS.danger : COLORS.textSec} 
              />
              <Text style={[styles.tabText, activeTab === 'withdraw' && styles.activeTabText]}>
                Rút tiền
              </Text>
            </TouchableOpacity>
          </View>

          {/* Form Container */}
          <View style={styles.formContainer}>
            {/* Info Banner */}
            <View style={[styles.infoBanner, activeTab === 'withdraw' && { backgroundColor: '#FEE2E2', borderColor: '#FECACA' }]}>
              <Ionicons 
                name={activeTab === 'topup' ? 'information-circle' : 'alert-circle'} 
                size={20} 
                color={activeTab === 'topup' ? COLORS.infoText : COLORS.danger} 
              />
              <Text style={[styles.infoText, activeTab === 'withdraw' && { color: '#991B1B' }]}>
                {activeTab === 'topup' 
                  ? 'Số tiền sẽ được cộng vào ví ngay lập tức.' 
                  : 'Yêu cầu rút tiền sẽ được xét duyệt trong 1-3 ngày làm việc.'}
              </Text>
            </View>

            {/* Amount Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Số tiền {activeTab === 'topup' ? 'nạp' : 'rút'}</Text>
              <View style={styles.inputWrapper}>
                <TextInput
                  style={styles.input}
                  placeholder="Nhập số tiền"
                  keyboardType="numeric"
                  value={amountInput}
                  onChangeText={setAmountInput}
                  placeholderTextColor="#9CA3AF"
                />
                <Text style={styles.inputSuffix}>VND</Text>
              </View>
              {amountInput && Number(amountInput) > 0 && (
                <Text style={styles.inputHint}>
                  = {formatVND(Number(amountInput))} đồng
                </Text>
              )}
            </View>

            {/* Quick Amount Buttons */}
            {renderQuickButtons()}

            {/* Description Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Ghi chú (tùy chọn)</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder={activeTab === 'topup' ? 'Nạp tiền cho...' : 'Rút tiền để...'}
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={3}
                placeholderTextColor="#9CA3AF"
              />
            </View>

            {/* Action Button */}
            <TouchableOpacity
              style={[
                styles.actionBtn,
                activeTab === 'withdraw' && styles.withdrawBtn,
                processing && styles.btnDisabled
              ]}
              onPress={activeTab === 'topup' ? handleTopup : handleWithdraw}
              disabled={processing}
            >
              {processing ? (
                <ActivityIndicator color={COLORS.white} />
              ) : (
                <>
                  <MaterialCommunityIcons 
                    name={activeTab === 'topup' ? 'plus-circle' : 'minus-circle'} 
                    size={20} 
                    color={COLORS.white} 
                  />
                  <Text style={styles.actionBtnText}>
                    {activeTab === 'topup' ? 'XÁC NHẬN NẠP TIỀN' : 'XÁC NHẬN RÚT TIỀN'}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          {/* Important Notes */}
          <View style={styles.notesContainer}>
            <Text style={styles.notesTitle}>Lưu ý:</Text>
            {activeTab === 'topup' ? (
              <>
                <Text style={styles.noteItem}>• Số tiền nạp tối thiểu: 10,000 VND</Text>
                <Text style={styles.noteItem}>• Tiền sẽ được cộng vào ví ngay lập tức</Text>
                <Text style={styles.noteItem}>• Giao dịch nạp tiền không thể hoàn tác</Text>
              </>
            ) : (
              <>
                <Text style={styles.noteItem}>• Số tiền rút tối thiểu: 10,000 VND</Text>
                <Text style={styles.noteItem}>• Yêu cầu rút tiền cần được xét duyệt</Text>
                <Text style={styles.noteItem}>• Thời gian xử lý: 1-3 ngày làm việc</Text>
                <Text style={styles.noteItem}>• Phí rút tiền: 0 VND (nếu có thay đổi sẽ thông báo)</Text>
              </>
            )}
          </View>

        </ScrollView>
      </KeyboardAvoidingView>

      {/* QR Code Modal */}
      {qrModal && (
        <Modal
          visible={qrModal.visible}
          transparent
          animationType="fade"
          onRequestClose={closeQrModal}
        >
          <View style={styles.qrModalOverlay}>
            <View style={styles.qrModalContent}>
              <ScrollView showsVerticalScrollIndicator={false}>
                {/* Header */}
                <View style={styles.qrModalHeader}>
                  <MaterialCommunityIcons name="qrcode-scan" size={32} color={COLORS.primary} />
                  <Text style={styles.qrModalTitle}>Quét mã QR để nạp tiền</Text>
                </View>

                {/* QR Code Image */}
                <View style={styles.qrImageContainer}>
                  <Image
                    source={{ uri: qrModal.qrUrl }}
                    style={styles.qrImage}
                    resizeMode="contain"
                  />
                </View>

                {/* Transaction Info */}
                <View style={styles.qrInfoContainer}>
                  <View style={styles.qrInfoRow}>
                    <Text style={styles.qrInfoLabel}>Số tiền:</Text>
                    <Text style={styles.qrInfoValue}>{formatVND(qrModal.amount)} đ</Text>
                  </View>
                  
                  <View style={styles.qrInfoRow}>
                    <Text style={styles.qrInfoLabel}>Nội dung chuyển khoản:</Text>
                    <View style={styles.transferContentBox}>
                      <Text style={styles.transferContentText}>{qrModal.transferContent}</Text>
                    </View>
                  </View>

                  <View style={styles.qrInfoRow}>
                    <Text style={styles.qrInfoLabel}>Mã giao dịch:</Text>
                    <Text style={styles.qrInfoValueSmall}>{qrModal.transactionId}</Text>
                  </View>
                </View>

                {/* Instructions */}
                <View style={styles.qrInstructions}>
                  <Text style={styles.qrInstructionsTitle}>⚠️ Hướng dẫn:</Text>
                  <Text style={styles.qrInstructionItem}>1. Mở ứng dụng ngân hàng của bạn</Text>
                  <Text style={styles.qrInstructionItem}>2. Quét mã QR hoặc nhập thông tin thủ công</Text>
                  <Text style={styles.qrInstructionItem}>3. Kiểm tra nội dung chuyển khoản chính xác</Text>
                  <Text style={styles.qrInstructionItem}>4. Xác nhận chuyển tiền</Text>
                  <Text style={styles.qrInstructionItem}>5. Tiền sẽ được cộng vào ví trong vài phút</Text>
                </View>

                {/* Confirm Button */}
                <TouchableOpacity
                  style={styles.qrConfirmButton}
                  onPress={closeQrModal}
                  activeOpacity={0.8}
                >
                  <MaterialCommunityIcons name="check-circle" size={20} color={COLORS.white} />
                  <Text style={styles.qrConfirmButtonText}>Đã chuyển tiền</Text>
                </TouchableOpacity>
              </ScrollView>
            </View>
          </View>
        </Modal>
      )}

      {/* Confirm Dialog */}
      {confirmDialog && (
        <Modal
          visible={confirmDialog.visible}
          transparent
          animationType="fade"
          onRequestClose={() => setConfirmDialog(null)}
        >
          <View style={styles.confirmOverlay}>
            <View style={styles.confirmDialog}>
              <View style={styles.confirmHeader}>
                <Ionicons name="alert-circle" size={48} color={COLORS.warning} />
                <Text style={styles.confirmTitle}>{confirmDialog.title}</Text>
              </View>
              
              <Text style={styles.confirmMessage}>{confirmDialog.message}</Text>
              
              <View style={styles.confirmButtons}>
                <TouchableOpacity
                  style={[styles.confirmBtn, styles.confirmBtnCancel]}
                  onPress={() => setConfirmDialog(null)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.confirmBtnTextCancel}>Hủy</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[styles.confirmBtn, styles.confirmBtnConfirm]}
                  onPress={confirmDialog.onConfirm}
                  activeOpacity={0.7}
                >
                  <Text style={styles.confirmBtnTextConfirm}>Xác nhận</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}

      {/* Toast Notification */}
      {toast.visible && (
        <View style={[styles.toast, toast.type === 'success' ? styles.toastSuccess : styles.toastError]}>
          <MaterialCommunityIcons 
            name={toast.type === 'success' ? 'check-circle' : 'alert-circle'} 
            size={20} 
            color={COLORS.white} 
          />
          <Text style={styles.toastText}>{toast.message}</Text>
        </View>
      )}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  
  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderColor: COLORS.border
  },
  headerTitle: { fontSize: 18, fontWeight: '700', color: COLORS.textMain },
  backBtn: { 
    padding: 8,
    marginLeft: -8,
    borderRadius: 8,
  },
  headerRight: { width: 40 },
  iconBtn: { padding: 4 },

  // Content
  scrollContent: { padding: 16, paddingBottom: 100 },

  // Balance Card
  balanceCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2
  },
  balanceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12
  },
  balanceLabel: {
    fontSize: 14,
    color: COLORS.textSec,
    marginLeft: 8,
    fontWeight: '500'
  },
  balanceAmount: {
    fontSize: 32,
    fontWeight: '800',
    color: COLORS.primary,
    marginBottom: 8
  },
  refreshBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
    backgroundColor: COLORS.infoBg
  },
  refreshText: {
    fontSize: 12,
    color: COLORS.primary,
    marginLeft: 4,
    fontWeight: '600'
  },

  // Tabs
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 4,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: COLORS.border
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 6
  },
  activeTab: {
    backgroundColor: '#F0F9FF',
    shadowColor: COLORS.primary,
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textSec
  },
  activeTabText: {
    color: COLORS.primary,
    fontWeight: '700'
  },

  // Form
  formContainer: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.border
  },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.infoBg,
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#BAE6FD',
    gap: 8
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: '#0C4A6E',
    lineHeight: 18
  },

  // Input
  inputGroup: { marginBottom: 20 },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textMain,
    marginBottom: 8
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    backgroundColor: '#F9FAFB',
    paddingHorizontal: 12
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: COLORS.textMain,
    paddingVertical: 12
  },
  inputSuffix: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textSec,
    marginLeft: 8
  },
  inputHint: {
    fontSize: 12,
    color: COLORS.textSec,
    marginTop: 4,
    fontStyle: 'italic'
  },
  textArea: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    backgroundColor: '#F9FAFB',
    paddingHorizontal: 12,
    paddingTop: 12,
    height: 80,
    textAlignVertical: 'top'
  },

  // Quick Buttons
  quickButtonsContainer: { marginBottom: 20 },
  quickLabel: {
    fontSize: 13,
    color: COLORS.textSec,
    marginBottom: 8,
    fontWeight: '500'
  },
  quickButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8
  },
  quickBtn: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.white
  },
  quickBtnActive: {
    backgroundColor: COLORS.infoBg,
    borderColor: COLORS.primary
  },
  quickBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textSec
  },
  quickBtnTextActive: {
    color: COLORS.primary
  },

  // Action Button
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    borderRadius: 8,
    gap: 8,
    shadowColor: COLORS.primary,
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3
  },
  withdrawBtn: {
    backgroundColor: COLORS.danger,
    shadowColor: COLORS.danger
  },
  btnDisabled: {
    backgroundColor: '#9CA3AF',
    shadowOpacity: 0
  },
  actionBtnText: {
    color: COLORS.white,
    fontSize: 15,
    fontWeight: '700'
  },

  // Notes
  notesContainer: {
    backgroundColor: '#FFFBEB',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#FEF3C7'
  },
  notesTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#92400E',
    marginBottom: 8
  },
  noteItem: {
    fontSize: 12,
    color: '#78350F',
    marginBottom: 4,
    lineHeight: 18
  },

  // Toast
  toast: {
    position: 'absolute',
    bottom: 40,
    left: 20,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
    gap: 8,
  },
  toastSuccess: {
    backgroundColor: COLORS.success,
  },
  toastError: {
    backgroundColor: COLORS.danger,
  },
  toastText: {
    flex: 1,
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '600',
  },

  // QR Modal
  qrModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  qrModalContent: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 480,
    maxHeight: '90%',
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 10,
  },
  qrModalHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  qrModalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.textMain,
    marginTop: 8,
    textAlign: 'center',
  },
  qrImageContainer: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 2,
    borderColor: COLORS.border,
  },
  qrImage: {
    width: 260,
    height: 260,
  },
  qrInfoContainer: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    gap: 12,
  },
  qrInfoRow: {
    gap: 6,
  },
  qrInfoLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textSec,
  },
  qrInfoValue: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.primary,
  },
  qrInfoValueSmall: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textMain,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  transferContentBox: {
    backgroundColor: COLORS.white,
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: COLORS.primary,
    borderStyle: 'dashed',
  },
  transferContentText: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.primary,
    textAlign: 'center',
    letterSpacing: 1,
  },
  qrInstructions: {
    backgroundColor: '#FFFBEB',
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#FEF3C7',
  },
  qrInstructionsTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#92400E',
    marginBottom: 8,
  },
  qrInstructionItem: {
    fontSize: 12,
    color: '#78350F',
    marginBottom: 4,
    lineHeight: 18,
  },
  qrConfirmButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.success,
    paddingVertical: 14,
    borderRadius: 10,
    gap: 8,
    shadowColor: COLORS.success,
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  qrConfirmButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '700',
  },

  // Confirm Dialog
  confirmOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  confirmDialog: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
  },
  confirmHeader: {
    alignItems: 'center',
    marginBottom: 16,
  },
  confirmTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.textMain,
    marginTop: 12,
    textAlign: 'center',
  },
  confirmMessage: {
    fontSize: 15,
    color: COLORS.textSec,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  confirmButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  confirmBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmBtnCancel: {
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  confirmBtnConfirm: {
    backgroundColor: COLORS.primary,
    shadowColor: COLORS.primary,
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  confirmBtnTextCancel: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.textMain,
  },
  confirmBtnTextConfirm: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.white,
  },
})
