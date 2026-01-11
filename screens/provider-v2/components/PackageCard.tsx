import React from "react";
import { View, Text, StyleSheet, Image, TouchableOpacity } from "react-native";
import { MaterialCommunityIcons, Feather } from "@expo/vector-icons";
import { Package, PackageStatus } from "../../../models/types";

interface PackageCardProps {
  pkg: Package;
  onEdit: () => void;
  onDelete: () => void;
  onPost: () => void;
  getStatusColor?: (status: string) => string;
}

// Default status colors (fallback if not provided)
const defaultGetStatusColor = (status: string) => {
  switch (status) {
    case "PENDING":
      return "#F59E0B"; // Cam
    case "APPROVED":
      return "#10B981"; // Xanh lá
    case "REJECTED":
      return "#EF4444"; // Đỏ
    case "IN_TRANSIT":
      return "#3B82F6"; // Xanh dương
    case "DELIVERED":
      return "#10B981"; // Xanh lá
    case "COMPLETED":
      return "#6B7280"; // Xám
    case PackageStatus.OPEN:
      return "#10B981"; // Xanh lá
    case PackageStatus.CLOSED:
      return "#6B7280"; // Xám
    case PackageStatus.DELETED:
      return "#EF4444"; // Đỏ
    default:
      return "#9CA3AF"; // Xám nhạt
  }
};

const getStatusText = (status: string) => {
  switch (status) {
    case "PENDING":
      return "Chờ duyệt";
    case "APPROVED":
      return "Đã duyệt";
    case "REJECTED":
      return "Từ chối";
    case "IN_TRANSIT":
      return "Đang vận chuyển";
    case "DELIVERED":
      return "Đã giao";
    case "COMPLETED":
      return "Hoàn thành";
    case PackageStatus.OPEN:
      return "Đang mở";
    case PackageStatus.CLOSED:
      return "Đã đóng";
    case PackageStatus.DELETED:
      return "Đã xóa";
    default:
      return status;
  }
};

