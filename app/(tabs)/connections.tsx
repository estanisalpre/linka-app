import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
  Image,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { GlobalHeader } from "../../src/components";
import { api } from "../../src/services/api";
import { getSocket, SocketEvents } from "../../src/services/socket";
import {
  colors,
  fontSize,
  fontWeight,
  spacing,
  borderRadius,
  shadows,
} from "../../src/utils/theme";

type Tab =
  | "active"
  | "whoLikedYou"
  | "whoYouLiked"
  | "rejected"
  | "later"
  | "dissolved";

interface TransparencyData {
  whoLikedYou: any[];
  whoYouLiked: any[];
  activeMatches: any[];
  rejections: any[];
  postponed: any[];
  cooled: any[];
  dissolved: any[];
  stats: {
    totalLikesReceived: number;
    totalLikesSent: number;
    totalActiveMatches: number;
    totalRejections: number;
    totalPostponed: number;
    totalDissolved: number;
  };
}

export default function ConnectionsScreen() {
  const [activeTab, setActiveTab] = useState<Tab>("active");
  const [transparencyData, setTransparencyData] =
    useState<TransparencyData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadTransparencyData();

    // Set up socket listeners
    const socket = getSocket();

    if (socket) {
      // Listen for connection accepted
      socket.on(SocketEvents.CONNECTION_ACCEPTED, (data: any) => {
        console.log("Connection accepted:", data);
        loadTransparencyData();
      });

      // Listen for connection requests (includes LATER and ENDED status)
      socket.on(SocketEvents.CONNECTION_REQUEST, (data: any) => {
        console.log("Connection request status changed:", data);
        loadTransparencyData();
      });

      // Listen for nucleus dissolved (the other person dissolved it)
      socket.on("nucleus:dissolved", (data: any) => {
        console.log("Nucleus dissolved:", data);
        loadTransparencyData();
        setActiveTab("dissolved");
      });

      // Cleanup listeners on unmount
      return () => {
        socket.off(SocketEvents.CONNECTION_ACCEPTED);
        socket.off(SocketEvents.CONNECTION_REQUEST);
        socket.off("nucleus:dissolved");
      };
    }
  }, []);

  const loadTransparencyData = async () => {
    try {
      const response = await api.get("/connections/transparency");
      setTransparencyData(response.data);
    } catch (error) {
      console.error("Error loading transparency data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadTransparencyData();
    setRefreshing(false);
  };

  const handleAccept = async (connectionId: string) => {
    try {
      await api.post(`/connections/${connectionId}/accept`);
      Alert.alert("¡Núcleo creado!", "Ahora pueden comenzar a conocerse");
      loadTransparencyData();
    } catch (error) {
      Alert.alert("Error", "No se pudo aceptar la conexión");
    }
  };

  const handleDecline = async (connectionId: string) => {
    console.log(
      "[DECLINE] Opening decline alert for connection:",
      connectionId,
    );
    Alert.alert("Rechazar conexión", "¿Por qué no estás interesado/a?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "No compartimos intereses",
        onPress: () => processDecline(connectionId, "No compartimos intereses"),
      },
      {
        text: "Perfil incompleto",
        onPress: () => processDecline(connectionId, "Perfil incompleto"),
      },
      {
        text: "Otro motivo",
        onPress: () => processDecline(connectionId, "Otro motivo"),
      },
    ]);
  };

  const processDecline = async (connectionId: string, reason: string) => {
    try {
      console.log("[DECLINE] Sending decline request:", connectionId, reason);
      const response = await api.post(`/connections/${connectionId}/decline`, {
        declineReason: reason,
      });
      console.log("[DECLINE] Success:", response.data);
      loadTransparencyData();
    } catch (error: any) {
      console.error("[DECLINE] Error:", error.response?.data || error.message);
      Alert.alert("Error", "No se pudo rechazar la conexión");
    }
  };

  const handlePostpone = async (connectionId: string) => {
    try {
      await api.post(`/connections/${connectionId}/later`);
      loadTransparencyData();
    } catch (error) {
      Alert.alert("Error", "No se pudo posponer la conexión");
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Cargando conexiones...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const tabs = [
    {
      key: "active" as Tab,
      label: "Activas",
      count: transparencyData?.activeMatches.length || 0,
      icon: "flash",
    },
    {
      key: "whoLikedYou" as Tab,
      label: "Te dieron like",
      count: transparencyData?.whoLikedYou.length || 0,
      icon: "heart",
    },
    {
      key: "whoYouLiked" as Tab,
      label: "Les diste like",
      count: transparencyData?.whoYouLiked.length || 0,
      icon: "time",
    },
    {
      key: "rejected" as Tab,
      label: "Rechazadas",
      count: transparencyData?.rejections.length || 0,
      icon: "close-circle",
    },
    {
      key: "later" as Tab,
      label: "Otro momento",
      count: transparencyData?.postponed.length || 0,
      icon: "calendar",
    },
    {
      key: "dissolved" as Tab,
      label: "Antiguos",
      count: transparencyData?.dissolved?.length || 0,
      icon: "nuclear",
    },
  ];

  const renderActiveMatches = () => {
    if (!transparencyData?.activeMatches.length) {
      return (
        <View style={styles.emptyState}>
          <Ionicons name="flash-outline" size={64} color={colors.textMuted} />
          <Text style={styles.emptyTitle}>No tienes conexiones activas</Text>
          <Text style={styles.emptyDescription}>
            Acepta las solicitudes que te gusten para comenzar
          </Text>
        </View>
      );
    }

    return (
      <>
        {transparencyData.activeMatches.map((match) => (
          <TouchableOpacity
            key={match.connectionId}
            style={styles.card}
            onPress={() => router.push(`/nucleus/${match.connectionId}`)}
          >
            <Image
              source={{
                uri:
                  match.user.photos[0] ||
                  "https://ui-avatars.com/api/?name=User",
              }}
              style={styles.cardPhoto}
            />
            <View style={styles.cardInfo}>
              <Text style={styles.cardName}>{match.user.name}</Text>
              <View style={styles.progressContainer}>
                <View style={styles.progressBar}>
                  <View
                    style={[
                      styles.progressFill,
                      { width: `${match.progress}%` },
                    ]}
                  />
                </View>
                <Text style={styles.progressText}>{match.progress}%</Text>
              </View>
              <Text style={styles.cardStatus}>
                {match.chatLevel.replace("_", " ")}
              </Text>
            </View>
            <Ionicons
              name="chevron-forward"
              size={24}
              color={colors.textMuted}
            />
          </TouchableOpacity>
        ))}
      </>
    );
  };

  const renderWhoLikedYou = () => {
    if (!transparencyData?.whoLikedYou.length) {
      return (
        <View style={styles.emptyState}>
          <Ionicons name="heart-outline" size={64} color={colors.textMuted} />
          <Text style={styles.emptyTitle}>Nadie te ha dado like aún</Text>
          <Text style={styles.emptyDescription}>
            Completa tu perfil y sigue descubriendo personas
          </Text>
        </View>
      );
    }

    return (
      <>
        {transparencyData.whoLikedYou.map((like) => (
          <View key={like.connectionId} style={styles.card}>
            <Image
              source={{
                uri:
                  like.user.photos[0] ||
                  "https://ui-avatars.com/api/?name=User",
              }}
              style={styles.cardPhoto}
            />
            <View style={styles.cardInfo}>
              <Text style={styles.cardName}>{like.user.name}</Text>
              {like.user.bio && (
                <Text style={styles.cardBio} numberOfLines={2}>
                  {like.user.bio}
                </Text>
              )}
              {like.compatibilityScore > 0 && (
                <Text style={styles.cardCompatibility}>
                  {like.compatibilityScore}% compatibles
                </Text>
              )}
            </View>
            <View style={styles.cardActions}>
              <TouchableOpacity
                style={[styles.actionButton, styles.acceptButton]}
                onPress={() => handleAccept(like.connectionId)}
              >
                <Ionicons name="checkmark" size={24} color="white" />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionButton, styles.laterButton]}
                onPress={() => handlePostpone(like.connectionId)}
              >
                <Ionicons name="time" size={20} color={colors.textSecondary} />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionButton, styles.declineButton]}
                onPress={() => handleDecline(like.connectionId)}
              >
                <Ionicons name="close" size={24} color={colors.error} />
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </>
    );
  };

  const renderWhoYouLiked = () => {
    if (!transparencyData?.whoYouLiked.length) {
      return (
        <View style={styles.emptyState}>
          <Ionicons name="time-outline" size={64} color={colors.textMuted} />
          <Text style={styles.emptyTitle}>No has dado like a nadie</Text>
          <Text style={styles.emptyDescription}>
            Ve a Descubrir y encuentra personas interesantes
          </Text>
        </View>
      );
    }

    return (
      <>
        {transparencyData.whoYouLiked.map((like) => (
          <View key={like.connectionId} style={styles.card}>
            <Image
              source={{
                uri:
                  like.user.photos[0] ||
                  "https://ui-avatars.com/api/?name=User",
              }}
              style={styles.cardPhoto}
            />
            <View style={styles.cardInfo}>
              <Text style={styles.cardName}>{like.user.name}</Text>
              {like.user.bio && (
                <Text style={styles.cardBio} numberOfLines={2}>
                  {like.user.bio}
                </Text>
              )}
              <Text style={styles.cardStatus}>Esperando respuesta...</Text>
            </View>
            <Ionicons
              name="hourglass-outline"
              size={24}
              color={colors.textMuted}
            />
          </View>
        ))}
      </>
    );
  };

  const renderRejections = () => {
    if (!transparencyData?.rejections.length) {
      return (
        <View style={styles.emptyState}>
          <Ionicons
            name="checkmark-circle-outline"
            size={64}
            color={colors.success}
          />
          <Text style={styles.emptyTitle}>No hay rechazos</Text>
          <Text style={styles.emptyDescription}>
            Todas tus conexiones están activas o pendientes
          </Text>
        </View>
      );
    }

    return (
      <>
        {transparencyData.rejections.map((rejection) => (
          <View
            key={rejection.connectionId}
            style={[styles.card, styles.rejectedCard]}
          >
            <Image
              source={{
                uri:
                  rejection.user.photos[0] ||
                  "https://ui-avatars.com/api/?name=User",
              }}
              style={[styles.cardPhoto, styles.rejectedPhoto]}
            />
            <View style={styles.cardInfo}>
              <Text style={styles.cardName}>{rejection.user.name}</Text>
              {rejection.youWereRejected && rejection.declineReason && (
                <View style={styles.rejectionReasonContainer}>
                  <Ionicons
                    name="information-circle"
                    size={16}
                    color={colors.error}
                  />
                  <Text style={styles.rejectionReason}>
                    {rejection.declineReason}
                  </Text>
                </View>
              )}
              {rejection.youRejected && (
                <Text style={styles.cardStatus}>Rechazaste esta conexión</Text>
              )}
              {rejection.youWereRejected && (
                <Text style={[styles.cardStatus, { color: colors.error }]}>
                  No aceptaron tu solicitud
                </Text>
              )}
            </View>
          </View>
        ))}
      </>
    );
  };

  const renderPostponed = () => {
    if (!transparencyData?.postponed.length) {
      return (
        <View style={styles.emptyState}>
          <Ionicons
            name="calendar-outline"
            size={64}
            color={colors.textMuted}
          />
          <Text style={styles.emptyTitle}>No has pospuesto nada</Text>
          <Text style={styles.emptyDescription}>
            Las conexiones para después aparecerán aquí
          </Text>
        </View>
      );
    }

    return (
      <>
        {transparencyData.postponed.map((postponed) => (
          <View key={postponed.connectionId} style={styles.card}>
            <Image
              source={{
                uri:
                  postponed.user.photos[0] ||
                  "https://ui-avatars.com/api/?name=User",
              }}
              style={styles.cardPhoto}
            />
            <View style={styles.cardInfo}>
              <Text style={styles.cardName}>{postponed.user.name}</Text>
              {postponed.user.bio && (
                <Text style={styles.cardBio} numberOfLines={2}>
                  {postponed.user.bio}
                </Text>
              )}
            </View>
            <View style={styles.cardActions}>
              <TouchableOpacity
                style={[styles.actionButton, styles.reconnectButton]}
                onPress={() => handleAccept(postponed.connectionId)}
              >
                <Ionicons name="refresh" size={20} color="white" />
                <Text style={styles.buttonText}>Reconectar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionButton, styles.declineButton]}
                onPress={() => handleDecline(postponed.connectionId)}
              >
                <Ionicons name="close" size={24} color={colors.error} />
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </>
    );
  };

  const renderDissolved = () => {
    if (!transparencyData?.dissolved?.length) {
      return (
        <View style={styles.emptyState}>
          <Ionicons name="nuclear-outline" size={64} color={colors.textMuted} />
          <Text style={styles.emptyTitle}>Sin núcleos antiguos</Text>
          <Text style={styles.emptyDescription}>
            Los núcleos que se disuelvan aparecerán aquí
          </Text>
        </View>
      );
    }

    return (
      <>
        {transparencyData.dissolved.map((item: any) => (
          <View
            key={item.connectionId}
            style={[styles.card, styles.dissolvedCard]}
          >
            <Image
              source={{
                uri:
                  item.user.photos?.[0] ||
                  "https://ui-avatars.com/api/?name=User",
              }}
              style={[styles.cardPhoto, styles.dissolvedPhoto]}
            />
            <View style={styles.cardInfo}>
              <Text style={styles.cardName}>{item.user.name}</Text>
              {item.theyDissolvedIt && item.dissolveReason ? (
                <View style={styles.dissolvedReasonContainer}>
                  <Ionicons
                    name="chatbubble-ellipses"
                    size={14}
                    color={colors.error}
                  />
                  <Text style={styles.dissolvedReasonText}>
                    {item.dissolveReason}
                  </Text>
                </View>
              ) : item.iDissolvedIt ? (
                <Text style={styles.cardStatus}>Lo disolviste tú</Text>
              ) : null}
              <Text style={[styles.cardStatus, { color: colors.error }]}>
                Núcleo disuelto
              </Text>
            </View>
          </View>
        ))}
      </>
    );
  };

  const renderContent = () => {
    switch (activeTab) {
      case "active":
        return renderActiveMatches();
      case "whoLikedYou":
        return renderWhoLikedYou();
      case "whoYouLiked":
        return renderWhoYouLiked();
      case "rejected":
        return renderRejections();
      case "later":
        return renderPostponed();
      case "dissolved":
        return renderDissolved();
      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <GlobalHeader notificationCount={0} />
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Conexiones</Text>
        <Text style={styles.headerSubtitle}>Transparencia total</Text>
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <View style={styles.tabsContent}>
          {tabs.map((tab) => (
            <TouchableOpacity
              key={tab.key}
              style={[styles.tab, activeTab === tab.key && styles.activeTab]}
              onPress={() => setActiveTab(tab.key)}
            >
              <Ionicons
                name={tab.icon as any}
                size={18}
                color={
                  activeTab === tab.key ? colors.primary : colors.textSecondary
                }
              />
              <Text
                style={[
                  styles.tabLabel,
                  activeTab === tab.key && styles.activeTabLabel,
                ]}
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {tab.label}
              </Text>
              {tab.count > 0 && (
                <View style={styles.tabBadge}>
                  <Text style={styles.tabBadgeText}>{tab.count}</Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Content */}
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {renderContent()}
      </ScrollView>
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
    fontSize: fontSize.md,
    color: colors.textSecondary,
  },
  header: {
    padding: spacing.lg,
    backgroundColor: colors.backgroundCard,
  },
  headerTitle: {
    fontSize: fontSize.xxl,
    fontFamily: "Inter_700Bold",
    color: colors.text,
    marginBottom: spacing.xs,
  },
  headerSubtitle: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  tabsContainer: {
    backgroundColor: colors.backgroundCard,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingVertical: spacing.sm,
  },
  tabsContent: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    alignItems: "center",
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
  },
  tab: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.background,
  },
  activeTab: {
    backgroundColor: colors.primaryLight,
  },
  tabLabel: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    fontWeight: fontWeight.medium,
    flexShrink: 1,
  },
  activeTabLabel: {
    color: colors.primary,
    fontWeight: fontWeight.semibold,
  },
  tabBadge: {
    backgroundColor: colors.primary,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: borderRadius.full,
    minWidth: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  tabBadgeText: {
    fontSize: fontSize.xs,
    color: "white",
    fontWeight: fontWeight.bold,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    flexGrow: 1,
    padding: spacing.md,
  },
  card: {
    flexDirection: "row",
    backgroundColor: colors.backgroundCard,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    alignItems: "center",
    gap: spacing.md,
    marginBottom: spacing.md,
    ...shadows.sm,
  },
  cardPhoto: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  cardInfo: {
    flex: 1,
    gap: spacing.xs,
    minWidth: 0,
  },
  cardName: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: colors.text,
  },
  cardBio: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  cardCompatibility: {
    fontSize: fontSize.sm,
    color: colors.primary,
    fontWeight: fontWeight.semibold,
  },
  cardStatus: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
  },
  progressContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  progressBar: {
    flex: 1,
    height: 6,
    backgroundColor: colors.border,
    borderRadius: 3,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: colors.primary,
  },
  progressText: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    fontWeight: fontWeight.semibold,
  },
  cardActions: {
    flexDirection: "row",
    gap: spacing.xs,
    flexShrink: 0,
  },
  actionButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
  },
  acceptButton: {
    backgroundColor: colors.success,
  },
  reconnectButton: {
    backgroundColor: colors.primary,
    flexDirection: "row",
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    width: "auto",
  },
  buttonText: {
    color: "white",
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
  },
  laterButton: {
    backgroundColor: colors.backgroundLight,
  },
  declineButton: {
    backgroundColor: colors.backgroundLight,
  },
  rejectedCard: {
    opacity: 0.7,
  },
  rejectedPhoto: {
    opacity: 0.5,
  },
  rejectionReasonContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    backgroundColor: colors.errorLight,
    padding: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  rejectionReason: {
    fontSize: fontSize.sm,
    color: colors.error,
    fontWeight: fontWeight.medium,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.xxxl,
    paddingHorizontal: spacing.lg,
    minHeight: 400,
    gap: spacing.md,
  },
  emptyTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.text,
    textAlign: "center",
  },
  emptyDescription: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    textAlign: "center",
    paddingHorizontal: spacing.xl,
  },
  dissolvedCard: {
    opacity: 0.8,
    borderLeftWidth: 3,
    borderLeftColor: colors.error,
  },
  dissolvedPhoto: {
    opacity: 0.5,
  },
  dissolvedReasonContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.xs,
    backgroundColor: colors.errorLight,
    padding: spacing.sm,
    borderRadius: borderRadius.sm,
    marginTop: spacing.xs,
  },
  dissolvedReasonText: {
    fontSize: fontSize.sm,
    color: colors.error,
    flex: 1,
    lineHeight: 18,
  },
});
