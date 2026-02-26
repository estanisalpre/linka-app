import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import { Platform } from "react-native";
import { router } from "expo-router";
import { api } from "./api";

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export class NotificationService {
  private static pushToken: string | null = null;
  private static notificationListener: Notifications.Subscription | null = null;
  private static responseListener: Notifications.Subscription | null = null;

  /**
   * Request notification permissions and register push token
   */
  static async initialize(): Promise<string | null> {
    if (!Device.isDevice) {
      console.warn(
        "[Notifications] Must use physical device for push notifications",
      );
      return null;
    }

    try {
      // Request permissions
      const { status: existingStatus } =
        await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== "granted") {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== "granted") {
        console.warn("[Notifications] Permission not granted");
        return null;
      }

      // Get push token
      const tokenData = await Notifications.getExpoPushTokenAsync({
        projectId: process.env.EXPO_PROJECT_ID || "your-expo-project-id",
      });

      this.pushToken = tokenData.data;
      console.log("[Notifications] ✅ Push token obtained:", this.pushToken);

      // Register token with backend
      await this.registerToken(this.pushToken);

      // Set up notification channel for Android
      if (Platform.OS === "android") {
        await Notifications.setNotificationChannelAsync("default", {
          name: "default",
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: "#8B5CF6",
        });
      }

      // Set up listeners
      this.setupListeners();

      return this.pushToken;
    } catch (error) {
      console.error("[Notifications] ❌ Error initializing:", error);
      return null;
    }
  }

  /**
   * Register push token with backend
   */
  static async registerToken(token: string): Promise<void> {
    try {
      await api.post("/users/push-token", { pushToken: token });
      console.log("[Notifications] ✅ Token registered with backend");
    } catch (error) {
      console.error("[Notifications] ❌ Error registering token:", error);
    }
  }

  /**
   * Remove push token from backend (on logout)
   */
  static async unregisterToken(): Promise<void> {
    try {
      await api.delete("/users/push-token");
      this.pushToken = null;
      console.log("[Notifications] ✅ Token removed from backend");
    } catch (error) {
      console.error("[Notifications] ❌ Error removing token:", error);
    }
  }

  /**
   * Toggle notifications on/off
   */
  static async toggleNotifications(enabled: boolean): Promise<void> {
    try {
      await api.post("/users/notifications/toggle", { enabled });
      console.log(
        `[Notifications] ✅ Notifications ${enabled ? "enabled" : "disabled"}`,
      );
    } catch (error) {
      console.error("[Notifications] ❌ Error toggling notifications:", error);
      throw error;
    }
  }

  /**
   * Set up notification listeners
   */
  private static setupListeners(): void {
    // Listener for notifications received while app is foregrounded
    this.notificationListener = Notifications.addNotificationReceivedListener(
      (notification) => {
        console.log("[Notifications] 📬 Received:", notification);

        const data = notification.request.content.data;
        console.log("[Notifications] Data:", data);

        // You can handle foreground notifications here if needed
        // For example, show an in-app banner or update a badge
      },
    );

    // Listener for when user taps on notification
    this.responseListener =
      Notifications.addNotificationResponseReceivedListener((response) => {
        console.log("[Notifications] 👆 Tapped:", response);

        const data = response.notification.request.content.data;
        this.handleNotificationTap(data);
      });
  }

  /**
   * Handle notification tap - navigate to appropriate screen
   */
  private static handleNotificationTap(data: any): void {
    const { type, screen, connectionId, tab } = data;

    try {
      if (screen === "nucleus" && connectionId) {
        // Navigate to nucleus screen
        router.push(`/nucleus/${connectionId}`);
      } else if (screen === "connections") {
        // Navigate to connections with specific tab
        router.push({
          pathname: "/(tabs)/connections",
          params: tab ? { tab } : undefined,
        });
      } else if (screen === "chat" && connectionId) {
        // Navigate to chat in nucleus
        router.push(`/nucleus/${connectionId}`);
      } else {
        // Default: go to connections
        router.push("/(tabs)/connections");
      }
    } catch (error) {
      console.error("[Notifications] ❌ Error handling tap:", error);
    }
  }

  /**
   * Cleanup listeners
   */
  static cleanup(): void {
    if (this.notificationListener) {
      Notifications.removeNotificationSubscription(this.notificationListener);
    }
    if (this.responseListener) {
      Notifications.removeNotificationSubscription(this.responseListener);
    }
  }

  /**
   * Get current push token
   */
  static getToken(): string | null {
    return this.pushToken;
  }

  /**
   * Check if notifications are enabled
   */
  static async getPermissionStatus(): Promise<boolean> {
    const { status } = await Notifications.getPermissionsAsync();
    return status === "granted";
  }

  /**
   * Manually schedule a local notification (for testing)
   */
  static async scheduleTestNotification(): Promise<void> {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: "Test Notification 📬",
        body: "This is a test notification from Nuclia",
        data: { test: true },
      },
      trigger: { type: "timeInterval" as any, seconds: 2 },
    });
  }

  /**
   * Clear all notifications
   */
  static async clearAllNotifications(): Promise<void> {
    await Notifications.dismissAllNotificationsAsync();
  }

  /**
   * Get badge count
   */
  static async getBadgeCount(): Promise<number> {
    return await Notifications.getBadgeCountAsync();
  }

  /**
   * Set badge count
   */
  static async setBadgeCount(count: number): Promise<void> {
    await Notifications.setBadgeCountAsync(count);
  }
}
