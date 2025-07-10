/**
 * Enhanced Calendar Date Button
 * Implements multi-dot indicators with accessibility features
 * Based on Phase 1 calendar library validation
 */

import React, { useCallback, useMemo } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useThemeColor } from "../hooks/useThemeColor";
import { FoodItem } from "../lib/supabase";

// =============================================================================
// INTERFACES
// =============================================================================

export interface EnhancedCalendarDateButtonProps {
  date: string;
  items: FoodItem[];
  selected: boolean;
  today: boolean;
  onPress: (date: string) => void;
  disabled?: boolean;
  showIndicators?: boolean;
  maxIndicators?: number;
  enableAccessibility?: boolean;
  compactMode?: boolean;
}

export interface DateIndicator {
  color: string;
  urgency: "expired" | "today" | "soon" | "safe";
  count: number;
  pattern?: "solid" | "striped" | "dotted";
}

export interface IndicatorConfig {
  expired: { color: string; pattern: "solid" };
  today: { color: string; pattern: "striped" };
  soon: { color: string; pattern: "dotted" };
  safe: { color: string; pattern: "solid" };
}

// =============================================================================
// CONFIGURATION
// =============================================================================

const INDICATOR_CONFIG: IndicatorConfig = {
  expired: { color: "#DC2626", pattern: "solid" },
  today: { color: "#EA580C", pattern: "striped" },
  soon: { color: "#D97706", pattern: "dotted" },
  safe: { color: "#16A34A", pattern: "solid" },
};

