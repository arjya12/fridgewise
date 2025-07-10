/**
 * Enhanced Calendar Screen
 * Main integration component combining all enhanced calendar features
 * Based on Phase 2 implementation progress
 */

import React, { useCallback, useEffect, useMemo } from "react";
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Calendar } from "react-native-calendars";
import { CalendarProvider } from "../contexts/CalendarContext";
import {
  useCalendarPerformance,
  useEnhancedCalendar,
} from "../hooks/useEnhancedCalendar";
import { useThemeColor } from "../hooks/useThemeColor";
import { FoodItem } from "../lib/supabase";
import { formatExpiry } from "../utils/formatExpiry";
import { EnhancedSwipeableItemCard } from "./EnhancedSwipeableItemCard";

function getUrgencyColor(urgency: string) {
  switch (urgency) {
    case "expired":
      return "#DC2626";
    case "today":
      return "#EA580C";
    case "soon":
      return "#D97706";
    default:
      return "#16A34A";
  }
}

// =============================================================================
// INTERFACES
// =============================================================================

export interface EnhancedCalendarScreenProps {
  foodItemsService?: any;
  onItemPress?: (item: FoodItem) => void;
  onItemEdit?: (item: FoodItem) => void;
  onItemDelete?: (item: FoodItem) => void;
  enablePerformanceMonitoring?: boolean;
  style?: any;
}

// =============================================================================
// MAIN CALENDAR COMPONENT
// =============================================================================

