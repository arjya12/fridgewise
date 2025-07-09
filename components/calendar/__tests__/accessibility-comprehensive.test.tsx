// Comprehensive accessibility tests for calendar components
// Ensures WCAG 2.1 AA compliance and React Native accessibility best practices

import { fireEvent, render, waitFor } from "@testing-library/react-native";
import React from "react";
import { AccessibilityInfo } from "react-native";
import AccessibilityAudit, {
  ACCESSIBILITY_GUIDELINES,
  AccessibleButton,
  AccessibleText,
  FocusableRegion,
  getAccessibilityInfo,
  testColorContrast,
  testTextReadability,
  testTouchTargetSize,
  validateAccessibilityProps,
} from "../AccessibilityAudit";

// Mock AccessibilityInfo
jest.mock("react-native", () => ({
  ...jest.requireActual("react-native"),
  AccessibilityInfo: {
    isScreenReaderEnabled: jest.fn(),
    isReduceMotionEnabled: jest.fn(),
    isReduceTransparencyEnabled: jest.fn(),
    announceForAccessibility: jest.fn(),
    setAccessibilityFocus: jest.fn(),
    addEventListener: jest.fn(),
  },
  findNodeHandle: jest.fn(() => 123),
  Platform: {
    OS: "ios",
  },
}));

const mockAccessibilityInfo = AccessibilityInfo as jest.Mocked<
  typeof AccessibilityInfo
>;

describe("AccessibilityAudit", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAccessibilityInfo.isScreenReaderEnabled.mockResolvedValue(false);
    mockAccessibilityInfo.isReduceMotionEnabled.mockResolvedValue(false);
    mockAccessibilityInfo.isReduceTransparencyEnabled.mockResolvedValue(false);
  });

  describe("Component Rendering", () => {
    it("renders children correctly", () => {
      const { getByText } = render(
        <AccessibilityAudit>
          <AccessibleText>Test Content</AccessibleText>
        </AccessibilityAudit>
      );

      expect(getByText("Test Content")).toBeTruthy();
    });

    it("shows debug info in development", () => {
      const originalDev = __DEV__;
      (global as any).__DEV__ = true;

      const { getByText } = render(
        <AccessibilityAudit>
          <AccessibleText>Test Content</AccessibleText>
        </AccessibilityAudit>
      );

      expect(getByText(/A11y:/)).toBeTruthy();

      (global as any).__DEV__ = originalDev;
    });

    it("has proper accessibility properties", () => {
      const { getByTestId } = render(
        <AccessibilityAudit testID="audit-component">
          <AccessibleText>Test Content</AccessibleText>
        </AccessibilityAudit>
      );

      const component = getByTestId("audit-component");
      expect(component).toBeTruthy();
    });
  });

  describe("Screen Reader Detection", () => {
    it("detects screen reader status", async () => {
      mockAccessibilityInfo.isScreenReaderEnabled.mockResolvedValue(true);

      render(
        <AccessibilityAudit>
          <AccessibleText>Test Content</AccessibleText>
        </AccessibilityAudit>
      );

      await waitFor(() => {
        expect(mockAccessibilityInfo.isScreenReaderEnabled).toHaveBeenCalled();
      });
    });

    it("listens for screen reader changes", () => {
      render(
        <AccessibilityAudit>
          <AccessibleText>Test Content</AccessibleText>
        </AccessibilityAudit>
      );

      expect(mockAccessibilityInfo.addEventListener).toHaveBeenCalledWith(
        "screenReaderChanged",
        expect.any(Function)
      );
    });
  });

  describe("Automatic Testing", () => {
    it("runs automatic accessibility tests when enabled", async () => {
      const onIssueFound = jest.fn();
      const onAuditComplete = jest.fn();

      render(
        <AccessibilityAudit
          enableAutomaticTesting={true}
          onIssueFound={onIssueFound}
          onAuditComplete={onAuditComplete}
        >
          <AccessibleText>Test Content</AccessibleText>
        </AccessibilityAudit>
      );

      await waitFor(
        () => {
          expect(onAuditComplete).toHaveBeenCalled();
        },
        { timeout: 1000 }
      );
    });

    it("skips automatic tests when disabled", async () => {
      const onAuditComplete = jest.fn();

      render(
        <AccessibilityAudit
          enableAutomaticTesting={false}
          onAuditComplete={onAuditComplete}
        >
          <AccessibleText>Test Content</AccessibleText>
        </AccessibilityAudit>
      );

      // Wait a bit to ensure no tests run
      await new Promise((resolve) => setTimeout(resolve, 200));
      expect(onAuditComplete).not.toHaveBeenCalled();
    });
  });
});

