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
import Slider from '@react-native-community/slider';
import { useAuthStore } from '../../src/store/auth.store';
import { colors, fontSize, fontWeight, spacing, borderRadius } from '../../src/utils/theme';

export default function PreferencesScreen() {
  const { user } = useAuthStore();

  // Preferencias de busqueda
  const [ageRange, setAgeRange] = useState({ min: 18, max: 35 });
  const [maxDistance, setMaxDistance] = useState(50);
  const [showMe, setShowMe] = useState(true);

  // Preferencias de genero
  const [interestedIn, setInterestedIn] = useState<string[]>(
    user?.interestedIn || ['FEMALE']
  );

  const toggleGender = (gender: string) => {
    if (interestedIn.includes(gender)) {
      if (interestedIn.length > 1) {
        setInterestedIn(interestedIn.filter(g => g !== gender));
      }
    } else {
      setInterestedIn([...interestedIn, gender]);
    }
  };

  const genderOptions = [
    { value: 'MALE', label: 'Hombres', icon: 'male' },
    { value: 'FEMALE', label: 'Mujeres', icon: 'female' },
    { value: 'NON_BINARY', label: 'No binario', icon: 'transgender' },
  ];

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
        <Text style={styles.headerTitle}>Preferencias</Text>
        <TouchableOpacity style={styles.saveButton}>
          <Text style={styles.saveText}>Guardar</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Mostrarme a */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Me interesa conocer</Text>
          <View style={styles.genderOptions}>
            {genderOptions.map((option) => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.genderOption,
                  interestedIn.includes(option.value) && styles.genderOptionActive,
                ]}
                onPress={() => toggleGender(option.value)}
              >
                <Ionicons
                  name={option.icon as any}
                  size={24}
                  color={interestedIn.includes(option.value) ? colors.text : colors.textMuted}
                />
                <Text
                  style={[
                    styles.genderLabel,
                    interestedIn.includes(option.value) && styles.genderLabelActive,
                  ]}
                >
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Rango de edad */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Rango de edad</Text>
            <Text style={styles.sectionValue}>{ageRange.min} - {ageRange.max} años</Text>
          </View>

          <View style={styles.sliderContainer}>
            <Text style={styles.sliderLabel}>Minimo: {ageRange.min}</Text>
            <Slider
              style={styles.slider}
              minimumValue={18}
              maximumValue={ageRange.max - 1}
              step={1}
              value={ageRange.min}
              onValueChange={(value) => setAgeRange({ ...ageRange, min: value })}
              minimumTrackTintColor={colors.primary}
              maximumTrackTintColor={colors.border}
              thumbTintColor={colors.primary}
            />
          </View>

          <View style={styles.sliderContainer}>
            <Text style={styles.sliderLabel}>Maximo: {ageRange.max}</Text>
            <Slider
              style={styles.slider}
              minimumValue={ageRange.min + 1}
              maximumValue={80}
              step={1}
              value={ageRange.max}
              onValueChange={(value) => setAgeRange({ ...ageRange, max: value })}
              minimumTrackTintColor={colors.primary}
              maximumTrackTintColor={colors.border}
              thumbTintColor={colors.primary}
            />
          </View>
        </View>

        {/* Distancia maxima */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Distancia maxima</Text>
            <Text style={styles.sectionValue}>{maxDistance} km</Text>
          </View>

          <Slider
            style={styles.slider}
            minimumValue={1}
            maximumValue={100}
            step={1}
            value={maxDistance}
            onValueChange={setMaxDistance}
            minimumTrackTintColor={colors.primary}
            maximumTrackTintColor={colors.border}
            thumbTintColor={colors.primary}
          />

          <View style={styles.sliderLabels}>
            <Text style={styles.sliderEndLabel}>1 km</Text>
            <Text style={styles.sliderEndLabel}>100 km</Text>
          </View>
        </View>

        {/* Visibilidad */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Visibilidad</Text>

          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Mostrar mi perfil</Text>
              <Text style={styles.settingDescription}>
                Si desactivas esto, no apareceras en el descubrimiento de otros usuarios
              </Text>
            </View>
            <Switch
              value={showMe}
              onValueChange={setShowMe}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor={colors.text}
            />
          </View>
        </View>

        {/* Cuenta */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Cuenta</Text>

          <TouchableOpacity style={styles.menuItem}>
            <Ionicons name="mail-outline" size={22} color={colors.textSecondary} />
            <View style={styles.menuItemContent}>
              <Text style={styles.menuItemLabel}>Cambiar email</Text>
              <Text style={styles.menuItemValue}>{user?.email}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem}>
            <Ionicons name="lock-closed-outline" size={22} color={colors.textSecondary} />
            <View style={styles.menuItemContent}>
              <Text style={styles.menuItemLabel}>Cambiar contraseña</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
          </TouchableOpacity>

          <TouchableOpacity style={[styles.menuItem, styles.dangerItem]}>
            <Ionicons name="trash-outline" size={22} color={colors.error} />
            <View style={styles.menuItemContent}>
              <Text style={[styles.menuItemLabel, styles.dangerText]}>Eliminar cuenta</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.error} />
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
  saveButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  saveText: {
    color: colors.primary,
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
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
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    marginBottom: spacing.sm,
  },
  sectionValue: {
    color: colors.primary,
    fontSize: fontSize.md,
    fontWeight: fontWeight.medium,
  },
  genderOptions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  genderOption: {
    flex: 1,
    alignItems: 'center',
    padding: spacing.md,
    backgroundColor: colors.backgroundCard,
    borderRadius: borderRadius.md,
    borderWidth: 2,
    borderColor: colors.border,
  },
  genderOptionActive: {
    borderColor: colors.primary,
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
  },
  genderLabel: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
    marginTop: spacing.xs,
  },
  genderLabelActive: {
    color: colors.text,
    fontWeight: fontWeight.medium,
  },
  sliderContainer: {
    marginBottom: spacing.md,
  },
  sliderLabel: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
    marginBottom: spacing.xs,
  },
  slider: {
    width: '100%',
    height: 40,
  },
  sliderLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  sliderEndLabel: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.backgroundCard,
    padding: spacing.md,
    borderRadius: borderRadius.md,
  },
  settingInfo: {
    flex: 1,
    marginRight: spacing.md,
  },
  settingLabel: {
    color: colors.text,
    fontSize: fontSize.md,
    marginBottom: spacing.xs,
  },
  settingDescription: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.backgroundCard,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.sm,
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
  dangerItem: {
    marginTop: spacing.md,
  },
  dangerText: {
    color: colors.error,
  },
});
