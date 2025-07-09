// EnhancedCalendarCore - Core calendar component with enhanced features
// Integrates Phase 2 components with existing calendar functionality

import React, { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  StyleSheet,
  View,
  ViewStyle,
} from "react-native";
import { Calendar, CalendarProps } from "react-native-calendars";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useThemeColor } from "../../hooks/useThemeColor";
import { FoodItem } from "../../lib/supabase";
import { CalendarMonth } from "../../types/calendar";
import { EnhancedCalendarCoreProps } from "../../types/calendar-enhanced";
import {
  calculateExpiryStatistics,
  createEnhancedMarkedDates,
  DEFAULT_COLOR_SCHEME,
  memoizedGenerateDateIndicators,
} from "../../utils/calendarEnhancedDataUtils";
import { useCalendarColorScheme } from "./ColorSchemeProvider";
import ItemCountIndicator from "./ItemCountIndicator";

// =============================================================================
// CONSTANTS
// =============================================================================

const { width: SCREEN_WIDTH } = Dimensions.get("window");

// =============================================================================
// MAIN COMPONENT
// =============================================================================

const EnhancedCalendarCore: React.FC<EnhancedCalendarCoreProps> = ({
  colorScheme: propColorScheme,
  dotIndicators,
  accessibilityEnhanced = true,
  itemCountIndicators = true,
  patternIndicators = false,
  onDatePress,
  onMonthChange,
  markedDates: propMarkedDates,
  selectedDate,
  theme: propTheme,
  items = [],
  loading = false,
  style,
  testID = "enhanced-calendar-core",
}) => {
  const insets = useSafeAreaInsets();
  const { colorScheme: contextColorScheme } = useCalendarColorScheme();
  const [currentMonth, setCurrentMonth] = useState<CalendarMonth>({
    year: new Date().getFullYear(),
    month: new Date().getMonth() + 1,
  });

  // Use prop color scheme or context color scheme
  const activeColorScheme = propColorScheme || contextColorScheme;

  // Theme colors
  const backgroundColor = useThemeColor(
    { light: "#FFFFFF", dark: "#1C1C1E" },
    "background"
  );
  const textColor = useThemeColor(
    { light: "#000000", dark: "#FFFFFF" },
    "text"
  );
  const primaryColor = useThemeColor(
    { light: "#0a7ea4", dark: "#0a7ea4" },
    "tint"
  );

  // Group items by date for processing
  const itemsByDate = useMemo(() => {
    const grouped: Record<string, FoodItem[]> = {};

    items.forEach((item) => {
      if (item.expiry_date) {
        const date = item.expiry_date;
        if (!grouped[date]) {
          grouped[date] = [];
        }
        grouped[date].push(item);
      }
    });

    return grouped;
  }, [items]);

  // Generate enhanced marked dates
  const enhancedMarkedDates = useMemo(() => {
    if (propMarkedDates) {
      return propMarkedDates;
    }

    return createEnhancedMarkedDates(itemsByDate, activeColorScheme, {
      showItemCounts: itemCountIndicators,
      usePatterns: patternIndicators,
      maxDotsPerDate: dotIndicators.maxDots,
    });
  }, [
    propMarkedDates,
    itemsByDate,
    activeColorScheme,
    itemCountIndicators,
    patternIndicators,
    dotIndicators.maxDots,
  ]);

  // Generate calendar theme
  const calendarTheme = useMemo((): CalendarProps["theme"] => {
    if (propTheme) {
      return {
        backgroundColor: propTheme.calendar.backgroundColor,
        calendarBackground: propTheme.calendar.backgroundColor,
        textSectionTitleColor: propTheme.calendar.monthTextColor,
        selectedDayBackgroundColor:
          propTheme.calendar.selectedDayBackgroundColor,
        selectedDayTextColor: propTheme.calendar.selectedDayTextColor,
        todayTextColor: propTheme.calendar.todayTextColor,
        dayTextColor: propTheme.calendar.dayTextColor,
        textDisabledColor: propTheme.calendar.textDisabledColor,
        arrowColor: propTheme.calendar.arrowColor,
        monthTextColor: propTheme.calendar.monthTextColor,
        indicatorColor: primaryColor,
        textDayFontWeight: "400",
        textMonthFontWeight: "600",
        textDayHeaderFontWeight: "500",
        textDayFontSize: 16,
        textMonthFontSize: 18,
        textDayHeaderFontSize: 14,
      };
    }

    // Default theme based on app colors
    return {
      backgroundColor,
      calendarBackground: backgroundColor,
      textSectionTitleColor: textColor,
      selectedDayBackgroundColor: primaryColor,
      selectedDayTextColor: "#FFFFFF",
      todayTextColor: primaryColor,
      dayTextColor: textColor,
      textDisabledColor: `${textColor}80`, // 50% opacity
      arrowColor: primaryColor,
      monthTextColor: textColor,
      indicatorColor: primaryColor,
      textDayFontWeight: "400",
      textMonthFontWeight: "600",
      textDayHeaderFontWeight: "500",
      textDayFontSize: 16,
      textMonthFontSize: 18,
      textDayHeaderFontSize: 14,
    };
  }, [propTheme, backgroundColor, textColor, primaryColor]);

  // Handle date press with enhanced functionality
  const handleDatePress = useCallback(
    (day: { dateString: string }) => {
      const dateItems = itemsByDate[day.dateString] || [];
      const indicators = memoizedGenerateDateIndicators(
        dateItems,
        activeColorScheme
      );

      onDatePress(day.dateString, {
        items: dateItems,
        indicators,
        hasItems: dateItems.length > 0,
      });
    },
    [itemsByDate, activeColorScheme, onDatePress]
  );

  // Handle month change
  const handleMonthChange = useCallback(
    (month: { year: number; month: number }) => {
      const newMonth: CalendarMonth = {
        year: month.year,
        month: month.month,
      };
      setCurrentMonth(newMonth);
      onMonthChange?.(newMonth);
    },
    [onMonthChange]
  );

  // Calculate calendar statistics for current month
  const monthStats = useMemo(() => {
    const monthKey = `${currentMonth.year}-${currentMonth.month
      .toString()
      .padStart(2, "0")}`;
    const monthItems = items.filter((item) =>
      item.expiry_date?.startsWith(monthKey)
    );

    return calculateExpiryStatistics(monthItems, activeColorScheme);
  }, [items, currentMonth, activeColorScheme]);

  // Container styles
  const containerStyle = useMemo((): ViewStyle => {
    return {
      backgroundColor,
      borderRadius: 12,
      overflow: "hidden",
      ...style,
    };
  }, [backgroundColor, style]);

  // Loading overlay styles
  const loadingOverlayStyle = useMemo((): ViewStyle => {
    return {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: `${backgroundColor}80`,
      justifyContent: "center",
      alignItems: "center",
      zIndex: 10,
    };
  }, [backgroundColor]);

  return (
    <View style={containerStyle} testID={testID}>
      {/* Main Calendar */}
      <Calendar
        theme={calendarTheme}
        markedDates={enhancedMarkedDates}
        onDayPress={handleDatePress}
        onMonthChange={handleMonthChange}
        markingType="multi-dot"
        hideExtraDays={true}
        disableMonthChange={false}
        firstDay={1} // Monday
        showWeekNumbers={false}
        disableArrowLeft={false}
        disableArrowRight={false}
        disableAllTouchEventsForDisabledDays={true}
        enableSwipeMonths={true}
        style={styles.calendar}
        // Accessibility
        accessibilityLabel="Food expiry calendar"
        accessibilityHint="Navigate through dates to view expiring items"
        accessibilityRole="grid"
      />

      {/* Enhanced Date Indicators Overlay */}
      {itemCountIndicators && (
        <EnhancedDateIndicators
          itemsByDate={itemsByDate}
          colorScheme={activeColorScheme}
          selectedDate={selectedDate}
          accessibilityEnhanced={accessibilityEnhanced}
          patternIndicators={patternIndicators}
        />
      )}

      {/* Loading Overlay */}
      {loading && (
        <View style={loadingOverlayStyle}>
          <ActivityIndicator size="large" color={primaryColor} />
        </View>
      )}

      {/* Accessibility Summary */}
      {accessibilityEnhanced && (
        <View
          accessible={true}
          accessibilityRole="summary"
          accessibilityLabel={`Calendar summary: ${monthStats.totalItems} items total, ${monthStats.expiredItems} expired, ${monthStats.expiringToday} expiring today, ${monthStats.expiringThisWeek} expiring this week`}
          style={styles.accessibilitySummary}
        />
      )}
    </View>
  );
};