describe("AccessibleButton", () => {
  it("renders with proper accessibility properties", () => {
    const onPress = jest.fn();
    const { getByLabelText } = render(
      <AccessibleButton
        onPress={onPress}
        accessibilityLabel="Test Button"
        accessibilityHint="Tap to test"
      >
        <AccessibleText>Button Text</AccessibleText>
      </AccessibleButton>
    );

    const button = getByLabelText("Test Button");
    expect(button).toBeTruthy();
    expect(button.props.accessibilityRole).toBe("button");
    expect(button.props.accessibilityHint).toBe("Tap to test");
  });

  it("handles press events", () => {
    const onPress = jest.fn();
    const { getByLabelText } = render(
      <AccessibleButton onPress={onPress} accessibilityLabel="Test Button">
        <AccessibleText>Button Text</AccessibleText>
      </AccessibleButton>
    );

    const button = getByLabelText("Test Button");
    fireEvent(button, "touchEnd");
    expect(onPress).toHaveBeenCalled();
  });

  it("handles disabled state correctly", () => {
    const onPress = jest.fn();
    const { getByLabelText } = render(
      <AccessibleButton
        onPress={onPress}
        accessibilityLabel="Test Button"
        disabled={true}
      >
        <AccessibleText>Button Text</AccessibleText>
      </AccessibleButton>
    );

    const button = getByLabelText("Test Button");
    expect(button.props.accessibilityState).toEqual({ disabled: true });

    fireEvent(button, "touchEnd");
    expect(onPress).not.toHaveBeenCalled();
  });

  it("meets minimum touch target size", () => {
    const { getByLabelText } = render(
      <AccessibleButton onPress={jest.fn()} accessibilityLabel="Test Button">
        <AccessibleText>Button Text</AccessibleText>
      </AccessibleButton>
    );

    const button = getByLabelText("Test Button");
    const style = button.props.style;

    // Check that minimum size is applied
    expect(style.minWidth).toBe(
      ACCESSIBILITY_GUIDELINES.touchTargets.minimumSize
    );
    expect(style.minHeight).toBe(
      ACCESSIBILITY_GUIDELINES.touchTargets.minimumSize
    );
  });
});

describe("AccessibleText", () => {
  it("renders with proper accessibility properties", () => {
    const { getByText } = render(
      <AccessibleText accessibilityRole="header">Test Header</AccessibleText>
    );

    const text = getByText("Test Header");
    expect(text.props.accessibilityRole).toBe("header");
    expect(text.props.accessible).toBe(true);
  });

  it("enforces minimum font size", () => {
    const { getByText } = render(
      <AccessibleText fontSize={8}>Small Text</AccessibleText>
    );

    const text = getByText("Small Text");
    const style = text.props.style;

    // Should enforce minimum font size
    expect(style.fontSize).toBeGreaterThanOrEqual(
      ACCESSIBILITY_GUIDELINES.typography.minimumFontSize
    );
  });

  it("uses custom accessibility label when provided", () => {
    const { getByLabelText } = render(
      <AccessibleText accessibilityLabel="Custom Label">
        Display Text
      </AccessibleText>
    );

    expect(getByLabelText("Custom Label")).toBeTruthy();
  });

  it("applies warning styles for poor readability", () => {
    const { getByText } = render(
      <AccessibleText fontSize={10}>
        {"x".repeat(100)} {/* Long text with small font */}
      </AccessibleText>
    );

    const text = getByText(/x{100}/);
    const style = text.props.style;

    // Should have warning border for readability issues
    expect(style.borderLeftWidth).toBe(3);
    expect(style.borderLeftColor).toBe("#FF9500");
  });
});

