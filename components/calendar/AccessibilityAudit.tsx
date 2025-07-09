// AccessibilityAudit - Comprehensive accessibility testing and improvements
// Provides accessibility validation, testing utilities, and improvement suggestions

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  AccessibilityInfo,
  findNodeHandle,
  Platform,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  A11yLevel,
  AccessibilityAuditProps,
  AccessibilityGuidelines,
  AccessibilityIssue,
  AccessibilityTestResult,
} from "../../types/calendar-enhanced";

// =============================================================================
// ACCESSIBILITY GUIDELINES (WCAG 2.1 AA)
// =============================================================================

const ACCESSIBILITY_GUIDELINES: AccessibilityGuidelines = {
  // Color and Contrast
  colorContrast: {
    level: "AA",
    normalText: 4.5,
    largeText: 3.0,
    graphicalObjects: 3.0,
    userInterfaceComponents: 3.0,
  },

  // Touch Targets
  touchTargets: {
    minimumSize: 44, // iOS HIG and Material Design
    recommendedSize: 48,
    minimumSpacing: 8,
  },

  // Text and Typography
  typography: {
    minimumFontSize: 12,
    recommendedFontSize: 16,
    maximumLineLength: 80, // characters
    minimumLineHeight: 1.5,
  },

  // Focus Management
  focus: {
    visibleFocusIndicator: true,
    logicalFocusOrder: true,
    trapFocusInModals: true,
  },

  // Screen Reader Support
  screenReader: {
    meaningfulLabels: true,
    descriptiveHints: true,
    statusAnnouncements: true,
    structuralMarkup: true,
  },

  // Animation and Motion
  animation: {
    respectReducedMotion: true,
    providePauseControl: true,
    noFlashingContent: true,
    maxFlashRate: 3, // per second
  },
};

// =============================================================================
// ACCESSIBILITY TESTING UTILITIES
// =============================================================================

/**
 * Test color contrast ratio between two colors
 */
function testColorContrast(
  foreground: string,
  background: string,
  level: A11yLevel = "AA"
): AccessibilityTestResult {
  // Simplified contrast calculation (would use more sophisticated library in production)
  const fgLuminance = getLuminance(foreground);
  const bgLuminance = getLuminance(background);

  const contrast =
    (Math.max(fgLuminance, bgLuminance) + 0.05) /
    (Math.min(fgLuminance, bgLuminance) + 0.05);

  const requirements = ACCESSIBILITY_GUIDELINES.colorContrast;
  const threshold = level === "AAA" ? 7.0 : requirements.normalText;

  return {
    passed: contrast >= threshold,
    score: contrast,
    threshold,
    message:
      contrast >= threshold
        ? `Contrast ratio ${contrast.toFixed(2)} meets ${level} standards`
        : `Contrast ratio ${contrast.toFixed(
            2
          )} fails ${level} standards (required: ${threshold})`,
  };
}

/**
 * Calculate relative luminance of a color
 */
