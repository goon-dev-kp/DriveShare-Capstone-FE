import React from "react";
import { Tabs, usePathname } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Colors } from "../../constants/Colors";
import type { BottomTabNavigationOptions } from "@react-navigation/bottom-tabs";
import type { RouteProp } from "@react-navigation/native";

// Những route mà ta muốn ẨN tab bar (ví dụ trang chi tiết, chỉnh sửa...)
const hideTabBarForRoutes = [
  "/(provider)/item-detail",
  "/(provider)/package-detail",
  "/(provider)/post-package-detail",
  // Thêm route khác nếu cần
];

export default function ProviderLayout() {
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const display = hideTabBarForRoutes.some((r) => pathname.startsWith(r))
    ? "none"
    : "flex";

  return (
    <Tabs
      screenOptions={({
        route,
      }: {
        route: RouteProp<Record<string, object | undefined>, string>;
      }): BottomTabNavigationOptions => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: React.ComponentProps<typeof Ionicons>["name"] =
            "grid-outline";

          switch (route.name) {
            case "home":
              iconName = focused ? "home" : "home-outline";
              break;
            case "profile":
              iconName = focused ? "person-circle" : "person-circle-outline";
              break;
            default:
              iconName = "grid-outline";
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.grey,
        headerShown: false,
        tabBarStyle: { 
          height: 60 + (insets.bottom || 0), 
          paddingBottom: 5 + (insets.bottom || 0), 
          paddingTop: 5, 
          display 
        },
        tabBarLabelStyle: { fontSize: 12, fontWeight: "600" },
      })}
    >
      {/* Chỉ hiển thị 2 tab */}
      <Tabs.Screen name="home" options={{ title: "Trang chủ" }} />
      <Tabs.Screen name="profile" options={{ title: "Hồ sơ" }} />

      {/* Ẩn các màn hình khỏi tab bar */}
      <Tabs.Screen name="items" options={{ href: null }} />
      <Tabs.Screen name="packages" options={{ href: null }} />
      <Tabs.Screen name="posts" options={{ href: null }} />
      <Tabs.Screen name="trip-detail" options={{ href: null }} />
    </Tabs>
  );
}
