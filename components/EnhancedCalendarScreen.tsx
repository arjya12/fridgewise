/**
 * Enhanced Calendar Screen
 * Main integration component combining all enhanced calendar features
 * Based on Phase 2 implementation progress
 */

import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Calendar } from "react-native-calendars";
import {
  Gesture,
  GestureDetector,
  PanGestureHandlerEventPayload,
} from "react-native-gesture-handler";
import { CalendarProvider } from "../contexts/CalendarContext";
import {
  useCalendarPerformance,
  useEnhancedCalendar,
} from "../hooks/useEnhancedCalendar";
import { useThemeColor } from "../hooks/useThemeColor";
import { FoodItem } from "../lib/supabase";
import { formatExpiry } from "../utils/formatExpiry";
import { EnhancedSwipeableItemCard } from "./EnhancedSwipeableItemCard";
import ExtendExpiryModal from "./modals/ExtendExpiryModal";

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
  // MODAL STATE
  // =============================================================================

  const [isExtendModalVisible, setIsExtendModalVisible] = useState(false);
  const [selectedItemForExtension, setSelectedItemForExtension] =
    useState<FoodItem | null>(null);

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
      backgroundColor: "transparent",
      calendarBackground: "transparent",
      textSectionTitleColor: textColor,
      selectedDayBackgroundColor: "#007AFF", // iOS blue color to match the design
      selectedDayTextColor: "#FFFFFF",
      todayTextColor: "#007AFF",
      dayTextColor: textColor,
      textDisabledColor: "#C7C7CC",
      dotColor: "#007AFF",
      selectedDotColor: "#FFFFFF",
      arrowColor: textColor,
      monthTextColor: textColor,
      indicatorColor: "#007AFF",
      textDayFontFamily: "System",
      textMonthFontFamily: "System",
      textDayHeaderFontFamily: "System",
      textDayFontWeight: "400" as const,
      textMonthFontWeight: "600" as const,
      textDayHeaderFontWeight: "500" as const,
      textDayFontSize: 16,
      textMonthFontSize: 18,
      textDayHeaderFontSize: 13,
      // Clean, minimal styling
      "stylesheet.calendar.header": {
        week: {
          marginTop: 5,
          marginBottom: 10,
          flexDirection: "row",
          justifyContent: "space-around",
          backgroundColor: "transparent",
        },
        dayHeader: {
          marginTop: 2,
          marginBottom: 7,
          width: 32,
          textAlign: "center",
          fontSize: 13,
          fontWeight: "500",
          color: textColor,
          opacity: 0.6,
        },
      },
      "stylesheet.day.basic": {
        base: {
          width: 32,
          height: 32,
          alignItems: "center",
          justifyContent: "center",
          borderRadius: 16,
          margin: 1,
        },
        text: {
          marginTop: 0,
          fontSize: 16,
          fontWeight: "400",
          color: textColor,
          backgroundColor: "transparent",
        },
        today: {
          backgroundColor: "transparent",
          borderWidth: 1,
          borderColor: "#007AFF",
        },
        todayText: {
          color: "#007AFF",
          fontWeight: "500",
        },
        selected: {
          backgroundColor: "#007AFF",
          borderRadius: 16,
        },
        selectedText: {
          color: "#FFFFFF",
          fontWeight: "500",
        },
        disabled: {
          opacity: 0.2,
        },
      },
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

  const handleExtendExpiry = useCallback((item: FoodItem, days: number) => {
    // Open modal instead of directly extending
    setSelectedItemForExtension(item);
    setIsExtendModalVisible(true);
  }, []);

  const handleOpenExtendModal = useCallback((item: FoodItem) => {
    setSelectedItemForExtension(item);
    setIsExtendModalVisible(true);
  }, []);

  const handleCloseExtendModal = useCallback(() => {
    setSelectedItemForExtension(null);
    setIsExtendModalVisible(false);
  }, []);

  const handleModalExtendExpiry = useCallback(
    async (item: FoodItem, days: number) => {
      try {
        await extendExpiry(item.id, days);
        handleCloseExtendModal();
      } catch (error) {
        console.error("Failed to extend expiry:", error);
      }
    },
    [extendExpiry, handleCloseExtendModal]
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
    if (!selectedDate) {
      return null;
    }

    // Calculate if this is a future date from today
    const today = new Date().toISOString().split("T")[0];
    const selectedDateObj = new Date(selectedDate);
    const todayObj = new Date(today);
    const diffTime = selectedDateObj.getTime() - todayObj.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    let itemsToShow: typeof selectedDateItems;
    let titleText: string;

    if (diffDays <= 0) {
      // For today or past dates, show items for that specific date
      itemsToShow = selectedDateItems;
      titleText = `Items for ${formatExpiry(selectedDate)}`;
    } else {
      // For future dates, show all items expiring from today to that date
      const rangeItems = selectedDateItems.filter((item) => {
        if (!item.expiry_date) return false;
        const itemDate = item.expiry_date;
        return itemDate >= today && itemDate <= selectedDate;
      });
      itemsToShow = rangeItems;
      titleText = `Items for ${formatExpiry(selectedDate)}`;
    }

    if (itemsToShow.length === 0) {
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
              {titleText}
            </Text>
          </View>
          <Text style={[styles.itemCount, { color: borderColor }]}>
            {itemsToShow.length} item
            {itemsToShow.length === 1 ? "" : "s"}
          </Text>
        </View>

        <View style={styles.itemsContainer}>
          {itemsToShow.slice(0, 5).map((item) => (
            <View key={item.id} style={styles.itemCardWrapper}>
              <EnhancedSwipeableItemCard
                item={item}
                onPress={onItemPress}
                onDelete={onItemDelete}
                onMarkUsed={handleMarkUsed}
                onExtendExpiry={handleOpenExtendModal}
                enableHaptics={true}
                showQuantitySelector={true}
              />
            </View>
          ))}

          {itemsToShow.length > 5 && (
            <View style={styles.moreItemsIndicator}>
              <Text style={[styles.moreItemsText, { color: borderColor }]}>
                +{itemsToShow.length - 5} more items
              </Text>
            </View>
          )}
        </View>
      </View>
    );
  }, [
    selectedDate,
    selectedDateItems,
    tintColor,
    textColor,
    borderColor,
    onItemPress,
    onItemDelete,
    handleMarkUsed,
    handleOpenExtendModal,
    formatExpiry,
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

        <View style={styles.itemsContainer}>
          {expiringSoonItems.slice(0, 5).map((item) => (
            <View key={item.id} style={styles.itemCardWrapper}>
              <EnhancedSwipeableItemCard
                item={item}
                onMarkUsed={handleMarkUsed}
                onExtendExpiry={handleExtendExpiry}
                onPress={onItemPress}
                onDelete={onItemDelete}
                enableHaptics={true}
                showQuantitySelector={true}
              />
            </View>
          ))}
        </View>

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

  const panGesture = Gesture.Pan().onEnd(
    (event: PanGestureHandlerEventPayload) => {
      if (event.translationX > 50) {
        // Swipe right (previous month)
        startMeasurement();
        const newMonth = currentMonth.month === 1 ? 12 : currentMonth.month - 1;
        const newYear =
          currentMonth.month === 1 ? currentMonth.year - 1 : currentMonth.year;
        setCurrentMonth({ year: newYear, month: newMonth });
        endMeasurement("month change (swipe right)");
      } else if (event.translationX < -50) {
        // Swipe left (next month)
        startMeasurement();
        const newMonth = currentMonth.month === 12 ? 1 : currentMonth.month + 1;
        const newYear =
          currentMonth.month === 12 ? currentMonth.year + 1 : currentMonth.year;
        setCurrentMonth({ year: newYear, month: newMonth });
        endMeasurement("month change (swipe left)");
      }
    }
  );

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
        <GestureDetector gesture={panGesture}>
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
              disableAllTouchEventsForDisabledDays={true}
              hideExtraDays={true}
              hideArrows={false}
              hideDayNames={false}
              disableArrowLeft={false}
              disableArrowRight={false}
              monthFormat="MMMM yyyy"
              renderHeader={(date) => (
                <View style={styles.calendarHeader}>
                  <Text
                    style={[styles.calendarHeaderText, { color: textColor }]}
                  >
                    {date?.toString("MMMM yyyy")}
                  </Text>
                </View>
              )}
            />
          </View>
        </GestureDetector>

        {/* Selected Date Items */}
        {renderSelectedDateItems()}

        {/* Expiring Soon Items */}
        {renderExpiringSoonItems()}
      </ScrollView>

      {/* Extend Expiry Modal */}
      <ExtendExpiryModal
        isVisible={isExtendModalVisible}
        item={selectedItemForExtension}
        onClose={handleCloseExtendModal}
        onExtend={handleModalExtendExpiry}
      />
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
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  calendarHeader: {
    alignItems: "center",
    paddingVertical: 12,
    marginBottom: 8,
  },
  calendarHeaderText: {
    fontSize: 18,
    fontWeight: "600",
  },
  itemsSection: {
    marginBottom: 0,
    paddingHorizontal: 0,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 8,
    marginBottom: 12,
  },
  sectionTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 0,
  },
  sectionIndicator: {
    width: 0,
    height: 0,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "500",
    color: "#000000",
  },
  itemCount: {
    fontSize: 14,
    fontWeight: "400",
    color: "#8E8E93",
  },
  moreItemsIndicator: {
    alignItems: "center",
    paddingVertical: 8,
    marginHorizontal: 20,
  },
  moreItemsText: {
    fontSize: 14,
    fontWeight: "400",
    fontStyle: "italic",
  },
<<<<<<< HEAD
=======
  itemsContainer: {
    paddingHorizontal: 20,
  },
  itemCardWrapper: {
    marginBottom: 12,
  },
>>>>>>> 3604630b75e7f789517ed354267c4bff8fdc7750
});
