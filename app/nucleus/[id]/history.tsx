import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Image,
} from 'react-native';
import { useLocalSearchParams, Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../../../src/services/api';
import { colors, fontSize, fontWeight, spacing, borderRadius, shadows } from '../../../src/utils/theme';

interface CategoryResponse {
  category: string;
  responses: {
    questionText: string;
    questionType: string;
    userResponse: any;
    otherResponse: any | null;
    bothAnswered: boolean;
  }[];
}

interface HistoryData {
  categories: CategoryResponse[];
  photos: {
    userPhoto: { photoUrl: string; prompt: string } | null;
    otherPhoto: { photoUrl: string; prompt: string } | null;
  };
  voice: {
    userVoice: { audioUrl: string; duration: number; prompt: string } | null;
    otherVoice: { audioUrl: string; duration: number; prompt: string } | null;
  };
}

const getCategoryIcon = (category: string): string => {
  const icons: Record<string, string> = {
    musica: 'musical-notes',
    fotografia: 'camera',
    viajes: 'airplane',
    deportes: 'fitness',
    cocina: 'restaurant',
    cine: 'film',
    libros: 'book',
    arte: 'color-palette',
    naturaleza: 'leaf',
    tecnologia: 'laptop',
    general: 'sparkles',
  };
  return icons[category] || 'help-circle';
};

const getCategoryColor = (category: string): string => {
  const categoryColors: Record<string, string> = {
    musica: '#9C27B0',
    fotografia: '#E91E63',
    viajes: '#2196F3',
    deportes: '#4CAF50',
    cocina: '#FF9800',
    cine: '#F44336',
    libros: '#795548',
    arte: '#FF5722',
    naturaleza: '#8BC34A',
    tecnologia: '#00BCD4',
    general: '#607D8B',
  };
  return categoryColors[category] || colors.primary;
};

export default function HistoryScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [historyData, setHistoryData] = useState<HistoryData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);

  useEffect(() => {
    loadHistoryData();
  }, [id]);

  const loadHistoryData = async () => {
    try {
      const response = await api.get(`/nucleus/${id}/history`);
      setHistoryData(response.data);
    } catch (error) {
      console.error('Error loading history:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatResponse = (response: any, type: string): string => {
    if (!response) return '-';

    if (typeof response === 'string') {
      return response;
    }

    if (type === 'THIS_OR_THAT' && typeof response === 'object') {
      return Object.entries(response)
        .map(([, value]) => value)
        .join(', ');
    }

    if (type === 'RANKING' && Array.isArray(response)) {
      return response.map((item, i) => `${i + 1}. ${item}`).join('\n');
    }

    if (Array.isArray(response)) {
      return response.join(', ');
    }

    return JSON.stringify(response);
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <Stack.Screen
          options={{
            headerShown: true,
            headerTitle: 'Historial',
            headerStyle: { backgroundColor: colors.background },
            headerTintColor: colors.text,
            headerBackVisible: true,
          }}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (!historyData) {
    return (
      <SafeAreaView style={styles.container}>
        <Stack.Screen
          options={{
            headerShown: true,
            headerTitle: 'Historial',
            headerStyle: { backgroundColor: colors.background },
            headerTintColor: colors.text,
            headerBackVisible: true,
          }}
        />
        <View style={styles.emptyContainer}>
          <Ionicons name="time-outline" size={64} color={colors.textMuted} />
          <Text style={styles.emptyText}>Aun no hay historial</Text>
          <Text style={styles.emptySubtext}>
            Completa actividades del nucleo para ver tus respuestas aqui
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const hasAnyContent =
    historyData.categories.length > 0 ||
    historyData.photos.userPhoto ||
    historyData.photos.otherPhoto ||
    historyData.voice.userVoice ||
    historyData.voice.otherVoice;

  if (!hasAnyContent) {
    return (
      <SafeAreaView style={styles.container}>
        <Stack.Screen
          options={{
            headerShown: true,
            headerTitle: 'Historial',
            headerStyle: { backgroundColor: colors.background },
            headerTintColor: colors.text,
            headerBackVisible: true,
          }}
        />
        <View style={styles.emptyContainer}>
          <Ionicons name="time-outline" size={64} color={colors.textMuted} />
          <Text style={styles.emptyText}>Aun no hay historial</Text>
          <Text style={styles.emptySubtext}>
            Completa actividades del nucleo para ver tus respuestas aqui
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <Stack.Screen
        options={{
          headerShown: true,
          headerTitle: 'Historial',
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.text,
          headerBackVisible: true,
        }}
      />

      <ScrollView style={styles.content} contentContainerStyle={styles.contentInner}>
        {/* Categories */}
        {historyData.categories.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Preguntas</Text>
            {historyData.categories.map((cat) => (
              <View key={cat.category} style={styles.categorySection}>
                <TouchableOpacity
                  style={styles.categoryHeader}
                  onPress={() => setExpandedCategory(
                    expandedCategory === cat.category ? null : cat.category
                  )}
                >
                  <View style={[styles.categoryIcon, { backgroundColor: getCategoryColor(cat.category) + '20' }]}>
                    <Ionicons
                      name={getCategoryIcon(cat.category) as any}
                      size={20}
                      color={getCategoryColor(cat.category)}
                    />
                  </View>
                  <Text style={styles.categoryName}>{cat.category}</Text>
                  <Text style={styles.categoryCount}>{cat.responses.length} respuestas</Text>
                  <Ionicons
                    name={expandedCategory === cat.category ? 'chevron-up' : 'chevron-down'}
                    size={20}
                    color={colors.textMuted}
                  />
                </TouchableOpacity>

                {expandedCategory === cat.category && (
                  <View style={styles.responsesContainer}>
                    {cat.responses.map((resp, index) => (
                      <View key={index} style={styles.responseCard}>
                        <Text style={styles.questionText}>{resp.questionText}</Text>

                        <View style={styles.responsesRow}>
                          <View style={styles.responseBox}>
                            <Text style={styles.responseLabel}>Tu</Text>
                            <Text style={styles.responseText}>
                              {formatResponse(resp.userResponse, resp.questionType)}
                            </Text>
                          </View>

                          {resp.bothAnswered && resp.otherResponse && (
                            <View style={styles.responseBox}>
                              <Text style={styles.responseLabel}>Su respuesta</Text>
                              <Text style={styles.responseText}>
                                {formatResponse(resp.otherResponse, resp.questionType)}
                              </Text>
                            </View>
                          )}
                        </View>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            ))}
          </View>
        )}

        {/* Photos */}
        {(historyData.photos.userPhoto || historyData.photos.otherPhoto) && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Fotos Instantaneas</Text>
            <View style={styles.photosGrid}>
              {historyData.photos.userPhoto && (
                <View style={styles.photoCard}>
                  <Text style={styles.photoLabel}>Tu foto</Text>
                  <Image
                    source={{ uri: historyData.photos.userPhoto.photoUrl }}
                    style={styles.photoImage}
                  />
                  <Text style={styles.photoPrompt}>{historyData.photos.userPhoto.prompt}</Text>
                </View>
              )}
              {historyData.photos.otherPhoto && (
                <View style={styles.photoCard}>
                  <Text style={styles.photoLabel}>Su foto</Text>
                  <Image
                    source={{ uri: historyData.photos.otherPhoto.photoUrl }}
                    style={styles.photoImage}
                  />
                  <Text style={styles.photoPrompt}>{historyData.photos.otherPhoto.prompt}</Text>
                </View>
              )}
            </View>
          </View>
        )}

        {/* Voice Notes */}
        {(historyData.voice.userVoice || historyData.voice.otherVoice) && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Notas de Voz</Text>
            <View style={styles.voiceGrid}>
              {historyData.voice.userVoice && (
                <View style={styles.voiceCard}>
                  <Ionicons name="mic" size={24} color="#9C27B0" />
                  <Text style={styles.voiceLabel}>Tu nota</Text>
                  <Text style={styles.voiceDuration}>
                    {Math.floor(historyData.voice.userVoice.duration / 60)}:
                    {(historyData.voice.userVoice.duration % 60).toString().padStart(2, '0')}
                  </Text>
                  <Text style={styles.voicePrompt}>{historyData.voice.userVoice.prompt}</Text>
                </View>
              )}
              {historyData.voice.otherVoice && (
                <View style={styles.voiceCard}>
                  <Ionicons name="mic" size={24} color="#9C27B0" />
                  <Text style={styles.voiceLabel}>Su nota</Text>
                  <Text style={styles.voiceDuration}>
                    {Math.floor(historyData.voice.otherVoice.duration / 60)}:
                    {(historyData.voice.otherVoice.duration % 60).toString().padStart(2, '0')}
                  </Text>
                  <Text style={styles.voicePrompt}>{historyData.voice.otherVoice.prompt}</Text>
                </View>
              )}
            </View>
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
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
    gap: spacing.md,
  },
  emptyText: {
    color: colors.text,
    fontSize: fontSize.xl,
    fontWeight: fontWeight.semibold,
  },
  emptySubtext: {
    color: colors.textMuted,
    fontSize: fontSize.md,
    textAlign: 'center',
  },
  content: {
    flex: 1,
  },
  contentInner: {
    padding: spacing.lg,
    gap: spacing.xl,
  },
  section: {
    gap: spacing.md,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
  },
  categorySection: {
    backgroundColor: colors.backgroundCard,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    gap: spacing.sm,
  },
  categoryIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryName: {
    color: colors.text,
    fontSize: fontSize.md,
    fontWeight: fontWeight.medium,
    textTransform: 'capitalize',
    flex: 1,
  },
  categoryCount: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
  },
  responsesContainer: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    padding: spacing.md,
    gap: spacing.md,
  },
  responseCard: {
    backgroundColor: colors.backgroundLight,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    gap: spacing.sm,
  },
  questionText: {
    color: colors.text,
    fontSize: fontSize.md,
    fontWeight: fontWeight.medium,
  },
  responsesRow: {
    gap: spacing.sm,
  },
  responseBox: {
    backgroundColor: colors.backgroundCard,
    borderRadius: borderRadius.sm,
    padding: spacing.sm,
  },
  responseLabel: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
    marginBottom: spacing.xs,
  },
  responseText: {
    color: colors.text,
    fontSize: fontSize.sm,
  },
  photosGrid: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  photoCard: {
    flex: 1,
    backgroundColor: colors.backgroundCard,
    borderRadius: borderRadius.lg,
    padding: spacing.sm,
    gap: spacing.sm,
  },
  photoLabel: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    textAlign: 'center',
  },
  photoImage: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: borderRadius.md,
    backgroundColor: colors.backgroundLight,
  },
  photoPrompt: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  voiceGrid: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  voiceCard: {
    flex: 1,
    backgroundColor: colors.backgroundCard,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    alignItems: 'center',
    gap: spacing.xs,
  },
  voiceLabel: {
    color: colors.text,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
  },
  voiceDuration: {
    color: colors.textSecondary,
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
  },
  voicePrompt: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});
