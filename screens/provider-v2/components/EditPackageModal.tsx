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
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Package } from "../../../models/types";
import packageService from "../../../services/packageService";

interface EditPackageModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
  packageId: string | null;
}

const COLORS = {
  primary: "#0284C7",
  text: "#1F2937",
  textLight: "#6B7280",
  border: "#E5E7EB",
  bg: "#FFFFFF",
  danger: "#EF4444",
  success: "#10B981",
};

const EditPackageModal: React.FC<EditPackageModalProps> = ({
  visible,
  onClose,
  onSuccess,
  packageId,
}) => {
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    quantity: 0,
    unit: "",
    weightKg: 0,
    volumeM3: 0,
    handlingAttributes: [] as string[],
    otherRequirements: "",
    isFragile: false,
    isLiquid: false,
    isRefrigerated: false,
    isFlammable: false,
    isHazardous: false,
    isBulky: false,
    isPerishable: false,
  });

  useEffect(() => {
    if (visible && packageId) {
      fetchPackageDetails();
    }
  }, [visible, packageId]);

  const fetchPackageDetails = async () => {
    if (!packageId) {
      console.log("⚠️ packageId is null, cannot fetch");
      return;
    }

    console.log("🔄 Fetching package details for:", packageId);
    setLoading(true);
    try {
      const response = await packageService.getPackageById(packageId);
      console.log("📦 Fetch package details:", response);
      console.log("📦 Response data:", response.data);
      console.log("📦 Response result:", response.result);

      const pkg = response.result || response.data;
      if (response.isSuccess && pkg) {
        console.log("✅ Setting form data:", pkg);
        setFormData({
          title: pkg.title || "",
          description: pkg.description || "",
          quantity: pkg.quantity || 0,
          unit: pkg.unit || "",
          weightKg: pkg.weightKg || 0,
          volumeM3: pkg.volumeM3 || 0,
          handlingAttributes: pkg.handlingAttributes || [],
          otherRequirements: pkg.otherRequirements || "",
          isFragile: pkg.isFragile || false,
          isLiquid: pkg.isLiquid || false,
          isRefrigerated: pkg.isRefrigerated || false,
          isFlammable: pkg.isFlammable || false,
          isHazardous: pkg.isHazardous || false,
          isBulky: pkg.isBulky || false,
          isPerishable: pkg.isPerishable || false,
        });
        console.log("✅ Form data set successfully");
      } else {
        Alert.alert(
          "Lỗi",
          response.message || "Không thể tải thông tin gói hàng"
        );
        onClose();
      }
    } catch (error) {
      console.error("❌ Error fetching package:", error);
      Alert.alert("Lỗi", "Đã xảy ra lỗi khi tải dữ liệu");
      onClose();
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (key: string, value: any) => {
    setFormData((prev) => {
      const updated = { ...prev, [key]: value };
      
      // Auto-sync HandlingAttributes khi thay đổi Boolean fields
      if (
        key === "isFragile" ||
        key === "isLiquid" ||
        key === "isRefrigerated" ||
        key === "isFlammable" ||
        key === "isHazardous" ||
        key === "isBulky" ||
        key === "isPerishable"
      ) {
        updated.handlingAttributes = buildHandlingAttributes(updated);
      }
      
      return updated;
    });
  };

  // Xây dựng HandlingAttributes từ các Boolean fields
  const buildHandlingAttributes = (data: any): string[] => {
    const attributes: string[] = [];
    if (data.isFragile) attributes.push("Fragile");
    if (data.isLiquid) attributes.push("Liquid");
    if (data.isRefrigerated) attributes.push("Refrigerated");
    if (data.isFlammable) attributes.push("Flammable");
    if (data.isHazardous) attributes.push("Hazardous");
    if (data.isBulky) attributes.push("Bulky");
    if (data.isPerishable) attributes.push("Perishable");
    return attributes;
  };

  const handleSubmit = async () => {
    console.log("🎯 handleSubmit called - packageId:", packageId);
    console.log("📝 Form data:", formData);

    if (!packageId) {
      console.log("❌ No packageId");
      return;
    }

    // Validation
    if (!formData.title.trim()) {
      return Alert.alert("Thiếu thông tin", "Vui lòng nhập tiêu đề gói hàng");
    }
    if (formData.quantity <= 0) {
      return Alert.alert("Thiếu thông tin", "Số lượng phải lớn hơn 0");
    }

    console.log("✅ Validation passed, setting submitting state");
    setSubmitting(true);
    try {
      const payload = {
        packageId,
        title: formData.title,
        description: formData.description,
        quantity: formData.quantity,
        unit: formData.unit,
        weightKg: formData.weightKg,
        volumeM3: formData.volumeM3,
        otherRequirements: formData.otherRequirements,
        handlingAttributes: buildHandlingAttributes(formData),
        // Boolean fields - đảm bảo luôn là true/false
        isFragile: !!formData.isFragile,
        isLiquid: !!formData.isLiquid,
        isRefrigerated: !!formData.isRefrigerated,
        isFlammable: !!formData.isFlammable,
        isHazardous: !!formData.isHazardous,
        isBulky: !!formData.isBulky,
        isPerishable: !!formData.isPerishable,
      };
      
      console.log('📦 Package data to update:', payload);

      console.log("🚀 Calling update API...");
      const response = await packageService.updatePackage(payload);
      console.log("✅ Update package response:", response);

      // Stop submitting state
      setSubmitting(false);

      if (response.isSuccess) {
        console.log("✅ Update successful - closing modal and refreshing");
        // Close modal immediately
        onClose();
        // Wait a bit then refresh data
        setTimeout(async () => {
          console.log("🔄 Calling onSuccess to refresh data");
          await onSuccess();
          console.log("✅ Data refresh completed");
        }, 200);
      } else {
        Alert.alert("Lỗi", response.message || "Không thể cập nhật gói hàng");
      }
    } catch (error) {
      console.error("❌ Error updating package:", error);
      setSubmitting(false);
      Alert.alert("Lỗi", "Đã xảy ra lỗi khi cập nhật");
    }
  };

  if (!visible) return null;

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
            <Text style={styles.headerTitle}>Chỉnh Sửa Gói Hàng</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={24} color={COLORS.textLight} />
            </TouchableOpacity>
          </View>

          {!packageId ? (
            <View style={styles.loadingContainer}>
              <Text style={styles.loadingText}>
                Không có thông tin gói hàng
              </Text>
              <TouchableOpacity onPress={onClose} style={{ marginTop: 16 }}>
                <Text style={{ color: COLORS.primary, fontWeight: "600" }}>
                  Đóng
                </Text>
              </TouchableOpacity>
            </View>
          ) : loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={COLORS.primary} />
              <Text style={styles.loadingText}>Đang tải dữ liệu...</Text>
            </View>
          ) : (
            <>
              <ScrollView
                contentContainerStyle={styles.body}
                showsVerticalScrollIndicator={false}
              >
                {/* Title */}
                <View style={styles.fieldGroup}>
                  <Text style={styles.label}>
                    Tiêu đề <Text style={styles.required}>*</Text>
                  </Text>
                  <TextInput
                    style={styles.input}
                    value={formData.title}
                    onChangeText={(v) => handleChange("title", v)}
                    placeholder="Nhập tiêu đề gói hàng"
                    placeholderTextColor="#9CA3AF"
                  />
                </View>

                {/* Description */}
                <View style={styles.fieldGroup}>
                  <Text style={styles.label}>Mô tả</Text>
                  <TextInput
                    style={[styles.input, styles.textArea]}
                    value={formData.description}
                    onChangeText={(v) => handleChange("description", v)}
                    placeholder="Nhập mô tả gói hàng"
                    placeholderTextColor="#9CA3AF"
                    multiline
                    numberOfLines={3}
                  />
                </View>

                {/* Quantity & Unit */}
                <View style={styles.row}>
                  <View style={[styles.fieldGroup, { width: "48%" }]}>
                    <Text style={styles.label}>
                      Số lượng <Text style={styles.required}>*</Text>
                    </Text>
                    <TextInput
                      style={styles.input}
                      value={String(formData.quantity)}
                      onChangeText={(v) =>
                        handleChange("quantity", Number(v) || 0)
                      }
                      placeholder="0"
                      placeholderTextColor="#9CA3AF"
                      keyboardType="numeric"
                    />
                  </View>
                  <View style={[styles.fieldGroup, { width: "48%" }]}>
                    <Text style={styles.label}>Đơn vị</Text>
                    <TextInput
                      style={styles.input}
                      value={formData.unit}
                      onChangeText={(v) => handleChange("unit", v)}
                      placeholder="piece, kg, m³..."
                      placeholderTextColor="#9CA3AF"
                    />
                  </View>
                </View>

                {/* Weight & Volume */}
                <View style={styles.row}>
                  <View style={[styles.fieldGroup, { width: "48%" }]}>
                    <Text style={styles.label}>Cân nặng (kg)</Text>
                    <TextInput
                      style={styles.input}
                      value={String(formData.weightKg)}
                      onChangeText={(v) =>
                        handleChange("weightKg", Number(v) || 0)
                      }
                      placeholder="0"
                      placeholderTextColor="#9CA3AF"
                      keyboardType="numeric"
                    />
                  </View>
                  <View style={[styles.fieldGroup, { width: "48%" }]}>
                    <Text style={styles.label}>Thể tích (m³)</Text>
                    <TextInput
                      style={styles.input}
                      value={String(formData.volumeM3)}
                      onChangeText={(v) =>
                        handleChange("volumeM3", Number(v) || 0)
                      }
                      placeholder="0"
                      placeholderTextColor="#9CA3AF"
                      keyboardType="numeric"
                    />
                  </View>
                </View>

                {/* Divider */}
                <View style={styles.divider} />

                {/* Special Attributes */}
                <View style={styles.fieldGroup}>
                  <Text style={styles.sectionTitle}>Thuộc tính đặc biệt</Text>
                  <View style={styles.checkboxGrid}>
                    {[
                      { key: "isFragile", label: "Dễ vỡ", icon: "alert-circle" },
                      { key: "isLiquid", label: "Chất lỏng", icon: "water" },
                      { key: "isRefrigerated", label: "Cần làm lạnh", icon: "snow" },
                      { key: "isFlammable", label: "Dễ cháy", icon: "flame" },
                      { key: "isHazardous", label: "Nguy hiểm", icon: "warning" },
                      { key: "isBulky", label: "Cồng kềnh", icon: "cube" },
                      { key: "isPerishable", label: "Dễ hỏng", icon: "time" },
                    ].map((item) => (
                      <TouchableOpacity
                        key={item.key}
                        style={[
                          styles.checkboxItem,
                          !!formData[item.key as keyof typeof formData] && styles.checkboxItemActive,
                        ]}
                        onPress={() => handleChange(item.key, !Boolean(formData[item.key as keyof typeof formData]))}
                      >
                        <Ionicons
                          name={item.icon as any}
                          size={20}
                          color={Boolean(formData[item.key as keyof typeof formData]) ? COLORS.primary : COLORS.textLight}
                        />
                        <Text
                          style={[
                            styles.checkboxLabel,
                            !!formData[item.key as keyof typeof formData] && styles.checkboxLabelActive,
                          ]}
                        >
                          {item.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                {/* Divider */}
                <View style={styles.divider} />

                {/* Other Requirements */}
                <View style={styles.fieldGroup}>
                  <Text style={styles.label}>Yêu cầu khác</Text>
                  <TextInput
                    style={[styles.input, styles.textArea]}
                    value={formData.otherRequirements}
                    onChangeText={(v) => handleChange("otherRequirements", v)}
                    placeholder="Ví dụ: Cần xếp nhẹ nhàng, tránh úp ngược..."
                    placeholderTextColor="#9CA3AF"
                    multiline
                    numberOfLines={2}
                  />
                </View>
              </ScrollView>

              {/* Footer */}
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
                    <Text style={styles.btnSubmitText}>Cập Nhật</Text>
                  )}
                </TouchableOpacity>
              </View>
            </>
          )}
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
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderColor: COLORS.border,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.primary,
  },
  closeBtn: {
    padding: 4,
  },
  loadingContainer: {
    padding: 60,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: COLORS.textLight,
  },
  body: {
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  fieldGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 13,
    fontWeight: "500",
    color: COLORS.text,
    marginBottom: 6,
  },
  required: {
    color: COLORS.danger,
  },
  input: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: COLORS.text,
    backgroundColor: "#fff",
  },
  textArea: {
    height: 80,
    textAlignVertical: "top",
    paddingTop: 10,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: 16,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: COLORS.text,
    marginBottom: 12,
  },
  checkboxGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  checkboxItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: "#F9FAFB",
    gap: 6,
  },
  checkboxItemActive: {
    backgroundColor: "#EFF6FF",
    borderColor: COLORS.primary,
  },
  checkboxLabel: {
    fontSize: 13,
    color: COLORS.textLight,
    fontWeight: "500",
  },
  checkboxLabelActive: {
    color: COLORS.primary,
    fontWeight: "600",
  },
  footer: {
    flexDirection: "row",
    gap: 12,
    padding: 20,
    borderTopWidth: 1,
    borderColor: COLORS.border,
  },
  btnCancel: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: "center",
  },
  btnCancelText: {
    fontWeight: "600",
    color: COLORS.text,
  },
  btnSubmit: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    backgroundColor: COLORS.primary,
    alignItems: "center",
  },
  btnSubmitText: {
    fontWeight: "600",
    color: "#fff",
  },
});

export default EditPackageModal;
