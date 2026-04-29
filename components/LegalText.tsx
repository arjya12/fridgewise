import React from "react";
import { Linking, StyleSheet, Text, TextProps, TouchableOpacity } from "react-native";

export function MutedText({ children }: { children: React.ReactNode }) {
  return <Text style={styles.muted}>{children}</Text>;
}

export function BodyText({ children }: { children: React.ReactNode }) {
  return <Text style={styles.body}>{children}</Text>;
}

export function SectionTitle({ children }: { children: React.ReactNode }) {
  return <Text style={styles.sectionTitle}>{children}</Text>;
}

export function Bullet({ children }: { children: React.ReactNode }) {
  return (
    <Text style={styles.bulletLine}>
      <Text style={styles.bulletDot}>• </Text>
      {children}
    </Text>
  );
}

export function LinkText({
  href,
  children,
  accessibilityLabel,
}: {
  href: string;
  children: React.ReactNode;
  accessibilityLabel?: string;
}) {
  return (
    <TouchableOpacity
      activeOpacity={0.75}
      accessibilityRole="link"
      accessibilityLabel={accessibilityLabel}
      onPress={() => void Linking.openURL(href)}
    >
      <Text style={styles.link}>{children}</Text>
    </TouchableOpacity>
  );
}

export function InlineLink({
  href,
  children,
  accessibilityLabel,
  style,
}: {
  href: string;
  children: React.ReactNode;
  accessibilityLabel?: string;
  style?: TextProps["style"];
}) {
  return (
    <Text
      accessibilityRole="link"
      accessibilityLabel={accessibilityLabel}
      onPress={() => void Linking.openURL(href)}
      style={[styles.link, style]}
    >
      {children}
    </Text>
  );
}

const THEME_GREEN = "#15803D";

const styles = StyleSheet.create({
  muted: {
    color: "#6B7280",
    fontSize: 16,
    lineHeight: 24,
    fontFamily: "PlusJakartaSans_600SemiBold",
    fontWeight: "600",
  },
  body: {
    color: "#334155",
    fontSize: 16,
    lineHeight: 24,
    fontFamily: "PlusJakartaSans_500Medium",
    fontWeight: "500",
  },
  sectionTitle: {
    color: "#0F172A",
    fontSize: 20,
    lineHeight: 26,
    letterSpacing: -0.35,
    fontFamily: "PlusJakartaSans_700Bold",
    fontWeight: "800",
  },
  bulletLine: {
    color: "#334155",
    fontSize: 16,
    lineHeight: 24,
    fontFamily: "PlusJakartaSans_500Medium",
    fontWeight: "500",
    marginTop: 4,
    marginLeft: 24,
  },
  bulletDot: {
    color: "#111827",
  },
  link: {
    color: THEME_GREEN,
    textDecorationLine: "underline",
    textDecorationColor: THEME_GREEN,
    textDecorationStyle: "solid",
    fontFamily: "PlusJakartaSans_700Bold",
    fontWeight: "700",
  },
});

