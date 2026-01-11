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
  provider: any | null | undefined;
  onRefresh?: () => void;
  refreshing?: boolean;
}

const { width } = Dimensions.get("window");

const HeaderProvider: React.FC<HeaderProps> = ({ provider, onRefresh, refreshing = false }) => {
  const router = useRouter();
  const { unreadCount } = useNotificationStore();
  const { logout } = useAuthStore();
  const [showSettingsMenu, setShowSettingsMenu] = useState(false);

  const p = provider as any;
  const profile = p?.profile ?? p?.result ?? p ?? {};

  const name = profile?.fullName || profile?.userName || "Nhà cung cấp";
  const company = profile?.companyName || profile?.company || "Chưa có dữ liệu";
  const avatar = profile?.avatarUrl || profile?.AvatarUrl || null;
  const email = profile?.email || "Chưa có dữ liệu";
  const phone = profile?.phoneNumber || "Chưa có dữ liệu";
  const status = (profile?.status || "").toString();

  // Get verification status from profile
  const hasVerifiedCitizenId = profile?.hasVerifiedCitizenId ?? false;

  const initials = name
    ? name
        .split(" ")
        .map((s: string) => s[0])
        .slice(0, 2)
        .join("")
        .toUpperCase()
    : "NP";

  const handleVerifyDocuments = () => {
    router.push("/provider-v2/my-documents");
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
    <View style={styles.container}>
      <ImageBackground
        source={require("../../../assets/header-bg.png")}
        style={styles.backgroundImage}
        imageStyle={{ opacity: 0.9 }}
      >
        <View style={styles.topOverlay}>
          <View style={styles.topIconContainer}>
            {onRefresh && (
              <TouchableOpacity
                style={styles.iconButton}
                onPress={onRefresh}
                disabled={refreshing}
              >
                {refreshing ? (
                  <MaterialCommunityIcons name="loading" size={26} color="#FFFFFF" />
                ) : (
                  <Ionicons name="refresh-outline" size={26} color="#FFFFFF" />
                )}
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={styles.iconButton}
              onPress={() => router.push("/notifications")}
            >
              <MaterialCommunityIcons
                name="bell-outline"
                size={26}
                color="#FFFFFF"
              />
              {unreadCount > 0 && (
                <View style={styles.notificationBadge}>
                  <Text style={styles.badgeText}>
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.iconButton}
              onPress={() => setShowSettingsMenu(true)}
            >
              <Ionicons name="settings-outline" size={26} color="#FFFFFF" />
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
      </ImageBackground>

      <View style={styles.floatingCardWrapper}>
        <View style={styles.floatingCard}>
          <View style={styles.avatarWrapper}>
            {avatar ? (
              <Image
                source={{ uri: avatar }}
                style={styles.avatarImage}
                resizeMode="cover"
              />
            ) : (
              <View style={styles.avatarInitialsContainer}>
                <Text style={styles.avatarInitialsText}>{initials}</Text>
              </View>
            )}
          </View>

          <View style={styles.infoContent}>
            <View style={styles.nameRow}>
              <Text style={styles.profileName}>{name}</Text>
              {status && status.toUpperCase() === "ACTIVE" ? (
                <View
                  style={[styles.verifiedIcon, { backgroundColor: "#10B981" }]}
                >
                  <Text
                    style={{ color: "white", fontSize: 12, fontWeight: "bold" }}
                  >
                    ✓
                  </Text>
                </View>
              ) : (
                <View
                  style={[styles.verifiedIcon, { backgroundColor: "#EF4444" }]}
                >
                  <Text
                    style={{ color: "white", fontSize: 12, fontWeight: "bold" }}
                  >
                    ✕
                  </Text>
                </View>
              )}
            </View>

            <Text style={styles.profileCompany}>{company}</Text>
            <Text style={styles.profileContact}>
              {email} • {phone}
            </Text>

            {hasVerifiedCitizenId ? (
              <TouchableOpacity
                style={styles.verifyBadge}
                onPress={handleVerifyDocuments}
              >
                <MaterialCommunityIcons
                  name="shield-check"
                  size={16}
                  color="#047857"
                />
                <Text style={styles.verifyText}>Đã xác minh CCCD</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={styles.unverifiedBadge}
                onPress={handleVerifyDocuments}
              >
                <MaterialCommunityIcons
                  name="shield-alert"
                  size={16}
                  color="#2563EB"
                />
                <Text style={styles.unverifiedText}>Xác minh CCCD</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 10,
  },
  backgroundImage: {
    width: "100%",
    height: 220,
    justifyContent: "flex-start",
  },
  topOverlay: {
    paddingTop: 44,
    paddingHorizontal: 20,
  },
  topIconContainer: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 12,
  },
  iconButton: {
    padding: 8,
    backgroundColor: "rgba(255,255,255,0.22)",
    borderRadius: 22,
    marginLeft: 8,
  },
  notificationDot: {
    position: "absolute",
    top: 6,
    right: 6,
    width: 10,
    height: 10,
    borderRadius: 6,
    backgroundColor: "#EF4444",
  },
  notificationBadge: {
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

  floatingCardWrapper: {
    alignItems: "center",
    marginTop: -70,
    paddingHorizontal: 16,
  },
  floatingCard: {
    width: "100%",
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    alignItems: "center",
    paddingTop: 56,
    paddingBottom: 20,
    paddingHorizontal: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  avatarWrapper: {
    position: "absolute",
    top: -56,
    alignSelf: "center",
    padding: 6,
    backgroundColor: "#FFFFFF",
    borderRadius: 64,
  },
  avatarImage: {
    width: 112,
    height: 112,
    borderRadius: 56,
  },
  avatarInitialsContainer: {
    width: 112,
    height: 112,
    borderRadius: 56,
    backgroundColor: "#E0E7FF",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#C7D2FE",
  },
  avatarInitialsText: {
    fontSize: 36,
    fontWeight: "800",
    color: "#4F46E5",
  },
  infoContent: {
    alignItems: "center",
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 4,
  },
  profileName: {
    fontSize: 22,
    fontWeight: "800",
    color: "#111827",
  },
  verifiedIcon: {
    width: 16,
    height: 16,
    backgroundColor: "#10B981",
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 8,
  },
  profileCompany: {
    fontSize: 16,
    color: "#374151",
    marginBottom: 2,
    textAlign: "center",
  },
  profileContact: {
    fontSize: 14,
    color: "#6B7280",
    marginBottom: 12,
    textAlign: "center",
  },
  verifyBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#D1FAE5",
    borderWidth: 1,
    borderColor: "#34D399",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 22,
    gap: 6,
  },
  verifyText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#047857",
  },
  unverifiedBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#EEF2FF",
    borderWidth: 1,
    borderColor: "#BFDBFE",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 22,
    gap: 6,
  },
  unverifiedText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#2563EB",
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

export default HeaderProvider;
