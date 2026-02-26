import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, Image } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { colors, spacing, fontSize, fontWeight } from "../utils/theme";
import { useAuthStore } from "../store/auth.store";
import { TextLogoLight } from "../assets/logo";

interface GlobalHeaderProps {
  notificationCount?: number;
}

export function GlobalHeader({ notificationCount = 0 }: GlobalHeaderProps) {
  const { user } = useAuthStore();

  return (
    <View style={styles.container}>
      {/* Logo */}
      <View style={styles.logoContainer}>
        <Image
          source={TextLogoLight}
          style={styles.logoImage}
          resizeMode="contain"
        />
      </View>

      {/* Right actions */}
      <View style={styles.actionsContainer}>
        {/* Sparks */}
        <TouchableOpacity
          style={styles.sparksButton}
          onPress={() => router.push("/sparks" as any)}
          activeOpacity={0.8}
        >
          <Ionicons name="flash" size={16} color="#FFD700" />
          <Text style={styles.sparksText}>{user?.sparks ?? 0}</Text>
        </TouchableOpacity>

        {/* Notifications bell */}
        <TouchableOpacity
          style={styles.iconButton}
          onPress={() => router.push("/notifications")}
        >
          <Ionicons
            name="notifications-outline"
            size={24}
            color={colors.text}
          />
          {notificationCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>
                {notificationCount > 9 ? "9+" : notificationCount}
              </Text>
            </View>
          )}
        </TouchableOpacity>

        {/* Settings gear */}
        <TouchableOpacity
          style={styles.iconButton}
          onPress={() => router.push("/settings")}
        >
          <Ionicons name="settings-outline" size={24} color={colors.text} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.backgroundCard,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  logoContainer: {
    flex: 1,
  },
  logoImage: {
    height: 28,
    width: 100,
  },
  actionsContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  sparksButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(255,215,0,0.15)",
    borderRadius: 12,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: "rgba(255,215,0,0.3)",
  },
  sparksText: {
    color: "#FFD700",
    fontSize: fontSize.sm,
    fontFamily: "Inter_700Bold",
  },
  iconButton: {
    position: "relative",
    padding: spacing.xs,
  },
  badge: {
    position: "absolute",
    top: 0,
    right: 0,
    backgroundColor: colors.error,
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
  },
  badgeText: {
    color: "white",
    fontSize: 10,
    fontFamily: "Inter_700Bold",
  },
});
