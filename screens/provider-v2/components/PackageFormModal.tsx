import React, { useState, useEffect } from "react";
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
  ActivityIndicator,
  Switch,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { Item, ImageStatus } from "../../../models/types";

interface PackageFormModalProps {
  visible: boolean;
  onClose: () => void;
  onCreate: (pkg: any) => void;
  item: Item | null;
}

const COLORS = {
  primary: "#0284C7",
  text: "#1F2937",
  textLight: "#6B7280",
  border: "#E5E7EB",
  bg: "#FFFFFF",
  inputBg: "#FFFFFF",
  danger: "#EF4444",
};

// --- COMPONENT CON TÁCH RA NGOÀI ĐỂ TRÁNH RE-RENDER MẤT FOCUS ---
const InputField = ({
  label,
  value,
  onChange,
  placeholder,
  width = "100%",
  keyboardType = "default",
  multiline = false,
  numberOfLines = 1,
  required = false,
}: any) => (
  <View style={{ width, marginBottom: 16 }}>
    <Text style={styles.label}>
      {label} {required && <Text style={{ color: COLORS.danger }}>*</Text>}
    </Text>
    <TextInput
      style={[
        styles.input,
        multiline && { height: 80, textAlignVertical: "top", paddingTop: 10 },
      ]}
      value={String(value || "")}
      onChangeText={onChange}
      placeholder={placeholder}
      placeholderTextColor="#9CA3AF"
      keyboardType={keyboardType}
      multiline={multiline}
      numberOfLines={numberOfLines}
    />
  </View>
);

