import type { TextStyle } from "react-native";

/**
 * Reference tokens for main screen titles (tab / stack headers).
 * Many screens still use local styles — align new work and refactors to these.
 *
 * Visual QA: compare Settings, More, Menu, Profile, Reports, Groceries, Home hero.
 */
export const screenTitleLarge: TextStyle = {
  fontSize: 24,
  fontWeight: "700",
  letterSpacing: -0.3,
};

export const screenTitleMedium: TextStyle = {
  fontSize: 22,
  fontWeight: "700",
  letterSpacing: -0.2,
};

export const screenSectionTitle: TextStyle = {
  fontSize: 17,
  fontWeight: "600",
};
