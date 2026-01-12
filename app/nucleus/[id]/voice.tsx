import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Animated,
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import { api } from '../../../src/services/api';
import { useNucleusStore } from '../../../src/store/nucleus.store';
import { colors, fontSize, fontWeight, spacing, borderRadius, shadows } from '../../../src/utils/theme';

interface VoiceData {
  userVoice: { audioUrl: string; duration: number; prompt: string } | null;
  otherVoice: { audioUrl: string; duration: number; prompt: string } | null;
  prompt: string;
  bothCompleted: boolean;
}

export default function VoiceScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { uploadVoiceNote, loadOverview } = useNucleusStore();

  const [voiceData, setVoiceData] = useState<VoiceData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [recordingUri, setRecordingUri] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isPlaying, setIsPlaying] = useState<'user' | 'other' | null>(null);

  const recordingRef = useRef<Audio.Recording | null>(null);
  const soundRef = useRef<Audio.Sound | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    loadVoiceData();
    setupAudio();

    return () => {
      cleanup();
    };
  }, [id]);

  useEffect(() => {
    if (isRecording) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.2,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [isRecording]);

  const cleanup = async () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    if (recordingRef.current) {
      try {
        await recordingRef.current.stopAndUnloadAsync();
      } catch (e) {}
    }
    if (soundRef.current) {
      try {
        await soundRef.current.unloadAsync();
      } catch (e) {}
    }
  };

  const setupAudio = async () => {
    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });
    } catch (error) {
      console.error('Error setting up audio:', error);
    }
  };

  const loadVoiceData = async () => {
    try {
      const response = await api.get(`/nucleus/${id}/voice`);
      setVoiceData(response.data);
    } catch (error) {
      console.error('Error loading voice data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const startRecording = async () => {
    try {
      const permission = await Audio.requestPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Permiso requerido', 'Necesitamos acceso al microfono para grabar notas de voz');
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );

      recordingRef.current = recording;
      setIsRecording(true);
      setRecordingDuration(0);

      timerRef.current = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);
    } catch (error) {
      console.error('Error starting recording:', error);
      Alert.alert('Error', 'No se pudo iniciar la grabacion');
    }
  };

  const stopRecording = async () => {
    if (!recordingRef.current) return;

    try {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }

      await recordingRef.current.stopAndUnloadAsync();
      const uri = recordingRef.current.getURI();
      recordingRef.current = null;

      setIsRecording(false);
      setRecordingUri(uri);
    } catch (error) {
      console.error('Error stopping recording:', error);
      setIsRecording(false);
    }
  };

  const cancelRecording = () => {
    setRecordingUri(null);
    setRecordingDuration(0);
  };

  const handleUpload = async () => {
    if (!recordingUri || !voiceData) return;

    setIsUploading(true);
    try {
      const result = await uploadVoiceNote(id!, recordingUri, recordingDuration, voiceData.prompt);
      if (result) {
        await loadVoiceData();
        await loadOverview(id!);
        setRecordingUri(null);
        setRecordingDuration(0);
      }
    } catch (error) {
      console.error('Error uploading voice note:', error);
      Alert.alert('Error', 'No se pudo subir la nota de voz');
    } finally {
      setIsUploading(false);
    }
  };

  const playAudio = async (audioUrl: string, type: 'user' | 'other') => {
    try {
      if (soundRef.current) {
        await soundRef.current.unloadAsync();
      }

      const { sound } = await Audio.Sound.createAsync({ uri: audioUrl });
      soundRef.current = sound;
      setIsPlaying(type);

      await sound.playAsync();

      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) {
          setIsPlaying(null);
        }
      });
    } catch (error) {
      console.error('Error playing audio:', error);
      setIsPlaying(null);
    }
  };

  const stopAudio = async () => {
    if (soundRef.current) {
      await soundRef.current.stopAsync();
      setIsPlaying(null);
    }
  };

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <Stack.Screen
          options={{
            headerShown: true,
            headerTitle: 'Nota de Voz',
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

  if (!voiceData) {
    return (
      <SafeAreaView style={styles.container}>
        <Stack.Screen
          options={{
            headerShown: true,
            headerTitle: 'Nota de Voz',
            headerStyle: { backgroundColor: colors.background },
            headerTintColor: colors.text,
            headerBackVisible: true,
          }}
        />
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={64} color={colors.error} />
          <Text style={styles.errorText}>Error al cargar</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <Stack.Screen
        options={{
          headerShown: true,
          headerTitle: 'Nota de Voz',
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.text,
          headerBackVisible: true,
        }}
      />

      <View style={styles.content}>
        {/* Prompt Card */}
        <View style={styles.promptCard}>
          <Ionicons name="mic" size={32} color="#9C27B0" />
          <Text style={styles.promptTitle}>El prompt de hoy:</Text>
          <Text style={styles.promptText}>{voiceData.prompt}</Text>
        </View>

        {/* Voice Notes */}
        <View style={styles.voiceNotesContainer}>
          {/* User Voice Note */}
          <View style={styles.voiceCard}>
            <Text style={styles.voiceLabel}>Tu nota</Text>
            {voiceData.userVoice ? (
              <TouchableOpacity
                style={styles.voicePlayer}
                onPress={() => isPlaying === 'user' ? stopAudio() : playAudio(voiceData.userVoice!.audioUrl, 'user')}
              >
                <Ionicons
                  name={isPlaying === 'user' ? 'stop-circle' : 'play-circle'}
                  size={48}
                  color="#9C27B0"
                />
                <View style={styles.voiceInfo}>
                  <Text style={styles.voiceDuration}>
                    {formatDuration(voiceData.userVoice.duration)}
                  </Text>
                  <View style={styles.waveform}>
                    {[...Array(20)].map((_, i) => (
                      <View
                        key={i}
                        style={[
                          styles.waveformBar,
                          { height: Math.random() * 20 + 10 },
                        ]}
                      />
                    ))}
                  </View>
                </View>
              </TouchableOpacity>
            ) : recordingUri ? (
              <View style={styles.recordingPreview}>
                <Ionicons name="mic" size={32} color="#9C27B0" />
                <Text style={styles.recordingDuration}>
                  {formatDuration(recordingDuration)}
                </Text>
                <View style={styles.recordingActions}>
                  <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={cancelRecording}
                  >
                    <Ionicons name="trash" size={20} color={colors.error} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.uploadVoiceButton, isUploading && styles.uploadButtonDisabled]}
                    onPress={handleUpload}
                    disabled={isUploading}
                  >
                    {isUploading ? (
                      <ActivityIndicator size="small" color={colors.text} />
                    ) : (
                      <>
                        <Text style={styles.uploadVoiceText}>Enviar</Text>
                        <Ionicons name="send" size={16} color={colors.text} />
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <View style={styles.voicePlaceholder}>
                <Ionicons name="mic-outline" size={48} color={colors.textMuted} />
                <Text style={styles.voicePlaceholderText}>Sin grabar</Text>
              </View>
            )}
          </View>

          {/* Other Voice Note */}
          <View style={styles.voiceCard}>
            <Text style={styles.voiceLabel}>Su nota</Text>
            {voiceData.bothCompleted && voiceData.otherVoice ? (
              <TouchableOpacity
                style={styles.voicePlayer}
                onPress={() => isPlaying === 'other' ? stopAudio() : playAudio(voiceData.otherVoice!.audioUrl, 'other')}
              >
                <Ionicons
                  name={isPlaying === 'other' ? 'stop-circle' : 'play-circle'}
                  size={48}
                  color="#9C27B0"
                />
                <View style={styles.voiceInfo}>
                  <Text style={styles.voiceDuration}>
                    {formatDuration(voiceData.otherVoice.duration)}
                  </Text>
                  <View style={styles.waveform}>
                    {[...Array(20)].map((_, i) => (
                      <View
                        key={i}
                        style={[
                          styles.waveformBar,
                          { height: Math.random() * 20 + 10 },
                        ]}
                      />
                    ))}
                  </View>
                </View>
              </TouchableOpacity>
            ) : voiceData.otherVoice ? (
              <View style={styles.voicePlaceholder}>
                <Ionicons name="lock-closed" size={48} color={colors.textMuted} />
                <Text style={styles.voicePlaceholderText}>
                  {voiceData.userVoice ? 'Esperando...' : 'Graba tu nota para escuchar'}
                </Text>
              </View>
            ) : (
              <View style={styles.voicePlaceholder}>
                <Ionicons name="time" size={48} color={colors.textMuted} />
                <Text style={styles.voicePlaceholderText}>Esperando...</Text>
              </View>
            )}
          </View>
        </View>

        {/* Recording Button */}
        {!voiceData.userVoice && !recordingUri && (
          <View style={styles.recordingContainer}>
            {isRecording && (
              <Text style={styles.recordingTimer}>
                {formatDuration(recordingDuration)}
              </Text>
            )}

            <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
              <TouchableOpacity
                style={[
                  styles.recordButton,
                  isRecording && styles.recordButtonActive,
                ]}
                onPress={isRecording ? stopRecording : startRecording}
              >
                <Ionicons
                  name={isRecording ? 'stop' : 'mic'}
                  size={32}
                  color={colors.text}
                />
              </TouchableOpacity>
            </Animated.View>

            <Text style={styles.recordHint}>
              {isRecording ? 'Toca para detener' : 'Mantén para grabar'}
            </Text>
          </View>
        )}

        {voiceData.bothCompleted && (
          <View style={styles.completedBanner}>
            <Ionicons name="checkmark-circle" size={24} color={colors.success} />
            <Text style={styles.completedText}>Ambos enviaron su nota!</Text>
          </View>
        )}
      </View>
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.md,
  },
  errorText: {
    color: colors.error,
    fontSize: fontSize.lg,
  },
  content: {
    flex: 1,
    padding: spacing.lg,
    gap: spacing.lg,
  },
  promptCard: {
    backgroundColor: colors.backgroundCard,
    padding: spacing.lg,
    borderRadius: borderRadius.xl,
    alignItems: 'center',
    gap: spacing.sm,
    ...shadows.md,
  },
  promptTitle: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
  },
  promptText: {
    color: colors.text,
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    textAlign: 'center',
  },
  voiceNotesContainer: {
    flex: 1,
    gap: spacing.md,
  },
  voiceCard: {
    flex: 1,
    backgroundColor: colors.backgroundCard,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    ...shadows.sm,
  },
  voiceLabel: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    marginBottom: spacing.md,
  },
  voicePlayer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  voiceInfo: {
    flex: 1,
    gap: spacing.sm,
  },
  voiceDuration: {
    color: colors.text,
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
  },
  waveform: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    height: 30,
  },
  waveformBar: {
    width: 3,
    backgroundColor: '#9C27B0',
    borderRadius: 2,
  },
  voicePlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.sm,
    borderWidth: 2,
    borderColor: colors.border,
    borderStyle: 'dashed',
    borderRadius: borderRadius.lg,
    margin: spacing.sm,
  },
  voicePlaceholderText: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
    textAlign: 'center',
  },
  recordingPreview: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.md,
  },
  recordingDuration: {
    color: colors.text,
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
  },
  recordingActions: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  cancelButton: {
    padding: spacing.md,
    backgroundColor: colors.error + '20',
    borderRadius: borderRadius.full,
  },
  uploadVoiceButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#9C27B0',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.full,
    gap: spacing.sm,
  },
  uploadButtonDisabled: {
    opacity: 0.5,
  },
  uploadVoiceText: {
    color: colors.text,
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
  },
  recordingContainer: {
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.xl,
  },
  recordingTimer: {
    color: colors.error,
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
  },
  recordButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#9C27B0',
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.lg,
  },
  recordButtonActive: {
    backgroundColor: colors.error,
  },
  recordHint: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
  },
  completedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.success + '20',
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    gap: spacing.sm,
  },
  completedText: {
    color: colors.success,
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
  },
});