// =============================================================================
// ENHANCED DATE INDICATORS COMPONENT
// =============================================================================

interface EnhancedDateIndicatorsProps {
  itemsByDate: Record<string, FoodItem[]>;
  colorScheme: any;
  selectedDate?: string;
  accessibilityEnhanced: boolean;
  patternIndicators: boolean;
}

const EnhancedDateIndicators: React.FC<EnhancedDateIndicatorsProps> = ({
  itemsByDate,
  colorScheme,
  selectedDate,
  accessibilityEnhanced,
  patternIndicators,
}) => {
  // This component would overlay indicators on the calendar
  // For now, we'll return null as the base calendar handles basic dots
  // In a full implementation, this would position custom indicators
  return null;
};

// =============================================================================
// UTILITY COMPONENTS
// =============================================================================

/**
 * Calendar with integrated statistics
 */
interface StatisticalCalendarProps extends EnhancedCalendarCoreProps {
  showStatistics?: boolean;
  statisticsPosition?: "top" | "bottom";
}

export const StatisticalCalendar: React.FC<StatisticalCalendarProps> = ({
  showStatistics = true,
  statisticsPosition = "top",
  items = [],
  colorScheme,
  ...props
}) => {
  const stats = useMemo(() => {
    return calculateExpiryStatistics(
      items,
      colorScheme || DEFAULT_COLOR_SCHEME
    );
  }, [items, colorScheme]);

  const statisticsComponent = showStatistics ? (
    <View style={styles.statisticsContainer}>
      <View style={styles.statisticsRow}>
        <StatisticItem label="Total" value={stats.totalItems} color="#666666" />
        <StatisticItem
          label="Expired"
          value={stats.expiredItems}
          color={colorScheme?.expired.primary || "#DC2626"}
        />
        <StatisticItem
          label="Today"
          value={stats.expiringToday}
          color={colorScheme?.today.primary || "#EA580C"}
        />
        <StatisticItem
          label="This Week"
          value={stats.expiringThisWeek}
          color={colorScheme?.future.primary || "#16A34A"}
        />
      </View>
    </View>
  ) : null;

  return (
    <View style={styles.statisticalContainer}>
      {statisticsPosition === "top" && statisticsComponent}
      <EnhancedCalendarCore
        {...props}
        items={items}
        colorScheme={colorScheme}
      />
      {statisticsPosition === "bottom" && statisticsComponent}
    </View>
  );
};

