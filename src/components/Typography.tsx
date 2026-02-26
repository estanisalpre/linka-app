/**
 * Typography components for Nuclia
 *
 * Heading  → Cormorant Garamond Medium 500  (1 por pantalla, títulos de marca)
 * HeadingBold → Cormorant Garamond Bold 700 (énfasis dramático en onboarding)
 * Title    → Inter SemiBold 600             (títulos de tarjeta/sección)
 * Subtitle → Inter Medium 500               (subtítulos, labels de navegación)
 * Body     → Inter Regular 400              (cuerpo de texto, descripciones)
 * Caption  → Inter Regular 400, pequeño    (timestamps, placeholders, muted)
 * Label    → Inter Medium 500, letter-spacing (botones, etiquetas)
 */

import React from "react";
import { Text, TextProps, StyleSheet } from "react-native";
import { colors } from "../utils/theme";

interface TypographyProps extends TextProps {
  children: React.ReactNode;
  color?: string;
}

export const Heading = ({ style, color, ...props }: TypographyProps) => (
  <Text
    {...props}
    style={[styles.heading, color ? { color } : undefined, style]}
  />
);

export const HeadingBold = ({ style, color, ...props }: TypographyProps) => (
  <Text
    {...props}
    style={[styles.headingBold, color ? { color } : undefined, style]}
  />
);

export const Title = ({ style, color, ...props }: TypographyProps) => (
  <Text
    {...props}
    style={[styles.title, color ? { color } : undefined, style]}
  />
);

export const Subtitle = ({ style, color, ...props }: TypographyProps) => (
  <Text
    {...props}
    style={[styles.subtitle, color ? { color } : undefined, style]}
  />
);

export const Body = ({ style, color, ...props }: TypographyProps) => (
  <Text
    {...props}
    style={[styles.body, color ? { color } : undefined, style]}
  />
);

export const Caption = ({ style, color, ...props }: TypographyProps) => (
  <Text
    {...props}
    style={[styles.caption, color ? { color } : undefined, style]}
  />
);

export const Label = ({ style, color, ...props }: TypographyProps) => (
  <Text
    {...props}
    style={[styles.label, color ? { color } : undefined, style]}
  />
);

const styles = StyleSheet.create({
  heading: {
    fontFamily: "CormorantGaramond_500Medium",
    fontSize: 32,
    color: colors.text,
    letterSpacing: 0.2,
    lineHeight: 40,
  },
  headingBold: {
    fontFamily: "CormorantGaramond_700Bold",
    fontSize: 36,
    color: colors.text,
    letterSpacing: 0.2,
    lineHeight: 44,
  },
  title: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 18,
    color: colors.text,
  },
  subtitle: {
    fontFamily: "Inter_500Medium",
    fontSize: 15,
    color: colors.textSecondary,
  },
  body: {
    fontFamily: "Inter_400Regular",
    fontSize: 15,
    color: colors.textSecondary,
    lineHeight: 22,
  },
  caption: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    color: colors.textMuted,
    lineHeight: 16,
  },
  label: {
    fontFamily: "Inter_500Medium",
    fontSize: 14,
    color: colors.text,
    letterSpacing: 0.5,
  },
});
