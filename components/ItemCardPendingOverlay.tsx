import React from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";

type Props = {
  /** When true, covers parent (use parent with position: "relative" and overflow: "hidden") */
  visible: boolean;
  color?: string;
};

/**
 * Semi-transparent overlay + spinner for item rows/cards while an async mutation runs.
 */
export function ItemCardPendingOverlay({ visible, color = "#15803D" }: Props) {
  if (!visible) return null;
  return (
    <View style={styles.overlay} pointerEvents="auto">
      <ActivityIndicator size="small" color={color} />
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 14,
    backgroundColor: "rgba(255, 255, 255, 0.78)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 20,
  },
});
