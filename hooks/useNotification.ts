import { useEffect, useState, useCallback, useRef } from "react";
import { Platform } from "react-native";
import notificationService from "@/services/notificationService";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import Constants from "expo-constants";
import { useNotificationStore } from "@/stores/notificationStore";

// Cấu hình hiển thị notification khi app đang mở (Foreground)
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true, // Hiện alert đè lên màn hình
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export const useNotification = (autoRefresh: boolean = false) => {
  const { unreadCount, setUnreadCount } = useNotificationStore();
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null);
  const notificationListener = useRef<Notifications.Subscription | undefined>(
    undefined
  );
  const responseListener = useRef<Notifications.Subscription | undefined>(
    undefined
  );

  // Đăng ký Push Token (Best Practice từ Expo docs)
  const registerForPushNotificationsAsync = async () => {
    let token: string | null = null;

    // Check thiết bị thật (không phải simulator/emulator)
    if (!Device.isDevice) {
      console.warn("⚠️ Push notifications chỉ hoạt động trên thiết bị thật!");
      return null;
    }

    // Check và xin quyền thông báo
    const { ios, android } = await Notifications.getPermissionsAsync();

    // Check if already granted
    const isGranted =
      Platform.OS === "ios"
        ? ios?.status === Notifications.IosAuthorizationStatus.AUTHORIZED
        : android?.importance !== undefined && android.importance > 0;

    if (!isGranted) {
      // Request permissions
      const { ios: newIos, android: newAndroid } =
        await Notifications.requestPermissionsAsync();

      const newlyGranted =
        Platform.OS === "ios"
          ? newIos?.status === Notifications.IosAuthorizationStatus.AUTHORIZED
          : newAndroid?.importance !== undefined && newAndroid.importance > 0;

      if (!newlyGranted) {
        console.warn("❌ User từ chối quyền thông báo!");
        return null;
      }
    }

    // Lấy Expo Push Token
    const projectId =
      Constants?.expoConfig?.extra?.eas?.projectId ??
      Constants?.easConfig?.projectId;
    if (!projectId) {
      console.error("❌ Thiếu projectId trong app.json!");
      return null;
    }

    token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
    console.log("✅ Expo Push Token:", token);

    // Android: Setup notification channel
    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("default", {
        name: "default",
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: "#3B82F6",
      });
    }

    return token;
  };

  // Đăng ký token với backend
  const registerToken = useCallback(async () => {
    try {
      const token = await registerForPushNotificationsAsync();
      if (token) {
        setExpoPushToken(token);
        const platform =
          Platform.OS === "web"
            ? "web"
            : Platform.OS === "ios"
            ? "ios"
            : "android";
        await notificationService.registerDeviceToken(token, platform);
        console.log("✅ Token registered successfully");
      }
    } catch (error) {
      console.error("❌ Error registering token:", error);
    }
  }, []);

  // Lấy số lượng thông báo chưa đọc
  const fetchUnreadCount = useCallback(async () => {
    try {
      const count = await notificationService.getUnreadCount();
      console.log('📊 Unread count:', count);
      setUnreadCount(count);
    } catch (error: any) {
      // Ignore 401/403 errors (user logged out or token invalid)
      if (error?.response?.status === 401 || error?.response?.status === 403) {
        setUnreadCount(0);
        return;
      }
      console.error("Error fetching unread count:", error);
      setUnreadCount(0);
    }
  }, []);

  // Refresh unread count
  const refreshUnreadCount = useCallback(() => {
    fetchUnreadCount();
  }, [fetchUnreadCount]);

  // Setup listeners
  useEffect(() => {
    // 1. Đăng ký token khi component mount
    registerToken();

    // 2. Fetch unread count ban đầu
    fetchUnreadCount();

    // 3. Auto-refresh unread count mỗi 30 giây (chỉ khi autoRefresh = true)
    let intervalId: NodeJS.Timeout | undefined;
    if (autoRefresh) {
      intervalId = setInterval(() => {
        fetchUnreadCount();
      }, 30000); // 30 seconds
    }

    // 4. Listener: Khi nhận notification (App đang mở - Foreground)
    notificationListener.current =
      Notifications.addNotificationReceivedListener((notification) => {
        console.log(
          "📬 [Foreground] Nhận thông báo:",
          notification.request.content
        );

        // Refresh unread count ngay lập tức
        fetchUnreadCount();

        // Có thể hiển thị custom toast/alert ở đây nếu muốn
      });

    // 4. Listener: Khi user BẤM vào notification (Background/Killed)
    responseListener.current =
      Notifications.addNotificationResponseReceivedListener((response) => {
        console.log("👆 [Tapped] User bấm vào thông báo");

        const data = response.notification.request.content.data;
        console.log("📦 Data:", data);

        // TODO: Điều hướng dựa vào data
        // if (data?.postId) router.push('/post-detail/' + data.postId)
        // if (data?.tripId) router.push('/trip-detail/' + data.tripId)

        // Refresh unread count
        fetchUnreadCount();
      });

    // Cleanup listeners khi unmount
    return () => {
      if (intervalId) clearInterval(intervalId);
      if (notificationListener.current) {
        notificationListener.current.remove();
      }
      if (responseListener.current) {
        responseListener.current.remove();
      }
    };
  }, [registerToken, fetchUnreadCount, autoRefresh]);

  return {
    unreadCount,
    expoPushToken,
    refreshUnreadCount,
    registerToken,
  };
};
