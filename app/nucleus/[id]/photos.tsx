import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  Alert,
} from "react-native";
import { useLocalSearchParams, useRouter, Stack } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { CameraView, useCameraPermissions } from "expo-camera";
import * as ImagePicker from "expo-image-picker";
import { api } from "../../../src/services/api";
import { useNucleusStore } from "../../../src/store/nucleus.store";
import {
  colors,
  fontSize,
  fontWeight,
  spacing,
  borderRadius,
  shadows,
} from "../../../src/utils/theme";

interface PhotosData {
  userPhoto: { photoUrl: string; prompt: string } | null;
  otherPhoto: { photoUrl: string; prompt: string } | null;
  prompt: string;
  bothCompleted: boolean;
}

export default function PhotosScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { uploadPhoto, loadOverview } = useNucleusStore();

  const [permission, requestPermission] = useCameraPermissions();
  const [photosData, setPhotosData] = useState<PhotosData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showCamera, setShowCamera] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [cameraFacing, setCameraFacing] = useState<"front" | "back">("back");

  const cameraRef = useRef<CameraView>(null);

  useEffect(() => {
    loadPhotosData();
  }, [id]);

  const loadPhotosData = async () => {
    try {
      const response = await api.get(`/nucleus/${id}/photos`);
      setPhotosData(response.data);
    } catch (error) {
      console.error("Error loading photos data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTakePhoto = async () => {
    if (!cameraRef.current) return;

    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
      });
      if (photo) {
        setCapturedImage(photo.uri);
        setShowCamera(false);
      }
    } catch (error) {
      console.error("Error taking photo:", error);
      Alert.alert("Error", "No se pudo tomar la foto");
    }
  };

  const handleUpload = async () => {
    if (!capturedImage || !photosData) return;

    setIsUploading(true);
    try {
      // In a real app, you would upload to a storage service first
      // For now, we'll simulate by using the local URI
      const result = await uploadPhoto(id!, capturedImage, photosData.prompt);
      if (result) {
        await loadPhotosData();
        await loadOverview(id!);
        setCapturedImage(null);
      }
    } catch (error) {
      console.error("Error uploading photo:", error);
      Alert.alert("Error", "No se pudo subir la foto");
    } finally {
      setIsUploading(false);
    }
  };

  const toggleCameraFacing = () => {
    setCameraFacing((current) => (current === "back" ? "front" : "back"));
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <Stack.Screen
          options={{
            headerShown: true,
            headerTitle: "Foto Instantanea",
            headerStyle: { backgroundColor: colors.background },
            headerTintColor: colors.text,
            headerBackVisible: true,
          }}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (!photosData) {
    return (
      <SafeAreaView style={styles.container}>
        <Stack.Screen
          options={{
            headerShown: true,
            headerTitle: "Foto Instantanea",
            headerStyle: { backgroundColor: colors.background },
            headerTintColor: colors.text,
            headerBackVisible: true,
          }}
        />
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={64} color={colors.error} />
          <Text style={styles.errorText}>Error al cargar</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Camera view
  if (showCamera) {
    if (!permission?.granted) {
      return (
        <SafeAreaView style={styles.container}>
          <Stack.Screen
            options={{
              headerShown: true,
              headerTitle: "Foto Instantanea",
              headerStyle: { backgroundColor: colors.background },
              headerTintColor: colors.text,
              headerBackVisible: true,
            }}
          />
          <View style={styles.permissionContainer}>
            <Ionicons name="camera" size={64} color={colors.textMuted} />
            <Text style={styles.permissionText}>
              Necesitamos acceso a tu camara para tomar fotos instantaneas
            </Text>
            <TouchableOpacity
              style={styles.permissionButton}
              onPress={requestPermission}
            >
              <Text style={styles.permissionButtonText}>Dar permiso</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setShowCamera(false)}>
              <Text style={styles.cancelText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      );
    }

    return (
      <View style={styles.cameraContainer}>
        <Stack.Screen options={{ headerShown: false }} />
        <CameraView ref={cameraRef} style={styles.camera} facing={cameraFacing}>
          {/* Prompt overlay */}
          <View style={styles.promptOverlay}>
            <Text style={styles.promptOverlayText}>{photosData.prompt}</Text>
          </View>

          {/* Camera controls */}
          <View style={styles.cameraControls}>
            <TouchableOpacity
              style={styles.cameraButton}
              onPress={() => setShowCamera(false)}
            >
              <Ionicons name="close" size={28} color={colors.text} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.captureButton}
              onPress={handleTakePhoto}
            >
              <View style={styles.captureButtonInner} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.cameraButton}
              onPress={toggleCameraFacing}
            >
              <Ionicons name="camera-reverse" size={28} color={colors.text} />
            </TouchableOpacity>
          </View>
        </CameraView>
      </View>
    );
  }

  // Preview captured image
  if (capturedImage) {
    return (
      <SafeAreaView style={styles.container} edges={["bottom"]}>
        <Stack.Screen
          options={{
            headerShown: true,
            headerTitle: "Tu foto",
            headerStyle: { backgroundColor: colors.background },
            headerTintColor: colors.text,
            headerBackVisible: true,
          }}
        />
        <View style={styles.previewContainer}>
          <Image source={{ uri: capturedImage }} style={styles.previewImage} />

          <View style={styles.previewPrompt}>
            <Text style={styles.previewPromptLabel}>Prompt:</Text>
            <Text style={styles.previewPromptText}>{photosData.prompt}</Text>
          </View>

          <View style={styles.previewActions}>
            <TouchableOpacity
              style={styles.retakeButton}
              onPress={() => setCapturedImage(null)}
            >
              <Ionicons name="refresh" size={20} color={colors.text} />
              <Text style={styles.retakeButtonText}>Otra foto</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.uploadButton,
                isUploading && styles.uploadButtonDisabled,
              ]}
              onPress={handleUpload}
              disabled={isUploading}
            >
              {isUploading ? (
                <ActivityIndicator size="small" color={colors.text} />
              ) : (
                <>
                  <Text style={styles.uploadButtonText}>Subir foto</Text>
                  <Ionicons name="cloud-upload" size={20} color={colors.text} />
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // Main photos view
  return (
    <SafeAreaView style={styles.container} edges={["bottom"]}>
      <Stack.Screen
        options={{
          headerShown: true,
          headerTitle: "Foto Instantanea",
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.text,
          headerBackVisible: true,
        }}
      />

      <View style={styles.content}>
        {/* Prompt Card */}
        <View style={styles.promptCard}>
          <Ionicons name="camera" size={32} color="#E91E63" />
          <Text style={styles.promptTitle}>El prompt de hoy:</Text>
          <Text style={styles.promptText}>{photosData.prompt}</Text>
        </View>

        {/* Photos Grid */}
        <View style={styles.photosGrid}>
          {/* User Photo */}
          <View style={styles.photoCard}>
            <Text style={styles.photoLabel}>Tu</Text>
            {photosData.userPhoto ? (
              <Image
                source={{ uri: photosData.userPhoto.photoUrl }}
                style={styles.photoImage}
              />
            ) : (
              <View style={styles.photoPlaceholder}>
                <Ionicons name="person" size={48} color={colors.textMuted} />
                <Text style={styles.photoPlaceholderText}>Pendiente</Text>
              </View>
            )}
          </View>

          {/* Other Photo */}
          <View style={styles.photoCard}>
            <Text style={styles.photoLabel}>Su foto</Text>
            {photosData.bothCompleted && photosData.otherPhoto ? (
              <Image
                source={{ uri: photosData.otherPhoto.photoUrl }}
                style={styles.photoImage}
              />
            ) : photosData.otherPhoto ? (
              <View style={styles.photoPlaceholder}>
                <Ionicons
                  name="lock-closed"
                  size={48}
                  color={colors.textMuted}
                />
                <Text style={styles.photoPlaceholderText}>
                  {photosData.userPhoto
                    ? "Esperando..."
                    : "Sube tu foto para ver"}
                </Text>
              </View>
            ) : (
              <View style={styles.photoPlaceholder}>
                <Ionicons name="time" size={48} color={colors.textMuted} />
                <Text style={styles.photoPlaceholderText}>Esperando...</Text>
              </View>
            )}
          </View>
        </View>

        {/* Actions */}
        {!photosData.userPhoto && (
          <View style={styles.actions}>
            <TouchableOpacity
              style={styles.cameraActionButton}
              onPress={() => setShowCamera(true)}
            >
              <Ionicons name="camera" size={24} color={colors.text} />
              <Text style={styles.actionButtonText}>Tomar foto ahora</Text>
            </TouchableOpacity>
          </View>
        )}

        {photosData.bothCompleted && (
          <View style={styles.completedBanner}>
            <Ionicons
              name="checkmark-circle"
              size={24}
              color={colors.success}
            />
            <Text style={styles.completedText}>Ambos subieron su foto!</Text>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: spacing.md,
  },
  errorText: {
    color: colors.error,
    fontSize: fontSize.lg,
  },
  permissionContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.xl,
    gap: spacing.lg,
  },
  permissionText: {
    color: colors.textSecondary,
    fontSize: fontSize.md,
    textAlign: "center",
  },
  permissionButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
  },
  permissionButtonText: {
    color: colors.text,
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
  },
  cancelText: {
    color: colors.textMuted,
    fontSize: fontSize.md,
  },
  cameraContainer: {
    flex: 1,
  },
  camera: {
    flex: 1,
    justifyContent: "space-between",
  },
  promptOverlay: {
    backgroundColor: "rgba(0,0,0,0.7)",
    padding: spacing.lg,
    margin: spacing.md,
    borderRadius: borderRadius.lg,
    marginTop: spacing.xxl,
  },
  promptOverlayText: {
    color: colors.text,
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    textAlign: "center",
  },
  cameraControls: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    padding: spacing.xl,
    paddingBottom: spacing.xxl,
  },
  cameraButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  captureButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.text,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 4,
    borderColor: "rgba(255,255,255,0.5)",
  },
  captureButtonInner: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#E91E63",
  },
  previewContainer: {
    flex: 1,
    padding: spacing.md,
    gap: spacing.lg,
  },
  previewImage: {
    flex: 1,
    borderRadius: borderRadius.xl,
  },
  previewPrompt: {
    backgroundColor: colors.backgroundCard,
    padding: spacing.md,
    borderRadius: borderRadius.md,
  },
  previewPromptLabel: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
    marginBottom: spacing.xs,
  },
  previewPromptText: {
    color: colors.text,
    fontSize: fontSize.md,
  },
  previewActions: {
    flexDirection: "row",
    gap: spacing.md,
  },
  retakeButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.backgroundLight,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    gap: spacing.sm,
  },
  retakeButtonText: {
    color: colors.text,
    fontSize: fontSize.md,
    fontWeight: fontWeight.medium,
  },
  uploadButton: {
    flex: 2,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#E91E63",
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    gap: spacing.sm,
  },
  uploadButtonDisabled: {
    opacity: 0.5,
  },
  uploadButtonText: {
    color: colors.text,
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
  },
  content: {
    flex: 1,
    padding: spacing.lg,
    gap: spacing.lg,
  },
  promptCard: {
    backgroundColor: colors.backgroundCard,
    padding: spacing.lg,
    borderRadius: borderRadius.xl,
    alignItems: "center",
    gap: spacing.sm,
    ...shadows.md,
  },
  promptTitle: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
  },
  promptText: {
    color: colors.text,
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    textAlign: "center",
  },
  photosGrid: {
    flexDirection: "row",
    gap: spacing.md,
    flex: 1,
  },
  photoCard: {
    flex: 1,
    gap: spacing.sm,
  },
  photoLabel: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    textAlign: "center",
  },
  photoImage: {
    flex: 1,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.backgroundLight,
  },
  photoPlaceholder: {
    flex: 1,
    backgroundColor: colors.backgroundCard,
    borderRadius: borderRadius.lg,
    justifyContent: "center",
    alignItems: "center",
    gap: spacing.sm,
    borderWidth: 2,
    borderColor: colors.border,
    borderStyle: "dashed",
  },
  photoPlaceholderText: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
    textAlign: "center",
    paddingHorizontal: spacing.md,
  },
  actions: {
    gap: spacing.md,
  },
  cameraActionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#E91E63",
    paddingVertical: spacing.lg,
    borderRadius: borderRadius.lg,
    gap: spacing.sm,
  },
  actionButtonText: {
    color: colors.text,
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
  },
  completedBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.success + "20",
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    gap: spacing.sm,
  },
  completedText: {
    color: colors.success,
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
  },
});
