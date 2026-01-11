import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useAuth } from '@/hooks/useAuth';
// import { useNotification } from '@/hooks/useNotification';

export default function RootLayout() {
  const { restoreSession } = useAuth();
  
  // Đăng ký notification và auto-refresh tại root level (chỉ 1 instance duy nhất)
  // useNotification(true);

  useEffect(() => {
    // Khi app mở lại, tự khôi phục session từ AsyncStorage
    restoreSession();
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar style="auto" />
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="(driver)" />
          <Stack.Screen name="(owner)" />
          <Stack.Screen name="(provider)" />
          <Stack.Screen name="(wallet)" />
        </Stack>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
