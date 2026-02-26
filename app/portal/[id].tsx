import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { userApi } from "../../src/services/api";
import { useConnectionStore } from "../../src/store/connection.store";
import { useAuthStore } from "../../src/store/auth.store";
import { Modal, GlobalHeader } from "../../src/components";
import {
  colors,
  fontSize,
  fontWeight,
  spacing,
  borderRadius,
} from "../../src/utils/theme";

interface PortalUser {
  id: string;
  name: string;
  bio?: string;
  photos: string[];
  location?: string;
  birthDate: string;
  heat: number; // 0-100, based on activity
  lastActive: Date;
}

const PORTAL_INFO: Record<
  string,
  { title: string; color: string; icon: string }
> = {
  honesty: {
    title: "Conversaciones honestas",
    color: "#E91E63",
    icon: "heart-outline",
  },
  slow: {
    title: "Construir algo lento",
    color: "#9C27B0",
    icon: "time-outline",
  },
  curious: {
    title: "Curiosos sin prisa",
    color: "#2196F3",
    icon: "sparkles-outline",
  },
  deep: {
    title: "Conexiones profundas",
    color: "#00BCD4",
    icon: "water-outline",
  },
  adventure: {
    title: "Espíritus aventureros",
    color: "#FF9800",
    icon: "compass-outline",
  },
  creative: {
    title: "Mentes creativas",
    color: "#4CAF50",
    icon: "color-palette-outline",
  },
};

// Calculate age from birthDate
const calculateAge = (birthDate: string): number => {
  const today = new Date();
  const birth = new Date(birthDate);
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
};

// Get heat color based on activity level (0-100)
const getHeatColor = (heat: number): string => {
  if (heat >= 80) return "#FF1744"; // Very hot - bright red
  if (heat >= 60) return "#FF5722"; // Hot - orange-red
  if (heat >= 40) return "#FF9800"; // Warm - orange
  if (heat >= 20) return "#FFC107"; // Cool - yellow
  return "#9E9E9E"; // Cold - gray
};

// Get heat border width based on activity
const getHeatBorderWidth = (heat: number): number => {
  if (heat >= 80) return 4;
  if (heat >= 60) return 3;
  if (heat >= 40) return 3;
  return 2;
};

