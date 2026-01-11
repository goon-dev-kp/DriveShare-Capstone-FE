import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  Alert,
} from 'react-native';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';

interface IssueImagePickerProps {
  images: Array<{
    uri: string;
    imageURL: string;
    fileName: string;
    type: string;
  }>;
  onImagesChange: (images: Array<{
    uri: string;
    imageURL: string;
    fileName: string;
    type: string;
  }>) => void;
  maxImages?: number;
}

const IssueImagePicker: React.FC<IssueImagePickerProps> = ({
  images,
  onImagesChange,
  maxImages = 5,
}) => {
  const pickImage = async () => {
    if (images.length >= maxImages) {
      Alert.alert('Giới hạn', `Chỉ có thể tải tối đa ${maxImages} ảnh`);
      return;
    }

    // Request permissions
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Cần quyền', 'Vui lòng cấp quyền truy cập thư viện ảnh.');
      return;
    }

    // Launch image picker
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.5,
      selectionLimit: maxImages - images.length,
      base64: true,
    });

    if (!result.canceled && result.assets) {
      const newImages = result.assets.map((asset) => {
        const fileName = asset.fileName || `issue_${Date.now()}.jpg`;
        const dataUrl = asset.base64
          ? `data:image/jpeg;base64,${asset.base64}`
          : asset.uri;

        return {
          uri: dataUrl,
          imageURL: dataUrl,
          fileName,
          type: asset.mimeType || 'image/jpeg',
        };
      });
      onImagesChange([...images, ...newImages]);
    }
  };

  const removeImage = (index: number) => {
    const newImages = images.filter((_, i) => i !== index);
    onImagesChange(newImages);
  };

  return (
    <View style={styles.container}>
      {/* Image Grid */}
      {images.length > 0 && (
        <View style={styles.imageGrid}>
          {images.map((image, index) => (
            <View key={index} style={styles.imageWrapper}>
              <Image source={{ uri: image.uri }} style={styles.imagePreview} />
              <TouchableOpacity
                style={styles.removeBtn}
                onPress={() => removeImage(index)}
              >
                <Ionicons name="close-circle" size={24} color="#EF4444" />
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}

      {/* Add Button */}
      {images.length < maxImages && (
        <TouchableOpacity style={styles.addButton} onPress={pickImage}>
          <View style={styles.iconCircle}>
            <MaterialIcons name="add-photo-alternate" size={28} color="#3B82F6" />
          </View>
          <Text style={styles.addText}>Thêm ảnh minh chứng</Text>
          <Text style={styles.addSubText}>
            ({images.length}/{maxImages})
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  imageGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 12,
  },
  imageWrapper: {
    position: 'relative',
    width: 100,
    height: 100,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#F3F4F6',
  },
  imagePreview: {
    width: '100%',
    height: '100%',
  },
  removeBtn: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#FFF',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  addButton: {
    height: 120,
    borderWidth: 1.5,
    borderColor: '#3B82F6',
    borderStyle: 'dashed',
    borderRadius: 8,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#DBEAFE',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  addText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3B82F6',
    marginTop: 4,
  },
  addSubText: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
});

export default IssueImagePicker;
