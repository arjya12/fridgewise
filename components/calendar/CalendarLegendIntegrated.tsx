// CalendarLegendIntegrated - Integrated legend with consistent color mapping
// Addresses visual consistency issues from UI/UX critique

import React, { useCallback, useMemo } from "react";
import {
  Animated,
  StyleSheet,
  Text,
  TextStyle,
  TouchableOpacity,
  View,
  ViewStyle,
} from "react-native";
import { useThemeColor } from "../../hooks/useThemeColor";
import {
  CalendarLegendIntegratedProps,
  LegendItemCounts,
  LegendItemEnhanced,
  PatternIndicator,
} from "../../types/calendar-enhanced";
import {
  calculateLegendCounts,
  generatePatternIndicators,
} from "../../utils/calendarEnhancedDataUtils";
import { useCalendarColorScheme } from "./ColorSchemeProvider";
import ItemCountIndicator, { CompactIndicator } from "./ItemCountIndicator";

// =============================================================================
// MAIN COMPONENT
// =============================================================================

const CalendarLegendIntegrated: React.FC<CalendarLegendIntegratedProps> = ({
  position = "bottom",
  compact = false,
  showPatterns = false,
  colorScheme: propColorScheme,
  itemCounts,
  accessibility = true,
  items = [],
  onLegendItemPress,
  style,
  testID = "calendar-legend-integrated",
}) => {
  const { colorScheme: contextColorScheme } = useCalendarColorScheme();
  // const accessibilityFeatures = useAccessibilityFeatures(); // Unused for now

  // Use prop color scheme or context color scheme
  const activeColorScheme = propColorScheme || contextColorScheme;

  // Theme colors
  const backgroundColor = useThemeColor(
    { light: "#F8F9FA", dark: "#1C1C1E" },
    "background"
  );
  const textColor = useThemeColor(
    { light: "#374151", dark: "#D1D5DB" },
    "text"
  );
  const borderColor = useThemeColor(
    { light: "#E5E7EB", dark: "#374151" },
    "text"
  );

  // Calculate item counts if not provided
  const legendCounts = useMemo(() => {
    if (itemCounts) {
      return itemCounts;
    }
    return calculateLegendCounts(items, activeColorScheme);
  }, [itemCounts, items, activeColorScheme]);

  // Generate legend items with enhanced information
  const legendItems = useMemo((): LegendItemEnhanced[] => {
    const baseItems: LegendItemEnhanced[] = [
      {
        key: "expired",
        color: activeColorScheme.expired.primary,
        label: "Expired",
        count: legendCounts.expired,
        accessibilityLabel: `${legendCounts.expired} expired items`,
        pattern: showPatterns
          ? generatePatternIndicators("expired", activeColorScheme)[0]
          : undefined,
      },
      {
        key: "today",
        color: activeColorScheme.today.primary,
        label: "Today",
        count: legendCounts.today,
        accessibilityLabel: `${legendCounts.today} items expiring today`,
        pattern: showPatterns
          ? generatePatternIndicators("today", activeColorScheme)[0]
          : undefined,
      },
      {
        key: "future",
        color: activeColorScheme.future.primary,
        label: "Future",
        count: legendCounts.future,
        accessibilityLabel: `${legendCounts.future} items expiring in the future`,
        pattern: showPatterns
          ? generatePatternIndicators("future", activeColorScheme)[0]
          : undefined,
      },
    ];

    // Filter out items with zero count in compact mode
    if (compact) {
      return baseItems.filter((item) => item.count && item.count > 0);
    }

    return baseItems;
  }, [activeColorScheme, legendCounts, showPatterns, compact]);

  // Container styles based on position and mode
  const containerStyle = useMemo((): ViewStyle => {
    const baseStyle: ViewStyle = {
      backgroundColor,
      borderRadius: compact ? 8 : 12,
      paddingHorizontal: compact ? 12 : 16,
      paddingVertical: compact ? 8 : 12,
    };

    switch (position) {
      case "top":
        return {
          ...baseStyle,
          marginBottom: 12,
          borderBottomWidth: StyleSheet.hairlineWidth,
          borderBottomColor: borderColor,
        };
      case "bottom":
        return {
          ...baseStyle,
          marginTop: 12,
          borderTopWidth: StyleSheet.hairlineWidth,
          borderTopColor: borderColor,
        };
      case "inline":
        return {
          ...baseStyle,
          marginVertical: 8,
        };
      case "floating":
        return {
          ...baseStyle,
          position: "absolute",
          top: 16,
          right: 16,
          elevation: 4,
          shadowColor: "#000000",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
          zIndex: 10,
        };
      default:
        return baseStyle;
    }
  }, [position, compact, backgroundColor, borderColor]);

  const legendContainerStyle = useMemo((): ViewStyle => {
    return {
      flexDirection: compact ? "row" : "row",
      justifyContent: compact ? "center" : "space-around",
      alignItems: "center",
      flexWrap: compact ? "wrap" : "nowrap",
      gap: compact ? 8 : 16,
    };
  }, [compact]);

  // Handle legend item press
  const handleLegendItemPress = useCallback(
    (item: LegendItemEnhanced) => {
      onLegendItemPress?.(item);
    },
    [onLegendItemPress]
  );

  return (
    <View
      style={[containerStyle, style]}
      testID={testID}
      accessible={true}
      accessibilityRole="group"
      accessibilityLabel="Calendar legend"
      accessibilityHint="Shows color coding for expiry dates"
    >
      <View style={legendContainerStyle}>
        {legendItems.map((item) => (
          <LegendItem
            key={item.key}
            item={item}
            compact={compact}
            showPatterns={showPatterns}
            accessibilityEnhanced={accessibility}
            onPress={
              onLegendItemPress ? () => handleLegendItemPress(item) : undefined
            }
          />
        ))}
      </View>

      {/* Total count in compact mode */}
      {compact && legendCounts.total > 0 && (
        <View style={styles.totalCount}>
          <Text style={[styles.totalText, { color: textColor }]}>
            Total: {legendCounts.total}
          </Text>
        </View>
      )}
    </View>
  );
};