describe("FocusableRegion", () => {
  it("renders with proper accessibility properties", () => {
    const { getByLabelText } = render(
      <FocusableRegion
        accessibilityLabel="Test Region"
        accessibilityRole="navigation"
      >
        <AccessibleText>Region Content</AccessibleText>
      </FocusableRegion>
    );

    const region = getByLabelText("Test Region");
    expect(region.props.accessibilityRole).toBe("navigation");
    expect(region.props.accessible).toBe(true);
  });

  it("contains child elements", () => {
    const { getByText, getByLabelText } = render(
      <FocusableRegion accessibilityLabel="Test Region">
        <AccessibleText>Child Content</AccessibleText>
      </FocusableRegion>
    );

    expect(getByLabelText("Test Region")).toBeTruthy();
    expect(getByText("Child Content")).toBeTruthy();
  });
});

describe("Color Contrast Testing", () => {
  it("passes high contrast combinations", () => {
    const result = testColorContrast("#000000", "#FFFFFF", "AA");
    expect(result.passed).toBe(true);
    expect(result.score).toBeGreaterThan(4.5);
  });

  it("fails low contrast combinations", () => {
    const result = testColorContrast("#CCCCCC", "#FFFFFF", "AA");
    expect(result.passed).toBe(false);
    expect(result.score).toBeLessThan(4.5);
  });

  it("respects different WCAG levels", () => {
    const resultAA = testColorContrast("#666666", "#FFFFFF", "AA");
    const resultAAA = testColorContrast("#666666", "#FFFFFF", "AAA");

    // Same colors might pass AA but fail AAA
    expect(resultAAA.threshold).toBeGreaterThan(resultAA.threshold);
  });

  it("provides meaningful feedback", () => {
    const result = testColorContrast("#999999", "#FFFFFF", "AA");
    expect(result.message).toContain("contrast ratio");
    expect(result.message).toContain("AA");
  });
});

describe("Touch Target Testing", () => {
  it("passes for adequate touch targets", () => {
    const result = testTouchTargetSize(48, 48);
    expect(result.passed).toBe(true);
    expect(result.message).toContain("recommended size");
  });

  it("passes minimum but warns for small targets", () => {
    const result = testTouchTargetSize(44, 44);
    expect(result.passed).toBe(true);
    expect(result.message).toContain("minimum requirements");
  });

  it("fails for too small touch targets", () => {
    const result = testTouchTargetSize(30, 30);
    expect(result.passed).toBe(false);
    expect(result.message).toContain("too small");
  });

  it("uses minimum dimension for rectangular targets", () => {
    const result = testTouchTargetSize(60, 30);
    expect(result.score).toBe(30); // Should use the smaller dimension
  });
});

describe("Text Readability Testing", () => {
  it("passes for readable text", () => {
    const result = testTextReadability("Short readable text", 16, 1.5);
    expect(result.passed).toBe(true);
  });

  it("fails for text that's too small", () => {
    const result = testTextReadability("Text", 10);
    expect(result.passed).toBe(false);
    expect(result.message).toContain("Font size");
  });

  it("fails for text that's too long", () => {
    const longText = "x".repeat(100);
    const result = testTextReadability(longText, 16);
    expect(result.passed).toBe(false);
    expect(result.message).toContain("Text length");
  });

  it("fails for insufficient line height", () => {
    const result = testTextReadability("Text", 16, 1.0);
    expect(result.passed).toBe(false);
    expect(result.message).toContain("Line height");
  });

  it("reports multiple issues", () => {
    const result = testTextReadability("x".repeat(100), 10, 1.0);
    expect(result.passed).toBe(false);
    expect(result.message).toContain("Font size");
    expect(result.message).toContain("Text length");
    expect(result.message).toContain("Line height");
  });
});

describe("Accessibility Info Utilities", () => {
  it("gets accessibility information", async () => {
    mockAccessibilityInfo.isScreenReaderEnabled.mockResolvedValue(true);
    mockAccessibilityInfo.isReduceMotionEnabled.mockResolvedValue(false);
    mockAccessibilityInfo.isReduceTransparencyEnabled.mockResolvedValue(true);

    const info = await getAccessibilityInfo();

    expect(info.screenReaderEnabled).toBe(true);
    expect(info.reduceMotionEnabled).toBe(false);
    expect(info.reduceTransparencyEnabled).toBe(true);
  });

  it("handles errors gracefully", async () => {
    mockAccessibilityInfo.isScreenReaderEnabled.mockRejectedValue(
      new Error("Test error")
    );

    const info = await getAccessibilityInfo();

    expect(info.screenReaderEnabled).toBe(false);
    expect(info.reduceMotionEnabled).toBe(false);
    expect(info.reduceTransparencyEnabled).toBe(false);
  });
});

