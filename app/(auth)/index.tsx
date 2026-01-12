import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '../../src/components';
import { colors, fontSize, fontWeight, spacing } from '../../src/utils/theme';

const { height } = Dimensions.get('window');

export default function WelcomeScreen() {
  return (
    <LinearGradient
      colors={[colors.background, colors.backgroundLight]}
      style={styles.container}
    >
      {/* Hero Section */}
      <View style={styles.hero}>
        <View style={styles.logoContainer}>
          <LinearGradient
            colors={[colors.primary, colors.secondary]}
            style={styles.logoGradient}
          >
            <Ionicons name="heart" size={48} color={colors.text} />
          </LinearGradient>
        </View>
        <Text style={styles.title}>Linka</Text>
        <Text style={styles.subtitle}>Conexiones que se construyen</Text>
      </View>

      {/* Features */}
      <View style={styles.features}>
        <View style={styles.feature}>
          <View style={styles.featureIcon}>
            <Ionicons name="people" size={24} color={colors.primary} />
          </View>
          <View style={styles.featureText}>
            <Text style={styles.featureTitle}>Progreso compartido</Text>
            <Text style={styles.featureDesc}>
              El vínculo se construye entre dos, no se regala
            </Text>
          </View>
        </View>

        <View style={styles.feature}>
          <View style={styles.featureIcon}>
            <Ionicons name="game-controller" size={24} color={colors.secondary} />
          </View>
          <View style={styles.featureText}>
            <Text style={styles.featureTitle}>Misiones juntos</Text>
            <Text style={styles.featureDesc}>
              Descubre compatibilidad real a través de desafíos
            </Text>
          </View>
        </View>

        <View style={styles.feature}>
          <View style={styles.featureIcon}>
            <Ionicons name="lock-open" size={24} color={colors.accent} />
          </View>
          <View style={styles.featureText}>
            <Text style={styles.featureTitle}>Chat que se desbloquea</Text>
            <Text style={styles.featureDesc}>
              El chat se gana, no se regala
            </Text>
          </View>
        </View>
      </View>

      {/* Actions */}
      <View style={styles.actions}>
        <Button
          title="Crear cuenta"
          onPress={() => router.push('/(auth)/register')}
          fullWidth
          size="lg"
        />
        <Button
          title="Ya tengo cuenta"
          onPress={() => router.push('/(auth)/login')}
          variant="outline"
          fullWidth
          size="lg"
        />
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: spacing.lg,
  },
  hero: {
    alignItems: 'center',
    paddingTop: height * 0.1,
    paddingBottom: spacing.xl,
  },
  logoContainer: {
    marginBottom: spacing.lg,
  },
  logoGradient: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    color: colors.text,
    fontSize: 48,
    fontWeight: fontWeight.bold,
    marginBottom: spacing.xs,
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: fontSize.lg,
  },
  features: {
    flex: 1,
    justifyContent: 'center',
    gap: spacing.lg,
  },
  feature: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.backgroundCard,
    borderRadius: 16,
    padding: spacing.md,
    gap: spacing.md,
  },
  featureIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.backgroundLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  featureText: {
    flex: 1,
  },
  featureTitle: {
    color: colors.text,
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    marginBottom: spacing.xs,
  },
  featureDesc: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
  },
  actions: {
    paddingBottom: spacing.xxl,
    gap: spacing.md,
  },
});
