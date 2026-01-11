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
import driverActivityLogService, {
  DriverActivityLogDTO,
  PaginatedLogsDTO,
} from "@/services/driverActivityLogService";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";

const LogLevelBadge = ({ level }: { level: string }) => {
  const config: any = {
    Info: {
      color: "#3B82F6",
      bg: "#EFF6FF",
      icon: "information-circle",
      label: "Thông tin",
    },
    Warning: {
      color: "#F59E0B",
      bg: "#FFFBEB",
      icon: "warning",
      label: "Cảnh báo",
    },
    Critical: {
      color: "#EF4444",
      bg: "#FEF2F2",
      icon: "alert-circle",
      label: "Nghiêm trọng",
    },
  }[level] || {
    color: "#6B7280",
    bg: "#F3F4F6",
    icon: "ellipse",
    label: level,
  };

  return (
    <View style={[styles.levelBadge, { backgroundColor: config.bg }]}>
      <Ionicons name={config.icon as any} size={14} color={config.color} />
      <Text style={[styles.levelText, { color: config.color }]}>
        {config.label}
      </Text>
    </View>
  );
};

const LogCard = ({ item }: { item: DriverActivityLogDTO }) => {
  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatId = (id: string) => {
    if (!id) return "";
    return id.length > 12 ? `${id.slice(0, 8)}...${id.slice(-4)}` : id;
  };

  return (
    <View style={styles.logCard}>
      <View style={styles.logHeader}>
        <LogLevelBadge level={item.logLevel} />
        <Text style={styles.logDate}>{formatDate(item.createAt)}</Text>
      </View>

      <Text style={styles.logDescription}>{item.description}</Text>

      {/* Additional Info - Only show if there's data */}
      {(item.driverActivityLogId ||
        item.driverId ||
        item.driverName ||
        item.driverPhone) && (
        <View style={styles.logMeta}>
          {item.driverActivityLogId && (
            <View style={styles.metaRow}>
              <Ionicons name="key-outline" size={14} color="#9CA3AF" />
              <Text style={styles.metaLabel}>Log ID:</Text>
              <Text style={styles.metaValue}>
                {formatId(item.driverActivityLogId)}
              </Text>
            </View>
          )}

          {item.driverId && (
            <View style={styles.metaRow}>
              <Ionicons name="person-outline" size={14} color="#9CA3AF" />
              <Text style={styles.metaLabel}>Driver ID:</Text>
              <Text style={styles.metaValue}>{formatId(item.driverId)}</Text>
            </View>
          )}

          {item.driverName && (
            <View style={styles.metaRow}>
              <Ionicons
                name="person-circle-outline"
                size={14}
                color="#9CA3AF"
              />
              <Text style={styles.metaLabel}>Tên:</Text>
              <Text style={styles.metaValue}>{item.driverName}</Text>
            </View>
          )}

          {item.driverPhone && (
            <View style={styles.metaRow}>
              <Ionicons name="call-outline" size={14} color="#9CA3AF" />
              <Text style={styles.metaLabel}>SĐT:</Text>
              <Text style={styles.metaValue}>{item.driverPhone}</Text>
            </View>
          )}
        </View>
      )}
    </View>
  );
};