describe("Props Validation", () => {
  it("identifies missing accessibility labels", () => {
    const props = { onPress: jest.fn() };
    const issues = validateAccessibilityProps(props);

    expect(issues).toHaveLength(2); // Missing label and role
    expect(issues[0].type).toBe("missing-label");
    expect(issues[1].type).toBe("missing-role");
  });

  it("passes for properly configured props", () => {
    const props = {
      onPress: jest.fn(),
      accessibilityLabel: "Button",
      accessibilityRole: "button",
    };
    const issues = validateAccessibilityProps(props);

    expect(issues).toHaveLength(0);
  });

  it("ignores non-interactive elements", () => {
    const props = { children: "Static text" };
    const issues = validateAccessibilityProps(props);

    expect(issues).toHaveLength(0);
  });
});

describe("WCAG Guidelines", () => {
  it("provides correct contrast requirements", () => {
    expect(ACCESSIBILITY_GUIDELINES.colorContrast.normalText).toBe(4.5);
    expect(ACCESSIBILITY_GUIDELINES.colorContrast.largeText).toBe(3.0);
  });

  it("provides correct touch target requirements", () => {
    expect(ACCESSIBILITY_GUIDELINES.touchTargets.minimumSize).toBe(44);
    expect(ACCESSIBILITY_GUIDELINES.touchTargets.recommendedSize).toBe(48);
  });

  it("provides correct typography requirements", () => {
    expect(ACCESSIBILITY_GUIDELINES.typography.minimumFontSize).toBe(12);
    expect(ACCESSIBILITY_GUIDELINES.typography.minimumLineHeight).toBe(1.5);
  });

  it("includes all required guideline categories", () => {
    expect(ACCESSIBILITY_GUIDELINES).toHaveProperty("colorContrast");
    expect(ACCESSIBILITY_GUIDELINES).toHaveProperty("touchTargets");
    expect(ACCESSIBILITY_GUIDELINES).toHaveProperty("typography");
    expect(ACCESSIBILITY_GUIDELINES).toHaveProperty("focus");
    expect(ACCESSIBILITY_GUIDELINES).toHaveProperty("screenReader");
    expect(ACCESSIBILITY_GUIDELINES).toHaveProperty("animation");
  });
});

describe("Integration Tests", () => {
  it("works with real calendar components", async () => {
    const { getByTestId } = render(
      <AccessibilityAudit testID="calendar-audit">
        <FocusableRegion accessibilityLabel="Calendar">
          <AccessibleButton
            onPress={jest.fn()}
            accessibilityLabel="Previous Month"
          >
            <AccessibleText>‹</AccessibleText>
          </AccessibleButton>
          <AccessibleText accessibilityRole="header">
            January 2024
          </AccessibleText>
          <AccessibleButton onPress={jest.fn()} accessibilityLabel="Next Month">
            <AccessibleText>›</AccessibleText>
          </AccessibleButton>
        </FocusableRegion>
      </AccessibilityAudit>
    );

    const audit = getByTestId("calendar-audit");
    expect(audit).toBeTruthy();

    // Verify all interactive elements are accessible
    expect(() => {
      render(
        <AccessibilityAudit>
          <AccessibleButton onPress={jest.fn()} accessibilityLabel="Test">
            <AccessibleText>Test</AccessibleText>
          </AccessibleButton>
        </AccessibilityAudit>
      );
    }).not.toThrow();
  });

  it("handles complex nested structures", () => {
    const { getByLabelText } = render(
      <AccessibilityAudit>
        <FocusableRegion accessibilityLabel="Calendar Grid">
          <FocusableRegion accessibilityLabel="Week 1">
            <AccessibleButton
              onPress={jest.fn()}
              accessibilityLabel="January 1st, 2024"
            >
              <AccessibleText>1</AccessibleText>
            </AccessibleButton>
          </FocusableRegion>
        </FocusableRegion>
      </AccessibilityAudit>
    );

    expect(getByLabelText("Calendar Grid")).toBeTruthy();
    expect(getByLabelText("Week 1")).toBeTruthy();
    expect(getByLabelText("January 1st, 2024")).toBeTruthy();
  });
});
