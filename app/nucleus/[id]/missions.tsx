import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from "react-native";
import { useLocalSearchParams, Stack } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { VotingCard, MissionCard } from "../../../src/components";
import { api } from "../../../src/services/api";
import { useNucleusStore } from "../../../src/store/nucleus.store";
import {
  colors,
  fontSize,
  fontWeight,
  spacing,
} from "../../../src/utils/theme";

interface MissionOption {
  id: string;
  type: string;
  title: string;
  description: string;
  category: string;
  points: number;
  difficulty: number;
}

interface ActiveMission {
  id: string;
  type: string;
  title: string;
  description: string;
  category: string;
  content: any;
  points: number;
}

interface MissionRound {
  roundId: string;
  options: MissionOption[];
  votingOpen: boolean;
  votingEndsAt: string;
  userVoted: boolean;
  userVoteId?: string;
  otherVoted: boolean;
  selectedMission?: ActiveMission;
}

interface UserMissionResponse {
  userId: string;
  response: any;
  submittedAt: string;
}

interface MissionsData {
  currentRound?: MissionRound;
  selectedMission?: ActiveMission;
  userResponse?: UserMissionResponse;
  otherResponse?: UserMissionResponse;
  bothResponded: boolean;
  sharedInterests: { interest: string; weight: number; isMain: boolean }[];
  otherUserPresent: boolean;
  completedRounds: number;
  pointsEarned: number;
}

export default function MissionsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { loadOverview } = useNucleusStore();

  const [missionsData, setMissionsData] = useState<MissionsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    loadMissionsData();
  }, [id]);

  const loadMissionsData = async (isRefresh = false) => {
    if (isRefresh) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }

    try {
      const response = await api.get(`/nucleus/${id}/missions`);
      setMissionsData(response.data);
    } catch (error: any) {
      console.error("Error loading missions:", error);
      Alert.alert("Error", "No se pudieron cargar las misiones");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleVote = async (missionOptionId: string) => {
    if (!missionsData?.currentRound) return;

    setIsSubmitting(true);
    try {
      await api.post(`/nucleus/${id}/missions/vote`, {
        roundId: missionsData.currentRound.roundId,
        missionTemplateId: missionOptionId,
      });
      await loadMissionsData();
      Alert.alert(
        "Voto registrado!",
        "Tu voto ha sido registrado exitosamente",
      );
    } catch (error: any) {
      Alert.alert(
        "Error",
        error.response?.data?.error || "No se pudo registrar el voto",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitResponse = async (response: any) => {
    if (!missionsData?.selectedMission) return;

    setIsSubmitting(true);
    try {
      await api.post(`/nucleus/${id}/missions/respond`, {
        roundId: missionsData.currentRound?.roundId,
        response,
      });
      await loadMissionsData();
      await loadOverview(id!);
      Alert.alert("Respuesta enviada!", "Tu respuesta ha sido registrada");
    } catch (error: any) {
      Alert.alert(
        "Error",
        error.response?.data?.error || "No se pudo enviar la respuesta",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading && !missionsData) {
    return (
      <SafeAreaView style={styles.container}>
        <Stack.Screen
          options={{
            headerShown: true,
            headerTitle: "Misiones",
            headerStyle: { backgroundColor: colors.background },
            headerTintColor: colors.text,
            headerBackVisible: true,
          }}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Cargando misiones...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!missionsData) {
    return (
      <SafeAreaView style={styles.container}>
        <Stack.Screen
          options={{
            headerShown: true,
            headerTitle: "Misiones",
            headerStyle: { backgroundColor: colors.background },
            headerTintColor: colors.text,
            headerBackVisible: true,
          }}
        />
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>
            No hay datos de misiones disponibles
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const {
    currentRound,
    selectedMission,
    userResponse,
    otherResponse,
    bothResponded,
  } = missionsData;

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen
        options={{
          headerShown: true,
          headerTitle: "Misiones",
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.text,
          headerBackVisible: true,
        }}
      />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={() => loadMissionsData(true)}
            tintColor={colors.primary}
          />
        }
      >
        {/* Stats Header */}
        <View style={styles.statsContainer}>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>
              {missionsData.completedRounds}
            </Text>
            <Text style={styles.statLabel}>Rondas completadas</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>{missionsData.pointsEarned}</Text>
            <Text style={styles.statLabel}>Puntos ganados</Text>
          </View>
        </View>

        {/* Voting Phase */}
        {currentRound && currentRound.votingOpen && !selectedMission && (
          <View style={styles.section}>
            <VotingCard
              options={currentRound.options}
              votingEndsAt={currentRound.votingEndsAt}
              userVoted={currentRound.userVoted}
              userVoteId={currentRound.userVoteId}
              otherVoted={currentRound.otherVoted}
              otherUserPresent={missionsData.otherUserPresent}
              sharedInterests={missionsData.sharedInterests}
              onVote={handleVote}
              isSubmitting={isSubmitting}
            />
          </View>
        )}

        {/* Waiting for other to vote */}
        {currentRound &&
          currentRound.votingOpen &&
          currentRound.userVoted &&
          !currentRound.otherVoted && (
            <View style={styles.waitingContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={styles.waitingText}>
                Esperando el voto del otro...
              </Text>
              <Text style={styles.waitingSubtext}>
                Serás notificado cuando elijan su opción
              </Text>
            </View>
          )}

        {/* Active Mission */}
        {selectedMission && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Misión Activa</Text>
              <View style={styles.pointsBadge}>
                <Text style={styles.pointsText}>
                  +{selectedMission.points} pts
                </Text>
              </View>
            </View>
            <MissionCard
              mission={selectedMission}
              userHasResponded={!!userResponse}
              otherHasResponded={!!otherResponse}
              userResponse={userResponse?.response}
              otherResponse={otherResponse?.response}
              bothResponded={bothResponded}
              onSubmit={handleSubmitResponse}
              isSubmitting={isSubmitting}
            />
          </View>
        )}

        {/* No active round */}
        {!currentRound && !selectedMission && (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>🎯</Text>
            <Text style={styles.emptyTitle}>No hay misiones activas</Text>
            <Text style={styles.emptyText}>
              Las misiones se desbloquearán pronto
            </Text>
          </View>
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
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.xl,
  },
  loadingText: {
    marginTop: spacing.md,
    fontSize: fontSize.md,
    color: colors.textSecondary,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.xl,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: spacing.md,
  },
  emptyTitle: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  emptyText: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    textAlign: "center",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.md,
    paddingBottom: spacing.xl * 2,
  },
  statsContainer: {
    flexDirection: "row",
    backgroundColor: colors.backgroundCard,
    borderRadius: 16,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    alignItems: "center",
  },
  statBox: {
    flex: 1,
    alignItems: "center",
  },
  statNumber: {
    fontSize: fontSize.xxxl,
    fontWeight: fontWeight.bold,
    color: colors.primary,
    marginBottom: spacing.xs,
  },
  statLabel: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    textAlign: "center",
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: colors.border,
    marginHorizontal: spacing.md,
  },
  section: {
    marginBottom: spacing.lg,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.text,
  },
  pointsBadge: {
    backgroundColor: colors.success + "20",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: 12,
  },
  pointsText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.success,
  },
  waitingContainer: {
    backgroundColor: colors.backgroundCard,
    borderRadius: 16,
    padding: spacing.xl,
    alignItems: "center",
    marginBottom: spacing.lg,
  },
  waitingText: {
    marginTop: spacing.md,
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.text,
    textAlign: "center",
  },
  waitingSubtext: {
    marginTop: spacing.sm,
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    textAlign: "center",
  },
});
