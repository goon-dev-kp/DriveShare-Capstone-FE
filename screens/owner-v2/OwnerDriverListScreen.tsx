import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Image,
  Alert,
} from "react-native";
import { MaterialCommunityIcons, Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import ownerDriverLinkService, {
  LinkedDriverDTO,
} from "@/services/ownerDriverLinkService";

const OwnerDriverListScreen: React.FC = () => {
  const router = useRouter();
  const [drivers, setDrivers] = useState<LinkedDriverDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [confirmModal, setConfirmModal] = useState<{
    visible: boolean;
    linkId: string;
    action: "APPROVED" | "REJECTED";
    driverName: string;
  } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useFocusEffect(
    useCallback(() => {
      // Reset state and load fresh data every time screen is focused
      setDrivers([]);
      setPage(1);
      setHasMore(true);
      setError(null);
      loadDrivers(1);
    }, [])
  );

  const loadDrivers = async (
    pageNum: number = 1,
    isRefresh: boolean = false
  ) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
        setPage(1);
      } else if (pageNum === 1) {
        setLoading(true);
      }

      // Use new endpoint that excludes rejected drivers
      const response = await ownerDriverLinkService.getMyDriversNotRejected(
        pageNum,
        10
      );

      if (response.success && response.data) {
        const newDrivers = response.data.data || [];

        if (isRefresh || pageNum === 1) {
          setDrivers(newDrivers);
        } else {
          setDrivers((prev) => [...prev, ...newDrivers]);
        }

        setHasMore(newDrivers.length === 10);
        setError(null);
      } else {
        setError(response.error || "Không thể tải danh sách");
      }
    } catch (err) {
      setError("Lỗi kết nối");
      console.error("Load drivers error:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    loadDrivers(1, true);
  };

  const loadMore = () => {
    if (!loading && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      loadDrivers(nextPage);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "APPROVED":
        return { text: "Đang hoạt động", color: "#10B981", bg: "#D1FAE5" };
      case "PENDING":
        return { text: "Chờ duyệt", color: "#F59E0B", bg: "#FEF3C7" };
      case "REJECTED":
        return { text: "Đã từ chối", color: "#EF4444", bg: "#FEE2E2" };
      default:
        return { text: status, color: "#6B7280", bg: "#F3F4F6" };
    }
  };

  const getCanDriveStatus = (
    canDrive: boolean
  ): {
    text: string;
    icon: React.ComponentProps<typeof MaterialCommunityIcons>["name"];
    color: string;
  } => {
    return canDrive
      ? { text: "Có thể lái", icon: "check-circle", color: "#10B981" }
      : { text: "Đạt giới hạn", icon: "alert-circle", color: "#EF4444" };
  };

  const handleStatusAction = (
    linkId: string,
    action: "APPROVED" | "REJECTED",
    driverName: string
  ) => {
    setConfirmModal({ visible: true, linkId, action, driverName });
  };

  const confirmStatusChange = async () => {
    if (!confirmModal) return;

    setSubmitting(true);
    try {
      const response = await ownerDriverLinkService.changeStatus({
        ownerDriverLinkId: confirmModal.linkId,
        status: confirmModal.action as any,
      });

      if (response.success) {
        Alert.alert(
          "Thành công",
          confirmModal.action === "APPROVED"
            ? `Đã duyệt ${confirmModal.driverName} vào đội xe`
            : `Đã từ chối ${confirmModal.driverName}`,
          [{ text: "OK" }]
        );
        // Reload data
        setDrivers([]);
        setPage(1);
        loadDrivers(1);
      } else {
        Alert.alert("Lỗi", response.error || "Không thể cập nhật trạng thái");
      }
    } catch (err) {
      Alert.alert("Lỗi", "Có lỗi xảy ra khi cập nhật trạng thái");
    } finally {
      setSubmitting(false);
      setConfirmModal(null);
    }
  };

  const renderDriverCard = ({ item }: { item: LinkedDriverDTO }) => {
    const statusBadge = getStatusBadge(item.status);
    const canDriveStatus = getCanDriveStatus(item.canDrive);

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() =>
          router.push({
            pathname: "/(owner)/driver-detail/[id]",
            params: { id: item.ownerDriverLinkId },
          })
        }
        activeOpacity={0.7}
      >
        {/* Header: Avatar + Info */}
        <View style={styles.cardHeader}>
          <View style={styles.avatarContainer}>
            {item.avatarUrl ? (
              <Image source={{ uri: item.avatarUrl }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <MaterialCommunityIcons
                  name="account"
                  size={32}
                  color="#94A3B8"
                />
              </View>
            )}
          </View>

          <View style={styles.infoContainer}>
            <Text style={styles.driverName} numberOfLines={1}>
              {item.fullName}
            </Text>
            <Text style={styles.phoneNumber}>{item.phoneNumber}</Text>
            {item.licenseNumber && (
              <Text style={styles.license}>
                <MaterialCommunityIcons name="card-account-details" size={12} />{" "}
                {item.licenseNumber}
              </Text>
            )}
          </View>

          {/* Status Badge */}
          <View
            style={[styles.statusBadge, { backgroundColor: statusBadge.bg }]}
          >
            <Text style={[styles.statusText, { color: statusBadge.color }]}>
              {statusBadge.text}
            </Text>
          </View>
        </View>

        {/* Stats Section */}
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <MaterialCommunityIcons
              name="clock-outline"
              size={16}
              color="#64748B"
            />
            <Text style={styles.statLabel}>Hôm nay</Text>
            <Text style={styles.statValue}>
              {item.hoursDrivenToday.toFixed(1)}h
            </Text>
          </View>

          <View style={styles.statDivider} />

          <View style={styles.statItem}>
            <MaterialCommunityIcons
              name="calendar-week"
              size={16}
              color="#64748B"
            />
            <Text style={styles.statLabel}>Tuần này</Text>
            <Text style={styles.statValue}>
              {item.hoursDrivenThisWeek.toFixed(1)}h
            </Text>
          </View>

          <View style={styles.statDivider} />

          <View style={styles.statItem}>
            <MaterialCommunityIcons
              name="calendar-month"
              size={16}
              color="#64748B"
            />
            <Text style={styles.statLabel}>Tháng này</Text>
            <Text style={styles.statValue}>
              {item.hoursDrivenThisMonth.toFixed(1)}h
            </Text>
          </View>
        </View>

        {/* Drive Status or Action Buttons */}
        {item.status === "PENDING" ? (
          <View style={styles.actionButtonsContainer}>
            <TouchableOpacity
              style={styles.rejectButton}
              onPress={(e) => {
                e.stopPropagation();
                handleStatusAction(
                  item.ownerDriverLinkId,
                  "REJECTED",
                  item.fullName
                );
              }}
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons
                name="close-circle"
                size={18}
                color="#fff"
              />
              <Text style={styles.rejectButtonText}>Từ chối</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.approveButton}
              onPress={(e) => {
                e.stopPropagation();
                handleStatusAction(
                  item.ownerDriverLinkId,
                  "APPROVED",
                  item.fullName
                );
              }}
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons
                name="check-circle"
                size={18}
                color="#fff"
              />
              <Text style={styles.approveButtonText}>Duyệt</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.driveStatusContainer}>
            <MaterialCommunityIcons
              name={canDriveStatus.icon}
              size={18}
              color={canDriveStatus.color}
            />
            <Text
              style={[styles.driveStatusText, { color: canDriveStatus.color }]}
            >
              {canDriveStatus.text}
            </Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <MaterialCommunityIcons
        name="account-group-outline"
        size={64}
        color="#CBD5E1"
      />
      <Text style={styles.emptyText}>Chưa có tài xế nào</Text>
      <Text style={styles.emptySubtext}>
        Tài xế sẽ gửi yêu cầu gia nhập đội xe của bạn
      </Text>
    </View>
  );

  const renderError = () => (
    <View style={styles.errorContainer}>
      <MaterialCommunityIcons
        name="alert-circle-outline"
        size={48}
        color="#EF4444"
      />
      <Text style={styles.errorText}>{error}</Text>
      <TouchableOpacity
        style={styles.retryButton}
        onPress={() => loadDrivers(1)}
      >
        <Text style={styles.retryText}>Thử lại</Text>
      </TouchableOpacity>
    </View>
  );

  if (loading && drivers.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text style={styles.loadingText}>Đang tải danh sách tài xế...</Text>
      </View>
    );
  }

  if (error && drivers.length === 0) {
    return renderError();
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backBtn}
          >
            <Ionicons name="arrow-back" size={24} color="#0F172A" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Tài xế của tôi</Text>
          <View style={{ width: 32 }} />
        </View>
        <Text style={styles.headerSubtitle}>
          {drivers.length} tài xế {drivers.filter((d) => d.canDrive).length} có
          thể lái
        </Text>
      </View>

      {/* List */}
      <FlatList
        data={drivers}
        renderItem={renderDriverCard}
        keyExtractor={(item) => item.ownerDriverLinkId}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#3B82F6"]}
          />
        }
        onEndReached={loadMore}
        onEndReachedThreshold={0.3}
        ListEmptyComponent={renderEmpty}
        ListFooterComponent={
          loading && drivers.length > 0 ? (
            <View style={styles.footerLoader}>
              <ActivityIndicator size="small" color="#3B82F6" />
            </View>
          ) : null
        }
      />

      {/* Confirmation Modal */}
      {confirmModal && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View
              style={[
                styles.modalIcon,
                {
                  backgroundColor:
                    confirmModal.action === "APPROVED" ? "#D1FAE5" : "#FEE2E2",
                },
              ]}
            >
              <MaterialCommunityIcons
                name={
                  confirmModal.action === "APPROVED"
                    ? "check-circle"
                    : "close-circle"
                }
                size={40}
                color={
                  confirmModal.action === "APPROVED" ? "#10B981" : "#EF4444"
                }
              />
            </View>
            <Text style={styles.modalTitle}>
              {confirmModal.action === "APPROVED"
                ? "Duyệt tài xế?"
                : "Từ chối tài xế?"}
            </Text>
            <Text style={styles.modalMessage}>
              {confirmModal.action === "APPROVED"
                ? `Bạn có chắc muốn duyệt ${confirmModal.driverName} vào đội xe?`
                : `Bạn có chắc muốn từ chối ${confirmModal.driverName}?`}
            </Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => setConfirmModal(null)}
                disabled={submitting}
              >
                <Text style={styles.modalCancelText}>Hủy</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.modalConfirmButton,
                  {
                    backgroundColor:
                      confirmModal.action === "APPROVED"
                        ? "#10B981"
                        : "#EF4444",
                  },
                ]}
                onPress={confirmStatusChange}
                disabled={submitting}
              >
                {submitting ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.modalConfirmText}>
                    {confirmModal.action === "APPROVED" ? "Duyệt" : "Từ chối"}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  header: {
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  headerTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  backBtn: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#0F172A",
    flex: 1,
    textAlign: "center",
  },
  headerSubtitle: {
    fontSize: 14,
    color: "#64748B",
    textAlign: "center",
  },
  listContainer: {
    padding: 16,
    flexGrow: 1,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  avatarContainer: {
    marginRight: 12,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  avatarPlaceholder: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
  },
  infoContainer: {
    flex: 1,
  },
  driverName: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1E293B",
    marginBottom: 2,
  },
  phoneNumber: {
    fontSize: 14,
    color: "#64748B",
    marginBottom: 2,
  },
  license: {
    fontSize: 12,
    color: "#94A3B8",
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 11,
    fontWeight: "600",
  },
  statsContainer: {
    flexDirection: "row",
    backgroundColor: "#F8FAFC",
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  statItem: {
    flex: 1,
    alignItems: "center",
    gap: 4,
  },
  statDivider: {
    width: 1,
    backgroundColor: "#E2E8F0",
  },
  statLabel: {
    fontSize: 11,
    color: "#64748B",
  },
  statValue: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1E293B",
  },
  driveStatusContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  driveStatusText: {
    fontSize: 13,
    fontWeight: "600",
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 80,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#64748B",
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: "#94A3B8",
    marginTop: 8,
    textAlign: "center",
    paddingHorizontal: 40,
  },
  errorContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 80,
  },
  errorText: {
    fontSize: 16,
    color: "#EF4444",
    marginTop: 12,
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: "#3B82F6",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 14,
    color: "#64748B",
  },
  footerLoader: {
    paddingVertical: 20,
    alignItems: "center",
  },
  actionButtonsContainer: {
    flexDirection: "row",
    gap: 8,
    marginTop: 4,
  },
  rejectButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#EF4444",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 6,
  },
  rejectButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  approveButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#10B981",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 6,
  },
  approveButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  modalOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 24,
    width: "85%",
    maxWidth: 400,
    alignItems: "center",
  },
  modalIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1E293B",
    marginBottom: 8,
    textAlign: "center",
  },
  modalMessage: {
    fontSize: 14,
    color: "#64748B",
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 20,
  },
  modalButtons: {
    flexDirection: "row",
    gap: 12,
    width: "100%",
  },
  modalCancelButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
  },
  modalCancelText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#64748B",
  },
  modalConfirmButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: "center",
  },
  modalConfirmText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#fff",
  },
});

export default OwnerDriverListScreen;
