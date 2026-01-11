// components/Icon.tsx - small helper for app icons
import React from 'react';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/Colors';

export default function OwnerLayout() {
  return (
    <Tabs
      screenOptions={({ route }: { route: { name: string } }) => ({
        tabBarIcon: ({ focused, color, size }: { focused: boolean; color: string; size: number }) => {
          let iconName: React.ComponentProps<typeof Ionicons>['name'] = 'alert-circle-outline';

          if (route.name === 'home') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'vehicles') {
            iconName = focused ? 'car-sport' : 'car-sport-outline';
          } else if (route.name === 'posts') {
            iconName = focused ? 'newspaper' : 'newspaper-outline';
          } else if (route.name === 'profile') {
            iconName = focused ? 'person-circle' : 'person-circle-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.grey,
        headerShown: false,
        tabBarStyle: { height: 60, paddingBottom: 5, paddingTop: 5 },
        tabBarLabelStyle: {
            fontSize: 12,
            fontWeight: '600'
        }
      })}
    >
<Tabs.Screen name="home" options={{ title: 'Bảng tin' }} />
<Tabs.Screen name="vehicles" options={{ title: 'Xe của tôi' }} />
<Tabs.Screen name="posts" options={{ title: 'Bài đăng' }} />
<Tabs.Screen name="profile" options={{ title: 'Hồ sơ' }} />
</Tabs>
  );
}
