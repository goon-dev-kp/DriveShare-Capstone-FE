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
import { Ionicons } from '@expo/vector-icons'
import postTripService from '@/services/postTripService'
import contractTemplateService from '@/services/contractTemplateService'

interface InlinePostTripSignModalProps {
  visible: boolean
  postId?: string
  onClose: () => void
  onDone: () => void
}

const COLORS = {
  primary: '#4F46E5',
  success: '#10B981',
  white: '#FFFFFF',
  textMain: '#111827',
  textSec: '#6B7280',
  infoBg: '#E0F2FE',
  infoText: '#0369A1',
}

const InlinePostTripSignModal: React.FC<InlinePostTripSignModalProps> = ({
  visible,
  postId,
  onClose,
  onDone,
}) => {
  const [loading, setLoading] = useState(false)
  const [contractTemplate, setContractTemplate] = useState<any | null>(null)
  const [acceptedTerms, setAcceptedTerms] = useState(false)
  const [signing, setSigning] = useState(false)
  const [alertVisible, setAlertVisible] = useState(false)
  const [alertConfig, setAlertConfig] = useState({ title: '', message: '' })

  useEffect(() => {
    if (visible && postId) {
      fetchContract()
    } else {
      reset()
    }
  }, [visible, postId])

  const reset = () => {
    setContractTemplate(null)
    setAcceptedTerms(false)
    setLoading(false)
    setSigning(false)
    setAlertVisible(false)
  }

  const fetchContract = async () => {
    setLoading(true)
    try {
      const resp: any = await contractTemplateService.getLatestDriverContract()
      setContractTemplate(resp?.result ?? resp)
    } catch (e: any) {
      setAlertConfig({ title: 'Lỗi', message: e?.message || 'Không thể tải hợp đồng' })
      setAlertVisible(true)
      setContractTemplate(null)
    } finally {
      setLoading(false)
    }
  }

  const handleSign = async () => {
    if (!postId || !acceptedTerms) return

    setSigning(true)
    try {
      // Update status to AWAITING_PAYMENT
      await postTripService.updateStatus(postId, 'AWAITING_PAYMENT')
      setAlertConfig({ 
        title: 'Thành công', 
        message: 'Đã ký hợp đồng thành công. Vui lòng tiếp tục thanh toán.' 
      })
      setAlertVisible(true)
    } catch (e: any) {
      setAlertConfig({ title: 'Lỗi', message: e?.message || 'Không thể ký hợp đồng' })
      setAlertVisible(true)
    } finally {
      setSigning(false)
    }
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
          <Text style={styles.headerTitle}>Ký Hợp Đồng</Text>
          <View style={{ width: 24 }} />
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.loadingText}>Đang tải hợp đồng...</Text>
          </View>
        ) : (
          <>
            <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
              {/* Info Banner */}
              <View style={styles.infoBanner}>
                <Ionicons name="shield-checkmark-outline" size={24} color={COLORS.infoText} />
                <View style={{ flex: 1, marginLeft: 10 }}>
                  <Text style={styles.infoTitle}>Ủy quyền ký tự động</Text>
                  <Text style={styles.infoDesc}>
                    Bạn đồng ý các điều khoản và ủy quyền cho nền tảng tự động tạo hợp đồng với Tài xế khi họ nhận chuyến.
                  </Text>
                </View>
              </View>

              {/* Contract Content */}
              <View style={styles.contractPaper}>
                <Text style={styles.contractHeader}>
                  {contractTemplate?.contractTemplateName || 'HỢP ĐỒNG VẬN TẢI'}
                </Text>
                <View style={styles.divider} />

                {(contractTemplate?.contractTerms || []).map((term: any, i: number) => (
                  <View key={i} style={{ marginBottom: 12 }}>
                    <Text style={{ fontWeight: '700', color: COLORS.textMain }}>
                      Điều {i + 1}:
                    </Text>
                    <Text style={{ color: '#374151', textAlign: 'justify', marginTop: 4 }}>
                      {term.content}
                    </Text>
                  </View>
                ))}
              </View>

              {/* Accept Terms */}
              <TouchableOpacity
                style={styles.checkboxContainer}
                onPress={() => setAcceptedTerms(!acceptedTerms)}
              >
                <Ionicons
                  name={acceptedTerms ? 'checkbox' : 'square-outline'}
                  size={24}
                  color={acceptedTerms ? COLORS.primary : COLORS.textSec}
                />
                <Text style={{ marginLeft: 8, flex: 1, color: COLORS.textMain }}>
                  Tôi đã đọc và đồng ý với các điều khoản.
                </Text>
              </TouchableOpacity>
            </ScrollView>

            {/* Footer */}
            <View style={styles.footer}>
              <TouchableOpacity style={styles.btnSec} onPress={onClose}>
                <Text style={styles.btnSecText}>Hủy</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.btnPri, (!acceptedTerms || signing) && styles.btnDisabled]}
                onPress={handleSign}
                disabled={!acceptedTerms || signing}
              >
                {signing ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.btnPriText}>Ký & Tiếp tục</Text>
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
                  if (alertConfig.title === 'Thành công') {
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
  infoBanner: {
    flexDirection: 'row',
    backgroundColor: COLORS.infoBg,
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  infoTitle: { fontWeight: '700', color: COLORS.infoText },
  infoDesc: { fontSize: 13, color: '#0C4A6E', marginTop: 2 },
  contractPaper: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 16,
    borderRadius: 4,
    minHeight: 300,
    marginBottom: 16,
    elevation: 2,
  },
  contractHeader: {
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 10,
  },
  divider: { height: 1, backgroundColor: '#eee', marginVertical: 12 },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
  },
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

export default InlinePostTripSignModal
