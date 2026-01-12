import React from 'react';
import { View, Text, Image, StyleSheet, Dimensions, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors, borderRadius, fontSize, fontWeight, spacing, shadows } from '../utils/theme';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width - spacing.lg * 2;

interface ProfileCardProps {
  profile: {
    id: string;
    name: string;
    age: number;
    bio?: string;
    photos: string[];
    location?: string;
  };
  onInitiateConnection: () => void;
  onSkip: () => void;
}

export const ProfileCard: React.FC<ProfileCardProps> = ({
  profile,
  onInitiateConnection,
  onSkip,
}) => {
  const { name, age, bio, photos, location } = profile;
  const mainPhoto = photos[0] || `https://ui-avatars.com/api/?background=252540&color=fff&size=400&name=${encodeURIComponent(name || 'U')}`;

  return (
    <View style={styles.card}>
      <Image source={{ uri: mainPhoto }} style={styles.image} />
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.8)']}
        style={styles.gradient}
      >
        <View style={styles.info}>
          <View style={styles.nameRow}>
            <Text style={styles.name}>{name}, {age}</Text>
          </View>
          {location && (
            <View style={styles.locationRow}>
              <Ionicons name="location-outline" size={16} color={colors.textSecondary} />
              <Text style={styles.location}>{location}</Text>
            </View>
          )}
          {bio && <Text style={styles.bio} numberOfLines={2}>{bio}</Text>}
        </View>
      </LinearGradient>

      {/* Action Buttons */}
      <View style={styles.actions}>
        <TouchableOpacity style={styles.skipButton} onPress={onSkip}>
          <Ionicons name="close" size={32} color={colors.error} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.connectButton} onPress={onInitiateConnection}>
          <LinearGradient
            colors={[colors.primary, colors.primaryDark]}
            style={styles.connectGradient}
          >
            <Ionicons name="heart" size={32} color={colors.text} />
            <Text style={styles.connectText}>Iniciar conexión</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    width: CARD_WIDTH,
    height: CARD_WIDTH * 1.4,
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    backgroundColor: colors.backgroundCard,
    ...shadows.lg,
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  gradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '50%',
    justifyContent: 'flex-end',
    padding: spacing.lg,
    paddingBottom: spacing.xxl + 40,
  },
  info: {
    gap: spacing.xs,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  name: {
    color: colors.text,
    fontSize: fontSize.xxl,
    fontWeight: fontWeight.bold,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  location: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
  },
  bio: {
    color: colors.textSecondary,
    fontSize: fontSize.md,
    marginTop: spacing.xs,
  },
  actions: {
    position: 'absolute',
    bottom: spacing.lg,
    left: spacing.lg,
    right: spacing.lg,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.lg,
  },
  skipButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.backgroundCard,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.error,
    ...shadows.md,
  },
  connectButton: {
    flex: 1,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    ...shadows.md,
  },
  connectGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    gap: spacing.sm,
  },
  connectText: {
    color: colors.text,
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
  },
});
