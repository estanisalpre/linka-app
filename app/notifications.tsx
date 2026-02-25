import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { api } from "../src/services/api";
import {
  colors,
  fontSize,
  fontWeight,
  spacing,
  borderRadius,
} from "../src/utils/theme";

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  createdAt: string;
  isRead: boolean;
  data?: any;
}

export default function NotificationsScreen() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    try {
      // TODO: Implement backend endpoint
      // const response = await api.get('/notifications');
      // setNotifications(response.data);

      // No mock data - start empty
      setNotifications([]);
    } catch (error) {
      console.error("Error loading notifications:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadNotifications();
    setRefreshing(false);
  };

  const handleNotificationPress = async (notification: Notification) => {
    // Mark as read
    // await api.patch(`/notifications/${notification.id}/read`);

    // Navigate based on type
    if (notification.type === "CONNECTION_ACCEPTED") {
      router.push(`/nucleus/${notification.data?.connectionId}`);
    } else if (notification.type === "NEW_MESSAGE") {
      router.push(`/nucleus/${notification.data?.connectionId}`);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "CONNECTION_ACCEPTED":
        return "checkmark-circle";
      case "CONNECTION_REQUEST":
        return "person-add";
      case "NEW_MESSAGE":
        return "chatbubble";
      case "PROGRESS_UPDATE":
        return "trending-up";
      default:
        return "information-circle";
    }
  };

  const getIconColor = (type: string) => {
    switch (type) {
      case "CONNECTION_ACCEPTED":
        return colors.success;
      case "CONNECTION_REQUEST":
        return colors.primary;
      case "NEW_MESSAGE":
        return colors.accent;
      default:
        return colors.textSecondary;
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Notificaciones</Text>
          <View style={{ width: 32 }} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notificaciones</Text>
        <View style={{ width: 32 }} />
      </View>

      {/* Content */}
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {notifications.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons
              name="notifications-off-outline"
              size={64}
              color={colors.textMuted}
            />
            <Text style={styles.emptyTitle}>No tienes notificaciones</Text>
            <Text style={styles.emptyDescription}>
              Te avisaremos cuando haya nuevas conexiones o mensajes
            </Text>
          </View>
        ) : (
          notifications.map((notification) => (
            <TouchableOpacity
              key={notification.id}
              style={[styles.card, !notification.isRead && styles.unreadCard]}
              onPress={() => handleNotificationPress(notification)}
            >
              <View
                style={[
                  styles.iconContainer,
                  { backgroundColor: getIconColor(notification.type) + "20" },
                ]}
              >
                <Ionicons
                  name={getIcon(notification.type) as any}
                  size={24}
                  color={getIconColor(notification.type)}
                />
              </View>
              <View style={styles.cardContent}>
                <Text style={styles.cardTitle}>{notification.title}</Text>
                <Text style={styles.cardMessage}>{notification.message}</Text>
                <Text style={styles.cardTime}>
                  {new Date(notification.createdAt).toLocaleTimeString(
                    "es-ES",
                    {
                      hour: "2-digit",
                      minute: "2-digit",
                    },
                  )}
                </Text>
              </View>
              {!notification.isRead && <View style={styles.unreadDot} />}
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: spacing.lg,
    backgroundColor: colors.backgroundCard,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    padding: spacing.xs,
  },
  headerTitle: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.text,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: spacing.md,
  },
  card: {
    flexDirection: "row",
    backgroundColor: colors.backgroundCard,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    alignItems: "center",
    gap: spacing.md,
  },
  unreadCard: {
    backgroundColor: colors.primaryLight + "10",
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  cardContent: {
    flex: 1,
    gap: spacing.xs,
  },
  cardTitle: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: colors.text,
  },
  cardMessage: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  cardTime: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
  },
  unreadDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.primary,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.xxxl,
    gap: spacing.md,
  },
  emptyTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.text,
  },
  emptyDescription: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    textAlign: "center",
    paddingHorizontal: spacing.xl,
  },
});
