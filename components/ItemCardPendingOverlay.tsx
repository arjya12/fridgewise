import React from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";

/** Consume / used / positive actions */
export const ITEM_CARD_PENDING_SPINNER_GREEN = "#15803D";
/** Waste / delete / destructive actions */
export const ITEM_CARD_PENDING_SPINNER_RED = "#DC2626";

export type ItemCardPendingTone = "green" | "red";

export function itemCardPendingSpinnerColor(tone: ItemCardPendingTone): string {
  return tone === "red"
    ? ITEM_CARD_PENDING_SPINNER_RED
    : ITEM_CARD_PENDING_SPINNER_GREEN;
}

type Props = {
  /** When true, covers parent (use parent with position: "relative" and overflow: "hidden") */
  visible: boolean;
  /** Spinner color; overrides `tone` if both set. */
  color?: string;
  /** Shorthand: green = consume/used, red = waste/delete */
  tone?: ItemCardPendingTone;
};

/**
 * Semi-transparent overlay + spinner for item rows/cards while an async mutation runs.
 */
export function ItemCardPendingOverlay({
  visible,
  color,
  tone = "green",
}: Props) {
  const spinnerColor =
    color ?? itemCardPendingSpinnerColor(tone);
  if (!visible) return null;
  return (
    <View style={styles.overlay} pointerEvents="auto">
      <ActivityIndicator size="small" color={spinnerColor} />
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
