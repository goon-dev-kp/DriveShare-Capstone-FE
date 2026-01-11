import React, { useEffect, useState } from "react";
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
import { Ionicons, Feather } from "@expo/vector-icons";
import vehicleTypeService from "@/services/vehicleTypeService";
import { VehicleType, Vehicle } from "@/models/types";

interface Props {
  visible: boolean;
  onClose: () => void;
  onUpdate: (dto: any) => void;
  vehicle: Vehicle | null;
}

const COLORS = {
  primary: "#10439F",
  secondary: "#0284C7",
  text: "#1F2937",
  textLight: "#6B7280",
  border: "#E5E7EB",
  bg: "#F9FAFB",
  cardBg: "#FFFFFF",
  danger: "#EF4444",
  success: "#10B981",
};

const VehicleUpdateModal: React.FC<Props> = ({
  visible,
  onClose,
  onUpdate,
  vehicle,
}) => {
  const [form, setForm] = useState({
    model: "",
    brand: "",
    color: "",
    yearOfManufacture: new Date().getFullYear(),
    payloadInKg: 0,
    volumeInM3: 0,
    vehicleTypeId: "",
  });

  const [vehicleTypes, setVehicleTypes] = useState<VehicleType[]>([]);
  const [showTypeList, setShowTypeList] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Load vehicle types
  useEffect(() => {
    if (visible) {
      loadVehicleTypes();
    }
  }, [visible]);

  // Load vehicle data into form
  useEffect(() => {
    if (visible && vehicle) {
      console.log("🚗 Loading vehicle data:", vehicle);
      console.log("🔍 Vehicle Type:", vehicle.vehicleType);
      console.log("🆔 Vehicle Type ID:", vehicle.vehicleType?.vehicleTypeId);

      setForm({
        model: vehicle.model || "",
        brand: vehicle.brand || "",
        color: vehicle.color || "",
        yearOfManufacture:
          vehicle.yearOfManufacture || new Date().getFullYear(),
        payloadInKg: vehicle.payloadInKg || 0,
        volumeInM3: vehicle.volumeInM3 || 0,
        vehicleTypeId: vehicle.vehicleType?.vehicleTypeId || "",
      });
    }
  }, [visible, vehicle]);

  const loadVehicleTypes = async () => {
    try {
      const data = await vehicleTypeService.getAll();
      setVehicleTypes(data);
    } catch (error) {
      console.error("Failed to load vehicle types:", error);
    }
  };

  const handleChange = (key: string, value: any) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async () => {
    console.log("handleSubmit called!");
    console.log("Form data:", form);

    if (!form.brand?.trim()) {
      console.log("Validation failed: brand is empty");
      Alert.alert("Lỗi", "Vui lòng nhập hãng xe");
      return;
    }
    if (!form.model?.trim()) {
      console.log("Validation failed: model is empty");
      Alert.alert("Lỗi", "Vui lòng nhập model xe");
      return;
    }

    console.log("Validation passed, starting update...");
    setSubmitting(true);

    try {
      const updateData: any = {
        Model: form.model || null,
        Brand: form.brand,
        Color: form.color || null,
        YearOfManufacture: Number(form.yearOfManufacture) || null,
        PayloadInKg: Number(form.payloadInKg) || 0,
        VolumeInM3: Number(form.volumeInM3) || 0,
        CurrentAddress: null,
        Features: [],
      };

      // Only include VehicleTypeId if it's not empty
      if (form.vehicleTypeId && form.vehicleTypeId.trim() !== "") {
        updateData.VehicleTypeId = form.vehicleTypeId;
      }

      console.log("Updating vehicle with data:", updateData);
      await onUpdate(updateData);
      console.log("Update successful");
    } catch (error: any) {
      console.error("Update failed:", error);
      Alert.alert(
        "Lỗi cập nhật",
        error?.message || "Không thể cập nhật xe. Vui lòng thử lại."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const selectedType = vehicleTypes.find(
    (t) => t.vehicleTypeId === form.vehicleTypeId
  );

  return (
    <Modal visible={visible} transparent animationType="slide">
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable
          style={styles.modalContainer}
          onPress={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={styles.iconCircle}>
                <Ionicons name="car-sport" size={24} color={COLORS.primary} />
              </View>
              <View>
                <Text style={styles.headerTitle}>Cập Nhật Thông Tin Xe</Text>
                <Text style={styles.headerSubtitle}>
                  {vehicle?.plateNumber || ""}
                </Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={24} color={COLORS.textLight} />
            </TouchableOpacity>
          </View>

          {/* Body */}
          <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
            {/* Vehicle Type */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>
                <Ionicons
                  name="albums-outline"
                  size={16}
                  color={COLORS.primary}
                />{" "}
                Loại xe
              </Text>
              <TouchableOpacity
                style={styles.selectButton}
                onPress={() => setShowTypeList(!showTypeList)}
              >
                <Text style={styles.selectButtonText}>
                  {selectedType?.vehicleTypeName || "Chọn loại xe"}
                </Text>
                <Ionicons
                  name={showTypeList ? "chevron-up" : "chevron-down"}
                  size={20}
                  color={COLORS.textLight}
                />
              </TouchableOpacity>

              {showTypeList && (
                <View style={styles.typeList}>
                  {vehicleTypes.map((type) => (
                    <TouchableOpacity
                      key={type.vehicleTypeId}
                      style={[
                        styles.typeItem,
                        form.vehicleTypeId === type.vehicleTypeId &&
                          styles.typeItemActive,
                      ]}
                      onPress={() => {
                        handleChange("vehicleTypeId", type.vehicleTypeId);
                        setShowTypeList(false);
                      }}
                    >
                      <Text
                        style={[
                          styles.typeItemText,
                          form.vehicleTypeId === type.vehicleTypeId &&
                            styles.typeItemTextActive,
                        ]}
                      >
                        {type.vehicleTypeName}
                      </Text>
                      {form.vehicleTypeId === type.vehicleTypeId && (
                        <Ionicons
                          name="checkmark-circle"
                          size={20}
                          color={COLORS.primary}
                        />
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>

            {/* Basic Info */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>
                <Ionicons
                  name="information-circle-outline"
                  size={16}
                  color={COLORS.primary}
                />{" "}
                Thông tin cơ bản
              </Text>

              <View style={styles.row}>
                <View style={styles.inputWrapper}>
                  <Text style={styles.label}>
                    Hãng xe <Text style={styles.required}>*</Text>
                  </Text>
                  <TextInput
                    style={styles.input}
                    value={form.brand}
                    onChangeText={(t) => handleChange("brand", t)}
                    placeholder="VD: Toyota, Ford..."
                    placeholderTextColor={COLORS.textLight}
                  />
                </View>

                <View style={styles.inputWrapper}>
                  <Text style={styles.label}>
                    Model <Text style={styles.required}>*</Text>
                  </Text>
                  <TextInput
                    style={styles.input}
                    value={form.model}
                    onChangeText={(t) => handleChange("model", t)}
                    placeholder="VD: Camry, Ranger..."
                    placeholderTextColor={COLORS.textLight}
                  />
                </View>
              </View>

              <View style={styles.row}>
                <View style={styles.inputWrapper}>
                  <Text style={styles.label}>Màu sắc</Text>
                  <TextInput
                    style={styles.input}
                    value={form.color}
                    onChangeText={(t) => handleChange("color", t)}
                    placeholder="VD: Trắng, Đen..."
                    placeholderTextColor={COLORS.textLight}
                  />
                </View>

                <View style={styles.inputWrapper}>
                  <Text style={styles.label}>Năm sản xuất</Text>
                  <TextInput
                    style={styles.input}
                    value={String(form.yearOfManufacture)}
                    onChangeText={(t) => handleChange("yearOfManufacture", t)}
                    placeholder="2020"
                    keyboardType="numeric"
                    placeholderTextColor={COLORS.textLight}
                  />
                </View>
              </View>
            </View>

            {/* Specifications */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>
                <Ionicons
                  name="speedometer-outline"
                  size={16}
                  color={COLORS.primary}
                />{" "}
                Thông số kỹ thuật
              </Text>

              <View style={styles.row}>
                <View style={styles.inputWrapper}>
                  <Text style={styles.label}>Tải trọng (kg)</Text>
                  <TextInput
                    style={styles.input}
                    value={String(form.payloadInKg)}
                    onChangeText={(t) => handleChange("payloadInKg", t)}
                    placeholder="0"
                    keyboardType="numeric"
                    placeholderTextColor={COLORS.textLight}
                  />
                </View>

                <View style={styles.inputWrapper}>
                  <Text style={styles.label}>Thể tích (m³)</Text>
                  <TextInput
                    style={styles.input}
                    value={String(form.volumeInM3)}
                    onChangeText={(t) => handleChange("volumeInM3", t)}
                    placeholder="0"
                    keyboardType="numeric"
                    placeholderTextColor={COLORS.textLight}
                  />
                </View>
              </View>
            </View>

            <View style={{ height: 20 }} />
          </ScrollView>

          {/* Footer */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={onClose}
              disabled={submitting}
            >
              <Text style={styles.cancelBtnText}>Hủy</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.submitBtn, submitting && styles.submitBtnDisabled]}
              onPress={handleSubmit}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <>
                  <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
                  <Text style={styles.submitBtnText}>Cập nhật</Text>
                </>
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
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    width: "90%",
    maxWidth: 600,
    maxHeight: "90%",
    backgroundColor: COLORS.cardBg,
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: COLORS.bg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#EEF2FF",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.text,
  },
  headerSubtitle: {
    fontSize: 14,
    color: COLORS.textLight,
    marginTop: 2,
  },
  closeBtn: {
    padding: 4,
  },
  body: {
    flex: 1,
    padding: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.text,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
  },
  row: {
    flexDirection: "row",
    gap: 12,
  },
  inputWrapper: {
    flex: 1,
    marginBottom: 12,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.text,
    marginBottom: 6,
  },
  required: {
    color: COLORS.danger,
  },
  input: {
    backgroundColor: COLORS.bg,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: COLORS.text,
  },
  textArea: {
    height: 80,
    textAlignVertical: "top",
  },
  selectButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: COLORS.bg,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  selectButtonText: {
    fontSize: 14,
    color: COLORS.text,
  },
  typeList: {
    marginTop: 8,
    backgroundColor: COLORS.bg,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    maxHeight: 200,
  },
  typeItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  typeItemActive: {
    backgroundColor: "#EEF2FF",
  },
  typeItemText: {
    fontSize: 14,
    color: COLORS.text,
  },
  typeItemTextActive: {
    fontWeight: "600",
    color: COLORS.primary,
  },
  featureInputRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 12,
  },
  addFeatureBtn: {
    width: 44,
    height: 44,
    borderRadius: 8,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  featureList: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  featureChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#EEF2FF",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  featureText: {
    fontSize: 13,
    color: COLORS.primary,
    fontWeight: "500",
  },
  footer: {
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: COLORS.bg,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: "center",
    justifyContent: "center",
  },
  cancelBtnText: {
    fontSize: 15,
    fontWeight: "600",
    color: COLORS.textLight,
  },
  submitBtn: {
    flex: 1,
    flexDirection: "row",
    gap: 8,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  submitBtnDisabled: {
    opacity: 0.6,
  },
  submitBtnText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#FFFFFF",
  },
});

export default VehicleUpdateModal;
