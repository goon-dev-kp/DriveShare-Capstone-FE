import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
  Platform,
  Dimensions,
} from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import * as ImagePicker from 'expo-image-picker'
import { ekycService, VnptSdkConfig } from '@/services/ekycService'
import VnptSdkModal from '@/components/ekyc/VnptSdkModal'

// Cross-platform alert function
const showAlert = (title: string, message: string, onOk?: () => void) => {
  if (Platform.OS === 'web') {
    window.alert(`${title}\n\n${message}`)
    onOk?.()
  } else {
    Alert.alert(title, message, [{ text: 'OK', onPress: onOk }])
  }
}

interface CapturedImages {
  healthCertificate: { uri: string; name: string; type: string } | null
  additionalDoc: { uri: string; name: string; type: string } | null
}

const { width } = Dimensions.get('window')

const ENABLE_AI_SCAN = false

const VerifyHealthCheckScreen = () => {
  const router = useRouter()
  const [step, setStep] = useState<'instruction' | 'capture' | 'review' | 'processing'>('instruction')
  const [images, setImages] = useState<CapturedImages>({
    healthCertificate: null,
    additionalDoc: null,
  })
  const [uploading, setUploading] = useState(false)
  const [sdkConfig, setSdkConfig] = useState<VnptSdkConfig | null>(null)
  const [useVnptSdk, setUseVnptSdk] = useState<boolean>(false)
  const [showVnptModal, setShowVnptModal] = useState<boolean>(false)

  useEffect(() => {
    requestPermissions()
    if (ENABLE_AI_SCAN) {
      loadVnptConfig()
    }
  }, [])

  const loadVnptConfig = async () => {
    try {
      const response = await ekycService.getVnptConfig()
      if (response.isSuccess && response.result) {
        setSdkConfig(response.result)
        setUseVnptSdk(true)
      }
    } catch (error) {
      console.error('Failed to load VNPT config:', error)
      setUseVnptSdk(false)
    }
  }

  const requestPermissions = async () => {
    if (Platform.OS !== 'web') {
      const { status } = await ImagePicker.requestCameraPermissionsAsync()
      if (status !== 'granted') {
        Alert.alert('Cần quyền truy cập', 'Vui lòng cấp quyền camera để tiếp tục')
      }
    }
  }

  const pickImage = async (type: 'healthCertificate' | 'additionalDoc') => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync()
      if (status !== 'granted') {
        Alert.alert('Cần quyền camera', 'Vui lòng cấp quyền truy cập camera')
        return
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        allowsEditing: false,
        quality: 0.9,
        cameraType: ImagePicker.CameraType.back,
        base64: true, // ← Thêm base64 để lấy data
      })

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0]
        const timestamp = Date.now()
        const dataUrl = asset.base64 ? `data:image/jpeg;base64,${asset.base64}` : asset.uri
        
        setImages((prev) => ({
          ...prev,
          [type]: {
            uri: dataUrl, // Lưu dataUrl thay vì local uri
            name: `${type}_${timestamp}.jpg`,
            type: 'image/jpeg',
          },
        }))
      }
    } catch (error) {
      Alert.alert('Lỗi', 'Không thể chụp ảnh. Vui lòng thử lại.')
    }
  }

  const startVnptSdkFlow = () => {
    setShowVnptModal(true)
  }

  const handleVnptSdkResult = (result: any) => {
    try {
      const timestamp = Date.now()
      setImages({
        healthCertificate: result.front_image ? { uri: `data:image/jpeg;base64,${result.front_image}`, name: `health_${timestamp}.jpg`, type: 'image/jpeg' } : null,
        additionalDoc: null,
      })
      setShowVnptModal(false)
      setStep('review')
    } catch (error) {
      Alert.alert('Lỗi', 'Không thể xử lý kết quả từ SDK')
    }
  }

  const handleVnptSdkError = (error: string) => {
    setShowVnptModal(false)
    Alert.alert('Lỗi eKYC', error)
  }

  const handleVnptModalCancel = () => {
    setShowVnptModal(false)
  }

  const handleSubmit = async () => {
    if (!images.healthCertificate) {
      Alert.alert('Thiếu ảnh', 'Vui lòng chụp ảnh giấy khám sức khỏe')
      return
    }
    setStep('processing')
    setUploading(true)

    try {
      // Sử dụng trực tiếp images vì đã có base64 dataUrl
      const healthCert = images.healthCertificate
      const additional = images.additionalDoc

      const response = await ekycService.verifyHealthCheck(healthCert, additional)
      
      console.log('✅ VerifyHealthCheck Response:', JSON.stringify(response, null, 2))
      
      setUploading(false)

      if (response.isSuccess) {
        showAlert('Thành công! 🎉', response.message || 'Giấy khám sức khỏe đã được gửi xác thực', () => {
          router.replace('/driver/my-documents')
        })
      } else {
        setStep('capture')
        const errorTitle = 'Xác thực thất bại'
        const errorReason = response.result?.reason || response.result?.rejectionReason || response.message || 'Vui lòng kiểm tra lại'
        
        if (Platform.OS === 'web') {
          const retry = window.confirm(`${errorTitle}\n\n${errorReason}\n\nBấm OK để chụp lại, Cancel để quay lại`)
          if (retry) {
            setStep('capture')
          } else {
            router.replace('/driver/my-documents')
          }
        } else {
          Alert.alert(errorTitle, errorReason, [
            { text: 'Chụp lại', onPress: () => setStep('capture'), style: 'default' },
            { text: 'Hủy', onPress: () => router.replace('/driver/my-documents'), style: 'cancel' },
          ])
        }
      }
    } catch (error: any) {
      console.error('❌ VerifyHealthCheck Error:', error)
      
      setUploading(false)
      setStep('capture')
      
      const errorData = error?.response?.data
      if (errorData) {
        console.log('Error Data:', JSON.stringify(errorData, null, 2))
        const errorTitle = errorData.message || 'Xác thực thất bại'
        const errorReason = errorData.result?.reason || errorData.result?.rejectionReason || errorData.message || 'Vui lòng kiểm tra lại'
        
        if (Platform.OS === 'web') {
          const retry = window.confirm(`${errorTitle}\n\n${errorReason}\n\nBấm OK để chụp lại, Cancel để hủy`)
          if (retry) {
            setStep('capture')
          } else {
            router.back()
          }
        } else {
          Alert.alert(errorTitle, errorReason, [
            { text: 'Chụp lại', onPress: () => setStep('capture') },
            { text: 'Hủy', onPress: () => router.replace('/driver/my-documents'), style: 'cancel' },
          ])
        }
      } else {
        if (Platform.OS === 'web') {
          const retry = window.confirm('Lỗi\n\nKhông thể kết nối đến máy chủ\n\nBấm OK để thử lại, Cancel để hủy')
          if (retry) {
            setStep('capture')
          } else {
            router.back()
          }
        } else {
          Alert.alert('Lỗi', 'Không thể kết nối đến máy chủ', [
            { text: 'Thử lại', onPress: () => setStep('capture') },
            { text: 'Hủy', onPress: () => router.replace('/driver/my-documents'), style: 'cancel' },
          ])
        }
      }
    }
  }

  const renderInstruction = () => (
    <View style={styles.cardContainer}>
      <View style={styles.iconCircleBig}>
        <MaterialCommunityIcons name="heart-pulse" size={60} color="#10B981" />
      </View>
      <Text style={styles.titleText}>Xác thực Sức khỏe</Text>
      <Text style={styles.subtitleText}>
        Chuẩn bị giấy khám sức khỏe của bạn để xác thực đủ điều kiện làm tài xế
      </Text>

      <View style={styles.stepsContainer}>
        <View style={styles.stepRow}>
          <View style={[styles.stepIconBox, { backgroundColor: '#D1FAE5' }]}>
            <MaterialCommunityIcons name="certificate" size={24} color="#10B981" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.stepTitle}>Chụp giấy khám sức khỏe</Text>
            <Text style={styles.stepDesc}>Giấy xác nhận từ cơ sở y tế có thẩm quyền</Text>
          </View>
        </View>

        <View style={styles.stepRow}>
          <View style={[styles.stepIconBox, { backgroundColor: '#D1FAE5' }]}>
            <MaterialCommunityIcons name="file-document-outline" size={24} color="#10B981" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.stepTitle}>Tài liệu bổ sung (tùy chọn)</Text>
            <Text style={styles.stepDesc}>Giấy tờ liên quan đến sức khỏe nếu có</Text>
          </View>
        </View>
      </View>

      <TouchableOpacity onPress={() => setStep('capture')} activeOpacity={0.8}>
        <LinearGradient colors={['#10B981', '#059669']} style={styles.primaryButton}>
          <Text style={styles.primaryButtonText}>Bắt đầu</Text>
          <MaterialCommunityIcons name="arrow-right" size={20} color="#FFF" />
        </LinearGradient>
      </TouchableOpacity>
    </View>
  )

  const renderCapture = () => (
    <View style={styles.captureWrapper}>
      <Text style={styles.sectionHeader}>Chụp ảnh giấy tờ sức khỏe</Text>

      <View style={styles.gridContainer}>
        {/* Health Certificate */}
        <TouchableOpacity
          style={[styles.uploadBox, images.healthCertificate && styles.uploadBoxActive]}
          onPress={() => pickImage('healthCertificate')}
          activeOpacity={0.7}
        >
          {images.healthCertificate ? (
            <>
              <Image source={{ uri: images.healthCertificate.uri }} style={styles.uploadedImage} />
              <View style={styles.checkBadge}>
                <MaterialCommunityIcons name="check" size={16} color="#FFF" />
              </View>
            </>
          ) : (
            <View style={styles.uploadPlaceholder}>
              <View style={[styles.uploadIconCircle, { backgroundColor: '#D1FAE5' }]}>
                <MaterialCommunityIcons name="certificate" size={28} color="#10B981" />
              </View>
              <Text style={styles.uploadLabel}>Giấy khám sức khỏe</Text>
              <Text style={styles.uploadSub}>Nhấn để chụp</Text>
            </View>
          )}
        </TouchableOpacity>

        {/* Additional Document (Optional) */}
        <TouchableOpacity
          style={[styles.uploadBox, images.additionalDoc && styles.uploadBoxActive]}
          onPress={() => pickImage('additionalDoc')}
          activeOpacity={0.7}
        >
          {images.additionalDoc ? (
            <>
              <Image source={{ uri: images.additionalDoc.uri }} style={styles.uploadedImage} />
              <View style={styles.checkBadge}>
                <MaterialCommunityIcons name="check" size={16} color="#FFF" />
              </View>
            </>
          ) : (
            <View style={styles.uploadPlaceholder}>
              <View style={[styles.uploadIconCircle, { backgroundColor: '#D1FAE5' }]}>
                <MaterialCommunityIcons name="file-document-outline" size={28} color="#10B981" />
              </View>
              <Text style={styles.uploadLabel}>Tài liệu bổ sung</Text>
              <Text style={styles.uploadSub}>Tùy chọn</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={[styles.continueBtn, !images.healthCertificate && styles.disabledBtn]}
        disabled={!images.healthCertificate}
        onPress={() => setStep('review')}
      >
        <Text style={styles.continueBtnText}>Tiếp tục</Text>
      </TouchableOpacity>
    </View>
  )

  const renderReview = () => (
    <View style={styles.reviewCard}>
      <Text style={styles.reviewHeader}>Kiểm tra lại thông tin</Text>
      <Text style={styles.reviewSub}>Đảm bảo hình ảnh không bị mờ hoặc lóa sáng</Text>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.galleryScroll}>
        {images.healthCertificate && (
          <View style={styles.reviewItem}>
            <Image source={{ uri: images.healthCertificate.uri }} style={styles.reviewImg} />
            <View style={styles.reviewLabelBadge}>
              <Text style={styles.reviewLabelText}>Giấy khám sức khỏe</Text>
            </View>
          </View>
        )}
        {images.additionalDoc && (
          <View style={styles.reviewItem}>
            <Image source={{ uri: images.additionalDoc.uri }} style={styles.reviewImg} />
            <View style={styles.reviewLabelBadge}>
              <Text style={styles.reviewLabelText}>Tài liệu bổ sung</Text>
            </View>
          </View>
        )}
      </ScrollView>

      <View style={styles.actionRow}>
        <TouchableOpacity style={styles.secondaryBtn} onPress={() => setStep('capture')}>
          <Text style={styles.secondaryBtnText}>Chụp lại</Text>
        </TouchableOpacity>

        <TouchableOpacity style={{ flex: 1 }} onPress={handleSubmit}>
          <LinearGradient colors={['#10B981', '#059669']} style={styles.primaryButton}>
            <Text style={styles.primaryButtonText}>Xác nhận</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  )

  const renderProcessing = () => (
    <View style={styles.centerContent}>
      <View style={styles.processingCircle}>
        <ActivityIndicator size="large" color="#10B981" />
      </View>
      <Text style={styles.processingTitle}>Đang xác thực...</Text>
      <Text style={styles.processingDesc}>Vui lòng chờ trong giây lát</Text>
    </View>
  )

  return (
    <LinearGradient colors={['#ECFDF5', '#FFFFFF']} style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#0F172A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Xác thực Sức khỏe</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {step === 'instruction' && renderInstruction()}
        {step === 'capture' && renderCapture()}
        {step === 'review' && renderReview()}
        {step === 'processing' && renderProcessing()}
      </ScrollView>

      {showVnptModal && sdkConfig && (
        <VnptSdkModal
          visible={showVnptModal}
          config={sdkConfig}
          scanType="health_check"
          onResult={handleVnptSdkResult}
          onError={handleVnptSdkError}
          onCancel={handleVnptModalCancel}
        />
      )}
    </LinearGradient>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 10,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#0F172A' },
  scrollContent: { padding: 20, paddingBottom: 120 },

  // Instruction
  cardContainer: {
    backgroundColor: '#FFF',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#10B981',
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 5,
  },
  iconCircleBig: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#D1FAE5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  titleText: { fontSize: 22, fontWeight: '800', color: '#0F172A', marginBottom: 8 },
  subtitleText: { fontSize: 15, color: '#64748B', textAlign: 'center', marginBottom: 30, lineHeight: 22 },
  stepsContainer: { width: '100%', marginBottom: 30, gap: 16 },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  stepIconBox: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  stepTitle: { fontSize: 16, fontWeight: '700', color: '#334155' },
  stepDesc: { fontSize: 13, color: '#94A3B8', marginTop: 2 },

  // Buttons
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 16,
    width: '100%',
    gap: 8,
  },
  primaryButtonText: { color: '#FFF', fontWeight: '700', fontSize: 16 },
  secondaryBtn: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    marginRight: 12,
  },
  secondaryBtnText: { color: '#64748B', fontWeight: '700', fontSize: 16 },

  // Capture
  captureWrapper: { width: '100%' },
  sectionHeader: { fontSize: 16, fontWeight: '600', color: '#64748B', marginBottom: 16, textAlign: 'center' },
  gridContainer: { gap: 16 },
  uploadBox: {
    width: '100%',
    height: 200,
    borderRadius: 20,
    backgroundColor: '#F8FAFC',
    borderWidth: 2,
    borderColor: '#E2E8F0',
    borderStyle: 'dashed',
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  uploadBoxActive: {
    backgroundColor: '#FFF',
    borderWidth: 0,
    borderStyle: 'solid',
    shadowColor: '#10B981',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 4,
  },
  uploadPlaceholder: { alignItems: 'center' },
  uploadIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  uploadLabel: { fontSize: 16, fontWeight: '600', color: '#475569' },
  uploadSub: { fontSize: 13, color: '#94A3B8' },
  uploadedImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  checkBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#22C55E',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFF',
  },
  continueBtn: {
    marginTop: 30,
    backgroundColor: '#10B981',
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#10B981',
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  disabledBtn: { backgroundColor: '#CBD5E1', shadowOpacity: 0 },
  continueBtnText: { color: '#FFF', fontWeight: '700', fontSize: 16 },

  // Review
  reviewCard: { backgroundColor: '#FFF', padding: 24, borderRadius: 24 },
  reviewHeader: { fontSize: 20, fontWeight: '700', color: '#0F172A', textAlign: 'center' },
  reviewSub: { fontSize: 14, color: '#64748B', textAlign: 'center', marginBottom: 24, marginTop: 4 },
  galleryScroll: { marginBottom: 24 },
  reviewItem: { marginRight: 16, position: 'relative' },
  reviewImg: { width: 220, height: 140, borderRadius: 16, backgroundColor: '#F1F5F9' },
  reviewLabelBadge: {
    position: 'absolute',
    bottom: 10,
    left: 10,
    backgroundColor: 'rgba(15, 23, 42, 0.8)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  reviewLabelText: { color: '#FFF', fontSize: 12, fontWeight: '600' },
  actionRow: { flexDirection: 'row', gap: 12 },

  // Processing
  centerContent: { alignItems: 'center', justifyContent: 'center', marginTop: 100 },
  processingCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#D1FAE5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  processingTitle: { fontSize: 20, fontWeight: '700', color: '#0F172A' },
  processingDesc: { fontSize: 14, color: '#64748B', marginTop: 8 },
  
  // Secondary button for health check
  secondaryBtnAlt: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  secondaryBtnAltText: { color: '#64748B', fontWeight: '700', fontSize: 16 },
})

export default VerifyHealthCheckScreen
