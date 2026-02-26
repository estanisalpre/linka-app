import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { View, StyleSheet, Text } from "react-native";
import { useEffect, useState } from "react";
import { colors } from "../../src/utils/theme";
import { api } from "../../src/services/api";
import { getSocket } from "../../src/services/socket";

export default function TabsLayout() {
  const [activeConnectionsCount, setActiveConnectionsCount] = useState(0);

  useEffect(() => {
    loadActiveConnectionsCount();

    // Listen for real-time connection updates
    const socket = getSocket();

    if (!socket) return;

    const handleConnectionUpdate = () => {
      loadActiveConnectionsCount();
    };

    socket.on("CONNECTION_ACCEPTED", handleConnectionUpdate);
    socket.on("CONNECTION_REQUEST", handleConnectionUpdate);
    socket.on("connection-declined", handleConnectionUpdate);

    return () => {
      socket.off("CONNECTION_ACCEPTED", handleConnectionUpdate);
      socket.off("CONNECTION_REQUEST", handleConnectionUpdate);
      socket.off("connection-declined", handleConnectionUpdate);
    };
  }, []);

  const loadActiveConnectionsCount = async () => {
    try {
      const response = await api.get("/connections", {
        params: { status: "ACTIVE" },
      });
      setActiveConnectionsCount(response.data.length || 0);
    } catch (error) {
      console.error("Error loading active connections:", error);
    }
  };

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.backgroundLight,
          borderTopWidth: 0,
          height: 85,
          paddingBottom: 10,
          paddingTop: 10,
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarLabelStyle: {
          fontSize: 12,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Portales",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="planet" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="connections"
        options={{
          title: "Conexiones",
          tabBarIcon: ({ color, size }) => (
            <View style={styles.iconWithBadge}>
              <Ionicons name="infinite" size={size} color={color} />
              {activeConnectionsCount > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>
                    {activeConnectionsCount > 9 ? "9+" : activeConnectionsCount}
                  </Text>
                </View>
              )}
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="connections.old"
        options={{
          title: "Núcleos",
          tabBarIcon: ({ color, size }) => (
            <View style={styles.nucleoIcon}>
              <Ionicons name="git-network" size={size} color={color} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Perfil",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  nucleoIcon: {
    position: "relative",
  },
  iconWithBadge: {
    position: "relative",
    width: 28,
    height: 28,
  },
  badge: {
    position: "absolute",
    top: -6,
    right: -10,
    backgroundColor: "#00FF41", // Neon green
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 4,
    borderWidth: 2,
    borderColor: colors.backgroundLight,
  },
  badgeText: {
    color: "#000",
    fontSize: 10,
    fontWeight: "bold",
  },
});
