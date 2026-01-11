import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";

// Component hiển thị 1 vòng tròn (đơn giản hóa bằng View border)
const CircleProgress = ({ current, max, label, color }: any) => {
  const percent = Math.min((current / max) * 100, 100);
  return (
    <View style={styles.circleItem}>
      <Text style={styles.circleLabel}>{label}</Text>
      <Text style={styles.circleSubLabel}>(Max {max}h)</Text>

      <View style={[styles.ring, { borderColor: color + "30" }]}>
        {/* Giả lập Progress Ring bằng View đè */}
        <View
          style={[
            styles.ringProgress,
            {
              borderColor: color,
              borderRightColor: "transparent",
              transform: [{ rotate: "45deg" }],
            },
          ]}
        />

        <View style={styles.ringInner}>
          <Text style={[styles.ringValue, { color }]}>{current}h</Text>
          <Text style={styles.ringPercent}>{Math.round(percent)}%</Text>
        </View>
      </View>

      <Text style={[styles.statusText, { color }]}>
        {percent > 80 ? "Sắp tới hạn" : "An toàn"}
      </Text>
    </View>
  );
};

const DrivingHoursCard = ({ stats }: { stats: any }) => {
  const router = useRouter();

  return (
    <View style={styles.card}>
      <View style={styles.row}>
        <CircleProgress
          label="Liên tục"
          current={stats.continuous.current}
          max={stats.continuous.max}
          color="#10B981" // Green
        />
        <View style={styles.divider} />
        <CircleProgress
          label="Trong ngày"
          current={stats.daily.current}
          max={stats.daily.max}
          color="#F59E0B" // Orange/Yellow
        />
        <View style={styles.divider} />
        <CircleProgress
          label="Tuần này"
          current={stats.weekly.current}
          max={stats.weekly.max}
          color="#3B82F6" // Blue
        />
      </View>
      <TouchableOpacity
        onPress={() => router.push("/(driver)/my-trips")}
        activeOpacity={0.7}
      >
        <Text style={styles.link}>Xem lịch sử lái xe ›</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  divider: {
    width: 1,
    backgroundColor: "#F1F5F9",
    marginHorizontal: 4,
  },
  circleItem: {
    alignItems: "center",
    flex: 1,
  },
  circleLabel: { fontSize: 13, fontWeight: "600", color: "#1E293B" },
  circleSubLabel: { fontSize: 10, color: "#64748B", marginBottom: 8 },

  // Ring Simulator
  ring: {
    width: 70,
    height: 70,
    borderRadius: 35,
    borderWidth: 4,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
    position: "relative",
  },
  ringProgress: {
    // Đây chỉ là giả lập Visual, nếu muốn chuẩn phải dùng SVG
    position: "absolute",
    top: -4,
    left: -4,
    width: 70,
    height: 70,
    borderRadius: 35,
    borderWidth: 4,
  },
  ringInner: { alignItems: "center" },
  ringValue: { fontSize: 14, fontWeight: "800" },
  ringPercent: { fontSize: 10, color: "#64748B" },

  statusText: { fontSize: 12, fontWeight: "600" },
  link: {
    textAlign: "right",
    marginTop: 12,
    fontSize: 12,
    color: "#3B82F6",
    fontWeight: "500",
  },
});

export default DrivingHoursCard;
