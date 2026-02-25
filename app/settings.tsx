import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Button } from "../src/components";
import { useAuthStore } from "../src/store/auth.store";
import {
  colors,
  fontSize,
  fontWeight,
  spacing,
  borderRadius,
  shadows,
} from "../src/utils/theme";

export default function SettingsScreen() {
  const { logout } = useAuthStore();

  const handleLogout = () => {
    Alert.alert("Cerrar sesión", "¿Estás seguro que quieres cerrar sesión?", [
      {
        text: "Cancelar",
        style: "cancel",
      },
      {
        text: "Cerrar sesión",
        style: "destructive",
        onPress: () => logout(),
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Ajustes</Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
      >
        {/* Cuenta */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Cuenta</Text>

          <TouchableOpacity
            style={styles.settingItem}
            onPress={() => router.push("/settings/preferences" as any)}
          >
            <View
              style={[
                styles.settingIcon,
                { backgroundColor: colors.primary + "20" },
              ]}
            >
              <Ionicons name="person" size={20} color={colors.primary} />
            </View>
            <View style={styles.settingContent}>
              <Text style={styles.settingText}>Editar perfil</Text>
              <Text style={styles.settingDescription}>
                Fotos, bio, intereses
              </Text>
            </View>
            <Ionicons
              name="chevron-forward"
              size={20}
              color={colors.textMuted}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.settingItem}
            onPress={() => router.push("/settings/preferences" as any)}
          >
            <View
              style={[
                styles.settingIcon,
                { backgroundColor: colors.secondary + "20" },
              ]}
            >
              <Ionicons name="options" size={20} color={colors.secondary} />
            </View>
            <View style={styles.settingContent}>
              <Text style={styles.settingText}>Preferencias</Text>
              <Text style={styles.settingDescription}>Filtros de búsqueda</Text>
            </View>
            <Ionicons
              name="chevron-forward"
              size={20}
              color={colors.textMuted}
            />
          </TouchableOpacity>
        </View>

        {/* Comunicación */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Comunicación</Text>

          <TouchableOpacity
            style={styles.settingItem}
            onPress={() => router.push("/settings/notifications" as any)}
          >
            <View
              style={[
                styles.settingIcon,
                { backgroundColor: colors.accent + "20" },
              ]}
            >
              <Ionicons name="notifications" size={20} color={colors.accent} />
            </View>
            <View style={styles.settingContent}>
              <Text style={styles.settingText}>Notificaciones</Text>
              <Text style={styles.settingDescription}>
                Push, email, sonidos
              </Text>
            </View>
            <Ionicons
              name="chevron-forward"
              size={20}
              color={colors.textMuted}
            />
          </TouchableOpacity>
        </View>

        {/* Privacidad y seguridad */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Privacidad y seguridad</Text>

          <TouchableOpacity
            style={styles.settingItem}
            onPress={() => router.push("/settings/privacy" as any)}
          >
            <View
              style={[
                styles.settingIcon,
                { backgroundColor: colors.success + "20" },
              ]}
            >
              <Ionicons
                name="shield-checkmark"
                size={20}
                color={colors.success}
              />
            </View>
            <View style={styles.settingContent}>
              <Text style={styles.settingText}>Privacidad</Text>
              <Text style={styles.settingDescription}>
                Visibilidad, bloqueos
              </Text>
            </View>
            <Ionicons
              name="chevron-forward"
              size={20}
              color={colors.textMuted}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.settingItem}
            onPress={() => {
              Alert.alert(
                "Cambiar contraseña",
                "Esta función estará disponible próximamente",
              );
            }}
          >
            <View
              style={[
                styles.settingIcon,
                { backgroundColor: colors.warning + "20" },
              ]}
            >
              <Ionicons name="key" size={20} color={colors.warning} />
            </View>
            <View style={styles.settingContent}>
              <Text style={styles.settingText}>Contraseña</Text>
              <Text style={styles.settingDescription}>Cambiar contraseña</Text>
            </View>
            <Ionicons
              name="chevron-forward"
              size={20}
              color={colors.textMuted}
            />
          </TouchableOpacity>
        </View>

        {/* Soporte */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Soporte</Text>

          <TouchableOpacity
            style={styles.settingItem}
            onPress={() => router.push("/settings/help" as any)}
          >
            <View
              style={[
                styles.settingIcon,
                { backgroundColor: colors.accent + "20" },
              ]}
            >
              <Ionicons name="help-circle" size={20} color={colors.accent} />
            </View>
            <View style={styles.settingContent}>
              <Text style={styles.settingText}>Ayuda y soporte</Text>
              <Text style={styles.settingDescription}>FAQ, contacto</Text>
            </View>
            <Ionicons
              name="chevron-forward"
              size={20}
              color={colors.textMuted}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.settingItem}
            onPress={() => {
              Alert.alert(
                "Linka",
                "Versión 1.0.0\n\n© 2025 Linka. Todos los derechos reservados.",
              );
            }}
          >
            <View
              style={[
                styles.settingIcon,
                { backgroundColor: colors.textMuted + "20" },
              ]}
            >
              <Ionicons
                name="information-circle"
                size={20}
                color={colors.textMuted}
              />
            </View>
            <View style={styles.settingContent}>
              <Text style={styles.settingText}>Acerca de</Text>
              <Text style={styles.settingDescription}>Versión 1.0.0</Text>
            </View>
            <Ionicons
              name="chevron-forward"
              size={20}
              color={colors.textMuted}
            />
          </TouchableOpacity>
        </View>

        {/* Logout button */}
        <View style={styles.logoutSection}>
          <Button
            title="Cerrar sesión"
            onPress={handleLogout}
            variant="outline"
            fullWidth
          />
        </View>

        {/* Danger zone */}
        <View style={styles.dangerSection}>
          <TouchableOpacity
            style={styles.dangerButton}
            onPress={() => {
              Alert.alert(
                "¿Eliminar cuenta?",
                "Esta acción no se puede deshacer. Se eliminarán todos tus datos permanentemente.",
                [
                  { text: "Cancelar", style: "cancel" },
                  {
                    text: "Eliminar",
                    style: "destructive",
                    onPress: () => {
                      Alert.alert(
                        "Función en desarrollo",
                        "Esta función estará disponible próximamente",
                      );
                    },
                  },
                ],
              );
            }}
          >
            <Text style={styles.dangerText}>Eliminar cuenta</Text>
          </TouchableOpacity>
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
    padding: spacing.lg,
    backgroundColor: colors.backgroundCard,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    padding: spacing.xs,
  },
  headerTitle: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.text,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: spacing.xxxl,
  },
  section: {
    marginTop: spacing.lg,
    paddingHorizontal: spacing.lg,
  },
  sectionTitle: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.textSecondary,
    marginBottom: spacing.md,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  settingItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.backgroundCard,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.sm,
    gap: spacing.md,
    ...shadows.sm,
  },
  settingIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  settingContent: {
    flex: 1,
    gap: 2,
  },
  settingText: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.medium,
    color: colors.text,
  },
  settingDescription: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
  },
  logoutSection: {
    marginTop: spacing.xxl,
    paddingHorizontal: spacing.lg,
  },
  dangerSection: {
    marginTop: spacing.xl,
    paddingHorizontal: spacing.lg,
    alignItems: "center",
  },
  dangerButton: {
    paddingVertical: spacing.sm,
  },
  dangerText: {
    fontSize: fontSize.sm,
    color: colors.error,
    fontWeight: fontWeight.medium,
  },
});
