import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useConnectionStore } from '../../src/store/connection.store';
import { colors, fontSize, fontWeight, spacing, borderRadius } from '../../src/utils/theme';

type FilterTab = 'all' | 'similar' | 'later';

// Chat unlock levels based on progress
const getChatLevel = (progress: number): { level: string; description: string; color: string } => {
  if (progress >= 70) {
    return { level: 'Chat completo', description: 'Pueden hablar de todo', color: colors.success };
  }
  if (progress >= 50) {
    return { level: 'Voz y video', description: 'Pueden hacer llamadas', color: '#9C27B0' };
  }
  if (progress >= 30) {
    return { level: 'Chat guiado', description: 'Preguntas sugeridas', color: '#2196F3' };
  }
  return { level: 'Bloqueado', description: 'Completen misiones', color: colors.textMuted };
};

// Get whose turn it is
const getTurnInfo = (_connection: any): { text: string; isMyTurn: boolean } => {
  // In production, this would come from the backend based on mission responses
  const isMyTurn = Math.random() > 0.5; // Mock for now
  return {
    text: isMyTurn ? 'Tu turno' : 'Esperando respuesta',
    isMyTurn,
  };
};

// Get compatibility label
const getCompatibilityLabel = (score: number): { text: string; color: string } => {
  if (score >= 80) return { text: 'Muy compatible', color: colors.success };
  if (score >= 60) return { text: 'Compatible', color: colors.primary };
  if (score >= 40) return { text: 'Algo en comun', color: colors.warning };
  return { text: 'Diferente', color: colors.textMuted };
};

interface NucleoCardProps {
  connection: any;
  onPress: () => void;
  showCompatibility?: boolean;
}

