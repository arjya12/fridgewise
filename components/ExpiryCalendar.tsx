import { useColorScheme } from "@/hooks/useColorScheme";
import { useThemeColor } from "@/hooks/useThemeColor";
import { FoodItem } from "@/lib/supabase";
import { foodItemsService } from "@/services/foodItems";
import {
  formatDateForDisplay,
  formatItemsForCalendar,
  getMonthRange,
} from "@/utils/calendarUtils";
import { router } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import { FlatList, StyleSheet, View } from "react-native";
import { Calendar } from "react-native-calendars";
import EmptyStateView from "./EmptyStateView";
import { ThemedText } from "./ThemedText";
import { ThemedView } from "./ThemedView";

// Define a simplified version of ItemEntryCard for our needs
interface ItemCardProps {
  item: FoodItem;
  onPress: () => void;
}

export default function ExpiryCalendar() {
  const colorScheme = useColorScheme();
  const backgroundColor = useThemeColor(
    { light: "#f8f9fa", dark: "#1c1c1e" },
    "background"
  );
  const textColor = useThemeColor({ light: "#000", dark: "#fff" }, "text");
  const calendarTheme = {
    backgroundColor: backgroundColor,
    calendarBackground: backgroundColor,
    textSectionTitleColor: textColor,
    selectedDayBackgroundColor: "#00adf5",
    selectedDayTextColor: "#ffffff",
    todayTextColor: "#00adf5",
    dayTextColor: textColor,
    textDisabledColor: useThemeColor(
      { light: "#d9e1e8", dark: "#444444" },
      "text"
    ),
    monthTextColor: textColor,
    arrowColor: textColor,
  };

  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [currentMonth, setCurrentMonth] = useState<{
    month: number;
    year: number;
  }>(() => {
    const now = new Date();
    return { month: now.getMonth() + 1, year: now.getFullYear() };
  });
  const [markedDates, setMarkedDates] = useState<Record<string, any>>({});
  const [itemsByDate, setItemsByDate] = useState<Record<string, FoodItem[]>>(
    {}
  );
  const [selectedItems, setSelectedItems] = useState<FoodItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load items for the current month
  const loadItems = useCallback(async () => {
    setIsLoading(true);
    try {
      const { startDate, endDate } = getMonthRange(
        currentMonth.year,
        currentMonth.month
      );
      const items = await foodItemsService.getItemsByExpiryDate(
        startDate,
        endDate
      );
      setItemsByDate(items);
      setMarkedDates(formatItemsForCalendar(items));

      // Update selected items if the selected date has items
      if (selectedDate && items[selectedDate]) {
        setSelectedItems(items[selectedDate]);
      } else {
        setSelectedItems([]);
      }
    } catch (error) {
      console.error("Failed to load items for calendar:", error);
    } finally {
      setIsLoading(false);
    }
  }, [currentMonth, selectedDate]);

  // Load items when month changes
  useEffect(() => {
    loadItems();
  }, [loadItems]);

  // Handle date selection
  const handleDayPress = (day: { dateString: string }) => {
    // Update the selected date in markedDates
    const updatedMarkedDates = { ...markedDates };

    // Reset previous selection
    if (selectedDate && updatedMarkedDates[selectedDate]) {
      updatedMarkedDates[selectedDate] = {
        ...updatedMarkedDates[selectedDate],
        selected: false,
      };
    }

    // Set new selection
    if (updatedMarkedDates[day.dateString]) {
      updatedMarkedDates[day.dateString] = {
        ...updatedMarkedDates[day.dateString],
        selected: true,
      };
    } else {
      updatedMarkedDates[day.dateString] = {
        marked: false,
        selected: true,
      };
    }

    setMarkedDates(updatedMarkedDates);
    setSelectedDate(day.dateString);

    // Update selected items
    if (itemsByDate[day.dateString]) {
      setSelectedItems(itemsByDate[day.dateString]);
    } else {
      setSelectedItems([]);
    }
  };

  // Handle month change
  const handleMonthChange = (month: { month: number; year: number }) => {
    setCurrentMonth(month);
  };

  // Handle item press
  const handleItemPress = (item: FoodItem) => {
    router.push({
      pathname: "/item-details",
      params: { id: item.id },
    });
  };

  return (
    <ThemedView style={styles.container}>
      <Calendar
        theme={calendarTheme}
        markingType={"multi-dot"}
        markedDates={markedDates}
        onDayPress={handleDayPress}
        onMonthChange={handleMonthChange}
        hideExtraDays={true}
        enableSwipeMonths={true}
      />

      <ThemedView style={styles.itemsContainer}>
        <ThemedText style={styles.dateHeader}>
          {selectedDate ? formatDateForDisplay(selectedDate) : "Select a date"}
        </ThemedText>

        {selectedItems.length > 0 ? (
          <FlatList
            data={selectedItems}
            renderItem={({ item }) => (
              <View style={styles.itemCardContainer}>
                <ThemedText>{item.name}</ThemedText>
                <ThemedText>
                  Expires: {formatDateForDisplay(item.expiry_date || "")}
                </ThemedText>
                <ThemedText>Quantity: {item.quantity}</ThemedText>
              </View>
            )}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
          />
        ) : (
          <EmptyStateView
            title="No items expiring on this date"
            message="Select a different date or add new items"
            icon="calendar"
          />
        )}
      </ThemedView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  itemsContainer: {
    flex: 1,
    padding: 16,
  },
  dateHeader: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 16,
  },
  listContent: {
    flexGrow: 1,
  },
  itemCardContainer: {
    backgroundColor: "#f8f9fa",
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1,
    elevation: 2,
  },
});
