// Accessibility Utilities - Phase 2 Implementation
// Comprehensive WCAG 2.1 AA compliance utilities for React Native

import * as Haptics from "expo-haptics";
import { useCallback, useEffect, useState } from "react";
import { AccessibilityInfo, Platform } from "react-native";

// =============================================================================
// ACCESSIBILITY ANNOUNCEMENT SYSTEM
// =============================================================================

export interface AnnouncementOptions {
  priority?: "low" | "high";
  delay?: number;
  interrupt?: boolean;
}

export function announceForAccessibility(
  message: string,
  options: AnnouncementOptions = {}
) {
  const { priority = "low", delay = 0, interrupt = false } = options;

  const announce = () => {
    if (Platform.OS === "ios") {
      AccessibilityInfo.announceForAccessibility(message);
    } else if (Platform.OS === "android") {
      // Android doesn't have a direct equivalent, but we can use setAccessibilityFocus
      AccessibilityInfo.setAccessibilityFocus(0); // This is a workaround
    }
  };

  if (delay > 0) {
    setTimeout(announce, delay);
  } else {
    announce();
  }
}

export function useAccessibilityAnnouncement() {
  return useCallback((message: string, options?: AnnouncementOptions) => {
    announceForAccessibility(message, options);
  }, []);
}

// =============================================================================
// SCREEN READER DETECTION
// =============================================================================

export function useScreenReaderEnabled() {
  const [isScreenReaderEnabled, setIsScreenReaderEnabled] = useState(false);

  useEffect(() => {
    let mounted = true;

    const checkScreenReader = async () => {
      try {
        const enabled = await AccessibilityInfo.isScreenReaderEnabled();
        if (mounted) {
          setIsScreenReaderEnabled(enabled);
        }
      } catch (error) {
        console.warn("Failed to check screen reader status:", error);
      }
    };

    checkScreenReader();

    const subscription = AccessibilityInfo.addEventListener(
      "screenReaderChanged",
      (enabled) => {
        if (mounted) {
          setIsScreenReaderEnabled(enabled);
        }
      }
    );

    return () => {
      mounted = false;
      subscription?.remove();
    };
  }, []);

  return isScreenReaderEnabled;
}

// =============================================================================
// ACCESSIBILITY LABELS & DESCRIPTIONS
// =============================================================================

export interface AccessibilityContent {
  label: string;
  hint?: string;
  value?: string;
  role?: string;
  state?: Record<string, boolean | string>;
  actions?: Array<{ name: string; label: string }>;
}

export function createAccessibilityLabel(
  primary: string,
  secondary?: string,
  status?: string
): string {
  const parts = [primary];

  if (secondary) {
    parts.push(secondary);
  }

  if (status) {
    parts.push(status);
  }

  return parts.join(", ");
}

export function createFoodItemAccessibilityLabel(
  name: string,
  urgency: string,
  location: string,
  quantity?: string,
  unit?: string
): string {
  const parts = [name];

  if (quantity && unit) {
    parts.push(`${quantity} ${unit}`);
  }

  parts.push(`in ${location}`);
  parts.push(urgency);

  return parts.join(", ");
}

export function createCalendarDateAccessibilityLabel(
  date: Date,
  itemCount: number,
  urgencyLevel?: string
): string {
  const dateStr = date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  if (itemCount === 0) {
    return `${dateStr}, no items expiring`;
  }

  const itemText = itemCount === 1 ? "item" : "items";
  let label = `${dateStr}, ${itemCount} ${itemText} expiring`;

  if (urgencyLevel) {
    label += `, ${urgencyLevel} priority`;
  }

  return label;
}

// =============================================================================
// GESTURE ACCESSIBILITY
// =============================================================================

export interface GestureAccessibilityConfig {
  enabled: boolean;
  primaryAction: { name: string; label: string };
  secondaryActions?: Array<{ name: string; label: string }>;
  instructions?: string;
}

export function createGestureAccessibilityProps(
  config: GestureAccessibilityConfig,
  isScreenReaderEnabled: boolean
) {
  if (!config.enabled || !isScreenReaderEnabled) {
    return {};
  }

  const actions = [config.primaryAction];
  if (config.secondaryActions) {
    actions.push(...config.secondaryActions);
  }

  return {
    accessible: true,
    accessibilityRole: "button" as const,
    accessibilityActions: actions,
    accessibilityHint: config.instructions,
  };
}

// =============================================================================
// SWIPE GESTURE ACCESSIBILITY
// =============================================================================

