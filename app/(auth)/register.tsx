import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Image,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as ImagePicker from "expo-image-picker";
import Animated, {
  FadeIn,
  FadeInDown,
  FadeInUp,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { Button, Modal, InterestsPicker } from "../../src/components";
import { useAuthStore } from "../../src/store/auth.store";
import {
  colors,
  fontSize,
  fontWeight,
  spacing,
  borderRadius,
} from "../../src/utils/theme";

const { width } = Dimensions.get("window");
const TOTAL_STEPS = 8;

// Data options
const GENDERS = [
  { value: "MALE", label: "Hombre", icon: "male" },
  { value: "FEMALE", label: "Mujer", icon: "female" },
  { value: "NON_BINARY", label: "No binario", icon: "transgender" },
  { value: "OTHER", label: "Otro", icon: "ellipsis-horizontal" },
];

const LOOKING_FOR_OPTIONS = [
  {
    value: "amistad",
    label: "Amistad",
    icon: "people",
    desc: "Conocer nuevos amigos",
  },
  {
    value: "relacion",
    label: "Relacion seria",
    icon: "heart",
    desc: "Algo a largo plazo",
  },
  {
    value: "casual",
    label: "Algo casual",
    icon: "cafe",
    desc: "Sin presiones",
  },
  {
    value: "nosedice",
    label: "Que fluya",
    icon: "sparkles",
    desc: "Lo que surja",
  },
];

// Animated chip component
const AnimatedChip = ({
  item,
  isSelected,
  onPress,
  index,
  showIcon = true,
  showDesc = false,
}: {
  item: { value: string; label: string; icon?: string; desc?: string };
  isSelected: boolean;
  onPress: () => void;
  index: number;
  showIcon?: boolean;
  showDesc?: boolean;
}) => {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePress = () => {
    scale.value = withSpring(0.95, {}, () => {
      scale.value = withSpring(1);
    });
    onPress();
  };

  return (
    <Animated.View
      entering={FadeInDown.delay(index * 50).springify()}
      style={animatedStyle}
    >
      <TouchableOpacity
        style={[
          styles.chip,
          isSelected && styles.chipSelected,
          showDesc && styles.chipLarge,
        ]}
        onPress={handlePress}
        activeOpacity={0.8}
      >
        {showIcon && item.icon && (
          <Ionicons
            name={item.icon as any}
            size={showDesc ? 28 : 20}
            color={isSelected ? colors.primary : colors.textSecondary}
          />
        )}
        <View style={showDesc ? styles.chipTextContainer : undefined}>
          <Text
            style={[styles.chipText, isSelected && styles.chipTextSelected]}
          >
            {item.label}
          </Text>
          {showDesc && item.desc && (
            <Text style={styles.chipDesc}>{item.desc}</Text>
          )}
        </View>
        {isSelected && (
          <Animated.View
            entering={FadeIn.duration(200)}
            style={styles.chipCheck}
          >
            <Ionicons
              name="checkmark-circle"
              size={18}
              color={colors.primary}
            />
          </Animated.View>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
};

// Photo picker component
const PhotoSlot = ({
  photo,
  onPress,
  index,
  isMain = false,
}: {
  photo: string | null;
  onPress: () => void;
  index: number;
  isMain?: boolean;
}) => {
  return (
    <Animated.View entering={FadeInDown.delay(index * 100).springify()}>
      <TouchableOpacity
        style={[styles.photoSlot, isMain && styles.photoSlotMain]}
        onPress={onPress}
        activeOpacity={0.8}
      >
        {photo ? (
          <>
            <Image source={{ uri: photo }} style={styles.photoImage} />
            <View style={styles.photoOverlay}>
              <Ionicons name="pencil" size={20} color={colors.text} />
            </View>
          </>
        ) : (
          <View style={styles.photoPlaceholder}>
            <Ionicons
              name="add"
              size={isMain ? 40 : 28}
              color={colors.textMuted}
            />
            {isMain && <Text style={styles.photoMainText}>Foto principal</Text>}
          </View>
        )}
        {isMain && photo && (
          <View style={styles.mainBadge}>
            <Text style={styles.mainBadgeText}>Principal</Text>
          </View>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
};

// Age selector with horizontal scroll
const AgeSelector = ({
  value,
  onChange,
}: {
  value: number;
  onChange: (age: number) => void;
}) => {
  const ages = Array.from({ length: 63 }, (_, i) => i + 18); // 18-80

  return (
    <Animated.View
      entering={FadeInDown.springify()}
      style={styles.ageContainer}
    >
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.ageScroll}
      >
        {ages.map((age, index) => (
          <Animated.View
            key={age}
            entering={FadeInDown.delay(index * 15).springify()}
          >
            <TouchableOpacity
              style={[styles.ageItem, value === age && styles.ageItemSelected]}
              onPress={() => onChange(age)}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.ageText,
                  value === age && styles.ageTextSelected,
                ]}
              >
                {age}
              </Text>
            </TouchableOpacity>
          </Animated.View>
        ))}
      </ScrollView>
    </Animated.View>
  );
};

export default function RegisterScreen() {
  const { register, isLoading, error, clearError } = useAuthStore();
  const [step, setStep] = useState(1);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    age: 18,
    gender: "",
    interestedIn: [] as string[],
    interests: [] as string[],
    lookingFor: [] as string[],
    photos: [] as string[],
    bio: "",
  });

  const progress = useSharedValue(1 / TOTAL_STEPS);

  useEffect(() => {
    progress.value = withTiming(step / TOTAL_STEPS, { duration: 300 });
  }, [step]);

  const progressStyle = useAnimatedStyle(() => ({
    width: `${progress.value * 100}%`,
  }));

  const updateField = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const toggleArrayField = (
    field: "interestedIn" | "interests" | "lookingFor",
    value: string,
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: prev[field].includes(value)
        ? prev[field].filter((v) => v !== value)
        : [...prev[field], value],
    }));
  };

  const nextStep = () => {
    if (step < TOTAL_STEPS) {
      setStep(step + 1);
    }
  };

  const prevStep = () => {
    if (step > 1) {
      setStep(step - 1);
    } else {
      router.back();
    }
  };

  const pickImage = async (index: number) => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [3, 4],
      quality: 0.8,
    });

    if (!result.canceled) {
      const newPhotos = [...formData.photos];
      newPhotos[index] = result.assets[0].uri;
      updateField("photos", newPhotos);
    }
  };

  const canProceed = () => {
    switch (step) {
      case 1:
        return formData.name.length >= 2;
      case 2:
        return formData.email.includes("@") && formData.password.length >= 6;
      case 3:
        return formData.age >= 18;
      case 4:
        return formData.gender !== "";
      case 5:
        return formData.interestedIn.length > 0;
      case 6:
        return formData.interests.length >= 5;
      case 7:
        return formData.lookingFor.length > 0;
      case 8:
        return formData.photos.length >= 2;
      default:
        return true;
    }
  };

  const handleRegister = async () => {
    // Calculate birthDate from age
    const today = new Date();
    const birthYear = today.getFullYear() - formData.age;
    const birthDate = new Date(birthYear, today.getMonth(), today.getDate());

    const success = await register({
      name: formData.name,
      email: formData.email,
      password: formData.password,
      birthDate: birthDate.toISOString(),
      gender: formData.gender,
      interestedIn: formData.interestedIn,
      interests: formData.interests,
      lookingFor: formData.lookingFor,
      photos: formData.photos,
      bio: formData.bio,
    });

    if (success) {
      setShowSuccessModal(true);
    } else {
      setShowErrorModal(true);
    }
  };

  const handleSuccessModalClose = () => {
    setShowSuccessModal(false);
    router.replace("/(tabs)");
  };

  const handleErrorModalClose = () => {
    setShowErrorModal(false);
    clearError();
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <Animated.View
            key="step1"
            entering={FadeInDown.springify()}
            style={styles.stepContent}
          >
            <View style={styles.stepHeader}>
              <Animated.Text
                entering={FadeInDown.delay(100)}
                style={styles.emoji}
              >
                👋
              </Animated.Text>
              <Animated.Text
                entering={FadeInDown.delay(200)}
                style={styles.stepTitle}
              >
                Como te llamas?
              </Animated.Text>
              <Animated.Text
                entering={FadeInDown.delay(300)}
                style={styles.stepSubtitle}
              >
                Asi te veran los demas
              </Animated.Text>
            </View>

            <Animated.View entering={FadeInUp.delay(400).springify()}>
              <TextInput
                style={styles.bigInput}
                placeholder="Tu nombre"
                placeholderTextColor={colors.textMuted}
                value={formData.name}
                onChangeText={(v) => updateField("name", v)}
                autoFocus
                autoCapitalize="words"
              />
            </Animated.View>
          </Animated.View>
        );

      case 2:
        return (
          <Animated.View
            key="step2"
            entering={FadeInDown.springify()}
            style={styles.stepContent}
          >
            <View style={styles.stepHeader}>
              <Animated.Text
                entering={FadeInDown.delay(100)}
                style={styles.emoji}
              >
                🔐
              </Animated.Text>
              <Animated.Text
                entering={FadeInDown.delay(200)}
                style={styles.stepTitle}
              >
                Tu cuenta
              </Animated.Text>
              <Animated.Text
                entering={FadeInDown.delay(300)}
                style={styles.stepSubtitle}
              >
                Email y contraseña para ingresar
              </Animated.Text>
            </View>

            <Animated.View
              entering={FadeInUp.delay(400).springify()}
              style={styles.inputGroup}
            >
              <View style={styles.inputContainer}>
                <Ionicons
                  name="mail-outline"
                  size={20}
                  color={colors.textMuted}
                />
                <TextInput
                  style={styles.input}
                  placeholder="tu@email.com"
                  placeholderTextColor={colors.textMuted}
                  value={formData.email}
                  onChangeText={(v) => updateField("email", v.toLowerCase())}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>

              <View style={styles.inputContainer}>
                <Ionicons
                  name="lock-closed-outline"
                  size={20}
                  color={colors.textMuted}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Contraseña (min. 6 caracteres)"
                  placeholderTextColor={colors.textMuted}
                  value={formData.password}
                  onChangeText={(v) => updateField("password", v)}
                  secureTextEntry
                />
              </View>
            </Animated.View>
          </Animated.View>
        );

      case 3:
        return (
          <Animated.View
            key="step3"
            entering={FadeInDown.springify()}
            style={styles.stepContent}
          >
            <View style={styles.stepHeader}>
              <Animated.Text
                entering={FadeInDown.delay(100)}
                style={styles.emoji}
              >
                🎂
              </Animated.Text>
              <Animated.Text
                entering={FadeInDown.delay(200)}
                style={styles.stepTitle}
              >
                Cuantos años tienes?
              </Animated.Text>
              <Animated.Text
                entering={FadeInDown.delay(300)}
                style={styles.stepSubtitle}
              >
                Debes ser mayor de 18
              </Animated.Text>
            </View>

            <AgeSelector
              value={formData.age}
              onChange={(age) => updateField("age", age)}
            />

            <Animated.View
              entering={FadeIn.delay(500)}
              style={styles.ageDisplay}
            >
              <Text style={styles.ageDisplayText}>{formData.age} años</Text>
            </Animated.View>
          </Animated.View>
        );

      case 4:
        return (
          <Animated.View
            key="step4"
            entering={FadeInDown.springify()}
            style={styles.stepContent}
          >
            <View style={styles.stepHeader}>
              <Animated.Text
                entering={FadeInDown.delay(100)}
                style={styles.emoji}
              >
                ✨
              </Animated.Text>
              <Animated.Text
                entering={FadeInDown.delay(200)}
                style={styles.stepTitle}
              >
                Como te identificas?
              </Animated.Text>
            </View>

            <View style={styles.genderGrid}>
              {GENDERS.map((gender, index) => (
                <AnimatedChip
                  key={gender.value}
                  item={gender}
                  isSelected={formData.gender === gender.value}
                  onPress={() => updateField("gender", gender.value)}
                  index={index}
                  showDesc={false}
                />
              ))}
            </View>
          </Animated.View>
        );

      case 5:
        return (
          <Animated.View
            key="step5"
            entering={FadeInDown.springify()}
            style={styles.stepContent}
          >
            <View style={styles.stepHeader}>
              <Animated.Text
                entering={FadeInDown.delay(100)}
                style={styles.emoji}
              >
                💕
              </Animated.Text>
              <Animated.Text
                entering={FadeInDown.delay(200)}
                style={styles.stepTitle}
              >
                Quien te interesa?
              </Animated.Text>
              <Animated.Text
                entering={FadeInDown.delay(300)}
                style={styles.stepSubtitle}
              >
                Puedes elegir mas de uno
              </Animated.Text>
            </View>

            <View style={styles.genderGrid}>
              {GENDERS.map((gender, index) => (
                <AnimatedChip
                  key={gender.value}
                  item={gender}
                  isSelected={formData.interestedIn.includes(gender.value)}
                  onPress={() => toggleArrayField("interestedIn", gender.value)}
                  index={index}
                />
              ))}
            </View>
          </Animated.View>
        );

      case 6:
        return (
          <Animated.View
            key="step6"
            entering={FadeInDown.springify()}
            style={styles.stepContent}
          >
            <View style={styles.stepHeader}>
              <Animated.Text
                entering={FadeInDown.delay(100)}
                style={styles.emoji}
              >
                🎯
              </Animated.Text>
              <Animated.Text
                entering={FadeInDown.delay(200)}
                style={styles.stepTitle}
              >
                Que te gusta?
              </Animated.Text>
              <Animated.Text
                entering={FadeInDown.delay(300)}
                style={styles.stepSubtitle}
              >
                Elige al menos 5 intereses (máx. 10)
              </Animated.Text>
            </View>

            <ScrollView
              style={styles.interestsScroll}
              showsVerticalScrollIndicator={false}
            >
              <InterestsPicker
                selected={formData.interests}
                onChange={(interests) =>
                  setFormData((prev) => ({ ...prev, interests }))
                }
              />
            </ScrollView>
          </Animated.View>
        );

      case 7:
        return (
          <Animated.View
            key="step7"
            entering={FadeInDown.springify()}
            style={styles.stepContent}
          >
            <View style={styles.stepHeader}>
              <Animated.Text
                entering={FadeInDown.delay(100)}
                style={styles.emoji}
              >
                🔮
              </Animated.Text>
              <Animated.Text
                entering={FadeInDown.delay(200)}
                style={styles.stepTitle}
              >
                Que buscas?
              </Animated.Text>
              <Animated.Text
                entering={FadeInDown.delay(300)}
                style={styles.stepSubtitle}
              >
                Puedes elegir varias opciones
              </Animated.Text>
            </View>

            <View style={styles.lookingForGrid}>
              {LOOKING_FOR_OPTIONS.map((option, index) => (
                <AnimatedChip
                  key={option.value}
                  item={option}
                  isSelected={formData.lookingFor.includes(option.value)}
                  onPress={() => toggleArrayField("lookingFor", option.value)}
                  index={index}
                  showDesc={true}
                />
              ))}
            </View>
          </Animated.View>
        );

      case 8:
        return (
          <Animated.View
            key="step8"
            entering={FadeInDown.springify()}
            style={styles.stepContent}
          >
            <View style={styles.stepHeader}>
              <Animated.Text
                entering={FadeInDown.delay(100)}
                style={styles.emoji}
              >
                📸
              </Animated.Text>
              <Animated.Text
                entering={FadeInDown.delay(200)}
                style={styles.stepTitle}
              >
                Tus fotos
              </Animated.Text>
              <Animated.Text
                entering={FadeInDown.delay(300)}
                style={styles.stepSubtitle}
              >
                Agrega al menos 2 fotos
              </Animated.Text>
            </View>

            <View style={styles.photosGrid}>
              <PhotoSlot
                photo={formData.photos[0] || null}
                onPress={() => pickImage(0)}
                index={0}
                isMain={true}
              />
              <View style={styles.photosSmall}>
                {[1, 2, 3, 4].map((i) => (
                  <PhotoSlot
                    key={i}
                    photo={formData.photos[i] || null}
                    onPress={() => pickImage(i)}
                    index={i}
                  />
                ))}
              </View>
            </View>

            {/* Optional bio */}
            <Animated.View
              entering={FadeInUp.delay(600)}
              style={styles.bioSection}
            >
              <Text style={styles.bioLabel}>Bio (opcional)</Text>
              <TextInput
                style={styles.bioInput}
                placeholder="Cuentanos algo sobre ti..."
                placeholderTextColor={colors.textMuted}
                value={formData.bio}
                onChangeText={(v) => updateField("bio", v)}
                multiline
                maxLength={300}
              />
              <Text style={styles.bioCount}>{formData.bio.length}/300</Text>
            </Animated.View>
          </Animated.View>
        );

      default:
        return null;
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[colors.background, colors.backgroundLight]}
        style={StyleSheet.absoluteFill}
      />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={prevStep}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>

        {/* Progress bar */}
        <View style={styles.progressBar}>
          <Animated.View style={[styles.progressFill, progressStyle]} />
        </View>

        <Text style={styles.stepIndicator}>
          {step}/{TOTAL_STEPS}
        </Text>
      </View>

      {/* Content */}
      <KeyboardAvoidingView
        style={styles.content}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {renderStep()}
        </ScrollView>

        {/* Footer */}
        <Animated.View entering={FadeInUp.delay(500)} style={styles.footer}>
          {step < TOTAL_STEPS ? (
            <Button
              title="Continuar"
              onPress={nextStep}
              disabled={!canProceed()}
              fullWidth
              size="lg"
            />
          ) : (
            <Button
              title="Crear mi cuenta"
              onPress={handleRegister}
              loading={isLoading}
              disabled={!canProceed()}
              fullWidth
              size="lg"
            />
          )}

          {step === 1 && (
            <View style={styles.loginLink}>
              <Text style={styles.loginText}>Ya tienes cuenta? </Text>
              <TouchableOpacity onPress={() => router.replace("/(auth)/login")}>
                <Text style={styles.loginLinkText}>Inicia sesion</Text>
              </TouchableOpacity>
            </View>
          )}
        </Animated.View>
      </KeyboardAvoidingView>

      {/* Success Modal */}
      <Modal
        visible={showSuccessModal}
        onClose={handleSuccessModalClose}
        type="success"
        title="Bienvenido a Linka!"
        message={`Hola ${formData.name}! Tu cuenta ha sido creada. Es hora de hacer conexiones.`}
        buttonText="Empezar"
        onButtonPress={handleSuccessModalClose}
        dismissOnBackdrop={false}
      />

      {/* Error Modal */}
      <Modal
        visible={showErrorModal}
        onClose={handleErrorModalClose}
        type="error"
        title="Algo salio mal"
        message={error || "No pudimos crear tu cuenta. Intenta de nuevo."}
        buttonText="Entendido"
        onButtonPress={handleErrorModalClose}
      />
    </View>
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
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xxl + spacing.lg,
    paddingBottom: spacing.md,
    gap: spacing.md,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.backgroundCard,
    justifyContent: "center",
    alignItems: "center",
  },
  progressBar: {
    flex: 1,
    height: 4,
    backgroundColor: colors.backgroundCard,
    borderRadius: 2,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: colors.primary,
    borderRadius: 2,
  },
  stepIndicator: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
    width: 35,
    textAlign: "right",
  },
  content: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: spacing.lg,
  },
  stepContent: {
    flex: 1,
    paddingTop: spacing.xl,
  },
  stepHeader: {
    alignItems: "center",
    marginBottom: spacing.xl,
  },
  emoji: {
    fontSize: 48,
    marginBottom: spacing.md,
  },
  stepTitle: {
    color: colors.text,
    fontSize: fontSize.xxl,
    fontWeight: fontWeight.bold,
    textAlign: "center",
    marginBottom: spacing.xs,
  },
  stepSubtitle: {
    color: colors.textSecondary,
    fontSize: fontSize.md,
    textAlign: "center",
  },
  bigInput: {
    backgroundColor: colors.backgroundCard,
    borderRadius: borderRadius.xl,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
    color: colors.text,
    fontSize: fontSize.xl,
    textAlign: "center",
  },
  inputGroup: {
    gap: spacing.md,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.backgroundCard,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
  },
  input: {
    flex: 1,
    paddingVertical: spacing.md,
    color: colors.text,
    fontSize: fontSize.md,
  },
  ageContainer: {
    marginTop: spacing.lg,
  },
  ageScroll: {
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
  },
  ageItem: {
    width: 60,
    height: 60,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 30,
    backgroundColor: colors.backgroundCard,
    marginHorizontal: 4,
  },
  ageItemSelected: {
    backgroundColor: colors.primary,
    transform: [{ scale: 1.1 }],
  },
  ageText: {
    color: colors.textMuted,
    fontSize: fontSize.lg,
    fontWeight: fontWeight.medium,
  },
  ageTextSelected: {
    color: colors.text,
    fontWeight: fontWeight.bold,
    fontSize: fontSize.xl,
  },
  ageDisplay: {
    alignItems: "center",
    marginTop: spacing.xl,
  },
  ageDisplayText: {
    color: colors.text,
    fontSize: fontSize.xxxl,
    fontWeight: fontWeight.bold,
  },
  genderGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: spacing.md,
    marginTop: spacing.lg,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.backgroundCard,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.full,
    borderWidth: 2,
    borderColor: "transparent",
    gap: spacing.sm,
  },
  chipSelected: {
    borderColor: colors.primary,
    backgroundColor: "rgba(139, 92, 246, 0.15)",
  },
  chipLarge: {
    width: "100%",
    paddingVertical: spacing.lg,
    borderRadius: borderRadius.xl,
  },
  chipTextContainer: {
    flex: 1,
  },
  chipText: {
    color: colors.text,
    fontSize: fontSize.md,
    fontWeight: fontWeight.medium,
  },
  chipTextSelected: {
    color: colors.primary,
  },
  chipDesc: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
    marginTop: 2,
  },
  chipCheck: {
    marginLeft: "auto",
  },
  interestsScroll: {
    flex: 1,
    marginTop: spacing.md,
  },
  interestsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: spacing.sm,
    paddingBottom: spacing.lg,
  },
  selectionCount: {
    alignItems: "center",
    paddingVertical: spacing.sm,
  },
  selectionCountText: {
    color: colors.primary,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
  },
  lookingForGrid: {
    gap: spacing.md,
    marginTop: spacing.lg,
  },
  photosGrid: {
    flexDirection: "row",
    gap: spacing.md,
    marginTop: spacing.lg,
  },
  photosSmall: {
    flex: 1,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  photoSlot: {
    width: (width - spacing.lg * 2 - spacing.md - spacing.sm * 2) / 4,
    aspectRatio: 3 / 4,
    backgroundColor: colors.backgroundCard,
    borderRadius: borderRadius.lg,
    overflow: "hidden",
  },
  photoSlotMain: {
    width: (width - spacing.lg * 2 - spacing.md) / 2,
  },
  photoImage: {
    width: "100%",
    height: "100%",
  },
  photoOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "rgba(0,0,0,0.5)",
    paddingVertical: spacing.xs,
    alignItems: "center",
  },
  photoPlaceholder: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: colors.border,
    borderStyle: "dashed",
    borderRadius: borderRadius.lg,
  },
  photoMainText: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
    marginTop: spacing.xs,
  },
  mainBadge: {
    position: "absolute",
    top: spacing.xs,
    left: spacing.xs,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  mainBadgeText: {
    color: colors.text,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
  },
  bioSection: {
    marginTop: spacing.xl,
  },
  bioLabel: {
    color: colors.text,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    marginBottom: spacing.sm,
  },
  bioInput: {
    backgroundColor: colors.backgroundCard,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    color: colors.text,
    fontSize: fontSize.md,
    minHeight: 100,
    textAlignVertical: "top",
  },
  bioCount: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
    textAlign: "right",
    marginTop: spacing.xs,
  },
  footer: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  loginLink: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: spacing.md,
  },
  loginText: {
    color: colors.textSecondary,
    fontSize: fontSize.md,
  },
  loginLinkText: {
    color: colors.primary,
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
  },
});
