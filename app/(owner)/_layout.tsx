import React from "react";
import { Tabs, usePathname } from "expo-router";
import {
  Ionicons,
  MaterialCommunityIcons,
  FontAwesome5,
} from "@expo/vector-icons";
import { Platform, StyleSheet, View, Text } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// Màu sắc chủ đạo
const COLORS = {
  primary: "#10439F", // Xanh đậm (Active)
  inactive: "#94A3B8", // Xám (Inactive)
  background: "#FFFFFF",
};

// Các route owner mà ta muốn ẩn hoàn toàn tab bar (ví dụ màn hình chi tiết)
const hideTabBarForRoutes = [
  "/(owner)/vehicle-booking-detail",
  "/(owner)/edit-vehicle",
  "/(owner)/create-post",
];

export default function OwnerLayout() {
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const isTabBarHidden = hideTabBarForRoutes.some((r) =>
    pathname.startsWith(r)
  );

  return (
    <Tabs
      screenOptions={({ route }: { route: { name: string } }) => ({
        headerShown: false,
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.inactive,

        // --- STYLE TAB BAR ---
        tabBarStyle: {
          display: isTabBarHidden ? "none" : "flex",
          backgroundColor: COLORS.background,
          height: Platform.OS === "ios" ? 90 : 70 + insets.bottom, // Chiều cao thanh tab
          paddingBottom: Platform.OS === "ios" ? 30 : 12 + insets.bottom,
          paddingTop: 12,
          borderTopWidth: 1,
          borderTopColor: "#F1F5F9",
          elevation: 8,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.05,
          shadowRadius: 4,
        },

        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: "600",
          marginTop: 4,
        },

        // --- RENDER ICON VÀ VẠCH KẺ ---
        tabBarIcon: ({
          focused,
          color,
          size,
        }: {
          focused: boolean;
          color: string;
          size: number;
        }) => {
          let IconComponent: any = Ionicons;
          let iconName: any = "grid-outline";
          const iconSize = 24;

          // Chọn Icon dựa trên route
          switch (route.name) {
            case "home": // Trang chủ
              iconName = focused ? "home" : "home-outline";
              break;

            case "profile": // Hồ sơ
              IconComponent = FontAwesome5;
              iconName = focused ? "user-alt" : "user";
              // Điều chỉnh size riêng cho FontAwesome vì nó thường to hơn
              return (
                <View
                  style={{
                    alignItems: "center",
                    justifyContent: "center",
                    height: "100%",
                  }}
                >
                  {/* Vạch kẻ xanh trên đầu khi Active */}
                  {focused && <View style={styles.activeIndicator} />}
                  <FontAwesome5 name={iconName} size={20} color={color} />
                </View>
              );
          }

          return (
            <View
              style={{
                alignItems: "center",
                justifyContent: "center",
                height: "100%",
              }}
            >
              {/* Vạch kẻ xanh trên đầu khi Active */}
              {focused && <View style={styles.activeIndicator} />}

              <IconComponent name={iconName} size={iconSize} color={color} />
            </View>
          );
        },
      })}
    >
      <Tabs.Screen name="home" options={{ title: "Trang chủ" }} />
      <Tabs.Screen name="profile" options={{ title: "Hồ sơ" }} />

      {/* Ẩn các màn hình khác */}
      <Tabs.Screen name="owner-v2" options={{ href: null }} />
      <Tabs.Screen name="owner-v2/post-detail/[id]" options={{ href: null }} />
      <Tabs.Screen name="my-drivers" options={{ href: null }} />
      <Tabs.Screen name="driver-detail" options={{ href: null }} />
      <Tabs.Screen name="vehicle-detail" options={{ href: null }} />
      <Tabs.Screen name="trips" options={{ href: null }} />
      <Tabs.Screen name="vehicles" options={{ href: null }} />
      <Tabs.Screen name="trip" options={{ href: null }} />
      <Tabs.Screen name="trip-post" options={{ href: null }} />
      <Tabs.Screen name="trip-posts" options={{ href: null }} />
      <Tabs.Screen name="provider-posts" options={{ href: null }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  // Vạch kẻ xanh chỉ hiện khi tab Active
  activeIndicator: {
    position: "absolute",
    top: -12, // Đẩy lên sát mép trên của Tab Bar
    width: 40, // Chiều rộng vạch kẻ
    height: 3, // Độ dày vạch
    backgroundColor: "#10439F", // Màu xanh chủ đạo
    borderBottomLeftRadius: 4,
    borderBottomRightRadius: 4,
  },
});