export default function PortalScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [users, setUsers] = useState<PortalUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedUser, setSelectedUser] = useState<PortalUser | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [connectedUserName, setConnectedUserName] = useState("");
  const {
    initiateConnection,
    connections,
    isLoading: isConnecting,
  } = useConnectionStore();
  const { user: currentUser } = useAuthStore();

  const portalInfo = PORTAL_INFO[id || "honesty"];

  const loadUsers = async () => {
    try {
      // Pass portal ID to filter users by portal
      const response = await userApi.discover(50, 0, id);
      // Add mock heat values for now (in production, this would come from the backend)
      const usersWithHeat: PortalUser[] = response.data.map(
        (user: any, index: number) => ({
          ...user,
          heat: Math.max(10, 100 - index * 8 + Math.random() * 20), // Simulate activity-based sorting
          lastActive: new Date(
            Date.now() - Math.random() * 72 * 60 * 60 * 1000,
          ), // Random within 72h
        }),
      );
      // Sort by heat (most active first)
      usersWithHeat.sort((a, b) => b.heat - a.heat);
      setUsers(usersWithHeat);
    } catch (error) {
      console.error("Error loading users:", error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    loadUsers();
  };

  const handleCreateConnection = async (user: PortalUser) => {
    const connectionId = await initiateConnection(user.id);
    if (connectionId) {
      // Show success modal instead of navigating
      setConnectedUserName(user.name);
      setShowSuccessModal(true);
      setSelectedUser(null);
    }
  };

  const handleModalClose = () => {
    setShowSuccessModal(false);
    // Navigate to connections tab to see the pending connection
    router.push("/(tabs)/connections");
  };

  const handleUserPress = (user: PortalUser) => {
    setSelectedUser(selectedUser?.id === user.id ? null : user);
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={portalInfo.color} />
          <Text style={styles.loadingText}>Entrando al portal...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Global Header with notifications & settings */}
      <GlobalHeader notificationCount={0} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <View
            style={[
              styles.portalBadge,
              { backgroundColor: portalInfo.color + "20" },
            ]}
          >
            <Ionicons
              name={portalInfo.icon as any}
              size={20}
              color={portalInfo.color}
            />
          </View>
          <View>
            <Text style={styles.headerTitle}>{portalInfo.title}</Text>
            <Text style={styles.headerSubtitle}>
              {users.length} personas aquí
            </Text>
          </View>
        </View>
      </View>

      {/* Heat Legend */}
      <View style={styles.legendContainer}>
        <Text style={styles.legendLabel}>Actividad:</Text>
        <View style={styles.legendItems}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: "#FF1744" }]} />
            <Text style={styles.legendText}>Muy activo</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: "#FF9800" }]} />
            <Text style={styles.legendText}>Activo</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: "#9E9E9E" }]} />
            <Text style={styles.legendText}>Menos activo</Text>
          </View>
        </View>
      </View>

      {/* Users List */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={portalInfo.color}
          />
        }
      >
        {users.map((user, index) => {
          const isSelected = selectedUser?.id === user.id;
          const heatColor = getHeatColor(user.heat);
          const borderWidth = getHeatBorderWidth(user.heat);

          return (
            <TouchableOpacity
              key={user.id}
              style={[styles.userCard, isSelected && styles.userCardSelected]}
              onPress={() => handleUserPress(user)}
              activeOpacity={0.8}
            >
              <View style={styles.userRow}>
                {/* Position indicator */}
                <View style={styles.positionContainer}>
                  <Text style={[styles.positionText, { color: heatColor }]}>
                    {index + 1}
                  </Text>
                </View>

                {/* Photo with heat border */}
                <View
                  style={[
                    styles.photoContainer,
                    {
                      borderColor: heatColor,
                      borderWidth: borderWidth,
                    },
                  ]}
                >
                  <Image
                    source={{
                      uri:
                        user.photos[0] ||
                        `https://ui-avatars.com/api/?background=252540&color=fff&name=${encodeURIComponent(user.name || "U")}`,
                    }}
                    style={styles.photo}
                  />
                  {/* Heat glow effect */}
                  {user.heat >= 60 && (
                    <View
                      style={[styles.heatGlow, { shadowColor: heatColor }]}
                    />
                  )}
                </View>

                {/* User Info */}
                <View style={styles.userInfo}>
                  <View style={styles.nameRow}>
                    <Text style={styles.userName}>{user.name}</Text>
                    <Text style={styles.userAge}>
                      , {calculateAge(user.birthDate)}
                    </Text>
                  </View>
                  {user.location && (
                    <View style={styles.locationRow}>
                      <Ionicons
                        name="location-outline"
                        size={14}
                        color={colors.textMuted}
                      />
                      <Text style={styles.locationText}>{user.location}</Text>
                    </View>
                  )}
                  {user.bio && (
                    <Text
                      style={styles.userBio}
                      numberOfLines={isSelected ? 4 : 1}
                    >
                      {user.bio}
                    </Text>
                  )}
                </View>

                {/* Heat indicator */}
                <View style={styles.heatIndicator}>
                  <View
                    style={[
                      styles.heatBar,
                      {
                        height: `${user.heat}%`,
                        backgroundColor: heatColor,
                      },
                    ]}
                  />
                </View>
              </View>

              {/* Expanded content when selected */}
              {isSelected && (
                <View style={styles.expandedContent}>
                  {/* Additional photos */}
                  {user.photos.length > 1 && (
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      style={styles.photosScroll}
                    >
                      {user.photos.slice(1).map((photo, idx) => (
                        <Image
                          key={idx}
                          source={{ uri: photo }}
                          style={styles.additionalPhoto}
                        />
                      ))}
                    </ScrollView>
                  )}

                  {/* View full profile button */}
                  <TouchableOpacity
                    style={styles.viewProfileButton}
                    onPress={() => router.push(`/user/${user.id}` as any)}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="person" size={16} color={colors.primary} />
                    <Text style={styles.viewProfileText}>
                      Ver perfil completo
                    </Text>
                    <Ionicons
                      name="chevron-forward"
                      size={14}
                      color={colors.primary}
                    />
                  </TouchableOpacity>

                  {/* Create connection button */}
                  {connections.some(
                    (c) => c.otherUser.id === user.id && c.status !== "ENDED",
                  ) ? (
                    <View style={styles.alreadyConnectedBadge}>
                      <Ionicons
                        name="checkmark-circle"
                        size={18}
                        color={colors.success}
                      />
                      <Text style={styles.alreadyConnectedText}>
                        Conexión enviada
                      </Text>
                    </View>
                  ) : (
                    <>
                      <TouchableOpacity
                        style={[
                          styles.connectButton,
                          { backgroundColor: portalInfo.color },
                        ]}
                        onPress={() => handleCreateConnection(user)}
                        disabled={isConnecting}
                      >
                        {isConnecting ? (
                          <ActivityIndicator size="small" color="#FFF" />
                        ) : (
                          <>
                            <Ionicons
                              name="add-circle-outline"
                              size={20}
                              color="#FFF"
                            />
                            <Text style={styles.connectButtonText}>
                              Crear conexión
                            </Text>
                          </>
                        )}
                      </TouchableOpacity>

                      <Text style={styles.connectHint}>
                        Al crear una conexión, comenzarán las misiones para
                        conocerse
                      </Text>
                    </>
                  )}
                </View>
              )}
            </TouchableOpacity>
          );
        })}

        {users.length === 0 && (
          <View style={styles.emptyContainer}>
            <Ionicons
              name="planet-outline"
              size={64}
              color={colors.textMuted}
            />
            <Text style={styles.emptyTitle}>Portal vacío</Text>
            <Text style={styles.emptyText}>
              Aún no hay personas en este portal. ¡Sé el primero!
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Success Modal */}
      <Modal
        visible={showSuccessModal}
        onClose={handleModalClose}
        type="success"
        title="Conexión enviada"
        message={`Tu solicitud ha sido enviada a ${connectedUserName}. Te notificaremos cuando responda.`}
        buttonText="Ver mis conexiones"
        onButtonPress={handleModalClose}
        dismissOnBackdrop={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: spacing.md,
  },
  loadingText: {
    color: colors.textSecondary,
    fontSize: fontSize.md,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.backgroundCard,
    justifyContent: "center",
    alignItems: "center",
    marginRight: spacing.md,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  portalBadge: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.md,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    color: colors.text,
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
  },
  headerSubtitle: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
  },
  legendContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    backgroundColor: colors.backgroundCard,
    gap: spacing.md,
  },
  legendLabel: {
    color: colors.textSecondary,
    fontSize: fontSize.xs,
  },
  legendItems: {
    flexDirection: "row",
    gap: spacing.md,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
    gap: spacing.md,
  },
  userCard: {
    backgroundColor: colors.backgroundCard,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  userCardSelected: {
    borderColor: colors.primary,
  },
  userRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  positionContainer: {
    width: 24,
    alignItems: "center",
  },
  positionText: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
  },
  photoContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    overflow: "hidden",
    position: "relative",
  },
  photo: {
    width: "100%",
    height: "100%",
  },
  heatGlow: {
    position: "absolute",
    top: -2,
    left: -2,
    right: -2,
    bottom: -2,
    borderRadius: 34,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 8,
  },
  userInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "baseline",
  },
  userName: {
    color: colors.text,
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
  },
  userAge: {
    color: colors.textSecondary,
    fontSize: fontSize.md,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    marginTop: 2,
  },
  locationText: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
  },
  userBio: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
    marginTop: spacing.xs,
  },
  heatIndicator: {
    width: 6,
    height: 40,
    backgroundColor: colors.border,
    borderRadius: 3,
    overflow: "hidden",
    justifyContent: "flex-end",
  },
  heatBar: {
    width: "100%",
    borderRadius: 3,
  },
  expandedContent: {
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  photosScroll: {
    marginBottom: spacing.md,
  },
  additionalPhoto: {
    width: 80,
    height: 80,
    borderRadius: borderRadius.md,
    marginRight: spacing.sm,
  },
  viewProfileButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xs,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.primary + "60",
    backgroundColor: colors.primary + "15",
    marginBottom: spacing.sm,
  },
  viewProfileText: {
    color: colors.primary,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
  },
  connectButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
  },
  connectButtonText: {
    color: "#FFF",
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
  },
  connectHint: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
    textAlign: "center",
    marginTop: spacing.sm,
  },
  alreadyConnectedBadge: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    backgroundColor: colors.success + "20",
    borderWidth: 1,
    borderColor: colors.success + "60",
  },
  alreadyConnectedText: {
    color: colors.success,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.xxl,
  },
  emptyTitle: {
    color: colors.text,
    fontSize: fontSize.xl,
    fontWeight: fontWeight.semibold,
    marginTop: spacing.lg,
  },
  emptyText: {
    color: colors.textSecondary,
    fontSize: fontSize.md,
    textAlign: "center",
    marginTop: spacing.sm,
  },
});