// =============================================================================
// LEGEND ITEM COMPONENT
// =============================================================================

interface LegendItemProps {
  item: LegendItemEnhanced;
  compact: boolean;
  showPatterns: boolean;
  accessibilityEnhanced: boolean;
  onPress?: () => void;
}

const LegendItem: React.FC<LegendItemProps> = ({
  item,
  compact,
  showPatterns,
  accessibilityEnhanced,
  onPress,
}) => {
  const textColor = useThemeColor(
    { light: "#374151", dark: "#D1D5DB" },
    "text"
  );

  const itemContainerStyle = useMemo((): ViewStyle => {
    const baseStyle: ViewStyle = {
      flexDirection: "row",
      alignItems: "center",
      gap: compact ? 4 : 6,
      paddingHorizontal: compact ? 6 : 8,
      paddingVertical: compact ? 4 : 6,
      borderRadius: 6,
      minHeight: 32,
    };

    if (onPress) {
      baseStyle.backgroundColor = "rgba(0,0,0,0.05)";
    }

    return baseStyle;
  }, [compact, onPress]);

  const indicatorContainerStyle = useMemo((): ViewStyle => {
    return {
      position: "relative",
      width: compact ? 12 : 16,
      height: compact ? 12 : 16,
      borderRadius: compact ? 6 : 8,
      backgroundColor: item.color,
      justifyContent: "center",
      alignItems: "center",
    };
  }, [compact, item.color]);

  const labelStyle = useMemo((): TextStyle => {
    return {
      fontSize: compact ? 12 : 14,
      fontWeight: "500",
      color: textColor,
      marginRight: compact ? 4 : 6,
    };
  }, [compact, textColor]);

  const ItemComponent = onPress ? TouchableOpacity : View;

  return (
    <ItemComponent
      style={itemContainerStyle}
      onPress={onPress}
      accessible={true}
      accessibilityRole={onPress ? "button" : "text"}
      accessibilityLabel={item.accessibilityLabel}
      accessibilityHint={onPress ? "Tap to filter by this category" : undefined}
    >
      {/* Color indicator with optional pattern */}
      <View style={indicatorContainerStyle}>
        {showPatterns && item.pattern && (
          <PatternOverlay pattern={item.pattern} size={compact ? 12 : 16} />
        )}
      </View>

      {/* Label */}
      <Text style={labelStyle}>{item.label}</Text>

      {/* Count indicator */}
      {item.count !== undefined && item.count > 0 && (
        <View style={styles.countContainer}>
          {compact ? (
            <CompactIndicator
              totalCount={item.count}
              urgencyLevel={
                item.key === "expired"
                  ? "critical"
                  : item.key === "today"
                  ? "high"
                  : "medium"
              }
            />
          ) : (
            <ItemCountIndicator
              count={item.count}
              type={item.key as "expired" | "today" | "future"}
              size="small"
              position="center"
            />
          )}
        </View>
      )}
    </ItemComponent>
  );
};

// =============================================================================
// PATTERN OVERLAY COMPONENT
// =============================================================================

