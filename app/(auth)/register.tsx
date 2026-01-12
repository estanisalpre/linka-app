import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Button, Input, Modal } from '../../src/components';
import { useAuthStore } from '../../src/store/auth.store';
import { colors, fontSize, fontWeight, spacing, borderRadius } from '../../src/utils/theme';

const GENDERS = [
  { value: 'MALE', label: 'Hombre' },
  { value: 'FEMALE', label: 'Mujer' },
  { value: 'NON_BINARY', label: 'No binario' },
  { value: 'OTHER', label: 'Otro' },
];

export default function RegisterScreen() {
  const { register, isLoading, error, clearError } = useAuthStore();
  const [step, setStep] = useState(1);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    birthDate: '',
    gender: '',
    interestedIn: [] as string[],
    bio: '',
  });

  const updateField = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const toggleInterest = (gender: string) => {
    setFormData((prev) => ({
      ...prev,
      interestedIn: prev.interestedIn.includes(gender)
        ? prev.interestedIn.filter((g) => g !== gender)
        : [...prev.interestedIn, gender],
    }));
  };

  const handleRegister = async () => {
    const success = await register({
      ...formData,
      birthDate: new Date(formData.birthDate).toISOString(),
    });
    if (success) {
      setShowSuccessModal(true);
    } else {
      setShowErrorModal(true);
    }
  };

  const handleSuccessModalClose = () => {
    setShowSuccessModal(false);
    router.replace('/(tabs)');
  };

  const handleErrorModalClose = () => {
    setShowErrorModal(false);
    clearError();
  };

  const canProceed = () => {
    switch (step) {
      case 1:
        return formData.name && formData.email && formData.password.length >= 6;
      case 2:
        return formData.birthDate && formData.gender;
      case 3:
        return formData.interestedIn.length > 0;
      default:
        return true;
    }
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Datos básicos</Text>
            <Text style={styles.stepSubtitle}>Comencemos con lo esencial</Text>

            <Input
              label="Nombre"
              placeholder="Tu nombre"
              value={formData.name}
              onChangeText={(v) => updateField('name', v)}
              leftIcon="person-outline"
            />

            <Input
              label="Email"
              placeholder="tu@email.com"
              keyboardType="email-address"
              autoCapitalize="none"
              value={formData.email}
              onChangeText={(v) => updateField('email', v)}
              leftIcon="mail-outline"
            />

            <Input
              label="Contraseña"
              placeholder="Mínimo 6 caracteres"
              secureTextEntry
              value={formData.password}
              onChangeText={(v) => updateField('password', v)}
              leftIcon="lock-closed-outline"
              error={
                formData.password && formData.password.length < 6
                  ? 'Mínimo 6 caracteres'
                  : undefined
              }
            />
          </View>
        );

      case 2:
        return (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Sobre ti</Text>
            <Text style={styles.stepSubtitle}>Cuéntanos un poco más</Text>

            <Input
              label="Fecha de nacimiento"
              placeholder="YYYY-MM-DD"
              value={formData.birthDate}
              onChangeText={(v) => updateField('birthDate', v)}
              leftIcon="calendar-outline"
            />

            <Text style={styles.label}>Género</Text>
            <View style={styles.optionsGrid}>
              {GENDERS.map((gender) => (
                <TouchableOpacity
                  key={gender.value}
                  style={[
                    styles.optionButton,
                    formData.gender === gender.value && styles.optionSelected,
                  ]}
                  onPress={() => updateField('gender', gender.value)}
                >
                  <Text
                    style={[
                      styles.optionText,
                      formData.gender === gender.value && styles.optionTextSelected,
                    ]}
                  >
                    {gender.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        );

      case 3:
        return (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>¿Quién te interesa?</Text>
            <Text style={styles.stepSubtitle}>Puedes elegir más de uno</Text>

            <View style={styles.optionsGrid}>
              {GENDERS.map((gender) => (
                <TouchableOpacity
                  key={gender.value}
                  style={[
                    styles.optionButton,
                    formData.interestedIn.includes(gender.value) && styles.optionSelected,
                  ]}
                  onPress={() => toggleInterest(gender.value)}
                >
                  <Text
                    style={[
                      styles.optionText,
                      formData.interestedIn.includes(gender.value) && styles.optionTextSelected,
                    ]}
                  >
                    {gender.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        );

      case 4:
        return (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Tu bio</Text>
            <Text style={styles.stepSubtitle}>Opcional, pero ayuda a conocerte</Text>

            <Input
              label="Cuéntanos sobre ti"
              placeholder="Me gusta..."
              multiline
              numberOfLines={4}
              value={formData.bio}
              onChangeText={(v) => updateField('bio', v)}
              containerStyle={styles.bioInput}
            />
          </View>
        );

      default:
        return null;
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => (step > 1 ? setStep(step - 1) : router.back())}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>

        {/* Progress */}
        <View style={styles.progress}>
          {[1, 2, 3, 4].map((s) => (
            <View
              key={s}
              style={[
                styles.progressDot,
                s <= step && styles.progressDotActive,
                s === step && styles.progressDotCurrent,
              ]}
            />
          ))}
        </View>

        {/* Error */}
        {error && (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle" size={20} color={colors.error} />
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity onPress={clearError}>
              <Ionicons name="close" size={20} color={colors.error} />
            </TouchableOpacity>
          </View>
        )}

        {/* Step content */}
        {renderStep()}

        {/* Actions */}
        <View style={styles.actions}>
          {step < 4 ? (
            <Button
              title="Continuar"
              onPress={() => setStep(step + 1)}
              disabled={!canProceed()}
              fullWidth
              size="lg"
            />
          ) : (
            <Button
              title="Crear cuenta"
              onPress={handleRegister}
              loading={isLoading}
              fullWidth
              size="lg"
            />
          )}

          {step === 4 && (
            <Button
              title="Omitir bio"
              onPress={handleRegister}
              variant="ghost"
              fullWidth
              disabled={isLoading}
            />
          )}
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>¿Ya tienes cuenta?</Text>
          <TouchableOpacity onPress={() => router.replace('/(auth)/login')}>
            <Text style={styles.footerLink}>Inicia sesión</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Success Modal */}
      <Modal
        visible={showSuccessModal}
        onClose={handleSuccessModalClose}
        type="success"
        title="Cuenta creada"
        message={`Bienvenido a Linka, ${formData.name}! Tu cuenta ha sido creada exitosamente.`}
        buttonText="Empezar"
        onButtonPress={handleSuccessModalClose}
        dismissOnBackdrop={false}
      />

      {/* Error Modal */}
      <Modal
        visible={showErrorModal}
        onClose={handleErrorModalClose}
        type="error"
        title="Error al registrar"
        message={error || 'Ocurrió un error al crear tu cuenta. Por favor intenta de nuevo.'}
        buttonText="Entendido"
        onButtonPress={handleErrorModalClose}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: spacing.lg,
  },
  backButton: {
    marginTop: spacing.xxl,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.backgroundCard,
    justifyContent: 'center',
    alignItems: 'center',
  },
  progress: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.sm,
    marginTop: spacing.lg,
    marginBottom: spacing.xl,
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.backgroundCard,
  },
  progressDotActive: {
    backgroundColor: colors.primary,
  },
  progressDotCurrent: {
    width: 24,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderRadius: borderRadius.md,
    padding: spacing.md,
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  errorText: {
    flex: 1,
    color: colors.error,
    fontSize: fontSize.sm,
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    color: colors.text,
    fontSize: fontSize.xxl,
    fontWeight: fontWeight.bold,
    marginBottom: spacing.xs,
  },
  stepSubtitle: {
    color: colors.textSecondary,
    fontSize: fontSize.md,
    marginBottom: spacing.xl,
  },
  label: {
    color: colors.text,
    fontSize: fontSize.sm,
    marginBottom: spacing.sm,
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  optionButton: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.full,
    backgroundColor: colors.backgroundCard,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  optionSelected: {
    borderColor: colors.primary,
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
  },
  optionText: {
    color: colors.text,
    fontSize: fontSize.md,
  },
  optionTextSelected: {
    color: colors.primary,
    fontWeight: fontWeight.semibold,
  },
  bioInput: {
    marginBottom: 0,
  },
  actions: {
    marginTop: 'auto',
    gap: spacing.md,
    paddingVertical: spacing.lg,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.xs,
    paddingBottom: spacing.xxl,
  },
  footerText: {
    color: colors.textSecondary,
    fontSize: fontSize.md,
  },
  footerLink: {
    color: colors.primary,
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
  },
});
