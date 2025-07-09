// ColorSchemeProvider - Centralized color scheme management for calendar
// Provides consistent color mapping with accessibility support

import React, { createContext, useContext, useMemo } from "react";
import { useColorScheme } from "react-native";
import { useThemeColor } from "../../hooks/useThemeColor";
import {
  CalendarColorScheme,
  ColorSchemeProviderProps,
  PatternDefinition,
} from "../../types/calendar-enhanced";
import {
  DEFAULT_COLOR_SCHEME,
  getColorScheme,
} from "../../utils/calendarEnhancedDataUtils";

// =============================================================================
// CONTEXT DEFINITION
// =============================================================================

interface ColorSchemeContextValue {
  colorScheme: CalendarColorScheme;
  isHighContrast: boolean;
  patterns: PatternDefinition[];
  updateColorScheme: (scheme: Partial<CalendarColorScheme>) => void;
  toggleHighContrast: () => void;
  togglePatterns: () => void;
}

const ColorSchemeContext = createContext<ColorSchemeContextValue | undefined>(
  undefined
);

// =============================================================================
// PATTERN DEFINITIONS
// =============================================================================

const DEFAULT_PATTERNS: PatternDefinition[] = [
  {
    name: "expired-striped",
    type: "striped",
    density: 0.7,
    angle: 45,
    spacing: 3,
  },
  {
    name: "today-dotted",
    type: "dotted",
    density: 0.5,
    spacing: 2,
  },
  {
    name: "future-solid",
    type: "solid",
    density: 1.0,
  },
  {
    name: "warning-crosshatch",
    type: "crosshatch",
    density: 0.6,
    angle: 45,
    spacing: 4,
  },
];

// =============================================================================
// PROVIDER COMPONENT
// =============================================================================

const ColorSchemeProvider: React.FC<ColorSchemeProviderProps> = ({
  children,
  scheme,
  accessibilityMode = false,
  highContrastMode = false,
  customPatterns = [],
}) => {
  const systemColorScheme = useColorScheme();
  const isDarkMode = systemColorScheme === "dark";

  // Get theme colors for integration with app theme
  const primaryColor = useThemeColor(
    { light: "#0a7ea4", dark: "#0a7ea4" },
    "tint"
  );
  const backgroundColor = useThemeColor(
    { light: "#f8f9fa", dark: "#1c1c1e" },
    "background"
  );
  const textColor = useThemeColor({ light: "#000", dark: "#fff" }, "text");

  // Memoize the color scheme to avoid unnecessary recalculations
  const colorScheme = useMemo(() => {
    let baseScheme = scheme || DEFAULT_COLOR_SCHEME;

    // Apply accessibility mode if enabled
    if (accessibilityMode || highContrastMode) {
      baseScheme = getColorScheme(true, scheme);
    }

    // Integrate with app theme
    const themeIntegratedScheme: CalendarColorScheme = {
      ...baseScheme,
      expired: {
        ...baseScheme.expired,
        // Ensure contrast in dark mode
        primary: isDarkMode ? "#F87171" : baseScheme.expired.primary,
        secondary: isDarkMode ? "#7F1D1D" : baseScheme.expired.secondary,
      },
      today: {
        ...baseScheme.today,
        primary: isDarkMode ? "#FB923C" : baseScheme.today.primary,
        secondary: isDarkMode ? "#9A3412" : baseScheme.today.secondary,
      },
      future: {
        ...baseScheme.future,
        primary: isDarkMode ? "#4ADE80" : baseScheme.future.primary,
        secondary: isDarkMode ? "#166534" : baseScheme.future.secondary,
      },
      accessibility: {
        ...baseScheme.accessibility,
        highContrast: accessibilityMode || highContrastMode,
      },
    };

    return themeIntegratedScheme;
  }, [scheme, accessibilityMode, highContrastMode, isDarkMode]);

  // Combine default and custom patterns
  const patterns = useMemo(() => {
    return [...DEFAULT_PATTERNS, ...customPatterns];
  }, [customPatterns]);

  // State management functions
  const updateColorScheme = useMemo(
    () => (newScheme: Partial<CalendarColorScheme>) => {
      // This would typically update a global state or context
      // For now, we'll just log the update
      console.log("Color scheme update requested:", newScheme);
    },
    []
  );

  const toggleHighContrast = useMemo(
    () => () => {
      // This would typically toggle a global accessibility setting
      console.log("High contrast toggle requested");
    },
    []
  );

  const togglePatterns = useMemo(
    () => () => {
      // This would typically toggle pattern visibility
      console.log("Pattern visibility toggle requested");
    },
    []
  );

  const contextValue: ColorSchemeContextValue = useMemo(
    () => ({
      colorScheme,
      isHighContrast: colorScheme.accessibility.highContrast,
      patterns,
      updateColorScheme,
      toggleHighContrast,
      togglePatterns,
    }),
    [
      colorScheme,
      patterns,
      updateColorScheme,
      toggleHighContrast,
      togglePatterns,
    ]
  );

  return (
    <ColorSchemeContext.Provider value={contextValue}>
      {children}
    </ColorSchemeContext.Provider>
  );
};

