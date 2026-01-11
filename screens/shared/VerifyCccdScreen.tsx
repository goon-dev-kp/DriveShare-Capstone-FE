import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  Platform,
  Alert,
  ActivityIndicator,
  Dimensions
} from 'react-native'
import { useRouter } from 'expo-router'
import { LinearGradient } from 'expo-linear-gradient'
import { MaterialCommunityIcons } from '@expo/vector-icons'
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
  front: { uri: string; name: string; type: string } | null
  back: { uri: string; name: string; type: string } | null
  selfie: { uri: string; name: string; type: string } | null
}

const { width } = Dimensions.get('window');

const ENABLE_AI_SCAN = false

const VerifyCccdScreen = () => {
  const router = useRouter()
  const [step, setStep] = useState<'instruction' | 'capture' | 'review' | 'processing'>('instruction')
  const [images, setImages] = useState<CapturedImages>({
    front: null,
    back: null,
    selfie: null,
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
        Alert.alert('Cần cấp quyền', 'Ứng dụng cần quyền truy cập camera')
      }
    }
  }

  const startVnptSdkFlow = () => {
    setShowVnptModal(true)
  }

  const pickImage = async (type: 'front' | 'back' | 'selfie') => {
    try {
      // Request camera permission first
      const { status } = await ImagePicker.requestCameraPermissionsAsync()
      if (status !== 'granted') {
        Alert.alert('Cần quyền camera', 'Vui lòng cấp quyền truy cập camera để tiếp tục')
        return
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        allowsEditing: false,
        quality: 0.9,
        cameraType: type === 'selfie' ? ImagePicker.CameraType.front : ImagePicker.CameraType.back,
        base64: true, // ← Thêm base64 để lấy data
      })

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0]
        const dataUrl = asset.base64 ? `data:image/jpeg;base64,${asset.base64}` : asset.uri
        
        setImages((prev) => ({
          ...prev,
          [type]: {
            uri: dataUrl, // Lưu dataUrl thay vì local uri
            name: `${type}_${Date.now()}.jpg`,
            type: 'image/jpeg',
          },
        }))
      }
    } catch (error) {
      Alert.alert('Lỗi', 'Không thể chụp ảnh. Vui lòng thử lại.')
    }
  }

  const handleVnptSdkResult = (result: any) => {
    try {
      const timestamp = Date.now()
      setImages({
        front: result.front_image ? { uri: `data:image/jpeg;base64,${result.front_image}`, name: `front_${timestamp}.jpg`, type: 'image/jpeg' } : null,
        back: result.back_image ? { uri: `data:image/jpeg;base64,${result.back_image}`, name: `back_${timestamp}.jpg`, type: 'image/jpeg' } : null,
        selfie: result.face_image ? { uri: `data:image/jpeg;base64,${result.face_image}`, name: `selfie_${timestamp}.jpg`, type: 'image/jpeg' } : null,
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
    if (!images.front || !images.back || !images.selfie) {
      Alert.alert('Thiếu ảnh', 'Vui lòng chụp đầy đủ các ảnh')
      return
    }
    setStep('processing')
    setUploading(true)

    try {
      // Sử dụng trực tiếp images vì đã có base64 dataUrl
      const front = images.front
      const back = images.back
      const selfie = images.selfie

      const response = await ekycService.verifyCccd(front, back, selfie)
      
      console.log('✅ VerifyCccd Response:', JSON.stringify(response, null, 2))
      
      setUploading(false)

      if (response.isSuccess) {
        showAlert('Thành công! 🎉', `Chào mừng ${response.result?.fullName}!`, () => {
          router.replace('/owner/my-documents')
        })
      } else {
        setStep('capture') // Go back to capture for retry
        const errorTitle = response.message || 'Xác thực thất bại'
        const errorReason = response.result?.reason || response.result?.rejectionReason || 'Vui lòng kiểm tra lại giấy tờ và thử lại'
        
        if (Platform.OS === 'web') {
          const retry = window.confirm(`${errorTitle}\n\n${errorReason}\n\nBấm OK để chụp lại, Cancel để quay lại`)
          if (retry) {
            setStep('capture')
          } else {
            router.replace('/owner/my-documents')
          }
        } else {
          Alert.alert(
            errorTitle,
            errorReason,
            [
              { text: 'Chụp lại', onPress: () => setStep('capture') },
              { text: 'Hủy', onPress: () => router.replace('/owner/my-documents'), style: 'cancel' }
            ]
          )
        }
      }
    } catch (error: any) {
      console.error('❌ VerifyCccd Error:', error)
      
      setUploading(false)
      setStep('capture') // Go back to capture
      
      // Xử lý lỗi từ API response
      const errorData = error?.response?.data
      if (errorData) {
        console.log('Error Data:', JSON.stringify(errorData, null, 2))
        const errorTitle = errorData.message || 'Lỗi xác thực'
        const errorReason = errorData.result?.reason || errorData.result?.rejectionReason || errorData.message || 'Có lỗi xảy ra'
        
        if (Platform.OS === 'web') {
          const retry = window.confirm(`${errorTitle}\n\n${errorReason}\n\nBấm OK để thử lại, Cancel để hủy`)
          if (retry) {
            setStep('capture')
          } else {
            router.back()
          }
        } else {
          Alert.alert(
            errorTitle,
            errorReason,
            [
              { text: 'Thử lại', onPress: () => setStep('capture') },
              { text: 'Hủy', onPress: () => router.replace('/owner/my-documents'), style: 'cancel' }
            ]
          )
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
            { text: 'Hủy', onPress: () => router.replace('/owner/my-documents'), style: 'cancel' }
          ])
        }
      }
    }
  }

  // --- RENDER COMPONENTS ---

  const renderInstruction = () => (
    <View style={styles.cardContainer}>
      <View style={styles.iconCircleBig}>
        <MaterialCommunityIcons name="shield-account" size={60} color="#0EA5E9" />
      </View>
      <Text style={styles.titleText}>Xác thực danh tính</Text>
      <Text style={styles.subtitleText}>
        Để bảo mật tài khoản, vui lòng sử dụng camera để chụp giấy tờ tùy thân.
      </Text>

      <View style={styles.stepsContainer}>
        {[
            { num: 1, title: 'Mặt trước CCCD', desc: 'Rõ nét, đủ 4 góc', icon: 'card-account-details' },
            { num: 2, title: 'Mặt sau CCCD', desc: 'Không bị lóa sáng', icon: 'card-account-details-outline' },
            { num: 3, title: 'Ảnh chân dung', desc: 'Chính chủ, không đeo kính', icon: 'face-man-profile' }
        ].map((item, index) => (
            <View key={index} style={styles.stepRow}>
                <View style={styles.stepIconBox}>
                    <MaterialCommunityIcons name={item.icon as any} size={24} color="#0284C7" />
                </View>
                <View style={{flex: 1}}>
                    <Text style={styles.stepTitle}>{item.title}</Text>
                    <Text style={styles.stepDesc}>{item.desc}</Text>
                </View>
            </View>
        ))}
      </View>

      <TouchableOpacity onPress={() => setStep('capture')} activeOpacity={0.8}>
        <LinearGradient
          colors={['#0EA5E9', '#2563EB']}
          start={{x: 0, y: 0}} end={{x: 1, y: 0}}
          style={styles.primaryButton}
        >
          <Text style={styles.primaryButtonText}>Bắt đầu ngay</Text>
          <MaterialCommunityIcons name="arrow-right" size={20} color="#FFF" />
        </LinearGradient>
      </TouchableOpacity>
    </View>
  )

  const renderCapture = () => (
    <View style={styles.captureWrapper}>
      <Text style={styles.sectionHeader}>Chụp ảnh giấy tờ</Text>

            <View style={styles.gridContainer}>
                {[
                    { key: 'front', label: 'Mặt trước', icon: 'card-account-details' },
                    { key: 'back', label: 'Mặt sau', icon: 'card-account-details-outline' },
                    { key: 'selfie', label: 'Chân dung', icon: 'account-circle' }
                ].map((item) => (
                    <TouchableOpacity 
                        key={item.key} 
                        style={[styles.uploadBox, images[item.key as keyof CapturedImages] && styles.uploadBoxActive]}
                        onPress={() => pickImage(item.key as any)}
                    >
                        {images[item.key as keyof CapturedImages] ? (
                            <Image source={{ uri: images[item.key as keyof CapturedImages]!.uri }} style={styles.uploadedImage} />
                        ) : (
                            <View style={styles.uploadPlaceholder}>
                                <View style={styles.uploadIconCircle}>
                                    <MaterialCommunityIcons name={item.icon as any} size={28} color="#38BDF8" />
                                </View>
                                <Text style={styles.uploadLabel}>{item.label}</Text>
                                <Text style={styles.uploadSub}>Chạm để chụp</Text>
                            </View>
                        )}
                        {/* Checkmark badge */}
                        {images[item.key as keyof CapturedImages] && (
                            <View style={styles.checkBadge}>
                                <MaterialCommunityIcons name="check" size={14} color="#FFF" />
                            </View>
                        )}
                    </TouchableOpacity>
                ))}
            </View>

      <TouchableOpacity 
        style={[styles.continueBtn, (!images.front || !images.back || !images.selfie) && styles.disabledBtn]}
        onPress={() => setStep('review')}
        disabled={!images.front || !images.back || !images.selfie}
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
        {[
            { img: images.front, label: 'Mặt trước' },
            { img: images.back, label: 'Mặt sau' },
            { img: images.selfie, label: 'Chân dung' }
        ].map((item, idx) => (
            <View key={idx} style={styles.reviewItem}>
                <Image source={{ uri: item.img!.uri }} style={styles.reviewImg} />
                <View style={styles.reviewLabelBadge}>
                    <Text style={styles.reviewLabelText}>{item.label}</Text>
                </View>
            </View>
        ))}
      </ScrollView>

      <View style={styles.actionRow}>
        <TouchableOpacity style={styles.secondaryBtn} onPress={() => setStep('capture')}>
            <Text style={styles.secondaryBtnText}>Chụp lại</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={{flex: 1}} onPress={handleSubmit}>
            <LinearGradient colors={['#0EA5E9', '#2563EB']} style={styles.primaryButton}>
                <Text style={styles.primaryButtonText}>Xác nhận gửi</Text>
            </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  )

  const renderProcessing = () => (
    <View style={styles.centerContent}>
        <View style={styles.processingCircle}>
            <ActivityIndicator size="large" color="#0EA5E9" />
        </View>
        <Text style={styles.processingTitle}>Đang xử lý...</Text>
        <Text style={styles.processingDesc}>Hệ thống đang phân tích giấy tờ của bạn.</Text>
    </View>
  )

  return (
    <LinearGradient colors={['#F0F9FF', '#FFFFFF']} style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="#334155" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Xác minh eKYC</Text>
        <View style={{width: 40}} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {step === 'instruction' && renderInstruction()}
        {step === 'capture' && renderCapture()}
        {step === 'review' && renderReview()}
        {step === 'processing' && renderProcessing()}
      </ScrollView>

      {showVnptModal && sdkConfig && (
        <VnptSdkModal
          visible={showVnptModal}
          config={sdkConfig}
          scanType="cccd"
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
    width: 40, height: 40,
    borderRadius: 12,
    backgroundColor: '#FFF',
    justifyContent: 'center', alignItems: 'center',
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 5, elevation: 2
  },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#0F172A' },
  scrollContent: { padding: 20, paddingBottom: 120 },

  // Instruction
  cardContainer: {
    backgroundColor: '#FFF',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#0EA5E9', shadowOpacity: 0.08, shadowOffset: {width: 0, height: 10}, shadowRadius: 20, elevation: 5
  },
  iconCircleBig: {
    width: 100, height: 100, borderRadius: 50,
    backgroundColor: '#E0F2FE',
    justifyContent: 'center', alignItems: 'center',
    marginBottom: 20
  },
  titleText: { fontSize: 22, fontWeight: '800', color: '#0F172A', marginBottom: 8 },
  subtitleText: { fontSize: 15, color: '#64748B', textAlign: 'center', marginBottom: 30, lineHeight: 22 },
  stepsContainer: { width: '100%', marginBottom: 30, gap: 16 },
  stepRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#F8FAFC', padding: 16, borderRadius: 16,
    borderWidth: 1, borderColor: '#F1F5F9'
  },
  stepIconBox: {
    width: 48, height: 48, borderRadius: 12, backgroundColor: '#E0F2FE',
    justifyContent: 'center', alignItems: 'center', marginRight: 16
  },
  stepTitle: { fontSize: 16, fontWeight: '700', color: '#334155' },
  stepDesc: { fontSize: 13, color: '#94A3B8', marginTop: 2 },

  // Buttons
  primaryButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 16, paddingHorizontal: 32,
    borderRadius: 16, width: '100%', gap: 8
  },
  primaryButtonText: { color: '#FFF', fontWeight: '700', fontSize: 16 },
  secondaryBtn: {
    paddingVertical: 16, paddingHorizontal: 24,
    borderRadius: 16, backgroundColor: '#F1F5F9',
    marginRight: 12
  },
  secondaryBtnText: { color: '#64748B', fontWeight: '700', fontSize: 16 },

  // Capture
  captureWrapper: { width: '100%' },
  scannerModal: { marginBottom: 20 },
  cancelButton: { padding: 12, alignItems: 'center', marginTop: 10 },
  cancelButtonText: { color: '#64748B', fontWeight: '600' },
  
  aiButton: {
    flexDirection: 'row', alignItems: 'center',
    padding: 20, borderRadius: 20, gap: 16,
    shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 10, elevation: 8
  },
  aiButtonTitle: { color: '#FFF', fontSize: 16, fontWeight: '700' },
  aiButtonSubtitle: { color: '#94A3B8', fontSize: 13 },

  sectionHeader: { fontSize: 16, fontWeight: '600', color: '#64748B', marginBottom: 16, textAlign: 'center' },
  gridContainer: { gap: 16 },
  uploadBox: {
    width: '100%', height: 200,
    borderRadius: 20,
    backgroundColor: '#F8FAFC', // Very light gray/blue
    borderWidth: 2, borderColor: '#E2E8F0', borderStyle: 'dashed',
    overflow: 'hidden', justifyContent: 'center', alignItems: 'center'
  },
  uploadBoxActive: {
    backgroundColor: '#FFF',
    borderWidth: 0, borderStyle: 'solid',
    shadowColor: '#0EA5E9', shadowOpacity: 0.1, shadowRadius: 10, elevation: 4
  },
  uploadPlaceholder: { alignItems: 'center' },
  uploadIconCircle: {
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: '#E0F2FE', justifyContent: 'center', alignItems: 'center',
    marginBottom: 12
  },
  uploadLabel: { fontSize: 16, fontWeight: '600', color: '#475569' },
  uploadSub: { fontSize: 13, color: '#94A3B8' },
  uploadedImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  checkBadge: {
    position: 'absolute', top: 10, right: 10,
    width: 24, height: 24, borderRadius: 12,
    backgroundColor: '#22C55E', justifyContent: 'center', alignItems: 'center',
    borderWidth: 2, borderColor: '#FFF'
  },
  continueBtn: {
    marginTop: 30, backgroundColor: '#0EA5E9',
    paddingVertical: 18, borderRadius: 16, alignItems: 'center',
    shadowColor: '#0EA5E9', shadowOpacity: 0.3, shadowOffset: {width: 0, height: 4}, shadowRadius: 8
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
    position: 'absolute', bottom: 10, left: 10,
    backgroundColor: 'rgba(15, 23, 42, 0.8)',
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8
  },
  reviewLabelText: { color: '#FFF', fontSize: 12, fontWeight: '600' },
  actionRow: { flexDirection: 'row', gap: 12 },

  // Processing
  centerContent: { alignItems: 'center', justifyContent: 'center', marginTop: 100 },
  processingCircle: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: '#E0F2FE', justifyContent: 'center', alignItems: 'center',
    marginBottom: 20
  },
  processingTitle: { fontSize: 20, fontWeight: '700', color: '#0F172A' },
  processingDesc: { fontSize: 14, color: '#64748B', marginTop: 8 },
  
  // Secondary button
  secondaryButton: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  secondaryButtonText: { color: '#64748B', fontWeight: '700', fontSize: 16 },
  
  // Recommend box
  recommendBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 10,
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  recommendText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#059669',
    flex: 1,
  },
});

export default VerifyCccdScreen