// Accessibility Wrapper - Phase 2 Implementation
// Enhanced accessibility container with WCAG 2.1 AA compliance features

import {
  AccessibilityContent,
  createSemanticMarkup,
  useAccessibilityAnnouncement,
  useAccessibilityHaptics,
  useAccessibilityState,
} from "@/utils/accessibilityUtils";
import React, { ReactNode, useCallback, useEffect, useRef } from "react";
import { Platform, View, ViewStyle } from "react-native";

// =============================================================================
// INTERFACES
// =============================================================================

interface AccessibilityWrapperProps {
  children: ReactNode;
  semanticType?:
    | "header"
    | "list"
    | "listitem"
    | "section"
    | "navigation"
    | "main";
  level?: number; // For headers
  accessibilityContent?: AccessibilityContent;
  enableHaptics?: boolean;
  announceOnMount?: string;
  announceOnUpdate?: string;
  skipAccessibility?: boolean;
  onAccessibilityAction?: (actionName: string) => void;
  style?: ViewStyle;
  testID?: string;
}

interface AccessibilityRegionProps {
  children: ReactNode;
  title: string;
  description?: string;
  role?: "main" | "navigation" | "banner" | "contentinfo" | "complementary";
  live?: "off" | "polite" | "assertive";
  atomic?: boolean;
  style?: ViewStyle;
}

interface KeyboardNavigationProps {
  children: ReactNode;
  onFocusNext?: () => void;
  onFocusPrevious?: () => void;
  onActivate?: () => void;
  trapFocus?: boolean;
  autoFocus?: boolean;
  style?: ViewStyle;
}

// =============================================================================
// ACCESSIBILITY WRAPPER COMPONENT
// =============================================================================

const AccessibilityWrapper: React.FC<AccessibilityWrapperProps> = ({
  children,
  semanticType,
  level,
  accessibilityContent,
  enableHaptics = true,
  announceOnMount,
  announceOnUpdate,
  skipAccessibility = false,
  onAccessibilityAction,
  style,
  testID,
}) => {
  const { isScreenReaderEnabled, isAccessibilityModeActive } =
    useAccessibilityState();
  const triggerHaptic = useAccessibilityHaptics({ selection: enableHaptics });
  const announce = useAccessibilityAnnouncement();
  const lastAnnouncementRef = useRef<string>("");

  // Announce on mount if specified
  useEffect(() => {
    if (announceOnMount && isScreenReaderEnabled) {
      announce(announceOnMount, { delay: 500 });
      lastAnnouncementRef.current = announceOnMount;
    }
  }, [announceOnMount, isScreenReaderEnabled, announce]);

  // Announce on updates
  useEffect(() => {
    if (
      announceOnUpdate &&
      isScreenReaderEnabled &&
      announceOnUpdate !== lastAnnouncementRef.current
    ) {
      announce(announceOnUpdate, { delay: 200 });
      lastAnnouncementRef.current = announceOnUpdate;
    }
  }, [announceOnUpdate, isScreenReaderEnabled, announce]);

  // Handle accessibility actions
  const handleAccessibilityAction = useCallback(
    (event: any) => {
      const actionName = event.nativeEvent.actionName;

      if (enableHaptics) {
        triggerHaptic("selection");
      }

      if (onAccessibilityAction) {
        onAccessibilityAction(actionName);
      }

      // Handle default actions
      if (accessibilityContent?.actions) {
        const action = accessibilityContent.actions.find(
          (a) => a.name === actionName
        );
        if (action) {
          announce(`${action.label} activated`, { priority: "high" });
        }
      }
    },
    [
      enableHaptics,
      triggerHaptic,
      onAccessibilityAction,
      accessibilityContent,
      announce,
    ]
  );

  // Skip accessibility if not needed
  if (skipAccessibility || !isAccessibilityModeActive) {
    return (
      <View style={style} testID={testID}>
        {children}
      </View>
    );
  }

  // Create accessibility props based on semantic type
  let accessibilityProps: any = {};

  if (semanticType && accessibilityContent?.label) {
    accessibilityProps = createSemanticMarkup(
      semanticType,
      accessibilityContent.label,
      level
    );
  }

  // Add custom accessibility content
  if (accessibilityContent) {
    accessibilityProps = {
      ...accessibilityProps,
      accessible: true,
      accessibilityLabel: accessibilityContent.label,
      accessibilityHint: accessibilityContent.hint,
      accessibilityValue: accessibilityContent.value
        ? {
            text: accessibilityContent.value,
          }
        : undefined,
      accessibilityState: accessibilityContent.state,
      accessibilityActions: accessibilityContent.actions,
      onAccessibilityAction: accessibilityContent.actions
        ? handleAccessibilityAction
        : undefined,
    };
  }

  return (
    <View
      style={style}
      testID={testID}
      {...accessibilityProps}
      importantForAccessibility={isScreenReaderEnabled ? "yes" : "auto"}
    >
      {children}
    </View>
  );
};

