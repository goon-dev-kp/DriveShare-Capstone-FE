// // Tên file: app/(driver)/_layout.tsx

// import React from 'react';
// import { Tabs, usePathname } from 'expo-router';
// import { Ionicons } from '@expo/vector-icons';
// import { Colors } from '../../constants/Colors';
// import type { BottomTabNavigationOptions } from '@react-navigation/bottom-tabs';
// import type { RouteProp } from '@react-navigation/native';

// // Danh sách các trang sẽ ẨN tab bar (khi đang ở trang đó)
// const hideTabBarForRoutes = [
//   '/(driver)/vehicle-detail',
//   '/(driver)/package-detail',
//   '/(driver)/payment',
//   '/(driver)/create-trip',
//   '/(driver)/active-trip',
//   '/(driver)/verification',
//   '/(driver)/vehicle-booking-detail',
//   // --- THÊM CÁC ROUTE MỚI CẦN ẨN ---
//   '/(driver)/findPackages', // Thêm tên file "rác"
//   '/(driver)/post-vehicle', // Thêm tên file "rác"
// ];

import React from "react";
import { Tabs, usePathname } from "expo-router";
import { Ionicons, FontAwesome5 } from "@expo/vector-icons";
import { Platform, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const COLORS = {
  primary: "#10439F",
  inactive: "#94A3B8",
  background: "#FFFFFF",
};

const hideTabBarForRoutes = [
  "/(driver)/vehicle-detail",
  "/(driver)/package-detail",
  "/(driver)/trip-detail",
];

export default function DriverLayout() {
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
        tabBarStyle: {
          display: isTabBarHidden ? "none" : "flex",
          backgroundColor: COLORS.background,
          height: Platform.OS === "ios" ? 90 : 70 + insets.bottom,
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

          switch (route.name) {
            case "home":
              iconName = focused ? "home" : "home-outline";
              break;
            case "profile":
              IconComponent = FontAwesome5;
              iconName = focused ? "user-alt" : "user";
              return (
                <View style={styles.iconContainer}>
                  {focused && <View style={styles.activeIndicator} />}
                  <FontAwesome5 name={iconName} size={20} color={color} />
                </View>
              );
          }

          return (
            <View style={styles.iconContainer}>
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
      <Tabs.Screen name="my-trips" options={{ href: null }} />
      <Tabs.Screen name="my-trips-list" options={{ href: null }} />
      <Tabs.Screen name="post-trips" options={{ href: null }} />
      <Tabs.Screen name="my-team" options={{ href: null }} />
      <Tabs.Screen name="activity-logs" options={{ href: null }} />
      <Tabs.Screen name="trip" options={{ href: null }} />
      <Tabs.Screen name="trip-post" options={{ href: null }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  iconContainer: {
    alignItems: "center",
    justifyContent: "center",
    height: "100%",
  },
  activeIndicator: {
    position: "absolute",
    top: -12,
    width: 40,
    height: 3,
    backgroundColor: "#10439F",
    borderBottomLeftRadius: 4,
    borderBottomRightRadius: 4,
  },
});
