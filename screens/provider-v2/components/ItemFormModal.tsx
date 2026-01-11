

import React, { useState, useEffect } from 'react'
import {
  Modal,
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Pressable,
  Alert,
  Image,
  ActivityIndicator
} from 'react-native'
import * as ImagePicker from 'expo-image-picker'
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons'
import { ItemStatus, ImageStatus } from '../../../models/types'
import { formatVND, parseVND } from '@/utils/currency'

interface ItemFormModalProps {
  visible: boolean
  onClose: () => void
  onSave: (item: any) => void
  item: any | null
}

// Màu sắc chủ đạo (Đồng bộ với VehicleFormModal)
const COLORS = {
  primary: '#0284C7',
  text: '#1F2937',
  textLight: '#6B7280',
  border: '#E5E7EB',
  bg: '#FFFFFF',
  inputBg: '#FFFFFF',
  danger: '#EF4444'
}

// Component Input dùng chung để tránh re-render mất focus
const InputField = ({ label, value, onChange, placeholder, width = '100%', keyboardType = 'default', multiline = false, numberOfLines = 1, editable = true, required = false }: any) => (
  <View style={{ width, marginBottom: 16 }}>
    <Text style={styles.label}>
      {label} {required && <Text style={{ color: COLORS.danger }}>*</Text>}
    </Text>
    <TextInput
      style={[
        styles.input, 
        multiline && { height: 80, textAlignVertical: 'top', paddingTop: 10 },
        !editable && { backgroundColor: '#F3F4F6', color: '#9CA3AF' }
      ]}
      value={String(value || '')}
      onChangeText={onChange}
      placeholder={placeholder}
      placeholderTextColor="#9CA3AF"
      keyboardType={keyboardType}
      multiline={multiline}
      numberOfLines={numberOfLines}
      editable={editable}
    />
  </View>
)

