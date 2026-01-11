import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Image,
  TouchableOpacity,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import userService, { BaseProfileDTO } from "@/services/userService";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";

export default function ProviderProfileScreen() {
  const router = useRouter();
  const [profile, setProfile] = useState<BaseProfileDTO | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const response = await userService.getMyProfile();
      console.log("Profile response:", response);

      // API trả về {isSuccess: true, result: {...}}
      if (response?.isSuccess && response?.result) {
        setProfile(response.result);
      } else if (response?.succeeded && response?.data) {
        setProfile(response.data);
      } else if (response?.result) {
        setProfile(response.result);
      } else if (response?.data) {
        setProfile(response.data);
      }
    } catch (error) {
      console.error("Error loading profile:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView edges={['top', 'left', 'right']} style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color="#4F46E5" />
        <Text style={styles.loadingText}>Đang tải...</Text>
      </SafeAreaView>
    );
  }

  if (!profile) {
    return (
      <SafeAreaView edges={['top', 'left', 'right']} style={[styles.container, styles.centerContent]}>
        <Text style={styles.errorText}>Không thể tải thông tin hồ sơ</Text>
      </SafeAreaView>
    );
  }

  return (
    
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.avatarContainer}>
          {profile.avatarUrl ? (
            <Image source={{ uri: profile.avatarUrl }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarText}>
                {profile.fullName?.charAt(0) || "U"}
              </Text>
            </View>
          )}
        </View>
        <Text style={styles.name}>{profile.fullName}</Text>
        <Text style={styles.role}>NHÀ CUNG CẤP</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Thông tin cá nhân</Text>

          <View style={styles.infoRow}>
            <Ionicons name="mail-outline" size={20} color="#6B7280" />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Email</Text>
              <Text style={styles.infoValue}>{profile.email}</Text>
            </View>
            {profile.isEmailVerified && (
              <Ionicons name="checkmark-circle" size={20} color="#10B981" />
            )}
          </View>

          <View style={styles.infoRow}>
            <Ionicons name="call-outline" size={20} color="#6B7280" />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Số điện thoại</Text>
              <Text style={styles.infoValue}>{profile.phoneNumber}</Text>
            </View>
            {profile.isPhoneVerified && (
              <Ionicons name="checkmark-circle" size={20} color="#10B981" />
            )}
          </View>

          {profile.dateOfBirth && (
            <View style={styles.infoRow}>
              <Ionicons name="calendar-outline" size={20} color="#6B7280" />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Ngày sinh</Text>
                <Text style={styles.infoValue}>
                  {new Date(profile.dateOfBirth).toLocaleDateString("vi-VN")}
                </Text>
              </View>
            </View>
          )}

          {profile.address && (
            <View style={styles.infoRow}>
              <Ionicons name="location-outline" size={20} color="#6B7280" />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Địa chỉ</Text>
                <Text style={styles.infoValue}>
                  {typeof profile.address === 'string'
                    ? profile.address
                    : (profile.address as { address?: string })?.address ?? 'N/A'}
                </Text>
              </View>
            </View>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Xác thực</Text>

          <View style={styles.verificationRow}>
            <Ionicons
              name={
                profile.hasVerifiedCitizenId
                  ? "shield-checkmark"
                  : "shield-outline"
              }
              size={20}
              color={profile.hasVerifiedCitizenId ? "#10B981" : "#EF4444"}
            />
            <Text style={styles.verificationText}>
              {profile.hasVerifiedCitizenId
                ? "Đã xác minh CCCD"
                : "Chưa xác minh CCCD"}
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Trạng thái tài khoản</Text>
          <View
            style={[
              styles.statusBadge,
              profile.status === "Active"
                ? styles.statusActive
                : styles.statusInactive,
            ]}
          >
            <Text style={styles.statusText}>
              {profile.status === "Active" ? "Đang hoạt động" : profile.status}
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Giấy tờ</Text>
          <TouchableOpacity
            style={[styles.infoRow, styles.linkRow]}
            onPress={() => router.push("/provider-v2/my-documents" as any)}
          >
            <Ionicons name="document-text-outline" size={20} color="#6B7280" />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Tài liệu</Text>
              <Text style={styles.infoValue}>Giấy tờ của tôi</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F9FA",
  },
  centerContent: {
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#6B7280",
  },
  errorText: {
    fontSize: 16,
    color: "#EF4444",
  },
  header: {
    backgroundColor: "#FFFFFF",
    paddingTop: 40,
    paddingBottom: 24,
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  avatarContainer: {
    marginBottom: 16,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: "#4F46E5",
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#E0E7FF",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: "#4F46E5",
  },
  avatarText: {
    fontSize: 40,
    fontWeight: "bold",
    color: "#4F46E5",
  },
  name: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#1F2937",
    marginBottom: 4,
  },
  role: {
    fontSize: 16,
    color: "#6B7280",
  },
  content: {
    padding: 16,
  },
  section: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1F2937",
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  linkRow: {
    borderBottomWidth: 0,
  },
  infoContent: {
    flex: 1,
    marginLeft: 12,
  },
  infoLabel: {
    fontSize: 12,
    color: "#9CA3AF",
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 16,
    color: "#1F2937",
    fontWeight: "500",
  },
  verificationRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
  },
  verificationText: {
    marginLeft: 12,
    fontSize: 16,
    color: "#1F2937",
  },
  statusBadge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    alignSelf: "flex-start",
  },
  statusActive: {
    backgroundColor: "#D1FAE5",
  },
  statusInactive: {
    backgroundColor: "#FEE2E2",
  },
  statusText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1F2937",
  },
});
