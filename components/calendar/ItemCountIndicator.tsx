// ItemCountIndicator - Visual indicators for item counts on calendar dates
// Supports accessibility patterns and multiple display styles

import React, { useMemo } from "react";
import { StyleSheet, Text, TextStyle, View, ViewStyle } from "react-native";
import {
  ItemCountIndicatorProps,
  PatternIndicator,
} from "../../types/calendar-enhanced";
import {
  useCalendarColorScheme,
  useExpiryColors,
  withOpacity,
} from "./ColorSchemeProvider";

// =============================================================================
// MAIN COMPONENT
// =============================================================================

const ItemCountIndicator: React.FC<ItemCountIndicatorProps> = ({
  count,
  type,
  size = "medium",
  position = "corner",
  maxDisplayCount = 99,
  showPattern = false,
  accessibilityLabel,
}) => {
  const { colorScheme, isHighContrast } = useCalendarColorScheme();
  const expiryColors = useExpiryColors(type);

  // Calculate display count and text
  const displayCount = useMemo(() => {
    if (count <= maxDisplayCount) {
      return count.toString();
    }
    return `${maxDisplayCount}+`;
  }, [count, maxDisplayCount]);

  // Generate accessibility label
  const generatedAccessibilityLabel = useMemo(() => {
    if (accessibilityLabel) {
      return accessibilityLabel;
    }

    const typeText =
      type === "expired"
        ? "expired"
        : type === "today"
        ? "expiring today"
        : "expiring soon";
    const itemText = count === 1 ? "item" : "items";
    return `${count} ${itemText} ${typeText}`;
  }, [accessibilityLabel, count, type]);

  // Generate pattern indicators if needed
  const patterns = useMemo(() => {
    if (!showPattern || !colorScheme.accessibility.patterns) {
      return [];
    }

    const pattern: PatternIndicator = {
      type:
        type === "expired" ? "striped" : type === "today" ? "dotted" : "solid",
      color: expiryColors.primary,
      size: size === "small" ? 2 : size === "medium" ? 3 : 4,
      position: "center",
    };

    return [pattern];
  }, [
    showPattern,
    colorScheme.accessibility.patterns,
    type,
    expiryColors.primary,
    size,
  ]);

  // Calculate styles based on props
  const containerStyle = useMemo((): ViewStyle => {
    const baseSize = size === "small" ? 16 : size === "medium" ? 20 : 24;
    const backgroundColor = isHighContrast
      ? expiryColors.primary
      : withOpacity(expiryColors.primary, 0.9);

    const baseStyle: ViewStyle = {
      width: baseSize,
      height: baseSize,
      backgroundColor,
      borderRadius: baseSize / 2,
      justifyContent: "center",
      alignItems: "center",
      minWidth: baseSize,
    };

    // Position-specific styles
    switch (position) {
      case "corner":
        return {
          ...baseStyle,
          position: "absolute",
          top: -4,
          right: -4,
          zIndex: 10,
        };
      case "center":
        return {
          ...baseStyle,
          alignSelf: "center",
        };
      case "badge":
        return {
          ...baseStyle,
          position: "absolute",
          top: -8,
          right: -8,
          borderWidth: 2,
          borderColor: "#FFFFFF",
          zIndex: 10,
        };
      default:
        return baseStyle;
    }
  }, [size, position, isHighContrast, expiryColors.primary]);

  const textStyle = useMemo((): TextStyle => {
    const fontSize = size === "small" ? 10 : size === "medium" ? 12 : 14;
    const fontWeight = isHighContrast ? "bold" : "600";

    return {
      fontSize,
      fontWeight,
      color: "#FFFFFF",
      textAlign: "center",
      includeFontPadding: false,
    };
  }, [size, isHighContrast]);

  // Don't render if count is 0
  if (count <= 0) {
    return null;
  }

  return (
    <View
      style={containerStyle}
      accessible={true}
      accessibilityRole="text"
      accessibilityLabel={generatedAccessibilityLabel}
      accessibilityHint="Number of food items"
      testID={`item-count-indicator-${type}-${count}`}
    >
      {/* Pattern overlay if enabled */}
      {patterns.length > 0 && (
        <PatternOverlay
          patterns={patterns}
          containerSize={containerStyle.width as number}
        />
      )}

      {/* Count text */}
      <Text style={textStyle} numberOfLines={1} adjustsFontSizeToFit>
        {displayCount}
      </Text>
    </View>
  );
};

// =============================================================================
// PATTERN OVERLAY COMPONENT
// =============================================================================

interface PatternOverlayProps {
  patterns: PatternIndicator[];
  containerSize: number;
}

const PatternOverlay: React.FC<PatternOverlayProps> = ({
  patterns,
  containerSize,
}) => {
  return (
    <View style={StyleSheet.absoluteFill}>
      {patterns.map((pattern, index) => (
        <PatternElement
          key={`pattern-${index}`}
          pattern={pattern}
          containerSize={containerSize}
        />
      ))}
    </View>
  );
};

// =============================================================================
// PATTERN ELEMENT COMPONENT
// =============================================================================

interface PatternElementProps {
  pattern: PatternIndicator;
  containerSize: number;
}