// --- MAIN COMPONENT ---
const PackageFormModal: React.FC<PackageFormModalProps> = ({
  visible,
  onClose,
  onCreate,
  item,
}) => {
  const [formData, setFormData] = useState<any>({
    title: "",
    description: "",
    quantity: 1,
    unit: "piece",
    weightKg: 0,
    volumeM3: 0,
    images: [],
    isFragile: false,
    isLiquid: false,
    isRefrigerated: false,
    isFlammable: false,
    isHazardous: false,
    isBulky: false,
    isPerishable: false,
    otherRequirements: "",
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (visible && item) {
      setFormData({
        title: `Gói hàng: ${item.itemName}`,
        description: item.description || "",
        quantity: 1,
        unit: "piece",
        weightKg: 0,
        volumeM3: 0,
        images: [],
        isFragile: false,
        isLiquid: false,
        isRefrigerated: false,
        isFlammable: false,
        isHazardous: false,
        isBulky: false,
        isPerishable: false,
        otherRequirements: "",
        itemId: (item as any).id || (item as any).itemId, // Thêm itemId vào formData
      });
    }
  }, [visible, item]);

  const handleChange = (key: string, val: any) =>
    setFormData((p: any) => ({ ...p, [key]: val }));

  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Cần quyền", "Vui lòng cấp quyền truy cập thư viện ảnh.");
        return;
      }
      
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: false,
        quality: 0.5, // Giữ 0.5 như itemService
        base64: false, // Dùng URI như itemService
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        
        // Chỉ cần URI cho mobile - Đảm bảo MIME type đúng định dạng
        let mimeType = asset.type || "image/jpeg";
        // Fix: Nếu type không có "/", thêm "image/" vào trước
        if (mimeType && !mimeType.includes('/')) {
          mimeType = `image/${mimeType}`;
        }
        
        const newImg = {
          uri: asset.uri,
          fileName: asset.fileName || `package_${Date.now()}.jpg`,
          type: mimeType,
        };
        
        console.log("📸 Picked image:", { uri: asset.uri.substring(0, 50), fileName: newImg.fileName });
        
        setFormData((p: any) => ({ ...p, images: [newImg] }));
      }
    } catch (error) {
      console.error("Error picking image:", error);
      Alert.alert("Lỗi", "Có lỗi khi chọn ảnh. Vui lòng thử lại.");
    }
  };

  const removeImage = () => {
    setFormData((p: any) => ({ ...p, images: [] }));
  };

  const handleSubmit = () => {
    if (!formData.title)
      return Alert.alert("Thiếu thông tin", "Vui lòng nhập tiêu đề gói hàng.");
    
    if (!formData.itemId) {
      return Alert.alert("Lỗi", "Không tìm thấy itemId. Vui lòng thử lại.");
    }
    
    console.log("📦 [PackageFormModal] Submitting package:", {
      title: formData.title,
      itemId: formData.itemId,
      hasImages: formData.images?.length > 0,
      imageData: formData.images?.[0] ? {
        uri: formData.images[0].uri,
        fileName: formData.images[0].fileName,
        type: formData.images[0].type,
      } : null,
    });
    
    setSubmitting(true);
    Promise.resolve(onCreate(formData))
      .then(() => {
        console.log("✅ [PackageFormModal] Package created successfully");
      })
      .catch((err) => {
        console.error("❌ [PackageFormModal] Failed to create package:", err);
        Alert.alert(
          "Lỗi tạo gói hàng",
          err?.response?.data?.message || err?.message || "Không thể tạo gói hàng. Vui lòng kiểm tra kết nối mạng và thử lại."
        );
      })
      .finally(() => setSubmitting(false));
  };

  if (!visible || !item) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable
          style={styles.modalContainer}
          onPress={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Đóng Gói & Vận Chuyển</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={24} color={COLORS.textLight} />
            </TouchableOpacity>
          </View>

          {/* Item Info Banner */}
          <View style={styles.itemBanner}>
            <MaterialCommunityIcons
              name="cube-send"
              size={32}
              color={COLORS.primary}
            />
            <View style={{ marginLeft: 12, flex: 1 }}>
              <Text style={styles.itemName}>{item.itemName}</Text>
              <Text style={styles.itemSub}>
                Giá trị: {item.declaredValue?.toLocaleString()} {item.currency}
              </Text>
            </View>
          </View>

          <ScrollView
            contentContainerStyle={styles.body}
            showsVerticalScrollIndicator={false}
          >
            <Text style={styles.sectionTitle}>Thông tin đóng gói</Text>

            <InputField
              label="Tiêu đề gói hàng"
              value={formData.title}
              onChange={(v: string) => handleChange("title", v)}
              required
            />

            <InputField
              label="Ghi chú / Mô tả"
              value={formData.description}
              onChange={(v: string) => handleChange("description", v)}
              multiline
            />

            <View style={styles.row}>
              <InputField
                label="Số lượng hàng"
                width="48%"
                value={formData.quantity}
                onChange={(v: string) => handleChange("quantity", Number(v))}
                keyboardType="numeric"
              />
              <InputField
                label="Đơn vị hàng"
                width="48%"
                value={formData.unit}
                onChange={(v: string) => handleChange("unit", v)}
              />
            </View>

            <View style={styles.row}>
              <InputField
                label="Cân nặng (kg)"
                width="48%"
                value={formData.weightKg}
                onChange={(v: string) => handleChange("weightKg", Number(v))}
                keyboardType="numeric"
              />
              <InputField
                label="Thể tích (m³)"
                width="48%"
                value={formData.volumeM3}
                onChange={(v: string) => handleChange("volumeM3", Number(v))}
                keyboardType="numeric"
              />
            </View>

            <View style={styles.divider} />
            <Text style={styles.sectionTitle}>Đặc tính vận chuyển</Text>

            <View style={styles.checkboxGrid}>
              <View style={styles.checkboxItem}>
                <Text style={styles.checkboxLabel}>Dễ vỡ</Text>
                <Switch
                  value={formData.isFragile}
                  onValueChange={(v) => handleChange("isFragile", v)}
                  trackColor={{ false: "#E5E7EB", true: COLORS.primary }}
                  thumbColor="#fff"
                />
              </View>
              <View style={styles.checkboxItem}>
                <Text style={styles.checkboxLabel}>Chất lỏng</Text>
                <Switch
                  value={formData.isLiquid}
                  onValueChange={(v) => handleChange("isLiquid", v)}
                  trackColor={{ false: "#E5E7EB", true: COLORS.primary }}
                  thumbColor="#fff"
                />
              </View>
              <View style={styles.checkboxItem}>
                <Text style={styles.checkboxLabel}>Cần lạnh</Text>
                <Switch
                  value={formData.isRefrigerated}
                  onValueChange={(v) => handleChange("isRefrigerated", v)}
                  trackColor={{ false: "#E5E7EB", true: COLORS.primary }}
                  thumbColor="#fff"
                />
              </View>
              <View style={styles.checkboxItem}>
                <Text style={styles.checkboxLabel}>Dễ cháy</Text>
                <Switch
                  value={formData.isFlammable}
                  onValueChange={(v) => handleChange("isFlammable", v)}
                  trackColor={{ false: "#E5E7EB", true: COLORS.primary }}
                  thumbColor="#fff"
                />
              </View>
              <View style={styles.checkboxItem}>
                <Text style={styles.checkboxLabel}>Nguy hiểm</Text>
                <Switch
                  value={formData.isHazardous}
                  onValueChange={(v) => handleChange("isHazardous", v)}
                  trackColor={{ false: "#E5E7EB", true: COLORS.primary }}
                  thumbColor="#fff"
                />
              </View>
              <View style={styles.checkboxItem}>
                <Text style={styles.checkboxLabel}>Cồng kềnh</Text>
                <Switch
                  value={formData.isBulky}
                  onValueChange={(v) => handleChange("isBulky", v)}
                  trackColor={{ false: "#E5E7EB", true: COLORS.primary }}
                  thumbColor="#fff"
                />
              </View>
              <View style={styles.checkboxItem}>
                <Text style={styles.checkboxLabel}>Dễ hỏng</Text>
                <Switch
                  value={formData.isPerishable}
                  onValueChange={(v) => handleChange("isPerishable", v)}
                  trackColor={{ false: "#E5E7EB", true: COLORS.primary }}
                  thumbColor="#fff"
                />
              </View>
            </View>

            <InputField
              label="Yêu cầu khác"
              value={formData.otherRequirements}
              onChange={(v: string) => handleChange("otherRequirements", v)}
              placeholder="Nhập các yêu cầu đặc biệt khác..."
              multiline
            />

            <View style={styles.divider} />
            <Text style={styles.sectionTitle}>Hình ảnh kiện hàng</Text>

            <View style={styles.imageSection}>
              {formData.images?.[0] ? (
                <View style={styles.imagePreviewWrapper}>
                  <Image 
                    source={{ uri: formData.images[0].uri }} 
                    style={styles.imagePreview} 
                    resizeMode="cover" 
                  />
                  
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
                  <Text style={styles.uploadText}>Tải ảnh kiện hàng</Text>
                  <Text style={styles.uploadSubText}>Hỗ trợ JPG, PNG (tối ưu cho mobile)</Text>
                </TouchableOpacity>
              )}
            </View>
          </ScrollView>

          <View style={styles.footer}>
            <TouchableOpacity
              style={styles.btnCancel}
              onPress={onClose}
              disabled={submitting}
            >
              <Text style={styles.btnCancelText}>Hủy</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.btnSubmit, submitting && { opacity: 0.7 }]}
              onPress={handleSubmit}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.btnSubmitText}>Tạo Gói</Text>
              )}
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  modalContainer: {
    width: "100%",
    maxWidth: 550,
    maxHeight: "90%",
    backgroundColor: "#fff",
    borderRadius: 16,
    overflow: "hidden",
    elevation: 10,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 16,
    borderBottomWidth: 1,
    borderColor: "#E5E7EB",
  },
  headerTitle: { fontSize: 18, fontWeight: "700", color: COLORS.primary },
  closeBtn: { padding: 4 },
  itemBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F0F9FF",
    padding: 12,
    margin: 16,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary,
  },
  itemName: { fontWeight: "700", color: "#0F172A" },
  itemSub: { fontSize: 12, color: "#64748B" },
  body: { paddingHorizontal: 20, paddingBottom: 20 },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#374151",
    marginBottom: 12,
  },
  label: { fontSize: 13, fontWeight: "500", color: "#374151", marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: "#1F2937",
    backgroundColor: "#fff",
  },
  row: { flexDirection: "row", justifyContent: "space-between" },
  divider: { height: 1, backgroundColor: "#E5E7EB", marginVertical: 16 },
  imageSection: { alignItems: "center", marginBottom: 8 },
  imagePreviewWrapper: {
    width: "100%",
    height: 180,
    borderRadius: 12,
    overflow: "hidden",
    position: "relative",
    backgroundColor: "#F3F4F6",
  },
  imagePreview: { width: "100%", height: "100%" },
  changeImageBtn: {
    position: "absolute",
    bottom: 10,
    right: 10,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.6)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  changeImageText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
    marginLeft: 4,
  },
  removeImageBtn: {
    position: "absolute",
    top: 10,
    right: 10,
    backgroundColor: "rgba(239, 68, 68, 0.9)",
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  uploadPlaceholder: {
    width: "100%",
    height: 140,
    borderWidth: 1.5,
    borderColor: "#E5E7EB",
    borderStyle: "dashed",
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F9FAFB",
  },
  iconCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#E0F2FE",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  uploadText: { fontSize: 14, fontWeight: "600", color: COLORS.primary },
  uploadSubText: { fontSize: 12, color: COLORS.textLight, marginTop: 2 },
  footer: {
    flexDirection: "row",
    gap: 12,
    padding: 20,
    borderTopWidth: 1,
    borderColor: "#E5E7EB",
  },
  btnCancel: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    alignItems: "center",
  },
  btnCancelText: { fontWeight: "600", color: "#374151" },
  btnSubmit: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    backgroundColor: COLORS.primary,
    alignItems: "center",
  },
  btnSubmitText: { fontWeight: "600", color: "#fff" },
  checkboxGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 16,
  },
  checkboxItem: {
    width: "48%",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 12,
    backgroundColor: "#F9FAFB",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  checkboxLabel: {
    fontSize: 13,
    fontWeight: "500",
    color: "#374151",
  },
});

export default PackageFormModal;