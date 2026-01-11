// import React, { useEffect, useMemo, useState } from 'react'
// import { SafeAreaView, View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity } from 'react-native'
// import { useRouter } from 'expo-router'
// import tripService from '@/services/tripService'

// interface DriverTripItem {
//   tripId: string
//   tripCode: string
//   status: string
//   createAt: string
//   updateAt: string
//   vehicleModel: string
//   vehiclePlate: string
//   vehicleType: string
//   ownerName: string
//   ownerCompany: string
//   startAddress: string
//   endAddress: string
//   tripRouteSummary?: string
// }

// const StatusBadge = ({ status }: { status: string }) => {
//   const color = useMemo(() => {
//     const s = (status || '').toUpperCase()
//     const map: Record<string, string> = {
//       CREATED: '#2563EB',
//       PENDING: '#D97706',
//       SIGNED: '#059669',
//       COMPLETED: '#10B981',
//       CANCELLED: '#DC2626',
//       AWAITING_PROVIDER_CONTRACT: '#6366F1',
//       AWAITING_DRIVER_CONTRACT: '#6366F1',
//     }
//     return map[s] || '#6B7280'
//   }, [status])
//   return (
//     <View style={[styles.badge, { backgroundColor: color + '22', borderColor: color }]}>
// <Text style={[styles.badgeText, { color }]}>{status}</Text>
// </View>
//   )
// }

// const ItemCard = ({ item, onPress }: { item: DriverTripItem; onPress: () => void }) => (
//   <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.85}>
// <View style={styles.rowBetween}>
// <Text style={styles.tripCode}>{item.tripCode}</Text>
// <StatusBadge status={item.status} />
// </View>
// <View style={styles.kvRow}><Text style={styles.kvLabel}>Chủ chuyến</Text><Text style={styles.kvValue}>{item.ownerCompany || item.ownerName}</Text></View>
// <View style={styles.kvRow}><Text style={styles.kvLabel}>Phương tiện</Text><Text style={styles.kvValue}>{item.vehiclePlate} • {item.vehicleType}</Text></View>
// <View style={styles.kvRow}><Text style={styles.kvLabel}>Điểm đi</Text><Text style={styles.kvValue}>{item.startAddress || '—'}</Text></View>
// <View style={styles.kvRow}><Text style={styles.kvLabel}>Điểm đến</Text><Text style={styles.kvValue}>{item.endAddress || '—'}</Text></View>
//     {item.tripRouteSummary ? (
//       <View style={styles.kvRow}><Text style={styles.kvLabel}>Tuyến</Text><Text style={styles.kvValue}>{item.tripRouteSummary}</Text></View>
//     ) : null}
//   </TouchableOpacity>
// )

// const MyTripsScreen: React.FC = () => {
//   const router = useRouter()
//   const [loading, setLoading] = useState(true)
//   const [error, setError] = useState<string | null>(null)
//   const [data, setData] = useState<DriverTripItem[]>([])
//   const [page, setPage] = useState(1)
//   const [total, setTotal] = useState(0)
//   const pageSize = 10
//   const [refreshing, setRefreshing] = useState(false)

//   const fetchPage = async (p = 1, append = false) => {
//     try {
//       if (!append) setLoading(true)
//       setError(null)
//       const res = await tripService.getTripsByDriver(p, pageSize)
//       const ok = res?.isSuccess ?? (res?.statusCode === 200)
//       if (!ok) throw new Error(res?.message || 'Không thể tải danh sách chuyến')
//       const paged = res?.result ?? res?.data
//       const items: DriverTripItem[] = (paged?.items || paged?.data || [])
//       setTotal(paged?.totalCount ?? items.length)
//       setData(prev => append ? [...prev, ...items] : items)
//       setPage(p)
//     } catch (e: any) {
//       setError(e?.message || 'Lỗi không xác định')
//     } finally {
//       setLoading(false)
//       setRefreshing(false)
//     }
//   }

//   useEffect(() => { fetchPage(1) }, [])

//   const onEndReached = () => {
//     const maxPage = Math.ceil(total / pageSize)
//     if (loading || page >= maxPage) return
//     fetchPage(page + 1, true)
//   }

//   const onRefresh = () => {
//     setRefreshing(true)
//     fetchPage(1)
//   }