interface PatternOverlayProps {
  pattern: PatternIndicator;
  size: number;
}

const PatternOverlay: React.FC<PatternOverlayProps> = ({ pattern, size }) => {
  const patternStyle = useMemo((): ViewStyle => {
    const baseStyle: ViewStyle = {
      position: "absolute",
      width: size,
      height: size,
      borderRadius: size / 2,
    };

    switch (pattern.type) {
      case "striped":
        return {
          ...baseStyle,
          backgroundColor: "transparent",
          borderWidth: 1,
          borderColor: pattern.color,
          borderStyle: "dashed",
        };
      case "dotted":
        return {
          ...baseStyle,
          backgroundColor: "transparent",
          borderWidth: 2,
          borderColor: pattern.color,
        };
      case "solid":
      default:
        return {
          ...baseStyle,
          backgroundColor: `${pattern.color}20`, // 20% opacity overlay
        };
    }
  }, [pattern, size]);

  return <View style={patternStyle} />;
};

// =============================================================================
// UTILITY COMPONENTS
// =============================================================================

/**
 * Minimal legend for very compact spaces
 */
interface MinimalLegendProps {
  colorScheme: any;
  itemCounts: LegendItemCounts;
}

export const MinimalLegend: React.FC<MinimalLegendProps> = ({
  colorScheme,
  itemCounts,
}) => {
  return (
    <View style={styles.minimalContainer}>
      <View style={styles.minimalDots}>
        <View
          style={[
            styles.minimalDot,
            { backgroundColor: colorScheme.expired.primary },
          ]}
        />
        <View
          style={[
            styles.minimalDot,
            { backgroundColor: colorScheme.today.primary },
          ]}
        />
        <View
          style={[
            styles.minimalDot,
            { backgroundColor: colorScheme.future.primary },
          ]}
        />
      </View>
      <Text style={styles.minimalText}>{itemCounts.total} items</Text>
    </View>
  );
};

/**
 * Interactive legend with filtering capabilities
 */
interface InteractiveLegendProps extends CalendarLegendIntegratedProps {
  activeFilters?: string[];
  onFilterToggle?: (filter: string) => void;
}

export const InteractiveLegend: React.FC<InteractiveLegendProps> = ({
  activeFilters = [],
  onFilterToggle,
  ...props
}) => {
  const handleLegendItemPress = useCallback(
    (item: LegendItemEnhanced) => {
      onFilterToggle?.(item.key);
    },
    [onFilterToggle]
  );

  return (
    <CalendarLegendIntegrated
      {...props}
      onLegendItemPress={handleLegendItemPress}
      style={[styles.interactiveLegend, props.style]}
    />
  );
};

/**
 * Animated legend that can show/hide
 */
interface AnimatedLegendProps extends CalendarLegendIntegratedProps {
  visible?: boolean;
  animationDuration?: number;
}

export const AnimatedLegend: React.FC<AnimatedLegendProps> = ({
  visible = true,
  animationDuration = 300,
  ...props
}) => {
  const animatedValue = React.useMemo(
    () => new Animated.Value(visible ? 1 : 0),
    []
  );

  React.useEffect(() => {
    Animated.timing(animatedValue, {
      toValue: visible ? 1 : 0,
      duration: animationDuration,
      useNativeDriver: true,
    }).start();
  }, [visible, animationDuration, animatedValue]);

  return (
    <Animated.View
      style={[
        {
          opacity: animatedValue,
          transform: [
            {
              translateY: animatedValue.interpolate({
                inputRange: [0, 1],
                outputRange: [-20, 0],
              }),
            },
          ],
        },
      ]}
    >
      <CalendarLegendIntegrated {...props} />
    </Animated.View>
  );
};

// =============================================================================
// STYLES
// =============================================================================

const styles = StyleSheet.create({
  totalCount: {
    marginTop: 8,
    alignItems: "center",
  },
  totalText: {
    fontSize: 12,
    fontWeight: "500",
    opacity: 0.7,
  },
  countContainer: {
    marginLeft: 4,
  },
  minimalContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  minimalDots: {
    flexDirection: "row",
    gap: 4,
  },
  minimalDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  minimalText: {
    fontSize: 12,
    fontWeight: "500",
    color: "#666666",
  },
  interactiveLegend: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
});

// =============================================================================
// EXPORT
// =============================================================================

CalendarLegendIntegrated.displayName = "CalendarLegendIntegrated";
MinimalLegend.displayName = "MinimalLegend";
InteractiveLegend.displayName = "InteractiveLegend";
AnimatedLegend.displayName = "AnimatedLegend";

export default CalendarLegendIntegrated;
