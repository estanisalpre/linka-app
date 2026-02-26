import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Animated,
} from "react-native";
import { useLocalSearchParams, useRouter, Stack } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useNucleusStore } from "../../../../src/store/nucleus.store";
import {
  getSocket,
  joinConnection,
  leaveConnection,
} from "../../../../src/services/socket";
import {
  colors,
  fontSize,
  fontWeight,
  spacing,
  borderRadius,
  shadows,
} from "../../../../src/utils/theme";

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

export default function CategoryQuestionsScreen() {
  const { id, category } = useLocalSearchParams<{
    id: string;
    category: string;
  }>();
  const router = useRouter();
  const { currentCategory, isLoading, loadCategoryQuestions, submitAnswer } =
    useNucleusStore();

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [textResponse, setTextResponse] = useState("");
  const [thisOrThatAnswers, setThisOrThatAnswers] = useState<
    Record<number, string>
  >({});
  const [selectedChoice, setSelectedChoice] = useState<string | null>(null);
  const [rankingOrder, setRankingOrder] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const dotsFlashAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!id || !category) return;
    loadCategoryQuestions(id, category);
    joinConnection(id);
    return () => {
      leaveConnection(id);
    };
  }, [id, category]);

  useEffect(() => {
    // Find first unanswered question
    if (currentCategory?.questions) {
      const firstUnanswered = currentCategory.questions.findIndex(
        (q) => !q.userResponse,
      );
      if (firstUnanswered !== -1) {
        setCurrentQuestionIndex(firstUnanswered);
      }
    }
  }, [currentCategory]);

  useEffect(() => {
    // Reset state when question changes
    setTextResponse("");
    setThisOrThatAnswers({});
    setSelectedChoice(null);
    setRankingOrder([]);
  }, [currentQuestionIndex]);

  // Socket listener: reload when the other user answers a question
  useEffect(() => {
    if (!id || !category) return;
    const socket = getSocket();
    if (!socket) return;

    const handleNucleusUpdated = (data: { connectionId: string }) => {
      if (data.connectionId === id) {
        loadCategoryQuestions(id, category);
        // Flash the progress dots to signal the other user answered
        Animated.sequence([
          Animated.timing(dotsFlashAnim, {
            toValue: 1.15,
            duration: 180,
            useNativeDriver: true,
          }),
          Animated.timing(dotsFlashAnim, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
        ]).start();
      }
    };

    socket.on("nucleus:updated", handleNucleusUpdated);
    return () => {
      socket.off("nucleus:updated", handleNucleusUpdated);
    };
  }, [id, category]);

  const formatResponse = (response: any, type: string): string => {
    if (!response) return "-";
    if (typeof response === "string") return response;
    if (type === "THIS_OR_THAT" && typeof response === "object") {
      return Object.entries(response)
        .map(([, v]) => v)
        .join(", ");
    }
    if (type === "RANKING" && Array.isArray(response)) {
      return response.map((item, i) => `${i + 1}. ${item}`).join("  ·  ");
    }
    if (Array.isArray(response)) return response.join(", ");
    return JSON.stringify(response);
  };

  if (isLoading && !currentCategory) {
    return (
      <SafeAreaView style={styles.container}>
        <Stack.Screen
          options={{
            headerShown: true,
            headerTitle: category
              ? category.charAt(0).toUpperCase() + category.slice(1)
              : "Preguntas",
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

  if (!currentCategory || !currentCategory.questions.length) {
    return (
      <SafeAreaView style={styles.container}>
        <Stack.Screen
          options={{
            headerShown: true,
            headerTitle: category
              ? category.charAt(0).toUpperCase() + category.slice(1)
              : "Preguntas",
            headerStyle: { backgroundColor: colors.background },
            headerTintColor: colors.text,
            headerBackVisible: true,
          }}
        />
        <View style={styles.emptyContainer}>
          <Ionicons
            name="help-circle-outline"
            size={64}
            color={colors.textMuted}
          />
          <Text style={styles.emptyText}>No hay preguntas disponibles</Text>
        </View>
      </SafeAreaView>
    );
  }

  const currentQuestion = currentCategory.questions[currentQuestionIndex];
  const categoryColor = getCategoryColor(category || "");
  const totalQuestions = currentCategory.questions.length;
  // Progress only counts when BOTH have answered
  const answeredCount = currentCategory.questions.filter(
    (q) => q.bothAnswered,
  ).length;
  const iAnsweredCount = currentCategory.questions.filter(
    (q) => q.userResponse,
  ).length;

  const handleSubmit = async () => {
    if (!currentQuestion || isSubmitting) return;

    let response: any;

    switch (currentQuestion.type) {
      case "TEXT":
        if (!textResponse.trim()) return;
        response = textResponse.trim();
        break;
      case "THIS_OR_THAT":
        if (Object.keys(thisOrThatAnswers).length === 0) return;
        response = thisOrThatAnswers;
        break;
      case "CHOICE":
        if (!selectedChoice) return;
        response = selectedChoice;
        break;
      case "RANKING":
        if (rankingOrder.length === 0) return;
        response = rankingOrder;
        break;
      default:
        return;
    }

    setIsSubmitting(true);
    const result = await submitAnswer(id!, currentQuestion.id, response);
    setIsSubmitting(false);

    if (result) {
      // Move to next question or show completion
      if (currentQuestionIndex < totalQuestions - 1) {
        const nextUnanswered = currentCategory.questions.findIndex(
          (q, i) => i > currentQuestionIndex && !q.userResponse,
        );
        if (nextUnanswered !== -1) {
          setCurrentQuestionIndex(nextUnanswered);
        } else {
          // All answered, go back
          router.back();
        }
      } else {
        router.back();
      }
    }
  };

  const renderQuestionInput = () => {
    switch (currentQuestion.type) {
      case "TEXT":
        return (
          <View style={styles.textInputContainer}>
            <TextInput
              style={styles.textInput}
              placeholder="Escribe tu respuesta..."
              placeholderTextColor={colors.textMuted}
              value={textResponse}
              onChangeText={setTextResponse}
              multiline
              numberOfLines={4}
              maxLength={500}
            />
            <Text style={styles.charCount}>{textResponse.length}/500</Text>
          </View>
        );

      case "THIS_OR_THAT":
        const options = currentQuestion.options as Array<{
          a: string;
          b: string;
        }>;
        return (
          <View style={styles.thisOrThatContainer}>
            {options.map((option, index) => (
              <View key={index} style={styles.thisOrThatRow}>
                <TouchableOpacity
                  style={[
                    styles.thisOrThatOption,
                    thisOrThatAnswers[index] === "a" && {
                      backgroundColor: categoryColor + "30",
                      borderColor: categoryColor,
                    },
                  ]}
                  onPress={() =>
                    setThisOrThatAnswers({ ...thisOrThatAnswers, [index]: "a" })
                  }
                >
                  <Text
                    style={[
                      styles.thisOrThatText,
                      thisOrThatAnswers[index] === "a" && {
                        color: categoryColor,
                      },
                    ]}
                  >
                    {option.a}
                  </Text>
                </TouchableOpacity>
                <Text style={styles.vsText}>vs</Text>
                <TouchableOpacity
                  style={[
                    styles.thisOrThatOption,
                    thisOrThatAnswers[index] === "b" && {
                      backgroundColor: categoryColor + "30",
                      borderColor: categoryColor,
                    },
                  ]}
                  onPress={() =>
                    setThisOrThatAnswers({ ...thisOrThatAnswers, [index]: "b" })
                  }
                >
                  <Text
                    style={[
                      styles.thisOrThatText,
                      thisOrThatAnswers[index] === "b" && {
                        color: categoryColor,
                      },
                    ]}
                  >
                    {option.b}
                  </Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        );

      case "CHOICE":
        const choices = currentQuestion.options as string[];
        return (
          <View style={styles.choicesContainer}>
            {choices.map((choice) => (
              <TouchableOpacity
                key={choice}
                style={[
                  styles.choiceOption,
                  selectedChoice === choice && {
                    backgroundColor: categoryColor + "30",
                    borderColor: categoryColor,
                  },
                ]}
                onPress={() => setSelectedChoice(choice)}
              >
                <View
                  style={[
                    styles.choiceRadio,
                    selectedChoice === choice && {
                      borderColor: categoryColor,
                      backgroundColor: categoryColor,
                    },
                  ]}
                >
                  {selectedChoice === choice && (
                    <View style={styles.choiceRadioInner} />
                  )}
                </View>
                <Text
                  style={[
                    styles.choiceText,
                    selectedChoice === choice && { color: categoryColor },
                  ]}
                >
                  {choice}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        );

      case "RANKING":
        const rankingOptions = currentQuestion.options as string[];
        const availableOptions = rankingOptions.filter(
          (o) => !rankingOrder.includes(o),
        );

        return (
          <View style={styles.rankingContainer}>
            {rankingOrder.length > 0 && (
              <View style={styles.rankingSelected}>
                <Text style={styles.rankingLabel}>Tu orden:</Text>
                {rankingOrder.map((item, index) => (
                  <TouchableOpacity
                    key={item}
                    style={styles.rankingItem}
                    onPress={() =>
                      setRankingOrder(rankingOrder.filter((i) => i !== item))
                    }
                  >
                    <Text
                      style={[
                        styles.rankingNumber,
                        { backgroundColor: categoryColor },
                      ]}
                    >
                      {index + 1}
                    </Text>
                    <Text style={styles.rankingItemText}>{item}</Text>
                    <Ionicons
                      name="close-circle"
                      size={20}
                      color={colors.error}
                    />
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {availableOptions.length > 0 && (
              <View style={styles.rankingAvailable}>
                <Text style={styles.rankingLabel}>
                  {rankingOrder.length === 0
                    ? "Toca para ordenar:"
                    : "Restantes:"}
                </Text>
                {availableOptions.map((item) => (
                  <TouchableOpacity
                    key={item}
                    style={styles.rankingAvailableItem}
                    onPress={() => setRankingOrder([...rankingOrder, item])}
                  >
                    <Text style={styles.rankingAvailableText}>{item}</Text>
                    <Ionicons
                      name="add-circle"
                      size={20}
                      color={categoryColor}
                    />
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        );

      default:
        return null;
    }
  };

  const isSubmitDisabled = () => {
    switch (currentQuestion.type) {
      case "TEXT":
        return !textResponse.trim();
      case "THIS_OR_THAT":
        const options = currentQuestion.options as Array<{
          a: string;
          b: string;
        }>;
        return Object.keys(thisOrThatAnswers).length < options.length;
      case "CHOICE":
        return !selectedChoice;
      case "RANKING":
        const rankingOptions = currentQuestion.options as string[];
        return rankingOrder.length < rankingOptions.length;
      default:
        return true;
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={["bottom"]}>
      <Stack.Screen
        options={{
          headerShown: true,
          headerTitle: category
            ? category.charAt(0).toUpperCase() + category.slice(1)
            : "Preguntas",
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.text,
          headerBackVisible: true,
        }}
      />

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        {/* Progress Header */}
        <View style={styles.progressHeader}>
          <View
            style={[
              styles.categoryBadge,
              { backgroundColor: categoryColor + "20" },
            ]}
          >
            <Ionicons
              name={getCategoryIcon(category || "") as any}
              size={16}
              color={categoryColor}
            />
            <Text style={[styles.categoryBadgeText, { color: categoryColor }]}>
              {category}
            </Text>
          </View>
          <Animated.View
            style={[
              styles.progressDots,
              { transform: [{ scale: dotsFlashAnim }] },
            ]}
          >
            {currentCategory.questions.map((q, i) => (
              <View
                key={i}
                style={[
                  styles.progressDot,
                  // I answered but other hasn't yet → lighter indicator
                  q.userResponse &&
                    !q.bothAnswered && {
                      backgroundColor: categoryColor + "55",
                      borderColor: categoryColor,
                    },
                  // Both answered → full completion
                  q.bothAnswered && styles.progressDotCompleted,
                  q.bothAnswered && { backgroundColor: categoryColor },
                  i === currentQuestionIndex && styles.progressDotActive,
                  i === currentQuestionIndex && { borderColor: categoryColor },
                ]}
              />
            ))}
          </Animated.View>
          <View style={styles.progressCountGroup}>
            <Text style={styles.progressText}>
              {answeredCount}/{totalQuestions}
            </Text>
            {iAnsweredCount > answeredCount && (
              <Text style={styles.progressSubText}>yo: {iAnsweredCount}</Text>
            )}
          </View>
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Question */}
          <View style={styles.questionContainer}>
            <Text style={styles.questionNumber}>
              Pregunta {currentQuestionIndex + 1}
            </Text>
            <Text style={styles.questionText}>{currentQuestion.text}</Text>
          </View>

          {/* Previous responses if both answered */}
          {currentQuestion.bothAnswered && currentQuestion.otherResponse && (
            <View style={styles.otherResponseContainer}>
              <Text style={styles.otherResponseLabel}>Su respuesta:</Text>
              <Text style={styles.otherResponseText}>
                {typeof currentQuestion.otherResponse === "string"
                  ? currentQuestion.otherResponse
                  : JSON.stringify(currentQuestion.otherResponse)}
              </Text>
            </View>
          )}

          {/* Question input */}
          {!currentQuestion.userResponse ? (
            renderQuestionInput()
          ) : (
            <View style={styles.answeredContainer}>
              <Ionicons
                name="checkmark-circle"
                size={48}
                color={colors.success}
              />
              <Text style={styles.answeredText}>
                Ya respondiste esta pregunta
              </Text>
              <Text style={styles.answeredResponse}>
                {typeof currentQuestion.userResponse === "string"
                  ? currentQuestion.userResponse
                  : JSON.stringify(currentQuestion.userResponse)}
              </Text>
            </View>
          )}

          {/* Answered Q&A history */}
          {currentCategory.questions.some((q) => q.userResponse) && (
            <View style={styles.historySection}>
              <View style={styles.historySectionHeader}>
                <Ionicons
                  name="chatbubbles-outline"
                  size={18}
                  color={colors.textSecondary}
                />
                <Text style={styles.historySectionTitle}>
                  Respuestas compartidas
                </Text>
              </View>
              {currentCategory.questions
                .filter((q) => q.userResponse)
                .map((q, i) => (
                  <View
                    key={q.id}
                    style={[
                      styles.historyCard,
                      { borderLeftColor: categoryColor },
                    ]}
                  >
                    <Text style={styles.historyQuestion}>{q.text}</Text>
                    <View style={styles.historyAnswerRow}>
                      <View style={styles.historyAnswerBubble}>
                        <Text style={styles.historyAnswerLabel}>Tú</Text>
                        <Text style={styles.historyAnswerText}>
                          {formatResponse(q.userResponse, q.type)}
                        </Text>
                      </View>
                      {q.otherResponse !== null ? (
                        <View
                          style={[
                            styles.historyAnswerBubble,
                            styles.historyAnswerBubbleOther,
                          ]}
                        >
                          <Text
                            style={[
                              styles.historyAnswerLabel,
                              { color: categoryColor },
                            ]}
                          >
                            {q.bothAnswered ? "Él/Ella" : "Ellos"}
                          </Text>
                          <Text style={styles.historyAnswerText}>
                            {formatResponse(q.otherResponse, q.type)}
                          </Text>
                        </View>
                      ) : (
                        <View
                          style={[
                            styles.historyAnswerBubble,
                            styles.historyAnswerBubblePending,
                          ]}
                        >
                          <Text style={styles.historyAnswerLabel}>Ellos</Text>
                          <Text
                            style={[
                              styles.historyAnswerText,
                              { color: colors.textMuted, fontStyle: "italic" },
                            ]}
                          >
                            Aún no responde...
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>
                ))}
            </View>
          )}
        </ScrollView>

        {/* Bottom Actions */}
        <View style={styles.bottomActions}>
          {currentQuestionIndex > 0 && (
            <TouchableOpacity
              style={styles.navButton}
              onPress={() => setCurrentQuestionIndex(currentQuestionIndex - 1)}
            >
              <Ionicons name="chevron-back" size={24} color={colors.text} />
            </TouchableOpacity>
          )}

          <View style={styles.bottomSpacer} />

          {!currentQuestion.userResponse ? (
            <TouchableOpacity
              style={[
                styles.submitButton,
                { backgroundColor: categoryColor },
                isSubmitDisabled() && styles.submitButtonDisabled,
              ]}
              onPress={handleSubmit}
              disabled={isSubmitDisabled() || isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator size="small" color={colors.text} />
              ) : (
                <>
                  <Text style={styles.submitButtonText}>Enviar</Text>
                  <Ionicons name="send" size={18} color={colors.text} />
                </>
              )}
            </TouchableOpacity>
          ) : (
            currentQuestionIndex < totalQuestions - 1 && (
              <TouchableOpacity
                style={[styles.nextButton, { backgroundColor: categoryColor }]}
                onPress={() =>
                  setCurrentQuestionIndex(currentQuestionIndex + 1)
                }
              >
                <Text style={styles.submitButtonText}>Siguiente</Text>
                <Ionicons
                  name="chevron-forward"
                  size={18}
                  color={colors.text}
                />
              </TouchableOpacity>
            )
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  flex: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: spacing.md,
  },
  emptyText: {
    color: colors.textMuted,
    fontSize: fontSize.lg,
  },
  progressHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: spacing.md,
    backgroundColor: colors.backgroundCard,
    gap: spacing.md,
  },
  categoryBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    gap: spacing.xs,
  },
  categoryBadgeText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    textTransform: "capitalize",
  },
  progressDots: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "center",
    gap: spacing.xs,
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.border,
  },
  progressDotCompleted: {
    backgroundColor: colors.success,
  },
  progressDotActive: {
    borderWidth: 2,
    borderColor: colors.primary,
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  progressText: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
  },
  progressCountGroup: {
    alignItems: "flex-end",
    gap: 1,
  },
  progressSubText: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
    gap: spacing.lg,
  },
  questionContainer: {
    gap: spacing.sm,
  },
  questionNumber: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
  },
  questionText: {
    color: colors.text,
    fontSize: fontSize.xl,
    fontWeight: fontWeight.semibold,
    lineHeight: 28,
  },
  textInputContainer: {
    gap: spacing.xs,
  },
  textInput: {
    backgroundColor: colors.backgroundLight,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    color: colors.text,
    fontSize: fontSize.md,
    minHeight: 120,
    textAlignVertical: "top",
  },
  charCount: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
    textAlign: "right",
  },
  thisOrThatContainer: {
    gap: spacing.md,
  },
  thisOrThatRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  thisOrThatOption: {
    flex: 1,
    backgroundColor: colors.backgroundLight,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    alignItems: "center",
    borderWidth: 2,
    borderColor: "transparent",
  },
  thisOrThatText: {
    color: colors.text,
    fontSize: fontSize.md,
    fontWeight: fontWeight.medium,
    textAlign: "center",
  },
  vsText: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
  },
  choicesContainer: {
    gap: spacing.sm,
  },
  choiceOption: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.backgroundLight,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    gap: spacing.md,
    borderWidth: 2,
    borderColor: "transparent",
  },
  choiceRadio: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.border,
    justifyContent: "center",
    alignItems: "center",
  },
  choiceRadioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.text,
  },
  choiceText: {
    color: colors.text,
    fontSize: fontSize.md,
    flex: 1,
  },
  rankingContainer: {
    gap: spacing.lg,
  },
  rankingSelected: {
    gap: spacing.sm,
  },
  rankingLabel: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
  },
  rankingItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.backgroundLight,
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    gap: spacing.sm,
  },
  rankingNumber: {
    color: colors.text,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
    width: 24,
    height: 24,
    borderRadius: 12,
    textAlign: "center",
    lineHeight: 24,
    overflow: "hidden",
  },
  rankingItemText: {
    color: colors.text,
    fontSize: fontSize.md,
    flex: 1,
  },
  rankingAvailable: {
    gap: spacing.sm,
  },
  rankingAvailableItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.backgroundCard,
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: "dashed",
  },
  rankingAvailableText: {
    color: colors.textSecondary,
    fontSize: fontSize.md,
    flex: 1,
  },
  otherResponseContainer: {
    backgroundColor: colors.backgroundLight,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    borderLeftWidth: 3,
    borderLeftColor: colors.primary,
  },
  otherResponseLabel: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
    marginBottom: spacing.xs,
  },
  otherResponseText: {
    color: colors.text,
    fontSize: fontSize.md,
  },
  answeredContainer: {
    alignItems: "center",
    padding: spacing.xl,
    gap: spacing.md,
  },
  answeredText: {
    color: colors.success,
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
  },
  answeredResponse: {
    color: colors.textSecondary,
    fontSize: fontSize.md,
    textAlign: "center",
    fontStyle: "italic",
  },
  bottomActions: {
    flexDirection: "row",
    alignItems: "center",
    padding: spacing.md,
    backgroundColor: colors.backgroundCard,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: spacing.sm,
  },
  navButton: {
    padding: spacing.sm,
    backgroundColor: colors.backgroundLight,
    borderRadius: borderRadius.md,
  },
  bottomSpacer: {
    flex: 1,
  },
  submitButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    gap: spacing.sm,
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    color: colors.text,
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
  },
  nextButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    gap: spacing.sm,
  },
  historySection: {
    marginTop: spacing.xl,
    gap: spacing.md,
  },
  historySectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  historySectionTitle: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  historyCard: {
    backgroundColor: colors.backgroundCard,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    borderLeftWidth: 3,
    gap: spacing.sm,
  },
  historyQuestion: {
    color: colors.text,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
  },
  historyAnswerRow: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  historyAnswerBubble: {
    flex: 1,
    backgroundColor: colors.backgroundLight,
    borderRadius: borderRadius.sm,
    padding: spacing.sm,
    gap: spacing.xs,
  },
  historyAnswerBubbleOther: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  historyAnswerBubblePending: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    opacity: 0.6,
  },
  historyAnswerLabel: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
    textTransform: "uppercase",
  },
  historyAnswerText: {
    color: colors.text,
    fontSize: fontSize.sm,
    lineHeight: 18,
  },
});
