import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  StatusBar,
  ScrollView,
  Image,
  Alert,
  Modal,
  TextInput,
  Dimensions,
  Platform,
} from 'react-native'

import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter, useLocalSearchParams } from 'expo-router'
import { Ionicons, Feather, MaterialIcons, FontAwesome5 } from '@expo/vector-icons'
import * as ImagePicker from 'expo-image-picker'
import DateTimePicker from '@react-native-community/datetimepicker'
import { VehicleDetail, VehicleImageType, DocumentType, DocumentStatus } from '@/models/types'
import vehicleService from '@/services/vehicleService'

const { width } = Dimensions.get('window')

interface Props {
  onBack?: () => void
}

const VehicleDetailScreen: React.FC<Props> = ({ onBack }) => {
  const router = useRouter()
  const { id } = useLocalSearchParams()
  const [vehicle, setVehicle] = useState<VehicleDetail | null>(null)
  const [loading, setLoading] = useState(true)

  // Upload modal states
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [uploadDocType, setUploadDocType] = useState<DocumentType | null>(null)
  const [frontImage, setFrontImage] = useState<{ uri?: string; imageURL?: string; fileName?: string; type?: string } | null>(null)
  const [backImage, setBackImage] = useState<{ uri?: string; imageURL?: string; fileName?: string; type?: string } | null>(null)
  const [expirationDate, setExpirationDate] = useState<Date | null>(null)
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    if (id) fetchVehicleDetail()
  }, [id])

  const fetchVehicleDetail = async () => {
    try {
      setLoading(true)
      const res: any = await vehicleService.getVehicleById(String(id))
      const data = res?.result ?? res

      // Map backend DTO to VehicleDetail
      const mapped: VehicleDetail = {
        vehicleId: data.vehicleId,
        id: data.vehicleId,
        plateNumber: data.plateNumber,
        model: data.model,
        brand: data.brand,
        color: data.color,
        yearOfManufacture: data.yearOfManufacture,
        payloadInKg: data.payloadInKg,
        volumeInM3: data.volumeInM3,
        status: data.status,
        vehicleType: data.vehicleType,
        owner: data.owner,
        imageUrls: data.imageUrls || [],
        documents: data.documents || [],
      }

      setVehicle(mapped)
    } catch (e: any) {
      console.error('fetchVehicleDetail error:', e)
      Alert.alert('Lỗi', 'Không thể tải thông tin xe')
    } finally {
      setLoading(false)
    }
  }

  // --- Helper Functions for UI Colors ---
  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'ACTIVE': return { bg: '#ECFDF5', text: '#059669', label: 'Hoạt động' }
      case 'IN_USE': return { bg: '#FFFBEB', text: '#D97706', label: 'Đang sử dụng' }
      case 'INACTIVE': return { bg: '#F3F4F6', text: '#4B5563', label: 'Không hoạt động' }
      case 'DELETED': return { bg: '#FEF2F2', text: '#DC2626', label: 'Đã xóa' }
      default: return { bg: '#F3F4F6', text: '#4B5563', label: status }
    }
  }

  const getDocStatusStyle = (status: DocumentStatus) => {
    switch (status) {
      case DocumentStatus.APPROVED: return { color: '#059669', label: 'Đã duyệt', bg: '#D1FAE5', border: '#10B981' }
      case DocumentStatus.PENDING: return { color: '#D97706', label: 'Chờ duyệt', bg: '#FEF3C7', border: '#F59E0B' }
      case DocumentStatus.REJECTED: return { color: '#DC2626', label: 'Từ chối', bg: '#FEE2E2', border: '#EF4444' }
      default: return { color: '#6B7280', label: status, bg: '#F3F4F6', border: '#9CA3AF' }
    }
  }

  const getDocTypeLabel = (type: DocumentType) => {
    switch (type) {
      case DocumentType.VEHICLE_LICENSE: return 'Giấy tờ xe'
      case DocumentType.CIVIL_INSURANCE: return 'Bảo hiểm dân sự'
      case DocumentType.PHYSICAL_INSURANCE: return 'Bảo hiểm vật chất'
      case DocumentType.DRIVER_LICENSE: return 'Bằng lái xe'
      case DocumentType.CCCD: return 'CCCD'
      default: return type
    }
  }

  // --- Handlers ---
  const handleUploadDocument = (docType: DocumentType) => {
    setUploadDocType(docType)
    setFrontImage(null)
    setBackImage(null)
    setExpirationDate(null)
    setShowDatePicker(false)
    setShowUploadModal(true)
  }

  const pickFrontImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (status !== 'granted') {
      Alert.alert('Cần quyền', 'Vui lòng cấp quyền truy cập thư viện ảnh.')
      return
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      quality: 0.5,
      base64: true,
    })

    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0]
      const dataUrl = asset.base64 ? `data:image/jpeg;base64,${asset.base64}` : undefined

      setFrontImage({
        uri: asset.uri,
        imageURL: dataUrl,
        fileName: asset.fileName || `front_${Date.now()}.jpg`,
        type: 'image/jpeg', // Always use proper MIME type
      })
    }
  }

  const pickBackImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (status !== 'granted') {
      Alert.alert('Cần quyền', 'Vui lòng cấp quyền truy cập thư viện ảnh.')
      return
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      quality: 0.5,
      base64: true,
    })

    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0]
      const dataUrl = asset.base64 ? `data:image/jpeg;base64,${asset.base64}` : undefined

      setBackImage({
        uri: asset.uri,
        imageURL: dataUrl,
        fileName: asset.fileName || `back_${Date.now()}.jpg`,
        type: 'image/jpeg', // Always use proper MIME type
      })
    }
  }

  const handleSubmitUpload = async () => {
    if (!uploadDocType || !frontImage || !id) {
      Alert.alert('Lỗi', 'Vui lòng chọn ảnh mặt trước')
      return
    }

    setUploading(true)
    try {
      let backendDocType: string = uploadDocType
      const docTypeStr = String(uploadDocType)
      if (docTypeStr === 'VEHICLE_LICENSE' || docTypeStr.includes('VEHICLE_LICENSE')) {
        backendDocType = 'VEHICLE_LINCENSE' // Backend typo fix
      }

      // Sử dụng trực tiếp frontImage và backImage vì đã có dataUrl
      await vehicleService.addVehicleDocument(String(id), {
        documentType: backendDocType,
        expirationDate: expirationDate ? expirationDate.toISOString().split('T')[0] : undefined,
        frontFile: frontImage, // Đã có dataUrl từ ImageUploader
        backFile: backImage || undefined,
      })

      setShowUploadModal(false)
      Alert.alert('Thành công', 'Upload giấy tờ thành công!', [
        {
          text: 'OK',
          onPress: () => {
            fetchVehicleDetail()
          }
        }
      ])
      // Load lại ngay lập tức
      fetchVehicleDetail()
    } catch (e: any) {
      Alert.alert('Lỗi', e?.response?.data?.message || 'Không thể upload giấy tờ')
    } finally {
      setUploading(false)
    }
  }

  // --- Render Components ---

  // 1. Info Grid Item Component for cleaner code
  const InfoItem = ({ icon, label, value, color = '#6B7280' }: any) => (
    <View style={styles.infoGridItem}>
      <View style={[styles.infoIconBox, { backgroundColor: `${color}15` }]}>
        {icon}
      </View>
      <View>
        <Text style={styles.infoGridLabel}>{label}</Text>
        <Text style={styles.infoGridValue} numberOfLines={1}>{value || '---'}</Text>
      </View>
    </View>
  )

  const renderUploadModal = () => {
    if (!uploadDocType) return null

    return (
      <Modal
        visible={showUploadModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowUploadModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Cập nhật {getDocTypeLabel(uploadDocType)}</Text>
              <TouchableOpacity onPress={() => setShowUploadModal(false)} style={styles.closeBtn}>
                <Ionicons name="close" size={20} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              <View style={styles.uploadSection}>
                <Text style={styles.uploadLabel}>Mặt trước <Text style={styles.required}>*</Text></Text>
                {frontImage?.uri || frontImage?.imageURL ? (
                  <View style={styles.imagePreviewWrapper}>
                    <Image 
                      source={{ uri: frontImage.imageURL || frontImage.uri }} 
                      style={styles.imagePreview} 
                      resizeMode="cover" 
                    />
                    <TouchableOpacity style={styles.changeImageBtn} onPress={pickFrontImage}>
                      <Ionicons name="camera-outline" size={18} color="#fff" />
                      <Text style={styles.changeImageText}>Đổi ảnh</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.removeImageBtn} onPress={() => setFrontImage(null)}>
                      <Ionicons name="trash-outline" size={18} color="#fff" />
                    </TouchableOpacity>
                  </View>
                ) : (
                  <TouchableOpacity style={styles.uploadPlaceholder} onPress={pickFrontImage}>
                    <View style={styles.iconCircle}>
                      <Ionicons name="camera-outline" size={28} color="#10439F" />
                    </View>
                    <Text style={styles.uploadText}>Tải ảnh mặt trước</Text>
                    <Text style={styles.uploadSubText}>Hỗ trợ JPG, PNG</Text>
                  </TouchableOpacity>
                )}
              </View>

              <View style={styles.uploadSection}>
                <Text style={styles.uploadLabel}>Mặt sau (Tùy chọn)</Text>
                {backImage?.uri || backImage?.imageURL ? (
                  <View style={styles.imagePreviewWrapper}>
                    <Image 
                      source={{ uri: backImage.imageURL || backImage.uri }} 
                      style={styles.imagePreview} 
                      resizeMode="cover" 
                    />
                    <TouchableOpacity style={styles.changeImageBtn} onPress={pickBackImage}>
                      <Ionicons name="camera-outline" size={18} color="#fff" />
                      <Text style={styles.changeImageText}>Đổi ảnh</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.removeImageBtn} onPress={() => setBackImage(null)}>
                      <Ionicons name="trash-outline" size={18} color="#fff" />
                    </TouchableOpacity>
                  </View>
                ) : (
                  <TouchableOpacity style={styles.uploadPlaceholder} onPress={pickBackImage}>
                    <View style={styles.iconCircle}>
                      <Ionicons name="camera-outline" size={28} color="#10439F" />
                    </View>
                    <Text style={styles.uploadText}>Tải ảnh mặt sau</Text>
                    <Text style={styles.uploadSubText}>Hỗ trợ JPG, PNG</Text>
                  </TouchableOpacity>
                )}
              </View>

              <View style={styles.uploadSection}>
                <Text style={styles.uploadLabel}>Ngày hết hạn</Text>
                <TouchableOpacity 
                  style={styles.datePickerButton}
                  onPress={() => setShowDatePicker(true)}
                >
                  <Ionicons name="calendar-outline" size={18} color="#6B7280" />
                  <Text style={[styles.datePickerText, !expirationDate && styles.datePickerPlaceholder]}>
                    {expirationDate 
                      ? expirationDate.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })
                      : 'Chọn ngày hết hạn'
                    }
                  </Text>
                  {expirationDate && (
                    <TouchableOpacity 
                      onPress={() => setExpirationDate(null)}
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                      <Ionicons name="close-circle" size={18} color="#9CA3AF" />
                    </TouchableOpacity>
                  )}
                </TouchableOpacity>
                
                {showDatePicker && (
                  <DateTimePicker
                    value={expirationDate || new Date()}
                    mode="date"
                    display="default"
                    minimumDate={new Date()}
                    onChange={(event, selectedDate) => {
                      setShowDatePicker(Platform.OS === 'ios')
                      if (event.type === 'set' && selectedDate) {
                        setExpirationDate(selectedDate)
                      }
                    }}
                  />
                )}
              </View>

              <View style={styles.noteBox}>
                <Ionicons name="information-circle" size={18} color="#10439F" />
                <Text style={styles.noteText}>
                  Giấy tờ sẽ được gửi đến Admin để xét duyệt. Vui lòng đảm bảo ảnh chụp rõ nét.
                </Text>
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowUploadModal(false)}>
                <Text style={styles.cancelBtnText}>Hủy bỏ</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.submitBtn, (!frontImage || uploading) && styles.submitBtnDisabled]}
                onPress={handleSubmitUpload}
                disabled={!frontImage || uploading}
              >
                {uploading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.submitBtnText}>Xác nhận Upload</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    )
  }

  if (loading) {
    return (
      <SafeAreaView edges={['top', 'left', 'right']}  style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#10439F" />
        <Text style={styles.loadingText}>Đang tải thông tin xe...</Text>
      </SafeAreaView>
    )
  }

  if (!vehicle) {
    return (
      <SafeAreaView edges={['top', 'left', 'right']} style={styles.container}>
        <Text style={styles.errorText}>Không tìm thấy thông tin xe</Text>
      </SafeAreaView>
    )
  }

  // Group Images by caption (API returns caption instead of imageType)
  const overviewImages = vehicle.imageUrls.filter(img => {
    const caption = (img as any).caption?.toLowerCase() || ''
    return caption.includes('toàn cảnh') || caption.includes('overview') || img.imageType === VehicleImageType.OVERVIEW || (img.imageType as any) === 'OVERVIEW'
  })
  const licensePlateImages = vehicle.imageUrls.filter(img => {
    const caption = (img as any).caption?.toLowerCase() || ''
    return caption.includes('biển số') || caption.includes('license') || caption.includes('plate') || img.imageType === VehicleImageType.LICENSE_PLATE || (img.imageType as any) === 'LICENSE_PLATE'
  })
  const otherImages = vehicle.imageUrls.filter(img => {
    const caption = (img as any).caption?.toLowerCase() || ''
    return !caption.includes('toàn cảnh') && !caption.includes('biển số') && !caption.includes('overview') && !caption.includes('license') && !caption.includes('plate') && (!img.imageType || img.imageType === VehicleImageType.OTHER || (img.imageType as any) === 'OTHER')
  })

  // Documents
  const vehicleLicenseDoc = vehicle.documents.find(d => d.documentType === DocumentType.VEHICLE_LICENSE || (d.documentType as any) === 'VEHICLE_LICENSE' || (d.documentType as any) === 'VEHICLE_LINCENSE')
  const physicalInsuranceDoc = vehicle.documents.find(d => d.documentType === DocumentType.PHYSICAL_INSURANCE || (d.documentType as any) === 'PHYSICAL_INSURANCE')

  const statusStyle = getStatusStyle(vehicle.status || '');

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F9FAFB" />

      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack || (() => router.back())} style={styles.headerBtn}>
          <View style={styles.backBtnCircle}>
            <Ionicons name="arrow-back" size={20} color="#111827" />
          </View>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Chi tiết phương tiện</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
        
        {/* 1. IDENTITY CARD */}
        <View style={styles.mainCard}>
          <View style={styles.plateContainer}>
            <View style={styles.plateBorder}>
              <Text style={styles.plateNumber}>{vehicle.plateNumber}</Text>
            </View>
          </View>
          
          <View style={styles.statusRow}>
            <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}>
              <View style={[styles.statusDot, { backgroundColor: statusStyle.text }]} />
              <Text style={[styles.statusText, { color: statusStyle.text }]}>{statusStyle.label}</Text>
            </View>
          </View>

          <View style={styles.divider} />

          {/* SPECIFICATION GRID */}
          <View style={styles.gridContainer}>
            <InfoItem 
              icon={<FontAwesome5 name="car" size={14} color="#10439F" />}
              label="Hãng xe"
              value={vehicle.brand}
              color="#10439F"
            />
            <InfoItem 
              icon={<FontAwesome5 name="car-side" size={14} color="#059669" />}
              label="Mẫu xe"
              value={vehicle.model}
              color="#059669"
            />
            <InfoItem 
              icon={<Ionicons name="color-palette" size={16} color="#7C3AED" />}
              label="Màu sắc"
              value={vehicle.color}
              color="#7C3AED"
            />
            <InfoItem 
              icon={<Ionicons name="calendar" size={16} color="#EA580C" />}
              label="Năm SX"
              value={vehicle.yearOfManufacture}
              color="#EA580C"
            />
            <InfoItem 
              icon={<FontAwesome5 name="weight-hanging" size={14} color="#DB2777" />}
              label="Tải trọng"
              value={vehicle.payloadInKg ? `${vehicle.payloadInKg} kg` : null}
              color="#DB2777"
            />
            <InfoItem 
              icon={<FontAwesome5 name="box-open" size={14} color="#2563EB" />}
              label="Thể tích"
              value={vehicle.volumeInM3 ? `${vehicle.volumeInM3} m³` : null}
              color="#2563EB"
            />
          </View>
          
           <View style={styles.typeRow}>
             <Text style={styles.typeLabel}>Loại phương tiện:</Text>
             <Text style={styles.typeValue}>{vehicle.vehicleType?.vehicleTypeName || 'Chưa phân loại'}</Text>
           </View>
        </View>

        {/* 2. DOCUMENTS SECTION */}
        <Text style={styles.sectionHeader}>Hồ sơ pháp lý</Text>
        
        {/* Required Doc */}
        <View style={styles.docContainer}>
           <View style={[styles.docStatusIndicator, { backgroundColor: vehicleLicenseDoc ? getDocStatusStyle(vehicleLicenseDoc.status).border : '#D1D5DB' }]} />
           <View style={styles.docContent}>
              <View style={styles.docTopRow}>
                <View style={styles.docTitleBlock}>
                  <Text style={styles.docTitle}>Giấy Tờ Xe</Text>
                  <View style={styles.badgeRequired}><Text style={styles.badgeRequiredText}>BẮT BUỘC</Text></View>
                </View>
                {vehicleLicenseDoc ? (
                  <Text style={[styles.docStatusText, { color: getDocStatusStyle(vehicleLicenseDoc.status).color }]}>
                    {getDocStatusStyle(vehicleLicenseDoc.status).label}
                  </Text>
                ) : (
                   <Text style={[styles.docStatusText, { color: '#DC2626' }]}>Chưa có</Text>
                )}
              </View>

              {vehicleLicenseDoc ? (
                <View style={styles.docPreviewRow}>
                   {vehicleLicenseDoc.frontDocumentUrl && <Image source={{uri: vehicleLicenseDoc.frontDocumentUrl}} style={styles.miniDocImg} />}
                   {vehicleLicenseDoc.backDocumentUrl && <Image source={{uri: vehicleLicenseDoc.backDocumentUrl}} style={styles.miniDocImg} />}
                </View>
              ) : (
                <Text style={styles.missingDocText}>Vui lòng cập nhật giấy tờ để xe được phép hoạt động.</Text>
              )}

              <TouchableOpacity 
                style={styles.actionBtn} 
                onPress={() => handleUploadDocument(DocumentType.VEHICLE_LICENSE)}
              >
                <Text style={styles.actionBtnText}>{vehicleLicenseDoc ? 'Cập nhật lại' : 'Upload ngay'}</Text>
                <Feather name="chevron-right" size={16} color="#10439F" />
              </TouchableOpacity>
           </View>
        </View>

        {/* Optional Doc */}
        <View style={styles.docContainer}>
           <View style={[styles.docStatusIndicator, { backgroundColor: physicalInsuranceDoc ? getDocStatusStyle(physicalInsuranceDoc.status).border : '#E5E7EB' }]} />
           <View style={styles.docContent}>
              <View style={styles.docTopRow}>
                <View style={styles.docTitleBlock}>
                  <Text style={styles.docTitle}>Bảo hiểm vật chất</Text>
                  <View style={styles.badgeOptional}><Text style={styles.badgeOptionalText}>TÙY CHỌN</Text></View>
                </View>
                {physicalInsuranceDoc && (
                   <Text style={[styles.docStatusText, { color: getDocStatusStyle(physicalInsuranceDoc.status).color }]}>
                    {getDocStatusStyle(physicalInsuranceDoc.status).label}
                  </Text>
                )}
              </View>

               {physicalInsuranceDoc && (
                <View style={styles.docPreviewRow}>
                   {physicalInsuranceDoc.frontDocumentUrl && <Image source={{uri: physicalInsuranceDoc.frontDocumentUrl}} style={styles.miniDocImg} />}
                   {physicalInsuranceDoc.backDocumentUrl && <Image source={{uri: physicalInsuranceDoc.backDocumentUrl}} style={styles.miniDocImg} />}
                </View>
              )}

              <TouchableOpacity 
                style={styles.actionBtn} 
                onPress={() => handleUploadDocument(DocumentType.PHYSICAL_INSURANCE)}
              >
                <Text style={styles.actionBtnText}>{physicalInsuranceDoc ? 'Cập nhật bảo hiểm' : 'Thêm bảo hiểm'}</Text>
                <Feather name="chevron-right" size={16} color="#10439F" />
              </TouchableOpacity>
           </View>
        </View>

        {/* 3. IMAGES SECTION */}
        <Text style={styles.sectionHeader}>Hình ảnh thực tế</Text>
        
        {overviewImages.length > 0 && (
          <View style={styles.imageSection}>
            <View style={styles.imageSectionHeader}>
              <Ionicons name="camera-outline" size={18} color="#4B5563" />
              <Text style={styles.imageSectionTitle}>Toàn cảnh</Text>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalImages}>
              {overviewImages.map((img, idx) => (
                <Image key={idx} source={{ uri: img.imageURL }} style={styles.galleryImage} />
              ))}
            </ScrollView>
          </View>
        )}

        {licensePlateImages.length > 0 && (
          <View style={styles.imageSection}>
             <View style={styles.imageSectionHeader}>
              <Ionicons name="scan-outline" size={18} color="#4B5563" />
              <Text style={styles.imageSectionTitle}>Biển số</Text>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalImages}>
              {licensePlateImages.map((img, idx) => (
                <Image key={idx} source={{ uri: img.imageURL }} style={styles.galleryImage} />
              ))}
            </ScrollView>
          </View>
        )}

        {vehicle.imageUrls.length === 0 && (
          <View style={styles.emptyStateBox}>
             <Feather name="image" size={40} color="#D1D5DB" />
             <Text style={styles.emptyStateText}>Chưa có hình ảnh nào về phương tiện này</Text>
          </View>
        )}

      </ScrollView>

      {/* Upload Modal */}
      {renderUploadModal()}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  loadingText: {
    marginTop: 12,
    color: '#6B7280',
    fontSize: 14,
  },
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  
  // HEADER
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
  },
  headerBtn: {
    padding: 4,
  },
  backBtnCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#111827',
  },

  scrollView: {
    flex: 1,
  },
  
  // MAIN IDENTITY CARD
  mainCard: {
    backgroundColor: '#FFFFFF',
    margin: 16,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  plateContainer: {
    alignItems: 'center',
    marginBottom: 8,
  },
  plateBorder: {
    borderWidth: 2,
    borderColor: '#111827',
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#FFF',
  },
  plateNumber: {
    fontSize: 24,
    fontWeight: '800',
    color: '#111827',
    fontVariant: ['tabular-nums'], // Helps numbers align better
    letterSpacing: 1,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 16,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginBottom: 16,
  },
  
  // SPECS GRID
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  infoGridItem: {
    width: '48%', // 2 columns
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    backgroundColor: '#F9FAFB',
    padding: 10,
    borderRadius: 10,
  },
  infoIconBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  infoGridLabel: {
    fontSize: 11,
    color: '#6B7280',
    marginBottom: 2,
  },
  infoGridValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1F2937',
  },
  typeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
    backgroundColor: '#EFF6FF',
    padding: 8,
    borderRadius: 8,
  },
  typeLabel: {
    fontSize: 13,
    color: '#10439F',
    marginRight: 6,
  },
  typeValue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#10439F',
  },

  // SECTION HEADERS
  sectionHeader: {
    fontSize: 16,
    fontWeight: '700',
    color: '#374151',
    marginLeft: 16,
    marginBottom: 12,
    marginTop: 8,
  },

  // DOCUMENTS
  docContainer: {
    marginHorizontal: 16,
    marginBottom: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    flexDirection: 'row',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  docStatusIndicator: {
    width: 6,
    height: '100%',
  },
  docContent: {
    flex: 1,
    padding: 14,
  },
  docTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  docTitleBlock: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  docTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
  },
  badgeRequired: {
    backgroundColor: '#FEF2F2',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 8,
  },
  badgeRequiredText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#DC2626',
  },
  badgeOptional: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 8,
  },
  badgeOptionalText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#2563EB',
  },
  docStatusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  docPreviewRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
    marginBottom: 12,
  },
  miniDocImg: {
    width: 60,
    height: 45,
    borderRadius: 4,
    backgroundColor: '#E5E7EB',
  },
  missingDocText: {
    fontSize: 13,
    color: '#6B7280',
    fontStyle: 'italic',
    marginBottom: 12,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  actionBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#10439F',
  },

  // IMAGES
  imageSection: {
    marginHorizontal: 16,
    marginBottom: 20,
  },
  imageSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    marginLeft: 4,
  },
  imageSectionTitle: {
    fontSize: 13,
    color: '#4B5563',
    fontWeight: '500',
    marginLeft: 6,
  },
  horizontalImages: {
    flexDirection: 'row',
  },
  galleryImage: {
    width: width * 0.45,
    height: width * 0.3,
    borderRadius: 8,
    marginRight: 10,
    backgroundColor: '#E5E7EB',
  },
  emptyStateBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 30,
    backgroundColor: '#F9FAFB',
    marginBottom: 20,
  },
  emptyStateText: {
    fontSize: 13,
    color: '#9CA3AF',
    marginTop: 8,
  },
  errorText: {
    fontSize: 16,
    color: '#DC2626',
    textAlign: 'center',
    marginTop: 50,
  },

  // MODAL
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  closeBtn: {
    padding: 4,
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
  },
  modalBody: {
    padding: 20,
  },
  uploadSection: {
    marginBottom: 20,
  },
  uploadLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  imagePreviewWrapper: {
    width: '100%',
    height: 160,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#F3F4F6',
  },
  imagePreview: {
    width: '100%',
    height: '100%',
  },
  changeImageBtn: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 16,
  },
  changeImageText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
    marginLeft: 4,
  },
  removeImageBtn: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(239, 68, 68, 0.9)',
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  uploadPlaceholder: {
    width: '100%',
    height: 120,
    borderWidth: 1.5,
    borderColor: '#D1D5DB',
    borderStyle: 'dashed',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  uploadText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#10439F',
  },
  uploadSubText: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 2,
  },
  required: {
    color: '#EF4444',
  },
  datePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: '#FFF',
    gap: 10,
  },
  datePickerText: {
    flex: 1,
    fontSize: 15,
    color: '#111827',
  },
  datePickerPlaceholder: {
    color: '#9CA3AF',
  },
  noteBox: {
    flexDirection: 'row',
    backgroundColor: '#EFF6FF',
    padding: 12,
    borderRadius: 8,
    gap: 8,
    marginBottom: 20,
  },
  noteText: {
    fontSize: 12,
    color: '#1E40AF',
    flex: 1,
    lineHeight: 18,
  },
  modalFooter: {
    flexDirection: 'row',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    gap: 12,
    paddingBottom: 30, // For iOS home bar
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
  },
  cancelBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#4B5563',
  },
  submitBtn: {
    flex: 2,
    paddingVertical: 14,
    borderRadius: 10,
    backgroundColor: '#10439F',
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitBtnDisabled: {
    backgroundColor: '#9CA3AF',
  },
  submitBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
})

export default VehicleDetailScreen