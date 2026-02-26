import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  TextInput,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { GlobalHeader, InterestsPicker } from "../../src/components";
import { useAuthStore } from "../../src/store/auth.store";
import { userApi } from "../../src/services/api";
import { ALL_INTERESTS } from "../../src/utils/interests";
import {
  colors,
  fontSize,
  fontWeight,
  spacing,
  borderRadius,
  shadows,
} from "../../src/utils/theme";

export default function ProfileScreen() {
  const { user, updateUser } = useAuthStore();
  const [uploadingMain, setUploadingMain] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [editingBio, setEditingBio] = useState(false);
  const [bioText, setBioText] = useState("");
  const [savingBio, setSavingBio] = useState(false);
  const [editingInterests, setEditingInterests] = useState(false);
  const [interestsDraft, setInterestsDraft] = useState<string[]>([]);
  const [savingInterests, setSavingInterests] = useState(false);

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

  const startEditingBio = () => {
    setBioText(user.bio || "");
    setEditingBio(true);
  };

  const saveInterests = async () => {
    setSavingInterests(true);
    try {
      const response = await userApi.updateProfile({
        interests: interestsDraft,
      });
      updateUser({ interests: response.data.interests });
      setEditingInterests(false);
    } catch (error: any) {
      Alert.alert(
        "Error",
        error.response?.data?.error || "No se pudo guardar los intereses",
      );
    } finally {
      setSavingInterests(false);
    }
  };

  const saveBio = async () => {
    setSavingBio(true);
    try {
      const response = await userApi.updateProfile({ bio: bioText });
      updateUser({ bio: response.data.bio });
      setEditingBio(false);
    } catch (error: any) {
      Alert.alert(
        "Error",
        error.response?.data?.error || "No se pudo guardar la bio",
      );
    } finally {
      setSavingBio(false);
    }
  };

  const pickAndUpload = async (position?: number) => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Permiso requerido",
        "Necesitamos acceso a tus fotos para continuar.",
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (result.canceled || !result.assets[0]) return;

    const uri = result.assets[0].uri;
    const isMain = position === 0;
    if (isMain) setUploadingMain(true);
    else setUploadingPhoto(true);

    try {
      const newPhotos = [...user.photos];
      if (position !== undefined && position >= 0) {
        newPhotos[position] = uri;
      } else {
        if (newPhotos.length >= 5) {
          Alert.alert("Límite", "Máximo 5 fotos permitidas");
          return;
        }
        newPhotos.push(uri);
      }
      const response = await userApi.updateProfile({ photos: newPhotos });
      updateUser({ photos: response.data.photos });
    } catch (error: any) {
      Alert.alert(
        "Error",
        error.response?.data?.error || "No se pudo guardar la foto",
      );
    } finally {
      if (isMain) setUploadingMain(false);
      else setUploadingPhoto(false);
    }
  };

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
              <TouchableOpacity
                style={styles.editAvatarButton}
                onPress={() => pickAndUpload(0)}
                disabled={uploadingMain}
              >
                {uploadingMain ? (
                  <ActivityIndicator size="small" color={colors.text} />
                ) : (
                  <Ionicons name="camera" size={16} color={colors.text} />
                )}
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
          </LinearGradient>
        </View>

        {/* Bio section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Sobre mi</Text>
            {editingBio ? (
              <View style={styles.bioActions}>
                <TouchableOpacity
                  onPress={() => setEditingBio(false)}
                  style={styles.bioCancelButton}
                  disabled={savingBio}
                >
                  <Text style={styles.bioCancelText}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={saveBio}
                  style={styles.bioSaveButton}
                  disabled={savingBio}
                >
                  {savingBio ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={styles.bioSaveText}>Guardar</Text>
                  )}
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity onPress={startEditingBio}>
                <Ionicons name="pencil" size={18} color={colors.primary} />
              </TouchableOpacity>
            )}
          </View>
          {editingBio ? (
            <View>
              <TextInput
                style={styles.bioInput}
                value={bioText}
                onChangeText={setBioText}
                multiline
                maxLength={2000}
                placeholder="Cuentale al mundo sobre ti..."
                placeholderTextColor={colors.textMuted}
                autoFocus
              />
              <Text style={styles.bioCharCount}>{bioText.length}/2000</Text>
            </View>
          ) : (
            <Text style={styles.bio}>
              {user.bio ||
                "Aun no has escrito tu bio. Cuentale al mundo sobre ti!"}
            </Text>
          )}
        </View>

        {/* Photos section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Mis fotos</Text>
            <TouchableOpacity
              onPress={() => pickAndUpload()}
              disabled={uploadingPhoto || user.photos.length >= 5}
            >
              {uploadingPhoto ? (
                <ActivityIndicator size="small" color={colors.primary} />
              ) : (
                <Ionicons name="add-circle" size={22} color={colors.primary} />
              )}
            </TouchableOpacity>
          </View>
          <View style={styles.photosGrid}>
            {user.photos.map((photo, index) => (
              <TouchableOpacity
                key={index}
                style={styles.photo}
                onPress={() => pickAndUpload(index)}
              >
                <Image source={{ uri: photo }} style={styles.photoImage} />
                <View style={styles.photoEditOverlay}>
                  <Ionicons name="pencil" size={14} color="#fff" />
                </View>
              </TouchableOpacity>
            ))}
            {user.photos.length < 5 && (
              <TouchableOpacity
                style={styles.addPhotoButton}
                onPress={() => pickAndUpload()}
                disabled={uploadingPhoto}
              >
                {uploadingPhoto ? (
                  <ActivityIndicator size="small" color={colors.textMuted} />
                ) : (
                  <Ionicons name="add" size={32} color={colors.textMuted} />
                )}
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Interests section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Intereses</Text>
            {editingInterests ? (
              <View style={styles.bioActions}>
                <TouchableOpacity
                  onPress={() => setEditingInterests(false)}
                  style={styles.bioCancelButton}
                  disabled={savingInterests}
                >
                  <Text style={styles.bioCancelText}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={saveInterests}
                  style={styles.bioSaveButton}
                  disabled={savingInterests}
                >
                  {savingInterests ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={styles.bioSaveText}>Guardar</Text>
                  )}
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                onPress={() => {
                  setInterestsDraft(user.interests ?? []);
                  setEditingInterests(true);
                }}
              >
                <Ionicons name="pencil" size={18} color={colors.primary} />
              </TouchableOpacity>
            )}
          </View>
          {editingInterests ? (
            <InterestsPicker
              selected={interestsDraft}
              onChange={setInterestsDraft}
            />
          ) : user.interests && user.interests.length > 0 ? (
            <View style={styles.interestsDisplay}>
              {user.interests.map((val) => {
                const known = ALL_INTERESTS.find((i) => i.value === val);
                const label =
                  known?.label ?? val.replace("custom_", "").replace(/_/g, " ");
                const icon = known?.icon ?? "star";
                return (
                  <View key={val} style={styles.interestChip}>
                    <Ionicons
                      name={icon as any}
                      size={14}
                      color={colors.primary}
                    />
                    <Text style={styles.interestChipText}>{label}</Text>
                  </View>
                );
              })}
            </View>
          ) : (
            <Text style={styles.bio}>Aun no has agregado intereses.</Text>
          )}
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
  bioInput: {
    color: colors.text,
    fontSize: fontSize.md,
    lineHeight: 24,
    backgroundColor: colors.backgroundCard,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.primary,
    padding: spacing.md,
    minHeight: 100,
    textAlignVertical: "top",
  },
  bioCharCount: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
    textAlign: "right",
    marginTop: spacing.xs,
  },
  bioActions: {
    flexDirection: "row",
    gap: spacing.sm,
    alignItems: "center",
  },
  bioCancelButton: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  bioCancelText: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
  },
  bioSaveButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
    minWidth: 70,
    alignItems: "center",
  },
  bioSaveText: {
    color: colors.text,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
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
    overflow: "hidden",
  },
  photoImage: {
    width: "100%",
    height: "100%",
  },
  photoEditOverlay: {
    position: "absolute",
    bottom: 4,
    right: 4,
    backgroundColor: "rgba(0,0,0,0.5)",
    borderRadius: 10,
    padding: 3,
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
  interestsDisplay: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  interestChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    backgroundColor: colors.primary + "20",
    borderWidth: 1,
    borderColor: colors.primary + "50",
  },
  interestChipText: {
    color: colors.primary,
    fontSize: fontSize.sm,
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
