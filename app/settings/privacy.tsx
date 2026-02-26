import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import {
  colors,
  fontSize,
  fontWeight,
  spacing,
  borderRadius,
} from "../../src/utils/theme";

export default function PrivacyScreen() {
  // Estados de privacidad
  const [privacy, setPrivacy] = useState({
    showOnlineStatus: true,
    showLastActive: true,
    readReceipts: true,
    showDistance: true,
    blockScreenshots: false,
  });

  const togglePrivacy = (key: keyof typeof privacy) => {
    setPrivacy((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const PrivacyItem = ({
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
    <View style={styles.privacyItem}>
      <View style={styles.privacyIcon}>
        <Ionicons name={icon as any} size={22} color={colors.accent} />
      </View>
      <View style={styles.privacyInfo}>
        <Text style={styles.privacyLabel}>{label}</Text>
        <Text style={styles.privacyDescription}>{description}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onToggle}
        trackColor={{ false: colors.border, true: colors.accent }}
        thumbColor={colors.text}
      />
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Privacidad</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Visibilidad */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Visibilidad</Text>

          <PrivacyItem
            icon="ellipse"
            label="Mostrar estado en linea"
            description="Otros pueden ver cuando estas conectado"
            value={privacy.showOnlineStatus}
            onToggle={() => togglePrivacy("showOnlineStatus")}
          />

          <PrivacyItem
            icon="time"
            label="Ultima conexion"
            description="Mostrar cuando fue tu ultima actividad"
            value={privacy.showLastActive}
            onToggle={() => togglePrivacy("showLastActive")}
          />

          <PrivacyItem
            icon="location"
            label="Mostrar distancia"
            description="Otros pueden ver a que distancia estas"
            value={privacy.showDistance}
            onToggle={() => togglePrivacy("showDistance")}
          />
        </View>

        {/* Mensajes */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Mensajes</Text>

          <PrivacyItem
            icon="checkmark-done"
            label="Confirmacion de lectura"
            description="Mostrar cuando has leido los mensajes"
            value={privacy.readReceipts}
            onToggle={() => togglePrivacy("readReceipts")}
          />
        </View>

        {/* Seguridad */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Seguridad</Text>

          <PrivacyItem
            icon="camera-outline"
            label="Bloquear capturas"
            description="Impedir capturas de pantalla en el chat"
            value={privacy.blockScreenshots}
            onToggle={() => togglePrivacy("blockScreenshots")}
          />

          <TouchableOpacity style={styles.menuItem}>
            <View style={styles.menuIcon}>
              <Ionicons name="ban" size={22} color={colors.error} />
            </View>
            <View style={styles.menuItemContent}>
              <Text style={styles.menuItemLabel}>Usuarios bloqueados</Text>
              <Text style={styles.menuItemValue}>0 usuarios</Text>
            </View>
            <Ionicons
              name="chevron-forward"
              size={20}
              color={colors.textMuted}
            />
          </TouchableOpacity>
        </View>

        {/* Datos */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tus datos</Text>

          <TouchableOpacity style={styles.menuItem}>
            <View style={styles.menuIcon}>
              <Ionicons name="download" size={22} color={colors.primary} />
            </View>
            <View style={styles.menuItemContent}>
              <Text style={styles.menuItemLabel}>Descargar mis datos</Text>
              <Text style={styles.menuItemValue}>
                Exportar toda tu informacion
              </Text>
            </View>
            <Ionicons
              name="chevron-forward"
              size={20}
              color={colors.textMuted}
            />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem}>
            <View style={styles.menuIcon}>
              <Ionicons
                name="document-text"
                size={22}
                color={colors.textSecondary}
              />
            </View>
            <View style={styles.menuItemContent}>
              <Text style={styles.menuItemLabel}>Politica de privacidad</Text>
            </View>
            <Ionicons
              name="chevron-forward"
              size={20}
              color={colors.textMuted}
            />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem}>
            <View style={styles.menuIcon}>
              <Ionicons
                name="document"
                size={22}
                color={colors.textSecondary}
              />
            </View>
            <View style={styles.menuItemContent}>
              <Text style={styles.menuItemLabel}>Terminos de servicio</Text>
            </View>
            <Ionicons
              name="chevron-forward"
              size={20}
              color={colors.textMuted}
            />
          </TouchableOpacity>
        </View>

        {/* Info */}
        <View style={styles.infoCard}>
          <Ionicons name="shield-checkmark" size={24} color={colors.accent} />
          <View style={styles.infoContent}>
            <Text style={styles.infoTitle}>Tu privacidad es importante</Text>
            <Text style={styles.infoText}>
              Nuclia nunca compartira tu informacion personal con terceros sin
              tu consentimiento.
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
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
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
    justifyContent: "center",
    alignItems: "center",
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
  privacyItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.backgroundCard,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.sm,
  },
  privacyIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(34, 211, 238, 0.1)",
    justifyContent: "center",
    alignItems: "center",
  },
  privacyInfo: {
    flex: 1,
    marginLeft: spacing.md,
    marginRight: spacing.md,
  },
  privacyLabel: {
    color: colors.text,
    fontSize: fontSize.md,
    marginBottom: spacing.xs,
  },
  privacyDescription: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.backgroundCard,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.sm,
  },
  menuIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.backgroundLight,
    justifyContent: "center",
    alignItems: "center",
  },
  menuItemContent: {
    flex: 1,
    marginLeft: spacing.md,
  },
  menuItemLabel: {
    color: colors.text,
    fontSize: fontSize.md,
  },
  menuItemValue: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
    marginTop: spacing.xs,
  },
  infoCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginHorizontal: spacing.lg,
    marginTop: spacing.lg,
    padding: spacing.lg,
    backgroundColor: "rgba(34, 211, 238, 0.1)",
    borderRadius: borderRadius.lg,
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