//   if (loading && data.length === 0) {
//     return (
//       <SafeAreaView style={styles.centered}>
// <ActivityIndicator size="large" color="#4F46E5" />
// <Text style={{ marginTop: 8 }}>Đang tải chuyến của bạn...</Text>
// </SafeAreaView>
//     )
//   }

//   if (error) {
//     return (
//       <SafeAreaView style={styles.centered}>
// <Text style={styles.errorText}>{error}</Text>
// <TouchableOpacity style={styles.retryBtn} onPress={() => fetchPage(1)}>
// <Text style={styles.retryText}>Thử lại</Text>
// </TouchableOpacity>
// </SafeAreaView>
//     )
//   }

//   return (
//     <SafeAreaView style={styles.container}>
// <Text style={styles.title}>Chuyến của tôi</Text>
// <FlatList
//         data={data}
//         keyExtractor={(it) => it.tripId}
//         renderItem={({ item }) => (
//           <ItemCard item={item} onPress={() => router.push(`/(driver)/trip/${item.tripId}`)} />
//         )}
//         contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
//         onEndReachedThreshold={0.5}
//         onEndReached={onEndReached}
//         refreshing={refreshing}
//         onRefresh={onRefresh}
//         ListEmptyComponent={<Text style={styles.emptyText}>Không có chuyến nào.</Text>}
//       />
// </SafeAreaView>
//   )
// }

// const styles = StyleSheet.create({
//   container: { flex: 1, backgroundColor: '#F9FAFB' },
//   centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F9FAFB', padding: 16 },
//   title: { fontSize: 22, fontWeight: '800', color: '#111827', padding: 16, paddingBottom: 4 },
//   errorText: { color: '#EF4444', textAlign: 'center' },
//   retryBtn: { marginTop: 10, backgroundColor: '#4F46E5', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 8 },
//   retryText: { color: '#fff', fontWeight: '700' },
//   card: { backgroundColor: '#FFFFFF', borderRadius: 12, padding: 14, borderWidth: 1, borderColor: '#E5E7EB', marginBottom: 12 },
//   tripCode: { fontWeight: '800', fontSize: 16, color: '#111827' },
//   rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
//   kvRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 2 },
//   kvLabel: { color: '#6B7280', fontSize: 13 },
//   kvValue: { color: '#111827', fontWeight: '600', flex: 1, textAlign: 'right', marginLeft: 8 },
//   emptyText: { color: '#6B7280', textAlign: 'center', marginTop: 24 },
//   badge: { borderWidth: 1, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 12 },
//   badgeText: { fontSize: 12, fontWeight: '700' },
// })

// export default MyTripsScreen

import React, { useEffect, useMemo, useState } from "react";
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
import driverWorkSessionService from "@/services/driverWorkSessionService";
import {
  Ionicons,
  MaterialCommunityIcons,
  FontAwesome5,
} from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Calendar, LocaleConfig } from "react-native-calendars";

// Configure Vietnamese locale for calendar
LocaleConfig.locales["vi"] = {
  monthNames: [
    "Tháng 1",
    "Tháng 2",
    "Tháng 3",
    "Tháng 4",
    "Tháng 5",
    "Tháng 6",
    "Tháng 7",
    "Tháng 8",
    "Tháng 9",
    "Tháng 10",
    "Tháng 11",
    "Tháng 12",
  ],
  monthNamesShort: [
    "Th1",
    "Th2",
    "Th3",
    "Th4",
    "Th5",
    "Th6",
    "Th7",
    "Th8",
    "Th9",
    "Th10",
    "Th11",
    "Th12",
  ],
  dayNames: [
    "Chủ nhật",
    "Thứ hai",
    "Thứ ba",
    "Thứ tư",
    "Thứ năm",
    "Thứ sáu",
    "Thứ bảy",
  ],
  dayNamesShort: ["CN", "T2", "T3", "T4", "T5", "T6", "T7"],
  today: "Hôm nay",
};
LocaleConfig.defaultLocale = "vi";

interface DriverSessionHistoryDTO {
  sessionId: string;
  tripId?: string;
  startTime: string;
  endTime?: string;
  status: string;
  durationHours: number;
}

interface HistoryResponseDTO {
  totalHoursInPeriod: number;
  totalSessions: number;
  sessions: DriverSessionHistoryDTO[];
}