const PatternElement: React.FC<PatternElementProps> = ({
  pattern,
  containerSize,
}) => {
  const patternStyle = useMemo((): ViewStyle => {
    const baseStyle: ViewStyle = {
      position: "absolute",
      borderRadius: containerSize / 2,
    };

    switch (pattern.type) {
      case "striped":
        return {
          ...baseStyle,
          width: "100%",
          height: pattern.size,
          backgroundColor: withOpacity(pattern.color, 0.3),
          top: "50%",
          marginTop: -pattern.size / 2,
        };
      case "dotted":
        return {
          ...baseStyle,
          width: pattern.size,
          height: pattern.size,
          backgroundColor: withOpacity(pattern.color, 0.5),
          borderRadius: pattern.size / 2,
          top: "50%",
          left: "50%",
          marginTop: -pattern.size / 2,
          marginLeft: -pattern.size / 2,
        };
      case "dashed":
        return {
          ...baseStyle,
          width: "80%",
          height: 1,
          backgroundColor: withOpacity(pattern.color, 0.4),
          top: "50%",
          left: "10%",
          marginTop: -0.5,
        };
      case "solid":
      default:
        return {
          ...baseStyle,
          width: "100%",
          height: "100%",
          backgroundColor: withOpacity(pattern.color, 0.1),
        };
    }
  }, [pattern, containerSize]);

  return <View style={patternStyle} />;
};

// =============================================================================
// UTILITY COMPONENTS
// =============================================================================

/**
 * Multiple indicators for complex date states
 */
interface MultipleIndicatorsProps {
  indicators: {
    count: number;
    type: "expired" | "today" | "future";
  }[];
  size?: "small" | "medium" | "large";
  maxVisible?: number;
}

export const MultipleIndicators: React.FC<MultipleIndicatorsProps> = ({
  indicators,
  size = "small",
  maxVisible = 3,
}) => {
  const visibleIndicators = indicators.slice(0, maxVisible);
  const hasMore = indicators.length > maxVisible;

  return (
    <View style={styles.multipleContainer}>
      {visibleIndicators.map((indicator, index) => (
        <View
          key={`indicator-${indicator.type}-${index}`}
          style={[
            styles.multipleItem,
            {
              marginLeft: index > 0 ? -4 : 0,
              zIndex: visibleIndicators.length - index,
            },
          ]}
        >
          <ItemCountIndicator
            count={indicator.count}
            type={indicator.type}
            size={size}
            position="center"
          />
        </View>
      ))}
      {hasMore && (
        <View style={[styles.multipleItem, { marginLeft: -4, zIndex: 0 }]}>
          <View style={styles.moreIndicator}>
            <Text style={styles.moreText}>...</Text>
          </View>
        </View>
      )}
    </View>
  );
};

/**
 * Compact indicator for small spaces
 */
interface CompactIndicatorProps {
  totalCount: number;
  urgencyLevel: "critical" | "high" | "medium" | "low";
}

export const CompactIndicator: React.FC<CompactIndicatorProps> = ({
  totalCount,
  urgencyLevel,
}) => {
  const { colorScheme } = useCalendarColorScheme();

  const indicatorColor = useMemo(() => {
    switch (urgencyLevel) {
      case "critical":
        return colorScheme.expired.primary;
      case "high":
        return colorScheme.today.primary;
      case "medium":
      case "low":
      default:
        return colorScheme.future.primary;
    }
  }, [urgencyLevel, colorScheme]);

  const accessibilityLabel = useMemo(() => {
    const urgencyText =
      urgencyLevel === "critical"
        ? "critical"
        : urgencyLevel === "high"
        ? "high priority"
        : urgencyLevel === "medium"
        ? "medium priority"
        : "low priority";
    return `${totalCount} items, ${urgencyText}`;
  }, [totalCount, urgencyLevel]);

  if (totalCount <= 0) {
    return null;
  }

  return (
    <View
      style={[styles.compactIndicator, { backgroundColor: indicatorColor }]}
      accessible={true}
      accessibilityRole="text"
      accessibilityLabel={accessibilityLabel}
    >
      <Text style={styles.compactText}>
        {totalCount > 99 ? "99+" : totalCount}
      </Text>
    </View>
  );
};

// =============================================================================
// STYLES
// =============================================================================

const styles = StyleSheet.create({
  multipleContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  multipleItem: {
    position: "relative",
  },
  moreIndicator: {
    width: 16,
    height: 16,
    backgroundColor: "#666666",
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  moreText: {
    fontSize: 10,
    color: "#FFFFFF",
    fontWeight: "600",
  },
  compactIndicator: {
    minWidth: 14,
    height: 14,
    borderRadius: 7,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 2,
  },
  compactText: {
    fontSize: 9,
    color: "#FFFFFF",
    fontWeight: "600",
    textAlign: "center",
    includeFontPadding: false,
  },
});

// =============================================================================
// EXPORT
// =============================================================================

ItemCountIndicator.displayName = "ItemCountIndicator";
MultipleIndicators.displayName = "MultipleIndicators";
CompactIndicator.displayName = "CompactIndicator";

export default ItemCountIndicator;