function EnhancedCalendarScreenCore({
  foodItemsService,
  onItemPress,
  onItemEdit,
  onItemDelete,
  enablePerformanceMonitoring = true,
  style,
}: EnhancedCalendarScreenProps) {
  // =============================================================================
  // HOOKS
  // =============================================================================

  const {
    selectedDate,
    currentMonth,
    loading,
    selectedDateItems,
    expiringSoonItems,
    markedDates,
    selectDate,
    setCurrentMonth,
    markItemUsed,
    extendExpiry,
    refresh,
    getDateItems,
    getDateIndicators,
    enhancedMarkedDates, // <-- use this from context
  } = useEnhancedCalendar();

  const { startMeasurement, endMeasurement, metrics } = useCalendarPerformance({
    enableMetrics: enablePerformanceMonitoring,
    onWarning: (warning) => {
      console.warn("[Calendar Performance]", warning);
    },
  });

  // =============================================================================
  // THEME
  // =============================================================================

  const backgroundColor = useThemeColor({}, "background");
  const textColor = useThemeColor({}, "text");
  const tintColor = useThemeColor({}, "tint");
  const borderColor = useThemeColor({}, "icon");

  // =============================================================================
  // CALENDAR CONFIGURATION
  // =============================================================================

  const calendarTheme = useMemo(
    () => ({
      backgroundColor,
      calendarBackground: backgroundColor,
      textSectionTitleColor: textColor,
      selectedDayBackgroundColor: tintColor,
      selectedDayTextColor: backgroundColor,
      todayTextColor: tintColor,
      dayTextColor: textColor,
      textDisabledColor: borderColor,
      dotColor: tintColor,
      selectedDotColor: backgroundColor,
      arrowColor: tintColor,
      monthTextColor: textColor,
      indicatorColor: tintColor,
      textDayFontFamily: "System",
      textMonthFontFamily: "System",
      textDayHeaderFontFamily: "System",
      textDayFontWeight: "400" as const,
      textMonthFontWeight: "600" as const,
      textDayHeaderFontWeight: "600" as const,
      textDayFontSize: 16,
      textMonthFontSize: 18,
      textDayHeaderFontSize: 13,
    }),
    [backgroundColor, textColor, tintColor, borderColor]
  );

  // =============================================================================
  // ENHANCED MARKED DATES
  // =============================================================================

  // REMOVE the local useMemo for enhancedMarkedDates
  // Use enhancedMarkedDates directly in the Calendar component and anywhere else needed

  // =============================================================================
  // UTILITY FUNCTIONS
  // =============================================================================

  // =============================================================================
  // HANDLERS
  // =============================================================================

  const handleDatePress = useCallback(
    (day: any) => {
      startMeasurement();
      selectDate(day.dateString);
      endMeasurement("date selection");
    },
    [selectDate, startMeasurement, endMeasurement]
  );

  const handleMonthChange = useCallback(
    (month: any) => {
      startMeasurement();
      setCurrentMonth({
        year: month.year,
        month: month.month,
      });
      endMeasurement("month change");
    },
    [setCurrentMonth, startMeasurement, endMeasurement]
  );

  const handleMarkUsed = useCallback(
    async (item: FoodItem, quantity?: number) => {
      try {
        await markItemUsed(item.id, quantity);
      } catch (error) {
        console.error("Failed to mark item as used:", error);
      }
    },
    [markItemUsed]
  );

  const handleExtendExpiry = useCallback(
    async (item: FoodItem, days: number) => {
      try {
        await extendExpiry(item.id, days);
      } catch (error) {
        console.error("Failed to extend expiry:", error);
      }
    },
    [extendExpiry]
  );

  const handleRefresh = useCallback(async () => {
    startMeasurement();
    await refresh();
    endMeasurement("refresh");
  }, [refresh, startMeasurement, endMeasurement]);

  // =============================================================================
  // EFFECTS
  // =============================================================================

  useEffect(() => {
    // Initial data load
    handleRefresh();
  }, []);

  // =============================================================================
  // RENDER HELPERS
  // =============================================================================

  const renderSelectedDateItems = useCallback(() => {
    if (!selectedDate || selectedDateItems.length === 0) {
      return null;
    }

    return (
      <View style={styles.itemsSection}>
        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleContainer}>
            <View
              style={[styles.sectionIndicator, { backgroundColor: tintColor }]}
            />
            <Text style={[styles.sectionTitle, { color: textColor }]}>
              Items for {formatExpiry(selectedDate)}
            </Text>
          </View>
          <Text style={[styles.itemCount, { color: borderColor }]}>
            {selectedDateItems.length} item
            {selectedDateItems.length === 1 ? "" : "s"}
          </Text>
        </View>

        {selectedDateItems.map((item) => (
          <EnhancedSwipeableItemCard
            key={item.id}
            item={item}
            onMarkUsed={handleMarkUsed}
            onExtendExpiry={handleExtendExpiry}
            onPress={onItemPress}
            onDelete={onItemDelete}
            enableHaptics={true}
            showQuantitySelector={true}
          />
        ))}
      </View>
    );
  }, [
    selectedDate,
    selectedDateItems,
    tintColor,
    textColor,
    borderColor,
    handleMarkUsed,
    handleExtendExpiry,
    onItemPress,
    onItemDelete,
  ]);

  const renderExpiringSoonItems = useCallback(() => {
    if (expiringSoonItems.length === 0) {
      return null;
    }

    return (
      <View style={styles.itemsSection}>
        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleContainer}>
            <View
              style={[styles.sectionIndicator, { backgroundColor: "#EA580C" }]}
            />
            <Text style={[styles.sectionTitle, { color: textColor }]}>
              Expiring Soon
            </Text>
          </View>
          <Text style={[styles.itemCount, { color: borderColor }]}>
            {expiringSoonItems.length} item
            {expiringSoonItems.length === 1 ? "" : "s"}
          </Text>
        </View>

        {expiringSoonItems.slice(0, 5).map((item) => (
          <EnhancedSwipeableItemCard
            key={item.id}
            item={item}
            onMarkUsed={handleMarkUsed}
            onExtendExpiry={handleExtendExpiry}
            onPress={onItemPress}
            onDelete={onItemDelete}
            enableHaptics={true}
            showQuantitySelector={true}
          />
        ))}

        {expiringSoonItems.length > 5 && (
          <View style={styles.moreItemsIndicator}>
            <Text style={[styles.moreItemsText, { color: borderColor }]}>
              +{expiringSoonItems.length - 5} more items
            </Text>
          </View>
        )}
      </View>
    );
  }, [
    expiringSoonItems,
    textColor,
    borderColor,
    handleMarkUsed,
    handleExtendExpiry,
    onItemPress,
    onItemDelete,
  ]);

  // =============================================================================
  // RENDER
  // =============================================================================

  return (
    <View style={[styles.container, { backgroundColor }, style]}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={handleRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Calendar */}
        <View style={styles.calendarContainer}>
          <Calendar
            current={`${currentMonth.year}-${String(
              currentMonth.month
            ).padStart(2, "0")}-01`}
            onDayPress={handleDatePress}
            onMonthChange={handleMonthChange}
            markedDates={enhancedMarkedDates}
            markingType="multi-dot"
            theme={calendarTheme}
            firstDay={1}
            showWeekNumbers={false}
            disableMonthChange={false}
            enableSwipeMonths={true}
            disableAllTouchEventsForDisabledDays={true}
            hideExtraDays={true}
            hideArrows={false}
            hideDayNames={false}
            disableArrowLeft={false}
            disableArrowRight={false}
            monthFormat="MMMM yyyy"
            onPressArrowLeft={(subtractMonth) => subtractMonth()}
            onPressArrowRight={(addMonth) => addMonth()}
            renderHeader={(date) => (
              <View style={styles.calendarHeader}>
                <Text style={[styles.calendarHeaderText, { color: textColor }]}>
                  {date?.toString("MMMM yyyy")}
                </Text>
              </View>
            )}
          />
        </View>

        {/* Selected Date Items */}
        {renderSelectedDateItems()}

        {/* Expiring Soon Items */}
        {renderExpiringSoonItems()}

        {/* Performance Metrics (Debug Mode) */}
        {enablePerformanceMonitoring && __DEV__ && (
          <View style={styles.debugSection}>
            <Text style={[styles.debugTitle, { color: borderColor }]}>
              Performance Metrics
            </Text>
            <Text style={[styles.debugText, { color: borderColor }]}>
              Render Time: {metrics.renderTime}ms
            </Text>
            <Text style={[styles.debugText, { color: borderColor }]}>
              Memory Usage: {Math.round(metrics.memoryUsage / 1024 / 1024)}MB
            </Text>
            <Text style={[styles.debugText, { color: borderColor }]}>
              Items: {metrics.itemCount}
            </Text>
            <Text style={[styles.debugText, { color: borderColor }]}>
              Warnings: {metrics.warnings.length}
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

// =============================================================================
// MAIN EXPORTED COMPONENT WITH PROVIDER
// =============================================================================

export function EnhancedCalendarScreen(props: EnhancedCalendarScreenProps) {
  return (
    <CalendarProvider
      foodItemsService={props.foodItemsService}
      performanceConfig={{
        enableMetrics: props.enablePerformanceMonitoring ?? true,
        memoryThreshold: 50 * 1024 * 1024, // 50MB
        renderTimeThreshold: 100, // 100ms
      }}
    >
      <EnhancedCalendarScreenCore {...props} />
    </CalendarProvider>
  );
}

// =============================================================================
// STYLES
// =============================================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  calendarContainer: {
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  calendarHeader: {
    alignItems: "center",
    paddingVertical: 16,
  },
  calendarHeaderText: {
    fontSize: 20,
    fontWeight: "600",
  },
  itemsSection: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  sectionTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  sectionIndicator: {
    width: 4,
    height: 16,
    borderRadius: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  itemCount: {
    fontSize: 14,
    fontWeight: "500",
  },
  moreItemsIndicator: {
    alignItems: "center",
    paddingVertical: 8,
    marginHorizontal: 16,
  },
  moreItemsText: {
    fontSize: 14,
    fontStyle: "italic",
  },
  debugSection: {
    margin: 16,
    padding: 12,
    backgroundColor: "rgba(0,0,0,0.05)",
    borderRadius: 8,
  },
  debugTitle: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
  },
  debugText: {
    fontSize: 12,
    marginBottom: 2,
  },
});
