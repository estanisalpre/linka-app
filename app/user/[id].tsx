import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
import { userApi } from "../../src/services/api";
import { useConnectionStore } from "../../src/store/connection.store";
import { useAuthStore } from "../../src/store/auth.store";
import { ALL_INTERESTS } from "../../src/utils/interests";
import {
  colors,
  fontSize,
  fontWeight,
  spacing,
  borderRadius,
  shadows,
} from "../../src/utils/theme";
import { Modal } from "../../src/components";

const { width } = Dimensions.get("window");

interface PublicProfile {
  id: string;
  name: string;
  bio?: string;
  photos: string[];
  age: number;
  gender: string;
  location?: string;
  interests?: string[];
}

export default function UserProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { initiateConnection, connections } = useConnectionStore();
  const { user: me } = useAuthStore();
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [successModal, setSuccessModal] = useState(false);
  const [activePhoto, setActivePhoto] = useState(0);

  useEffect(() => {
    if (id) loadProfile();
  }, [id]);

  const loadProfile = async () => {
    try {
      const res = await userApi.getProfile(id);
      setProfile(res.data);
    } catch (err: any) {
      Alert.alert("Error", "No se pudo cargar el perfil");
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async () => {
    if (!profile) return;
    setConnecting(true);
    try {
      const connectionId = await initiateConnection(profile.id);
      if (connectionId) {
        setSuccessModal(true);
      } else {
        Alert.alert("Error", "No se pudo crear la conexión");
      }
    } catch (err: any) {
      Alert.alert("Error", err.message ?? "No se pudo crear la conexión");
    } finally {
      setConnecting(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </SafeAreaView>
    );
  }

  if (!profile) return null;

  const mainPhoto =
    profile.photos[0] ||
    `https://ui-avatars.com/api/?background=252540&color=fff&size=400&name=${encodeURIComponent(profile.name)}`;

  const isMe = me?.id === profile.id;
  const alreadyConnected = connections.some(
    (c) => c.otherUser.id === id && c.status !== "ENDED",
  );

  return (
    <View style={styles.root}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero photo */}
        <View style={styles.hero}>
          <Image
            source={{ uri: profile.photos[activePhoto] || mainPhoto }}
            style={styles.heroImage}
          />
          <LinearGradient
            colors={["transparent", "rgba(15,15,26,0.95)"]}
            style={styles.heroGradient}
          />
          {/* back button */}
          <SafeAreaView style={styles.topBar}>
            <TouchableOpacity
              style={styles.backBtn}
              onPress={() => router.back()}
            >
              <Ionicons name="chevron-back" size={24} color={colors.text} />
            </TouchableOpacity>
          </SafeAreaView>

          {/* photo dots */}
          {profile.photos.length > 1 && (
            <View style={styles.photoDots}>
              {profile.photos.map((_, i) => (
                <TouchableOpacity
                  key={i}
                  style={[styles.dot, i === activePhoto && styles.dotActive]}
                  onPress={() => setActivePhoto(i)}
                />
              ))}
            </View>
          )}

          {/* name / age / location overlay */}
          <View style={styles.heroInfo}>
            <Text style={styles.heroName}>
              {profile.name}, {profile.age}
            </Text>
            {profile.location && (
              <View style={styles.locationRow}>
                <Ionicons
                  name="location"
                  size={14}
                  color="rgba(255,255,255,0.8)"
                />
                <Text style={styles.locationText}>{profile.location}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Extra photos row */}
        {profile.photos.length > 1 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.photosRow}
          >
            {profile.photos.map((photo, i) => (
              <TouchableOpacity key={i} onPress={() => setActivePhoto(i)}>
                <Image
                  source={{ uri: photo }}
                  style={[
                    styles.thumbPhoto,
                    i === activePhoto && styles.thumbPhotoActive,
                  ]}
                />
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        {/* Bio */}
        {profile.bio ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              Sobre {profile.name.split(" ")[0]}
            </Text>
            <Text style={styles.bio}>{profile.bio}</Text>
          </View>
        ) : null}

        {/* Interests */}
        {profile.interests && profile.interests.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Intereses</Text>
            <View style={styles.interestsWrap}>
              {profile.interests.map((val) => {
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
                    <Text style={styles.interestLabel}>{label}</Text>
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {/* spacer for FAB */}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* FAB – connect button (hidden if it's my own profile or already connected) */}
      {!isMe && (
        <View style={styles.fabContainer}>
          {alreadyConnected ? (
            <View style={styles.alreadyConnectedBadge}>
              <Ionicons
                name="checkmark-circle"
                size={20}
                color={colors.success}
              />
              <Text style={styles.alreadyConnectedText}>Conexión enviada</Text>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.fab}
              onPress={handleConnect}
              activeOpacity={0.85}
              disabled={connecting}
            >
              <LinearGradient
                colors={[colors.primary, colors.primaryDark]}
                style={styles.fabGradient}
              >
                {connecting ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <Ionicons name="flash" size={20} color="#fff" />
                    <Text style={styles.fabText}>Crear conexión</Text>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Success Modal */}
      <Modal
        visible={successModal}
        type="success"
        title="¡Conexión enviada!"
        message={`Le enviaste una solicitud a ${profile.name}. Si acepta, su núcleo comenzará.`}
        buttonText="Ver conexiones"
        onButtonPress={() => {
          setSuccessModal(false);
          router.push("/(tabs)/connections" as any);
        }}
        secondaryButtonText="Seguir explorando"
        onSecondaryButtonPress={() => {
          setSuccessModal(false);
          router.back();
        }}
        onClose={() => setSuccessModal(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: "center",
    alignItems: "center",
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingBottom: spacing.lg,
  },
  hero: {
    width: "100%",
    height: width * 1.15,
    position: "relative",
  },
  heroImage: {
    width: "100%",
    height: "100%",
  },
  heroGradient: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: "50%",
  },
  topBar: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    paddingHorizontal: spacing.md,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
    marginTop: spacing.sm,
  },
  photoDots: {
    position: "absolute",
    top: spacing.md,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "center",
    gap: spacing.xs,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "rgba(255,255,255,0.4)",
  },
  dotActive: {
    backgroundColor: colors.text,
    width: 18,
  },
  heroInfo: {
    position: "absolute",
    bottom: spacing.lg,
    left: spacing.lg,
    right: spacing.lg,
  },
  heroName: {
    color: colors.text,
    fontSize: fontSize.xxxl,
    fontWeight: fontWeight.bold,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  locationText: {
    color: "rgba(255,255,255,0.8)",
    fontSize: fontSize.sm,
  },
  photosRow: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    gap: spacing.sm,
  },
  thumbPhoto: {
    width: 72,
    height: 72,
    borderRadius: borderRadius.md,
    borderWidth: 2,
    borderColor: "transparent",
  },
  thumbPhotoActive: {
    borderColor: colors.primary,
  },
  section: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    marginBottom: spacing.sm,
  },
  bio: {
    color: colors.textSecondary,
    fontSize: fontSize.md,
    lineHeight: 24,
  },
  interestsWrap: {
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
  interestLabel: {
    color: colors.primary,
    fontSize: fontSize.sm,
  },
  fabContainer: {
    position: "absolute",
    bottom: spacing.xl,
    left: spacing.lg,
    right: spacing.lg,
  },
  fab: {
    borderRadius: borderRadius.xl,
    overflow: "hidden",
    ...shadows.lg,
  },
  fabGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
  },
  fabText: {
    color: colors.text,
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
  },
  alreadyConnectedBadge: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: borderRadius.xl,
    backgroundColor: colors.success + "20",
    borderWidth: 1,
    borderColor: colors.success + "60",
  },
  alreadyConnectedText: {
    color: colors.success,
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
  },
});