// =============================================================================
// HOOK FOR CONSUMING COLOR SCHEME
// =============================================================================

export function useCalendarColorScheme(): ColorSchemeContextValue {
  const context = useContext(ColorSchemeContext);
  if (context === undefined) {
    throw new Error(
      "useCalendarColorScheme must be used within a ColorSchemeProvider"
    );
  }
  return context;
}

// =============================================================================
// UTILITY HOOKS
// =============================================================================

/**
 * Hook to get colors for a specific expiry status
 */
export function useExpiryColors(status: "expired" | "today" | "future") {
  const { colorScheme } = useCalendarColorScheme();

  return useMemo(() => {
    switch (status) {
      case "expired":
        return {
          primary: colorScheme.expired.primary,
          secondary: colorScheme.expired.secondary,
          pattern: colorScheme.expired.pattern,
        };
      case "today":
        return {
          primary: colorScheme.today.primary,
          secondary: colorScheme.today.secondary,
          pattern: colorScheme.today.pattern,
        };
      case "future":
        return {
          primary: colorScheme.future.primary,
          secondary: colorScheme.future.secondary,
          pattern: colorScheme.future.pattern,
        };
      default:
        return {
          primary: colorScheme.future.primary,
          secondary: colorScheme.future.secondary,
          pattern: colorScheme.future.pattern,
        };
    }
  }, [colorScheme, status]);
}

/**
 * Hook to get pattern definition by name
 */
export function usePattern(patternName: string): PatternDefinition | undefined {
  const { patterns } = useCalendarColorScheme();

  return useMemo(() => {
    return patterns.find((pattern) => pattern.name === patternName);
  }, [patterns, patternName]);
}

/**
 * Hook to check if accessibility features are enabled
 */
export function useAccessibilityFeatures() {
  const { colorScheme, isHighContrast } = useCalendarColorScheme();

  return useMemo(
    () => ({
      highContrast: isHighContrast,
      patterns: colorScheme.accessibility.patterns,
      textAlternatives: colorScheme.accessibility.textAlternatives,
      reducedMotion: false, // This would come from system settings
    }),
    [colorScheme, isHighContrast]
  );
}

// =============================================================================
// COLOR GENERATION UTILITIES
// =============================================================================

/**
 * Generate a color with specified opacity
 */
export function withOpacity(color: string, opacity: number): string {
  // Handle hex colors
  if (color.startsWith("#")) {
    const hex = color.slice(1);
    const r = parseInt(hex.slice(0, 2), 16);
    const g = parseInt(hex.slice(2, 4), 16);
    const b = parseInt(hex.slice(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
  }

  // Handle rgba colors
  if (color.startsWith("rgba")) {
    return color.replace(/[\d.]+\)$/g, `${opacity})`);
  }

  // Handle rgb colors
  if (color.startsWith("rgb")) {
    return color.replace("rgb", "rgba").replace(")", `, ${opacity})`);
  }

  // Fallback
  return color;
}

/**
 * Lighten a color by a specified amount
 */
export function lightenColor(color: string, amount: number): string {
  if (!color.startsWith("#")) return color;

  const hex = color.slice(1);
  const r = Math.min(255, parseInt(hex.slice(0, 2), 16) + amount);
  const g = Math.min(255, parseInt(hex.slice(2, 4), 16) + amount);
  const b = Math.min(255, parseInt(hex.slice(4, 6), 16) + amount);

  return `#${r.toString(16).padStart(2, "0")}${g
    .toString(16)
    .padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
}

/**
 * Darken a color by a specified amount
 */
export function darkenColor(color: string, amount: number): string {
  if (!color.startsWith("#")) return color;

  const hex = color.slice(1);
  const r = Math.max(0, parseInt(hex.slice(0, 2), 16) - amount);
  const g = Math.max(0, parseInt(hex.slice(2, 4), 16) - amount);
  const b = Math.max(0, parseInt(hex.slice(4, 6), 16) - amount);

  return `#${r.toString(16).padStart(2, "0")}${g
    .toString(16)
    .padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
}

// =============================================================================
// EXPORT
// =============================================================================

ColorSchemeProvider.displayName = "ColorSchemeProvider";

export default ColorSchemeProvider;
