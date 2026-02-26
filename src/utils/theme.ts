export const colors = {
  // ─── Brand ───────────────────────────────────────────────
  // Aura Violet – identidad principal, núcleo en progreso
  primary: "#7B2CBF",
  primaryLight: "#9D4EDD",
  primaryDark: "#5A189A",

  // Mist Teal – balance, calma, elementos de apoyo
  secondary: "#6B9080",
  secondaryLight: "#88B2A0",
  secondaryDark: "#4E6B62",

  // ─── Accents ─────────────────────────────────────────────
  // Nuclia Gold – SOLO para momentos de logro (chat ganado, hito completado)
  gold: "#F4D35E",
  goldLight: "#F9E9A0",

  // Pulse Coral – CTAs principales, energía, acción
  accent: "#FF6B6B",
  accentLight: "#FF9E9E",
  accentDark: "#E04545",

  // ─── Backgrounds / Surfaces ──────────────────────────────
  // Deep Space – fondo base de toda la app
  background: "#0D1621",
  // Orbit Dark – nav bars, inputs deseleccionados
  backgroundLight: "#1A253A",
  // Surface – tarjetas, contenedores elevados
  backgroundCard: "#25334D",

  // ─── Typography ──────────────────────────────────────────
  // Parchment – títulos, nombres, texto principal
  text: "#FDF0D5",
  // Cloud Gray – subtítulos, descripciones
  textSecondary: "#CED4DA",
  // Shadow – placeholders, timestamps, estados desactivados
  textMuted: "#748DA6",

  // ─── Status ──────────────────────────────────────────────
  success: "#2DCE89",
  successLight: "#B8F5D8",
  warning: "#F5A623",
  warningLight: "#FDECC8",
  error: "#E63946",
  errorLight: "#FADADD",

  // ─── Gradients (referencias para LinearGradient) ─────────
  // Usar: [colors.gradientStart, colors.gradientEnd]
  gradientStart: "#7B2CBF", // Aura Violet
  gradientEnd: "#6B9080", // Mist Teal
  gradientGold: "#F4D35E", // Nuclia Gold (para núcleo completado)

  // ─── Temperature (nucleus heat) ──────────────────────────
  cold: "#748DA6",
  cool: "#6B9080",
  warm: "#FF6B6B",
  hot: "#E63946",

  // ─── UI Misc ─────────────────────────────────────────────
  border: "#2E3E58",
  borderActive: "#7B2CBF",
  overlay: "rgba(13, 22, 33, 0.75)",
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

// ─── Font Families ───────────────────────────────────────────────────────────
// Usar con fontFamily en StyleSheet
export const fontFamily = {
  // Inter – UI, cuerpo de texto, botones, etiquetas
  body: "Inter_400Regular",
  bodyMedium: "Inter_500Medium",
  bodySemibold: "Inter_600SemiBold",
  bodyBold: "Inter_700Bold",

  // Cormorant Garamond – títulos de marca, pantallas principales
  title: "CormorantGaramond_500Medium",
  titleBold: "CormorantGaramond_700Bold",
};

// ─── Typography presets ───────────────────────────────────────────────────────
// Listo para usar con spread: <Text style={typography.h1}>
export const typography = {
  // H1: Título de pantalla – Cormorant Garamond Medium, Parchment
  h1: {
    fontFamily: "CormorantGaramond_500Medium",
    fontSize: 32,
    color: "#FDF0D5",
    letterSpacing: 0.2,
  },
  // H2: Título de tarjeta/sección – Inter SemiBold
  h2: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 18,
    color: "#FDF0D5",
    letterSpacing: 0,
  },
  // H3: Subtítulo – Inter SemiBold
  h3: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 15,
    color: "#FDF0D5",
  },
  // Body: Texto principal – Inter Regular, Cloud Gray
  body: {
    fontFamily: "Inter_400Regular",
    fontSize: 15,
    color: "#CED4DA",
    lineHeight: 22,
  },
  // BodySmall: Descripciones, timestamps
  bodySmall: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    color: "#CED4DA",
  },
  // Label: Etiquetas de botón, navegación – Inter Medium
  label: {
    fontFamily: "Inter_500Medium",
    fontSize: 14,
    color: "#FDF0D5",
    letterSpacing: 0.5,
  },
  // Caption: Placeholders, muted – Inter Regular
  caption: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    color: "#748DA6",
  },
} as const;

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
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 2,
  },
  md: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 4,
    elevation: 4,
  },
  lg: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
  violet: {
    shadowColor: "#7B2CBF",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 8,
  },
};

// ─── Gradient presets (para usar con LinearGradient) ─────────────────────────
export const gradients = {
  // Degradado de conexión – núcleo en progreso
  connection: ["#7B2CBF", "#6B9080"] as [string, string],
  // Degradado de logro – chat ganado / núcleo completo
  achievement: ["#F4D35E", "#FF6B6B"] as [string, string],
  // Fondo de pantalla principal
  background: ["#0D1621", "#1A253A"] as [string, string],
  // CTA button
  cta: ["#FF6B6B", "#E04545"] as [string, string],
};