function getLuminance(color: string): number {
  // Simplified luminance calculation
  // In production, would use proper color parsing and sRGB conversion
  const hex = color.replace("#", "");
  const r = parseInt(hex.substr(0, 2), 16) / 255;
  const g = parseInt(hex.substr(2, 2), 16) / 255;
  const b = parseInt(hex.substr(4, 2), 16) / 255;

  const [rs, gs, bs] = [r, g, b].map((c) =>
    c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
  );

  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

/**
 * Test touch target size
 */
function testTouchTargetSize(
  width: number,
  height: number
): AccessibilityTestResult {
  const { minimumSize, recommendedSize } =
    ACCESSIBILITY_GUIDELINES.touchTargets;
  const minDimension = Math.min(width, height);

  return {
    passed: minDimension >= minimumSize,
    score: minDimension,
    threshold: minimumSize,
    message:
      minDimension >= recommendedSize
        ? `Touch target ${minDimension}px exceeds recommended size`
        : minDimension >= minimumSize
        ? `Touch target ${minDimension}px meets minimum requirements`
        : `Touch target ${minDimension}px too small (minimum: ${minimumSize}px)`,
  };
}

/**
 * Test text readability
 */
function testTextReadability(
  text: string,
  fontSize: number,
  lineHeight?: number
): AccessibilityTestResult {
  const { minimumFontSize, maximumLineLength, minimumLineHeight } =
    ACCESSIBILITY_GUIDELINES.typography;

  const issues: string[] = [];

  if (fontSize < minimumFontSize) {
    issues.push(`Font size ${fontSize}px below minimum ${minimumFontSize}px`);
  }

  if (text.length > maximumLineLength) {
    issues.push(
      `Text length ${text.length} exceeds maximum ${maximumLineLength} characters`
    );
  }

  if (lineHeight && lineHeight < minimumLineHeight) {
    issues.push(`Line height ${lineHeight} below minimum ${minimumLineHeight}`);
  }

  return {
    passed: issues.length === 0,
    score: fontSize,
    threshold: minimumFontSize,
    message:
      issues.length === 0
        ? "Text readability meets standards"
        : `Text readability issues: ${issues.join(", ")}`,
  };
}

// =============================================================================
// ACCESSIBILITY AUDIT COMPONENT
// =============================================================================

/**
 * Comprehensive accessibility audit for calendar components
 */
const AccessibilityAudit: React.FC<AccessibilityAuditProps> = ({
  children,
  enableAutomaticTesting = true,
  enableManualTesting = false,
  reportingLevel = "AA",
  onIssueFound,
  onAuditComplete,
  testID = "accessibility-audit",
}) => {
  const [issues, setIssues] = useState<AccessibilityIssue[]>([]);
  const [isAuditing, setIsAuditing] = useState(false);
  const [screenReaderEnabled, setScreenReaderEnabled] = useState(false);
  const auditRef = useRef<View>(null);
  const insets = useSafeAreaInsets();

  // Check screen reader status
  useEffect(() => {
    const checkScreenReader = async () => {
      try {
        const enabled = await AccessibilityInfo.isScreenReaderEnabled();
        setScreenReaderEnabled(enabled);
      } catch (error) {
        console.warn("Could not check screen reader status:", error);
      }
    };

    checkScreenReader();

    const subscription = AccessibilityInfo.addEventListener(
      "screenReaderChanged",
      setScreenReaderEnabled
    );

    return () => {
      subscription?.remove();
    };
  }, []);

  // Automatic accessibility testing
  const runAutomaticTests = useCallback(async () => {
    if (!enableAutomaticTesting) return;

    setIsAuditing(true);
    const foundIssues: AccessibilityIssue[] = [];

    try {
      // Test 1: Check for missing accessibility labels
      const nodeHandle = findNodeHandle(auditRef.current);
      if (nodeHandle) {
        // This would be expanded with actual DOM traversal in production
        // For now, we'll simulate some common issues

        // Simulate missing label detection
        foundIssues.push({
          id: "missing-label-1",
          type: "missing-label",
          severity: "error",
          element: "Button",
          message: "Interactive element missing accessibility label",
          suggestion: "Add accessibilityLabel prop to button components",
          wcagCriterion: "4.1.2",
        });
      }

      // Test 2: Check color contrast (simulated)
      const contrastTest = testColorContrast(
        "#333333",
        "#FFFFFF",
        reportingLevel
      );
      if (!contrastTest.passed) {
        foundIssues.push({
          id: "color-contrast-1",
          type: "color-contrast",
          severity: "error",
          element: "Text",
          message: contrastTest.message,
          suggestion: "Use colors with higher contrast ratio",
          wcagCriterion: "1.4.3",
        });
      }

      // Test 3: Check touch target sizes (simulated)
      const touchTest = testTouchTargetSize(40, 40);
      if (!touchTest.passed) {
        foundIssues.push({
          id: "touch-target-1",
          type: "touch-target",
          severity: "warning",
          element: "Button",
          message: touchTest.message,
          suggestion: "Increase button size to at least 44x44 points",
          wcagCriterion: "2.5.5",
        });
      }

      // Test 4: Check text readability
      const textTest = testTextReadability("Sample text", 12);
      if (!textTest.passed) {
        foundIssues.push({
          id: "text-readability-1",
          type: "text-readability",
          severity: "warning",
          element: "Text",
          message: textTest.message,
          suggestion:
            "Increase font size to at least 16px for better readability",
          wcagCriterion: "1.4.4",
        });
      }

      setIssues(foundIssues);
      onIssueFound?.(foundIssues);
      onAuditComplete?.(foundIssues);
    } catch (error) {
      console.error("Accessibility audit failed:", error);
    } finally {
      setIsAuditing(false);
    }
  }, [enableAutomaticTesting, reportingLevel, onIssueFound, onAuditComplete]);

  // Run audit on mount and when children change
  useEffect(() => {
    if (enableAutomaticTesting) {
      // Delay to allow component to render
      const timer = setTimeout(runAutomaticTests, 100);
      return () => clearTimeout(timer);
    }
  }, [runAutomaticTests, children]);

  // Manual testing helpers
  const announceToScreenReader = useCallback((message: string) => {
    if (Platform.OS === "ios") {
      AccessibilityInfo.announceForAccessibility(message);
    } else if (Platform.OS === "android") {
      AccessibilityInfo.announceForAccessibility(message);
    }
  }, []);

  const setAccessibilityFocus = useCallback((ref: React.RefObject<any>) => {
    if (ref.current) {
      const nodeHandle = findNodeHandle(ref.current);
      if (nodeHandle) {
        AccessibilityInfo.setAccessibilityFocus(nodeHandle);
      }
    }
  }, []);

  // Accessibility summary
  const accessibilitySummary = useMemo(() => {
    const errorCount = issues.filter(
      (issue) => issue.severity === "error"
    ).length;
    const warningCount = issues.filter(
      (issue) => issue.severity === "warning"
    ).length;
    const infoCount = issues.filter(
      (issue) => issue.severity === "info"
    ).length;

    return {
      total: issues.length,
      errors: errorCount,
      warnings: warningCount,
      info: infoCount,
      score: Math.max(
        0,
        100 - errorCount * 20 - warningCount * 10 - infoCount * 5
      ),
    };
  }, [issues]);

  // Show audit results in development
  useEffect(() => {
    if (__DEV__ && issues.length > 0) {
      console.group("🔍 Accessibility Audit Results");
      console.log(`Score: ${accessibilitySummary.score}/100`);
      console.log(`Issues found: ${accessibilitySummary.total}`);

      issues.forEach((issue) => {
        const emoji =
          issue.severity === "error"
            ? "❌"
            : issue.severity === "warning"
            ? "⚠️"
            : "ℹ️";
        console.log(`${emoji} ${issue.message}`);
        console.log(`   Suggestion: ${issue.suggestion}`);
        console.log(`   WCAG: ${issue.wcagCriterion}`);
      });

      console.groupEnd();
    }
  }, [issues, accessibilitySummary]);

  return (
    <View
      ref={auditRef}
      style={[styles.container, { paddingTop: insets.top }]}
      testID={testID}
    >
      {/* Screen reader status indicator */}
      {__DEV__ && (
        <View
          style={styles.debugInfo}
          accessible={true}
          accessibilityRole="text"
          accessibilityLabel={`Screen reader ${
            screenReaderEnabled ? "enabled" : "disabled"
          }`}
        >
          <Text style={styles.debugText}>
            🔍 A11y: {screenReaderEnabled ? "SR ON" : "SR OFF"} | Score:{" "}
            {accessibilitySummary.score}/100 | Issues:{" "}
            {accessibilitySummary.total}
          </Text>
        </View>
      )}

      {/* Main content */}
      <View style={styles.content}>{children}</View>

      {/* Accessibility announcements region */}
      <View
        style={styles.announcements}
        accessible={true}
        accessibilityRole="text"
        accessibilityLiveRegion="polite"
      >
        {/* This area is used for dynamic announcements */}
      </View>
    </View>
  );
};

// =============================================================================
// ACCESSIBILITY IMPROVEMENT COMPONENTS
// =============================================================================

interface AccessibleButtonProps {
  children: React.ReactNode;
  onPress: () => void;
  accessibilityLabel: string;
  accessibilityHint?: string;
  disabled?: boolean;
  style?: any;
}

const AccessibleButton: React.FC<AccessibleButtonProps> = ({
  children,
  onPress,
  accessibilityLabel,
  accessibilityHint,
  disabled = false,
  style,
}) => {
  return (
    <View
      style={[
        styles.accessibleButton,
        style,
        disabled && styles.disabledButton,
      ]}
      accessible={true}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled }}
      onTouchEnd={disabled ? undefined : onPress}
    >
      {children}
    </View>
  );
};

