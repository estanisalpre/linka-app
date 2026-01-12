import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors, borderRadius, fontSize, fontWeight, spacing, shadows } from '../utils/theme';

interface MissionOption {
  id: string;
  type: string;
  title: string;
  description: string;
  category: string;
  points: number;
  difficulty: number;
  isMainInterest?: boolean;
  isSharedInterest?: boolean;
}

interface VotingCardProps {
  options: MissionOption[];
  votingEndsAt: string;
  userVoted: boolean;
  userVoteId?: string;
  otherVoted: boolean;
  otherUserPresent: boolean;
  sharedInterests: { interest: string; weight: number; isMain: boolean }[];
  onVote: (missionOptionId: string) => void;
  isSubmitting: boolean;
}

const getCategoryIcon = (category: string): string => {
  switch (category) {
    case 'fotografia': return 'camera';
    case 'musica': return 'musical-notes';
    case 'viajes': return 'airplane';
    case 'deportes': return 'fitness';
    case 'cocina': return 'restaurant';
    case 'cine': return 'film';
    case 'tecnologia': return 'laptop';
    case 'libros': return 'book';
    case 'arte': return 'color-palette';
    case 'naturaleza': return 'leaf';
    case 'general': return 'sparkles';
    case 'random': return 'shuffle';
    default: return 'help-circle';
  }
};

const getCategoryColor = (category: string): string => {
  switch (category) {
    case 'fotografia': return '#E91E63';
    case 'musica': return '#9C27B0';
    case 'viajes': return '#2196F3';
    case 'deportes': return '#4CAF50';
    case 'cocina': return '#FF9800';
    case 'cine': return '#F44336';
    case 'tecnologia': return '#00BCD4';
    case 'libros': return '#795548';
    case 'arte': return '#FF5722';
    case 'naturaleza': return '#8BC34A';
    case 'general': return '#607D8B';
    case 'random': return '#673AB7';
    default: return colors.primary;
  }
};

