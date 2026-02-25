import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  Animated,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native";
import { useLocalSearchParams, useRouter, Stack } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { ProgressRing, GlobalHeader } from "../../../src/components";
import { useNucleusStore } from "../../../src/store/nucleus.store";
import { getSocket } from "../../../src/services/socket";
import { connectionApi } from "../../../src/services/api";
import {
  colors,
  fontSize,
  fontWeight,
  spacing,
  borderRadius,
  shadows,
} from "../../../src/utils/theme";

// Category icons mapping
const getCategoryIcon = (category: string): string => {
  const icons: Record<string, string> = {
    musica: "musical-notes",
    fotografia: "camera",
    viajes: "airplane",
    deportes: "fitness",
    cocina: "restaurant",
    cine: "film",
    libros: "book",
    arte: "color-palette",
    naturaleza: "leaf",
    tecnologia: "laptop",
    general: "sparkles",
  };
  return icons[category] || "help-circle";
};

const getCategoryColor = (category: string): string => {
  const categoryColors: Record<string, string> = {
    musica: "#9C27B0",
    fotografia: "#E91E63",
    viajes: "#2196F3",
    deportes: "#4CAF50",
    cocina: "#FF9800",
    cine: "#F44336",
    libros: "#795548",
    arte: "#FF5722",
    naturaleza: "#8BC34A",
    tecnologia: "#00BCD4",
    general: "#607D8B",
  };
  return categoryColors[category] || colors.primary;
};