// =============================================================================
// ACCESSIBILITY REGION COMPONENT
// =============================================================================

const AccessibilityRegion: React.FC<AccessibilityRegionProps> = ({
  children,
  title,
  description,
  role = "main",
  live = "polite",
  atomic = false,
  style,
}) => {
  const { isScreenReaderEnabled } = useAccessibilityState();

  if (!isScreenReaderEnabled) {
    return <View style={style}>{children}</View>;
  }

  const accessibilityProps = {
    accessible: true,
    accessibilityRole: role as any,
    accessibilityLabel: title,
    accessibilityHint: description,
    accessibilityLiveRegion: live as any,
    accessibilityElementsHidden: false,
    importantForAccessibility: "yes" as const,
  };

  // Add atomic property for iOS
  if (Platform.OS === "ios" && atomic) {
    (accessibilityProps as any).accessibilityViewIsModal = true;
  }

  return (
    <View style={style} {...accessibilityProps}>
      {children}
    </View>
  );
};

// =============================================================================
// KEYBOARD NAVIGATION COMPONENT
// =============================================================================

const KeyboardNavigation: React.FC<KeyboardNavigationProps> = ({
  children,
  onFocusNext,
  onFocusPrevious,
  onActivate,
  trapFocus = false,
  autoFocus = false,
  style,
}) => {
  const { isAccessibilityModeActive } = useAccessibilityState();
  const containerRef = useRef<View>(null);

  // Focus management for keyboard navigation
  useEffect(() => {
    if (autoFocus && isAccessibilityModeActive && containerRef.current) {
      // Auto-focus logic would go here
      // React Native doesn't have built-in keyboard navigation APIs
      // but we can set up custom handlers
    }
  }, [autoFocus, isAccessibilityModeActive]);

  // For React Native, keyboard navigation is primarily handled by the OS
  // But we can provide enhanced support for custom components
  const accessibilityProps = isAccessibilityModeActive
    ? {
        accessible: true,
        accessibilityRole: "group" as const,
        accessibilityActions: [
          { name: "activate", label: "Activate" },
          { name: "increment", label: "Next item" },
          { name: "decrement", label: "Previous item" },
        ],
        onAccessibilityAction: (event: any) => {
          const actionName = event.nativeEvent.actionName;
          switch (actionName) {
            case "activate":
              onActivate?.();
              break;
            case "increment":
              onFocusNext?.();
              break;
            case "decrement":
              onFocusPrevious?.();
              break;
          }
        },
      }
    : {};

  return (
    <View ref={containerRef} style={style} {...accessibilityProps}>
      {children}
    </View>
  );
};

// =============================================================================
// ACCESSIBILITY ANNOUNCEMENT COMPONENT
// =============================================================================

interface AccessibilityAnnouncementProps {
  message: string;
  priority?: "low" | "high";
  delay?: number;
  children?: ReactNode;
}