const DOT_SIZE = 6;
const DOT_SPACING = 2;
const MAX_DOTS_DEFAULT = 4;

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function EnhancedCalendarDateButton({
  date,
  items,
  selected,
  today,
  onPress,
  disabled = false,
  showIndicators = true,
  maxIndicators = MAX_DOTS_DEFAULT,
  enableAccessibility = true,
  compactMode = false,
}: EnhancedCalendarDateButtonProps) {
  // =============================================================================
  // THEME COLORS
  // =============================================================================

  const backgroundColor = useThemeColor({}, "background");
  const textColor = useThemeColor({}, "text");
  const tintColor = useThemeColor({}, "tint");
  const borderColor = useThemeColor({}, "icon");

  // =============================================================================
  // DATE PROCESSING
  // =============================================================================

  const dayNumber = useMemo(() => {
    return parseInt(date.split("-")[2], 10);
  }, [date]);

  // =============================================================================
  // INDICATOR CALCULATION
  // =============================================================================

  const indicators = useMemo((): DateIndicator[] => {
    if (!showIndicators || items.length === 0) return [];

    const today = new Date().toISOString().split("T")[0];
    const threeDaysFromNow = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0];

    const categorizedItems = {
      expired: items.filter(
        (item) => item.expiry_date && item.expiry_date < today
      ),
      today: items.filter((item) => item.expiry_date === today),
      soon: items.filter(
        (item) =>
          item.expiry_date &&
          item.expiry_date > today &&
          item.expiry_date <= threeDaysFromNow
      ),
      safe: items.filter(
        (item) => item.expiry_date && item.expiry_date > threeDaysFromNow
      ),
    };

    const result: DateIndicator[] = [];

    // Add indicators in order of urgency
    if (categorizedItems.expired.length > 0) {
      result.push({
        color: INDICATOR_CONFIG.expired.color,
        urgency: "expired",
        count: categorizedItems.expired.length,
        pattern: INDICATOR_CONFIG.expired.pattern,
      });
    }

    if (categorizedItems.today.length > 0) {
      result.push({
        color: INDICATOR_CONFIG.today.color,
        urgency: "today",
        count: categorizedItems.today.length,
        pattern: INDICATOR_CONFIG.today.pattern,
      });
    }

    if (categorizedItems.soon.length > 0) {
      result.push({
        color: INDICATOR_CONFIG.soon.color,
        urgency: "soon",
        count: categorizedItems.soon.length,
        pattern: INDICATOR_CONFIG.soon.pattern,
      });
    }

    if (categorizedItems.safe.length > 0) {
      result.push({
        color: INDICATOR_CONFIG.safe.color,
        urgency: "safe",
        count: categorizedItems.safe.length,
        pattern: INDICATOR_CONFIG.safe.pattern,
      });
    }

    return result.slice(0, maxIndicators);
  }, [items, showIndicators, maxIndicators, date]);

  // =============================================================================
  // ACCESSIBILITY
  // =============================================================================

  const accessibilityLabel = useMemo(() => {
    if (!enableAccessibility) return undefined;

    let label = `${dayNumber}`;

    if (today) label += ", today";
    if (selected) label += ", selected";

    if (items.length > 0) {
      label += `, ${items.length} item${items.length === 1 ? "" : "s"}`;

      const expiredCount =
        indicators.find((i) => i.urgency === "expired")?.count || 0;
      const todayCount =
        indicators.find((i) => i.urgency === "today")?.count || 0;
      const soonCount =
        indicators.find((i) => i.urgency === "soon")?.count || 0;

      if (expiredCount > 0) {
        label += `, ${expiredCount} expired`;
      }
      if (todayCount > 0) {
        label += `, ${todayCount} expiring today`;
      }
      if (soonCount > 0) {
        label += `, ${soonCount} expiring soon`;
      }
    }

    return label;
  }, [
    dayNumber,
    today,
    selected,
    items.length,
    indicators,
    enableAccessibility,
  ]);

  const accessibilityHint = useMemo(() => {
    if (!enableAccessibility) return undefined;
    return "Double tap to select this date and view items";
  }, [enableAccessibility]);

  // =============================================================================
  // HANDLERS
  // =============================================================================

  const handlePress = useCallback(() => {
    if (!disabled) {
      onPress(date);
    }
  }, [date, onPress, disabled]);

  // =============================================================================
  // STYLES
  // =============================================================================

  const containerStyle = useMemo(
    () => [
      styles.container,
      compactMode && styles.containerCompact,
      {
        backgroundColor: selected ? tintColor : "transparent",
        borderColor: today ? tintColor : "transparent",
      },
      today && !selected && styles.todayBorder,
      disabled && styles.disabled,
    ],
    [selected, today, tintColor, disabled, compactMode]
  );

  const textStyle = useMemo(
    () => [
      styles.dayText,
      compactMode && styles.dayTextCompact,
      {
        color: selected ? backgroundColor : textColor,
      },
      today && !selected && { color: tintColor, fontWeight: "600" as const },
      disabled && styles.disabledText,
    ],
    [
      selected,
      today,
      backgroundColor,
      textColor,
      tintColor,
      disabled,
      compactMode,
    ]
  );

  // =============================================================================
  // RENDER INDICATORS
  // =============================================================================

  const renderIndicators = useCallback(() => {
    if (!showIndicators || indicators.length === 0) {
      return null;
    }

    const totalWidth =
      indicators.length * DOT_SIZE + (indicators.length - 1) * DOT_SPACING;

    return (
      <View style={[styles.indicatorsContainer, { width: totalWidth }]}>
        {indicators.map((indicator, index) => (
          <View
            key={`${indicator.urgency}-${index}`}
            style={[
              styles.indicator,
              {
                backgroundColor: indicator.color,
                width: DOT_SIZE,
                height: DOT_SIZE,
              },
              indicator.pattern === "striped" && styles.stripedIndicator,
              indicator.pattern === "dotted" && styles.dottedIndicator,
            ]}
          />
        ))}
      </View>
    );
  }, [showIndicators, indicators]);

  const renderItemCount = useCallback(() => {
    if (!items.length || indicators.length === 0) return null;

    const totalCount = items.length;
    if (totalCount <= maxIndicators) return null;

    return (
      <View style={[styles.countBadge, { backgroundColor: borderColor }]}>
        <Text style={[styles.countText, { color: textColor }]}>
          {totalCount > 99 ? "99+" : totalCount}
        </Text>
      </View>
    );
  }, [items.length, indicators.length, maxIndicators, borderColor, textColor]);

  // =============================================================================
  // RENDER
  // =============================================================================

  return (
    <TouchableOpacity
      style={containerStyle}
      onPress={handlePress}
      disabled={disabled}
      accessible={enableAccessibility}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ selected, disabled }}
      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
    >
      <View style={styles.content}>
        {/* Day Number */}
        <Text style={textStyle}>{dayNumber}</Text>

        {/* Indicators */}
        {renderIndicators()}

        {/* Item Count Badge (for overflow) */}
        {renderItemCount()}
      </View>
    </TouchableOpacity>
  );
}

