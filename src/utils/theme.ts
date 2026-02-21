export const colors = {
  // Primary - Purple gradient vibes
  primary: "#8B5CF6",
  primaryLight: "#A78BFA",
  primaryDark: "#7C3AED",

  // Secondary - Warm coral
  secondary: "#F472B6",
  secondaryLight: "#F9A8D4",

  // Accent - Teal
  accent: "#2DD4BF",
  accentLight: "#5EEAD4",

  // Backgrounds
  background: "#0F0F1A",
  backgroundLight: "#1A1A2E",
  backgroundCard: "#252540",

  // Text
  text: "#FFFFFF",
  textSecondary: "#A1A1AA",
  textMuted: "#71717A",

  // Status colors
  success: "#22C55E",
  successLight: "#D1FAE5",
  warning: "#F59E0B",
  error: "#EF4444",
  errorLight: "#FEE2E2",

  // Progress/Temperature
  cold: "#60A5FA",
  cool: "#818CF8",
  warm: "#F472B6",
  hot: "#EF4444",

  // Misc
  border: "#3F3F5A",
  overlay: "rgba(0, 0, 0, 0.5)",
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  xxxl: 64,
};

export const borderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
};

export const fontSize = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 18,
  xl: 20,
  xxl: 24,
  xxxl: 32,
};

export const fontWeight = {
  normal: "400" as const,
  medium: "500" as const,
  semibold: "600" as const,
  bold: "700" as const,
};

export const shadows = {
  sm: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  md: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
  lg: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
};