/**
 * Compact calendar for smaller spaces
 */
interface CompactCalendarProps extends EnhancedCalendarCoreProps {
  height?: number;
}

export const CompactCalendar: React.FC<CompactCalendarProps> = ({
  height = 300,
  ...props
}) => {
  const compactStyle = useMemo(
    () => ({
      height,
      maxHeight: height,
    }),
    [height]
  );

  return (
    <View style={compactStyle}>
      <EnhancedCalendarCore
        {...props}
        style={[styles.compactCalendar, props.style]}
      />
    </View>
  );
};

// =============================================================================
// STATISTIC ITEM COMPONENT
// =============================================================================

interface StatisticItemProps {
  label: string;
  value: number;
  color: string;
}

const StatisticItem: React.FC<StatisticItemProps> = ({
  label,
  value,
  color,
}) => {
  return (
    <View style={styles.statisticItem}>
      <View style={[styles.statisticIndicator, { backgroundColor: color }]} />
      <View style={styles.statisticContent}>
        <View style={styles.statisticValue}>
          <ItemCountIndicator
            count={value}
            type="future"
            size="small"
            position="center"
          />
        </View>
        <View style={styles.statisticLabel}>
          <View accessible={true} accessibilityRole="text">
            {label}
          </View>
        </View>
      </View>
    </View>
  );
};

// =============================================================================
// STYLES
// =============================================================================

const styles = StyleSheet.create({
  calendar: {
    width: SCREEN_WIDTH - 32,
    alignSelf: "center",
  },
  accessibilitySummary: {
    position: "absolute",
    top: -1000, // Move off-screen but accessible to screen readers
    left: -1000,
    width: 1,
    height: 1,
  },
  statisticalContainer: {
    flex: 1,
  },
  statisticsContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  statisticsRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
  },
  statisticItem: {
    alignItems: "center",
    minWidth: 60,
  },
  statisticIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginBottom: 4,
  },
  statisticContent: {
    alignItems: "center",
  },
  statisticValue: {
    marginBottom: 2,
  },
  statisticLabel: {
    fontSize: 12,
    fontWeight: "500",
    textAlign: "center",
  },
  compactCalendar: {
    flex: 1,
  },
});

// =============================================================================
// EXPORT
// =============================================================================

EnhancedCalendarCore.displayName = "EnhancedCalendarCore";
StatisticalCalendar.displayName = "StatisticalCalendar";
CompactCalendar.displayName = "CompactCalendar";

export default EnhancedCalendarCore;