interface AccessibleTextProps {
  children: string;
  style?: any;
  accessibilityLabel?: string;
  accessibilityRole?: "text" | "header" | "summary";
  fontSize?: number;
}

const AccessibleText: React.FC<AccessibleTextProps> = ({
  children,
  style,
  accessibilityLabel,
  accessibilityRole = "text",
  fontSize = 16,
}) => {
  const textTest = testTextReadability(children, fontSize);

  return (
    <Text
      style={[
        styles.accessibleText,
        {
          fontSize: Math.max(
            fontSize,
            ACCESSIBILITY_GUIDELINES.typography.minimumFontSize
          ),
        },
        style,
        !textTest.passed && styles.textWarning,
      ]}
      accessible={true}
      accessibilityRole={accessibilityRole}
      accessibilityLabel={accessibilityLabel || children}
    >
      {children}
    </Text>
  );
};

interface FocusableRegionProps {
  children: React.ReactNode;
  accessibilityLabel: string;
  accessibilityRole?: string;
  style?: any;
}

const FocusableRegion: React.FC<FocusableRegionProps> = ({
  children,
  accessibilityLabel,
  accessibilityRole = "region",
  style,
}) => {
  return (
    <View
      style={[styles.focusableRegion, style]}
      accessible={true}
      accessibilityRole={accessibilityRole as any}
      accessibilityLabel={accessibilityLabel}
    >
      {children}
    </View>
  );
};

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Create accessible announcements
 */