export function createSwipeAccessibilityProps(
  itemName: string,
  isScreenReaderEnabled: boolean
) {
  if (!isScreenReaderEnabled) {
    return {};
  }

  return {
    accessible: true,
    accessibilityRole: "button" as const,
    accessibilityLabel: `${itemName} food item`,
    accessibilityHint:
      "Double-tap to expand details, or use the action buttons to mark as used or extend expiry",
    accessibilityActions: [
      { name: "activate", label: "View details" },
      { name: "markUsed", label: "Mark as used" },
      { name: "extendExpiry", label: "Extend expiry date" },
    ],
  };
}

// =============================================================================
// CALENDAR ACCESSIBILITY
// =============================================================================

export function createCalendarAccessibilityProps(
  date: Date,
  hasItems: boolean,
  urgencyLevel?: string,
  itemCount?: number
) {
  const label = createCalendarDateAccessibilityLabel(
    date,
    itemCount || 0,
    urgencyLevel
  );

  return {
    accessible: true,
    accessibilityRole: "button" as const,
    accessibilityLabel: label,
    accessibilityHint: hasItems
      ? "Double-tap to view items expiring on this date"
      : "No items expiring on this date",
    accessibilityState: {
      selected: false, // This should be updated based on selection state
    },
  };
}

// =============================================================================
// HAPTIC FEEDBACK FOR ACCESSIBILITY
// =============================================================================

export interface HapticAccessibilityConfig {
  success: boolean;
  warning: boolean;
  error: boolean;
  selection: boolean;
  navigation: boolean;
}

const DEFAULT_HAPTIC_CONFIG: HapticAccessibilityConfig = {
  success: true,
  warning: true,
  error: true,
  selection: true,
  navigation: true,
};

export function useAccessibilityHaptics(
  config: Partial<HapticAccessibilityConfig> = {}
) {
  const finalConfig = { ...DEFAULT_HAPTIC_CONFIG, ...config };
  const isScreenReaderEnabled = useScreenReaderEnabled();

  const triggerHaptic = useCallback(
    (type: keyof HapticAccessibilityConfig, force = false) => {
      if (Platform.OS !== "ios") return;

      // Enhanced haptic feedback when screen reader is active
      const shouldTrigger =
        force || (isScreenReaderEnabled && finalConfig[type]);
      if (!shouldTrigger) return;

      switch (type) {
        case "success":
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          break;
        case "warning":
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          break;
        case "error":
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
          break;
        case "selection":
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          break;
        case "navigation":
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          break;
      }
    },
    [isScreenReaderEnabled, finalConfig]
  );

  return triggerHaptic;
}

// =============================================================================
// FOCUS MANAGEMENT
// =============================================================================

export function useFocusManagement() {
  const setFocus = useCallback((elementId: number) => {
    if (Platform.OS === "ios" || Platform.OS === "android") {
      AccessibilityInfo.setAccessibilityFocus(elementId);
    }
  }, []);

  const moveFocusTo = useCallback((direction: "next" | "previous") => {
    // This is a placeholder for custom focus management
    // React Native doesn't have built-in directional focus APIs
    // but we can implement custom logic here
    console.log(`Moving focus ${direction}`);
  }, []);

  return { setFocus, moveFocusTo };
}

// =============================================================================
// REDUCED MOTION DETECTION
// =============================================================================

export function useReducedMotionPreference() {
  const [isReducedMotionEnabled, setIsReducedMotionEnabled] = useState(false);

  useEffect(() => {
    let mounted = true;

    const checkReducedMotion = async () => {
      try {
        const enabled = await AccessibilityInfo.isReduceMotionEnabled();
        if (mounted) {
          setIsReducedMotionEnabled(enabled);
        }
      } catch (error) {
        console.warn("Failed to check reduced motion preference:", error);
      }
    };

    checkReducedMotion();

    const subscription = AccessibilityInfo.addEventListener(
      "reduceMotionChanged",
      (enabled) => {
        if (mounted) {
          setIsReducedMotionEnabled(enabled);
        }
      }
    );

    return () => {
      mounted = false;
      subscription?.remove();
    };
  }, []);

  return isReducedMotionEnabled;
}

// =============================================================================
// VOICE CONTROL UTILITIES
// =============================================================================

export function createVoiceControlHints(
  actions: Array<{ name: string; phrase: string }>
): Record<string, string> {
  return actions.reduce((acc, action) => {
    acc[action.name] = action.phrase;
    return acc;
  }, {} as Record<string, string>);
}

