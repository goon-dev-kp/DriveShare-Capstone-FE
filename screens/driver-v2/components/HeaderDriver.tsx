import React, { useState } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  ImageBackground,
  Dimensions,
  Modal,
} from "react-native";
import { MaterialCommunityIcons, Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useNotificationStore } from "@/stores/notificationStore";
import { useAuthStore } from "@/stores/authStore";

interface HeaderProps {
  driver: any;
  onRefresh?: () => void;
  refreshing?: boolean;
}

const HeaderDriver: React.FC<HeaderProps> = ({ driver, onRefresh, refreshing = false }) => {
  const router = useRouter();
  const { unreadCount } = useNotificationStore();
  const { logout } = useAuthStore();
  const [showSettingsMenu, setShowSettingsMenu] = useState(false);

  const name = driver?.fullName || "N/A";
  const license = driver?.licenseClass || "Chưa cập nhật";
  const experience = driver?.experienceYears || 0;
  const avatar = driver?.avatarUrl;

  // Get verification status from profile
  const hasVerifiedCitizenId = driver?.hasVerifiedCitizenId ?? false;
  const hasVerifiedDriverLicense = driver?.hasVerifiedDriverLicense ?? false;
  const hasDeclaredInitialHistory = driver?.hasDeclaredInitialHistory ?? false;
  const hasVerifiedHealthCheck = driver?.hasVerifiedHealthCheck ?? false;

  const handleVerifyDocuments = () => {
    router.push("/driver/my-documents");
  };

  const handleDeclareHistory = () => {
    router.push("/driver/import-history");
  };

  const handleHealthCheck = () => {
    router.push("/driver/verify-health-check");
  };

  const handleLogout = async () => {
    try {
      // Gọi authStore.logout() - nó sẽ tự gọi API với token rồi xóa data
      await logout();
      router.replace("/(auth)/login");
    } catch (error) {
      console.error("Logout error:", error);
      // Vẫn redirect về login nếu có lỗi
      router.replace("/(auth)/login");
    }
  };

  return (
    <ImageBackground
      source={require("../../../assets/header-bg.png")} // Dùng ảnh nền giống Owner hoặc ảnh Cabin xe tải
      style={styles.backgroundImage}
      imageStyle={{ opacity: 0.85, backgroundColor: "#000" }} // Làm tối ảnh nền một chút
    >
      <View style={styles.overlay}>
        <View style={styles.topBar}>
          {/* Logo hoặc Brand Name nhỏ */}
          <Text style={styles.brandText}>DriveShare Driver</Text>

          <View style={styles.actions}>
            {onRefresh && (
              <TouchableOpacity
                style={styles.iconBtn}
                onPress={onRefresh}
                disabled={refreshing}
              >
                {refreshing ? (
                  <MaterialCommunityIcons name="loading" size={24} color="#FFF" />
                ) : (
                  <Ionicons name="refresh-outline" size={24} color="#FFF" />
                )}
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={styles.iconBtn}
              onPress={() => router.push("/notifications")}
            >
              <Ionicons name="notifications-outline" size={24} color="#FFF" />
              {unreadCount > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.iconBtn}
              onPress={() => setShowSettingsMenu(true)}
            >
              <Ionicons name="settings-outline" size={24} color="#FFF" />
            </TouchableOpacity>

            {/* Settings Menu Modal */}
            <Modal
              visible={showSettingsMenu}
              transparent
              animationType="fade"
              onRequestClose={() => setShowSettingsMenu(false)}
            >
              <TouchableOpacity
                style={styles.modalOverlay}
                activeOpacity={1}
                onPress={() => setShowSettingsMenu(false)}
              >
                <View style={styles.menuContainer}>
                  <TouchableOpacity
                    style={styles.menuItem}
                    onPress={handleLogout}
                  >
                    <Ionicons
                      name="log-out-outline"
                      size={20}
                      color="#EF4444"
                    />
                    <Text style={styles.menuText}>Đăng xuất</Text>
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            </Modal>
          </View>
        </View>

        {/* Driver Info Row */}
        <View style={styles.profileRow}>
          <View style={styles.avatarContainer}>
            {avatar ? (
              <Image source={{ uri: avatar }} style={styles.avatar} />
            ) : (
              <View
                style={[
                  styles.avatar,
                  {
                    backgroundColor: "#E0E7FF",
                    alignItems: "center",
                    justifyContent: "center",
                  },
                ]}
              >
                <Text
                  style={{ fontSize: 24, fontWeight: "bold", color: "#4F46E5" }}
                >
                  {name.charAt(0)}
                </Text>
              </View>
            )}
            <View style={styles.verifiedBadge}>
              <MaterialCommunityIcons
                name="check-decagram"
                size={16}
                color="#10B981"
              />
            </View>
          </View>

          <View style={styles.infoText}>
            <Text style={styles.name}>{name}</Text>
            <Text style={styles.subInfo}>Bằng lái {license}</Text>
            <View style={styles.badgeRow}>
              <View style={styles.ratingBadge}>
                <MaterialCommunityIcons name="star" size={12} color="#F59E0B" />
                <Text style={styles.ratingText}>4.9/5.0</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Verification Status (CCCD + GPLX + Initial History + Health Check for drivers) */}
        <View style={styles.verifySection}>
          {hasVerifiedCitizenId &&
          hasVerifiedDriverLicense &&
          hasDeclaredInitialHistory &&
          hasVerifiedHealthCheck ? (
            <View style={styles.verifiedBadgeContainer}>
              <MaterialCommunityIcons
                name="shield-check"
                size={16}
                color="#10B981"
              />
              <Text style={styles.verifiedText}>Đã xác minh đầy đủ</Text>
            </View>
          ) : (
            <View style={styles.verifyButtonsContainer}>
              {!hasVerifiedCitizenId && (
                <TouchableOpacity
                  style={styles.verifyButton}
                  onPress={handleVerifyDocuments}
                >
                  <MaterialCommunityIcons
                    name="card-account-details"
                    size={16}
                    color="#EF4444"
                  />
                  <Text style={styles.verifyButtonText}>Xác minh CCCD</Text>
                </TouchableOpacity>
              )}
              {!hasVerifiedDriverLicense && (
                <TouchableOpacity
                  style={styles.verifyButton}
                  onPress={handleVerifyDocuments}
                >
                  <MaterialCommunityIcons
                    name="card-account-details-outline"
                    size={16}
                    color="#EF4444"
                  />
                  <Text style={styles.verifyButtonText}>Xác minh GPLX</Text>
                </TouchableOpacity>
              )}
              {!hasDeclaredInitialHistory && (
                <TouchableOpacity
                  style={styles.verifyButton}
                  onPress={handleDeclareHistory}
                >
                  <MaterialCommunityIcons
                    name="history"
                    size={16}
                    color="#F59E0B"
                  />
                  <Text style={styles.verifyButtonText}>
                    Import giờ khởi tạo
                  </Text>
                </TouchableOpacity>
              )}
              {!hasVerifiedHealthCheck && (
                <TouchableOpacity
                  style={styles.verifyButton}
                  onPress={handleHealthCheck}
                >
                  <MaterialCommunityIcons
                    name="heart-pulse"
                    size={16}
                    color="#10B981"
                  />
                  <Text style={styles.verifyButtonText}>Xác minh sức khỏe</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>
      </View>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  backgroundImage: {
    width: "100%",
    height: 280,
    paddingTop: 40,
  },
  overlay: {
    flex: 1,
    paddingHorizontal: 16,
    backgroundColor: "rgba(0,0,0,0.3)", // Lớp phủ đen mờ để chữ nổi bật
  },
  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  brandText: {
    color: "rgba(255,255,255,0.9)",
    fontWeight: "600",
    fontSize: 14,
  },
  actions: {
    flexDirection: "row",
    gap: 12,
  },
  iconBtn: {
    padding: 8,
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 20,
  },
  dot: {
    position: "absolute",
    top: 8,
    right: 10,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#EF4444",
  },
  badge: {
    position: "absolute",
    top: 2,
    right: 2,
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#EF4444",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 5,
    borderWidth: 2,
    borderColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 5,
  },
  badgeText: {
    color: "#FFF",
    fontSize: 11,
    fontWeight: "800",
  },
  profileRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  avatarContainer: {
    position: "relative",
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 2,
    borderColor: "#FFF",
  },
  verifiedBadge: {
    position: "absolute",
    bottom: 0,
    right: -4,
    backgroundColor: "#FFF",
    borderRadius: 10,
  },
  infoText: {
    flex: 1,
  },
  name: {
    fontSize: 20,
    fontWeight: "800",
    color: "#FFF",
    marginBottom: 4,
  },
  subInfo: {
    color: "rgba(255,255,255,0.9)",
    fontSize: 13,
    marginBottom: 6,
  },
  badgeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  ratingBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.2)",
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    gap: 4,
  },
  ratingText: {
    color: "#FFF",
    fontSize: 12,
    fontWeight: "700",
  },
  verifySection: {
    marginTop: 12,
    paddingHorizontal: 0,
  },
  verifiedBadgeContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(16, 185, 129, 0.15)",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
    alignSelf: "flex-start",
  },
  verifiedText: {
    color: "#FFF",
    fontSize: 13,
    fontWeight: "700",
  },
  verifyButtonsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    alignItems: "center",
  },
  verifyButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
    gap: 4,
  },
  verifyButtonText: {
    color: "#EF4444",
    fontSize: 11,
    fontWeight: "700",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-start",
    alignItems: "flex-end",
    paddingTop: 90,
    paddingRight: 16,
  },
  menuContainer: {
    backgroundColor: "#FFF",
    borderRadius: 8,
    minWidth: 150,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 12,
  },
  menuText: {
    fontSize: 14,
    color: "#EF4444",
    fontWeight: "600",
  },
});

export default HeaderDriver;