const PackageCard: React.FC<PackageCardProps> = ({
  pkg,
  onEdit,
  onDelete,
  onPost,
  getStatusColor,
}) => {
  const [showAllAttributes, setShowAllAttributes] = React.useState(false);
  
  const {
    packageCode,
    title,
    description,
    quantity,
    unit,
    weightKg,
    volumeM3,
    images = [],
    packageImages = [],
    status,
    isFragile,
    isLiquid,
    isRefrigerated,
    isFlammable,
    isHazardous,
    isBulky,
    isPerishable,
    otherRequirements,
  } = pkg;

  // Chỉ cho phép edit/delete khi status KHÔNG phải PENDING
  const canEditOrDelete =  status === PackageStatus.PENDING;

  // Resolve image URL defensively: packageImages may contain objects with different keys or plain strings
  let imageUrl = "https://via.placeholder.com/400";
  const imgList = packageImages && packageImages.length > 0 ? packageImages : images;
  if (imgList && imgList.length > 0) {
    const first = imgList[0];
    if (typeof first === "string") imageUrl = first;
    else if (first) {
      const f: any = first;
      imageUrl =
        f.imageUrl ??
        f.packageImageURL ??
        f.url ??
        f.uri ??
        f.packageImageUrl ??
        imageUrl;
    }
  }

  // Collect special attributes
  const specialAttributes = [];
  if (isFragile) specialAttributes.push({ icon: "alert-circle", label: "Dễ vỡ", color: "#F59E0B" });
  if (isLiquid) specialAttributes.push({ icon: "water", label: "Chất lỏng", color: "#3B82F6" });
  if (isRefrigerated) specialAttributes.push({ icon: "snowflake", label: "Làm lạnh", color: "#06B6D4" });
  if (isFlammable) specialAttributes.push({ icon: "flame", label: "Dễ cháy", color: "#EF4444" });
  if (isHazardous) specialAttributes.push({ icon: "alert-triangle", label: "Nguy hiểm", color: "#DC2626" });
  if (isBulky) specialAttributes.push({ icon: "package", label: "Cồng kềnh", color: "#8B5CF6" });
  if (isPerishable) specialAttributes.push({ icon: "clock", label: "Dễ hỏng", color: "#F97316" });

  // Use provided getStatusColor or fallback to default
  const statusColorFn = getStatusColor || defaultGetStatusColor;
  const statusColor = statusColorFn(status);
  const statusLabel = getStatusText(status);

  return (
    <View
      style={[
        styles.card,
        {
          borderColor:
            status === PackageStatus.PENDING ? "#3B82F6" : "transparent",
          borderWidth: status === PackageStatus.PENDING ? 1 : 0,
        },
      ]}
    >
      {/* IMAGE HEADER */}
      <View style={styles.imageContainer}>
        <Image
          source={{ uri: imageUrl }}
          style={styles.image}
          resizeMode="cover"
          onError={(e) => {
            // Fallback to placeholder if image fails to load
            // eslint-disable-next-line no-console
            console.warn(
              "Package image failed to load, showing placeholder",
              e.nativeEvent?.error
            );
          }}
        />
        {/* Ribbon Status */}
        <View style={[styles.badge, { backgroundColor: statusColor }]}>
          <Text style={styles.badgeText}>{statusLabel}</Text>
        </View>
      </View>

      {/* CONTENT */}
      <View style={styles.content}>
        {/* Package Code */}
        {packageCode && (
          <View style={styles.codeRow}>
            <MaterialCommunityIcons name="barcode" size={14} color="#6B7280" />
            <Text style={styles.codeText}>{packageCode}</Text>
          </View>
        )}
        
        <Text style={styles.title} numberOfLines={2}>
          {title}
        </Text>
        <Text style={styles.desc} numberOfLines={2}>
          {description || "Chưa có mô tả"}
        </Text>

        {/* STATS GRID */}
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <MaterialCommunityIcons
              name="cube-outline"
              size={16}
              color="#6B7280"
            />
            <Text style={styles.statValue}>
              {quantity} {unit}
            </Text>
          </View>
          <View style={styles.statItem}>
            <MaterialCommunityIcons
              name="weight-kilogram"
              size={16}
              color="#6B7280"
            />
            <Text style={styles.statValue}>{weightKg} kg</Text>
          </View>
          <View style={styles.statItem}>
            <MaterialCommunityIcons
              name="arrow-expand-all"
              size={16}
              color="#6B7280"
            />
            <Text style={styles.statValue}>{volumeM3} m³</Text>
          </View>
        </View>

        {/* Special Attributes */}
        {specialAttributes.length > 0 && (
          <View>
            <View style={styles.attributesRow}>
              {(showAllAttributes ? specialAttributes : specialAttributes.slice(0, 3)).map((attr, idx) => (
                <View key={idx} style={[styles.attributeChip, { borderColor: attr.color }]}>
                  <Feather name={attr.icon as any} size={10} color={attr.color} />
                  <Text style={[styles.attributeText, { color: attr.color }]}>
                    {attr.label}
                  </Text>
                </View>
              ))}
            </View>
            {specialAttributes.length > 3 && (
              <TouchableOpacity 
                onPress={() => setShowAllAttributes(!showAllAttributes)}
                style={styles.toggleAttributesBtn}
              >
                <Text style={styles.toggleAttributesText}>
                  {showAllAttributes ? 'Thu gọn' : `Xem thêm ${specialAttributes.length - 3} thuộc tính`}
                </Text>
                <Feather 
                  name={showAllAttributes ? "chevron-up" : "chevron-down"} 
                  size={12} 
                  color="#0284C7" 
                />
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Other Requirements */}
        {otherRequirements && (
          <View style={styles.requirementsRow}>
            <MaterialCommunityIcons name="note-text-outline" size={12} color="#6B7280" />
            <Text style={styles.requirementsText} numberOfLines={1}>
              {otherRequirements}
            </Text>
          </View>
        )}

        {/* FOOTER ACTIONS */}
        <View style={styles.footer}>
          <View style={styles.actionGroup}>
            <TouchableOpacity 
              onPress={onEdit} 
              style={[styles.iconBtn, !canEditOrDelete && styles.iconBtnDisabled]}
              disabled={!canEditOrDelete}
            >
              <Feather name="edit-2" size={16} color={canEditOrDelete ? "#4B5563" : "#D1D5DB"} />
            </TouchableOpacity>
            <TouchableOpacity 
              onPress={onDelete} 
              style={[styles.iconBtn, !canEditOrDelete && styles.iconBtnDisabled]}
              disabled={!canEditOrDelete}
            >
              <Feather name="trash-2" size={16} color={canEditOrDelete ? "#EF4444" : "#D1D5DB"} />
            </TouchableOpacity>
          </View>

          {/* Nút Đăng Tin (chỉ hiện khi Pending) */}
          {/* {status === PackageStatus.PENDING && (
            <TouchableOpacity onPress={onPost} style={styles.postBtn}>
              <Text style={styles.postBtnText}>Đăng tin</Text>
              <Feather name="send" size={12} color="#fff" />
            </TouchableOpacity>
          )} */}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    overflow: "hidden",
    marginBottom: 16,
    marginHorizontal: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 4,
  },
  imageContainer: {
    height: 120,
    position: "relative",
    backgroundColor: "#F3F4F6",
  },
  image: { width: "100%", height: "100%" },
  badge: {
    position: "absolute",
    top: 8,
    right: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  badgeText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "700",
    textTransform: "uppercase",
  },

  content: { padding: 12 },
  codeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 6,
    backgroundColor: "#F9FAFB",
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 4,
    alignSelf: "flex-start",
  },
  codeText: {
    fontSize: 10,
    fontWeight: "600",
    color: "#6B7280",
    letterSpacing: 0.5,
  },
  title: { fontSize: 15, fontWeight: "700", color: "#111827", marginBottom: 4 },
  desc: { fontSize: 12, color: "#6B7280", marginBottom: 12, height: 32 },

  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: "#F9FAFB",
    borderRadius: 8,
    padding: 8,
    marginBottom: 8,
  },
  statItem: { flexDirection: "row", alignItems: "center", gap: 4 },
  statValue: { fontSize: 11, fontWeight: "600", color: "#374151" },

  attributesRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 4,
    marginBottom: 4,
  },
  attributeChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 4,
    borderWidth: 1,
    backgroundColor: "#FFFFFF",
  },
  attributeText: {
    fontSize: 9,
    fontWeight: "600",
  },
  toggleAttributesBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    paddingVertical: 6,
    marginBottom: 4,
  },
  toggleAttributesText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#0284C7",
  },

  requirementsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#FEF3C7",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginBottom: 8,
  },
  requirementsText: {
    flex: 1,
    fontSize: 10,
    color: "#92400E",
    fontStyle: "italic",
  },

  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
    paddingTop: 12,
  },
  actionGroup: { flexDirection: "row", gap: 8 },
  iconBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
  },
  iconBtnDisabled: {
    backgroundColor: "#F9FAFB",
    opacity: 0.5,
  },

  postBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#0284C7",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  postBtnText: { color: "#fff", fontSize: 11, fontWeight: "600" },
});

export default PackageCard;