const AccessibilityAnnouncement: React.FC<AccessibilityAnnouncementProps> = ({
  message,
  priority = "low",
  delay = 0,
  children,
}) => {
  const { isScreenReaderEnabled } = useAccessibilityState();
  const announce = useAccessibilityAnnouncement();

  useEffect(() => {
    if (message && isScreenReaderEnabled) {
      announce(message, { priority, delay });
    }
  }, [message, priority, delay, isScreenReaderEnabled, announce]);

  return children ? <>{children}</> : null;
};

// =============================================================================
// LIVE REGION COMPONENT
// =============================================================================

interface LiveRegionProps {
  children: ReactNode;
  politeness?: "off" | "polite" | "assertive";
  atomic?: boolean;
  style?: ViewStyle;
}

const LiveRegion: React.FC<LiveRegionProps> = ({
  children,
  politeness = "polite",
  atomic = false,
  style,
}) => {
  const { isScreenReaderEnabled } = useAccessibilityState();

  if (!isScreenReaderEnabled) {
    return <View style={style}>{children}</View>;
  }

  const accessibilityProps = {
    accessibilityLiveRegion: politeness as any,
    accessible: true,
    importantForAccessibility: "yes" as const,
  };

  // iOS-specific atomic behavior
  if (Platform.OS === "ios" && atomic) {
    (accessibilityProps as any).accessibilityViewIsModal = true;
  }

  return (
    <View style={style} {...accessibilityProps}>
      {children}
    </View>
  );
};

// =============================================================================
// ACCESSIBILITY BUTTON COMPONENT
// =============================================================================

interface AccessibilityButtonProps {
  children: ReactNode;
  onPress: () => void;
  label: string;
  hint?: string;
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
  testID?: string;
}

const AccessibilityButton: React.FC<AccessibilityButtonProps> = ({
  children,
  onPress,
  label,
  hint,
  disabled = false,
  loading = false,
  style,
  testID,
}) => {
  const { isScreenReaderEnabled } = useAccessibilityState();
  const triggerHaptic = useAccessibilityHaptics();

  const handlePress = useCallback(() => {
    if (disabled || loading) return;

    triggerHaptic("selection");
    onPress();
  }, [disabled, loading, onPress, triggerHaptic]);

  const accessibilityState = {
    disabled: disabled || loading,
    busy: loading,
  };

  const accessibilityLabel = loading ? `${label}, loading` : label;
  const accessibilityHint = disabled ? "Button is disabled" : hint;

  return (
    <View
      style={style}
      accessible={true}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={accessibilityHint}
      accessibilityState={accessibilityState}
      onTouchEnd={handlePress}
      testID={testID}
      importantForAccessibility={isScreenReaderEnabled ? "yes" : "auto"}
    >
      {children}
    </View>
  );
};

// =============================================================================
// HIGH CONTRAST WRAPPER
// =============================================================================

interface HighContrastWrapperProps {
  children: ReactNode;
  highContrastColors?: {
    background: string;
    text: string;
    border: string;
  };
  style?: ViewStyle;
}

const HighContrastWrapper: React.FC<HighContrastWrapperProps> = ({
  children,
  highContrastColors,
  style,
}) => {
  const { isHighContrastEnabled } = useAccessibilityState();

  const wrapperStyle =
    isHighContrastEnabled && highContrastColors
      ? {
          backgroundColor: highContrastColors.background,
          borderColor: highContrastColors.border,
          borderWidth: 1,
        }
      : {};

  return <View style={[style, wrapperStyle]}>{children}</View>;
};

// =============================================================================
// EXPORTS
// =============================================================================

export default AccessibilityWrapper;

export {
  AccessibilityAnnouncement,
  AccessibilityButton,
  AccessibilityRegion,
  HighContrastWrapper,
  KeyboardNavigation,
  LiveRegion,
};

export type {
  AccessibilityAnnouncementProps,
  AccessibilityButtonProps,
  AccessibilityRegionProps,
  AccessibilityWrapperProps,
  HighContrastWrapperProps,
  KeyboardNavigationProps,
  LiveRegionProps,
};