const ItemFormModal: React.FC<ItemFormModalProps> = ({
  visible,
  onClose,
  onSave,
  item,
}) => {
  const [formData, setFormData] = useState<any>({})
  const [submitting, setSubmitting] = useState(false)

  // Reset form khi modal được mở
  useEffect(() => {
    if (visible) {
      setSubmitting(false)
      if (item) {
        setFormData({
          id: item.id ?? item.itemId ?? '',
          itemName: item.itemName ?? item.ItemName ?? '',
          description: item.description ?? item.Description ?? '',
          declaredValue: item.declaredValue ?? item.DeclaredValue ?? 0,
          currency: item.currency ?? item.Currency ?? 'VND',
          status: item.status ?? item.Status ?? ItemStatus.PENDING,
          images: item.images ?? item.ImageUrls ?? [],
          quantity: item.quantity ?? item.Quantity ?? 1,
          unit: item.unit ?? item.Unit ?? 'pcs',
        })
      } else {
        // Reset về form trống
        setFormData({
          id: '',
          itemName: '',
          description: '',
          declaredValue: 0, // store numeric value, display will be formatted
          currency: 'VND',
          status: ItemStatus.PENDING,
          images: [],
          quantity: '1',
          unit: 'pcs',
        })
      }
    }
  }, [item, visible])

  const handleChange = (name: string, value: string | number) => {
    setFormData((prev: any) => ({ ...prev, [name]: value }))
  }

  // Xử lý chọn ảnh trực tiếp (Thay thế ImageUploader cũ để đồng bộ style)
  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (status !== 'granted') {
      Alert.alert('Cần quyền', 'Vui lòng cấp quyền truy cập thư viện ảnh.')
      return
    }
    
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      quality: 0.5, // Giảm từ 0.7 xuống 0.5 để giảm kích thước
      base64: true
    })

    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0]
      const dataUrl = asset.base64 ? `data:image/jpeg;base64,${asset.base64}` : undefined
      
      // Logic cập nhật ảnh (giữ nguyên logic cũ của bạn)
      setFormData((prev: any) => ({
        ...prev,
        images: [
          {
            itemImageId: prev?.images?.[0]?.itemImageId || `img-${Date.now()}`,
            itemImageURL: dataUrl,
            uri: asset.uri,
            status: ImageStatus.ACTIVE,
            fileName: asset.fileName || `photo-${Date.now()}.jpg`,
            type: asset.type || 'image/jpeg',
          },
        ],
      }))
    }
  }

  const removeImage = () => {
    setFormData((prev: any) => ({ ...prev, images: [] }))
  }

  const handleSubmit = () => {
    if (!formData.itemName || !formData.declaredValue) {
      Alert.alert('Thiếu thông tin', 'Tên sản phẩm và Giá trị khai báo là bắt buộc.')
      return
    }
    const qty = parseInt(String(formData.quantity || '0'), 10)
    if (isNaN(qty) || qty <= 0) {
      Alert.alert('Lỗi', 'Số lượng phải lớn hơn 0.')
      return
    }
    if (!formData.unit || String(formData.unit).trim().length === 0) {
      Alert.alert('Lỗi', 'Đơn vị không được để trống.')
      return
    }

    setSubmitting(true)
    // Chuẩn hóa dữ liệu trước khi save
    const payload = { 
      ...formData, 
      quantity: qty, 
      declaredValue: Number(formData.declaredValue) || 0,
      unit: String(formData.unit).trim() 
    }

    // Giả lập delay submit hoặc gọi hàm onSave
    Promise.resolve(onSave(payload)).finally(() => setSubmitting(false))
  }

  // Lấy ảnh hiện tại để hiển thị
  const currentImageUri = formData.images?.[0]?.uri ?? formData.images?.[0]?.itemImageURL

  if (!visible) return null

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.modalContainer} onPress={(e) => e.stopPropagation()}>
          
          {/* HEADER */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>
              {item ? 'Cập Nhật Sản Phẩm' : 'Thêm Sản Phẩm Mới'}
            </Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={24} color={COLORS.textLight} />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
            
            {/* PHẦN 1: HÌNH ẢNH */}
            <View style={styles.imageSection}>
              {currentImageUri ? (
                <View style={styles.imagePreviewWrapper}>
                  <Image source={{ uri: currentImageUri }} style={styles.imagePreview} resizeMode="cover" />
                  
                  <TouchableOpacity style={styles.changeImageBtn} onPress={pickImage}>
                    <MaterialCommunityIcons name="camera-retake-outline" size={20} color="#fff" />
                    <Text style={styles.changeImageText}>Đổi ảnh</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity style={styles.removeImageBtn} onPress={removeImage}>
                    <Ionicons name="trash-outline" size={20} color="#fff" />
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity style={styles.uploadPlaceholder} onPress={pickImage}>
                  <View style={styles.iconCircle}>
                    <Ionicons name="camera-outline" size={32} color={COLORS.primary} />
                  </View>
                  <Text style={styles.uploadText}>Tải ảnh sản phẩm</Text>
                  <Text style={styles.uploadSubText}>Hỗ trợ JPG, PNG</Text>
                </TouchableOpacity>
              )}
            </View>

            <View style={styles.divider} />

            {/* PHẦN 2: THÔNG TIN CHUNG */}
            <Text style={styles.sectionTitle}>Thông tin chi tiết</Text>

            <InputField 
              label="Tên sản phẩm" 
              value={formData.itemName} 
              onChange={(val: string) => handleChange('itemName', val)} 
              placeholder="Ví dụ: Iphone 15 Pro Max"
              required
            />

            <InputField 
              label="Mô tả" 
              value={formData.description} 
              onChange={(val: string) => handleChange('description', val)} 
              placeholder="Nhập mô tả chi tiết..."
              multiline
            />

            {/* Hàng: Giá trị & Tiền tệ */}
            <View style={styles.row}>
              <InputField 
                label="Giá trị khai báo" 
                width="65%" 
                value={formatVND(formData.declaredValue)} 
                onChange={(val: string) => handleChange('declaredValue', parseVND(val))}
                keyboardType="numeric"
                placeholder="0"
                required
              />
              
              <InputField 
                label="Tiền tệ" 
                width="30%" 
                value={formData.currency} 
                editable={false} 
              />
            </View>

            {/* Hàng: Số lượng & Đơn vị */}
            <View style={styles.row}>
              <InputField 
                label="Số lượng" 
                width="48%" 
                value={String(formData.quantity)} 
                onChange={(val: string) => handleChange('quantity', val.replace(/[^0-9]/g, ''))}
                keyboardType="numeric"
                placeholder="1"
                required
              />
              
              <InputField 
                label="Đơn vị" 
                width="48%" 
                value={formData.unit} 
                onChange={(val: string) => handleChange('unit', val)}
                placeholder="Cái, Hộp..."
                required
              />
            </View>

          </ScrollView>

          {/* FOOTER */}
          <View style={styles.footer}>
            <TouchableOpacity style={styles.btnCancel} onPress={onClose} disabled={submitting}>
              <Text style={styles.btnCancelText}>Hủy bỏ</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.btnSubmit, submitting && { opacity: 0.7 }]} 
              onPress={handleSubmit}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.btnSubmitText}>Lưu sản phẩm</Text>
              )}
            </TouchableOpacity>
          </View>

        </Pressable>
      </Pressable>
    </Modal>
  )
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalContainer: {
    width: '100%',
    maxWidth: 500,
    maxHeight: '90%',
    backgroundColor: COLORS.bg,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 10, elevation: 10
  },
  // HEADER
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingVertical: 16,
    borderBottomWidth: 1, borderBottomColor: COLORS.border
  },
  headerTitle: { fontSize: 18, fontWeight: '700', color: COLORS.primary },
  closeBtn: { padding: 4 },

  // BODY
  body: { padding: 20 },
  
  // Image Section
  imageSection: { alignItems: 'center', marginBottom: 8 },
  imagePreviewWrapper: {
    width: '100%', height: 180, borderRadius: 12, overflow: 'hidden',
    position: 'relative', backgroundColor: '#F3F4F6'
  },
  imagePreview: { width: '100%', height: '100%' },
  changeImageBtn: {
    position: 'absolute', bottom: 10, right: 10,
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20
  },
  changeImageText: { color: '#fff', fontSize: 12, fontWeight: '600', marginLeft: 4 },
  removeImageBtn: {
    position: 'absolute', top: 10, right: 10,
    backgroundColor: 'rgba(239, 68, 68, 0.9)', width: 32, height: 32, borderRadius: 16,
    justifyContent: 'center', alignItems: 'center'
  },
  uploadPlaceholder: {
    width: '100%', height: 140,
    borderWidth: 1.5, borderColor: '#E5E7EB', borderStyle: 'dashed', borderRadius: 12,
    justifyContent: 'center', alignItems: 'center', backgroundColor: '#F9FAFB'
  },
  iconCircle: {
    width: 50, height: 50, borderRadius: 25, backgroundColor: '#E0F2FE',
    justifyContent: 'center', alignItems: 'center', marginBottom: 8
  },
  uploadText: { fontSize: 14, fontWeight: '600', color: COLORS.primary },
  uploadSubText: { fontSize: 12, color: COLORS.textLight, marginTop: 2 },

  divider: { height: 1, backgroundColor: COLORS.border, marginVertical: 20 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: COLORS.text, marginBottom: 16 },
  
  // Inputs
  label: { fontSize: 13, fontWeight: '500', color: '#374151', marginBottom: 6 },
  input: {
    borderWidth: 1, borderColor: COLORS.border, borderRadius: 8,
    paddingHorizontal: 14, paddingVertical: 12,
    fontSize: 15, color: COLORS.text, backgroundColor: COLORS.inputBg
  },
  row: { flexDirection: 'row', justifyContent: 'space-between' },

  // FOOTER
  footer: {
    flexDirection: 'row', gap: 12, padding: 20,
    borderTopWidth: 1, borderTopColor: COLORS.border, backgroundColor: '#fff'
  },
  btnCancel: {
    flex: 1, paddingVertical: 12, borderRadius: 8,
    borderWidth: 1, borderColor: COLORS.border, alignItems: 'center', backgroundColor: '#fff'
  },
  btnCancelText: { fontWeight: '600', color: '#374151' },
  btnSubmit: {
    flex: 1, paddingVertical: 12, borderRadius: 8,
    backgroundColor: COLORS.primary, alignItems: 'center'
  },
  btnSubmitText: { fontWeight: '600', color: '#fff' }
})

export default ItemFormModal