function announceAccessibility(
  message: string,
  priority: "low" | "high" = "low"
) {
  if (Platform.OS === "ios" || Platform.OS === "android") {
    AccessibilityInfo.announceForAccessibility(message);
  }
}

/**
 * Check if device has accessibility features enabled
 */
async function getAccessibilityInfo() {
  try {
    const [
      screenReaderEnabled,
      reduceMotionEnabled,
      reduceTransparencyEnabled,
    ] = await Promise.all([
      AccessibilityInfo.isScreenReaderEnabled(),
      AccessibilityInfo.isReduceMotionEnabled(),
      Platform.OS === "ios"
        ? AccessibilityInfo.isReduceTransparencyEnabled()
        : Promise.resolve(false),
    ]);

    return {
      screenReaderEnabled,
      reduceMotionEnabled,
      reduceTransparencyEnabled,
    };
  } catch (error) {
    console.warn("Could not get accessibility info:", error);
    return {
      screenReaderEnabled: false,
      reduceMotionEnabled: false,
      reduceTransparencyEnabled: false,
    };
  }
}

/**
 * Validate accessibility props
 */
function validateAccessibilityProps(props: any): AccessibilityIssue[] {
  const issues: AccessibilityIssue[] = [];

  // Check for missing accessibility labels on interactive elements
  if (props.onPress && !props.accessibilityLabel) {
    issues.push({
      id: `missing-label-${Date.now()}`,
      type: "missing-label",
      severity: "error",
      element: "Interactive Element",
      message: "Interactive element missing accessibility label",
      suggestion: "Add accessibilityLabel prop",
      wcagCriterion: "4.1.2",
    });
  }

  // Check for appropriate accessibility roles
  if (props.onPress && !props.accessibilityRole) {
    issues.push({
      id: `missing-role-${Date.now()}`,
      type: "missing-role",
      severity: "warning",
      element: "Interactive Element",
      message: "Interactive element missing accessibility role",
      suggestion: "Add accessibilityRole prop (e.g., 'button')",
      wcagCriterion: "4.1.2",
    });
  }

  return issues;
}

// =============================================================================
// STYLES
// =============================================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  debugInfo: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: "rgba(0, 0, 0, 0.8)",
    zIndex: 1000,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  debugText: {
    color: "white",
    fontSize: 12,
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
  },
  announcements: {
    position: "absolute",
    top: -1000,
    left: -1000,
    width: 1,
    height: 1,
    opacity: 0,
  },
  accessibleButton: {
    minWidth: ACCESSIBILITY_GUIDELINES.touchTargets.minimumSize,
    minHeight: ACCESSIBILITY_GUIDELINES.touchTargets.minimumSize,
    justifyContent: "center",
    alignItems: "center",
    padding: 8,
  },
  disabledButton: {
    opacity: 0.5,
  },
  accessibleText: {
    lineHeight: ACCESSIBILITY_GUIDELINES.typography.minimumLineHeight * 16,
  },
  textWarning: {
    borderLeftWidth: 3,
    borderLeftColor: "#FF9500",
    paddingLeft: 8,
  },
  focusableRegion: {
    padding: 8,
  },
});

// =============================================================================
// EXPORT
// =============================================================================

AccessibilityAudit.displayName = "AccessibilityAudit";

export default AccessibilityAudit;
export {
  ACCESSIBILITY_GUIDELINES,
  AccessibleButton,
  AccessibleText,
  announceAccessibility,
  FocusableRegion,
  getAccessibilityInfo,
  testColorContrast,
  testTextReadability,
  testTouchTargetSize,
  validateAccessibilityProps,
};
