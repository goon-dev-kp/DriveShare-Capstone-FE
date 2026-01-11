import React, { useState, useMemo } from "react";
import { StyleSheet, View, Text, TouchableOpacity, Alert, ActivityIndicator, TextInput, Platform, Modal, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather, Ionicons } from "@expo/vector-icons";
import { Item, ItemStatus, Package } from "../../models/types";
import packageService from "@/services/packageService";
import ItemList from "./components/ItemList";
import { ArrowLeftIcon } from "./icons/ActionIcons"; // Giả định icon này là component RN
import ItemFormModal from "./components/ItemFormModal";
import PackageFormModal from "./components/PackageFormModal";
import useItems from "@/hooks/useItems";

interface ItemsManagementScreenProps {
  onBack: () => void;
}

const COLORS = {
  primary: "#4F46E5", // indigo-600
  white: "#FFFFFF",
  black: "#111827", // gray-900
  gray: "#6B7280", // gray-500
  lightGray: "#F3F4F6", // gray-100
  separator: "#E5E7EB", // gray-200
  red: "#EF4444", // red-500
};

// Status color mapping
const STATUS_COLORS: Record<string, string> = {
  ALL: "#4F46E5",
  PENDING: "#F59E0B", // orange
  IN_USE: "#10B981", // green
  IN_PROGRESS: "#3B82F6", // blue
  COMPLETED: "#6B7280", // gray
  DELETED: "#EF4444", // red
};

// Status label mapping
const getStatusLabel = (status: string): string => {
  const labels: Record<string, string> = {
    ALL: "Tất cả",
    PENDING: "Chờ xử lý",
    IN_USE: "Đang dùng",
    IN_PROGRESS: "Đang vận chuyển",
    COMPLETED: "Hoàn thành",
    DELETED: "Đã xóa",
  };
  return labels[status] || status;
};

// Get status color
const getStatusColor = (status: string): string => {
  return STATUS_COLORS[status] || "#9CA3AF";
};

