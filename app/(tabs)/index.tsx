import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../src/store/auth.store';
import { colors, fontSize, fontWeight, spacing, borderRadius } from '../../src/utils/theme';

interface Portal {
  id: string;
  title: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  activeUsers: number;
}

const PORTALS: Portal[] = [
  {
    id: 'honesty',
    title: 'Conversaciones honestas',
    description: 'Personas que hoy quieren hablar con honestidad y autenticidad',
    icon: 'heart-outline',
    color: '#E91E63',
    activeUsers: 12,
  },
  {
    id: 'slow',
    title: 'Construir algo lento',
    description: 'Personas abiertas a conocerse sin prisas, paso a paso',
    icon: 'time-outline',
    color: '#9C27B0',
    activeUsers: 8,
  },
  {
    id: 'curious',
    title: 'Curiosos sin prisa',
    description: 'Personas curiosas que disfrutan el proceso de conocerse',
    icon: 'sparkles-outline',
    color: '#2196F3',
    activeUsers: 15,
  },
  {
    id: 'deep',
    title: 'Conexiones profundas',
    description: 'Para quienes buscan conversaciones con significado',
    icon: 'water-outline',
    color: '#00BCD4',
    activeUsers: 6,
  },
  {
    id: 'adventure',
    title: 'Espíritus aventureros',
    description: 'Personas que aman explorar y vivir nuevas experiencias',
    icon: 'compass-outline',
    color: '#FF9800',
    activeUsers: 10,
  },
  {
    id: 'creative',
    title: 'Mentes creativas',
    description: 'Artistas, soñadores y personas con ideas únicas',
    icon: 'color-palette-outline',
    color: '#4CAF50',
    activeUsers: 7,
  },
];

export default function PortalsScreen() {
  const { user } = useAuthStore();

  const handlePortalPress = (portal: Portal) => {
    router.push({
      pathname: '/portal/[id]',
      params: { id: portal.id, title: portal.title },
    });
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.greeting}>Hola, {user?.name?.split(' ')[0]}</Text>
          <Text style={styles.title}>¿Qué buscas hoy?</Text>
          <Text style={styles.subtitle}>
            Elige un portal y conecta con personas que comparten tu intención
          </Text>
        </View>

        {/* Portals Grid */}
        <View style={styles.portalsContainer}>
          {PORTALS.map((portal) => (
            <TouchableOpacity
              key={portal.id}
              style={styles.portalCard}
              onPress={() => handlePortalPress(portal)}
              activeOpacity={0.8}
            >
              <View style={[styles.portalIconContainer, { backgroundColor: portal.color + '20' }]}>
                <Ionicons name={portal.icon} size={32} color={portal.color} />
              </View>

              <Text style={styles.portalTitle}>{portal.title}</Text>
              <Text style={styles.portalDescription} numberOfLines={2}>
                {portal.description}
              </Text>

              <View style={styles.portalFooter}>
                <View style={styles.activeUsersContainer}>
                  <View style={[styles.activeDot, { backgroundColor: portal.color }]} />
                  <Text style={styles.activeUsersText}>
                    {portal.activeUsers} activos
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Info Card */}
        <View style={styles.infoCard}>
          <Ionicons name="information-circle-outline" size={24} color={colors.primary} />
          <View style={styles.infoContent}>
            <Text style={styles.infoTitle}>¿Cómo funciona?</Text>
            <Text style={styles.infoText}>
              Al entrar a un portal, verás personas con la misma intención.
              Crea una conexión y completen misiones juntos para desbloquear el chat.
            </Text>
          </View>
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  header: {
    paddingTop: spacing.md,
    marginBottom: spacing.xl,
  },
  greeting: {
    color: colors.textSecondary,
    fontSize: fontSize.md,
    marginBottom: spacing.xs,
  },
  title: {
    color: colors.text,
    fontSize: fontSize.xxxl,
    fontWeight: fontWeight.bold,
    marginBottom: spacing.sm,
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: fontSize.md,
    lineHeight: 22,
  },
  portalsContainer: {
    gap: spacing.md,
  },
  portalCard: {
    backgroundColor: colors.backgroundCard,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  portalIconContainer: {
    width: 56,
    height: 56,
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  portalTitle: {
    color: colors.text,
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    marginBottom: spacing.xs,
  },
  portalDescription: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
    lineHeight: 20,
    marginBottom: spacing.md,
  },
  portalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  activeUsersContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  activeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  activeUsersText: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: colors.primary + '10',
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginTop: spacing.xl,
    gap: spacing.md,
  },
  infoContent: {
    flex: 1,
  },
  infoTitle: {
    color: colors.text,
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    marginBottom: spacing.xs,
  },
  infoText: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
    lineHeight: 20,
  },
});
