import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { colors, spacing, fontSize, fontWeight } from "../utils/theme";

interface GlobalHeaderProps {
  notificationCount?: number;
}

export function GlobalHeader({ notificationCount = 0 }: GlobalHeaderProps) {
  return (
    <View style={styles.container}>
      {/* Logo - placeholder text for now */}
      <View style={styles.logoContainer}>
        <Text style={styles.logoText}>linka</Text>
      </View>

      {/* Right actions */}
      <View style={styles.actionsContainer}>
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
  logoText: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.primary,
  },
  actionsContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
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
    fontWeight: fontWeight.bold,
  },
});
