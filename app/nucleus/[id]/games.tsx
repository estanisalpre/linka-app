import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  Alert,
  BackHandler,
  Animated,
  Dimensions,
  Modal,
  AppState,
} from "react-native";
import { useLocalSearchParams, useRouter, Stack } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { api } from "../../../src/services/api";
import { useNucleusStore } from "../../../src/store/nucleus.store";
import {
  getSocket,
  joinConnection,
  leaveConnection,
} from "../../../src/services/socket";
import {
  colors,
  fontSize,
  fontWeight,
  spacing,
  borderRadius,
  shadows,
} from "../../../src/utils/theme";

// ── Types ─────────────────────────────────────────────────────────────────────

interface Game {
  type: "GUESS_ANSWER" | "COMPLETE_PHRASE" | "TRUTH_OR_LIE";
  name: string;
  description: string;
  status: "PENDING" | "IN_PROGRESS" | "COMPLETED";
  gameId?: string;
  // shared extras
  otherName?: string;
  // GUESS_ANSWER extras
  myFilled?: boolean;
  otherFilled?: boolean;
  gaResult?: {
    myScore: number;
    otherScore: number;
    total: number;
    otherName: string;
  } | null;
  // TRUTH_OR_LIE extras
  mySubmitted?: boolean;
  otherSubmitted?: boolean;
  myGuessed?: boolean;
  otherGuessed?: boolean;
  result?: {
    myCorrect: boolean;
    otherCorrect: boolean;
    otherName: string;
  } | null;
  // COMPLETE_PHRASE extras
  myVoted?: boolean;
  otherVoted?: boolean;
  cpResult?: {
    myScore: number;
    otherScore: number;
    otherName: string;
  } | null;
}

interface GameData {
  games: Game[];
  completed: number;
  total: number;
}

interface ActiveGame {
  gameId: string;
  type: string;
  // GUESS_ANSWER
  needsFill?: boolean;
  waitingFill?: boolean;
  needsGuess?: boolean;
  waitingGuess?: boolean;
  questions?: any[];
  myScore?: number;
  myTotal?: number;
  // COMPLETE_PHRASE – input phase
  needsInput?: boolean;
  phrases?: { phrase: string; options: string[] }[];
  // COMPLETE_PHRASE – voting phase
  needsVote?: boolean;
  otherPhrases?: { phrase: string; chosenAnswer: string }[];
  // COMPLETE_PHRASE / TOL – results view
  resultsData?: TruthOrLieResults | CompletePhraseResults | GuessAnswerResults;
  // TRUTH_OR_LIE – input / guess
  statements?: string[];
  otherUserReady?: boolean;
}

interface GuessResult {
  correct: boolean;
  correctStatement: string;
  truths: string[];
  gameCompleted: boolean;
}

interface TruthOrLieResults {
  myStatements: { truths: string[]; lie: string } | null;
  otherStatements: { truths: string[]; lie: string } | null;
  myGuess: { correct: boolean; guessed: string } | null;
  otherGuess: { correct: boolean; guessed: string } | null;
  myName: string;
  otherName: string;
}

interface CompletePhraseResults {
  myGuesses: { phrase: string; myAnswer: string; correct: boolean | null }[];
  otherGuesses: {
    phrase: string;
    theirAnswer: string;
    correct: boolean | null;
  }[];
  myScore: number;
  otherScore: number;
  myName: string;
  otherName: string;
}

interface GuessAnswerScore {
  score: number;
  total: number;
  questionsDetail: {
    questionText: string;
    chosen: string;
    correct: string;
    isCorrect: boolean;
  }[];
}

interface GuessAnswerResults {
  myGuessDetail: {
    questionText: string;
    myGuess: string | null;
    otherActual: string | null;
    isCorrect: boolean | null;
  }[];
  otherGuessDetail: {
    questionText: string;
    otherGuess: string | null;
    myActual: string | null;
    isCorrect: boolean | null;
  }[];
  myScore: number;
  otherScore: number;
  total: number;
  myName: string;
  otherName: string;
}

// ── Confetti ──────────────────────────────────────────────────────────────────

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");
const CONFETTI_COLORS = [
  "#FF6B6B",
  "#4ECDC4",
  "#45B7D1",
  "#96CEB4",
  "#FFEAA7",
  "#DDA0DD",
  "#FF9800",
  "#4CAF50",
  "#E91E63",
  "#9C27B0",
];

function ConfettiOverlay({ visible }: { visible: boolean }) {
  const particles = useRef(
    Array.from({ length: 60 }, () => {
      const size = Math.random() * 10 + 6;
      return {
        x: Math.random() * SCREEN_WIDTH,
        color:
          CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
        size,
        borderRadius: Math.random() > 0.5 ? size / 2 : 2,
        delay: Math.random() * 1600,
        animY: new Animated.Value(-40),
        animX: new Animated.Value(0),
        animRotate: new Animated.Value(0),
      };
    }),
  ).current;

  useEffect(() => {
    if (!visible) {
      particles.forEach((p) => {
        p.animY.setValue(-40);
        p.animX.setValue(0);
        p.animRotate.setValue(0);
      });
      return;
    }
    const animations = particles.map((p) =>
      Animated.parallel([
        Animated.timing(p.animY, {
          toValue: SCREEN_HEIGHT + 40,
          duration: 2600 + Math.random() * 1000,
          delay: p.delay,
          useNativeDriver: true,
        }),
        Animated.timing(p.animRotate, {
          toValue: 6 + Math.random() * 6,
          duration: 2600,
          delay: p.delay,
          useNativeDriver: true,
        }),
        Animated.sequence([
          Animated.timing(p.animX, {
            toValue: (Math.random() - 0.5) * 70,
            duration: 700,
            delay: p.delay,
            useNativeDriver: true,
          }),
          Animated.timing(p.animX, {
            toValue: (Math.random() - 0.5) * 70,
            duration: 700,
            useNativeDriver: true,
          }),
          Animated.timing(p.animX, {
            toValue: (Math.random() - 0.5) * 70,
            duration: 700,
            useNativeDriver: true,
          }),
          Animated.timing(p.animX, {
            toValue: (Math.random() - 0.5) * 70,
            duration: 500,
            useNativeDriver: true,
          }),
        ]),
      ]),
    );
    Animated.parallel(animations).start();
  }, [visible]);

  if (!visible) return null;

  return (
    <View
      style={[StyleSheet.absoluteFillObject, { zIndex: 9999 }]}
      pointerEvents="none"
    >
      {particles.map((p, i) => {
        const rotate = p.animRotate.interpolate({
          inputRange: [0, 12],
          outputRange: ["0deg", "720deg"],
        });
        return (
          <Animated.View
            key={i}
            style={{
              position: "absolute",
              left: p.x,
              top: -40,
              width: p.size,
              height: p.size,
              borderRadius: p.borderRadius,
              backgroundColor: p.color,
              transform: [
                { translateY: p.animY },
                { translateX: p.animX },
                { rotate },
              ],
            }}
          />
        );
      })}
    </View>
  );
}

// ── Main screen ───────────────────────────────────────────────────────────────