const ItemsManagementScreen: React.FC<ItemsManagementScreenProps> = ({
  onBack,
}) => {
  const {
    items,
    loading,
    error,
    search,
    sortBy,
    sortOrder,
    statusFilter,
    setSearch,
    setSortBy,
    setSortOrder,
    setStatusFilter,
    createItem,
    updateItem,
    deleteItem,
    fetchPage,
  } = useItems(1, 20);
  const [isItemModalOpen, setItemModalOpen] = useState(false);
  const [isPackageModalOpen, setPackageModalOpen] = useState(false);
  const [isSortModalOpen, setIsSortModalOpen] = useState(false);
  const [isDeleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [deleteItemId, setDeleteItemId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [toast, setToast] = useState<{
    visible: boolean;
    message: string;
    type: "success" | "error";
  }>({ visible: false, message: "", type: "success" });

  const showToast = (
    message: string,
    type: "success" | "error" = "success",
    duration = 3000
  ) => {
    setToast({ visible: true, message, type });
    setTimeout(() => setToast((t) => ({ ...t, visible: false })), duration);
  };

  const handleEditItem = (item: Item) => {
    // Chỉ cho phép sửa khi status là PENDING
    if (item.status !== ItemStatus.PENDING) {
      showToast("Chỉ có thể sửa sản phẩm ở trạng thái Chờ xử lý", "error");
      return;
    }
    setSelectedItem(item);
    setItemModalOpen(true);
  };

  const handleDeleteItem = (itemId: string) => {
    console.log("🗑️ handleDeleteItem called with id:", itemId);
    // Tìm item để kiểm tra status
    const item = items.find((i) => i.id === itemId);
    if (item && item.status !== ItemStatus.PENDING) {
      showToast("Chỉ có thể xóa sản phẩm ở trạng thái Chờ xử lý", "error");
      return;
    }
    setDeleteItemId(itemId);
    setDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!deleteItemId) return;

    setDeletingId(deleteItemId);
    console.log("🗑️ Deleting item:", deleteItemId);

    try {
      const res = await deleteItem(deleteItemId);
      console.log("✅ Delete response:", res);

      const isDeleteSuccess =
        res?.isSuccess === true ||
        res?.statusCode === 200 ||
        (res?.message && res.message.toLowerCase().includes("success"));

      if (isDeleteSuccess) {
        console.log("✅ Item deleted successfully");
        setDeleteModalOpen(false);
        setDeleteItemId(null);
        setTimeout(async () => {
          // Nếu đang sort theo status thì không truyền sortBy vào API
          const apiSortBy = sortBy === "status" ? "itemname" : sortBy;
          await fetchPage(1, 20, search, apiSortBy, sortOrder, statusFilter);
          showToast("Đã xóa sản phẩm thành công", "success");
        }, 200);
      } else {
        showToast(res?.message || "Xóa không thành công", "error");
      }
    } catch (e: any) {
      console.error("❌ Error deleting item:", e);
      showToast(e?.message || "Lỗi khi xóa", "error");
    } finally {
      setDeletingId(null);
    }
  };

  const handlePackItem = (item: Item) => {
    setSelectedItem(item);
    setPackageModalOpen(true);
  };

  const handleAddNewItem = () => {
    setSelectedItem(null);
    setItemModalOpen(true);
  };

  const handleSearchChange = (text: string) => {
    setSearch(text);
  };

  const handleSearchSubmit = () => {
    // Nếu đang sort theo status thì không truyền sortBy vào API
    const apiSortBy = sortBy === "status" ? "itemname" : sortBy;
    fetchPage(1, 20, search, apiSortBy, sortOrder, statusFilter);
  };

  const onOpenSort = () => {
    setIsSortModalOpen(true);
  };

  const handleApplySort = (field: string, order: "ASC" | "DESC") => {
    setSortBy(field);
    setSortOrder(order);
    setIsSortModalOpen(false);
    // Nếu sort theo status thì sort local trên FE, không gọi API
    if (field !== "status") {
      fetchPage(1, 20, search, field, order, statusFilter);
    }
  };

  const handleStatusFilter = (status: string) => {
    setStatusFilter(status);
    // Nếu đang sort theo status thì không truyền sortBy vào API
    const apiSortBy = sortBy === "status" ? "itemname" : sortBy;
    fetchPage(1, 20, search, apiSortBy, sortOrder, status);
  };

  const handleSaveItem = async (itemToSave: any) => {
    // Map frontend form to backend DTO (PascalCase) before sending
    if (selectedItem) {
      // accept both PascalCase and camelCase from modal
      const getField = (pascal: string, camel: string) =>
        itemToSave[pascal] ?? itemToSave[camel];

      const updateDto = {
        ItemId: (selectedItem as any).id ?? (selectedItem as any).itemId,
        ItemName: String(getField("ItemName", "itemName") ?? ""),
        Description: String(getField("Description", "description") ?? ""),
        DeclaredValue: Number(getField("DeclaredValue", "declaredValue") ?? 0),
        Currency: String(getField("Currency", "currency") ?? "VND"),
        Quantity: Number(getField("Quantity", "quantity") ?? 1),
        Unit: String(getField("Unit", "unit") ?? "pcs"),
      };

      await updateItem(updateDto as any);
    } else {
      // accept both PascalCase and camelCase and include images if present
      const getField = (pascal: string, camel: string) =>
        itemToSave[pascal] ?? itemToSave[camel];

      const createDto: any = {
        ItemName: String(getField("ItemName", "itemName") ?? ""),
        Description: String(getField("Description", "description") ?? ""),
        DeclaredValue: Number(getField("DeclaredValue", "declaredValue") ?? 0),
        Currency: String(getField("Currency", "currency") ?? "VND"),
        Price: Number(getField("Price", "price") ?? 0),
        Quantity: Number(getField("Quantity", "quantity") ?? 1),
        Unit: String(getField("Unit", "unit") ?? "pcs"),
      };

      // ItemImages may be provided as PascalCase array of dataURLs or images array
      if (itemToSave.ItemImages) createDto.ItemImages = itemToSave.ItemImages;
      else if (itemToSave.images)
        createDto.ItemImages = itemToSave.images.map(
          (i: any) => i.itemImageURL ?? i.uri ?? i
        );
      else if (itemToSave.itemImages)
        createDto.ItemImages = itemToSave.itemImages;

      await createItem(createDto as any);
    }
    setItemModalOpen(false);
    setSelectedItem(null);
    // Nếu đang sort theo status thì không truyền sortBy vào API
    const apiSortBy = sortBy === "status" ? "itemname" : sortBy;
    fetchPage(1, 20, search, apiSortBy, sortOrder);
  };

  const handleCreatePackage = (
    packageDetails: Omit<Package, "id" | "itemId">
  ) => {
    (async () => {
      try {
        // Build DTO, include ItemId from selectedItem
        const dto: any = {
          title: packageDetails.title,
          description: packageDetails.description,
          quantity: packageDetails.quantity,
          unit: packageDetails.unit,
          weightKg: packageDetails.weightKg,
          volumeM3: packageDetails.volumeM3,
          otherRequirements: (packageDetails as any).otherRequirements || "",
          // Boolean handling attributes
          isFragile: (packageDetails as any).isFragile || false,
          isLiquid: (packageDetails as any).isLiquid || false,
          isRefrigerated: (packageDetails as any).isRefrigerated || false,
          isFlammable: (packageDetails as any).isFlammable || false,
          isHazardous: (packageDetails as any).isHazardous || false,
          isBulky: (packageDetails as any).isBulky || false,
          isPerishable: (packageDetails as any).isPerishable || false,
          // images
          images: packageDetails.images ?? [],
          itemId: (selectedItem as any)?.id ?? (selectedItem as any)?.itemId,
        };

        console.log("📦 [ItemsManagement] Creating package:", {
          itemId: dto.itemId,
          hasImages: dto.images?.length > 0,
          imageDetails: dto.images?.map((img: any) => ({
            hasUri: !!img.uri,
            fileName: img.fileName,
            type: img.type,
          })),
        });

        const res = await packageService.createPackage(dto);
        if (res?.isSuccess) {
          showToast("Tạo gói thành công", "success");
          // mark item as packaged locally and refresh
          // if (selectedItem) {
          //   const updatedItem = { ...selectedItem, status: ItemStatus.PACKAGED }
          //   updateItem(updatedItem)
          // }
          // Nếu đang sort theo status thì không truyền sortBy vào API
          const apiSortBy = sortBy === "status" ? "itemname" : sortBy;
          fetchPage(1, 20, search, apiSortBy, sortOrder);
        } else {
          showToast(res?.message || "Tạo gói không thành công", "error");
        }
      } catch (e: any) {
        console.error("❌ [ItemsManagement] Create package failed:", e);
        showToast(e?.message || "Lỗi khi tạo gói", "error");
      } finally {
        setPackageModalOpen(false);
        setSelectedItem(null);
      }
    })();
  };

  // Helper function để render nội dung chính
  const renderContent = () => {
    if (loading) {
      return (
        <View style={styles.centeredContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.statusText}>Đang tải dữ liệu...</Text>
        </View>
      );
    }

    if (error) {
      return (
        <View style={styles.centeredContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => fetchPage(1, 20)}
          >
            <Text style={styles.primaryButtonText}>Thử lại</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (items.length === 0) {
      return (
        <View style={styles.centeredContainer}>
          <Text style={styles.statusText}>
            {search
              ? "Không tìm thấy sản phẩm nào."
              : "Bạn chưa có sản phẩm nào."}
          </Text>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={handleAddNewItem}
          >
            <Text style={styles.primaryButtonText}>Thêm sản phẩm ngay</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <ItemList
        items={(() => {
          // Sort trên FE nếu sortBy là "status"
          if (sortBy === "status") {
            const sorted = [...items].sort((a, b) => {
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
          return items;
        })()}
        onEdit={handleEditItem}
        onDelete={handleDeleteItem}
        onPack={handlePackItem}
        deletingId={deletingId}
        getStatusColor={getStatusColor}
      />
    );
  };

  // Toast/snackbar render (absolute at bottom)
  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      {/* Header similar to Vehicle screen: back | centered title | + Thêm */}
      <View style={styles.headerContainer}>
        <View style={styles.headerLeft}>
          <TouchableOpacity onPress={onBack} style={styles.backButton}>
            <ArrowLeftIcon style={styles.icon} />
          </TouchableOpacity>
        </View>

        <View style={styles.headerCenter} pointerEvents="none">
          <Text style={styles.headerTitle}>Quản Lý Sản Phẩm</Text>
        </View>

        <View style={styles.headerRight}>
          <TouchableOpacity onPress={handleAddNewItem} style={styles.addLink}>
            <Feather name="plus" size={16} color="#0B5FFF" />
            <Text style={[styles.addLinkText, { color: "#10439F" }]}>
              {" "}
              Thêm
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Search row */}
      <View style={styles.searchRow}>
        <View style={styles.searchBox}>
          <Feather
            name="search"
            size={16}
            color="#9CA3AF"
            style={{ marginLeft: 10 }}
          />
          <TextInput
            value={search}
            onChangeText={handleSearchChange}
            placeholder="Tìm nhanh sản phẩm..."
            placeholderTextColor="#9CA3AF"
            style={styles.searchInput}
            returnKeyType="search"
            onSubmitEditing={handleSearchSubmit}
          />
          <TouchableOpacity onPress={handleSearchSubmit} style={styles.searchButton}>
            <Ionicons name="arrow-forward" size={20} color="#4F46E5" />
          </TouchableOpacity>
        </View>
        <TouchableOpacity style={styles.filterButton} onPress={onOpenSort}>
          <Ionicons name="options-outline" size={22} color="#374151" />
        </TouchableOpacity>
      </View>

      {/* Status Filter Chips */}
      {/* <View style={styles.statusFilterRow}>
        {["ALL", "PENDING", "IN_USE", "IN_PROGRESS", "COMPLETED"].map(
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
      <View style={styles.bodyContainer}>{renderContent()}</View>
      <ItemFormModal
        visible={isItemModalOpen}
        onClose={() => setItemModalOpen(false)}
        onSave={handleSaveItem}
        item={selectedItem}
      />
      <PackageFormModal
        visible={isPackageModalOpen}
        onClose={() => setPackageModalOpen(false)}
        onCreate={handleCreatePackage}
        item={selectedItem}
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
          onPress={() => !deletingId && setDeleteModalOpen(false)}
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
              Bạn có chắc chắn muốn xóa sản phẩm này?{"\n"}
              Hành động này không thể hoàn tác.
            </Text>

            <View style={styles.deleteModalFooter}>
              <TouchableOpacity
                style={styles.deleteModalCancelBtn}
                onPress={() => setDeleteModalOpen(false)}
                disabled={!!deletingId}
              >
                <Text style={styles.deleteModalCancelText}>Hủy</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.deleteModalDeleteBtn,
                  deletingId && { opacity: 0.7 },
                ]}
                onPress={confirmDelete}
                disabled={!!deletingId}
              >
                {deletingId ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.deleteModalDeleteText}>Xóa</Text>
                )}
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Sort Modal */}
      {isSortModalOpen && (
        <View style={styles.sortModalBackdrop}>
          <View style={styles.sortModal}>
            <Text style={styles.sortModalTitle}>Sắp xếp theo</Text>

            <TouchableOpacity
              style={[
                styles.sortOption,
                sortBy === "itemname" &&
                  sortOrder === "ASC" &&
                  styles.sortOptionActive,
              ]}
              onPress={() => handleApplySort("itemname", "ASC")}
            >
              <Text style={styles.sortOptionText}>Tên sản phẩm (A-Z)</Text>
              {sortBy === "itemname" && sortOrder === "ASC" && (
                <Feather name="check" size={20} color={COLORS.primary} />
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.sortOption,
                sortBy === "itemname" &&
                  sortOrder === "DESC" &&
                  styles.sortOptionActive,
              ]}
              onPress={() => handleApplySort("itemname", "DESC")}
            >
              <Text style={styles.sortOptionText}>Tên sản phẩm (Z-A)</Text>
              {sortBy === "itemname" && sortOrder === "DESC" && (
                <Feather name="check" size={20} color={COLORS.primary} />
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.sortOption,
                sortBy === "declaredvalue" &&
                  sortOrder === "ASC" &&
                  styles.sortOptionActive,
              ]}
              onPress={() => handleApplySort("declaredvalue", "ASC")}
            >
              <Text style={styles.sortOptionText}>Giá trị (Thấp đến cao)</Text>
              {sortBy === "declaredvalue" && sortOrder === "ASC" && (
                <Feather name="check" size={20} color={COLORS.primary} />
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.sortOption,
                sortBy === "declaredvalue" &&
                  sortOrder === "DESC" &&
                  styles.sortOptionActive,
              ]}
              onPress={() => handleApplySort("declaredvalue", "DESC")}
            >
              <Text style={styles.sortOptionText}>Giá trị (Cao đến thấp)</Text>
              {sortBy === "declaredvalue" && sortOrder === "DESC" && (
                <Feather name="check" size={20} color={COLORS.primary} />
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.sortOption,
                sortBy === "status" &&
                  sortOrder === "ASC" &&
                  styles.sortOptionActive,
              ]}
              onPress={() => handleApplySort("status", "ASC")}
            >
              <Text style={styles.sortOptionText}>Trạng thái (A-Z)</Text>
              {sortBy === "status" && sortOrder === "ASC" && (
                <Feather name="check" size={20} color={COLORS.primary} />
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.sortOption,
                sortBy === "status" &&
                  sortOrder === "DESC" &&
                  styles.sortOptionActive,
              ]}
              onPress={() => handleApplySort("status", "DESC")}
            >
              <Text style={styles.sortOptionText}>Trạng thái (Z-A)</Text>
              {sortBy === "status" && sortOrder === "DESC" && (
                <Feather name="check" size={20} color={COLORS.primary} />
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

  // above return already renders the full screen (with toast)
};

// 8. Toàn bộ style được định nghĩa bằng StyleSheet
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  // Header
  headerContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: COLORS.white,
    borderBottomWidth: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 3,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    flexShrink: 1, // Cho phép text co lại nếu cần
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  icon: {
    width: 24,
    height: 24,
    color: COLORS.black,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#10439F",
  },
  headerSubtitle: {
    fontSize: 14,
    color: COLORS.gray,
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  headerCenter: {
    position: "absolute",
    left: 0,
    right: 0,
    alignItems: "center",
  },
  addLink: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  addLinkText: {
    fontSize: 15,
    fontWeight: "500",
    color: "#111827",
    marginLeft: 4,
  },

  // search
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: "#FAFBFC",
    borderBottomWidth: 1,
    borderBottomColor: '#F1F3F5',
  },
  searchBox: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    height: 48,
    borderWidth: 1,
    borderColor: '#E9ECEF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 1,
  },
  searchInput: { flex: 1, paddingHorizontal: 10, color: "#111827" },
  searchButton: {
    padding: 4,
    marginRight: 4,
  },
  filterButton: {
    marginLeft: 12,
    width: 48,
    height: 48,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E9ECEF",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 1,
  },

  // Status filter chips
  statusFilterRow: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#FAFBFC",
    borderBottomWidth: 1,
    borderBottomColor: "#F1F3F5",
  },
  statusChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1.5,
    borderColor: "#DEE2E6",
    backgroundColor: '#FFFFFF',
  },
  statusChipActive: {
    borderColor: "transparent",
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  statusChipText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#495057",
  },
  statusChipTextActive: {
    color: "#FFFFFF",
    fontWeight: "700",
  },

  toast: {
    position: "absolute",
    left: 20,
    right: 20,
    bottom: 40,
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
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
  // Body
  bodyContainer: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 0, // FlatList đã có paddingBottom riêng
    backgroundColor: '#FAFBFC',
  },
  // Trạng thái (Loading, Empty, Error)
  centeredContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
    gap: 16,
  },
  statusText: {
    fontSize: 16,
    color: COLORS.gray,
  },
  errorText: {
    fontSize: 16,
    color: COLORS.red,
    textAlign: "center",
  },
  // Buttons
  primaryButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 12,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  primaryButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: "600",
  },
  primaryButtonSmall: {
    backgroundColor: COLORS.primary,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    elevation: 2,
  },
  secondaryButton: {
    backgroundColor: COLORS.white,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.separator,
  },
  secondaryButtonText: {
    color: COLORS.black,
    fontSize: 14,
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
    backgroundColor: COLORS.white,
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
    color: COLORS.black,
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
    backgroundColor: COLORS.lightGray,
  },
  sortOptionActive: {
    backgroundColor: "#EEF2FF",
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  sortOptionText: {
    fontSize: 15,
    color: COLORS.black,
  },
  sortCancelBtn: {
    marginTop: 12,
    paddingVertical: 12,
    alignItems: "center",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.separator,
  },
  sortCancelText: {
    fontSize: 15,
    fontWeight: "600",
    color: COLORS.gray,
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

export default ItemsManagementScreen;