const NucleoCard: React.FC<NucleoCardProps> = ({ connection, onPress, showCompatibility }) => {
  const { otherUser, progress, temperature, compatibilityScore } = connection;
  const photo = otherUser?.photos?.[0] || 'https://ui-avatars.com/api/?background=252540&color=fff&name=U';
  const chatLevel = getChatLevel(progress);
  const turnInfo = getTurnInfo(connection);
  const compatibility = getCompatibilityLabel(compatibilityScore || 0);

  const getTemperatureEmoji = () => {
    switch (temperature) {
      case 'HOT': return '🔥';
      case 'WARM': return '☀️';
      case 'COOL': return '🌤️';
      case 'COLD': return '❄️';
      default: return '✨';
    }
  };

  return (
    <TouchableOpacity style={styles.nucleoCard} onPress={onPress} activeOpacity={0.8}>
      {/* Progress bar at top */}
      <View style={styles.progressBarContainer}>
        <View style={[styles.progressBar, { width: `${progress}%` }]} />
        <Text style={styles.progressText}>{progress}%</Text>
      </View>

      <View style={styles.nucleoContent}>
        {/* Photo */}
        <View style={styles.photoContainer}>
          <Image source={{ uri: photo }} style={styles.photo} />
          <Text style={styles.temperatureEmoji}>{getTemperatureEmoji()}</Text>
        </View>

        {/* Info */}
        <View style={styles.nucleoInfo}>
          <Text style={styles.nucleoName}>{otherUser?.name || 'Usuario'}</Text>

          {/* Compatibility score if requested */}
          {showCompatibility && compatibilityScore > 0 && (
            <View style={styles.compatibilityContainer}>
              <Text style={[styles.compatibilityScore, { color: compatibility.color }]}>
                {compatibilityScore}%
              </Text>
              <Text style={[styles.compatibilityLabel, { color: compatibility.color }]}>
                {compatibility.text}
              </Text>
            </View>
          )}

          {/* Chat level indicator */}
          <View style={styles.chatLevelContainer}>
            <View style={[styles.chatLevelDot, { backgroundColor: chatLevel.color }]} />
            <Text style={[styles.chatLevelText, { color: chatLevel.color }]}>
              {chatLevel.level}
            </Text>
          </View>

          {/* Turn indicator */}
          <View style={[
            styles.turnIndicator,
            turnInfo.isMyTurn ? styles.turnIndicatorActive : styles.turnIndicatorWaiting
          ]}>
            <Ionicons
              name={turnInfo.isMyTurn ? 'arrow-forward-circle' : 'time-outline'}
              size={14}
              color={turnInfo.isMyTurn ? colors.primary : colors.textMuted}
            />
            <Text style={[
              styles.turnText,
              turnInfo.isMyTurn ? styles.turnTextActive : styles.turnTextWaiting
            ]}>
              {turnInfo.text}
            </Text>
          </View>
        </View>

        {/* Arrow */}
        <Ionicons name="chevron-forward" size={24} color={colors.textMuted} />
      </View>

      {/* Mission hint if exists */}
      {connection.currentMission && (
        <View style={styles.missionHint}>
          <Ionicons name="flag" size={14} color={colors.primary} />
          <Text style={styles.missionHintText} numberOfLines={1}>
            {connection.currentMission.title}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

interface PendingCardProps {
  connection: any;
  onAccept: () => void;
  onPostpone: () => void;
  onDecline: () => void;
}

const PendingCard: React.FC<PendingCardProps> = ({ connection, onAccept, onPostpone, onDecline }) => {
  const { otherUser, compatibilityScore, seenByReceiver } = connection;
  const photo = otherUser?.photos?.[0] || 'https://ui-avatars.com/api/?background=252540&color=fff&name=U';
  const compatibility = getCompatibilityLabel(compatibilityScore || 0);

  return (
    <View style={styles.pendingCard}>
      <Image source={{ uri: photo }} style={styles.pendingPhoto} />
      <View style={styles.pendingInfo}>
        <Text style={styles.pendingName}>{otherUser?.name || 'Usuario'}</Text>
        <Text style={styles.pendingText}>Quiere crear un nucleo contigo</Text>
        {compatibilityScore > 0 && (
          <View style={styles.pendingCompatibility}>
            <Text style={[styles.pendingCompatibilityText, { color: compatibility.color }]}>
              {compatibilityScore}% {compatibility.text}
            </Text>
          </View>
        )}
      </View>
      <View style={styles.pendingActions}>
        <TouchableOpacity style={styles.declineBtn} onPress={onDecline}>
          <Ionicons name="close" size={20} color={colors.error} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.postponeBtn} onPress={onPostpone}>
          <Ionicons name="time" size={20} color={colors.warning} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.acceptBtn} onPress={onAccept}>
          <Ionicons name="checkmark" size={20} color="#FFF" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

interface LaterCardProps {
  connection: any;
  isInitiator: boolean;
  onAccept?: () => void;
  onDecline?: () => void;
}

const LaterCard: React.FC<LaterCardProps> = ({ connection, isInitiator, onAccept, onDecline }) => {
  const { otherUser, compatibilityScore } = connection;
  const photo = otherUser?.photos?.[0] || 'https://ui-avatars.com/api/?background=252540&color=fff&name=U';
  const compatibility = getCompatibilityLabel(compatibilityScore || 0);

  return (
    <View style={styles.laterCard}>
      <Image source={{ uri: photo }} style={styles.laterPhoto} />
      <View style={styles.laterInfo}>
        <Text style={styles.laterName}>{otherUser?.name || 'Usuario'}</Text>
        {isInitiator ? (
          <Text style={styles.laterStatusText}>
            Te puso en "otro momento"
          </Text>
        ) : (
          <Text style={styles.laterStatusText}>
            Lo dejaste para despues
          </Text>
        )}
        {compatibilityScore > 0 && (
          <Text style={[styles.laterCompatibility, { color: compatibility.color }]}>
            {compatibilityScore}% compatible
          </Text>
        )}
      </View>
      {!isInitiator && onAccept && onDecline && (
        <View style={styles.laterActions}>
          <TouchableOpacity style={styles.laterDeclineBtn} onPress={onDecline}>
            <Ionicons name="close" size={18} color={colors.error} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.laterAcceptBtn} onPress={onAccept}>
            <Text style={styles.laterAcceptText}>Conectar</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

interface WaitingCardProps {
  connection: any;
}

const WaitingCard: React.FC<WaitingCardProps> = ({ connection }) => {
  const { otherUser, seenByReceiver, compatibilityScore } = connection;
  const photo = otherUser?.photos?.[0] || 'https://ui-avatars.com/api/?background=252540&color=fff&name=U';

  return (
    <View style={styles.waitingCard}>
      <Image source={{ uri: photo }} style={styles.waitingPhoto} />
      <View style={styles.waitingInfo}>
        <Text style={styles.waitingName}>{otherUser?.name}</Text>
        <View style={styles.waitingStatusRow}>
          {seenByReceiver ? (
            <>
              <Ionicons name="checkmark-done" size={14} color={colors.primary} />
              <Text style={styles.waitingSeenText}>Visto</Text>
            </>
          ) : (
            <>
              <Ionicons name="checkmark" size={14} color={colors.textMuted} />
              <Text style={styles.waitingText}>Enviado</Text>
            </>
          )}
        </View>
        {compatibilityScore > 0 && (
          <Text style={styles.waitingCompatibility}>{compatibilityScore}% compatible</Text>
        )}
      </View>
    </View>
  );
};

// Rejected connection card with encouraging message
interface RejectedCardProps {
  connection: any;
}

const RejectedCard: React.FC<RejectedCardProps> = ({ connection }) => {
  const { otherUser } = connection;
  const photo = otherUser?.photos?.[0] || 'https://ui-avatars.com/api/?background=252540&color=fff&name=U';

  return (
    <View style={styles.rejectedCard}>
      <Image source={{ uri: photo }} style={styles.rejectedPhoto} />
      <View style={styles.rejectedInfo}>
        <Text style={styles.rejectedName}>{otherUser?.name || 'Usuario'}</Text>
        <Text style={styles.rejectedText}>No conectaron esta vez</Text>
      </View>
    </View>
  );
};

export default function ConnectionsScreen() {
  const {
    connections,
    pendingCounts,
    loadConnections,
    loadPendingCounts,
    acceptConnection,
    postponeConnection,
    declineConnection,
    isLoading,
  } = useConnectionStore();
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<FilterTab>('all');
  const [rejectedConnections, setRejectedConnections] = useState<any[]>([]);
  const [showRejected, setShowRejected] = useState(false);

  const loadRejectedConnections = async () => {
    try {
      const { connectionApi } = await import('../../src/services/api');
      const response = await connectionApi.getAll({ filter: 'rejected' });
      setRejectedConnections(response.data);
    } catch (error) {
      console.error('Error loading rejected connections:', error);
    }
  };

  useEffect(() => {
    loadConnections();
    loadPendingCounts();
    loadRejectedConnections();
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([
      loadConnections(),
      loadPendingCounts(),
      loadRejectedConnections(),
    ]);
    setRefreshing(false);
  };

  const handleTabChange = async (tab: FilterTab) => {
    setActiveTab(tab);
    if (tab === 'similar') {
      await loadConnections({ sortBy: 'compatibility' });
    } else if (tab === 'later') {
      await loadConnections({ status: 'LATER' });
    } else {
      await loadConnections();
    }
  };

  // Filter connections based on active tab
  const getFilteredConnections = () => {
    if (activeTab === 'later') {
      return connections.filter(c => c.status === 'LATER');
    }
    if (activeTab === 'similar') {
      return [...connections]
        .filter(c => c.status === 'PENDING' && !c.isInitiator)
        .sort((a, b) => (b.compatibilityScore || 0) - (a.compatibilityScore || 0));
    }
    return connections;
  };

  const filteredConnections = getFilteredConnections();

  // Categorize connections
  const pendingConnections = filteredConnections.filter(
    (c) => c.status === 'PENDING' && !c.isInitiator
  );
  const activeConnections = filteredConnections.filter(
    (c) => c.status === 'ACTIVE' || c.status === 'COMPLETED'
  );
  const waitingConnections = filteredConnections.filter(
    (c) => c.status === 'PENDING' && c.isInitiator
  );
  const laterConnections = filteredConnections.filter(
    (c) => c.status === 'LATER'
  );

  const handleConnectionPress = (connectionId: string) => {
    router.push(`/connection/${connectionId}`);
  };

  const handleAccept = async (connectionId: string) => {
    await acceptConnection(connectionId);
    loadPendingCounts();
  };

  const handlePostpone = async (connectionId: string) => {
    await postponeConnection(connectionId);
    loadPendingCounts();
  };

  const handleDecline = async (connectionId: string) => {
    await declineConnection(connectionId);
    loadPendingCounts();
  };

  if (isLoading && connections.length === 0) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Cargando nucleos...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Nucleos</Text>
          <Text style={styles.subtitle}>
            Tus conexiones en progreso
          </Text>
        </View>

        {/* Filter Tabs */}
        <View style={styles.tabsContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'all' && styles.tabActive]}
            onPress={() => handleTabChange('all')}
          >
            <Ionicons
              name="grid"
              size={16}
              color={activeTab === 'all' ? colors.primary : colors.textMuted}
            />
            <Text style={[styles.tabText, activeTab === 'all' && styles.tabTextActive]}>
              Todos
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tab, activeTab === 'similar' && styles.tabActive]}
            onPress={() => handleTabChange('similar')}
          >
            <Ionicons
              name="heart"
              size={16}
              color={activeTab === 'similar' ? colors.secondary : colors.textMuted}
            />
            <Text style={[styles.tabText, activeTab === 'similar' && styles.tabTextActive]}>
              Similares a mi
            </Text>
            {pendingCounts.pending > 0 && (
              <View style={styles.tabBadge}>
                <Text style={styles.tabBadgeText}>{pendingCounts.pending}</Text>
              </View>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tab, activeTab === 'later' && styles.tabActive]}
            onPress={() => handleTabChange('later')}
          >
            <Ionicons
              name="time"
              size={16}
              color={activeTab === 'later' ? colors.warning : colors.textMuted}
            />
            <Text style={[styles.tabText, activeTab === 'later' && styles.tabTextActive]}>
              Otro momento
            </Text>
            {pendingCounts.later > 0 && (
              <View style={[styles.tabBadge, { backgroundColor: colors.warning }]}>
                <Text style={styles.tabBadgeText}>{pendingCounts.later}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Content based on active tab */}
        {activeTab === 'later' ? (
          // Later tab content
          <View style={styles.section}>
            {laterConnections.length > 0 ? (
              <>
                <View style={styles.sectionHeader}>
                  <Ionicons name="time" size={20} color={colors.warning} />
                  <Text style={styles.sectionTitle}>
                    En otro momento ({laterConnections.length})
                  </Text>
                </View>
                <Text style={styles.sectionDescription}>
                  Conexiones que tu o ellos dejaron para despues
                </Text>
                {laterConnections.map((connection) => (
                  <LaterCard
                    key={connection.id}
                    connection={connection}
                    isInitiator={connection.isInitiator}
                    onAccept={!connection.isInitiator ? () => handleAccept(connection.id) : undefined}
                    onDecline={!connection.isInitiator ? () => handleDecline(connection.id) : undefined}
                  />
                ))}
              </>
            ) : (
              <View style={styles.emptyTabContainer}>
                <Ionicons name="time-outline" size={48} color={colors.textMuted} />
                <Text style={styles.emptyTabTitle}>Sin conexiones pendientes</Text>
                <Text style={styles.emptyTabText}>
                  Aqui apareceran las conexiones que dejes para otro momento
                </Text>
              </View>
            )}
          </View>
        ) : activeTab === 'similar' ? (
          // Similar tab content - sorted by compatibility
          <View style={styles.section}>
            {pendingConnections.length > 0 ? (
              <>
                <View style={styles.sectionHeader}>
                  <Ionicons name="heart" size={20} color={colors.secondary} />
                  <Text style={styles.sectionTitle}>
                    Similares a ti ({pendingConnections.length})
                  </Text>
                </View>
                <Text style={styles.sectionDescription}>
                  Ordenados por compatibilidad con tus intereses y valores
                </Text>
                {pendingConnections.map((connection) => (
                  <PendingCard
                    key={connection.id}
                    connection={connection}
                    onAccept={() => handleAccept(connection.id)}
                    onPostpone={() => handlePostpone(connection.id)}
                    onDecline={() => handleDecline(connection.id)}
                  />
                ))}
              </>
            ) : (
              <View style={styles.emptyTabContainer}>
                <Ionicons name="heart-outline" size={48} color={colors.textMuted} />
                <Text style={styles.emptyTabTitle}>Sin solicitudes pendientes</Text>
                <Text style={styles.emptyTabText}>
                  Cuando recibas solicitudes, aqui apareceran ordenadas por compatibilidad
                </Text>
              </View>
            )}
          </View>
        ) : (
          // All tab content
          <>
            {/* Info about chat levels */}
            <View style={styles.infoCard}>
              <Text style={styles.infoTitle}>Niveles de chat</Text>
              <View style={styles.levelsList}>
                <View style={styles.levelItem}>
                  <View style={[styles.levelDot, { backgroundColor: colors.textMuted }]} />
                  <Text style={styles.levelText}>0-29%: Bloqueado</Text>
                </View>
                <View style={styles.levelItem}>
                  <View style={[styles.levelDot, { backgroundColor: '#2196F3' }]} />
                  <Text style={styles.levelText}>30-49%: Guiado</Text>
                </View>
                <View style={styles.levelItem}>
                  <View style={[styles.levelDot, { backgroundColor: '#9C27B0' }]} />
                  <Text style={styles.levelText}>50-69%: Voz</Text>
                </View>
                <View style={styles.levelItem}>
                  <View style={[styles.levelDot, { backgroundColor: colors.success }]} />
                  <Text style={styles.levelText}>70%+: Completo</Text>
                </View>
              </View>
            </View>

            {/* Pending requests */}
            {pendingConnections.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Ionicons name="notifications" size={20} color={colors.secondary} />
                  <Text style={styles.sectionTitle}>
                    Solicitudes ({pendingConnections.length})
                  </Text>
                </View>
                {pendingConnections.map((connection) => (
                  <PendingCard
                    key={connection.id}
                    connection={connection}
                    onAccept={() => handleAccept(connection.id)}
                    onPostpone={() => handlePostpone(connection.id)}
                    onDecline={() => handleDecline(connection.id)}
                  />
                ))}
              </View>
            )}

            {/* Active nucleos */}
            {activeConnections.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Ionicons name="git-network" size={20} color={colors.primary} />
                  <Text style={styles.sectionTitle}>
                    Activos ({activeConnections.length})
                  </Text>
                </View>
                {activeConnections.map((connection) => (
                  <NucleoCard
                    key={connection.id}
                    connection={connection}
                    onPress={() => handleConnectionPress(connection.id)}
                    showCompatibility={true}
                  />
                ))}
              </View>
            )}

            {/* Waiting for response */}
            {waitingConnections.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Ionicons name="send" size={20} color={colors.textMuted} />
                  <Text style={styles.sectionTitle}>
                    Enviadas ({waitingConnections.length})
                  </Text>
                </View>
                {waitingConnections.map((connection) => (
                  <WaitingCard key={connection.id} connection={connection} />
                ))}
              </View>
            )}

            {/* Rejected connections section */}
            {rejectedConnections.length > 0 && (
              <View style={styles.section}>
                <TouchableOpacity
                  style={styles.rejectedHeader}
                  onPress={() => setShowRejected(!showRejected)}
                >
                  <View style={styles.sectionHeader}>
                    <Ionicons name="heart-dislike" size={20} color={colors.textMuted} />
                    <Text style={styles.sectionTitle}>
                      No conectaron ({rejectedConnections.length})
                    </Text>
                  </View>
                  <Ionicons
                    name={showRejected ? 'chevron-up' : 'chevron-down'}
                    size={20}
                    color={colors.textMuted}
                  />
                </TouchableOpacity>

                {showRejected && (
                  <>
                    <View style={styles.encouragementBanner}>
                      <Ionicons name="sparkles" size={20} color={colors.primary} />
                      <Text style={styles.encouragementText}>
                        No te desanimes, hay muchas personas esperando conocerte
                      </Text>
                    </View>
                    {rejectedConnections.map((connection) => (
                      <RejectedCard key={connection.id} connection={connection} />
                    ))}
                  </>
                )}
              </View>
            )}

            {/* Empty state */}
            {connections.length === 0 && (
              <View style={styles.emptyContainer}>
                <Ionicons name="git-network-outline" size={64} color={colors.textMuted} />
                <Text style={styles.emptyTitle}>Sin nucleos aun</Text>
                <Text style={styles.emptyText}>
                  Entra a un portal y crea conexiones con personas que comparten tus intereses
                </Text>
                <TouchableOpacity
                  style={styles.emptyButton}
                  onPress={() => router.push('/(tabs)')}
                >
                  <Text style={styles.emptyButtonText}>Explorar portales</Text>
                </TouchableOpacity>
              </View>
            )}
          </>
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
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.md,
  },
  loadingText: {
    color: colors.textSecondary,
    fontSize: fontSize.md,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  header: {
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
  },
  title: {
    color: colors.text,
    fontSize: fontSize.xxxl,
    fontWeight: fontWeight.bold,
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: fontSize.md,
    marginTop: spacing.xs,
  },
  // Tabs
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: colors.backgroundCard,
    borderRadius: borderRadius.lg,
    padding: spacing.xs,
    marginBottom: spacing.lg,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xs,
    borderRadius: borderRadius.md,
    gap: spacing.xs,
  },
  tabActive: {
    backgroundColor: colors.backgroundLight,
  },
  tabText: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
  },
  tabTextActive: {
    color: colors.text,
  },
  tabBadge: {
    backgroundColor: colors.secondary,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  tabBadgeText: {
    color: '#FFF',
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
  },
  // Info card
  infoCard: {
    backgroundColor: colors.backgroundCard,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  infoTitle: {
    color: colors.text,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    marginBottom: spacing.sm,
  },
  levelsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  levelItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    width: '48%',
  },
  levelDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  levelText: {
    color: colors.textSecondary,
    fontSize: fontSize.xs,
  },
  // Sections
  section: {
    marginBottom: spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
  },
  sectionDescription: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
    marginBottom: spacing.md,
  },
  // Nucleo Card styles
  nucleoCard: {
    backgroundColor: colors.backgroundCard,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
  },
  progressBarContainer: {
    height: 24,
    backgroundColor: colors.backgroundLight,
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressBar: {
    height: '100%',
    backgroundColor: colors.primary,
  },
  progressText: {
    position: 'absolute',
    right: spacing.sm,
    color: colors.text,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
  },
  nucleoContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
  },
  photoContainer: {
    position: 'relative',
  },
  photo: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  temperatureEmoji: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    fontSize: 16,
  },
  nucleoInfo: {
    flex: 1,
    marginLeft: spacing.md,
  },
  nucleoName: {
    color: colors.text,
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
  },
  compatibilityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: 2,
  },
  compatibilityScore: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
  },
  compatibilityLabel: {
    fontSize: fontSize.sm,
  },
  chatLevelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: 2,
  },
  chatLevelDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  chatLevelText: {
    fontSize: fontSize.sm,
  },
  turnIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.xs,
    paddingVertical: 2,
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.sm,
    alignSelf: 'flex-start',
  },
  turnIndicatorActive: {
    backgroundColor: colors.primary + '20',
  },
  turnIndicatorWaiting: {
    backgroundColor: colors.backgroundLight,
  },
  turnText: {
    fontSize: fontSize.xs,
  },
  turnTextActive: {
    color: colors.primary,
    fontWeight: fontWeight.medium,
  },
  turnTextWaiting: {
    color: colors.textMuted,
  },
  missionHint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
  },
  missionHintText: {
    color: colors.primary,
    fontSize: fontSize.sm,
  },
  // Pending Card styles
  pendingCard: {
    backgroundColor: colors.backgroundCard,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.secondary + '40',
  },
  pendingPhoto: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  pendingInfo: {
    flex: 1,
    marginLeft: spacing.md,
  },
  pendingName: {
    color: colors.text,
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
  },
  pendingText: {
    color: colors.secondary,
    fontSize: fontSize.sm,
  },
  pendingCompatibility: {
    marginTop: 2,
  },
  pendingCompatibilityText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
  },
  pendingActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  declineBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.backgroundLight,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.error,
  },
  postponeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.backgroundLight,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.warning,
  },
  acceptBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.success,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Later Card styles
  laterCard: {
    backgroundColor: colors.backgroundCard,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.warning + '40',
  },
  laterPhoto: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  laterInfo: {
    flex: 1,
    marginLeft: spacing.md,
  },
  laterName: {
    color: colors.text,
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
  },
  laterStatusText: {
    color: colors.warning,
    fontSize: fontSize.sm,
  },
  laterCompatibility: {
    fontSize: fontSize.xs,
    marginTop: 2,
  },
  laterActions: {
    flexDirection: 'row',
    gap: spacing.sm,
    alignItems: 'center',
  },
  laterDeclineBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.backgroundLight,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.error,
  },
  laterAcceptBtn: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
  },
  laterAcceptText: {
    color: '#FFF',
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
  },
  // Waiting Card styles
  waitingCard: {
    backgroundColor: colors.backgroundCard,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  waitingPhoto: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  waitingInfo: {
    flex: 1,
    marginLeft: spacing.md,
  },
  waitingName: {
    color: colors.text,
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
  },
  waitingStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: 2,
  },
  waitingText: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
  },
  waitingSeenText: {
    color: colors.primary,
    fontSize: fontSize.sm,
  },
  waitingCompatibility: {
    color: colors.textSecondary,
    fontSize: fontSize.xs,
    marginTop: 2,
  },
  // Empty states
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: spacing.xxl * 2,
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
    textAlign: 'center',
    marginTop: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  emptyButton: {
    marginTop: spacing.lg,
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: borderRadius.md,
  },
  emptyButtonText: {
    color: '#FFF',
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
  },
  emptyTabContainer: {
    alignItems: 'center',
    paddingVertical: spacing.xxl,
  },
  emptyTabTitle: {
    color: colors.text,
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    marginTop: spacing.md,
  },
  emptyTabText: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
    textAlign: 'center',
    marginTop: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  // Rejected connections styles
  rejectedHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rejectedCard: {
    backgroundColor: colors.backgroundCard,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
    opacity: 0.7,
  },
  rejectedPhoto: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.backgroundLight,
  },
  rejectedInfo: {
    flex: 1,
    marginLeft: spacing.md,
  },
  rejectedName: {
    color: colors.textMuted,
    fontSize: fontSize.md,
    fontWeight: fontWeight.medium,
  },
  rejectedText: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
  },
  encouragementBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary + '15',
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  encouragementText: {
    flex: 1,
    color: colors.primary,
    fontSize: fontSize.sm,
  },
});