export default function GamesScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { loadOverview } = useNucleusStore();

  const [gamesData, setGamesData] = useState<GameData | null>(null);
  const [activeGame, setActiveGame] = useState<ActiveGame | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isStarting, setIsStarting] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Per-game input state
  const [gaFillAnswers, setGaFillAnswers] = useState<Record<string, string>>(
    {},
  );
  const [guessAnswers, setGuessAnswers] = useState<Record<string, string>>({});
  const [gaScore, setGaScore] = useState<GuessAnswerScore | null>(null);
  const [phraseSelections, setPhraseSelections] = useState<
    Record<number, string>
  >({});
  const [cpVotes, setCpVotes] = useState<Record<number, boolean>>({});
  const [truthStatements, setTruthStatements] = useState(["", "", ""]);
  const [selectedLie, setSelectedLie] = useState<number | null>(null);

  // Auto-advance from waitingFill → needsGuess when other person fills
  useEffect(() => {
    if (!activeGame?.waitingFill) return;
    const gaGame = gamesData?.games.find((g) => g.type === "GUESS_ANSWER");
    if (gaGame?.otherFilled) {
      setGaFillAnswers({});
      startGame("GUESS_ANSWER");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gamesData]);

  // Truth-or-lie result feedback
  const [guessResult, setGuessResult] = useState<GuessResult | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [showWrongModal, setShowWrongModal] = useState(false);

  // ── Intercept hardware/swipe back while inside a game ──────────────────────
  useEffect(() => {
    const handler = BackHandler.addEventListener("hardwareBackPress", () => {
      if (activeGame) {
        handleCloseGame();
        return true;
      }
      return false;
    });
    return () => handler.remove();
  }, [activeGame]);

  // ── Data loader ────────────────────────────────────────────────────────────
  useEffect(() => {
    loadGamesData();
  }, [id]);

  // ── Real-time reactivity: socket + AppState ────────────────────────────────
  useEffect(() => {
    if (!id) return;

    // Join socket room so we receive events for this connection
    joinConnection(id);

    // Reload when other user submits or guesses
    const socket = getSocket();
    const handleGameUpdated = () => {
      loadGamesData();
    };
    socket?.on("game:updated", handleGameUpdated);

    // Reload when app comes back to foreground
    const appStateSub = AppState.addEventListener("change", (state) => {
      if (state === "active") {
        loadGamesData();
      }
    });

    return () => {
      socket?.off("game:updated", handleGameUpdated);
      appStateSub.remove();
      leaveConnection(id);
    };
  }, [id]);

  const loadGamesData = async () => {
    try {
      const response = await api.get(`/nucleus/${id}/games`);
      setGamesData(response.data);
    } catch (error) {
      console.error("Error loading games:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCloseGame = () => {
    setActiveGame(null);
    setGuessResult(null);
    setGaScore(null);
    setSelectedLie(null);
    setShowConfetti(false);
    setShowWrongModal(false);
    setTruthStatements(["", "", ""]);
    setGaFillAnswers({});
    setGuessAnswers({});
    setPhraseSelections({});
    setCpVotes({});
  };

  // ── Start any mini-game ────────────────────────────────────────────────────
  const startGame = async (gameType: string) => {
    setIsStarting(true);
    try {
      const response = await api.post(`/nucleus/${id}/games/${gameType}/start`);
      setActiveGame(response.data);
      setGuessResult(null);
      setSelectedLie(null);
    } catch (error: any) {
      Alert.alert(
        "Error",
        error.response?.data?.error || "No se pudo iniciar el juego",
      );
    } finally {
      setIsStarting(false);
    }
  };

  const openResults = async (game: Game) => {
    setIsStarting(true);
    try {
      const response = await api.get(
        `/nucleus/${id}/games/TRUTH_OR_LIE/results`,
      );
      setActiveGame({
        gameId: game.gameId!,
        type: "TRUTH_OR_LIE_RESULTS",
        resultsData: response.data,
      });
    } catch {
      Alert.alert("Error", "No se pudieron cargar los resultados");
    } finally {
      setIsStarting(false);
    }
  };

  const openCPResults = async (game: Game) => {
    setIsStarting(true);
    try {
      const response = await api.get(
        `/nucleus/${id}/games/COMPLETE_PHRASE/results`,
      );
      setActiveGame({
        gameId: game.gameId!,
        type: "COMPLETE_PHRASE_RESULTS",
        resultsData: response.data,
      });
    } catch {
      Alert.alert("Error", "No se pudieron cargar los resultados");
    } finally {
      setIsStarting(false);
    }
  };

  const openGAResults = async (game: Game) => {
    setIsStarting(true);
    try {
      const response = await api.get(
        `/nucleus/${id}/games/GUESS_ANSWER/results`,
      );
      setActiveGame({
        gameId: game.gameId!,
        type: "GUESS_ANSWER_RESULTS",
        resultsData: response.data,
      });
    } catch {
      Alert.alert("Error", "No se pudieron cargar los resultados");
    } finally {
      setIsStarting(false);
    }
  };

  const submitGAFill = async () => {
    if (!activeGame?.questions) return;
    const unanswered = activeGame.questions.filter(
      (q: any) => !gaFillAnswers[q.questionId],
    );
    if (unanswered.length > 0) return;
    setIsSubmitting(true);
    try {
      const response = await api.post(
        `/nucleus/${id}/games/${activeGame.gameId}/ga-fill`,
        { answers: gaFillAnswers },
      );
      await loadGamesData();
      // If the other already filled, jump straight to guess phase
      if (response.data.otherFilled) {
        setGaFillAnswers({});
        const nextState = await api.post(
          `/nucleus/${id}/games/${activeGame.type}/start`,
        );
        setActiveGame(nextState.data);
      } else {
        // Show waiting state inside the active view
        setActiveGame((prev: ActiveGame | null) =>
          prev ? { ...prev, needsFill: false, waitingFill: true } : prev,
        );
      }
    } catch (error: any) {
      Alert.alert("Error", error.response?.data?.error || "No se pudo enviar");
    } finally {
      setIsSubmitting(false);
    }
  };

  const submitGAGuess = async () => {
    if (!activeGame?.questions) return;
    const unanswered = activeGame.questions.filter(
      (q: any) => !guessAnswers[q.questionId],
    );
    if (unanswered.length > 0) return;
    setIsSubmitting(true);
    try {
      const response = await api.post(
        `/nucleus/${id}/games/${activeGame.gameId}/guess-answer`,
        { answers: guessAnswers },
      );
      setGaScore({
        score: response.data.score,
        total: response.data.total,
        questionsDetail: response.data.questionsDetail,
      });
      await loadGamesData();
      await loadOverview(id!);
      // Show confetti if perfect score
      if (response.data.score === response.data.total) {
        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 4500);
      }
    } catch (error: any) {
      Alert.alert("Error", error.response?.data?.error || "No se pudo enviar");
    } finally {
      setIsSubmitting(false);
    }
  };

  const submitCPAnswers = async () => {
    if (!activeGame || !activeGame.phrases) return;
    const answers = activeGame.phrases.map(
      (_: any, i: number) => phraseSelections[i] ?? "",
    );
    if (answers.some((a) => !a)) return;
    setIsSubmitting(true);
    try {
      await api.post(
        `/nucleus/${id}/games/${activeGame.gameId}/complete-phrase`,
        { answers },
      );
      await loadGamesData();
      await loadOverview(id!);
      handleCloseGame();
    } catch (error: any) {
      Alert.alert("Error", error.response?.data?.error || "No se pudo enviar");
    } finally {
      setIsSubmitting(false);
    }
  };

  const submitCPVotes = async () => {
    if (!activeGame || !activeGame.otherPhrases) return;
    const votes = activeGame.otherPhrases.map(
      (_: any, i: number) => cpVotes[i] ?? null,
    );
    if (votes.some((v) => v === null)) return;
    setIsSubmitting(true);
    try {
      await api.post(`/nucleus/${id}/games/${activeGame.gameId}/vote-phrases`, {
        votes,
      });
      await loadGamesData();
      await loadOverview(id!);
      handleCloseGame();
    } catch (error: any) {
      Alert.alert("Error", error.response?.data?.error || "No se pudo enviar");
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Submit handlers ────────────────────────────────────────────────────────
  const submitTruthStatements = async () => {
    if (!activeGame || truthStatements.some((s) => !s.trim())) return;
    setIsSubmitting(true);
    try {
      await api.post(`/nucleus/${id}/games/${activeGame.gameId}/truth-or-lie`, {
        statements: truthStatements,
        lieIndex: 2,
      });
      await loadGamesData();
      await loadOverview(id!);
      handleCloseGame();
    } catch (error: any) {
      Alert.alert("Error", error.response?.data?.error || "No se pudo enviar");
    } finally {
      setIsSubmitting(false);
    }
  };

  const guessTheLie = async () => {
    if (!activeGame || selectedLie === null || !activeGame.statements) return;
    // Send the statement TEXT so backend can compare by value (avoids shuffle index mismatch)
    const selectedStatement = activeGame.statements[selectedLie];
    setIsSubmitting(true);
    try {
      const response = await api.post(
        `/nucleus/${id}/games/${activeGame.gameId}/guess-lie`,
        { guess: selectedStatement },
      );
      const result: GuessResult = response.data;
      setGuessResult(result);
      await loadGamesData();
      await loadOverview(id!);
      setTimeout(() => {
        if (result.correct) {
          setShowConfetti(true);
          setTimeout(() => setShowConfetti(false), 4500);
        } else {
          setShowWrongModal(true);
        }
      }, 500);
    } catch (error: any) {
      Alert.alert("Error", error.response?.data?.error || "No se pudo enviar");
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Helpers ────────────────────────────────────────────────────────────────
  const getGameEmoji = (type: string) => {
    if (type === "GUESS_ANSWER") return "🎯";
    if (type === "COMPLETE_PHRASE") return "✍️";
    if (type === "TRUTH_OR_LIE") return "🤥";
    return "🎮";
  };

  const getGameColor = (type: string) => {
    if (type === "GUESS_ANSWER") return "#2196F3";
    if (type === "COMPLETE_PHRASE") return "#4CAF50";
    if (type === "TRUTH_OR_LIE") return "#FF9800";
    return colors.primary;
  };

  const getStatementResultStyle = (stmt: string, result: GuessResult) =>
    stmt === result.correctStatement
      ? { borderColor: "#FF5252", backgroundColor: "#FF5252" + "18" }
      : { borderColor: "#4CAF50", backgroundColor: "#4CAF50" + "18" };

  const getStatementResultIcon = (stmt: string, result: GuessResult): any =>
    stmt === result.correctStatement ? "close-circle" : "checkmark-circle";

  const getStatementResultIconColor = (stmt: string, result: GuessResult) =>
    stmt === result.correctStatement ? "#FF5252" : "#4CAF50";

  // ── GUESS_ANSWER card extra content ─────────────────────────────────────
  const renderGuessAnswerExtra = (game: Game) => {
    if (game.status === "COMPLETED") {
      const r = game.gaResult;
      return (
        <View style={styles.tolExtra}>
          <Text style={styles.tolResultText}>
            {r
              ? `Tú: ${r.myScore}/${r.total} · ${r.otherName}: ${r.otherScore}/${r.total}`
              : "Completado 🎉"}
          </Text>
          <TouchableOpacity
            style={[styles.playButton, { backgroundColor: "#2196F3" }]}
            onPress={() => openGAResults(game)}
            disabled={isStarting}
          >
            <Text style={styles.playButtonText}>Resultados</Text>
            <Ionicons name="stats-chart" size={16} color={colors.text} />
          </TouchableOpacity>
        </View>
      );
    }

    // Phase 1 waiting (I filled, other hasn't)
    if (game.myFilled && !game.otherFilled) {
      return (
        <View style={styles.tolExtra}>
          <Text style={styles.tolWaitText}>
            Esperando a que {game.otherName} responda sobre sí mismo... ⏳
          </Text>
        </View>
      );
    }

    // Phase 2 waiting (I guessed, other hasn't)
    if (game.myGuessed && !game.otherGuessed) {
      return (
        <View style={styles.tolExtra}>
          <Text style={styles.tolWaitText}>
            Esperando a que {game.otherName} adivine... ⏳
          </Text>
        </View>
      );
    }

    // Both filled, I haven't guessed yet → CTA with button
    if (game.myFilled && game.otherFilled && !game.myGuessed) {
      return (
        <View style={styles.tolExtra}>
          <Text style={styles.tolCTAText}>
            ¡{game.otherName} ya respondió! Ahora adivina sus respuestas.
          </Text>
          <TouchableOpacity
            style={[styles.playButton, { backgroundColor: "#2196F3" }]}
            onPress={() => startGame(game.type)}
            disabled={isStarting}
          >
            {isStarting ? (
              <ActivityIndicator size="small" color={colors.text} />
            ) : (
              <>
                <Text style={styles.playButtonText}>Adivinar</Text>
                <Ionicons name="play" size={16} color={colors.text} />
              </>
            )}
          </TouchableOpacity>
        </View>
      );
    }

    return null;
  };

  // ── COMPLETE_PHRASE card extra content ───────────────────────────────────
  const renderCompletePhraseExtra = (game: Game) => {
    if (game.status === "COMPLETED") {
      const r = game.cpResult;
      return (
        <View style={styles.tolExtra}>
          <Text style={styles.tolResultText}>
            {r
              ? `Tú: ${r.myScore}/${game.myVoted !== undefined ? 3 : "?"} · ${r.otherName}: ${r.otherScore}/3`
              : "Completado 🎉"}
          </Text>
          <TouchableOpacity
            style={[styles.playButton, { backgroundColor: "#4CAF50" }]}
            onPress={() => openCPResults(game)}
            disabled={isStarting}
          >
            <Text style={styles.playButtonText}>Resultados</Text>
            <Ionicons name="stats-chart" size={16} color={colors.text} />
          </TouchableOpacity>
        </View>
      );
    }

    if (game.mySubmitted && !game.otherSubmitted) {
      return (
        <View style={styles.tolExtra}>
          <Text style={styles.tolWaitText}>
            Esperando a que {game.otherName} complete las frases... ⏳
          </Text>
        </View>
      );
    }

    if (game.myVoted && !game.otherVoted) {
      return (
        <View style={styles.tolExtra}>
          <Text style={styles.tolWaitText}>
            Esperando a que {game.otherName} vote... 👀
          </Text>
        </View>
      );
    }

    if (game.mySubmitted && game.otherSubmitted && !game.myVoted) {
      return (
        <View style={styles.tolExtra}>
          <Text style={styles.tolCTAText}>
            ¡{game.otherName} ya completó las frases sobre ti!
          </Text>
          <TouchableOpacity
            style={[
              styles.playButton,
              { backgroundColor: "#4CAF50", marginTop: spacing.xs },
            ]}
            onPress={() => startGame(game.type)}
            disabled={isStarting}
          >
            {isStarting ? (
              <ActivityIndicator size="small" color={colors.text} />
            ) : (
              <>
                <Text style={styles.playButtonText}>¡Votar respuestas!</Text>
                <Ionicons name="thumbs-up" size={16} color={colors.text} />
              </>
            )}
          </TouchableOpacity>
        </View>
      );
    }

    return null;
  };

  // ── TRUTH_OR_LIE card extra content ───────────────────────────────────────
  const renderTruthOrLieExtra = (game: Game) => {
    if (game.status === "COMPLETED") {
      const r = game.result;
      let resultText = "";
      if (r?.myCorrect && r?.otherCorrect)
        resultText = "¡Ambos adivinaron correctamente! 🎉";
      else if (r?.myCorrect && !r?.otherCorrect)
        resultText = `Tú adivinaste. ${r?.otherName} no pudo 😄`;
      else if (!r?.myCorrect && r?.otherCorrect)
        resultText = `${r?.otherName} adivinó. Tú no pudiste 😅`;
      else resultText = "Ninguno adivinó... 😂";

      return (
        <View style={styles.tolExtra}>
          <Text style={styles.tolResultText}>{resultText}</Text>
          <TouchableOpacity
            style={[styles.playButton, { backgroundColor: "#FF9800" }]}
            onPress={() => openResults(game)}
            disabled={isStarting}
          >
            <Text style={styles.playButtonText}>Resultados</Text>
            <Ionicons name="stats-chart" size={16} color={colors.text} />
          </TouchableOpacity>
        </View>
      );
    }

    if (game.mySubmitted && !game.otherSubmitted) {
      return (
        <View style={styles.tolExtra}>
          <Text style={styles.tolWaitText}>
            Esperando a que {game.otherName} ingrese sus verdades... ⏳
          </Text>
        </View>
      );
    }

    if (game.myGuessed && !game.otherGuessed) {
      return (
        <View style={styles.tolExtra}>
          <Text style={styles.tolWaitText}>
            Esperando a que {game.otherName} adivine... 👀
          </Text>
        </View>
      );
    }

    if (game.mySubmitted && game.otherSubmitted && !game.myGuessed) {
      return (
        <View style={styles.tolExtra}>
          <Text style={styles.tolCTAText}>
            ¡{game.otherName} ya ingresó sus verdades y mentira!
          </Text>
          <TouchableOpacity
            style={[
              styles.playButton,
              { backgroundColor: "#FF9800", marginTop: spacing.xs },
            ]}
            onPress={() => startGame(game.type)}
            disabled={isStarting}
          >
            {isStarting ? (
              <ActivityIndicator size="small" color={colors.text} />
            ) : (
              <>
                <Text style={styles.playButtonText}>¡Adivínalas aquí!</Text>
                <Ionicons name="eye" size={16} color={colors.text} />
              </>
            )}
          </TouchableOpacity>
        </View>
      );
    }

    return null;
  };

  // ── Loading ────────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <Stack.Screen
          options={{
            headerShown: true,
            headerTitle: "Mini Juegos",
            headerStyle: { backgroundColor: colors.background },
            headerTintColor: colors.text,
          }}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  // ── Active game views ──────────────────────────────────────────────────────
  if (activeGame) {
    const sharedHeader = {
      headerShown: true,
      headerStyle: { backgroundColor: colors.background },
      headerTintColor: colors.text,
      gestureEnabled: false,
      headerLeft: () => (
        <TouchableOpacity
          onPress={handleCloseGame}
          style={{ paddingRight: spacing.sm }}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
      ),
    };

    // GUESS ANSWER – Phase 1: fill own answers ──────────────────────────────
    if (activeGame.type === "GUESS_ANSWER" && activeGame.needsFill) {
      const allFilled =
        (activeGame.questions?.length ?? 0) > 0 &&
        activeGame.questions!.every((q: any) => gaFillAnswers[q.questionId]);

      return (
        <SafeAreaView style={styles.container} edges={["bottom"]}>
          <Stack.Screen
            options={{
              ...sharedHeader,
              headerTitle: "🎯 Adivina la Respuesta",
            }}
          />
          <ScrollView
            style={styles.gameContent}
            contentContainerStyle={styles.gameContentInner}
          >
            <Text style={styles.gameInstructions}>
              Primero, responde estas preguntas sobre ti mismo. La otra persona
              intentará adivinar tus respuestas.
            </Text>
            {activeGame.questions!.map((q: any) => (
              <View key={q.questionId} style={styles.gameQuestion}>
                <Text style={styles.gameQuestionText}>{q.questionText}</Text>
                <View style={styles.guessOptions}>
                  {q.options.map((option: string, optIndex: number) => (
                    <TouchableOpacity
                      key={optIndex}
                      style={[
                        styles.guessOption,
                        gaFillAnswers[q.questionId] === option &&
                          styles.guessOptionSelected,
                      ]}
                      onPress={() =>
                        setGaFillAnswers((prev) => ({
                          ...prev,
                          [q.questionId]: option,
                        }))
                      }
                    >
                      <Text
                        style={[
                          styles.guessOptionText,
                          gaFillAnswers[q.questionId] === option &&
                            styles.guessOptionTextSelected,
                        ]}
                      >
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
                { backgroundColor: "#2196F3" },
                !allFilled && styles.submitGameButtonDisabled,
              ]}
              onPress={submitGAFill}
              disabled={!allFilled || isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator size="small" color={colors.text} />
              ) : (
                <Text style={styles.submitGameButtonText}>
                  Enviar mis respuestas
                </Text>
              )}
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      );
    }

    // GUESS ANSWER – waiting for other to fill ───────────────────────────────
    if (activeGame.type === "GUESS_ANSWER" && activeGame.waitingFill) {
      return (
        <SafeAreaView style={styles.container} edges={["bottom"]}>
          <Stack.Screen
            options={{
              ...sharedHeader,
              headerTitle: "🎯 Adivina la Respuesta",
            }}
          />
          <View
            style={[
              styles.gameContent,
              {
                justifyContent: "center",
                alignItems: "center",
                flex: 1,
                padding: 32,
              },
            ]}
          >
            <Text style={{ fontSize: 48, marginBottom: 16 }}>⏳</Text>
            <Text
              style={[
                styles.gameInstructions,
                { textAlign: "center", marginBottom: 8 },
              ]}
            >
              ¡Ya respondiste tus preguntas!
            </Text>
            <Text
              style={[
                styles.gameInstructions,
                { textAlign: "center", color: colors.textSecondary },
              ]}
            >
              Esperando a que la otra persona también responda las suyas...
            </Text>
          </View>
        </SafeAreaView>
      );
    }

    // GUESS ANSWER – Phase 2: guess the other's answers + score feedback ─────
    if (
      activeGame.type === "GUESS_ANSWER" &&
      (activeGame.needsGuess || activeGame.waitingGuess)
    ) {
      const allAnswered =
        (activeGame.questions?.length ?? 0) > 0 &&
        activeGame.questions!.every((q: any) => guessAnswers[q.questionId]);

      return (
        <SafeAreaView style={styles.container} edges={["bottom"]}>
          <Stack.Screen
            options={{
              ...sharedHeader,
              headerTitle: "🎯 Adivina la Respuesta",
            }}
          />
          <ConfettiOverlay visible={showConfetti} />
          <ScrollView
            style={styles.gameContent}
            contentContainerStyle={styles.gameContentInner}
          >
            {activeGame.waitingGuess ? (
              // Already guessed — waiting for the other
              <View style={{ alignItems: "center", paddingVertical: 32 }}>
                <Text style={{ fontSize: 40, marginBottom: 12 }}>⏳</Text>
                <Text
                  style={[
                    styles.gameInstructions,
                    { textAlign: "center", marginBottom: 4 },
                  ]}
                >
                  ¡Ya adivinaste!
                </Text>
                <Text
                  style={[
                    styles.gameInstructions,
                    { textAlign: "center", color: colors.textSecondary },
                  ]}
                >
                  Obtuviste {activeGame.myScore ?? 0}/{activeGame.myTotal ?? 0}.
                  Esperando a que la otra persona adivine...
                </Text>
              </View>
            ) : !gaScore ? (
              // Pre-submit: question selection
              <>
                <Text style={styles.gameInstructions}>
                  ¿Qué respondió la otra persona a estas preguntas? ¡Adivina!
                </Text>
                {activeGame.questions!.map((q: any) => (
                  <View key={q.questionId} style={styles.gameQuestion}>
                    <Text style={styles.gameQuestionText}>
                      {q.questionText}
                    </Text>
                    <View style={styles.guessOptions}>
                      {q.options.map((option: string, optIndex: number) => (
                        <TouchableOpacity
                          key={optIndex}
                          style={[
                            styles.guessOption,
                            guessAnswers[q.questionId] === option &&
                              styles.guessOptionSelected,
                          ]}
                          onPress={() =>
                            setGuessAnswers((prev) => ({
                              ...prev,
                              [q.questionId]: option,
                            }))
                          }
                        >
                          <Text
                            style={[
                              styles.guessOptionText,
                              guessAnswers[q.questionId] === option &&
                                styles.guessOptionTextSelected,
                            ]}
                          >
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
                    { backgroundColor: "#2196F3" },
                    !allAnswered && styles.submitGameButtonDisabled,
                  ]}
                  onPress={submitGAGuess}
                  disabled={!allAnswered || isSubmitting}
                >
                  {isSubmitting ? (
                    <ActivityIndicator size="small" color={colors.text} />
                  ) : (
                    <Text style={styles.submitGameButtonText}>
                      Enviar respuestas
                    </Text>
                  )}
                </TouchableOpacity>
              </>
            ) : (
              // Post-submit: score & per-question result
              <>
                <View
                  style={[
                    styles.resultBanner,
                    gaScore.score === gaScore.total
                      ? styles.resultBannerCorrect
                      : gaScore.score >= gaScore.total / 2
                        ? {
                            backgroundColor: "#FF9800" + "22",
                            borderColor: "#FF9800",
                          }
                        : styles.resultBannerWrong,
                  ]}
                >
                  <Text style={styles.resultBannerEmoji}>
                    {gaScore.score === gaScore.total
                      ? "🎯"
                      : gaScore.score >= gaScore.total / 2
                        ? "👏"
                        : "😅"}
                  </Text>
                  <Text style={styles.resultBannerText}>
                    {gaScore.score === gaScore.total
                      ? "¡Perfectas! ¡Lo conoces muy bien!"
                      : `${gaScore.score} de ${gaScore.total} correctas`}
                  </Text>
                </View>

                <Text style={[styles.gameInstructions, { marginTop: 0 }]}>
                  Tus respuestas:
                </Text>

                {gaScore.questionsDetail.map((q, i) => (
                  <View
                    key={i}
                    style={[
                      styles.statementOption,
                      {
                        borderWidth: 2,
                        borderColor: q.isCorrect ? "#4CAF50" : "#FF5252",
                        backgroundColor: q.isCorrect
                          ? "#4CAF50" + "12"
                          : "#FF5252" + "12",
                      },
                    ]}
                  >
                    <Ionicons
                      name={q.isCorrect ? "checkmark-circle" : "close-circle"}
                      size={24}
                      color={q.isCorrect ? "#4CAF50" : "#FF5252"}
                    />
                    <View style={{ flex: 1, gap: 2 }}>
                      <Text style={styles.statementOptionText}>
                        {q.questionText}
                      </Text>
                      <Text
                        style={[
                          styles.statementOptionText,
                          { color: colors.textSecondary, fontSize: 12 },
                        ]}
                      >
                        Tu respuesta: {q.chosen}
                      </Text>
                      {!q.isCorrect && (
                        <Text
                          style={[
                            styles.statementOptionText,
                            { color: "#4CAF50", fontSize: 12 },
                          ]}
                        >
                          Respuesta correcta: {q.correct}
                        </Text>
                      )}
                    </View>
                  </View>
                ))}

                <TouchableOpacity
                  style={[
                    styles.submitGameButton,
                    { backgroundColor: colors.primary },
                  ]}
                  onPress={handleCloseGame}
                >
                  <Text style={styles.submitGameButtonText}>Continuar</Text>
                </TouchableOpacity>
              </>
            )}
          </ScrollView>
        </SafeAreaView>
      );
    }

    // COMPLETE PHRASE – Input (select options about the other person) ─────────
    if (activeGame.type === "COMPLETE_PHRASE" && activeGame.needsInput) {
      const allSelected =
        activeGame.phrases!.length > 0 &&
        activeGame.phrases!.every((_: any, i: number) => phraseSelections[i]);
      return (
        <SafeAreaView style={styles.container} edges={["bottom"]}>
          <Stack.Screen
            options={{ ...sharedHeader, headerTitle: "✍️ Completa la Frase" }}
          />
          <ScrollView
            style={styles.gameContent}
            contentContainerStyle={styles.gameContentInner}
          >
            <Text style={styles.gameInstructions}>
              Completa estas frases sobre la otra persona. ¡Ella verá tus
              respuestas y votará si acertaste!
            </Text>
            {activeGame.phrases!.map(
              (
                phrase: { phrase: string; options: string[] },
                index: number,
              ) => (
                <View key={index} style={styles.gameQuestion}>
                  <Text style={styles.phraseText}>{phrase.phrase}</Text>
                  <View style={styles.guessOptions}>
                    {phrase.options.map((option: string) => (
                      <TouchableOpacity
                        key={option}
                        style={[
                          styles.guessOption,
                          phraseSelections[index] === option &&
                            styles.guessOptionSelected,
                        ]}
                        onPress={() =>
                          setPhraseSelections((prev) => ({
                            ...prev,
                            [index]: option,
                          }))
                        }
                      >
                        <Text
                          style={[
                            styles.guessOptionText,
                            phraseSelections[index] === option &&
                              styles.guessOptionTextSelected,
                          ]}
                        >
                          {option}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              ),
            )}
            <TouchableOpacity
              style={[
                styles.submitGameButton,
                { backgroundColor: "#4CAF50" },
                !allSelected && styles.submitGameButtonDisabled,
              ]}
              onPress={submitCPAnswers}
              disabled={!allSelected || isSubmitting}
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

    // COMPLETE PHRASE – Voting (vote on other's answers about you) ───────────
    if (activeGame.type === "COMPLETE_PHRASE" && activeGame.needsVote) {
      const allVoted =
        activeGame.otherPhrases!.length > 0 &&
        activeGame.otherPhrases!.every(
          (_: any, i: number) => cpVotes[i] !== undefined,
        );
      return (
        <SafeAreaView style={styles.container} edges={["bottom"]}>
          <Stack.Screen
            options={{ ...sharedHeader, headerTitle: "✍️ ¿Acertó sobre ti?" }}
          />
          <ScrollView
            style={styles.gameContent}
            contentContainerStyle={styles.gameContentInner}
          >
            <Text style={styles.gameInstructions}>
              ¿Qué tan bien te conoce? Vota si acertó en cada frase sobre ti.
            </Text>
            {activeGame.otherPhrases!.map(
              (
                item: { phrase: string; chosenAnswer: string },
                index: number,
              ) => (
                <View key={index} style={styles.gameQuestion}>
                  <Text style={styles.phraseText}>{item.phrase}</Text>
                  <Text
                    style={[
                      styles.statementOptionText,
                      { marginBottom: spacing.sm, color: colors.textSecondary },
                    ]}
                  >
                    → {item.chosenAnswer}
                  </Text>
                  <View style={styles.voteRow}>
                    <TouchableOpacity
                      style={[
                        styles.voteButton,
                        cpVotes[index] === true && styles.voteButtonYes,
                      ]}
                      onPress={() =>
                        setCpVotes((prev) => ({ ...prev, [index]: true }))
                      }
                    >
                      <Text style={styles.voteButtonEmoji}>👍</Text>
                      <Text style={styles.voteButtonText}>Sí, acertó</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        styles.voteButton,
                        cpVotes[index] === false && styles.voteButtonNo,
                      ]}
                      onPress={() =>
                        setCpVotes((prev) => ({ ...prev, [index]: false }))
                      }
                    >
                      <Text style={styles.voteButtonEmoji}>👎</Text>
                      <Text style={styles.voteButtonText}>No acertó</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ),
            )}
            <TouchableOpacity
              style={[
                styles.submitGameButton,
                { backgroundColor: "#4CAF50" },
                !allVoted && styles.submitGameButtonDisabled,
              ]}
              onPress={submitCPVotes}
              disabled={!allVoted || isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator size="small" color={colors.text} />
              ) : (
                <Text style={styles.submitGameButtonText}>Enviar votos</Text>
              )}
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      );
    }

    // TRUTH OR LIE – Input form ───────────────────────────────────────────────
    if (activeGame.type === "TRUTH_OR_LIE" && activeGame.needsInput) {
      return (
        <SafeAreaView style={styles.container} edges={["bottom"]}>
          <Stack.Screen
            options={{
              ...sharedHeader,
              headerTitle: "🤥 2 Verdades 1 Mentira",
            }}
          />
          <ScrollView
            style={styles.gameContent}
            contentContainerStyle={styles.gameContentInner}
          >
            <Text style={styles.gameInstructions}>
              Escribe 2 verdades y 1 mentira sobre ti. ¡La otra persona tendrá
              que adivinar cuál es la mentira!
            </Text>
            {[0, 1, 2].map((index) => (
              <View key={index} style={styles.statementInput}>
                <View style={styles.statementHeader}>
                  <View
                    style={[
                      styles.statementBadge,
                      { backgroundColor: index < 2 ? "#4CAF50" : "#FF5252" },
                    ]}
                  >
                    <Text style={styles.statementBadgeText}>
                      {index < 2 ? "VERDAD" : "MENTIRA"}
                    </Text>
                  </View>
                </View>
                <TextInput
                  style={styles.phraseInput}
                  placeholder={
                    index < 2
                      ? "Escribe una verdad sobre ti..."
                      : "Escribe una mentira sobre ti..."
                  }
                  placeholderTextColor={colors.textMuted}
                  value={truthStatements[index]}
                  onChangeText={(text) => {
                    const next = [...truthStatements];
                    next[index] = text;
                    setTruthStatements(next);
                  }}
                  multiline
                />
              </View>
            ))}
            <TouchableOpacity
              style={[
                styles.submitGameButton,
                { backgroundColor: "#FF9800" },
                truthStatements.some((s) => !s.trim()) &&
                  styles.submitGameButtonDisabled,
              ]}
              onPress={submitTruthStatements}
              disabled={truthStatements.some((s) => !s.trim()) || isSubmitting}
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

    // TRUTH OR LIE – Guessing (+ result display) ─────────────────────────────
    if (activeGame.type === "TRUTH_OR_LIE" && activeGame.statements) {
      return (
        <SafeAreaView style={styles.container} edges={["bottom"]}>
          <Stack.Screen
            options={{ ...sharedHeader, headerTitle: "🤥 Adivina la Mentira" }}
          />
          <ConfettiOverlay visible={showConfetti} />

          <ScrollView
            style={styles.gameContent}
            contentContainerStyle={styles.gameContentInner}
          >
            {!guessResult ? (
              // Pre-submit: selection UI
              <>
                <Text style={styles.gameInstructions}>
                  Una de estas es una mentira. ¿Cuál crees que es?
                </Text>
                {activeGame.statements.map(
                  (statement: string, index: number) => (
                    <TouchableOpacity
                      key={index}
                      style={[
                        styles.statementOption,
                        selectedLie === index && styles.statementOptionSelected,
                      ]}
                      onPress={() => setSelectedLie(index)}
                      activeOpacity={0.75}
                    >
                      <View style={styles.statementOptionNumber}>
                        <Text style={styles.statementOptionNumberText}>
                          {index + 1}
                        </Text>
                      </View>
                      <Text
                        style={[
                          styles.statementOptionText,
                          selectedLie === index &&
                            styles.statementOptionTextSelected,
                        ]}
                      >
                        {statement}
                      </Text>
                      {selectedLie === index && (
                        <Ionicons
                          name="radio-button-on"
                          size={22}
                          color="#FF9800"
                        />
                      )}
                    </TouchableOpacity>
                  ),
                )}
                <TouchableOpacity
                  style={[
                    styles.submitGameButton,
                    { backgroundColor: "#FF9800" },
                    selectedLie === null && styles.submitGameButtonDisabled,
                  ]}
                  onPress={guessTheLie}
                  disabled={selectedLie === null || isSubmitting}
                >
                  {isSubmitting ? (
                    <ActivityIndicator size="small" color={colors.text} />
                  ) : (
                    <Text style={styles.submitGameButtonText}>¡Adivinar!</Text>
                  )}
                </TouchableOpacity>
              </>
            ) : (
              // Post-submit: result display
              <>
                <View
                  style={[
                    styles.resultBanner,
                    guessResult.correct
                      ? styles.resultBannerCorrect
                      : styles.resultBannerWrong,
                  ]}
                >
                  <Text style={styles.resultBannerEmoji}>
                    {guessResult.correct ? "🎉" : "😅"}
                  </Text>
                  <Text style={styles.resultBannerText}>
                    {guessResult.correct
                      ? "¡Lo adivinaste!"
                      : "¡Casi lo logras!"}
                  </Text>
                </View>
                <Text style={[styles.gameInstructions, { marginTop: 0 }]}>
                  Aquí está la verdad:
                </Text>
                {activeGame.statements.map(
                  (statement: string, index: number) => {
                    const isLie = statement === guessResult.correctStatement;
                    return (
                      <View
                        key={index}
                        style={[
                          styles.statementOption,
                          getStatementResultStyle(statement, guessResult),
                          { borderWidth: 2 },
                        ]}
                      >
                        <Ionicons
                          name={getStatementResultIcon(statement, guessResult)}
                          size={24}
                          color={getStatementResultIconColor(
                            statement,
                            guessResult,
                          )}
                        />
                        <Text style={[styles.statementOptionText, { flex: 1 }]}>
                          {statement}
                        </Text>
                        <Text
                          style={[
                            styles.statementLabel,
                            { color: isLie ? "#FF5252" : "#4CAF50" },
                          ]}
                        >
                          {isLie ? "MENTIRA" : "VERDAD"}
                        </Text>
                      </View>
                    );
                  },
                )}
                <TouchableOpacity
                  style={[
                    styles.submitGameButton,
                    { backgroundColor: colors.primary },
                  ]}
                  onPress={handleCloseGame}
                >
                  <Text style={styles.submitGameButtonText}>Continuar</Text>
                </TouchableOpacity>
              </>
            )}
          </ScrollView>

          {/* Wrong guess modal */}
          <Modal
            visible={showWrongModal}
            transparent
            animationType="fade"
            onRequestClose={() => {
              setShowWrongModal(false);
            }}
          >
            <View style={styles.modalOverlay}>
              <View style={styles.modalBox}>
                <Text style={styles.modalEmoji}>🙂</Text>
                <Text style={styles.modalTitle}>¡Uy, casi aciertas!</Text>
                <Text style={styles.modalSubtext}>
                  No pasa nada, ¡era complicado!
                </Text>
                <TouchableOpacity
                  style={styles.modalButton}
                  onPress={() => setShowWrongModal(false)}
                >
                  <Text style={styles.modalButtonText}>Ver resultado</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>
        </SafeAreaView>
      );
    }

    // COMPLETE PHRASE – Results view ─────────────────────────────────────────
    if (
      activeGame.type === "COMPLETE_PHRASE_RESULTS" &&
      activeGame.resultsData
    ) {
      const r = activeGame.resultsData as CompletePhraseResults;
      return (
        <SafeAreaView style={styles.container} edges={["bottom"]}>
          <Stack.Screen
            options={{ ...sharedHeader, headerTitle: "✍️ Resultados" }}
          />
          <ScrollView
            style={styles.gameContent}
            contentContainerStyle={styles.gameContentInner}
          >
            <View style={styles.resultScoreRow}>
              <View style={styles.resultScoreBox}>
                <Text style={styles.resultScoreName}>{r.myName}</Text>
                <Text style={styles.resultScoreNum}>{r.myScore}</Text>
                <Text style={styles.resultScoreLabel}>aciertos</Text>
              </View>
              <Text style={styles.resultScoreSep}>vs</Text>
              <View style={styles.resultScoreBox}>
                <Text style={styles.resultScoreName}>{r.otherName}</Text>
                <Text style={styles.resultScoreNum}>{r.otherScore}</Text>
                <Text style={styles.resultScoreLabel}>aciertos</Text>
              </View>
            </View>

            <Text style={styles.resultSectionTitle}>
              Lo que dijiste sobre {r.otherName}
            </Text>
            {r.myGuesses.map((g, i) => (
              <View
                key={i}
                style={[
                  styles.statementOption,
                  {
                    borderWidth: 2,
                    borderColor:
                      g.correct === true
                        ? "#4CAF50"
                        : g.correct === false
                          ? "#FF5252"
                          : colors.border,
                  },
                ]}
              >
                <Ionicons
                  name={
                    g.correct === true
                      ? "checkmark-circle"
                      : g.correct === false
                        ? "close-circle"
                        : "help-circle"
                  }
                  size={22}
                  color={
                    g.correct === true
                      ? "#4CAF50"
                      : g.correct === false
                        ? "#FF5252"
                        : colors.textMuted
                  }
                />
                <View style={{ flex: 1 }}>
                  <Text style={styles.statementOptionText}>{g.phrase}</Text>
                  <Text
                    style={[
                      styles.statementOptionText,
                      { color: colors.textSecondary, fontSize: fontSize.sm },
                    ]}
                  >
                    Tu respuesta: {g.myAnswer}
                  </Text>
                </View>
              </View>
            ))}

            <Text
              style={[styles.resultSectionTitle, { marginTop: spacing.lg }]}
            >
              Lo que dijo {r.otherName} sobre ti
            </Text>
            {r.otherGuesses.map((g, i) => (
              <View
                key={i}
                style={[
                  styles.statementOption,
                  {
                    borderWidth: 2,
                    borderColor:
                      g.correct === true
                        ? "#4CAF50"
                        : g.correct === false
                          ? "#FF5252"
                          : colors.border,
                  },
                ]}
              >
                <Ionicons
                  name={
                    g.correct === true
                      ? "checkmark-circle"
                      : g.correct === false
                        ? "close-circle"
                        : "help-circle"
                  }
                  size={22}
                  color={
                    g.correct === true
                      ? "#4CAF50"
                      : g.correct === false
                        ? "#FF5252"
                        : colors.textMuted
                  }
                />
                <View style={{ flex: 1 }}>
                  <Text style={styles.statementOptionText}>{g.phrase}</Text>
                  <Text
                    style={[
                      styles.statementOptionText,
                      { color: colors.textSecondary, fontSize: fontSize.sm },
                    ]}
                  >
                    Su respuesta: {g.theirAnswer}
                  </Text>
                </View>
              </View>
            ))}

            <TouchableOpacity
              style={[
                styles.submitGameButton,
                { backgroundColor: colors.primary },
              ]}
              onPress={handleCloseGame}
            >
              <Text style={styles.submitGameButtonText}>Cerrar</Text>
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      );
    }

    // GUESS ANSWER – Results view ─────────────────────────────────────────────
    if (activeGame.type === "GUESS_ANSWER_RESULTS" && activeGame.resultsData) {
      const r = activeGame.resultsData as GuessAnswerResults;
      return (
        <SafeAreaView style={styles.container} edges={["bottom"]}>
          <Stack.Screen
            options={{ ...sharedHeader, headerTitle: "🎯 Resultados" }}
          />
          <ScrollView
            style={styles.gameContent}
            contentContainerStyle={styles.gameContentInner}
          >
            <View style={styles.resultScoreRow}>
              <View style={styles.resultScoreBox}>
                <Text style={styles.resultScoreName}>{r.myName}</Text>
                <Text style={styles.resultScoreNum}>{r.myScore}</Text>
                <Text style={styles.resultScoreLabel}>de {r.total}</Text>
              </View>
              <Text style={styles.resultScoreSep}>vs</Text>
              <View style={styles.resultScoreBox}>
                <Text style={styles.resultScoreName}>{r.otherName}</Text>
                <Text style={styles.resultScoreNum}>{r.otherScore}</Text>
                <Text style={styles.resultScoreLabel}>de {r.total}</Text>
              </View>
            </View>

            {r.myGuessDetail.length > 0 && (
              <>
                <Text style={styles.resultSectionTitle}>
                  Tus adivinanzas sobre {r.otherName}
                </Text>
                {r.myGuessDetail.map((q, i) => (
                  <View
                    key={i}
                    style={[
                      styles.statementOption,
                      {
                        borderWidth: 2,
                        borderColor:
                          q.isCorrect === true
                            ? "#4CAF50"
                            : q.isCorrect === false
                              ? "#FF5252"
                              : colors.border,
                        backgroundColor:
                          q.isCorrect === true
                            ? "#4CAF50" + "12"
                            : q.isCorrect === false
                              ? "#FF5252" + "12"
                              : "transparent",
                      },
                    ]}
                  >
                    <Ionicons
                      name={
                        q.isCorrect === true
                          ? "checkmark-circle"
                          : q.isCorrect === false
                            ? "close-circle"
                            : "help-circle"
                      }
                      size={22}
                      color={
                        q.isCorrect === true
                          ? "#4CAF50"
                          : q.isCorrect === false
                            ? "#FF5252"
                            : colors.textMuted
                      }
                    />
                    <View style={{ flex: 1, gap: 2 }}>
                      <Text style={styles.statementOptionText}>
                        {q.questionText}
                      </Text>
                      <Text
                        style={[
                          styles.statementOptionText,
                          {
                            color: colors.textSecondary,
                            fontSize: fontSize.sm,
                          },
                        ]}
                      >
                        Tu respuesta: {q.myGuess ?? "—"}
                      </Text>
                      {q.isCorrect === false && (
                        <Text
                          style={[
                            styles.statementOptionText,
                            { color: "#4CAF50", fontSize: fontSize.sm },
                          ]}
                        >
                          Respuesta real: {q.otherActual}
                        </Text>
                      )}
                    </View>
                  </View>
                ))}
              </>
            )}

            {r.otherGuessDetail.length > 0 && (
              <>
                <Text
                  style={[styles.resultSectionTitle, { marginTop: spacing.lg }]}
                >
                  Adivinanzas de {r.otherName} sobre ti
                </Text>
                {r.otherGuessDetail.map((q, i) => (
                  <View
                    key={i}
                    style={[
                      styles.statementOption,
                      {
                        borderWidth: 2,
                        borderColor:
                          q.isCorrect === true
                            ? "#4CAF50"
                            : q.isCorrect === false
                              ? "#FF5252"
                              : colors.border,
                        backgroundColor:
                          q.isCorrect === true
                            ? "#4CAF50" + "12"
                            : q.isCorrect === false
                              ? "#FF5252" + "12"
                              : "transparent",
                      },
                    ]}
                  >
                    <Ionicons
                      name={
                        q.isCorrect === true
                          ? "checkmark-circle"
                          : q.isCorrect === false
                            ? "close-circle"
                            : "help-circle"
                      }
                      size={22}
                      color={
                        q.isCorrect === true
                          ? "#4CAF50"
                          : q.isCorrect === false
                            ? "#FF5252"
                            : colors.textMuted
                      }
                    />
                    <View style={{ flex: 1, gap: 2 }}>
                      <Text style={styles.statementOptionText}>
                        {q.questionText}
                      </Text>
                      <Text
                        style={[
                          styles.statementOptionText,
                          {
                            color: colors.textSecondary,
                            fontSize: fontSize.sm,
                          },
                        ]}
                      >
                        Su respuesta: {q.otherGuess ?? "—"}
                      </Text>
                      {q.isCorrect === false && (
                        <Text
                          style={[
                            styles.statementOptionText,
                            { color: "#4CAF50", fontSize: fontSize.sm },
                          ]}
                        >
                          Tu respuesta real: {q.myActual}
                        </Text>
                      )}
                    </View>
                  </View>
                ))}
              </>
            )}

            <TouchableOpacity
              style={[
                styles.submitGameButton,
                { backgroundColor: colors.primary },
              ]}
              onPress={handleCloseGame}
            >
              <Text style={styles.submitGameButtonText}>Cerrar</Text>
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      );
    }

    // TRUTH OR LIE – Results view ─────────────────────────────────────────────
    if (activeGame.type === "TRUTH_OR_LIE_RESULTS" && activeGame.resultsData) {
      const rd = activeGame.resultsData as TruthOrLieResults;
      return (
        <SafeAreaView style={styles.container} edges={["bottom"]}>
          <Stack.Screen
            options={{ ...sharedHeader, headerTitle: "🤥 Resultados" }}
          />
          <ScrollView
            style={styles.gameContent}
            contentContainerStyle={styles.gameContentInner}
          >
            {rd.myStatements && (
              <View style={styles.resultsSection}>
                <Text style={styles.resultsSectionTitle}>
                  Tus verdades y mentira
                </Text>
                {rd.myStatements.truths.map((t, i) => (
                  <View
                    key={i}
                    style={[
                      styles.resultsStatement,
                      styles.resultsStatementTrue,
                    ]}
                  >
                    <Ionicons
                      name="checkmark-circle"
                      size={18}
                      color="#4CAF50"
                    />
                    <Text style={styles.resultsStatementText}>{t}</Text>
                    <Text style={styles.resultsLabel}>VERDAD</Text>
                  </View>
                ))}
                <View
                  style={[styles.resultsStatement, styles.resultsStatementLie]}
                >
                  <Ionicons name="close-circle" size={18} color="#FF5252" />
                  <Text style={styles.resultsStatementText}>
                    {rd.myStatements.lie}
                  </Text>
                  <Text style={[styles.resultsLabel, { color: "#FF5252" }]}>
                    MENTIRA
                  </Text>
                </View>
                {rd.otherGuess && (
                  <Text style={styles.resultsGuessNote}>
                    {rd.otherName}{" "}
                    {rd.otherGuess.correct
                      ? "✅ adivinó tu mentira"
                      : `❌ pensó que "${rd.otherGuess.guessed}" era la mentira`}
                  </Text>
                )}
              </View>
            )}
            {rd.otherStatements && (
              <View style={styles.resultsSection}>
                <Text style={styles.resultsSectionTitle}>
                  Verdades y mentira de {rd.otherName}
                </Text>
                {rd.otherStatements.truths.map((t, i) => (
                  <View
                    key={i}
                    style={[
                      styles.resultsStatement,
                      styles.resultsStatementTrue,
                    ]}
                  >
                    <Ionicons
                      name="checkmark-circle"
                      size={18}
                      color="#4CAF50"
                    />
                    <Text style={styles.resultsStatementText}>{t}</Text>
                    <Text style={styles.resultsLabel}>VERDAD</Text>
                  </View>
                ))}
                <View
                  style={[styles.resultsStatement, styles.resultsStatementLie]}
                >
                  <Ionicons name="close-circle" size={18} color="#FF5252" />
                  <Text style={styles.resultsStatementText}>
                    {rd.otherStatements.lie}
                  </Text>
                  <Text style={[styles.resultsLabel, { color: "#FF5252" }]}>
                    MENTIRA
                  </Text>
                </View>
                {rd.myGuess && (
                  <Text style={styles.resultsGuessNote}>
                    Tú{" "}
                    {rd.myGuess.correct
                      ? "✅ adivinaste la mentira"
                      : `❌ pensaste que "${rd.myGuess.guessed}" era la mentira`}
                  </Text>
                )}
              </View>
            )}
          </ScrollView>
        </SafeAreaView>
      );
    }
  }

  // ── Games list ─────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.container} edges={["bottom"]}>
      <Stack.Screen
        options={{
          headerShown: true,
          headerTitle: "Mini Juegos",
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.text,
          headerBackVisible: true,
          gestureEnabled: true,
        }}
      />
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentInner}
      >
        <View style={styles.progressBanner}>
          <Text style={styles.progressText}>
            {gamesData?.completed || 0} de {gamesData?.total || 3} juegos
            completados
          </Text>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressBarFill,
                {
                  width: `${((gamesData?.completed || 0) / (gamesData?.total || 3)) * 100}%`,
                },
              ]}
            />
          </View>
        </View>

        <View style={styles.gamesGrid}>
          {gamesData?.games.map((game) => {
            const isTOL = game.type === "TRUTH_OR_LIE";
            const isCP = game.type === "COMPLETE_PHRASE";
            const isGA = game.type === "GUESS_ANSWER";
            const isSpecial = isTOL || isCP || isGA;

            const tolNeedsPlay =
              isTOL && game.status !== "COMPLETED" && !game.mySubmitted;
            const cpNeedsPlay =
              isCP && game.status !== "COMPLETED" && !game.mySubmitted;
            const gaNeedsPlay =
              isGA && game.status !== "COMPLETED" && !game.myFilled;
            const showDefaultPlay = !isSpecial && game.status === "PENDING";
            const showInProgress = !isSpecial && game.status === "IN_PROGRESS";

            return (
              <TouchableOpacity
                key={game.type}
                style={[
                  styles.gameCard,
                  game.status === "COMPLETED" && styles.gameCardCompleted,
                ]}
                onPress={() => {
                  if (!isSpecial && game.status !== "COMPLETED")
                    startGame(game.type);
                }}
                disabled={
                  isSpecial || game.status === "COMPLETED" || isStarting
                }
                activeOpacity={isSpecial ? 1 : 0.7}
              >
                <View
                  style={[
                    styles.gameIcon,
                    { backgroundColor: getGameColor(game.type) + "20" },
                  ]}
                >
                  <Text style={styles.gameEmoji}>
                    {getGameEmoji(game.type)}
                  </Text>
                </View>
                <Text style={styles.gameName}>{game.name}</Text>
                <Text style={styles.gameDescription}>{game.description}</Text>

                {game.status === "COMPLETED" && !isSpecial && (
                  <View style={styles.completedBadge}>
                    <Ionicons
                      name="checkmark-circle"
                      size={16}
                      color={colors.success}
                    />
                    <Text style={styles.completedBadgeText}>Completado</Text>
                  </View>
                )}

                {showDefaultPlay && (
                  <View
                    style={[
                      styles.playButton,
                      { backgroundColor: getGameColor(game.type) },
                    ]}
                  >
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

                {showInProgress && (
                  <View
                    style={[
                      styles.statusBadge,
                      { backgroundColor: "#FF9800" + "20" },
                    ]}
                  >
                    <Text
                      style={[styles.statusBadgeText, { color: "#FF9800" }]}
                    >
                      En progreso
                    </Text>
                  </View>
                )}

                {/* GUESS_ANSWER dynamic states */}
                {isGA && renderGuessAnswerExtra(game)}

                {/* GA: initial "Jugar" */}
                {gaNeedsPlay && (
                  <TouchableOpacity
                    style={[
                      styles.playButton,
                      { backgroundColor: "#2196F3", marginTop: spacing.sm },
                    ]}
                    onPress={() => startGame(game.type)}
                    disabled={isStarting}
                  >
                    {isStarting ? (
                      <ActivityIndicator size="small" color={colors.text} />
                    ) : (
                      <>
                        <Text style={styles.playButtonText}>Jugar</Text>
                        <Ionicons name="play" size={16} color={colors.text} />
                      </>
                    )}
                  </TouchableOpacity>
                )}

                {/* COMPLETE_PHRASE dynamic states */}
                {isCP && renderCompletePhraseExtra(game)}

                {/* CP: initial “Jugar” to fill phrases */}
                {cpNeedsPlay && (
                  <TouchableOpacity
                    style={[
                      styles.playButton,
                      { backgroundColor: "#4CAF50", marginTop: spacing.sm },
                    ]}
                    onPress={() => startGame(game.type)}
                    disabled={isStarting}
                  >
                    {isStarting ? (
                      <ActivityIndicator size="small" color={colors.text} />
                    ) : (
                      <>
                        <Text style={styles.playButtonText}>Jugar</Text>
                        <Ionicons name="play" size={16} color={colors.text} />
                      </>
                    )}
                  </TouchableOpacity>
                )}

                {/* TRUTH_OR_LIE dynamic states */}
                {isTOL && renderTruthOrLieExtra(game)}

                {/* TOL: initial "Jugar" to enter own statements */}
                {tolNeedsPlay && (
                  <TouchableOpacity
                    style={[
                      styles.playButton,
                      { backgroundColor: "#FF9800", marginTop: spacing.sm },
                    ]}
                    onPress={() => startGame(game.type)}
                    disabled={isStarting}
                  >
                    {isStarting ? (
                      <ActivityIndicator size="small" color={colors.text} />
                    ) : (
                      <>
                        <Text style={styles.playButtonText}>Jugar</Text>
                        <Ionicons name="play" size={16} color={colors.text} />
                      </>
                    )}
                  </TouchableOpacity>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  content: { flex: 1 },
  contentInner: { padding: spacing.lg, gap: spacing.lg },

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
    textAlign: "center",
  },
  progressBar: {
    height: 8,
    backgroundColor: colors.border,
    borderRadius: 4,
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    backgroundColor: colors.success,
    borderRadius: 4,
  },

  gamesGrid: { gap: spacing.md },
  gameCard: {
    backgroundColor: colors.backgroundCard,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    alignItems: "center",
    gap: spacing.sm,
    ...shadows.md,
  },
  gameCardCompleted: { opacity: 0.75 },
  gameIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: "center",
    alignItems: "center",
  },
  gameEmoji: { fontSize: 32 },
  gameName: {
    color: colors.text,
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
  },
  gameDescription: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
    textAlign: "center",
  },

  completedBadge: {
    flexDirection: "row",
    alignItems: "center",
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
  statusBadgeText: { fontSize: fontSize.sm, fontWeight: fontWeight.medium },

  playButton: {
    flexDirection: "row",
    alignItems: "center",
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

  // TRUTH_OR_LIE card extras
  tolExtra: { alignItems: "center", gap: spacing.xs, width: "100%" },
  tolWaitText: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
    textAlign: "center",
    fontStyle: "italic",
  },
  tolCTAText: {
    color: colors.text,
    fontSize: fontSize.sm,
    textAlign: "center",
  },
  tolResultText: {
    color: colors.text,
    fontSize: fontSize.sm,
    textAlign: "center",
    fontWeight: fontWeight.medium,
  },
  statementLabel: { fontSize: 10, fontWeight: fontWeight.bold },

  // Active game content
  gameContent: { flex: 1 },
  gameContentInner: { padding: spacing.lg, gap: spacing.lg },
  gameInstructions: {
    color: colors.textSecondary,
    fontSize: fontSize.md,
    textAlign: "center",
    marginBottom: spacing.sm,
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
  guessOptions: { gap: spacing.sm },
  guessOption: {
    backgroundColor: colors.backgroundLight,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 2,
    borderColor: "transparent",
  },
  guessOptionSelected: {
    borderColor: "#2196F3",
    backgroundColor: "#2196F3" + "20",
  },
  guessOptionText: {
    color: colors.text,
    fontSize: fontSize.md,
    textAlign: "center",
  },
  guessOptionTextSelected: {
    color: "#2196F3",
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
    backgroundColor: "#2196F3",
    padding: spacing.lg,
    borderRadius: borderRadius.md,
    alignItems: "center",
    marginTop: spacing.md,
  },
  submitGameButtonDisabled: { opacity: 0.45 },
  submitGameButtonText: {
    color: colors.text,
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
  },

  // TOL input form
  statementInput: {
    backgroundColor: colors.backgroundCard,
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    gap: spacing.sm,
  },
  statementHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  statementBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: borderRadius.sm,
  },
  statementBadgeText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: fontWeight.bold,
    letterSpacing: 0.5,
  },

  // TOL guessing
  statementOption: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.backgroundCard,
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    gap: spacing.md,
    borderWidth: 2,
    borderColor: "transparent",
  },
  statementOptionSelected: {
    borderColor: "#FF9800",
    backgroundColor: "#FF9800" + "12",
  },
  statementOptionNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.backgroundLight,
    justifyContent: "center",
    alignItems: "center",
  },
  statementOptionNumberText: {
    color: colors.text,
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
  },
  statementOptionText: { flex: 1, color: colors.text, fontSize: fontSize.md },
  statementOptionTextSelected: { fontWeight: fontWeight.medium },

  // TOL result banner
  resultBanner: {
    flexDirection: "row",
    alignItems: "center",
    padding: spacing.lg,
    borderRadius: borderRadius.xl,
    gap: spacing.md,
    marginBottom: spacing.sm,
  },
  resultBannerCorrect: {
    backgroundColor: "#4CAF50" + "20",
    borderWidth: 1,
    borderColor: "#4CAF50",
  },
  resultBannerWrong: {
    backgroundColor: "#FF5252" + "20",
    borderWidth: 1,
    borderColor: "#FF5252",
  },
  resultBannerEmoji: { fontSize: 32 },
  resultBannerText: {
    flex: 1,
    color: colors.text,
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
  },

  // Wrong-guess modal
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.65)",
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.xl,
  },
  modalBox: {
    backgroundColor: colors.backgroundCard,
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    alignItems: "center",
    gap: spacing.md,
    width: "100%",
    maxWidth: 320,
    ...shadows.lg,
  },
  modalEmoji: { fontSize: 56 },
  modalTitle: {
    color: colors.text,
    fontSize: fontSize.xxl,
    fontWeight: fontWeight.bold,
    textAlign: "center",
  },
  modalSubtext: {
    color: colors.textSecondary,
    fontSize: fontSize.md,
    textAlign: "center",
  },
  modalButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    marginTop: spacing.sm,
  },
  modalButtonText: {
    color: colors.text,
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
  },

  // Results view
  resultsSection: {
    backgroundColor: colors.backgroundCard,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  resultsSectionTitle: {
    color: colors.text,
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    marginBottom: spacing.xs,
  },
  resultsStatement: {
    flexDirection: "row",
    alignItems: "center",
    padding: spacing.md,
    borderRadius: borderRadius.md,
    gap: spacing.sm,
    borderWidth: 1,
  },
  resultsStatementTrue: {
    backgroundColor: "#4CAF50" + "12",
    borderColor: "#4CAF50" + "40",
  },
  resultsStatementLie: {
    backgroundColor: "#FF5252" + "12",
    borderColor: "#FF5252" + "40",
  },
  resultsStatementText: { flex: 1, color: colors.text, fontSize: fontSize.sm },
  resultsLabel: { color: "#4CAF50", fontSize: 10, fontWeight: fontWeight.bold },
  resultsGuessNote: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
    fontStyle: "italic",
    marginTop: spacing.xs,
  },

  // Complete-phrase voting
  voteRow: {
    flexDirection: "row",
    gap: spacing.md,
    marginTop: spacing.xs,
  },
  voteButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xs,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    backgroundColor: colors.backgroundLight,
    borderWidth: 2,
    borderColor: "transparent",
  },
  voteButtonYes: {
    borderColor: "#4CAF50",
    backgroundColor: "#4CAF50" + "20",
  },
  voteButtonNo: {
    borderColor: "#FF5252",
    backgroundColor: "#FF5252" + "20",
  },
  voteButtonEmoji: { fontSize: 20 },
  voteButtonText: { color: colors.text, fontSize: fontSize.sm },

  // CP results score header
  resultScoreRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.lg,
    backgroundColor: colors.backgroundCard,
    padding: spacing.lg,
    borderRadius: borderRadius.xl,
    marginBottom: spacing.md,
  },
  resultScoreBox: { alignItems: "center", gap: 2 },
  resultScoreName: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
  },
  resultScoreNum: {
    color: colors.text,
    fontSize: 36,
    fontWeight: fontWeight.bold,
  },
  resultScoreLabel: { color: colors.textSecondary, fontSize: fontSize.xs },
  resultScoreSep: {
    color: colors.textMuted,
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
  },
  resultSectionTitle: {
    color: colors.text,
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    marginBottom: spacing.xs,
  },
});
