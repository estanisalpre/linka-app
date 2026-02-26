import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { INTEREST_CATEGORIES, randomIcon } from "../utils/interests";
import {
  colors,
  fontSize,
  fontWeight,
  spacing,
  borderRadius,
} from "../utils/theme";

const MIN_INTERESTS = 5;
const MAX_INTERESTS = 10;

interface InterestsPickerProps {
  selected: string[];
  onChange: (interests: string[]) => void;
}

export function InterestsPicker({ selected, onChange }: InterestsPickerProps) {
  const [customText, setCustomText] = useState("");
  const [customIcons, setCustomIcons] = useState<Record<string, string>>({});

  const toggle = (value: string) => {
    if (selected.includes(value)) {
      onChange(selected.filter((v) => v !== value));
    } else if (selected.length < MAX_INTERESTS) {
      onChange([...selected, value]);
    }
  };

  const addCustom = () => {
    const trimmed = customText.trim();
    if (!trimmed || selected.length >= MAX_INTERESTS) return;
    const key = `custom_${trimmed.toLowerCase().replace(/\s+/g, "_")}`;
    if (selected.includes(key)) return;
    const icon = randomIcon();
    setCustomIcons((prev) => ({ ...prev, [key]: icon }));
    onChange([...selected, key]);
    setCustomText("");
  };

  const atMax = selected.length >= MAX_INTERESTS;

  return (
    <View style={styles.container}>
      {/* Counter bar */}
      <View style={styles.counterBar}>
        <Text style={styles.counterText}>
          {selected.length < MIN_INTERESTS
            ? `Elige al menos ${MIN_INTERESTS} (${selected.length}/${MAX_INTERESTS})`
            : `${selected.length}/${MAX_INTERESTS} seleccionados`}
        </Text>
        {atMax && <Text style={styles.maxReached}>Máximo alcanzado</Text>}
      </View>

      {/* All categories, stacked vertically */}
      {INTEREST_CATEGORIES.map((cat) => (
        <View key={cat.title} style={styles.categoryBlock}>
          {/* Category header */}
          <View style={styles.categoryHeader}>
            <Text style={styles.categoryEmoji}>{cat.emoji}</Text>
            <Text style={styles.categoryTitle}>{cat.title}</Text>
          </View>

          {/* Chips */}
          <View style={styles.chipsWrap}>
            {cat.items.map((item) => {
              const isSel = selected.includes(item.value);
              const disabled = !isSel && atMax;
              return (
                <TouchableOpacity
                  key={item.value}
                  style={[
                    styles.chip,
                    isSel && styles.chipSelected,
                    disabled && styles.chipDisabled,
                  ]}
                  onPress={() => toggle(item.value)}
                  activeOpacity={0.8}
                  disabled={disabled}
                >
                  <Ionicons
                    name={item.icon as any}
                    size={15}
                    color={
                      isSel
                        ? colors.primary
                        : disabled
                          ? colors.textMuted
                          : colors.textSecondary
                    }
                  />
                  <Text
                    style={[
                      styles.chipLabel,
                      isSel && styles.chipLabelSelected,
                      disabled && styles.chipLabelDisabled,
                    ]}
                  >
                    {item.label}
                  </Text>
                  {isSel && (
                    <Ionicons
                      name="checkmark"
                      size={12}
                      color={colors.primary}
                    />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      ))}

      {/* Custom input */}
      <View style={styles.customBlock}>
        <View style={styles.categoryHeader}>
          <Text style={styles.categoryEmoji}>✏️</Text>
          <Text style={styles.categoryTitle}>Agrega el tuyo</Text>
        </View>
        <View style={styles.customRow}>
          <TextInput
            style={styles.customInput}
            placeholder={atMax ? "Máximo alcanzado" : "Escribe un interés..."}
            placeholderTextColor={colors.textMuted}
            value={customText}
            onChangeText={setCustomText}
            onSubmitEditing={addCustom}
            returnKeyType="done"
            editable={!atMax}
          />
          <TouchableOpacity
            style={[
              styles.addBtn,
              (atMax || !customText.trim()) && styles.addBtnDisabled,
            ]}
            onPress={addCustom}
            disabled={atMax || !customText.trim()}
          >
            <Ionicons name="add" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Selected chips */}
      {selected.length > 0 && (
        <View style={styles.selectedSection}>
          <View style={styles.selectedHeader}>
            <Ionicons
              name="checkmark-circle"
              size={16}
              color={colors.success}
            />
            <Text style={styles.selectedLabel}>
              Seleccionados · {selected.length}/{MAX_INTERESTS}
            </Text>
          </View>
          <View style={styles.selectedChips}>
            {selected.map((val) => {
              const known = INTEREST_CATEGORIES.flatMap((c) => c.items).find(
                (i) => i.value === val,
              );
              const label =
                known?.label ?? val.replace("custom_", "").replace(/_/g, " ");
              const icon = known?.icon ?? customIcons[val] ?? "star";
              return (
                <TouchableOpacity
                  key={val}
                  style={styles.selectedChip}
                  onPress={() => toggle(val)}
                  activeOpacity={0.8}
                >
                  <Ionicons
                    name={icon as any}
                    size={13}
                    color={colors.primary}
                  />
                  <Text style={styles.selectedChipText}>{label}</Text>
                  <Ionicons name="close" size={13} color={colors.textMuted} />
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.lg,
  },
  counterBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.backgroundCard,
    borderWidth: 1,
    borderColor: colors.border,
  },
  counterText: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
  },
  maxReached: {
    color: colors.warning,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
  },
  categoryBlock: {
    gap: spacing.sm,
  },
  categoryHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    paddingBottom: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  categoryEmoji: {
    fontSize: 16,
  },
  categoryTitle: {
    color: colors.text,
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
  },
  chipsWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    backgroundColor: colors.backgroundLight,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + "20",
  },
  chipDisabled: {
    opacity: 0.35,
  },
  chipLabel: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
  },
  chipLabelSelected: {
    color: colors.primary,
    fontWeight: fontWeight.medium,
  },
  chipLabelDisabled: {
    color: colors.textMuted,
  },
  customBlock: {
    gap: spacing.sm,
  },
  customRow: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  customInput: {
    flex: 1,
    backgroundColor: colors.backgroundCard,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    color: colors.text,
    fontSize: fontSize.sm,
  },
  addBtn: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.md,
    backgroundColor: colors.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  addBtnDisabled: {
    opacity: 0.4,
  },
  selectedSection: {
    gap: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  selectedHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  selectedLabel: {
    color: colors.success,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
  },
  selectedChips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xs,
  },
  selectedChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: colors.primary + "20",
    borderWidth: 1,
    borderColor: colors.primary + "50",
  },
  selectedChipText: {
    color: colors.primary,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
  },
});
