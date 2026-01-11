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
  Image,
  Platform,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { Ionicons, Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import vehicleTypeService from "@/services/vehicleTypeService";
import { VehicleType } from "@/models/types";
import DateInput from "@/components/DateInput";

interface Props {
  visible: boolean;
  onClose: () => void;
  onCreate: (dto: any) => void;
}

// Màu sắc chủ đạo theo thiết kế
const COLORS = {
  primary: "#0284C7",
  text: "#1F2937",
  textLight: "#6B7280",
  border: "#E5E7EB",
  bg: "#FFFFFF",
  inputBg: "#FFFFFF",
  danger: "#EF4444",
};

// --- TÁCH COMPONENT CON RA NGOÀI ĐỂ TRÁNH RE-RENDER MẤT FOCUS ---

const InputField = ({
  label,
  value,
  onChange,
  placeholder,
  width = "100%",
  keyboardType = "default",
  required = false,
}: any) => (
  <View style={{ width, marginBottom: 12 }}>
    {label && (
      <Text style={styles.label}>
        {label} {required && <Text style={{ color: COLORS.danger }}>*</Text>}
      </Text>
    )}
    <TextInput
      style={styles.input}
      value={String(value || "")}
      onChangeText={onChange}
      placeholder={placeholder}
      placeholderTextColor="#9CA3AF"
      keyboardType={keyboardType}
    />
  </View>
);

const DocumentUploadBox = ({
  image,
  onPress,
  label,
}: {
  image: any;
  onPress: () => void;
  label: string;
}) => (
  <TouchableOpacity style={styles.docUploadBox} onPress={onPress}>
    {image ? (
      <Image
        source={{ uri: image.documentImageURL || image.uri }}
        style={styles.docImage}
        resizeMode="cover"
      />
    ) : (
      <View style={{ alignItems: "center" }}>
        <Ionicons name="camera-outline" size={24} color={COLORS.textLight} />
        <Text style={styles.docUploadText}>{label}</Text>
      </View>
    )}
  </TouchableOpacity>
);

// --- MAIN COMPONENT ---

enum VehicleImageType {
  OTHER = 0,
  OVERVIEW = 1,
  LICENSE_PLATE = 2,
}

const getImageTypeLabel = (type: VehicleImageType): string => {
  switch (type) {
    case VehicleImageType.OVERVIEW:
      return "Toàn cảnh";
    case VehicleImageType.LICENSE_PLATE:
      return "Biển số";
    default:
      return "Khác";
  }
};

const VehicleFormModal: React.FC<Props> = ({ visible, onClose, onCreate }) => {
  const [form, setForm] = useState<any>({
    VehicleTypeId: "",
    PlateNumber: "",
    Model: "",
    Brand: "",
    YearOfManufacture: new Date().getFullYear(),
    Color: "",
    PayloadInKg: 0,
    VolumeInM3: 0,
    Features: [] as string[],
    VehicleImages: [] as any[],
    Documents: [] as any[],
  });

  const [vehicleTypes, setVehicleTypes] = useState<VehicleType[]>([]);
  const [showTypeList, setShowTypeList] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!visible) {
      setForm({
        VehicleTypeId: "",
        PlateNumber: "",
        Model: "",
        Brand: "",
        YearOfManufacture: new Date().getFullYear(),
        Color: "",
        PayloadInKg: 0,
        VolumeInM3: 0,
        Features: [],
        VehicleImages: [],
        Documents: [],
      });
      setVehicleTypes([]);
      setShowTypeList(false);
      return;
    }

    let mounted = true;
    (async () => {
      try {
        const data: any = await vehicleTypeService.getAll();
        if (!mounted) return;
        const items = Array.isArray(data) ? data : data?.data || [];
        const mapped: VehicleType[] = items.map((t: any) => ({
          vehicleTypeId:
            t.vehicleTypeId ?? t.VehicleTypeId ?? String(t.id ?? ""),
          vehicleTypeName:
            t.vehicleTypeName ?? t.VehicleTypeName ?? t.name ?? "",
          description: t.description ?? "",
        }));
        setVehicleTypes(mapped);
      } catch (e) {
        console.warn("Failed to load vehicle types", e);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [visible]);

  const handleChange = (k: string, v: any) =>
    setForm((p: any) => ({ ...p, [k]: v }));

  const pickImageWithType = async (imageType: VehicleImageType) => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Cần quyền", "Vui lòng cấp quyền truy cập thư viện ảnh.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: false,
      quality: 0.5,
      base64: true,
    });

    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      const dataUrl = asset.base64 ? `data:image/jpeg;base64,${asset.base64}` : undefined;

      // Fix MIME type to ensure it's always in format image/xxx
      let mimeType = asset.type || "image/jpeg";
      if (mimeType && !mimeType.includes('/')) {
        mimeType = `image/${mimeType}`;
      }

      // Tìm ảnh cũ cùng loại để giữ lại vehicleImageId
      const existingImage = form.VehicleImages.find(
        (img: any) => img.ImageType === imageType
      );

      const imageObj = {
        vehicleImageId: existingImage?.vehicleImageId || `vehicle-img-${Date.now()}`,
        vehicleImageURL: dataUrl,
        uri: asset.uri,
        ImageType: imageType,
        Caption: getImageTypeLabel(imageType),
        status: 1, // ACTIVE
        fileName: asset.fileName || `vehicle_${Date.now()}.jpg`,
        type: mimeType,
      };

      // Loại bỏ ảnh cũ cùng loại và thêm ảnh mới
      setForm((p: any) => ({
        ...p,
        VehicleImages: [
          ...p.VehicleImages.filter((img: any) => img.ImageType !== imageType),
          imageObj,
        ],
      }));
    }
  };

  const removeImage = (index: number) => {
    setForm((p: any) => ({
      ...p,
      VehicleImages: p.VehicleImages.filter((_: any, i: number) => i !== index),
    }));
  };

  const removeImageByType = (imageType: VehicleImageType) => {
    setForm((p: any) => ({
      ...p,
      VehicleImages: p.VehicleImages.filter((img: any) => img.ImageType !== imageType),
    }));
  };

  const addDocument = () =>
    setForm((p: any) => ({
      ...p,
      Documents: [
        ...(p.Documents || []),
        { ExpirationDate: "", FrontFile: null, BackFile: null },
      ],
    }));
  const removeDocument = (index: number) =>
    setForm((p: any) => ({
      ...p,
      Documents: p.Documents.filter((_: any, i: number) => i !== index),
    }));

  const pickDocumentFile = async (
    docIndex: number,
    which: "FrontFile" | "BackFile"
  ) => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Cần quyền", "Vui lòng cấp quyền truy cập thư viện ảnh.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: false,
      quality: 0.5,
      base64: true,
    });
    
    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      const dataUrl = asset.base64 ? `data:image/jpeg;base64,${asset.base64}` : undefined;

      // Fix MIME type to ensure it's always in format image/xxx
      let mimeType = asset.type || "image/jpeg";
      if (mimeType && !mimeType.includes('/')) {
        mimeType = `image/${mimeType}`;
      }

      const fileObj = {
        documentImageURL: dataUrl,
        uri: asset.uri,
        fileName: asset.fileName || `document_${Date.now()}.jpg`,
        type: mimeType,
      };
      
      setForm((p: any) => {
        const docs = [...(p.Documents || [])];
        docs[docIndex] = { ...(docs[docIndex] || {}), [which]: fileObj };
        return { ...p, Documents: docs };
      });
    }
  };

  const handleSubmit = () => {
    if (!form.PlateNumber) return Alert.alert("Lỗi", "Vui lòng nhập biển số");
    if (!form.VehicleImages || form.VehicleImages.length === 0)
      return Alert.alert("Lỗi", "Vui lòng tải ít nhất một ảnh xe");

    // Validate required image types
    const hasOverview = form.VehicleImages.some(
      (img: any) => img.ImageType === VehicleImageType.OVERVIEW
    );
    const hasLicensePlate = form.VehicleImages.some(
      (img: any) => img.ImageType === VehicleImageType.LICENSE_PLATE
    );

    if (!hasOverview || !hasLicensePlate) {
      return Alert.alert(
        "Lỗi",
        "Xe bắt buộc phải có ít nhất 1 ảnh 'Toàn cảnh' và 1 ảnh 'Biển số'."
      );
    }

    const dto = { ...form };
    setSubmitting(true);
    Promise.resolve(onCreate(dto)).finally(() => setSubmitting(false));
  };
  const [featureText, setFeatureText] = useState("");

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
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Thêm Xe Mới</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={24} color={COLORS.textLight} />
            </TouchableOpacity>
          </View>

          <ScrollView
            contentContainerStyle={styles.body}
            showsVerticalScrollIndicator={false}
          >
            <Text style={styles.sectionTitle}>Thông tin chung</Text>

            <InputField
              label="Biển số xe"
              value={form.PlateNumber}
              onChange={(t: string) => handleChange("PlateNumber", t)}
              placeholder="Ví dụ: 51C-123.45"
              required
            />

            <View style={styles.row}>
              <View style={{ flex: 1, marginRight: 10 }}>
                <Text style={styles.label}>Loại xe</Text>
                <TouchableOpacity
                  style={styles.dropdownBtn}
                  onPress={() => setShowTypeList(!showTypeList)}
                >
                  <Text
                    style={{
                      color: form.VehicleTypeId ? COLORS.text : "#9CA3AF",
                    }}
                  >
                    {vehicleTypes.find(
                      (vt) => vt.vehicleTypeId === form.VehicleTypeId
                    )?.vehicleTypeName || "Chọn loại xe"}
                  </Text>
                  <Feather
                    name="chevron-down"
                    size={18}
                    color={COLORS.textLight}
                  />
                </TouchableOpacity>
              </View>

              <InputField
                label="Hãng xe"
                width="48%"
                value={form.Brand}
                onChange={(t: string) => handleChange("Brand", t)}
                placeholder="Hino, Isuzu..."
              />
            </View>

            {showTypeList && (
              <View style={styles.dropdownList}>
                <ScrollView nestedScrollEnabled style={{ maxHeight: 150 }}>
                  {vehicleTypes.map((vt) => (
                    <TouchableOpacity
                      key={vt.vehicleTypeId}
                      style={styles.dropdownItem}
                      onPress={() => {
                        handleChange("VehicleTypeId", vt.vehicleTypeId);
                        setShowTypeList(false);
                      }}
                    >
                      <Text style={styles.dropdownItemText}>
                        {vt.vehicleTypeName}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}

            <View style={styles.row}>
              <InputField
                label="Model"
                width="32%"
                value={form.Model}
                onChange={(t: string) => handleChange("Model", t)}
              />
              <InputField
                label="Năm SX"
                width="32%"
                value={form.YearOfManufacture}
                onChange={(t: string) =>
                  handleChange("YearOfManufacture", Number(t) || 0)
                }
                keyboardType="numeric"
              />
              <InputField
                label="Màu sắc"
                width="32%"
                value={form.Color}
                onChange={(t: string) => handleChange("Color", t)}
              />
            </View>

            <View style={styles.divider} />
            <Text style={styles.sectionTitle}>Thông số kỹ thuật</Text>

            <View style={styles.row}>
              <InputField
                label="Tải trọng (kg)"
                width="48%"
                value={form.PayloadInKg}
                onChange={(t: string) =>
                  handleChange("PayloadInKg", Number(t) || 0)
                }
                keyboardType="numeric"
              />
              <InputField
                label="Thể tích (m³)"
                width="48%"
                value={form.VolumeInM3}
                onChange={(t: string) =>
                  handleChange("VolumeInM3", Number(t) || 0)
                }
                keyboardType="numeric"
              />
            </View>

            <View style={{ marginBottom: 12 }}>
              <Text style={styles.label}>Tính năng nổi bật</Text>
              <TextInput
                style={styles.input}
                placeholder="Ví dụ: GPS, Camera 360, Cảm biến lùi..."
                value={featureText}
                multiline
                onChangeText={(text) => {
                  setFeatureText(text);
                  const arr = text
                    .split(",")
                    .map((s) => s.trim())
                    .filter((s) => s.length > 0);
                  handleChange("Features", arr);
                }}
              />
            </View>

            <View style={styles.divider} />
            <Text style={styles.sectionTitle}>Hình ảnh xe</Text>
            <Text style={styles.helperText}>
              Ảnh xe thực tế (Bắt buộc: 1 ảnh Toàn cảnh + 1 ảnh Biển số)
            </Text>

            {/* Overview Images Section */}
            <Text style={styles.imageSubtitle}>🚗 Ảnh Toàn cảnh xe *</Text>
            <View style={styles.imageSection}>
              {form.VehicleImages.find((img: any) => img.ImageType === VehicleImageType.OVERVIEW) ? (
                <View style={styles.imagePreviewWrapper}>
                  <Image 
                    source={{ uri: form.VehicleImages.find((img: any) => img.ImageType === VehicleImageType.OVERVIEW).vehicleImageURL || form.VehicleImages.find((img: any) => img.ImageType === VehicleImageType.OVERVIEW).uri }} 
                    style={styles.imagePreview} 
                    resizeMode="cover" 
                  />
                  
                  <TouchableOpacity 
                    style={styles.changeImageBtn} 
                    onPress={() => pickImageWithType(VehicleImageType.OVERVIEW)}
                  >
                    <MaterialCommunityIcons name="camera-retake-outline" size={20} color="#fff" />
                    <Text style={styles.changeImageText}>Đổi ảnh</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={styles.removeImageBtn} 
                    onPress={() => removeImageByType(VehicleImageType.OVERVIEW)}
                  >
                    <Ionicons name="trash-outline" size={20} color="#fff" />
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity 
                  style={styles.uploadPlaceholder} 
                  onPress={() => pickImageWithType(VehicleImageType.OVERVIEW)}
                >
                  <View style={styles.iconCircle}>
                    <MaterialCommunityIcons name="car-side" size={32} color={COLORS.primary} />
                  </View>
                  <Text style={styles.uploadText}>Tải ảnh toàn cảnh</Text>
                  <Text style={styles.uploadSubText}>Hỗ trợ JPG, PNG</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* License Plate Images Section */}
            <Text style={[styles.imageSubtitle, { marginTop: 16 }]}>
              🔖 Ảnh Biển số xe *
            </Text>
            <View style={styles.imageSection}>
              {form.VehicleImages.find((img: any) => img.ImageType === VehicleImageType.LICENSE_PLATE) ? (
                <View style={styles.imagePreviewWrapper}>
                  <Image 
                    source={{ uri: form.VehicleImages.find((img: any) => img.ImageType === VehicleImageType.LICENSE_PLATE).vehicleImageURL || form.VehicleImages.find((img: any) => img.ImageType === VehicleImageType.LICENSE_PLATE).uri }} 
                    style={styles.imagePreview} 
                    resizeMode="cover" 
                  />
                  
                  <TouchableOpacity 
                    style={styles.changeImageBtn} 
                    onPress={() => pickImageWithType(VehicleImageType.LICENSE_PLATE)}
                  >
                    <MaterialCommunityIcons name="camera-retake-outline" size={20} color="#fff" />
                    <Text style={styles.changeImageText}>Đổi ảnh</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={styles.removeImageBtn} 
                    onPress={() => removeImageByType(VehicleImageType.LICENSE_PLATE)}
                  >
                    <Ionicons name="trash-outline" size={20} color="#fff" />
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity 
                  style={styles.uploadPlaceholder} 
                  onPress={() => pickImageWithType(VehicleImageType.LICENSE_PLATE)}
                >
                  <View style={styles.iconCircle}>
                    <MaterialCommunityIcons name="card-text" size={32} color={COLORS.primary} />
                  </View>
                  <Text style={styles.uploadText}>Tải ảnh biển số</Text>
                  <Text style={styles.uploadSubText}>Hỗ trợ JPG, PNG</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* <View style={styles.divider} />
            <View
              style={[styles.row, { alignItems: "center", marginBottom: 10 }]}
            >
              <Text style={[styles.sectionTitle, { marginBottom: 0 }]}>
                Tài liệu & Giấy tờ
              </Text>
              <TouchableOpacity onPress={addDocument} style={styles.addDocBtn}>
                <Ionicons
                  name="add-circle-outline"
                  size={18}
                  color={COLORS.primary}
                />
                <Text
                  style={{
                    color: COLORS.primary,
                    fontWeight: "600",
                    fontSize: 13,
                  }}
                >
                  Thêm hồ sơ
                </Text>
              </TouchableOpacity>
            </View>

            {form.Documents.map((doc: any, idx: number) => (
              <View key={idx} style={styles.docCard}>
                <View style={styles.docHeader}>
                  <Text style={styles.docTitle}>Hồ sơ #{idx + 1}</Text>
                  <TouchableOpacity onPress={() => removeDocument(idx)}>
                    <Text
                      style={{
                        color: COLORS.danger,
                        fontSize: 12,
                        fontWeight: "600",
                      }}
                    >
                      Xóa
                    </Text>
                  </TouchableOpacity>
                </View>

                <DateInput
                  label="Ngày hết hạn"
                  value={doc.ExpirationDate || ""}
                  onChange={(d: string | null) => {
                    const docs = [...form.Documents];
                    docs[idx] = {
                      ...(docs[idx] || {}),
                      ExpirationDate: d ?? "",
                    };
                    setForm({ ...form, Documents: docs });
                  }}
                />

                <View style={styles.row}>
                  <View style={{ width: "48%" }}>
                    <DocumentUploadBox
                      label="Mặt trước"
                      image={doc.FrontFile}
                      onPress={() => pickDocumentFile(idx, "FrontFile")}
                    />
                  </View>
                  <View style={{ width: "48%" }}>
                    <DocumentUploadBox
                      label="Mặt sau"
                      image={doc.BackFile}
                      onPress={() => pickDocumentFile(idx, "BackFile")}
                    />
                  </View>
                </View>
              </View>
            ))} */}
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
                <Text style={styles.btnSubmitText}>Tạo Xe</Text>
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
    maxWidth: 600,
    maxHeight: "90%",
    backgroundColor: COLORS.bg,
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 10,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerTitle: { fontSize: 18, fontWeight: "700", color: COLORS.primary },
  closeBtn: { padding: 4 },

  body: { padding: 20 },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: COLORS.text,
    marginBottom: 12,
  },
  divider: { height: 1, backgroundColor: COLORS.border, marginVertical: 16 },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  label: { fontSize: 13, fontWeight: "500", color: "#374151", marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: COLORS.text,
    backgroundColor: COLORS.inputBg,
  },

  dropdownBtn: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: COLORS.inputBg,
  },
  dropdownList: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    marginTop: -8,
    marginBottom: 12,
    backgroundColor: "#fff",
    zIndex: 10,
  },
  dropdownItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  dropdownItemText: { fontSize: 14, color: COLORS.text },

  helperText: { fontSize: 12, color: COLORS.textLight, marginBottom: 8 },
  imageSection: { alignItems: "center", marginBottom: 16 },
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
  imageSubtitle: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.text,
    marginBottom: 8,
    marginTop: 4,
  },
  imageList: { flexDirection: "row" },
  addImageBtn: {
    width: 80,
    height: 80,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderStyle: "dashed",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F9FAFB",
    marginRight: 12,
  },
  addImageText: { fontSize: 11, color: COLORS.textLight, marginTop: 4 },
  imageWrapper: { position: "relative", marginRight: 12 },
  thumbnail: {
    width: 80,
    height: 80,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  removeBtn: {
    position: "absolute",
    top: -6,
    right: -6,
    backgroundColor: COLORS.textLight,
    width: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#fff",
  },
  replaceOverlay: { ...StyleSheet.absoluteFillObject },
  imageTypeBadge: {
    position: "absolute",
    bottom: 4,
    left: 4,
    right: 4,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    borderRadius: 4,
    paddingVertical: 2,
    paddingHorizontal: 6,
  },
  imageTypeBadgeText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "600",
    textAlign: "center",
  },

  addDocBtn: { flexDirection: "row", alignItems: "center", gap: 4 },
  docCard: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    backgroundColor: "#F8FAFC",
  },
  docHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  docTitle: { fontWeight: "600", fontSize: 13, color: COLORS.text },
  docUploadBox: {
    height: 80,
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderStyle: "dashed",
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  docUploadText: { fontSize: 11, color: COLORS.textLight, marginTop: 4 },
  docImage: { width: "100%", height: "100%", borderRadius: 8 },

  footer: {
    flexDirection: "row",
    gap: 12,
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    backgroundColor: "#fff",
  },
  btnCancel: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: "center",
  },
  btnCancelText: { fontWeight: "600", color: "#374151" },
  btnSubmit: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: COLORS.primary,
    alignItems: "center",
  },
  btnSubmitText: { fontWeight: "600", color: "#fff" },
});

export default VehicleFormModal;
