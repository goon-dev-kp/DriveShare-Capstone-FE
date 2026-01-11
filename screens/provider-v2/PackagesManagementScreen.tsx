import React, { useState, useEffect } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  TextInput,
  StatusBar,
  Modal,
  Pressable,
} from "react-native";
import { Ionicons, Feather } from "@expo/vector-icons";
import { Package } from "../../models/types";
import PackageList from "./components/PackageList";
import PackageFormModal from "./components/PackageFormModal";
import EditPackageModal from "./components/EditPackageModal";
import usePackages from "@/hooks/usePackages";
import packageService from "../../services/packageService";

interface Props {
  onBack: () => void;
}

// Status color mapping for packages
const STATUS_COLORS: Record<string, string> = {
  ALL: "#0284C7",
  PENDING: "#F59E0B", // orange
  APPROVED: "#10B981", // green
  REJECTED: "#EF4444", // red
  IN_TRANSIT: "#3B82F6", // blue
  DELIVERED: "#10B981", // green
  COMPLETED: "#6B7280", // gray
  DELETED: "#EF4444", // red
  OPEN: "#10B981", // green
  CLOSED: "#6B7280", // gray
};

// Status label mapping
const getStatusLabel = (status: string): string => {
  const labels: Record<string, string> = {
    ALL: "Tất cả",
    PENDING: "Chờ duyệt",
    APPROVED: "Đã duyệt",
    REJECTED: "Từ chối",
    IN_TRANSIT: "Đang vận chuyển",
    DELIVERED: "Đã giao",
    COMPLETED: "Hoàn thành",
    DELETED: "Đã xóa",
    OPEN: "Đang mở",
    CLOSED: "Đã đóng",
  };
  return labels[status] || status;
};

// Get status color
const getStatusColor = (status: string): string => {
  return STATUS_COLORS[status] || "#9CA3AF";
};

