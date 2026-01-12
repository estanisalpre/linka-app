import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal as RNModal,
  TouchableOpacity,
  TouchableWithoutFeedback,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, fontSize, fontWeight, shadows } from '../utils/theme';

export type ModalType = 'success' | 'error' | 'warning' | 'info';

interface ModalProps {
  visible: boolean;
  onClose: () => void;
  type?: ModalType;
  title: string;
  message: string;
  buttonText?: string;
  onButtonPress?: () => void;
  secondaryButtonText?: string;
  onSecondaryButtonPress?: () => void;
  showCloseButton?: boolean;
  dismissOnBackdrop?: boolean;
}

const typeConfig: Record<ModalType, { icon: keyof typeof Ionicons.glyphMap; color: string; bgColor: string }> = {
  success: {
    icon: 'checkmark-circle',
    color: colors.success,
    bgColor: 'rgba(34, 197, 94, 0.15)',
  },
  error: {
    icon: 'close-circle',
    color: colors.error,
    bgColor: 'rgba(239, 68, 68, 0.15)',
  },
  warning: {
    icon: 'warning',
    color: colors.warning,
    bgColor: 'rgba(245, 158, 11, 0.15)',
  },
  info: {
    icon: 'information-circle',
    color: colors.primary,
    bgColor: 'rgba(139, 92, 246, 0.15)',
  },
};

export function Modal({
  visible,
  onClose,
  type = 'info',
  title,
  message,
  buttonText = 'Aceptar',
  onButtonPress,
  secondaryButtonText,
  onSecondaryButtonPress,
  showCloseButton = true,
  dismissOnBackdrop = true,
}: ModalProps) {
  const config = typeConfig[type];

  const handleButtonPress = () => {
    if (onButtonPress) {
      onButtonPress();
    } else {
      onClose();
    }
  };

  const handleBackdropPress = () => {
    if (dismissOnBackdrop) {
      onClose();
    }
  };

  return (
    <RNModal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={handleBackdropPress}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <View style={styles.modalContainer}>
              {showCloseButton && (
                <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                  <Ionicons name="close" size={24} color={colors.textMuted} />
                </TouchableOpacity>
              )}

              <View style={[styles.iconContainer, { backgroundColor: config.bgColor }]}>
                <Ionicons name={config.icon} size={48} color={config.color} />
              </View>

              <Text style={styles.title}>{title}</Text>
              <Text style={styles.message}>{message}</Text>

              <View style={styles.buttonContainer}>
                {secondaryButtonText && (
                  <TouchableOpacity
                    style={styles.secondaryButton}
                    onPress={onSecondaryButtonPress || onClose}
                  >
                    <Text style={styles.secondaryButtonText}>{secondaryButtonText}</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  style={[
                    styles.primaryButton,
                    { backgroundColor: config.color },
                    secondaryButtonText && styles.buttonFlex,
                  ]}
                  onPress={handleButtonPress}
                >
                  <Text style={styles.primaryButtonText}>{buttonText}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </RNModal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  modalContainer: {
    backgroundColor: colors.backgroundCard,
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    width: '100%',
    maxWidth: 340,
    alignItems: 'center',
    ...shadows.lg,
  },
  closeButton: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.md,
    padding: spacing.xs,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  title: {
    color: colors.text,
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  message: {
    color: colors.textSecondary,
    fontSize: fontSize.md,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: spacing.xl,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: spacing.sm,
    width: '100%',
  },
  primaryButton: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: colors.text,
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
  },
  secondaryButton: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    backgroundColor: colors.backgroundLight,
    borderWidth: 1,
    borderColor: colors.border,
  },
  secondaryButtonText: {
    color: colors.textSecondary,
    fontSize: fontSize.md,
    fontWeight: fontWeight.medium,
  },
  buttonFlex: {
    flex: 1,
  },
});
