import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../../../src/services/api';
import { useNucleusStore } from '../../../src/store/nucleus.store';
import { colors, fontSize, fontWeight, spacing, borderRadius, shadows } from '../../../src/utils/theme';

interface Game {
  type: 'GUESS_ANSWER' | 'COMPLETE_PHRASE' | 'TRUTH_OR_LIE';
  name: string;
  description: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';
  gameId?: string;
}

interface GameData {
  games: Game[];
  completed: number;
  total: number;
}

interface ActiveGame {
  gameId: string;
  type: string;
  questions?: any[];
  phrases?: any[];
  statements?: any[];
  userStatements?: string[];
  otherUserReady?: boolean;
}

export default function GamesScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { loadOverview } = useNucleusStore();

  const [gamesData, setGamesData] = useState<GameData | null>(null);
  const [activeGame, setActiveGame] = useState<ActiveGame | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isStarting, setIsStarting] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Game state
  const [guessAnswers, setGuessAnswers] = useState<Record<string, string>>({});
  const [phraseAnswers, setPhraseAnswers] = useState<Record<string, string>>({});
  const [truthStatements, setTruthStatements] = useState(['', '', '']);
  const [selectedLie, setSelectedLie] = useState<number | null>(null);

  useEffect(() => {
    loadGamesData();
  }, [id]);

  const loadGamesData = async () => {
    try {
      const response = await api.get(`/nucleus/${id}/games`);
      setGamesData(response.data);
    } catch (error) {
      console.error('Error loading games:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const startGame = async (gameType: string) => {
    setIsStarting(true);
    try {
      const response = await api.post(`/nucleus/${id}/games/${gameType}/start`);
      setActiveGame(response.data);
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.error || 'No se pudo iniciar el juego');
    } finally {
      setIsStarting(false);
    }
  };

  const submitGuessAnswers = async () => {
    if (!activeGame) return;

    setIsSubmitting(true);
    try {
      await api.post(`/nucleus/${id}/games/${activeGame.gameId}/answers`, {
        answers: guessAnswers,
      });
      await loadGamesData();
      await loadOverview(id!);
      setActiveGame(null);
      setGuessAnswers({});
      Alert.alert('Completado!', 'Tus respuestas han sido enviadas');
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.error || 'No se pudo enviar');
    } finally {
      setIsSubmitting(false);
    }
  };

  const submitPhraseAnswers = async () => {
    if (!activeGame) return;

    setIsSubmitting(true);
    try {
      await api.post(`/nucleus/${id}/games/${activeGame.gameId}/answers`, {
        answers: phraseAnswers,
      });
      await loadGamesData();
      await loadOverview(id!);
      setActiveGame(null);
      setPhraseAnswers({});
      Alert.alert('Completado!', 'Tus respuestas han sido enviadas');
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.error || 'No se pudo enviar');
    } finally {
      setIsSubmitting(false);
    }
  };

  const submitTruthStatements = async () => {
    if (!activeGame || truthStatements.some(s => !s.trim())) return;

    setIsSubmitting(true);
    try {
      await api.post(`/nucleus/${id}/games/${activeGame.gameId}/truth-or-lie`, {
        statements: truthStatements,
        lieIndex: 2, // By convention, the third is always the lie for now
      });
      await loadGamesData();
      setActiveGame(null);
      setTruthStatements(['', '', '']);
      Alert.alert('Enviado!', 'Ahora espera a que adivine cual es la mentira');
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.error || 'No se pudo enviar');
    } finally {
      setIsSubmitting(false);
    }
  };

  const guessTheLie = async () => {
    if (!activeGame || selectedLie === null) return;

    setIsSubmitting(true);
    try {
      const response = await api.post(`/nucleus/${id}/games/${activeGame.gameId}/guess-lie`, {
        guessIndex: selectedLie,
      });
      await loadGamesData();
      await loadOverview(id!);
      setActiveGame(null);
      setSelectedLie(null);

      if (response.data.correct) {
        Alert.alert('Correcto!', 'Adivinaste la mentira!');
      } else {
        Alert.alert('Incorrecto', `La mentira era: "${response.data.correctStatement}"`);
      }
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.error || 'No se pudo enviar');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getGameEmoji = (type: string): string => {
    switch (type) {
      case 'GUESS_ANSWER': return '🎯';
      case 'COMPLETE_PHRASE': return '✍️';
      case 'TRUTH_OR_LIE': return '🤥';
      default: return '🎮';
    }
  };

  const getGameColor = (type: string): string => {
    switch (type) {
      case 'GUESS_ANSWER': return '#2196F3';
      case 'COMPLETE_PHRASE': return '#4CAF50';
      case 'TRUTH_OR_LIE': return '#FF9800';
      default: return colors.primary;
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <Stack.Screen
          options={{
            headerShown: true,
            headerTitle: 'Mini Juegos',
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

  // Render active game
  if (activeGame) {
    // Guess Answer Game
    if (activeGame.type === 'GUESS_ANSWER' && activeGame.questions) {
      return (
        <SafeAreaView style={styles.container} edges={['bottom']}>
          <Stack.Screen
            options={{
              headerShown: true,
              headerTitle: 'Adivina la Respuesta',
              headerStyle: { backgroundColor: colors.background },
              headerTintColor: colors.text,
              headerLeft: () => (
                <TouchableOpacity onPress={() => setActiveGame(null)}>
                  <Ionicons name="close" size={24} color={colors.text} />
                </TouchableOpacity>
              ),
            }}
          />
          <ScrollView style={styles.gameContent} contentContainerStyle={styles.gameContentInner}>
            <Text style={styles.gameInstructions}>
              Adivina que respondio la otra persona a estas preguntas
            </Text>

            {activeGame.questions.map((q: any, index: number) => (
              <View key={q.questionId} style={styles.gameQuestion}>
                <Text style={styles.gameQuestionText}>{q.questionText}</Text>
                <View style={styles.guessOptions}>
                  {q.options.map((option: string, optIndex: number) => (
                    <TouchableOpacity
                      key={optIndex}
                      style={[
                        styles.guessOption,
                        guessAnswers[q.questionId] === option && styles.guessOptionSelected,
                      ]}
                      onPress={() => setGuessAnswers({ ...guessAnswers, [q.questionId]: option })}
                    >
                      <Text style={[
                        styles.guessOptionText,
                        guessAnswers[q.questionId] === option && styles.guessOptionTextSelected,
                      ]}>
                        {option}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            ))}

            <TouchableOpacity
              style={[
                styles.submitGameButton,
                Object.keys(guessAnswers).length < activeGame.questions.length && styles.submitGameButtonDisabled,
              ]}
              onPress={submitGuessAnswers}
              disabled={Object.keys(guessAnswers).length < activeGame.questions.length || isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator size="small" color={colors.text} />
              ) : (
                <Text style={styles.submitGameButtonText}>Enviar respuestas</Text>
              )}
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      );
    }

    // Complete Phrase Game
    if (activeGame.type === 'COMPLETE_PHRASE' && activeGame.phrases) {
      return (
        <SafeAreaView style={styles.container} edges={['bottom']}>
          <Stack.Screen
            options={{
              headerShown: true,
              headerTitle: 'Completa la Frase',
              headerStyle: { backgroundColor: colors.background },
              headerTintColor: colors.text,
              headerLeft: () => (
                <TouchableOpacity onPress={() => setActiveGame(null)}>
                  <Ionicons name="close" size={24} color={colors.text} />
                </TouchableOpacity>
              ),
            }}
          />
          <ScrollView style={styles.gameContent} contentContainerStyle={styles.gameContentInner}>
            <Text style={styles.gameInstructions}>
              Completa estas frases sobre la otra persona
            </Text>

            {activeGame.phrases.map((phrase: any, index: number) => (
              <View key={index} style={styles.gameQuestion}>
                <Text style={styles.phraseText}>{phrase.phrase}</Text>
                <TextInput
                  style={styles.phraseInput}
                  placeholder="Tu respuesta..."
                  placeholderTextColor={colors.textMuted}
                  value={phraseAnswers[index.toString()] || ''}
                  onChangeText={(text) => setPhraseAnswers({ ...phraseAnswers, [index.toString()]: text })}
                />
              </View>
            ))}

            <TouchableOpacity
              style={[
                styles.submitGameButton,
                { backgroundColor: '#4CAF50' },
                Object.keys(phraseAnswers).length < activeGame.phrases.length && styles.submitGameButtonDisabled,
              ]}
              onPress={submitPhraseAnswers}
              disabled={Object.keys(phraseAnswers).length < activeGame.phrases.length || isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator size="small" color={colors.text} />
              ) : (
                <Text style={styles.submitGameButtonText}>Enviar</Text>
              )}
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      );
    }

    // Truth or Lie Game - Creating statements
    if (activeGame.type === 'TRUTH_OR_LIE' && !activeGame.statements) {
      return (
        <SafeAreaView style={styles.container} edges={['bottom']}>
          <Stack.Screen
            options={{
              headerShown: true,
              headerTitle: '2 Verdades y 1 Mentira',
              headerStyle: { backgroundColor: colors.background },
              headerTintColor: colors.text,
              headerLeft: () => (
                <TouchableOpacity onPress={() => setActiveGame(null)}>
                  <Ionicons name="close" size={24} color={colors.text} />
                </TouchableOpacity>
              ),
            }}
          />
          <ScrollView style={styles.gameContent} contentContainerStyle={styles.gameContentInner}>
            <Text style={styles.gameInstructions}>
              Escribe 2 verdades y 1 mentira sobre ti. La otra persona tendra que adivinar cual es la mentira!
            </Text>

            {[0, 1, 2].map((index) => (
              <View key={index} style={styles.statementInput}>
                <View style={styles.statementHeader}>
                  <Text style={styles.statementNumber}>{index + 1}</Text>
                  <Text style={styles.statementLabel}>
                    {index < 2 ? 'Verdad' : 'Mentira'}
                  </Text>
                </View>
                <TextInput
                  style={styles.phraseInput}
                  placeholder={index < 2 ? 'Escribe una verdad...' : 'Escribe una mentira...'}
                  placeholderTextColor={colors.textMuted}
                  value={truthStatements[index]}
                  onChangeText={(text) => {
                    const newStatements = [...truthStatements];
                    newStatements[index] = text;
                    setTruthStatements(newStatements);
                  }}
                  multiline
                />
              </View>
            ))}

            <TouchableOpacity
              style={[
                styles.submitGameButton,
                { backgroundColor: '#FF9800' },
                truthStatements.some(s => !s.trim()) && styles.submitGameButtonDisabled,
              ]}
              onPress={submitTruthStatements}
              disabled={truthStatements.some(s => !s.trim()) || isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator size="small" color={colors.text} />
              ) : (
                <Text style={styles.submitGameButtonText}>Enviar</Text>
              )}
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      );
    }

    // Truth or Lie Game - Guessing
    if (activeGame.type === 'TRUTH_OR_LIE' && activeGame.statements) {
      return (
        <SafeAreaView style={styles.container} edges={['bottom']}>
          <Stack.Screen
            options={{
              headerShown: true,
              headerTitle: 'Adivina la Mentira',
              headerStyle: { backgroundColor: colors.background },
              headerTintColor: colors.text,
              headerLeft: () => (
                <TouchableOpacity onPress={() => setActiveGame(null)}>
                  <Ionicons name="close" size={24} color={colors.text} />
                </TouchableOpacity>
              ),
            }}
          />
          <ScrollView style={styles.gameContent} contentContainerStyle={styles.gameContentInner}>
            <Text style={styles.gameInstructions}>
              Cual de estas afirmaciones es la mentira?
            </Text>

            {activeGame.statements.map((statement: string, index: number) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.statementOption,
                  selectedLie === index && styles.statementOptionSelected,
                ]}
                onPress={() => setSelectedLie(index)}
              >
                <Text style={styles.statementOptionNumber}>{index + 1}</Text>
                <Text style={[
                  styles.statementOptionText,
                  selectedLie === index && styles.statementOptionTextSelected,
                ]}>
                  {statement}
                </Text>
                {selectedLie === index && (
                  <Ionicons name="checkmark-circle" size={24} color="#FF9800" />
                )}
              </TouchableOpacity>
            ))}

            <TouchableOpacity
              style={[
                styles.submitGameButton,
                { backgroundColor: '#FF9800' },
                selectedLie === null && styles.submitGameButtonDisabled,
              ]}
              onPress={guessTheLie}
              disabled={selectedLie === null || isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator size="small" color={colors.text} />
              ) : (
                <Text style={styles.submitGameButtonText}>Esta es la mentira!</Text>
              )}
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      );
    }
  }

  // Games list
  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <Stack.Screen
        options={{
          headerShown: true,
          headerTitle: 'Mini Juegos',
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.text,
          headerBackVisible: true,
        }}
      />

      <ScrollView style={styles.content} contentContainerStyle={styles.contentInner}>
        <View style={styles.progressBanner}>
          <Text style={styles.progressText}>
            {gamesData?.completed || 0} de {gamesData?.total || 3} juegos completados
          </Text>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressBarFill,
                { width: `${((gamesData?.completed || 0) / (gamesData?.total || 3)) * 100}%` },
              ]}
            />
          </View>
        </View>

        <View style={styles.gamesGrid}>
          {gamesData?.games.map((game) => (
            <TouchableOpacity
              key={game.type}
              style={[
                styles.gameCard,
                game.status === 'COMPLETED' && styles.gameCardCompleted,
              ]}
              onPress={() => game.status !== 'COMPLETED' && startGame(game.type)}
              disabled={game.status === 'COMPLETED' || isStarting}
            >
              <View style={[styles.gameIcon, { backgroundColor: getGameColor(game.type) + '20' }]}>
                <Text style={styles.gameEmoji}>{getGameEmoji(game.type)}</Text>
              </View>
              <Text style={styles.gameName}>{game.name}</Text>
              <Text style={styles.gameDescription}>{game.description}</Text>

              {game.status === 'COMPLETED' ? (
                <View style={styles.completedBadge}>
                  <Ionicons name="checkmark-circle" size={16} color={colors.success} />
                  <Text style={styles.completedBadgeText}>Completado</Text>
                </View>
              ) : game.status === 'IN_PROGRESS' ? (
                <View style={[styles.statusBadge, { backgroundColor: '#FF9800' + '20' }]}>
                  <Text style={[styles.statusBadgeText, { color: '#FF9800' }]}>En progreso</Text>
                </View>
              ) : (
                <View style={[styles.playButton, { backgroundColor: getGameColor(game.type) }]}>
                  {isStarting ? (
                    <ActivityIndicator size="small" color={colors.text} />
                  ) : (
                    <>
                      <Text style={styles.playButtonText}>Jugar</Text>
                      <Ionicons name="play" size={16} color={colors.text} />
                    </>
                  )}
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>
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
  content: {
    flex: 1,
  },
  contentInner: {
    padding: spacing.lg,
    gap: spacing.lg,
  },
  progressBanner: {
    backgroundColor: colors.backgroundCard,
    padding: spacing.lg,
    borderRadius: borderRadius.xl,
    gap: spacing.sm,
  },
  progressText: {
    color: colors.text,
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    textAlign: 'center',
  },
  progressBar: {
    height: 8,
    backgroundColor: colors.border,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: colors.success,
    borderRadius: 4,
  },
  gamesGrid: {
    gap: spacing.md,
  },
  gameCard: {
    backgroundColor: colors.backgroundCard,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    alignItems: 'center',
    gap: spacing.sm,
    ...shadows.md,
  },
  gameCardCompleted: {
    opacity: 0.7,
  },
  gameIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  gameEmoji: {
    fontSize: 32,
  },
  gameName: {
    color: colors.text,
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
  },
  gameDescription: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
    textAlign: 'center',
  },
  completedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.sm,
  },
  completedBadgeText: {
    color: colors.success,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
  },
  statusBadge: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    marginTop: spacing.sm,
  },
  statusBadgeText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
  },
  playButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    gap: spacing.xs,
    marginTop: spacing.sm,
  },
  playButtonText: {
    color: colors.text,
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
  },
  gameContent: {
    flex: 1,
  },
  gameContentInner: {
    padding: spacing.lg,
    gap: spacing.lg,
  },
  gameInstructions: {
    color: colors.textSecondary,
    fontSize: fontSize.md,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  gameQuestion: {
    backgroundColor: colors.backgroundCard,
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    gap: spacing.md,
  },
  gameQuestionText: {
    color: colors.text,
    fontSize: fontSize.md,
    fontWeight: fontWeight.medium,
  },
  guessOptions: {
    gap: spacing.sm,
  },
  guessOption: {
    backgroundColor: colors.backgroundLight,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  guessOptionSelected: {
    borderColor: '#2196F3',
    backgroundColor: '#2196F3' + '20',
  },
  guessOptionText: {
    color: colors.text,
    fontSize: fontSize.md,
    textAlign: 'center',
  },
  guessOptionTextSelected: {
    color: '#2196F3',
    fontWeight: fontWeight.semibold,
  },
  phraseText: {
    color: colors.text,
    fontSize: fontSize.lg,
    fontWeight: fontWeight.medium,
  },
  phraseInput: {
    backgroundColor: colors.backgroundLight,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    color: colors.text,
    fontSize: fontSize.md,
    minHeight: 60,
  },
  submitGameButton: {
    backgroundColor: '#2196F3',
    padding: spacing.lg,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    marginTop: spacing.md,
  },
  submitGameButtonDisabled: {
    opacity: 0.5,
  },
  submitGameButtonText: {
    color: colors.text,
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
  },
  statementInput: {
    backgroundColor: colors.backgroundCard,
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    gap: spacing.sm,
  },
  statementHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  statementNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FF9800',
    color: colors.text,
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    textAlign: 'center',
    lineHeight: 28,
  },
  statementLabel: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
  },
  statementOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.backgroundCard,
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    gap: spacing.md,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  statementOptionSelected: {
    borderColor: '#FF9800',
    backgroundColor: '#FF9800' + '10',
  },
  statementOptionNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.backgroundLight,
    color: colors.text,
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    textAlign: 'center',
    lineHeight: 32,
  },
  statementOptionText: {
    flex: 1,
    color: colors.text,
    fontSize: fontSize.md,
  },
  statementOptionTextSelected: {
    fontWeight: fontWeight.medium,
  },
});
