import React from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { GlobalHeader } from "../../src/components";
import { useAuthStore } from "../../src/store/auth.store";
import {
  colors,
  fontSize,
  fontWeight,
  spacing,
  borderRadius,
  shadows,
} from "../../src/utils/theme";

export default function ProfileScreen() {
  const { user } = useAuthStore();

  if (!user) return null;

  const mainPhoto =
    user.photos[0] ||
    `https://ui-avatars.com/api/?background=252540&color=fff&size=200&name=${encodeURIComponent(user.name || "U")}`;

  const calculateAge = (birthDate: string) => {
    const birth = new Date(birthDate);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  const age = calculateAge(user.birthDate);

  return (
    <SafeAreaView style={styles.container}>
      <GlobalHeader notificationCount={0} />
      <ScrollView contentContainerStyle={styles.content}>
        {/* Sparks Balance Card */}
        <TouchableOpacity
          style={styles.sparksCard}
          onPress={() => router.push("/sparks" as any)}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={["#FFD700", "#FFA500", "#FF8C00"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.sparksGradient}
          >
            <View style={styles.sparksLeft}>
              <View style={styles.sparksIconContainer}>
                <Ionicons name="flash" size={24} color="#1a1a2e" />
              </View>
              <View>
                <Text style={styles.sparksLabel}>Mis Chispas</Text>
                <Text style={styles.sparksValue}>{user.sparks ?? 0}</Text>
              </View>
            </View>
            <View style={styles.sparksBuyButton}>
              <Text style={styles.sparksBuyText}>Comprar</Text>
              <Ionicons name="chevron-forward" size={16} color="#1a1a2e" />
            </View>
          </LinearGradient>
        </TouchableOpacity>

        {/* Header with photo */}
        <View style={styles.header}>
          <LinearGradient
            colors={[colors.primary, colors.primaryDark]}
            style={styles.headerGradient}
          >
            <View style={styles.avatarContainer}>
              <Image source={{ uri: mainPhoto }} style={styles.avatar} />
              <TouchableOpacity style={styles.editAvatarButton}>
                <Ionicons name="camera" size={16} color={colors.text} />
              </TouchableOpacity>
            </View>
            <Text style={styles.name}>
              {user.name}, {age}
            </Text>
            {user.location && (
              <View style={styles.locationRow}>
                <Ionicons
                  name="location"
                  size={14}
                  color="rgba(255,255,255,0.8)"
                />
                <Text style={styles.location}>{user.location}</Text>
              </View>
            )}
            <TouchableOpacity
              style={styles.editProfileButton}
              onPress={() => router.push("/settings/preferences" as any)}
            >
              <Ionicons name="pencil" size={14} color={colors.text} />
              <Text style={styles.editProfileText}>Editar perfil</Text>
            </TouchableOpacity>
          </LinearGradient>
        </View>

        {/* Bio section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Sobre mi</Text>
            <TouchableOpacity
              onPress={() => router.push("/settings/preferences" as any)}
            >
              <Ionicons name="pencil" size={18} color={colors.primary} />
            </TouchableOpacity>
          </View>
          <Text style={styles.bio}>
            {user.bio ||
              "Aun no has escrito tu bio. Cuentale al mundo sobre ti!"}
          </Text>
        </View>

        {/* Photos section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Mis fotos</Text>
            <TouchableOpacity
              onPress={() => router.push("/settings/preferences" as any)}
            >
              <Ionicons name="add-circle" size={22} color={colors.primary} />
            </TouchableOpacity>
          </View>
          <View style={styles.photosGrid}>
            {user.photos.map((photo, index) => (
              <Image key={index} source={{ uri: photo }} style={styles.photo} />
            ))}
            {user.photos.length < 6 && (
              <TouchableOpacity
                style={styles.addPhotoButton}
                onPress={() => router.push("/settings/preferences" as any)}
              >
                <Ionicons name="add" size={32} color={colors.textMuted} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Legal & Support section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Legal y soporte</Text>

          <TouchableOpacity
            style={styles.settingItem}
            onPress={() => router.push("/settings/privacy" as any)}
          >
            <View style={styles.settingIcon}>
              <Ionicons
                name="shield-checkmark"
                size={20}
                color={colors.accent}
              />
            </View>
            <Text style={styles.settingText}>Privacidad</Text>
            <Ionicons
              name="chevron-forward"
              size={20}
              color={colors.textMuted}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.settingItem}
            onPress={() => router.push("/settings/help" as any)}
          >
            <View style={styles.settingIcon}>
              <Ionicons name="help-circle" size={20} color={colors.warning} />
            </View>
            <Text style={styles.settingText}>Ayuda y soporte</Text>
            <Ionicons
              name="chevron-forward"
              size={20}
              color={colors.textMuted}
            />
          </TouchableOpacity>
        </View>

        {/* Version */}
        <Text style={styles.version}>Linka v1.0.0</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingBottom: spacing.xxl,
  },
  sparksCard: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    marginBottom: spacing.md,
    borderRadius: borderRadius.lg,
    overflow: "hidden",
    ...shadows.md,
  },
  sparksGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  sparksLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  sparksIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(26, 26, 46, 0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  sparksLabel: {
    color: "rgba(26, 26, 46, 0.7)",
    fontSize: fontSize.xs,
  },
  sparksValue: {
    color: "#1a1a2e",
    fontSize: fontSize.xxl,
    fontWeight: fontWeight.bold,
  },
  sparksBuyButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(26, 26, 46, 0.2)",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    gap: spacing.xs,
  },
  sparksBuyText: {
    color: "#1a1a2e",
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
  },
  header: {
    marginBottom: spacing.lg,
  },
  headerGradient: {
    alignItems: "center",
    paddingVertical: spacing.xl,
    paddingTop: spacing.md,
  },
  avatarContainer: {
    position: "relative",
    marginBottom: spacing.md,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 4,
    borderColor: colors.text,
  },
  editAvatarButton: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.secondary,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: colors.text,
  },
  name: {
    color: colors.text,
    fontSize: fontSize.xxl,
    fontWeight: fontWeight.bold,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  location: {
    color: "rgba(255,255,255,0.8)",
    fontSize: fontSize.sm,
  },
  editProfileButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    marginTop: spacing.md,
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
  },
  editProfileText: {
    color: colors.text,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
  },
  section: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.md,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
  },
  bio: {
    color: colors.textSecondary,
    fontSize: fontSize.md,
    lineHeight: 24,
  },
  photosGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  photo: {
    width: "31%",
    aspectRatio: 1,
    borderRadius: borderRadius.md,
  },
  addPhotoButton: {
    width: "31%",
    aspectRatio: 1,
    borderRadius: borderRadius.md,
    backgroundColor: colors.backgroundCard,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: colors.border,
    borderStyle: "dashed",
  },
  settingItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.backgroundCard,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    ...shadows.sm,
  },
  settingIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.backgroundLight,
    justifyContent: "center",
    alignItems: "center",
    marginRight: spacing.md,
  },
  settingText: {
    flex: 1,
    color: colors.text,
    fontSize: fontSize.md,
  },
  logoutSection: {
    paddingHorizontal: spacing.lg,
    marginTop: spacing.lg,
  },
  version: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
    textAlign: "center",
    marginTop: spacing.lg,
  },
});