const PackagesManagementScreen: React.FC<Props> = ({ onBack }) => {
  const {
    packages,
    loading,
    error,
    search,
    sortField,
    sortOrder,
    statusFilter,
    setSearch,
    setSortField,
    setSortOrder,
    setStatusFilter,
    fetchPage,
  } = usePackages(1, 20);

  const [isModalOpen, setModalOpen] = useState(false);
  const [isSortModalOpen, setIsSortModalOpen] = useState(false);
  const [isEditModalOpen, setEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [editPackageId, setEditPackageId] = useState<string | null>(null);
  const [deletePackageId, setDeletePackageId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [toast, setToast] = useState<{
    visible: boolean;
    message: string;
    type: "success" | "error";
  }>({
    visible: false,
    message: "",
    type: "success",
  });

  const showToast = (
    message: string,
    type: "success" | "error" = "success",
    duration = 3000
  ) => {
    setToast({ visible: true, message, type });
    setTimeout(() => setToast((t) => ({ ...t, visible: false })), duration);
  };

  // ✅ Gọi API mỗi khi component mount hoặc quay lại màn hình
  useEffect(() => {
    console.log("🔄 [PackagesManagementScreen] Component mounted, fetching packages...");
    // Nếu đang sort theo status thì không truyền sortField vào API
    const apiSortField = sortField === "status" ? "title" : sortField;
    fetchPage(1, 20, search, apiSortField, sortOrder, statusFilter);
  }, []);

  const handleEdit = (pkg: Package) => {
    console.log("🔧 Edit package clicked:", pkg.id);
    // CHỈ cho phép sửa khi status là PENDING
    if (pkg.status !== "PENDING") {
      showToast("Chỉ có thể sửa gói hàng đang chờ duyệt", "error");
      return;
    }
    setEditPackageId(pkg.id);
    setEditModalOpen(true);
    console.log("📝 Modal state:", {
      editPackageId: pkg.id,
      isEditModalOpen: true,
    });
  };

  const handleEditSuccess = async () => {
    console.log("🔄 Refreshing packages list after edit");
    console.log("Current state:", {
      search,
      sortField,
      sortOrder,
      statusFilter,
    });
    // Force refresh with current filters
    // Nếu đang sort theo status thì không truyền sortField vào API
    const apiSortField = sortField === "status" ? "title" : sortField;
    await fetchPage(1, 20, search, apiSortField, sortOrder, statusFilter);
    console.log("✅ Packages list refreshed");
    showToast("Đã cập nhật gói hàng thành công", "success");
  };

  const handleDelete = (id: string) => {
    console.log("🗑️ handleDelete called with id:", id);
    // Tìm package để kiểm tra status
    const pkg = packages.find((p) => p.id === id);
    if (pkg && pkg.status !== "PENDING") {
      showToast("Chỉ có thể xóa gói hàng đang chờ duyệt", "error");
      return;
    }
    setDeletePackageId(id);
    setDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!deletePackageId) return;

    setDeleting(true);
    console.log("🗑️ Deleting package:", deletePackageId);

    try {
      const response = await packageService.deletePackage(deletePackageId);
      console.log("✅ Delete response:", response);

      // Check success by statusCode or result
      const isDeleteSuccess =
        response.result === true ||
        response.statusCode === 200 ||
        (response.message &&
          response.message.toLowerCase().includes("success"));

      if (isDeleteSuccess) {
        console.log("✅ Package deleted successfully");
        // Close modal
        setDeleteModalOpen(false);
        setDeletePackageId(null);
        // Refresh data
        setTimeout(async () => {
          // Nếu đang sort theo status thì không truyền sortField vào API
          const apiSortField = sortField === "status" ? "title" : sortField;
          await fetchPage(1, 20, search, apiSortField, sortOrder, statusFilter);
          showToast("Đã xóa gói hàng thành công", "success");
        }, 200);
      } else {
        showToast(response.message || "Không thể xóa gói hàng", "error");
      }
    } catch (error) {
      console.error("❌ Error deleting package:", error);
      showToast("Đã xảy ra lỗi khi xóa gói hàng", "error");
    } finally {
      setDeleting(false);
    }
  };

  const handleSearchChange = (text: string) => {
    setSearch(text);
  };

  const handleSearchSubmit = () => {
    // Nếu đang sort theo status thì không truyền sortField vào API
    const apiSortField = sortField === "status" ? "title" : sortField;
    fetchPage(1, 20, search, apiSortField, sortOrder, statusFilter);
  };

  const handleApplySort = (field: string, order: "ASC" | "DESC") => {
    setSortField(field);
    setSortOrder(order);
    setIsSortModalOpen(false);
    // Nếu sort theo status thì sort local trên FE, không gọi API
    if (field !== "status") {
      fetchPage(1, 20, search, field, order, statusFilter);
    }
  };

  const handleStatusFilter = (status: string) => {
    setStatusFilter(status);
    // Nếu đang sort theo status thì không truyền sortField vào API
    const apiSortField = sortField === "status" ? "title" : sortField;
    fetchPage(1, 20, search, apiSortField, sortOrder, status);
  };

  const handleOpenCreate = () => {
    setSelectedItem({
      itemName: "iPhone 15 Pro Max",
      declaredValue: 35000000,
      currency: "VND",
    });
    setModalOpen(true);
  };

  const handleCreatePackage = async (data: any) => {
    try {
      console.log("📦 Creating package with data:", data);
      
      // Thêm itemId từ selectedItem nếu chưa có
      const payload = {
        ...data,
        itemId: data.itemId || (selectedItem as any)?.id || (selectedItem as any)?.itemId,
      };
      
      console.log("📦 Payload with itemId:", payload);
      
      // Call API to create package
      const response = await packageService.createPackage(payload);
      console.log("✅ Package created, response:", response);
      
      setModalOpen(false);
      
      // Check if creation was successful
      const isSuccess = response.isSuccess || response.statusCode === 200 || response.result;
      
      if (isSuccess) {
        showToast("Đã tạo gói hàng thành công", "success");
        // Refresh packages list
        // Nếu đang sort theo status thì không truyền sortField vào API
        const apiSortField = sortField === "status" ? "title" : sortField;
        await fetchPage(1, 20, search, apiSortField, sortOrder, statusFilter);
      } else {
        showToast(response.message || "Không thể tạo gói hàng", "error");
      }
    } catch (error) {
      console.error("❌ Error creating package:", error);
      setModalOpen(false);
      showToast("Đã xảy ra lỗi khi tạo gói hàng", "error");
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.headerBtn}>
          <Ionicons name="chevron-back" size={24} color="#111827" />
        </TouchableOpacity>

        <View style={styles.headerCenter} pointerEvents="none">
          <Text style={styles.headerTitle}>Quản Lý Gói Hàng</Text>
        </View>

        <View style={styles.headerRightPlaceholder} />
      </View>

      {/* SEARCH & FILTER */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputWrapper}>
          <Ionicons
            name="search"
            size={20}
            color="#9CA3AF"
            style={{ marginRight: 8 }}
          />
          <TextInput
            placeholder="Tìm gói hàng..."
            style={styles.searchInput}
            value={search}
            onChangeText={handleSearchChange}
            onSubmitEditing={handleSearchSubmit}
            returnKeyType="search"
          />
          <TouchableOpacity onPress={handleSearchSubmit} style={styles.searchButton}>
            <Ionicons name="arrow-forward" size={20} color="#0284C7" />
          </TouchableOpacity>
        </View>
        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => setIsSortModalOpen(true)}
        >
          <Ionicons name="options-outline" size={22} color="#374151" />
        </TouchableOpacity>
      </View>

      {/* STATUS FILTER CHIPS */}
      {/* <View style={styles.statusFilterRow}>
        {["ALL", "PENDING", "APPROVED", "REJECTED", "IN_TRANSIT", "DELIVERED", "COMPLETED"].map(
          (status) => (
            <TouchableOpacity
              key={status}
              style={[
                styles.statusChip,
                statusFilter === status && styles.statusChipActive,
                {
                  backgroundColor:
                    statusFilter === status
                      ? getStatusColor(status)
                      : "#F3F4F6",
                },
              ]}
              onPress={() => handleStatusFilter(status)}
            >
              <Text
                style={[
                  styles.statusChipText,
                  statusFilter === status && styles.statusChipTextActive,
                ]}
              >
                {getStatusLabel(status)}
              </Text>
            </TouchableOpacity>
          )
        )}
      </View> */}

      {/* LIST */}
      <View style={styles.listContainer}>
        {(() => {
          console.log('🔍 [PackagesManagementScreen] Render state:', {
            loading,
            error,
            packagesLength: packages?.length,
            packages: packages
          });
          return null;
        })()}
        {loading ? (
          <ActivityIndicator
            size="large"
            color="#0284C7"
            style={{ marginTop: 40 }}
          />
        ) : error ? (
          <View style={styles.centeredContainer}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity
              style={styles.retryButton}
              onPress={() => fetchPage(1, 20)}
            >
              <Text style={styles.retryButtonText}>Thử lại</Text>
            </TouchableOpacity>
          </View>
        ) : packages.length === 0 ? (
          <View style={styles.centeredContainer}>
            <Text style={styles.emptyText}>
              {search
                ? "Không tìm thấy gói hàng nào."
                : "Bạn chưa có gói hàng nào."}
            </Text>
          </View>
        ) : (
          <PackageList
            packages={(() => {
              // Sort trên FE nếu sortField là "status"
              if (sortField === "status") {
                const sorted = [...packages].sort((a, b) => {
                  const statusA = a.status || "";
                  const statusB = b.status || "";
                  if (sortOrder === "ASC") {
                    return statusA.localeCompare(statusB);
                  } else {
                    return statusB.localeCompare(statusA);
                  }
                });
                return sorted;
              }
              return packages;
            })()}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onPost={() => {}}
            getStatusColor={getStatusColor}
          />
        )}
      </View>

      {/* SORT MODAL */}
      {isSortModalOpen && (
        <View style={styles.sortModalBackdrop}>
          <View style={styles.sortModal}>
            <Text style={styles.sortModalTitle}>Sắp xếp theo</Text>

            <TouchableOpacity
              style={[
                styles.sortOption,
                sortField === "title" &&
                  sortOrder === "ASC" &&
                  styles.sortOptionActive,
              ]}
              onPress={() => handleApplySort("title", "ASC")}
            >
              <Text style={styles.sortOptionText}>Tiêu đề (A-Z)</Text>
              {sortField === "title" && sortOrder === "ASC" && (
                <Feather name="check" size={20} color="#0284C7" />
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.sortOption,
                sortField === "title" &&
                  sortOrder === "DESC" &&
                  styles.sortOptionActive,
              ]}
              onPress={() => handleApplySort("title", "DESC")}
            >
              <Text style={styles.sortOptionText}>Tiêu đề (Z-A)</Text>
              {sortField === "title" && sortOrder === "DESC" && (
                <Feather name="check" size={20} color="#0284C7" />
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.sortOption,
                sortField === "weightKg" &&
                  sortOrder === "ASC" &&
                  styles.sortOptionActive,
              ]}
              onPress={() => handleApplySort("weightKg", "ASC")}
            >
              <Text style={styles.sortOptionText}>
                Khối lượng (Thấp đến cao)
              </Text>
              {sortField === "weightKg" && sortOrder === "ASC" && (
                <Feather name="check" size={20} color="#0284C7" />
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.sortOption,
                sortField === "weightKg" &&
                  sortOrder === "DESC" &&
                  styles.sortOptionActive,
              ]}
              onPress={() => handleApplySort("weightKg", "DESC")}
            >
              <Text style={styles.sortOptionText}>
                Khối lượng (Cao đến thấp)
              </Text>
              {sortField === "weightKg" && sortOrder === "DESC" && (
                <Feather name="check" size={20} color="#0284C7" />
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.sortOption,
                sortField === "status" &&
                  sortOrder === "ASC" &&
                  styles.sortOptionActive,
              ]}
              onPress={() => handleApplySort("status", "ASC")}
            >
              <Text style={styles.sortOptionText}>Trạng thái (A-Z)</Text>
              {sortField === "status" && sortOrder === "ASC" && (
                <Feather name="check" size={20} color="#0284C7" />
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.sortOption,
                sortField === "status" &&
                  sortOrder === "DESC" &&
                  styles.sortOptionActive,
              ]}
              onPress={() => handleApplySort("status", "DESC")}
            >
              <Text style={styles.sortOptionText}>Trạng thái (Z-A)</Text>
              {sortField === "status" && sortOrder === "DESC" && (
                <Feather name="check" size={20} color="#0284C7" />
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.sortCancelBtn}
              onPress={() => setIsSortModalOpen(false)}
            >
              <Text style={styles.sortCancelText}>Đóng</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* CREATE PACKAGE MODAL */}
      <PackageFormModal
        visible={isModalOpen}
        onClose={() => setModalOpen(false)}
        onCreate={handleCreatePackage}
        item={selectedItem}
      />

      {/* EDIT PACKAGE MODAL */}
      <EditPackageModal
        visible={isEditModalOpen}
        onClose={() => {
          setEditModalOpen(false);
          setEditPackageId(null);
        }}
        onSuccess={handleEditSuccess}
        packageId={editPackageId}
      />

      {/* DELETE CONFIRMATION MODAL */}
      <Modal
        visible={isDeleteModalOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setDeleteModalOpen(false)}
      >
        <Pressable
          style={styles.deleteModalBackdrop}
          onPress={() => !deleting && setDeleteModalOpen(false)}
        >
          <Pressable
            style={styles.deleteModalContainer}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={styles.deleteModalHeader}>
              <Ionicons name="warning" size={48} color="#EF4444" />
            </View>

            <Text style={styles.deleteModalTitle}>Xác nhận xóa</Text>
            <Text style={styles.deleteModalMessage}>
              Bạn có chắc chắn muốn xóa gói hàng này?{"\n"}
              Hành động này không thể hoàn tác.
            </Text>

            <View style={styles.deleteModalFooter}>
              <TouchableOpacity
                style={styles.deleteModalCancelBtn}
                onPress={() => setDeleteModalOpen(false)}
                disabled={deleting}
              >
                <Text style={styles.deleteModalCancelText}>Hủy</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.deleteModalDeleteBtn,
                  deleting && { opacity: 0.7 },
                ]}
                onPress={confirmDelete}
                disabled={deleting}
              >
                {deleting ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.deleteModalDeleteText}>Xóa</Text>
                )}
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* TOAST */}
      {toast.visible && (
        <View
          style={[
            styles.toast,
            toast.type === "success" ? styles.toastSuccess : styles.toastError,
          ]}
        >
          <Text style={styles.toastText}>{toast.message}</Text>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F9FAFB" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderColor: "#F3F4F6",
  },
  headerTitle: { fontSize: 18, fontWeight: "800", color: "#0284C7" },
  headerBtn: { flexDirection: "row", alignItems: "center" },
  headerBtnText: {
    fontSize: 15,
    fontWeight: "500",
    color: "#111827",
    marginLeft: 4,
  },
  headerCenter: {
    position: "absolute",
    left: 0,
    right: 0,
    alignItems: "center",
  },
  headerRightPlaceholder: { width: 40 },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    backgroundColor: "#fff",
  },
  searchInputWrapper: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F3F4F6",
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 44,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  searchInput: { flex: 1, fontSize: 14, color: "#111827" },
  searchButton: {
    padding: 4,
    marginRight: 4,
  },
  filterButton: {
    marginLeft: 12,
    width: 44,
    height: 40,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
  },

  // Status filter chips
  statusFilterRow: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  statusChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  statusChipActive: {
    borderColor: "transparent",
  },
  statusChipText: {
    fontSize: 13,
    fontWeight: "500",
    color: "#6B7280",
  },
  statusChipTextActive: {
    color: "#FFFFFF",
    fontWeight: "600",
  },

  listContainer: { flex: 1 },
  centeredContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  errorText: {
    fontSize: 16,
    color: "#EF4444",
    textAlign: "center",
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 16,
    color: "#6B7280",
    textAlign: "center",
  },
  retryButton: {
    backgroundColor: "#0284C7",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  retryButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },

  // Sort Modal
  sortModalBackdrop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  },
  sortModal: {
    width: "85%",
    maxWidth: 400,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
  },
  sortModalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 16,
  },
  sortOption: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: "#F3F4F6",
  },
  sortOptionActive: {
    backgroundColor: "#DBEAFE",
    borderWidth: 1,
    borderColor: "#0284C7",
  },
  sortOptionText: {
    fontSize: 15,
    color: "#111827",
  },
  sortCancelBtn: {
    marginTop: 12,
    paddingVertical: 12,
    alignItems: "center",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  sortCancelText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#6B7280",
  },

  // Toast
  toast: {
    position: "absolute",
    left: 16,
    right: 16,
    bottom: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 6,
    zIndex: 9999,
  },
  toastSuccess: {
    backgroundColor: "#10B981",
  },
  toastError: {
    backgroundColor: "#EF4444",
  },
  toastText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },

  // Delete Modal Styles
  deleteModalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  deleteModalContainer: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 24,
    width: "100%",
    maxWidth: 400,
    alignItems: "center",
  },
  deleteModalHeader: {
    marginBottom: 16,
  },
  deleteModalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1F2937",
    marginBottom: 12,
  },
  deleteModalMessage: {
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 24,
  },
  deleteModalFooter: {
    flexDirection: "row",
    gap: 12,
    width: "100%",
  },
  deleteModalCancelBtn: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    alignItems: "center",
  },
  deleteModalCancelText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
  },
  deleteModalDeleteBtn: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    backgroundColor: "#EF4444",
    alignItems: "center",
  },
  deleteModalDeleteText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#fff",
  },
});

export default PackagesManagementScreen;