export default function NucleusScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { overview, isLoading, loadOverview, clearNucleus } = useNucleusStore();
  const progressAnim = useRef(new Animated.Value(0)).current;
  const [animatedProgress, setAnimatedProgress] = useState(0);
  const [dissolveModalVisible, setDissolveModalVisible] = useState(false);
  const [dissolveReason, setDissolveReason] = useState("");
  const [isDissolving, setIsDissolving] = useState(false);

  const wordCount = dissolveReason.trim().split(/\s+/).filter(Boolean).length;

  const handleDissolve = async () => {
    if (wordCount < 20) {
      Alert.alert(
        "Texto insuficiente",
        "Necesitas escribir al menos 20 palabras para disolver el núcleo.",
      );
      return;
    }
    setIsDissolving(true);
    try {
      await connectionApi.dissolve(id!, dissolveReason.trim());
      setDissolveModalVisible(false);
      router.replace("/(tabs)/connections");
    } catch (error: any) {
      Alert.alert(
        "Error",
        error.response?.data?.message || "No se pudo disolver el núcleo",
      );
    } finally {
      setIsDissolving(false);
    }
  };

  useEffect(() => {
    if (id) {
      loadOverview(id);
    }
    return () => clearNucleus();
  }, [id]);

  // Animate progress value whenever it changes
  useEffect(() => {
    if (overview?.connection.progress !== undefined) {
      const targetProgress = overview.connection.progress;
      Animated.timing(progressAnim, {
        toValue: targetProgress,
        duration: 800,
        useNativeDriver: false,
      }).start();
      setAnimatedProgress(targetProgress);
    }
  }, [overview?.connection.progress]);

  // Socket listener for real-time nucleus updates
  useEffect(() => {
    if (!id) return;
    const socket = getSocket();
    if (!socket) return;

    const handleNucleusUpdated = (data: { connectionId: string }) => {
      if (data.connectionId === id) {
        loadOverview(id);
      }
    };

    socket.on("nucleus:updated", handleNucleusUpdated);
    return () => {
      socket.off("nucleus:updated", handleNucleusUpdated);
    };
  }, [id]);

  if (isLoading && !overview) {
    return (
      <SafeAreaView style={styles.container}>
        <Stack.Screen
          options={{
            headerShown: true,
            headerTitle: "Núcleo",
            headerStyle: { backgroundColor: colors.background },
            headerTintColor: colors.text,
            headerBackVisible: true,
          }}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Cargando núcleo...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!overview) {
    return (
      <SafeAreaView style={styles.container}>
        <Stack.Screen
          options={{
            headerShown: true,
            headerTitle: "Núcleo",
            headerStyle: { backgroundColor: colors.background },
            headerTintColor: colors.text,
            headerBackVisible: true,
          }}
        />
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={64} color={colors.error} />
          <Text style={styles.errorText}>No se pudo cargar el núcleo</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => loadOverview(id!)}
          >
            <Text style={styles.retryText}>Reintentar</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const { connection, otherUser, sections, sharedInterests } = overview;

  return (
    <SafeAreaView style={styles.container} edges={["bottom"]}>
      <Stack.Screen
        options={{
          headerShown: false,
        }}
      />

      {/* Global Header with notifications & settings */}
      <GlobalHeader notificationCount={0} />

      {/* Custom Header with back button */}
      <View style={styles.customHeader}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Núcleo con {otherUser.name}</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {/* Progress Header */}
        <LinearGradient
          colors={[colors.primaryDark, colors.primary]}
          style={styles.progressHeader}
        >
          <View style={styles.progressContent}>
            <ProgressRing
              progress={connection.progress}
              size={100}
              strokeWidth={8}
            />
            <View style={styles.progressInfo}>
              <Text style={styles.progressTitle}>Progreso del Núcleo</Text>
              <Text style={styles.progressPercentage}>
                {connection.progress}%
              </Text>
              <Text style={styles.progressSubtitle}>
                {connection.progress < 70
                  ? `${70 - connection.progress}% para chatear`
                  : connection.progress < 100
                    ? `${100 - connection.progress}% para chat ilimitado`
                    : "¡Chat desbloqueado!"}
              </Text>
            </View>
          </View>

          {/* Chat Status Badge */}
          <View
            style={[
              styles.chatBadge,
              connection.chatLevel !== "NONE" && styles.chatBadgeActive,
            ]}
          >
            <Ionicons
              name={
                connection.chatLevel === "UNLIMITED"
                  ? "chatbubbles"
                  : connection.chatLevel === "LIMITED"
                    ? "chatbubble"
                    : "lock-closed"
              }
              size={16}
              color={
                connection.chatLevel !== "NONE"
                  ? colors.success
                  : colors.textMuted
              }
            />
            <Text
              style={[
                styles.chatBadgeText,
                connection.chatLevel !== "NONE" && styles.chatBadgeTextActive,
              ]}
            >
              {connection.chatLevel === "UNLIMITED"
                ? "Chat ilimitado"
                : connection.chatLevel === "LIMITED"
                  ? "Chat"
                  : "Chat bloqueado"}
            </Text>
          </View>
        </LinearGradient>

        {/* Sections */}
        <View style={styles.sectionsContainer}>
          {/* Questions Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleRow}>
                <Ionicons name="help-circle" size={24} color={colors.primary} />
                <Text style={styles.sectionTitle}>Preguntas</Text>
              </View>
              <Text style={styles.sectionProgress}>
                {sections.questions.progress}/{sections.questions.maxProgress}%
              </Text>
            </View>

            <Text style={styles.sectionDescription}>
              Responde 5 preguntas de cada categoría compartida
            </Text>

            <View style={styles.categoriesGrid}>
              {sections.questions.categories.map((cat) => (
                <TouchableOpacity
                  key={cat.category}
                  style={[
                    styles.categoryCard,
                    cat.isCompleted && styles.categoryCardCompleted,
                  ]}
                  onPress={() =>
                    router.push(`/nucleus/${id}/category/${cat.category}`)
                  }
                >
                  <View
                    style={[
                      styles.categoryIcon,
                      {
                        backgroundColor: getCategoryColor(cat.category) + "20",
                      },
                    ]}
                  >
                    <Ionicons
                      name={getCategoryIcon(cat.category) as any}
                      size={20}
                      color={getCategoryColor(cat.category)}
                    />
                  </View>
                  <Text style={styles.categoryName}>{cat.category}</Text>
                  <View style={styles.categoryProgress}>
                    <View
                      style={[
                        styles.categoryProgressBar,
                        {
                          width: `${(cat.answered / cat.total) * 100}%`,
                          backgroundColor: getCategoryColor(cat.category),
                        },
                      ]}
                    />
                  </View>
                  <Text style={styles.categoryCount}>
                    {cat.answered}/{cat.total}
                  </Text>
                  {cat.isCompleted && (
                    <Ionicons
                      name="checkmark-circle"
                      size={16}
                      color={colors.success}
                      style={styles.categoryCheck}
                    />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Photos Section */}
          <TouchableOpacity
            style={styles.section}
            onPress={() => router.push(`/nucleus/${id}/photos`)}
          >
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleRow}>
                <Ionicons name="camera" size={24} color="#E91E63" />
                <Text style={styles.sectionTitle}>Foto Instantánea</Text>
              </View>
              <Text style={styles.sectionProgress}>
                {sections.photos.progress}/{sections.photos.maxProgress}%
              </Text>
            </View>

            <Text style={styles.sectionDescription}>
              Tómense una foto instantánea y compártanla
            </Text>

            <View style={styles.photoStatus}>
              <View style={styles.statusItem}>
                <Ionicons
                  name={
                    sections.photos.userUploaded
                      ? "checkmark-circle"
                      : "ellipse-outline"
                  }
                  size={20}
                  color={
                    sections.photos.userUploaded
                      ? colors.success
                      : colors.textMuted
                  }
                />
                <Text style={styles.statusText}>Tú</Text>
              </View>
              <View style={styles.statusItem}>
                <Ionicons
                  name={
                    sections.photos.otherUploaded
                      ? "checkmark-circle"
                      : "ellipse-outline"
                  }
                  size={20}
                  color={
                    sections.photos.otherUploaded
                      ? colors.success
                      : colors.textMuted
                  }
                />
                <Text style={styles.statusText}>
                  {otherUser.name.split(" ")[0]}
                </Text>
              </View>
            </View>

            <View style={styles.sectionAction}>
              <Text style={styles.sectionActionText}>
                {sections.photos.userUploaded && sections.photos.otherUploaded
                  ? "Ver fotos"
                  : sections.photos.userUploaded
                    ? "Esperando su foto..."
                    : "Tomar foto"}
              </Text>
              <Ionicons
                name="chevron-forward"
                size={20}
                color={colors.primary}
              />
            </View>
          </TouchableOpacity>

          {/* Voice Section */}
          <TouchableOpacity
            style={styles.section}
            onPress={() => router.push(`/nucleus/${id}/voice`)}
          >
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleRow}>
                <Ionicons name="mic" size={24} color="#9C27B0" />
                <Text style={styles.sectionTitle}>Nota de Voz</Text>
              </View>
              <Text style={styles.sectionProgress}>
                {sections.voice.progress}/{sections.voice.maxProgress}%
              </Text>
            </View>

            <Text style={styles.sectionDescription}>
              Envíense una nota de voz respondiendo a un prompt
            </Text>

            <View style={styles.photoStatus}>
              <View style={styles.statusItem}>
                <Ionicons
                  name={
                    sections.voice.userSent
                      ? "checkmark-circle"
                      : "ellipse-outline"
                  }
                  size={20}
                  color={
                    sections.voice.userSent ? colors.success : colors.textMuted
                  }
                />
                <Text style={styles.statusText}>Tú</Text>
              </View>
              <View style={styles.statusItem}>
                <Ionicons
                  name={
                    sections.voice.otherSent
                      ? "checkmark-circle"
                      : "ellipse-outline"
                  }
                  size={20}
                  color={
                    sections.voice.otherSent ? colors.success : colors.textMuted
                  }
                />
                <Text style={styles.statusText}>
                  {otherUser.name.split(" ")[0]}
                </Text>
              </View>
            </View>

            <View style={styles.sectionAction}>
              <Text style={styles.sectionActionText}>
                {sections.voice.userSent && sections.voice.otherSent
                  ? "Escuchar notas"
                  : sections.voice.userSent
                    ? "Esperando su nota..."
                    : "Grabar nota"}
              </Text>
              <Ionicons
                name="chevron-forward"
                size={20}
                color={colors.primary}
              />
            </View>
          </TouchableOpacity>

          {/* Mini Games Section */}
          <TouchableOpacity
            style={styles.section}
            onPress={() => router.push(`/nucleus/${id}/games`)}
          >
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleRow}>
                <Ionicons name="game-controller" size={24} color="#FF9800" />
                <Text style={styles.sectionTitle}>Mini Juegos</Text>
              </View>
              <Text style={styles.sectionProgress}>
                {sections.games.progress}/{sections.games.maxProgress}%
              </Text>
            </View>

            <Text style={styles.sectionDescription}>
              Completa 3 mini juegos divertidos juntos
            </Text>

            <View style={styles.gamesGrid}>
              {sections.games.games.map((game) => (
                <View
                  key={game.type}
                  style={[
                    styles.gameItem,
                    game.status === "COMPLETED" && styles.gameItemCompleted,
                  ]}
                >
                  <Text style={styles.gameEmoji}>
                    {game.type === "GUESS_ANSWER"
                      ? "🎯"
                      : game.type === "COMPLETE_PHRASE"
                        ? "✍️"
                        : "🤥"}
                  </Text>
                  <Text style={styles.gameName} numberOfLines={1}>
                    {game.name}
                  </Text>
                  {game.status === "COMPLETED" && (
                    <Ionicons
                      name="checkmark-circle"
                      size={14}
                      color={colors.success}
                    />
                  )}
                </View>
              ))}
            </View>

            <View style={styles.sectionAction}>
              <Text style={styles.sectionActionText}>
                {sections.games.completed === sections.games.total
                  ? "Ver resultados"
                  : "Jugar"}
              </Text>
              <Ionicons
                name="chevron-forward"
                size={20}
                color={colors.primary}
              />
            </View>
          </TouchableOpacity>

          {/* Dissolve Button */}
          <TouchableOpacity
            style={styles.dissolveButton}
            onPress={() => setDissolveModalVisible(true)}
          >
            <Ionicons name="nuclear" size={18} color={colors.error} />
            <Text style={styles.dissolveButtonText}>Disolver núcleo</Text>
          </TouchableOpacity>

          {/* Places Section */}
          <TouchableOpacity
            style={styles.section}
            onPress={() => router.push(`/nucleus/${id}/places`)}
          >
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleRow}>
                <Ionicons name="location" size={24} color="#4CAF50" />
                <Text style={styles.sectionTitle}>Lugares</Text>
              </View>
              <Text style={styles.sectionProgress}>
                {sections.places?.progress || 0}/
                {sections.places?.maxProgress || 5}%
              </Text>
            </View>

            <Text style={styles.sectionDescription}>
              Sugiere y vota lugares para su primera cita
            </Text>

            {sections.places?.enabled ? (
              <>
                <View style={styles.photoStatus}>
                  <View style={styles.statusItem}>
                    <Ionicons
                      name={
                        sections.places.suggestionsCount > 0
                          ? "checkmark-circle"
                          : "ellipse-outline"
                      }
                      size={20}
                      color={
                        sections.places.suggestionsCount > 0
                          ? colors.success
                          : colors.textMuted
                      }
                    />
                    <Text style={styles.statusText}>
                      {sections.places.suggestionsCount} lugar
                      {sections.places.suggestionsCount !== 1 ? "es" : ""}
                    </Text>
                  </View>
                  {sections.places.hasAgreed && (
                    <View style={styles.statusItem}>
                      <Ionicons name="heart" size={20} color={colors.error} />
                      <Text style={styles.statusText}>¡De acuerdo!</Text>
                    </View>
                  )}
                </View>

                <View style={styles.sectionAction}>
                  <Text style={styles.sectionActionText}>
                    {sections.places.hasAgreed
                      ? "Ver lugar acordado"
                      : "Buscar lugares"}
                  </Text>
                  <Ionicons
                    name="chevron-forward"
                    size={20}
                    color={colors.primary}
                  />
                </View>
              </>
            ) : (
              <View style={styles.disabledSection}>
                <Ionicons
                  name={
                    sections.places?.userHasLocation
                      ? "checkmark-circle-outline"
                      : "location-outline"
                  }
                  size={20}
                  color={
                    sections.places?.userHasLocation
                      ? colors.success
                      : colors.textMuted
                  }
                />
                <Text
                  style={[
                    styles.disabledText,
                    sections.places?.userHasLocation && {
                      color: colors.success,
                    },
                  ]}
                >
                  {sections.places?.userHasLocation
                    ? "Tu ubicación está guardada. Esperando a que la otra persona también la active..."
                    : "Activa tu ubicación para usar esta función"}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Dissolve Modal */}
      <Modal
        visible={dissolveModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setDissolveModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Ionicons name="nuclear" size={24} color={colors.error} />
              <Text style={styles.modalTitle}>Disolver núcleo</Text>
            </View>
            <Text style={styles.modalSubtitle}>
              Esta acción no se puede deshacer. La otra persona podrá ver tu
              mensaje.
            </Text>
            <TextInput
              style={styles.modalTextInput}
              placeholder="Explica por qué estás dejando el núcleo (mínimo 20 palabras)..."
              placeholderTextColor={colors.textMuted}
              multiline
              numberOfLines={5}
              value={dissolveReason}
              onChangeText={setDissolveReason}
              maxLength={500}
            />
            <Text
              style={[
                styles.wordCounter,
                wordCount >= 20
                  ? styles.wordCounterOk
                  : styles.wordCounterError,
              ]}
            >
              {wordCount}/20 palabras mínimas
            </Text>
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => {
                  setDissolveModalVisible(false);
                  setDissolveReason("");
                }}
                disabled={isDissolving}
              >
                <Text style={styles.modalCancelText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.modalDissolveButton,
                  (wordCount < 20 || isDissolving) &&
                    styles.modalDissolveButtonDisabled,
                ]}
                onPress={handleDissolve}
                disabled={wordCount < 20 || isDissolving}
              >
                {isDissolving ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <Text style={styles.modalDissolveText}>Disolver</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  customHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.backgroundCard,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    padding: spacing.xs,
  },
  headerTitle: {
    flex: 1,
    color: colors.text,
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    textAlign: "center",
  },
  scrollView: {
    flex: 1,
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
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: spacing.md,
    padding: spacing.xl,
  },
  errorText: {
    color: colors.text,
    fontSize: fontSize.lg,
    textAlign: "center",
  },
  retryButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
  },
  retryText: {
    color: colors.text,
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
  },
  progressHeader: {
    padding: spacing.lg,
    margin: spacing.md,
    borderRadius: borderRadius.xl,
  },
  progressContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.lg,
  },
  progressInfo: {
    flex: 1,
  },
  progressTitle: {
    color: "rgba(255,255,255,0.8)",
    fontSize: fontSize.sm,
  },
  progressPercentage: {
    color: colors.text,
    fontSize: fontSize.xxxl,
    fontWeight: fontWeight.bold,
  },
  progressSubtitle: {
    color: "rgba(255,255,255,0.7)",
    fontSize: fontSize.sm,
  },
  chatBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.1)",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    marginTop: spacing.md,
    alignSelf: "flex-start",
    gap: spacing.xs,
  },
  chatBadgeActive: {
    backgroundColor: "rgba(34, 197, 94, 0.2)",
  },
  chatBadgeText: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
  },
  chatBadgeTextActive: {
    color: colors.success,
  },
  sectionsContainer: {
    padding: spacing.md,
    gap: spacing.md,
  },
  section: {
    backgroundColor: colors.backgroundCard,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    ...shadows.md,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.sm,
  },
  sectionTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
  },
  sectionProgress: {
    color: colors.primary,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
  },
  sectionDescription: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
    marginBottom: spacing.md,
  },
  categoriesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  categoryCard: {
    backgroundColor: colors.backgroundLight,
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    width: "48%",
    alignItems: "center",
  },
  categoryCardCompleted: {
    borderWidth: 1,
    borderColor: colors.success,
  },
  categoryIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: spacing.xs,
  },
  categoryName: {
    color: colors.text,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    textTransform: "capitalize",
    marginBottom: spacing.xs,
  },
  categoryProgress: {
    width: "100%",
    height: 4,
    backgroundColor: colors.border,
    borderRadius: 2,
    overflow: "hidden",
  },
  categoryProgressBar: {
    height: "100%",
    borderRadius: 2,
  },
  categoryCount: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
    marginTop: spacing.xs,
  },
  categoryCheck: {
    position: "absolute",
    top: spacing.xs,
    right: spacing.xs,
  },
  photoStatus: {
    flexDirection: "row",
    gap: spacing.xl,
    marginBottom: spacing.md,
  },
  statusItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  statusText: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
  },
  sectionAction: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  sectionActionText: {
    color: colors.primary,
    fontSize: fontSize.md,
    fontWeight: fontWeight.medium,
  },
  gamesGrid: {
    flexDirection: "row",
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  gameItem: {
    flex: 1,
    backgroundColor: colors.backgroundLight,
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    alignItems: "center",
    gap: spacing.xs,
  },
  gameItemCompleted: {
    borderWidth: 1,
    borderColor: colors.success,
  },
  gameEmoji: {
    fontSize: 24,
  },
  gameName: {
    color: colors.text,
    fontSize: fontSize.xs,
    textAlign: "center",
  },
  disabledSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    padding: spacing.md,
    backgroundColor: colors.backgroundLight,
    borderRadius: borderRadius.md,
  },
  disabledText: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
    flex: 1,
  },
  dissolveButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    paddingVertical: spacing.md,
    marginTop: spacing.md,
    marginBottom: spacing.xl,
    borderWidth: 1,
    borderColor: colors.error,
    borderRadius: borderRadius.xl,
  },
  dissolveButtonText: {
    color: colors.error,
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "flex-end",
  },
  modalContainer: {
    backgroundColor: colors.backgroundCard,
    borderTopLeftRadius: borderRadius.xxl,
    borderTopRightRadius: borderRadius.xxl,
    padding: spacing.xl,
    gap: spacing.md,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  modalTitle: {
    color: colors.text,
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
  },
  modalSubtitle: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
    lineHeight: 20,
  },
  modalTextInput: {
    backgroundColor: colors.backgroundLight,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    color: colors.text,
    fontSize: fontSize.md,
    minHeight: 120,
    textAlignVertical: "top",
    borderWidth: 1,
    borderColor: colors.border,
  },
  wordCounter: {
    fontSize: fontSize.sm,
    textAlign: "right",
  },
  wordCounterOk: {
    color: colors.success,
  },
  wordCounterError: {
    color: colors.textMuted,
  },
  modalActions: {
    flexDirection: "row",
    gap: spacing.md,
    marginTop: spacing.sm,
  },
  modalCancelButton: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.backgroundLight,
    alignItems: "center",
  },
  modalCancelText: {
    color: colors.text,
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
  },
  modalDissolveButton: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.error,
    alignItems: "center",
  },
  modalDissolveButtonDisabled: {
    opacity: 0.4,
  },
  modalDissolveText: {
    color: "white",
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
  },
});
