import React from "react";
import { View, Text, StyleSheet, Image, TouchableOpacity } from "react-native";
import { MaterialCommunityIcons, Feather } from "@expo/vector-icons";
import { Vehicle } from "../../../models/types";

interface Props {
  vehicle: Vehicle;
  onEdit: () => void;
  onDelete: () => void;
  onPress?: () => void;
}

const VehicleCard: React.FC<Props> = ({
  vehicle,
  onEdit,
  onDelete,
  onPress,
}) => {
  const v: any = vehicle as any;

  // Prefer backend ImageUrls / ImageURL fields, fallback to older keys
  const imageUrl =
    (v.ImageUrls &&
      v.ImageUrls.length > 0 &&
      (v.ImageUrls[0].ImageURL || v.ImageUrls[0].imageURL)) ||
    (v.imageUrls &&
      v.imageUrls.length > 0 &&
      (v.imageUrls[0].imageURL || v.imageUrls[0].ImageURL)) ||
    "https://via.placeholder.com/400";

  // Màu sắc dựa theo trạng thái
  const getStatusColor = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return "#10B981";
      case "IN_USE":
        return "#F59E0B";
      case "INACTIVE":
        return "#6B7280";
      default:
        return "#9CA3AF";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return "Hoạt động";
      case "IN_USE":
        return "Đang dùng";
      case "INACTIVE":
        return "Không hoạt động";
      default:
        return status || "N/A";
    }
  };

  const statusColor = getStatusColor(v.Status ?? v.status);
  const statusText = getStatusLabel(v.Status ?? v.status);

  return (
    <TouchableOpacity
      style={styles.cardContainer}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {/* 1. Image Header */}
      <View style={styles.imageContainer}>
        <Image
          source={{ uri: imageUrl }}
          style={styles.image}
          resizeMode="cover"
        />

        {/* RIBBON STATUS (Dải băng góc phải) */}
        <View style={styles.ribbonContainer}>
          <View style={[styles.ribbon, { backgroundColor: statusColor }]}>
            <Text style={styles.ribbonText}>{statusText}</Text>
          </View>
        </View>
      </View>

      {/* 2. Content Body */}
      <View style={styles.contentContainer}>
        {/* Biển số & Model */}
        <Text style={styles.plateNumber}>
          {v.PlateNumber ?? v.plateNumber ?? v.plate ?? "—"}
        </Text>
        <Text style={styles.modelText} numberOfLines={1}>
          {v.Brand ?? v.brand ?? v.Model ?? v.model ?? "Unknown"}
        </Text>

        {/* Thông số kỹ thuật (Grid 3 cột) */}
        <View style={styles.specsContainer}>
          {/* Cột 1: Tải trọng */}
          <View style={styles.specItem}>
            <MaterialCommunityIcons
              name="scale-balance"
              size={18}
              color="#10B981"
            />
            <Text style={styles.specValue}>
              {v.PayloadInKg ?? v.payloadInKg
                ? `${v.PayloadInKg ?? v.payloadInKg}kg`
                : "-"}
            </Text>
          </View>

          {/* Cột 2: Thể tích */}
          <View style={styles.specItem}>
            <MaterialCommunityIcons
              name="cube-outline"
              size={18}
              color="#10B981"
            />
            <Text style={styles.specValue}>
              {v.VolumeInM3 ?? v.volumeInM3
                ? `${v.VolumeInM3 ?? v.volumeInM3}m³`
                : "-"}
            </Text>
          </View>

          {/* Cột 3: Năm SX */}
          <View style={styles.specItem}>
            <MaterialCommunityIcons
              name="calendar-blank-outline"
              size={18}
              color="#10B981"
            />
            <Text style={styles.specValue}>
              {v.YearOfManufacture ?? v.yearOfManufacture ?? "-"}
            </Text>
          </View>
        </View>

        {/* Divider mờ */}
        <View style={styles.divider} />

        {/* 3. Action Buttons (Edit/Delete) */}
        <View style={styles.actionRow}>
          <TouchableOpacity
            onPress={(e) => {
              e.stopPropagation();
              onEdit();
            }}
            style={styles.circleButton}
          >
            <Feather name="edit-2" size={18} color="#6B7280" />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={(e) => {
              console.log(
                "Delete button pressed for vehicle:",
                vehicle.plateNumber
              );
              e.stopPropagation();
              onDelete();
            }}
            style={styles.circleButton}
            activeOpacity={0.6}
          >
            <Feather name="trash-2" size={18} color="#EF4444" />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    overflow: "hidden",
    margin: 8,
    flex: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  imageContainer: {
    position: "relative",
  },
  image: {
    width: "100%",
    height: 130,
    backgroundColor: "#F3F4F6",
  },
  ribbonContainer: {
    position: "absolute",
    top: 12,
    right: -30,
    transform: [{ rotate: "45deg" }],
    overflow: "hidden",
  },
  ribbon: {
    paddingVertical: 4,
    paddingHorizontal: 40,
  },
  ribbonText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "700",
    textAlign: "center",
  },
  contentContainer: {
    padding: 12,
  },
  plateNumber: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 4,
  },
  modelText: {
    fontSize: 13,
    color: "#6B7280",
    marginBottom: 12,
  },
  specsContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    backgroundColor: "#F9FAFB",
    padding: 10,
    borderRadius: 8,
  },
  specItem: {
    alignItems: "center",
  },
  specValue: {
    fontSize: 12,
    fontWeight: "600",
    color: "#111827",
    marginTop: 4,
  },
  divider: {
    height: 1,
    backgroundColor: "#E5E7EB",
    marginVertical: 12,
  },
  actionRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 8,
  },
  circleButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
  },
});

export default VehicleCard;
