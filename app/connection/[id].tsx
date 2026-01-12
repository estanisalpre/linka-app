import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Image,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { ProgressRing, Button } from '../../src/components';
import { useConnectionStore } from '../../src/store/connection.store';
import { joinConnection, leaveConnection, getSocket, SocketEvents } from '../../src/services/socket';
import { colors, fontSize, fontWeight, spacing, borderRadius } from '../../src/utils/theme';

export default function ConnectionDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const {
    activeConnection,
    otherUserPresent,
    messages,
    loadConnection,
    loadMessages,
    sendMessage,
    addMessage,
    setOtherUserPresent,
    clearActiveConnection,
    isLoading,
  } = useConnectionStore();

  const [activeTab, setActiveTab] = useState<'nucleus' | 'chat'>('nucleus');
  const [messageText, setMessageText] = useState('');

  useEffect(() => {
    if (id) {
      loadConnection(id);
      joinConnection(id);

      // Listen for real-time updates
      const socket = getSocket();
      if (socket) {
        // New message
        socket.on(SocketEvents.NEW_MESSAGE, (message: any) => {
          if (message.connectionId === id) {
            addMessage(message);
          }
        });

        socket.on(SocketEvents.PROGRESS_UPDATE, () => {
          loadConnection(id);
        });

        // Presence events
        socket.on(SocketEvents.PRESENCE_JOINED, (data: { userId: string }) => {
          if (activeConnection && data.userId !== activeConnection.initiatorId &&
              data.userId !== activeConnection.receiverId) {
            return;
          }
          setOtherUserPresent(true);
        });

        socket.on(SocketEvents.PRESENCE_LEFT, () => {
          setOtherUserPresent(false);
        });
      }
    }

    return () => {
      if (id) {
        leaveConnection(id);
      }
      clearActiveConnection();
    };
  }, [id]);

  useEffect(() => {
    if (activeTab === 'chat' && id && activeConnection?.chatUnlocked) {
      loadMessages(id);
    }
  }, [activeTab, id, activeConnection?.chatUnlocked]);

  const handleSendMessage = async () => {
    if (!id || !messageText.trim()) return;
    const success = await sendMessage(id, messageText.trim());
    if (success) {
      setMessageText('');
    }
  };

  const handleGoToNucleus = () => {
    router.push(`/nucleus/${id}`);
  };

  if (isLoading || !activeConnection) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  const { otherUser, progress, chatUnlocked, chatLevel } = activeConnection;
  const photo = otherUser.photos[0] || `https://ui-avatars.com/api/?background=252540&color=fff&name=${encodeURIComponent(otherUser.name || 'U')}`;

  const getChatLevelText = () => {
    switch (chatLevel) {
      case 'none':
        return 'Chat bloqueado - completa el núcleo para desbloquear';
      case 'guided':
        return 'Chat guiado - responde con mensajes sugeridos';
      case 'voice':
        return 'Notas de voz desbloqueadas';
      case 'full':
        return 'Chat completo desbloqueado';
      default:
        return '';
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Image source={{ uri: photo }} style={styles.avatar} />
          <View style={styles.headerInfo}>
            <View style={styles.nameRow}>
              <Text style={styles.name}>{otherUser.name}</Text>
              {otherUserPresent && (
                <View style={styles.onlineIndicator}>
                  <View style={styles.onlineDot} />
                  <Text style={styles.onlineText}>En linea</Text>
                </View>
              )}
            </View>
            <View style={styles.progressRow}>
              <ProgressRing progress={progress} size={40} strokeWidth={3} showPercentage={false} />
              <Text style={styles.progressText}>{progress}% completado</Text>
            </View>
          </View>
        </View>

        {/* Tabs */}
        <View style={styles.tabs}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'nucleus' && styles.tabActive]}
            onPress={() => setActiveTab('nucleus')}
          >
            <Ionicons
              name="planet"
              size={20}
              color={activeTab === 'nucleus' ? colors.primary : colors.textMuted}
            />
            <Text style={[styles.tabText, activeTab === 'nucleus' && styles.tabTextActive]}>
              Núcleo
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'chat' && styles.tabActive]}
            onPress={() => setActiveTab('chat')}
          >
            <Ionicons
              name="chatbubble"
              size={20}
              color={activeTab === 'chat' ? colors.primary : colors.textMuted}
            />
            <Text style={[styles.tabText, activeTab === 'chat' && styles.tabTextActive]}>
              Chat
            </Text>
            {!chatUnlocked && (
              <Ionicons name="lock-closed" size={14} color={colors.textMuted} />
            )}
          </TouchableOpacity>
        </View>

        {/* Content */}
        {activeTab === 'nucleus' ? (
          <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
            <View style={styles.nucleusPrompt}>
              <View style={styles.nucleusIconContainer}>
                <Ionicons name="planet" size={64} color={colors.primary} />
              </View>
              <Text style={styles.nucleusTitle}>Núcleo de Conexión</Text>
              <Text style={styles.nucleusDescription}>
                Completa actividades juntos para conocerse mejor y desbloquear el chat.
              </Text>

              <View style={styles.progressOverview}>
                <ProgressRing progress={progress} size={120} strokeWidth={10} />
                <Text style={styles.progressLabel}>
                  {progress < 70
                    ? `${70 - progress}% más para chat limitado`
                    : progress < 100
                    ? `${100 - progress}% más para chat ilimitado`
                    : '¡Chat completamente desbloqueado!'}
                </Text>
              </View>

              <Button
                title="Ir al Núcleo"
                onPress={handleGoToNucleus}
                fullWidth
                size="lg"
              />
            </View>
          </ScrollView>
        ) : (
          <>
            {chatUnlocked ? (
              <>
                <ScrollView style={styles.messagesContainer}>
                  {messages.length === 0 ? (
                    <View style={styles.noMessages}>
                      <Text style={styles.noMessagesText}>
                        El chat esta desbloqueado! Envia el primer mensaje.
                      </Text>
                    </View>
                  ) : (
                    messages.map((message) => (
                      <View
                        key={message.id}
                        style={[
                          styles.messageBubble,
                          message.sender.id === otherUser.id
                            ? styles.messageReceived
                            : styles.messageSent,
                        ]}
                      >
                        <Text style={styles.messageText}>{message.content}</Text>
                        <Text style={styles.messageTime}>
                          {new Date(message.createdAt).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </Text>
                      </View>
                    ))
                  )}
                </ScrollView>

                {/* Chat level indicator */}
                <Text style={styles.chatLevelText}>{getChatLevelText()}</Text>

                {/* Input */}
                <View style={styles.inputContainer}>
                  <TextInput
                    style={styles.messageInput}
                    placeholder="Escribe un mensaje..."
                    placeholderTextColor={colors.textMuted}
                    value={messageText}
                    onChangeText={setMessageText}
                    multiline
                  />
                  <TouchableOpacity
                    style={[styles.sendButton, !messageText.trim() && styles.sendButtonDisabled]}
                    onPress={handleSendMessage}
                    disabled={!messageText.trim()}
                  >
                    <Ionicons
                      name="send"
                      size={20}
                      color={messageText.trim() ? colors.text : colors.textMuted}
                    />
                  </TouchableOpacity>
                </View>
              </>
            ) : (
              <View style={styles.chatLocked}>
                <View style={styles.lockIconContainer}>
                  <Ionicons name="lock-closed" size={48} color={colors.textMuted} />
                </View>
                <Text style={styles.chatLockedTitle}>Chat bloqueado</Text>
                <Text style={styles.chatLockedText}>
                  Completa el núcleo juntos para desbloquear el chat.
                  {'\n\n'}
                  Progreso actual: {progress}%
                  {'\n'}
                  Necesitas: 70% para chat limitado
                </Text>
                <ProgressRing progress={progress} size={100} strokeWidth={8} />
                <Button
                  title="Ir al Núcleo"
                  onPress={handleGoToNucleus}
                  variant="outline"
                  style={{ marginTop: spacing.lg }}
                />
              </View>
            )}
          </>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  keyboardView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    paddingTop: 0,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.backgroundCard,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  headerInfo: {
    flex: 1,
    marginLeft: spacing.md,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  name: {
    color: colors.text,
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
  },
  onlineIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  onlineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.success,
  },
  onlineText: {
    color: colors.success,
    fontSize: fontSize.xs,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  progressText: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
  },
  tabs: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.md,
  },
  tabActive: {
    borderBottomWidth: 2,
    borderBottomColor: colors.primary,
  },
  tabText: {
    color: colors.textMuted,
    fontSize: fontSize.md,
  },
  tabTextActive: {
    color: colors.primary,
    fontWeight: fontWeight.semibold,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
  },
  nucleusPrompt: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  nucleusIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.backgroundCard,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  nucleusTitle: {
    color: colors.text,
    fontSize: fontSize.xxl,
    fontWeight: fontWeight.bold,
    marginBottom: spacing.sm,
  },
  nucleusDescription: {
    color: colors.textSecondary,
    fontSize: fontSize.md,
    textAlign: 'center',
    marginBottom: spacing.xl,
    lineHeight: 22,
  },
  progressOverview: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  progressLabel: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
    marginTop: spacing.md,
  },
  messagesContainer: {
    flex: 1,
    padding: spacing.md,
  },
  noMessages: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.xxl,
  },
  noMessagesText: {
    color: colors.textSecondary,
    fontSize: fontSize.md,
    textAlign: 'center',
  },
  messageBubble: {
    maxWidth: '80%',
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.sm,
  },
  messageReceived: {
    alignSelf: 'flex-start',
    backgroundColor: colors.backgroundCard,
    borderBottomLeftRadius: 4,
  },
  messageSent: {
    alignSelf: 'flex-end',
    backgroundColor: colors.primary,
    borderBottomRightRadius: 4,
  },
  messageText: {
    color: colors.text,
    fontSize: fontSize.md,
  },
  messageTime: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: fontSize.xs,
    marginTop: spacing.xs,
    alignSelf: 'flex-end',
  },
  chatLevelText: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
    textAlign: 'center',
    paddingVertical: spacing.xs,
    backgroundColor: colors.backgroundLight,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: spacing.sm,
  },
  messageInput: {
    flex: 1,
    backgroundColor: colors.backgroundCard,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    color: colors.text,
    fontSize: fontSize.md,
    maxHeight: 100,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: colors.backgroundCard,
  },
  chatLocked: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  lockIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.backgroundCard,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  chatLockedTitle: {
    color: colors.text,
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    marginBottom: spacing.md,
  },
  chatLockedText: {
    color: colors.textSecondary,
    fontSize: fontSize.md,
    textAlign: 'center',
    marginBottom: spacing.lg,
    lineHeight: 24,
  },
});
