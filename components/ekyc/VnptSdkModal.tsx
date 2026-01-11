import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  NativeModules,
  Alert,
  Dimensions,
} from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons'
import WebCccdScanner from './WebCccdScanner'

const { width, height } = Dimensions.get('window')

interface VnptSdkConfig {
  accessToken: string
  tokenId: string
  tokenKey: string
}

export type DocumentScanType = 'cccd' | 'license' | 'health_check'

interface VnptSdkModalProps {
  visible: boolean
  config: VnptSdkConfig
  scanType: DocumentScanType
  onResult: (result: any) => void
  onError: (error: string) => void
  onCancel: () => void
}

const VnptSdkModal: React.FC<VnptSdkModalProps> = ({
  visible,
  config,
  scanType,
  onResult,
  onError,
  onCancel,
}) => {
  const [scanning, setScanning] = useState(false)
  const [currentStep, setCurrentStep] = useState<'front' | 'back' | 'selfie' | 'processing'>('front')
  const [capturedImages, setCapturedImages] = useState<any>({})

  useEffect(() => {
    if (visible && Platform.OS !== 'web') {
      initializeAndroidSdk()
    }
  }, [visible])

  const initializeAndroidSdk = async () => {
    if (Platform.OS === 'web') return
    
    try {
      if (NativeModules.VnptCccdModule) {
        // QUAN TRỌNG: Config SDK CHỈ lấy ảnh, KHÔNG upload
        const sdkConfig = {
          ...config,
          IS_UPLOAD_IMAGE: false,  // Tắt auto upload
          IS_SAVE_IMAGE: false,    // Không lưu file
          RETURN_BASE64: true,     // Trả về base64
        }
        await NativeModules.VnptCccdModule.initializeSdk(sdkConfig)
        console.log('✅ VNPT SDK initialized on Android (no auto-upload)')
      }
    } catch (error) {
      console.error('❌ Failed to initialize VNPT SDK:', error)
      onError('Không thể khởi tạo SDK')
    }
  }

  const scanWithAndroidSdk = async (step: 'front' | 'back' | 'selfie') => {
    if (Platform.OS === 'web' || !NativeModules.VnptCccdModule) {
      onError('SDK chỉ khả dụng trên Android')
      return
    }

    try {
      setScanning(true)
      let result: any

      switch (step) {
        case 'front':
          // SDK CHỈ lấy ảnh, trả về base64, KHÔNG upload
          if (scanType === 'cccd') {
            result = await NativeModules.VnptCccdModule.scanCccdFront()
          } else if (scanType === 'license') {
            result = await NativeModules.VnptCccdModule.scanLicenseFront()
          } else {
            result = await NativeModules.VnptCccdModule.scanDocument()
          }
          console.log('✅ SDK captured front image (base64 length:', result.base64?.length || 0, ')')
          setCapturedImages((prev: any) => ({ ...prev, front: result }))
          
          // Determine next step based on scanType
          if (scanType === 'cccd') {
            setCurrentStep('back')
          } else if (scanType === 'license') {
            setCurrentStep('selfie')
          } else {
            // Health check only needs one image
            setCurrentStep('processing')
            onResult({ front_image: result.base64 })
          }
          break

        case 'back':
          result = await NativeModules.VnptCccdModule.scanCccdBack()
          console.log('✅ SDK captured back image (base64 length:', result.base64?.length || 0, ')')
          setCapturedImages((prev: any) => ({ ...prev, back: result }))
          setCurrentStep('selfie')
          break

        case 'selfie':
          result = await NativeModules.VnptCccdModule.captureSelfie()
          console.log('✅ SDK captured selfie (base64 length:', result.base64?.length || 0, ')')
          setCapturedImages((prev: any) => ({ ...prev, selfie: result }))
          setCurrentStep('processing')
          
          // Gửi tất cả ảnh về component cha (CHỈ base64, không upload)
          const finalResult = {
            front_image: capturedImages.front?.base64,
            back_image: capturedImages.back?.base64 || null,
            face_image: result.base64,
          }
          console.log('✅ Sending all images to parent component')
          onResult(finalResult)
          break
      }

      setScanning(false)
    } catch (error: any) {
      setScanning(false)
      onError(error.message || 'Lỗi khi quét tài liệu')
    }
  }

  const handleWebScannerResult = (result: any) => {
    onResult(result)
  }

  const handleWebScannerError = (error: string) => {
    onError(error)
  }

  const renderAndroidScanner = () => {
    const stepInfo = {
      front: {
        title: scanType === 'cccd' ? 'Quét mặt trước CCCD' : scanType === 'license' ? 'Quét mặt trước GPLX' : 'Quét giấy khám sức khỏe',
        icon: 'card-account-details-outline' as any,
        color: '#0EA5E9',
      },
      back: {
        title: 'Quét mặt sau CCCD',
        icon: 'card-account-details' as any,
        color: '#0EA5E9',
      },
      selfie: {
        title: 'Chụp ảnh chân dung',
        icon: 'face-recognition' as any,
        color: '#10B981',
      },
      processing: {
        title: 'Đang xử lý...',
        icon: 'loading' as any,
        color: '#F59E0B',
      },
    }

    const current = stepInfo[currentStep]

    return (
      <View style={styles.modalContent}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>{current.title}</Text>
          <TouchableOpacity onPress={onCancel} style={styles.closeButton}>
            <Ionicons name="close" size={24} color="#64748B" />
          </TouchableOpacity>
        </View>

        <View style={styles.scannerBody}>
          <View style={[styles.iconCircle, { backgroundColor: `${current.color}20` }]}>
            <MaterialCommunityIcons name={current.icon} size={80} color={current.color} />
          </View>

          <Text style={styles.instructionText}>
            {currentStep === 'front' && 'Đặt giấy tờ vào khung hình, SDK sẽ tự động chụp khi đạt chất lượng'}
            {currentStep === 'back' && 'Lật sang mặt sau và đặt vào khung hình'}
            {currentStep === 'selfie' && 'Nhìn thẳng vào camera, giữ khuôn mặt trong khung'}
            {currentStep === 'processing' && 'Vui lòng chờ trong giây lát...'}
          </Text>

          {scanning ? (
            <ActivityIndicator size="large" color={current.color} style={{ marginTop: 30 }} />
          ) : currentStep !== 'processing' ? (
            <TouchableOpacity onPress={() => scanWithAndroidSdk(currentStep)} activeOpacity={0.8}>
              <LinearGradient colors={[current.color, current.color + 'DD']} style={styles.scanButton}>
                <MaterialCommunityIcons name="camera" size={24} color="#FFF" />
                <Text style={styles.scanButtonText}>Bắt đầu quét</Text>
              </LinearGradient>
            </TouchableOpacity>
          ) : (
            <ActivityIndicator size="large" color={current.color} style={{ marginTop: 30 }} />
          )}
        </View>

        {/* Progress indicator */}
        <View style={styles.progressContainer}>
          {scanType === 'cccd' && (
            <>
              <View style={[styles.progressDot, currentStep === 'front' && styles.progressDotActive]} />
              <View style={[styles.progressDot, currentStep === 'back' && styles.progressDotActive]} />
              <View style={[styles.progressDot, currentStep === 'selfie' && styles.progressDotActive]} />
            </>
          )}
          {scanType === 'license' && (
            <>
              <View style={[styles.progressDot, currentStep === 'front' && styles.progressDotActive]} />
              <View style={[styles.progressDot, currentStep === 'selfie' && styles.progressDotActive]} />
            </>
          )}
          {scanType === 'health_check' && (
            <View style={[styles.progressDot, styles.progressDotActive]} />
          )}
        </View>
      </View>
    )
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onCancel}
    >
      <View style={styles.overlay}>
        {Platform.OS === 'web' ? (
          <View style={styles.webContainer}>
            <View style={styles.webHeader}>
              <Text style={styles.webTitle}>eKYC Scanner</Text>
              <TouchableOpacity onPress={onCancel} style={styles.closeButton}>
                <Ionicons name="close" size={24} color="#64748B" />
              </TouchableOpacity>
            </View>
            <WebCccdScanner
              config={config}
              onResult={handleWebScannerResult}
              onError={handleWebScannerError}
              onCancel={onCancel}
              style={styles.webScanner}
            />
          </View>
        ) : (
          renderAndroidScanner()
        )}
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: width * 0.9,
    maxWidth: 500,
    backgroundColor: '#FFF',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0F172A',
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scannerBody: {
    alignItems: 'center',
    paddingVertical: 20,
    width: '100%',
  },
  iconCircle: {
    width: 160,
    height: 160,
    borderRadius: 80,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  instructionText: {
    fontSize: 15,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 30,
    paddingHorizontal: 20,
  },
  scanButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 16,
    gap: 10,
    minWidth: 200,
  },
  scanButtonText: {
    color: '#FFF',
    fontWeight: '700',
    fontSize: 16,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 20,
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#E2E8F0',
  },
  progressDotActive: {
    backgroundColor: '#0EA5E9',
    width: 24,
  },
  // Web styles
  webContainer: {
    width: width * 0.95,
    maxWidth: 900,
    height: height * 0.85,
    backgroundColor: '#FFF',
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 10,
  },
  webHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    backgroundColor: '#F8FAFC',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  webTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0F172A',
  },
  webScanner: {
    flex: 1,
  },
})

export default VnptSdkModal