const StatusBadge = ({ status }: { status: string }) => {
  const config: any = useMemo(() => {
    const s = (status || "").toUpperCase();
    const map: Record<string, any> = {
      ACTIVE: {
        color: "#10B981",
        bg: "#D1FAE5",
        label: "Đang hoạt động",
        icon: "play-circle",
      },
      COMPLETED: {
        color: "#6366F1",
        bg: "#EEF2FF",
        label: "Hoàn thành",
        icon: "checkmark-circle",
      },
      CANCELLED: {
        color: "#EF4444",
        bg: "#FEF2F2",
        label: "Đã hủy",
        icon: "close-circle",
      },
    };
    return (
      map[s] || {
        color: "#6B7280",
        bg: "#F3F4F6",
        label: status,
        icon: "ellipse",
      }
    );
  }, [status]);

  return (
    <View style={[styles.badge, { backgroundColor: config.bg }]}>
      <Ionicons name={config.icon as any} size={12} color={config.color} />
      <Text style={[styles.badgeText, { color: config.color }]}>
        {config.label}
      </Text>
    </View>
  );
};

const SessionCard = ({
  item,
  onPress,
}: {
  item: DriverSessionHistoryDTO;
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

  const formatTime = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleTimeString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatDuration = (hours: number) => {
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);
    if (h === 0) return `${m} phút`;
    return m > 0 ? `${h}h ${m}p` : `${h}h`;
  };

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.9}>
      {/* Header: Ngày & Status */}
      <View style={styles.cardHeader}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <View style={styles.iconBox}>
            <FontAwesome5 name="clock" size={18} color="#4F46E5" />
          </View>
          <View>
            <Text style={styles.sessionDate}>{formatDate(item.startTime)}</Text>
            <Text style={styles.sessionTimeRange}>
              {formatTime(item.startTime)} -{" "}
              {item.endTime ? formatTime(item.endTime) : "Đang chạy"}
            </Text>
          </View>
        </View>
        <StatusBadge status={item.status} />
      </View>

      <View style={styles.divider} />

      {/* Body: Duration & Trip Info */}
      <View style={styles.cardBody}>
        <View style={styles.infoRow}>
          <View style={styles.infoCol}>
            <Text style={styles.infoLabel}>Thời gian lái</Text>
            <Text style={styles.infoValueLarge}>
              {formatDuration(item.durationHours)}
            </Text>
          </View>
          {item.tripId && (
            <View style={[styles.infoCol, { alignItems: "flex-end" }]}>
              <Text style={styles.infoLabel}>Chuyến đi</Text>
              <Text style={styles.infoValueLink}>#{item.tripId.slice(-8)}</Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

const MyTripsScreen: React.FC = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [historyData, setHistoryData] = useState<HistoryResponseDTO | null>(
    null
  );
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const [refreshing, setRefreshing] = useState(false);

  // Date Filter States
  const [fromDate, setFromDate] = useState<Date | null>(null);
  const [toDate, setToDate] = useState<Date | null>(null);
  const [showFromPicker, setShowFromPicker] = useState(false);
  const [showToPicker, setShowToPicker] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  const fetchPage = async (p = 1, append = false) => {
    try {
      if (!append && !refreshing) setLoading(true);
      setError(null);

      const filter = {
        FromDate: fromDate ? fromDate.toISOString() : null,
        ToDate: toDate ? toDate.toISOString() : null,
        PageIndex: p,
        PageSize: pageSize,
      };

      const res = await driverWorkSessionService.getHistory(filter);

      const ok = res?.isSuccess ?? res?.statusCode === 200;
      if (!ok)
        throw new Error(res?.message || "Không thể tải lịch sử làm việc");

      const result: HistoryResponseDTO = res?.result ??
        res?.data ?? {
          totalHoursInPeriod: 0,
          totalSessions: 0,
          sessions: [],
        };

      if (append && historyData) {
        setHistoryData({
          ...result,
          sessions: [...historyData.sessions, ...result.sessions],
        });
      } else {
        setHistoryData(result);
      }

      setPage(p);
    } catch (e: any) {
      setError(e?.message || "Lỗi không xác định");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchPage(1);
  }, [fromDate, toDate]);

  const onEndReached = () => {
    if (!historyData) return;
    const maxPage = Math.ceil(historyData.totalSessions / pageSize);
    if (loading || page >= maxPage) return;
    fetchPage(page + 1, true);
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchPage(1);
  };

  const clearFilters = () => {
    setFromDate(null);
    setToDate(null);
    setShowFilters(false);
  };

  const formatTotalHours = (hours: number) => {
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);
    return `${h}h ${m}p`;
  };

  // Loading State
  if (loading && !historyData) {
    return (
      <SafeAreaView edges={['top', 'left', 'right']} style={styles.centered}>
        <ActivityIndicator size="large" color="#4F46E5" />
        <Text style={{ marginTop: 12, color: "#6B7280" }}>
          Đang tải lịch sử làm việc...
        </Text>
      </SafeAreaView>
    );
  }

  // Error State
  if (error && !historyData) {
    return (
      <SafeAreaView edges={['top', 'left', 'right']} style={styles.centered}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={() => fetchPage(1)}>
          <Text style={styles.retryText}>Thử lại</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const sessions = historyData?.sessions || [];

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Lịch Sử Làm Việc</Text>
        <TouchableOpacity
          onPress={() => setShowFilters(!showFilters)}
          style={styles.filterBtn}
        >
          <Ionicons
            name="filter"
            size={22}
            color={showFilters ? "#4F46E5" : "#6B7280"}
          />
        </TouchableOpacity>
      </View>

      {/* Stats Summary */}
      <View style={styles.statsContainer}>
        <View style={styles.statBox}>
          <MaterialCommunityIcons
            name="clock-time-four-outline"
            size={24}
            color="#4F46E5"
          />
          <View style={{ marginLeft: 12 }}>
            <Text style={styles.statLabel}>Tổng giờ lái</Text>
            <Text style={styles.statValue}>
              {formatTotalHours(historyData?.totalHoursInPeriod || 0)}
            </Text>
          </View>
        </View>
        <View style={styles.statBox}>
          <MaterialCommunityIcons
            name="calendar-check-outline"
            size={24}
            color="#10B981"
          />
          <View style={{ marginLeft: 12 }}>
            <Text style={styles.statLabel}>Tổng phiên</Text>
            <Text style={styles.statValue}>
              {historyData?.totalSessions || 0}
            </Text>
          </View>
        </View>
      </View>

      {/* Filter Panel */}
      {showFilters && (
        <View style={styles.filterPanel}>
          <View style={styles.dateFilterRow}>
            <TouchableOpacity
              style={styles.dateFilterBtn}
              onPress={() => setShowFromPicker(true)}
            >
              <Ionicons name="calendar-outline" size={18} color="#6B7280" />
              <Text style={styles.dateFilterText}>
                {fromDate ? fromDate.toLocaleDateString("vi-VN") : "Từ ngày"}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.dateFilterBtn}
              onPress={() => setShowToPicker(true)}
            >
              <Ionicons name="calendar-outline" size={18} color="#6B7280" />
              <Text style={styles.dateFilterText}>
                {toDate ? toDate.toLocaleDateString("vi-VN") : "Đến ngày"}
              </Text>
            </TouchableOpacity>
          </View>
          {(fromDate || toDate) && (
            <TouchableOpacity
              style={styles.clearFilterBtn}
              onPress={clearFilters}
            >
              <Ionicons name="close-circle" size={16} color="#EF4444" />
              <Text style={styles.clearFilterText}>Xóa lọc</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Calendar DatePickers */}
      {showFromPicker && (
        <View style={styles.calendarModal}>
          <TouchableOpacity
            style={styles.calendarOverlay}
            activeOpacity={1}
            onPress={() => setShowFromPicker(false)}
          />
          <View style={styles.calendarCard}>
            <View style={styles.calendarHeader}>
              <Text style={styles.calendarTitle}>Chọn từ ngày</Text>
              <TouchableOpacity onPress={() => setShowFromPicker(false)}>
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>
            <Calendar
              current={
                fromDate ? fromDate.toISOString().split("T")[0] : undefined
              }
              onDayPress={(day) => {
                setFromDate(new Date(day.dateString));
                setShowFromPicker(false);
              }}
              markedDates={{
                [fromDate ? fromDate.toISOString().split("T")[0] : ""]: {
                  selected: true,
                  selectedColor: "#4F46E5",
                },
              }}
              theme={{
                backgroundColor: "#FFFFFF",
                calendarBackground: "#FFFFFF",
                textSectionTitleColor: "#6B7280",
                selectedDayBackgroundColor: "#4F46E5",
                selectedDayTextColor: "#FFFFFF",
                todayTextColor: "#4F46E5",
                dayTextColor: "#111827",
                textDisabledColor: "#D1D5DB",
                monthTextColor: "#111827",
                textMonthFontWeight: "700",
                textMonthFontSize: 16,
                textDayFontSize: 14,
                textDayHeaderFontSize: 12,
                arrowColor: "#4F46E5",
              }}
            />
          </View>
        </View>
      )}

      {showToPicker && (
        <View style={styles.calendarModal}>
          <TouchableOpacity
            style={styles.calendarOverlay}
            activeOpacity={1}
            onPress={() => setShowToPicker(false)}
          />
          <View style={styles.calendarCard}>
            <View style={styles.calendarHeader}>
              <Text style={styles.calendarTitle}>Chọn đến ngày</Text>
              <TouchableOpacity onPress={() => setShowToPicker(false)}>
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>
            <Calendar
              current={toDate ? toDate.toISOString().split("T")[0] : undefined}
              onDayPress={(day) => {
                setToDate(new Date(day.dateString));
                setShowToPicker(false);
              }}
              markedDates={{
                [toDate ? toDate.toISOString().split("T")[0] : ""]: {
                  selected: true,
                  selectedColor: "#4F46E5",
                },
              }}
              theme={{
                backgroundColor: "#FFFFFF",
                calendarBackground: "#FFFFFF",
                textSectionTitleColor: "#6B7280",
                selectedDayBackgroundColor: "#4F46E5",
                selectedDayTextColor: "#FFFFFF",
                todayTextColor: "#4F46E5",
                dayTextColor: "#111827",
                textDisabledColor: "#D1D5DB",
                monthTextColor: "#111827",
                textMonthFontWeight: "700",
                textMonthFontSize: 16,
                textDayFontSize: 14,
                textDayHeaderFontSize: 12,
                arrowColor: "#4F46E5",
              }}
            />
          </View>
        </View>
      )}

      {/* List */}
      <FlatList
        data={sessions}
        keyExtractor={(it) => it.sessionId}
        renderItem={({ item }) => (
          <SessionCard
            item={item}
            onPress={() =>
              item.tripId && router.push(`/(driver)/trip/${item.tripId}`)
            }
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
              name="clock-alert-outline"
              size={48}
              color="#9CA3AF"
            />
            <Text style={styles.emptyText}>Chưa có lịch sử làm việc.</Text>
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
  filterBtn: { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: "700", color: "#111827" },

  // Stats
  statsContainer: {
    flexDirection: "row",
    padding: 16,
    gap: 12,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  statBox: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F9FAFB",
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  statLabel: { fontSize: 12, color: "#6B7280", marginBottom: 2 },
  statValue: { fontSize: 18, fontWeight: "700", color: "#111827" },

  // Filter Panel
  filterPanel: {
    backgroundColor: "#FFFFFF",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  dateFilterRow: { flexDirection: "row", gap: 12, marginBottom: 8 },
  dateFilterBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: "#F9FAFB",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  dateFilterText: { fontSize: 13, color: "#374151", fontWeight: "500" },
  clearFilterBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    alignSelf: "flex-start",
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: "#FEF2F2",
    borderRadius: 6,
  },
  clearFilterText: { fontSize: 12, color: "#EF4444", fontWeight: "600" },

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

  // Session Card
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 8,
      },
      android: { elevation: 1 },
    }),
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: "#EEF2FF",
    alignItems: "center",
    justifyContent: "center",
  },
  sessionDate: { fontSize: 15, fontWeight: "700", color: "#111827" },
  sessionTimeRange: { fontSize: 12, color: "#6B7280", marginTop: 3 },

  divider: { height: 1, backgroundColor: "#F3F4F6", marginVertical: 14 },

  // Body
  cardBody: { gap: 0 },
  infoRow: { flexDirection: "row", justifyContent: "space-between" },
  infoCol: { flex: 1 },
  infoLabel: {
    fontSize: 11,
    color: "#9CA3AF",
    textTransform: "uppercase",
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  infoValueLarge: { fontSize: 20, fontWeight: "800", color: "#4F46E5" },
  infoValueLink: { fontSize: 14, fontWeight: "600", color: "#6366F1" },

  // Badge
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
  },
  badgeText: { fontSize: 11, fontWeight: "700" },

  // Calendar Modal
  calendarModal: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 9999,
  },
  calendarOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  calendarCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 0,
    width: "90%",
    maxWidth: 380,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.25,
        shadowRadius: 16,
      },
      android: { elevation: 8 },
      web: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.25,
        shadowRadius: 16,
      },
    }),
  },
  calendarHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  calendarTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
  },
});

export default MyTripsScreen;