export function useVoiceControlSupport() {
  return useCallback((actionName: string, callback: () => void) => {
    // This would integrate with a voice control system
    // For now, it's a placeholder for future implementation
    console.log(`Voice command registered: ${actionName}`);
    return callback;
  }, []);
}

// =============================================================================
// HIGH CONTRAST MODE DETECTION
// =============================================================================

export function useHighContrastMode() {
  const [isHighContrastEnabled, setIsHighContrastEnabled] = useState(false);

  useEffect(() => {
    let mounted = true;

    const checkHighContrast = async () => {
      try {
        // React Native doesn't have a built-in API for this
        // but we can check for other accessibility preferences
        const isScreenReader = await AccessibilityInfo.isScreenReaderEnabled();
        if (mounted) {
          // Use screen reader as a proxy for accessibility needs
          setIsHighContrastEnabled(isScreenReader);
        }
      } catch (error) {
        console.warn("Failed to check high contrast mode:", error);
      }
    };

    checkHighContrast();

    return () => {
      mounted = false;
    };
  }, []);

  return isHighContrastEnabled;
}

// =============================================================================
// ACCESSIBILITY TESTING HELPERS
// =============================================================================

export interface AccessibilityAuditResult {
  element: string;
  issues: Array<{
    type: "error" | "warning" | "info";
    message: string;
    suggestion?: string;
  }>;
}

export function auditAccessibility(
  elements: Array<{ id: string; props: any }>
): AccessibilityAuditResult[] {
  const results: AccessibilityAuditResult[] = [];

  elements.forEach((element) => {
    const issues: AccessibilityAuditResult["issues"] = [];

    // Check for missing accessibility label
    if (!element.props.accessibilityLabel && !element.props.children) {
      issues.push({
        type: "error",
        message: "Missing accessibility label",
        suggestion: "Add accessibilityLabel prop",
      });
    }

    // Check for interactive elements without role
    if (element.props.onPress && !element.props.accessibilityRole) {
      issues.push({
        type: "warning",
        message: "Interactive element missing accessibility role",
        suggestion: 'Add accessibilityRole="button"',
      });
    }

    // Check for touch target size
    if (element.props.onPress && !element.props.hitSlop) {
      issues.push({
        type: "info",
        message: "Consider adding hitSlop for better touch accessibility",
        suggestion: "Add hitSlop prop with minimum 44x44 touch target",
      });
    }

    if (issues.length > 0) {
      results.push({ element: element.id, issues });
    }
  });

  return results;
}

// =============================================================================
// SEMANTIC CONTENT HELPERS
// =============================================================================

export function createSemanticMarkup(
  type: "header" | "list" | "listitem" | "section" | "navigation",
  content: string,
  level?: number
) {
  const baseProps = {
    accessible: true,
    accessibilityLabel: content,
  };

  switch (type) {
    case "header":
      return {
        ...baseProps,
        accessibilityRole: "header" as const,
        accessibilityLevel: level || 1,
      };
    case "list":
      return {
        ...baseProps,
        accessibilityRole: "list" as const,
      };
    case "listitem":
      return {
        ...baseProps,
        accessibilityRole: "menuitem" as const,
      };
    case "section":
      return {
        ...baseProps,
        accessibilityRole: "summary" as const,
      };
    case "navigation":
      return {
        ...baseProps,
        accessibilityRole: "navigation" as const,
      };
    default:
      return baseProps;
  }
}

// =============================================================================
// ACCESSIBILITY STATE MANAGEMENT
// =============================================================================

export function useAccessibilityState() {
  const isScreenReaderEnabled = useScreenReaderEnabled();
  const isReducedMotionEnabled = useReducedMotionPreference();
  const isHighContrastEnabled = useHighContrastMode();

  return {
    isScreenReaderEnabled,
    isReducedMotionEnabled,
    isHighContrastEnabled,
    isAccessibilityModeActive: isScreenReaderEnabled || isHighContrastEnabled,
  };
}

// =============================================================================
// EXPORTS
// =============================================================================

export default {
  announceForAccessibility,
  useAccessibilityAnnouncement,
  useScreenReaderEnabled,
  createAccessibilityLabel,
  createFoodItemAccessibilityLabel,
  createCalendarDateAccessibilityLabel,
  createGestureAccessibilityProps,
  createSwipeAccessibilityProps,
  createCalendarAccessibilityProps,
  useAccessibilityHaptics,
  useFocusManagement,
  useReducedMotionPreference,
  useHighContrastMode,
  useAccessibilityState,
  auditAccessibility,
  createSemanticMarkup,
};
