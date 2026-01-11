import React, { useEffect, useState } from "react";
import {

  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  StatusBar,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import tripService from "@/services/tripService";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";

interface DriverTripItem {
  tripId: string;
  tripCode: string;
  status: string;
  createAt: string;
  updateAt: string;
  vehicleModel?: string;
  vehiclePlate?: string;
  vehicleType?: string;
  ownerName?: string;
  ownerCompany?: string;
  startAddress?: string;
  endAddress?: string;
  tripRouteSummary?: string;
}

const StatusBadge = ({ status }: { status: string }) => {
  const config: any = {
    CREATED: { color: "#3B82F6", bg: "#EFF6FF", label: "Mới tạo" },
    PENDING: { color: "#F59E0B", bg: "#FFFBEB", label: "Đang xử lý" },
    SIGNED: { color: "#059669", bg: "#ECFDF5", label: "Đã ký HĐ" },
    IN_PROGRESS: { color: "#8B5CF6", bg: "#F5F3FF", label: "Đang chạy" },
    COMPLETED: { color: "#10B981", bg: "#D1FAE5", label: "Hoàn thành" },
    CANCELLED: { color: "#EF4444", bg: "#FEF2F2", label: "Đã hủy" },
    AWAITING_PROVIDER_CONTRACT: {
      color: "#6366F1",
      bg: "#EEF2FF",
      label: "Chờ ký HĐ",
    },
    AWAITING_DRIVER_CONTRACT: {
      color: "#6366F1",
      bg: "#EEF2FF",
      label: "Chờ ký HĐ",
    },
  }[status?.toUpperCase()] || {
    color: "#6B7280",
    bg: "#F3F4F6",
    label: status,
  };

  return (
    <View style={[styles.badge, { backgroundColor: config.bg }]}>
      <Text style={[styles.badgeText, { color: config.color }]}>
        {config.label}
      </Text>
    </View>
  );
};

const TripCard = ({
  item,
  onPress,
}: {
  item: DriverTripItem;
  onPress: () => void;
}) => {
  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.9}>
      <View style={styles.cardHeader}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <View style={styles.iconBox}>
            <MaterialCommunityIcons
              name="truck-delivery-outline"
              size={20}
              color="#4F46E5"
            />
          </View>
          <View>
            <Text style={styles.tripCode}>#{item.tripCode}</Text>
            <Text style={styles.dateText}>{formatDate(item.createAt)}</Text>
          </View>
        </View>
        <StatusBadge status={item.status} />
      </View>

      <View style={styles.divider} />

      <View style={styles.cardBody}>
        <View style={styles.timelineContainer}>
          <View style={styles.timelineDecor}>
            <View style={[styles.dot, { backgroundColor: "#3B82F6" }]} />
            <View style={styles.line} />
            <View style={[styles.dot, { backgroundColor: "#EF4444" }]} />
          </View>
          <View style={{ flex: 1, gap: 12 }}>
            <View>
              <Text style={styles.timelineLabel}>Điểm đi</Text>
              <Text style={styles.timelineValue} numberOfLines={1}>
                {item.startAddress || "Chưa cập nhật"}
              </Text>
            </View>
            <View>
              <Text style={styles.timelineLabel}>Điểm đến</Text>
              <Text style={styles.timelineValue} numberOfLines={1}>
                {item.endAddress || "Chưa cập nhật"}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.infoGrid}>
          <View style={styles.infoItem}>
            <Ionicons name="car-outline" size={14} color="#6B7280" />
            <Text style={styles.infoText}>
              {item.vehiclePlate || "Chưa gán xe"}
            </Text>
          </View>
          <View style={styles.infoItem}>
            <Ionicons name="person-outline" size={14} color="#6B7280" />
            <Text style={styles.infoText} numberOfLines={1}>
              {item.ownerCompany || item.ownerName || "Chủ hàng"}
            </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const MyTripsListScreen: React.FC = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<DriverTripItem[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const pageSize = 10;
  const [refreshing, setRefreshing] = useState(false);

  const fetchPage = async (p = 1, append = false) => {
    try {
      if (!append && !refreshing) setLoading(true);
      setError(null);

      let res: any = null;
      try {
        res = await tripService.getTripsByDriver(p, pageSize);
      } catch (apiErr: any) {
        const status = apiErr?.response?.status;
        const apiMessage =
          apiErr?.response?.data?.message || apiErr?.message || "";
        if (
          status === 404 ||
          (typeof apiMessage === "string" && /no trips?/i.test(apiMessage))
        ) {
          setTotal(0);
          setData([]);
          setPage(p);
          return;
        }
        throw apiErr;
      }

      const ok = res?.isSuccess ?? res?.statusCode === 200;

      if (
        res?.statusCode === 404 ||
        (typeof res?.message === "string" && /no trips?/i.test(res.message))
      ) {
        setTotal(0);
        setData([]);
        setPage(p);
        return;
      }

      if (!ok)
        throw new Error(res?.message || "Không thể tải danh sách chuyến");

      const paged = res?.result ?? res?.data ?? {};
      const items: DriverTripItem[] = Array.isArray(paged?.items)
        ? paged.items
        : Array.isArray(paged?.data)
        ? paged.data
        : [];

      setTotal(paged?.totalCount ?? items.length);
      setData((prev) => (append ? [...prev, ...items] : items));
      setPage(p);
    } catch (e: any) {
      setError(e?.message || "Lỗi không xác định");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      fetchPage(1);
      return () => {};
    }, [])
  );

  const onEndReached = () => {
    const maxPage = Math.ceil(total / pageSize);
    if (loading || page >= maxPage) return;
    fetchPage(page + 1, true);
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchPage(1);
  };

  if (loading && data.length === 0) {
    return (
      <SafeAreaView style={styles.centered}>
        <ActivityIndicator size="large" color="#4F46E5" />
        <Text style={{ marginTop: 12, color: "#6B7280" }}>
          Đang tải dữ liệu...
        </Text>
      </SafeAreaView>
    );
  }

  if (error && data.length === 0) {
    return (
      <SafeAreaView style={styles.centered}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={() => fetchPage(1)}>
          <Text style={styles.retryText}>Thử lại</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F3F4F6" />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Chuyến Đi Của Tôi</Text>
        <View style={{ width: 24 }} />
      </View>

      <FlatList
        data={data}
        keyExtractor={(it) => it.tripId}
        renderItem={({ item }) => (
          <TripCard
            item={item}
            onPress={() => router.push(`/(driver)/trip/${item.tripId}`)}
          />
        )}
        contentContainerStyle={{ padding: 16, paddingBottom: 120 }}
        onEndReachedThreshold={0.5}
        onEndReached={onEndReached}
        refreshing={refreshing}
        onRefresh={onRefresh}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <MaterialCommunityIcons
              name="clipboard-text-off-outline"
              size={48}
              color="#9CA3AF"
            />
            <Text style={styles.emptyText}>Bạn chưa có chuyến đi nào.</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F3F4F6" },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F3F4F6",
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#FFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: "700", color: "#111827" },

  errorText: { color: "#EF4444", textAlign: "center", marginBottom: 8 },
  retryBtn: {
    backgroundColor: "#4F46E5",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryText: { color: "#FFF", fontWeight: "600" },
  emptyState: { alignItems: "center", marginTop: 60 },
  emptyText: { color: "#6B7280", marginTop: 12, fontSize: 14 },

  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
    borderWidth: 1,
    borderColor: "#F3F4F6",
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#EEF2FF",
    alignItems: "center",
    justifyContent: "center",
  },
  tripCode: { fontSize: 16, fontWeight: "700", color: "#111827" },
  dateText: { fontSize: 12, color: "#6B7280", marginTop: 2 },

  divider: { height: 1, backgroundColor: "#F3F4F6", marginVertical: 12 },

  cardBody: { gap: 12 },
  timelineContainer: { flexDirection: "row" },
  timelineDecor: {
    alignItems: "center",
    width: 16,
    paddingTop: 6,
    marginRight: 8,
  },
  dot: { width: 8, height: 8, borderRadius: 4 },
  line: { flex: 1, width: 2, backgroundColor: "#E5E7EB", marginVertical: 4 },
  timelineLabel: {
    fontSize: 11,
    color: "#9CA3AF",
    textTransform: "uppercase",
    marginBottom: 2,
  },
  timelineValue: { fontSize: 14, color: "#374151", fontWeight: "500" },

  infoGrid: { flexDirection: "row", gap: 16, marginTop: 4 },
  infoItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#F9FAFB",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  infoText: { fontSize: 12, color: "#4B5563", fontWeight: "500" },

  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  badgeText: { fontSize: 11, fontWeight: "700" },
});

export default MyTripsListScreen;
