import type { TextStyle, ViewStyle } from "react-native";

/**
 * Shared modal action styles so Cancel / secondary actions match across the app.
 */

/** Gray pill Cancel below stacked option cards (remove item, delete log, calendar). */
export const modalStackedCancelContainer: ViewStyle = {
  marginTop: 6,
  borderRadius: 999,
  backgroundColor: "#E5E7EB",
  alignItems: "center",
  justifyContent: "center",
  paddingVertical: 9,
  alignSelf: "center",
  paddingHorizontal: 32,
};

export const modalStackedCancelLabel: TextStyle = {
  fontSize: 14,
  fontWeight: "500",
  color: "#111827",
};

/**
 * Horizontal row: secondary (Cancel) + primary — matches ConfirmModal proportions.
 * Use flex: 1 on both buttons inside a row with gap ~10.
 */
export const modalRowSecondaryContainer: ViewStyle = {
  flex: 1,
  paddingVertical: 9,
  paddingHorizontal: 18,
  borderRadius: 999,
  backgroundColor: "#F1F5F9",
  alignItems: "center",
  justifyContent: "center",
};

export const modalRowSecondaryLabel: TextStyle = {
  fontSize: 14,
  fontWeight: "500",
  color: "#64748B",
  textAlign: "center",
};

export const modalRowPrimaryContainer: ViewStyle = {
  flex: 1,
  paddingVertical: 9,
  paddingHorizontal: 18,
  borderRadius: 999,
  alignItems: "center",
  justifyContent: "center",
};

export const modalRowPrimaryLabel: TextStyle = {
  fontSize: 14,
  fontWeight: "500",
  color: "#FFFFFF",
  textAlign: "center",
};