const ActivityLogsScreen: React.FC = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [logs, setLogs] = useState<DriverActivityLogDTO[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const pageSize = 15;
  const [refreshing, setRefreshing] = useState(false);

  const fetchLogs = async (p = 1, append = false) => {
    try {
      if (!append && !refreshing) setLoading(true);
      setError(null);

      const res = await driverActivityLogService.getMyLogs(p, pageSize, null);

      const ok = res?.isSuccess ?? res?.statusCode === 200;
      if (!ok)
        throw new Error(res?.message || "Không thể tải nhật ký hoạt động");

      const result: PaginatedLogsDTO = res?.result ?? {
        data: [],
        currentPage: p,
        pageSize,
        totalCount: 0,
        totalPages: 0,
      };

      // Ensure data is always an array
      const items = Array.isArray(result.data) ? result.data : [];

      setLogs((prev) => (append ? [...prev, ...items] : items));
      setTotalCount(result.totalCount || 0);
      setTotalPages(
        result.totalPages || Math.ceil((result.totalCount || 0) / pageSize)
      );
      setPage(result.currentPage || p);
    } catch (e: any) {
      setError(e?.message || "Lỗi không xác định");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Only fetch when screen is actually focused (visible)
  useFocusEffect(
    React.useCallback(() => {
      fetchLogs(1);
      return () => {}; // cleanup
    }, [])
  );

  const onEndReached = () => {
    if (loading || page >= totalPages) return;
    fetchLogs(page + 1, true);
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchLogs(1);
  };

  // Loading State
  if (loading && logs.length === 0) {
    return (
      <SafeAreaView edges={['top', 'left', 'right']} style={styles.centered}>
        <ActivityIndicator size="large" color="#4F46E5" />
        <Text style={{ marginTop: 12, color: "#6B7280" }}>
          Đang tải nhật ký...
        </Text>
      </SafeAreaView>
    );
  }

  // Error State
  if (error && logs.length === 0) {
    return (
      <SafeAreaView edges={['top', 'left', 'right']} style={styles.centered}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={() => fetchLogs(1)}>
          <Text style={styles.retryText}>Thử lại</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Nhật Ký Hoạt Động</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Stats */}
      <View style={styles.statsSection}>
        <MaterialCommunityIcons
          name="text-box-check-outline"
          size={20}
          color="#6B7280"
        />
        <Text style={styles.statsText}>
          Tổng: <Text style={styles.statsValue}>{totalCount}</Text> nhật ký
        </Text>
      </View>

      {/* List */}
      <FlatList
        data={logs}
        keyExtractor={(it) => it.driverActivityLogId}
        renderItem={({ item }) => <LogCard item={item} />}
        contentContainerStyle={{ padding: 16, paddingBottom: 120 }}
        onEndReachedThreshold={0.5}
        onEndReached={onEndReached}
        refreshing={refreshing}
        onRefresh={onRefresh}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <MaterialCommunityIcons
              name="text-box-remove-outline"
              size={48}
              color="#9CA3AF"
            />
            <Text style={styles.emptyText}>Chưa có nhật ký hoạt động.</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F9FAFB" },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F9FAFB",
    padding: 16,
  },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
      },
      android: { elevation: 2 },
    }),
  },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: "700", color: "#111827" },

  // Stats Section
  statsSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  statsText: { fontSize: 14, color: "#6B7280" },
  statsValue: { fontWeight: "700", color: "#111827" },

  // Error & Empty
  errorText: {
    color: "#EF4444",
    textAlign: "center",
    marginBottom: 8,
    fontSize: 14,
  },
  retryBtn: {
    backgroundColor: "#4F46E5",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 8,
  },
  retryText: { color: "#FFF", fontWeight: "600" },
  emptyState: { alignItems: "center", marginTop: 80, paddingHorizontal: 32 },
  emptyText: {
    color: "#6B7280",
    marginTop: 16,
    fontSize: 14,
    textAlign: "center",
  },

  // Log Card
  logCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.04,
        shadowRadius: 4,
      },
      android: { elevation: 1 },
    }),
  },
  logHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  logDate: {
    fontSize: 12,
    color: "#9CA3AF",
    fontWeight: "500",
  },
  logDescription: {
    fontSize: 14,
    color: "#374151",
    lineHeight: 20,
    marginBottom: 12,
  },

  // Log Meta Info
  logMeta: {
    gap: 6,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  metaLabel: {
    fontSize: 12,
    color: "#9CA3AF",
    fontWeight: "500",
  },
  metaValue: {
    fontSize: 12,
    color: "#6B7280",
    fontWeight: "600",
    flex: 1,
  },

  // Level Badge
  levelBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  levelText: {
    fontSize: 11,
    fontWeight: "700",
  },
});

export default ActivityLogsScreen;
