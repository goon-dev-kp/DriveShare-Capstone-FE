import React from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  Alert,
} from 'react-native'
import { PhotoIcon } from '../icons/ActionIcons'
// Import thư viện image picker của Expo
import * as ImagePicker from 'expo-image-picker'

interface ImageUploaderProps {
  currentImage: string | null
  // onImageChange trả về object chứa dataUrl giống ItemFormModal
  onImageChange: (img: { uri?: string; imageURL?: string; base64?: string; fileName?: string; type?: string }) => void
}

const ImageUploader: React.FC<ImageUploaderProps> = ({
  currentImage,
  onImageChange,
}) => {
  // Hàm này thay thế cho logic "click" và "drop"
  const triggerFileSelect = async () => {
    // 1. Yêu cầu quyền truy cập thư viện ảnh
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (status !== 'granted') {
      Alert.alert(
        'Cần cấp quyền',
        'Vui lòng cấp quyền truy cập thư viện ảnh để tải ảnh lên.',
      )
      return
    }

    // 2. Mở thư viện ảnh
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: false,
      quality: 0.7,
      base64: true, // Dùng base64 cho preview (không dùng để upload)
    })

    // 3. Xử lý kết quả
    if (!result.canceled && result.assets && result.assets[0]) {
      const asset = result.assets[0]
      const dataUrl = asset.base64
        ? `data:${asset.mimeType ?? 'image/jpeg'};base64,${asset.base64}`
        : asset.uri
      
      // Trả về object với imageURL (dataUrl) giống ItemFormModal
      onImageChange({
        // IMPORTANT: Upload cần dùng file URI thật (asset.uri), không phải data URL
        uri: asset.uri,
        imageURL: dataUrl,
        base64: asset.base64 ?? undefined,
        fileName: asset.fileName ?? `photo_${Date.now()}.jpg`,
        type: asset.mimeType ?? 'image/jpeg'
      })
    }
  }

  return (
    <View style={styles.container}>
{/* <Text style={styles.label}>Ảnh sản phẩm</Text> */}
<TouchableOpacity
        style={styles.uploaderBox}
        onPress={triggerFileSelect}
        activeOpacity={0.7}
      >
        {currentImage ? (
          // Hiển thị ảnh preview
          <Image
            source={{ uri: currentImage }}
            style={styles.previewImage}
            resizeMode="contain"
          />
        ) : (
          // Hiển thị placeholder
          <View style={styles.placeholderContainer}>
<PhotoIcon style={styles.placeholderIcon} />
<Text style={styles.placeholderText}>Nhấn để tải ảnh lên</Text>
<Text style={styles.placeholderSubText}>Hỗ trợ PNG, JPG</Text>
</View>
        )}
      </TouchableOpacity>
</View>
  )
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151', // text-gray-700
    marginBottom: 4,
  },
  uploaderBox: {
    height: 150,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#D1D5DB', // border-gray-300
    borderStyle: 'dashed',
    borderRadius: 8,
    backgroundColor: '#F9FAFB', // bg-gray-50
  },
  placeholderContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  placeholderIcon: {
    width: 48,
    height: 48,
    color: '#9CA3AF', // text-gray-400
  },
  placeholderText: {
    fontSize: 14,
    color: '#4B5563', // text-gray-600
  },
  placeholderSubText: {
    fontSize: 12,
    color: '#6B7280', // text-gray-500
  },
  previewImage: {
    width: '100%',
    height: '100%',
    borderRadius: 6, // rounded-md
  },
})

export default ImageUploader