// =============================================================================
// MULTI-DOT INDICATOR COMPONENT
// =============================================================================

export interface MultiDotIndicatorProps {
  indicators: DateIndicator[];
  maxDots?: number;
  size?: number;
  spacing?: number;
  showCount?: boolean;
}

export function MultiDotIndicator({
  indicators,
  maxDots = MAX_DOTS_DEFAULT,
  size = DOT_SIZE,
  spacing = DOT_SPACING,
  showCount = false,
}: MultiDotIndicatorProps) {
  const visibleIndicators = indicators.slice(0, maxDots);
  const totalCount = indicators.reduce(
    (sum, indicator) => sum + indicator.count,
    0
  );
  const hasOverflow = indicators.length > maxDots;

  return (
    <View style={styles.multiDotContainer}>
      <View style={[styles.dotsRow, { gap: spacing }]}>
        {visibleIndicators.map((indicator, index) => (
          <View
            key={`${indicator.urgency}-${index}`}
            style={[
              styles.dot,
              {
                backgroundColor: indicator.color,
                width: size,
                height: size,
                borderRadius: size / 2,
              },
              indicator.pattern === "striped" && styles.stripedDot,
              indicator.pattern === "dotted" && styles.dottedDot,
            ]}
          />
        ))}

        {hasOverflow && (
          <View
            style={[
              styles.overflowDot,
              { width: size, height: size, borderRadius: size / 2 },
            ]}
          >
            <Text style={[styles.overflowText, { fontSize: size * 0.6 }]}>
              +
            </Text>
          </View>
        )}
      </View>

      {showCount && totalCount > 0 && (
        <Text style={styles.countLabel}>{totalCount}</Text>
      )}
    </View>
  );
}

// =============================================================================
// STYLES
// =============================================================================

const styles = StyleSheet.create({
  container: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "transparent",
    justifyContent: "center",
    alignItems: "center",
    margin: 1,
  },
  containerCompact: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  todayBorder: {
    borderWidth: 2,
  },
  disabled: {
    opacity: 0.3,
  },
  content: {
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
  },
  dayText: {
    fontSize: 16,
    fontWeight: "500",
    textAlign: "center",
  },
  dayTextCompact: {
    fontSize: 14,
  },
  disabledText: {
    opacity: 0.5,
  },
  indicatorsContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: DOT_SPACING,
    height: 8,
  },
  indicator: {
    borderRadius: DOT_SIZE / 2,
  },
  stripedIndicator: {
    // Note: React Native doesn't support CSS-like striped patterns
    // This would need a custom implementation or SVG
    opacity: 0.8,
  },
  dottedIndicator: {
    // Note: React Native doesn't support CSS-like dotted patterns
    // This would need a custom implementation or SVG
    opacity: 0.6,
  },
  countBadge: {
    position: "absolute",
    top: -4,
    right: -4,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 4,
  },
  countText: {
    fontSize: 10,
    fontWeight: "600",
  },
  // Multi-dot indicator styles
  multiDotContainer: {
    alignItems: "center",
    gap: 2,
  },
  dotsRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  dot: {
    // Base dot styles
  },
  stripedDot: {
    opacity: 0.8,
  },
  dottedDot: {
    opacity: 0.6,
  },
  overflowDot: {
    backgroundColor: "#666",
    justifyContent: "center",
    alignItems: "center",
  },
  overflowText: {
    color: "white",
    fontWeight: "bold",
  },
  countLabel: {
    fontSize: 10,
    color: "#666",
    fontWeight: "500",
  },
});
