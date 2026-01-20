import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { colors, fontSize, fontWeight, spacing, borderRadius } from '../../src/utils/theme';

interface FAQItem {
  question: string;
  answer: string;
}

const FAQ_ITEMS: FAQItem[] = [
  {
    question: 'Como funcionan las chispas?',
    answer: 'Las chispas son la moneda virtual de Linka. Las usas para abrir nucleos con otras personas, enviar regalos y destacar tu perfil. Los nuevos usuarios reciben 20 chispas gratis!',
  },
  {
    question: 'Que es el nucleo?',
    answer: 'El nucleo es donde construyes una conexion real con otra persona. Completan actividades juntos, responden preguntas y se conocen antes de poder chatear libremente.',
  },
  {
    question: 'Cuantas chispas necesito para conectar?',
    answer: 'Abrir un nucleo con alguien cuesta 10 chispas. Una vez abierto, pueden completar el nucleo sin costo adicional.',
  },
  {
    question: 'Como desbloqueo el chat?',
    answer: 'El chat se desbloquea cuando completas el 70% del nucleo con esa persona. Al 100% tendras chat ilimitado.',
  },
  {
    question: 'Puedo recuperar mis chispas?',
    answer: 'Las chispas gastadas en acciones no son reembolsables, excepto en casos de errores tecnicos. Contacta soporte si tuviste algun problema.',
  },
  {
    question: 'Como elimino mi cuenta?',
    answer: 'Ve a Preferencias > Cuenta > Eliminar cuenta. Esta accion es irreversible y borrara todos tus datos.',
  },
];

export default function HelpScreen() {
  const [expandedFAQ, setExpandedFAQ] = useState<number | null>(null);

  const toggleFAQ = (index: number) => {
    setExpandedFAQ(expandedFAQ === index ? null : index);
  };

  const handleContact = (method: string) => {
    switch (method) {
      case 'email':
        Linking.openURL('mailto:soporte@linka.app');
        break;
      case 'instagram':
        Linking.openURL('https://instagram.com/linkaapp');
        break;
      case 'twitter':
        Linking.openURL('https://twitter.com/linkaapp');
        break;
    }
  };

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
        <Text style={styles.headerTitle}>Ayuda</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Contacto rapido */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Contactanos</Text>

          <View style={styles.contactGrid}>
            <TouchableOpacity
              style={styles.contactItem}
              onPress={() => handleContact('email')}
            >
              <View style={[styles.contactIcon, { backgroundColor: 'rgba(139, 92, 246, 0.1)' }]}>
                <Ionicons name="mail" size={24} color={colors.primary} />
              </View>
              <Text style={styles.contactLabel}>Email</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.contactItem}
              onPress={() => handleContact('instagram')}
            >
              <View style={[styles.contactIcon, { backgroundColor: 'rgba(236, 72, 153, 0.1)' }]}>
                <Ionicons name="logo-instagram" size={24} color={colors.secondary} />
              </View>
              <Text style={styles.contactLabel}>Instagram</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.contactItem}
              onPress={() => handleContact('twitter')}
            >
              <View style={[styles.contactIcon, { backgroundColor: 'rgba(34, 211, 238, 0.1)' }]}>
                <Ionicons name="logo-twitter" size={24} color={colors.accent} />
              </View>
              <Text style={styles.contactLabel}>Twitter</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* FAQ */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Preguntas frecuentes</Text>

          {FAQ_ITEMS.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={styles.faqItem}
              onPress={() => toggleFAQ(index)}
              activeOpacity={0.7}
            >
              <View style={styles.faqHeader}>
                <Text style={styles.faqQuestion}>{item.question}</Text>
                <Ionicons
                  name={expandedFAQ === index ? 'chevron-up' : 'chevron-down'}
                  size={20}
                  color={colors.textMuted}
                />
              </View>
              {expandedFAQ === index && (
                <Text style={styles.faqAnswer}>{item.answer}</Text>
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* Recursos */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recursos</Text>

          <TouchableOpacity style={styles.resourceItem}>
            <View style={styles.resourceIcon}>
              <Ionicons name="book" size={22} color={colors.warning} />
            </View>
            <View style={styles.resourceContent}>
              <Text style={styles.resourceLabel}>Guia de uso</Text>
              <Text style={styles.resourceDescription}>Aprende a sacar el maximo de Linka</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.resourceItem}>
            <View style={styles.resourceIcon}>
              <Ionicons name="shield" size={22} color={colors.success} />
            </View>
            <View style={styles.resourceContent}>
              <Text style={styles.resourceLabel}>Centro de seguridad</Text>
              <Text style={styles.resourceDescription}>Tips para mantenerte seguro</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.resourceItem}>
            <View style={styles.resourceIcon}>
              <Ionicons name="heart" size={22} color={colors.secondary} />
            </View>
            <View style={styles.resourceContent}>
              <Text style={styles.resourceLabel}>Normas de comunidad</Text>
              <Text style={styles.resourceDescription}>Lo que esperamos de todos</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
          </TouchableOpacity>
        </View>

        {/* Reportar problema */}
        <TouchableOpacity style={styles.reportButton}>
          <Ionicons name="bug" size={22} color={colors.text} />
          <Text style={styles.reportText}>Reportar un problema</Text>
        </TouchableOpacity>

        {/* Version */}
        <View style={styles.versionContainer}>
          <Text style={styles.versionText}>Linka v1.0.0</Text>
          <Text style={styles.versionSubtext}>Hecho con amor en Latinoamerica</Text>
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
  contactGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  contactItem: {
    alignItems: 'center',
  },
  contactIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  contactLabel: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
  },
  faqItem: {
    backgroundColor: colors.backgroundCard,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  faqHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  faqQuestion: {
    flex: 1,
    color: colors.text,
    fontSize: fontSize.md,
    fontWeight: fontWeight.medium,
    marginRight: spacing.sm,
  },
  faqAnswer: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
    lineHeight: 22,
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  resourceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.backgroundCard,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.sm,
  },
  resourceIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.backgroundLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  resourceContent: {
    flex: 1,
    marginLeft: spacing.md,
  },
  resourceLabel: {
    color: colors.text,
    fontSize: fontSize.md,
  },
  resourceDescription: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
    marginTop: spacing.xs,
  },
  reportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: spacing.lg,
    marginTop: spacing.lg,
    padding: spacing.md,
    backgroundColor: colors.backgroundCard,
    borderRadius: borderRadius.md,
    gap: spacing.sm,
  },
  reportText: {
    color: colors.text,
    fontSize: fontSize.md,
    fontWeight: fontWeight.medium,
  },
  versionContainer: {
    alignItems: 'center',
    marginTop: spacing.xl,
    paddingHorizontal: spacing.lg,
  },
  versionText: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
  },
  versionSubtext: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
    marginTop: spacing.xs,
  },
});
