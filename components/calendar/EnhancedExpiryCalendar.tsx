import { router } from "expo-router";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Dimensions, StyleSheet, View } from "react-native";
import { Calendar } from "react-native-calendars";
import { useThemeColor } from "../../hooks/useThemeColor";
import { FoodItem } from "../../lib/supabase";
import { foodItemsService } from "../../services/foodItems";
import {
  CalendarMonth,
  EnhancedExpiryCalendarProps,
  PanelState,
} from "../../types/calendar";
import {
  createCalendarData,
  getCurrentDateString,
  getMonthRange,
} from "../../utils/calendarEnhancedUtils";
import CalendarLegend from "./CalendarLegend";
import InformationPanel from "./InformationPanel";

const { height: screenHeight } = Dimensions.get("window");

const EnhancedExpiryCalendar: React.FC<EnhancedExpiryCalendarProps> = ({
  initialDate,
  onItemPress,
  onAddItem,
}) => {
  // Theme and color setup
  const backgroundColor = useThemeColor(
    { light: "#f8f9fa", dark: "#1c1c1e" },
    "background"
  );
  const textColor = useThemeColor({ light: "#000", dark: "#fff" }, "text");
  const primaryColor = useThemeColor(
    { light: "#0a7ea4", dark: "#0a7ea4" },
    "tint"
  );

  // Calculate disabled text color outside useMemo
  const disabledTextColor = useThemeColor(
    { light: "#d9e1e8", dark: "#444444" },
    "text"
  );

  // Calendar theme configuration
  const calendarTheme = useMemo(
    () => ({
      backgroundColor: backgroundColor,
      calendarBackground: backgroundColor,
      textSectionTitleColor: textColor,
      selectedDayBackgroundColor: primaryColor,
      selectedDayTextColor: "#ffffff",
      todayTextColor: primaryColor,
      dayTextColor: textColor,
      textDisabledColor: disabledTextColor,
      monthTextColor: textColor,
      arrowColor: textColor,
      textDayFontWeight: "400" as const,
      textMonthFontWeight: "600" as const,
      textDayHeaderFontWeight: "500" as const,
    }),
    [backgroundColor, textColor, primaryColor, disabledTextColor]
  );

  // State management
  const [selectedDate, setSelectedDate] = useState<string | undefined>(
    initialDate || getCurrentDateString()
  );
  const [currentMonth, setCurrentMonth] = useState<CalendarMonth>(() => {
    const date = initialDate ? new Date(initialDate) : new Date();
    return {
      month: date.getMonth() + 1,
      year: date.getFullYear(),
    };
  });
  const [allItems, setAllItems] = useState<FoodItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Derived state using useMemo for performance
  const calendarData = useMemo(() => {
    return createCalendarData(allItems, 7);
  }, [allItems]);

  const selectedDateItems = useMemo(() => {
    if (!selectedDate) return [];
    return calendarData.itemsByDate[selectedDate] || [];
  }, [selectedDate, calendarData.itemsByDate]);

  const panelState: PanelState = useMemo(() => {
    if (!selectedDate) return "empty";
    if (selectedDateItems.length > 0) return "selected";
    return "default";
  }, [selectedDate, selectedDateItems.length]);

  // Enhanced marked dates with selection state
  const enhancedMarkedDates = useMemo(() => {
    const marked = { ...calendarData.markedDates };

    // Add selection state
    if (selectedDate) {
      if (marked[selectedDate]) {
        marked[selectedDate] = {
          ...marked[selectedDate],
          selected: true,
          selectedColor: primaryColor,
        };
      } else {
        marked[selectedDate] = {
          selected: true,
          selectedColor: primaryColor,
        };
      }
    }

    return marked;
  }, [calendarData.markedDates, selectedDate, primaryColor]);

  // Load items for the current month
  const loadItems = useCallback(
    async (showRefreshIndicator = false) => {
      if (showRefreshIndicator) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }

      try {
        const { startDate, endDate } = getMonthRange(
          currentMonth.year,
          currentMonth.month
        );
        const items = await foodItemsService.getItemsByExpiryDate(
          startDate,
          endDate
        );

        // Flatten the items from the grouped structure
        const flatItems = Object.values(items).flat();
        setAllItems(flatItems);
      } catch (error) {
        console.error("Failed to load items for enhanced calendar:", error);
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [currentMonth]
  );

  // Load items when month changes
  useEffect(() => {
    loadItems();
  }, [loadItems]);

  // Handle date selection
  const handleDayPress = useCallback((day: { dateString: string }) => {
    setSelectedDate(day.dateString);
  }, []);

  // Handle month change
  const handleMonthChange = useCallback((month: CalendarMonth) => {
    setCurrentMonth(month);
  }, []);

  // Handle item interactions
  const handleItemPress = useCallback(
    (item: FoodItem) => {
      if (onItemPress) {
        onItemPress(item);
      } else {
        router.push({
          pathname: "/item-details",
          params: { id: item.id },
        });
      }
    },
    [onItemPress]
  );

  const handleMarkUsed = useCallback(
    async (item: FoodItem) => {
      try {
        await foodItemsService.deleteItem(item.id);
        // Refresh the current month's data
        loadItems(true);
      } catch (error) {
        console.error("Failed to mark item as used:", error);
      }
    },
    [loadItems]
  );

  const handleDelete = useCallback(
    async (item: FoodItem) => {
      try {
        await foodItemsService.deleteItem(item.id);
        // Refresh the current month's data
        loadItems(true);
      } catch (error) {
        console.error("Failed to delete item:", error);
      }
    },
    [loadItems]
  );

  const handleViewAll = useCallback(() => {
    // Navigate to full list view or show modal
    router.push("/calendar"); // Or implement full screen view
  }, []);

  const handleAddItem = useCallback(() => {
    if (onAddItem) {
      onAddItem();
    } else {
      router.push("/add");
    }
  }, [onAddItem]);

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: backgroundColor,
    },
    calendarContainer: {
      height: screenHeight * 0.4, // 40% of screen height
      minHeight: 320, // Minimum height for calendar
      maxHeight: 400, // Maximum height for calendar
    },
    calendar: {
      paddingHorizontal: 16,
      paddingTop: 8,
    },
    legendContainer: {
      paddingVertical: 8,
    },
    informationPanelContainer: {
      flex: 1,
      minHeight: screenHeight * 0.35, // At least 35% for information panel
    },
  });

  return (
    <View style={styles.container}>
      {/* Calendar Section */}
      <View style={styles.calendarContainer}>
        <Calendar
          style={styles.calendar}
          theme={calendarTheme}
          markingType="multi-dot"
          markedDates={enhancedMarkedDates}
          onDayPress={handleDayPress}
          onMonthChange={handleMonthChange}
          hideExtraDays={true}
          enableSwipeMonths={true}
          firstDay={1} // Monday as first day
          showWeekNumbers={false}
          disableAllTouchEventsForDisabledDays={true}
          accessible={true}
          accessibilityLabel="Food expiry calendar"
          accessibilityHint="Select a date to view items expiring on that day"
        />

        {/* Calendar Legend */}
        <View style={styles.legendContainer}>
          <CalendarLegend compact={false} />
        </View>
      </View>

      {/* Information Panel Section */}
      <View style={styles.informationPanelContainer}>
        <InformationPanel
          state={panelState}
          selectedDate={selectedDate}
          expiringSoonItems={calendarData.expiringSoonItems}
          selectedDateItems={selectedDateItems}
          loading={isLoading || isRefreshing}
          onItemPress={handleItemPress}
          onMarkUsed={handleMarkUsed}
          onDelete={handleDelete}
          onViewAll={handleViewAll}
          onAddItem={handleAddItem}
        />
      </View>
    </View>
  );
};

export default React.memo(EnhancedExpiryCalendar);
