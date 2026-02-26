import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { colors, fontSize, fontWeight, spacing, borderRadius } from '../../src/utils/theme';

export default function NotificationsScreen() {
  // Estados de notificaciones
  const [notifications, setNotifications] = useState({
    newConnections: true,
    messages: true,
    nucleusActivity: true,
    promotions: false,
    reminders: true,
    sounds: true,
    vibration: true,
  });

  const toggleNotification = (key: keyof typeof notifications) => {
    setNotifications(prev => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const NotificationItem = ({
    icon,
    label,
    description,
    value,
    onToggle,
  }: {
    icon: string;
    label: string;
    description: string;
    value: boolean;
    onToggle: () => void;
  }) => (
    <View style={styles.notificationItem}>
      <View style={styles.notificationIcon}>
        <Ionicons name={icon as any} size={22} color={colors.primary} />
      </View>
      <View style={styles.notificationInfo}>
        <Text style={styles.notificationLabel}>{label}</Text>
        <Text style={styles.notificationDescription}>{description}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onToggle}
        trackColor={{ false: colors.border, true: colors.primary }}
        thumbColor={colors.text}
      />
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notificaciones</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Actividad */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Actividad</Text>

          <NotificationItem
            icon="heart"
            label="Nuevas conexiones"
            description="Cuando alguien quiere conectar contigo"
            value={notifications.newConnections}
            onToggle={() => toggleNotification('newConnections')}
          />

          <NotificationItem
            icon="chatbubble"
            label="Mensajes"
            description="Cuando recibes un nuevo mensaje"
            value={notifications.messages}
            onToggle={() => toggleNotification('messages')}
          />

          <NotificationItem
            icon="planet"
            label="Actividad del nucleo"
            description="Actualizaciones en tus conexiones activas"
            value={notifications.nucleusActivity}
            onToggle={() => toggleNotification('nucleusActivity')}
          />

          <NotificationItem
            icon="alarm"
            label="Recordatorios"
            description="Recordatorios para completar el nucleo"
            value={notifications.reminders}
            onToggle={() => toggleNotification('reminders')}
          />
        </View>

        {/* Otros */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Otros</Text>

          <NotificationItem
            icon="megaphone"
            label="Promociones"
            description="Ofertas especiales y novedades"
            value={notifications.promotions}
            onToggle={() => toggleNotification('promotions')}
          />
        </View>

        {/* Sonido y vibracion */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Sonido y vibracion</Text>

          <NotificationItem
            icon="volume-high"
            label="Sonidos"
            description="Reproducir sonidos con las notificaciones"
            value={notifications.sounds}
            onToggle={() => toggleNotification('sounds')}
          />

          <NotificationItem
            icon="phone-portrait"
            label="Vibracion"
            description="Vibrar con las notificaciones"
            value={notifications.vibration}
            onToggle={() => toggleNotification('vibration')}
          />
        </View>

        {/* Info */}
        <View style={styles.infoCard}>
          <Ionicons name="information-circle" size={20} color={colors.textMuted} />
          <Text style={styles.infoText}>
            Puedes cambiar los permisos de notificaciones en la configuracion de tu dispositivo.
          </Text>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
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
  },
  headerTitle: {
    color: colors.text,
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
  },
  headerRight: {
    width: 40,
  },
  content: {
    paddingBottom: spacing.xxl,
  },
  section: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    marginBottom: spacing.md,
  },
  notificationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.backgroundCard,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.sm,
  },
  notificationIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationInfo: {
    flex: 1,
    marginLeft: spacing.md,
    marginRight: spacing.md,
  },
  notificationLabel: {
    color: colors.text,
    fontSize: fontSize.md,
    marginBottom: spacing.xs,
  },
  notificationDescription: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginHorizontal: spacing.lg,
    marginTop: spacing.lg,
    padding: spacing.md,
    backgroundColor: colors.backgroundCard,
    borderRadius: borderRadius.md,
    gap: spacing.sm,
  },
  infoText: {
    flex: 1,
    color: colors.textMuted,
    fontSize: fontSize.sm,
    lineHeight: 20,
  },
});
