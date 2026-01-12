import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ProgressRing } from './ProgressRing';
import { colors, borderRadius, fontSize, fontWeight, spacing, shadows } from '../utils/theme';

interface ConnectionCardProps {
  connection: {
    id: string;
    progress: number;
    status: string;
    temperature: string;
    chatUnlocked: boolean;
    otherUser: {
      id: string;
      name: string;
      photos: string[];
    };
    currentMission?: {
      title: string;
    };
  };
  onPress: () => void;
  isPending?: boolean;
  onAccept?: () => void;
  onDecline?: () => void;
}

export const ConnectionCard: React.FC<ConnectionCardProps> = ({
  connection,
  onPress,
  isPending = false,
  onAccept,
  onDecline,
}) => {
  const { otherUser, progress, temperature, chatUnlocked, currentMission } = connection;
  const photo = otherUser.photos[0] || `https://ui-avatars.com/api/?background=252540&color=fff&name=${encodeURIComponent(otherUser.name || 'U')}`;

  const getTemperatureIcon = () => {
    switch (temperature) {
      case 'HOT':
        return 'flame';
      case 'WARM':
        return 'sunny';
      case 'COOL':
        return 'partly-sunny';
      case 'COLD':
        return 'snow';
      default:
        return 'thermometer';
    }
  };

  const getTemperatureColor = () => {
    switch (temperature) {
      case 'HOT':
        return colors.hot;
      case 'WARM':
        return colors.warm;
      case 'COOL':
        return colors.cool;
      case 'COLD':
        return colors.cold;
      default:
        return colors.textMuted;
    }
  };

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.content}>
        {/* Avatar with progress ring */}
        <View style={styles.avatarContainer}>
          <ProgressRing progress={progress} size={70} strokeWidth={4} showPercentage={false} />
          <Image source={{ uri: photo }} style={styles.avatar} />
        </View>

        {/* Info */}
        <View style={styles.info}>
          <View style={styles.nameRow}>
            <Text style={styles.name}>{otherUser.name}</Text>
            <Ionicons
              name={getTemperatureIcon()}
              size={18}
              color={getTemperatureColor()}
            />
          </View>

          {isPending ? (
            <Text style={styles.pendingText}>Quiere conectar contigo</Text>
          ) : currentMission ? (
            <Text style={styles.missionText} numberOfLines={1}>
              Misión: {currentMission.title}
            </Text>
          ) : chatUnlocked ? (
            <View style={styles.chatUnlocked}>
              <Ionicons name="chatbubble" size={14} color={colors.success} />
              <Text style={styles.chatUnlockedText}>Chat desbloqueado</Text>
            </View>
          ) : (
            <Text style={styles.progressText}>{progress}% completado</Text>
          )}
        </View>

        {/* Actions or Arrow */}
        {isPending ? (
          <View style={styles.pendingActions}>
            <TouchableOpacity style={styles.declineBtn} onPress={onDecline}>
              <Ionicons name="close" size={20} color={colors.error} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.acceptBtn} onPress={onAccept}>
              <Ionicons name="checkmark" size={20} color={colors.success} />
            </TouchableOpacity>
          </View>
        ) : (
          <Ionicons name="chevron-forward" size={24} color={colors.textMuted} />
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.backgroundCard,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.md,
    ...shadows.sm,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
  },
  avatarContainer: {
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatar: {
    position: 'absolute',
    width: 54,
    height: 54,
    borderRadius: 27,
  },
  info: {
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
  missionText: {
    color: colors.primary,
    fontSize: fontSize.sm,
    marginTop: spacing.xs,
  },
  progressText: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
    marginTop: spacing.xs,
  },
  pendingText: {
    color: colors.secondary,
    fontSize: fontSize.sm,
    marginTop: spacing.xs,
  },
  chatUnlocked: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  chatUnlockedText: {
    color: colors.success,
    fontSize: fontSize.sm,
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
  acceptBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.backgroundLight,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.success,
  },
});