export const VotingCard: React.FC<VotingCardProps> = ({
  options,
  votingEndsAt,
  userVoted,
  userVoteId,
  otherVoted,
  otherUserPresent,
  sharedInterests,
  onVote,
  isSubmitting,
}) => {
  const [selectedId, setSelectedId] = useState<string | null>(userVoteId || null);
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    const updateTimer = () => {
      const now = new Date();
      const end = new Date(votingEndsAt);
      const diff = end.getTime() - now.getTime();

      if (diff <= 0) {
        setTimeLeft('Votacion terminada');
        return;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

      if (hours > 0) {
        setTimeLeft(`${hours}h ${minutes}m restantes`);
      } else {
        setTimeLeft(`${minutes}m restantes`);
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 60000);
    return () => clearInterval(interval);
  }, [votingEndsAt]);

  const handleVote = () => {
    if (selectedId && !userVoted) {
      onVote(selectedId);
    }
  };

  const mainInterest = sharedInterests.find(i => i.isMain);

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={[colors.primaryDark, colors.primary]}
        style={styles.header}
      >
        <View style={styles.headerTop}>
          <View style={styles.votingBadge}>
            <Ionicons name="hand-left" size={16} color={colors.text} />
            <Text style={styles.votingBadgeText}>Votacion</Text>
          </View>
          <Text style={styles.timerText}>{timeLeft}</Text>
        </View>
        <Text style={styles.title}>Elige la mision</Text>
        <Text style={styles.subtitle}>
          Vota por la mision que quieres hacer juntos
        </Text>

        {/* Shared interests indicator */}
        {mainInterest && (
          <View style={styles.interestIndicator}>
            <Ionicons name="heart" size={14} color={colors.accent} />
            <Text style={styles.interestText}>
              Interes principal: {mainInterest.interest}
            </Text>
          </View>
        )}
      </LinearGradient>

      {/* Presence & Status Row */}
      <View style={styles.statusRow}>
        <View style={styles.statusItem}>
          <Ionicons
            name={userVoted ? 'checkmark-circle' : 'ellipse-outline'}
            size={20}
            color={userVoted ? colors.success : colors.textMuted}
          />
          <Text style={styles.statusText}>Tu</Text>
        </View>
        <View style={styles.statusDivider} />
        <View style={styles.statusItem}>
          <Ionicons
            name={otherVoted ? 'checkmark-circle' : 'ellipse-outline'}
            size={20}
            color={otherVoted ? colors.success : colors.textMuted}
          />
          <Text style={styles.statusText}>Ellos</Text>
          {otherUserPresent && (
            <View style={styles.presenceIndicator}>
              <View style={styles.presenceDot} />
              <Text style={styles.presenceText}>En linea</Text>
            </View>
          )}
        </View>
      </View>

      {/* Mission Options */}
      <View style={styles.optionsContainer}>
        {options.map((option, index) => {
          const isSelected = selectedId === option.id;
          const isUserVote = userVoteId === option.id;
          const categoryColor = getCategoryColor(option.category);

          return (
            <TouchableOpacity
              key={option.id}
              style={[
                styles.optionCard,
                isSelected && styles.optionSelected,
                isUserVote && styles.optionVoted,
              ]}
              onPress={() => !userVoted && setSelectedId(option.id)}
              disabled={userVoted}
              activeOpacity={0.7}
            >
              <View style={styles.optionHeader}>
                <View style={[styles.categoryIcon, { backgroundColor: categoryColor + '20' }]}>
                  <Ionicons
                    name={getCategoryIcon(option.category) as any}
                    size={16}
                    color={categoryColor}
                  />
                </View>
                <View style={styles.optionBadges}>
                  {option.isMainInterest && (
                    <View style={styles.mainBadge}>
                      <Ionicons name="heart" size={10} color={colors.accent} />
                    </View>
                  )}
                  {option.isSharedInterest && !option.isMainInterest && (
                    <View style={styles.sharedBadge}>
                      <Ionicons name="people" size={10} color={colors.primary} />
                    </View>
                  )}
                  <Text style={styles.pointsText}>+{option.points}%</Text>
                </View>
              </View>

              <Text style={styles.optionTitle}>{option.title}</Text>
              <Text style={styles.optionDescription} numberOfLines={2}>
                {option.description}
              </Text>

              <View style={styles.optionFooter}>
                <Text style={[styles.categoryText, { color: categoryColor }]}>
                  {option.category}
                </Text>
                {isSelected && !userVoted && (
                  <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
                )}
                {isUserVote && (
                  <View style={styles.votedBadge}>
                    <Text style={styles.votedText}>Tu voto</Text>
                  </View>
                )}
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Vote Button */}
      {!userVoted && (
        <View style={styles.voteButtonContainer}>
          <TouchableOpacity
            style={[
              styles.voteButton,
              !selectedId && styles.voteButtonDisabled,
            ]}
            onPress={handleVote}
            disabled={!selectedId || isSubmitting}
          >
            {isSubmitting ? (
              <ActivityIndicator size="small" color={colors.text} />
            ) : (
              <>
                <Ionicons name="checkmark" size={20} color={colors.text} />
                <Text style={styles.voteButtonText}>Confirmar voto</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      )}

      {/* Waiting for other user */}
      {userVoted && !otherVoted && (
        <View style={styles.waitingContainer}>
          <Ionicons name="hourglass" size={24} color={colors.primary} />
          <Text style={styles.waitingText}>Esperando su voto...</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.backgroundCard,
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    ...shadows.md,
  },
  header: {
    padding: spacing.lg,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  votingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    gap: spacing.xs,
  },
  votingBadgeText: {
    color: colors.text,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
  },
  timerText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: fontSize.xs,
  },
  title: {
    color: colors.text,
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    marginBottom: spacing.xs,
  },
  subtitle: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: fontSize.sm,
  },
  interestIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.md,
    gap: spacing.xs,
  },
  interestText: {
    color: colors.accent,
    fontSize: fontSize.xs,
    textTransform: 'capitalize',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  statusItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  statusText: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
  },
  statusDivider: {
    width: 40,
    height: 1,
    backgroundColor: colors.border,
    marginHorizontal: spacing.md,
  },
  presenceIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: spacing.sm,
    gap: spacing.xs,
  },
  presenceDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.success,
  },
  presenceText: {
    color: colors.success,
    fontSize: fontSize.xs,
  },
  optionsContainer: {
    padding: spacing.md,
    gap: spacing.sm,
  },
  optionCard: {
    backgroundColor: colors.backgroundLight,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  optionSelected: {
    borderColor: colors.primary,
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
  },
  optionVoted: {
    borderColor: colors.success,
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
  },
  optionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  categoryIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  optionBadges: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  mainBadge: {
    backgroundColor: 'rgba(236, 72, 153, 0.2)',
    padding: 4,
    borderRadius: borderRadius.full,
  },
  sharedBadge: {
    backgroundColor: 'rgba(139, 92, 246, 0.2)',
    padding: 4,
    borderRadius: borderRadius.full,
  },
  pointsText: {
    color: colors.success,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
  },
  optionTitle: {
    color: colors.text,
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    marginBottom: spacing.xs,
  },
  optionDescription: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
    marginBottom: spacing.sm,
  },
  optionFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  categoryText: {
    fontSize: fontSize.xs,
    textTransform: 'capitalize',
  },
  votedBadge: {
    backgroundColor: colors.success,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  votedText: {
    color: colors.text,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
  },
  voteButtonContainer: {
    padding: spacing.md,
    paddingTop: 0,
  },
  voteButton: {
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    gap: spacing.sm,
  },
  voteButtonDisabled: {
    backgroundColor: colors.backgroundLight,
    opacity: 0.5,
  },
  voteButtonText: {
    color: colors.text,
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
  },
  waitingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
    gap: spacing.sm,
  },
  waitingText: {
    color: colors.textSecondary,
    fontSize: fontSize.md,
  },
});
