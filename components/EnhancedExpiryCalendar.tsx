// components/EnhancedExpiryCalendar.tsx
import { useThemeColor } from "@/hooks/useThemeColor";
import { FoodItem } from "@/lib/supabase";
import { foodItemsService, FoodItemWithUrgency } from "@/services/foodItems";
import {
  formatDateForDisplay,
  formatItemsForCalendar,
  getMonthRange,
} from "@/utils/calendarUtils";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Calendar } from "react-native-calendars";
import EmptyStateView from "./EmptyStateView";

interface EnhancedExpiryCalendarProps {
  onItemPress?: (item: FoodItem) => void;
  onAddItem?: () => void;
}

// Enhanced Item Card Component with urgency styling
interface EnhancedItemCardProps {
  item: FoodItemWithUrgency;
  onPress: () => void;
  isExpanded: boolean;
  onToggleExpand: () => void;
}

// Styles function that takes theme colors as parameters - updated for compact layout
const createStyles = (
  backgroundColor: string,
  surfaceColor: string,
  screenHeight: number
) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: backgroundColor,
    },
    calendarContainer: {
      height: screenHeight * 0.3, // Reduced from 40% to 30%
      minHeight: 280, // Reduced minimum height
      maxHeight: 350, // Reduced maximum height
    },
    calendar: {
      paddingHorizontal: 12, // Reduced padding
      paddingTop: 4, // Reduced padding
    },
    legendContainer: {
      paddingVertical: 4, // Reduced padding
    },
    itemsContainer: {
      flex: 1,
      minHeight: screenHeight * 0.45, // Increased from 35% to 45% for items
    },
    dateHeader: {
      fontSize: 16, // Reduced font size
      fontWeight: "600",
      paddingHorizontal: 12, // Reduced padding
      paddingVertical: 8, // Reduced padding
      backgroundColor: surfaceColor,
    },
    itemsList: {
      paddingHorizontal: 12, // Reduced padding
    },
    // Original item card styles (kept for backward compatibility)
    itemCard: {
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
      elevation: 2,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
    },
    itemMainInfo: {
      flex: 1,
    },
    itemHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 4,
    },
    itemName: {
      fontSize: 16,
      fontWeight: "600",
      flex: 1,
    },
    urgencyBadge: {
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 12,
      marginLeft: 8,
    },
    urgencyText: {
      color: "#FFFFFF",
      fontSize: 10,
      fontWeight: "bold",
    },
    itemDescription: {
      fontSize: 14,
      marginBottom: 6,
      opacity: 0.8,
    },
    itemDetailsRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    itemDetails: {
      fontSize: 12,
      opacity: 0.7,
    },
    locationBadge: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 8,
      backgroundColor: "rgba(0,0,0,0.05)",
    },
    locationText: {
      fontSize: 11,
      textTransform: "capitalize",
    },
    itemRightSection: {
      alignItems: "center",
      gap: 4,
    },
    daysText: {
      fontSize: 14,
      fontWeight: "bold",
    },
    expandedSection: {
      marginTop: 12,
    },
    separator: {
      height: 1,
      marginBottom: 12,
    },
    expandedRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      marginBottom: 8,
    },
    expandedText: {
      fontSize: 12,
    },
    quickActions: {
      flexDirection: "row",
      marginTop: 12,
      gap: 8,
    },
    actionButton: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 16,
      flex: 1,
      justifyContent: "center",
      gap: 4,
    },
    viewButton: {
      backgroundColor: "#E3F2FD",
    },
    viewButtonText: {
      color: "#007AFF",
      fontSize: 12,
      fontWeight: "500",
    },

    // NEW COMPACT STYLES for better space utilization
    compactItemCard: {
      borderRadius: 8,
      padding: 8, // Much smaller padding
      marginBottom: 6, // Reduced margin
      elevation: 1,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      minHeight: 60, // Fixed compact height
    },
    compactMainRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      height: "100%",
    },
    compactItemInfo: {
      flex: 1,
      marginRight: 8,
    },
    compactNameRow: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 2,
    },
    compactItemName: {
      fontSize: 14,
      fontWeight: "600",
      flex: 1,
    },
    compactUrgencyBadge: {
      width: 18,
      height: 18,
      borderRadius: 9,
      alignItems: "center",
      justifyContent: "center",
      marginLeft: 6,
    },
    compactUrgencyText: {
      color: "#FFFFFF",
      fontSize: 9,
      fontWeight: "bold",
    },
    compactSecondaryRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      flexWrap: "wrap",
    },
    compactDetails: {
      fontSize: 11,
      opacity: 0.7,
    },
    compactLocationBadge: {
      flexDirection: "row",
      alignItems: "center",
      gap: 2,
      paddingHorizontal: 4,
      paddingVertical: 1,
      borderRadius: 4,
      backgroundColor: "rgba(0,0,0,0.05)",
    },
    compactLocationText: {
      fontSize: 9,
      textTransform: "capitalize",
    },
    compactCategory: {
      fontSize: 10,
      opacity: 0.6,
      fontStyle: "italic",
    },
    compactRightSection: {
      alignItems: "flex-end",
      justifyContent: "center",
      minWidth: 50,
    },
    compactDaysText: {
      fontSize: 14,
      fontWeight: "bold",
      textAlign: "center",
    },
    compactExpiryDate: {
      fontSize: 10,
      opacity: 0.7,
      textAlign: "center",
      marginTop: 2,
    },

    // Legend styles (made more compact)
    legend: {
      padding: 12, // Reduced padding
      backgroundColor: surfaceColor,
    },
    legendCompact: {
      flexDirection: "row",
      justifyContent: "space-around",
      paddingVertical: 6, // Reduced padding
      paddingHorizontal: 12, // Reduced padding
      backgroundColor: surfaceColor,
    },
    legendTitle: {
      fontSize: 12, // Reduced font size
      fontWeight: "600",
      marginBottom: 6, // Reduced margin
    },
    legendItem: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 4, // Reduced margin
    },
    legendItemCompact: {
      flexDirection: "row",
      alignItems: "center",
      gap: 3, // Reduced gap
    },
    legendDot: {
      width: 6, // Reduced size
      height: 6, // Reduced size
      borderRadius: 3,
      marginRight: 6, // Reduced margin
    },
    legendTextContainer: {
      flex: 1,
    },
    legendLabel: {
      fontSize: 10, // Reduced font size
      fontWeight: "500",
    },
    legendDescription: {
      fontSize: 9, // Reduced font size
      opacity: 0.7,
    },
    legendTextCompact: {
      fontSize: 9, // Reduced font size
      fontWeight: "500",
    },

    // Items header styles
    itemsHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingHorizontal: 12,
      paddingVertical: 8,
      backgroundColor: surfaceColor,
    },
    toggleButton: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 16,
      borderWidth: 1,
      gap: 4,
    },
    toggleButtonText: {
      fontSize: 11,
      fontWeight: "500",
    },
  });

// Compact Item Card Component for better space utilization
const CompactItemCard: React.FC<EnhancedItemCardProps & { styles: any }> = ({
  item,
  onPress,
  styles,
}) => {
  const urgency = item.urgency;
  const textColor = useThemeColor(
    { light: "#11181C", dark: "#ECEDEE" },
    "text"
  );

  return (
    <TouchableOpacity
      style={[
        styles.compactItemCard,
        {
          backgroundColor: urgency.backgroundColor,
          borderLeftColor: urgency.color,
          borderLeftWidth: 4,
        },
      ]}
      onPress={onPress}
      activeOpacity={0.8}
      accessible={true}
      accessibilityLabel={`${item.name}, ${urgency.description}`}
    >
      {/* Main Row with all essential info */}
      <View style={styles.compactMainRow}>
        {/* Left: Item Info */}
        <View style={styles.compactItemInfo}>
          <View style={styles.compactNameRow}>
            <Text
              style={[styles.compactItemName, { color: urgency.color }]}
              numberOfLines={1}
            >
              {item.name}
            </Text>
            <View
              style={[
                styles.compactUrgencyBadge,
                { backgroundColor: urgency.color },
              ]}
            >
              <Text style={styles.compactUrgencyText}>
                {urgency.level.charAt(0).toUpperCase()}
              </Text>
            </View>
          </View>

          {/* Secondary info row */}
          <View style={styles.compactSecondaryRow}>
            <Text
              style={[styles.compactDetails, { color: textColor }]}
              numberOfLines={1}
            >
              {item.quantity} {item.unit || "items"}
            </Text>
            <View style={styles.compactLocationBadge}>
              <Ionicons
                name={item.location === "fridge" ? "snow" : "home"}
                size={10}
                color={textColor}
              />
              <Text style={[styles.compactLocationText, { color: textColor }]}>
                {item.location}
              </Text>
            </View>
            {item.category && (
              <Text
                style={[styles.compactCategory, { color: textColor }]}
                numberOfLines={1}
              >
                {item.category}
              </Text>
            )}
          </View>
        </View>

        {/* Right: Days and Action */}
        <View style={styles.compactRightSection}>
          <Text style={[styles.compactDaysText, { color: urgency.color }]}>
            {urgency.daysUntilExpiry === 0
              ? "Today"
              : urgency.daysUntilExpiry < 0
              ? "Expired"
              : `${urgency.daysUntilExpiry}d`}
          </Text>
          {item.expiry_date && (
            <Text style={[styles.compactExpiryDate, { color: textColor }]}>
              {new Date(item.expiry_date).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
              })}
            </Text>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

// Enhanced Item Card Component
const EnhancedItemCard: React.FC<EnhancedItemCardProps & { styles: any }> = ({
  item,
  onPress,
  isExpanded,
  onToggleExpand,
  styles,
}) => {
  const urgency = item.urgency;
  const textColor = useThemeColor(
    { light: "#11181C", dark: "#ECEDEE" },
    "text"
  );

  return (
    <TouchableOpacity
      style={[
        styles.itemCard,
        {
          backgroundColor: urgency.backgroundColor,
          borderColor: urgency.borderColor,
          borderWidth: 2,
        },
      ]}
      onPress={onToggleExpand}
      activeOpacity={0.8}
      accessible={true}
      accessibilityLabel={`${item.name}, ${urgency.description}`}
      accessibilityHint="Tap to expand details or double tap to view full item"
    >
      {/* Main Item Info */}
      <View style={styles.itemMainInfo}>
        <View style={styles.itemHeader}>
          <Text style={[styles.itemName, { color: urgency.color }]}>
            {item.name}
          </Text>
          <View
            style={[styles.urgencyBadge, { backgroundColor: urgency.color }]}
          >
            <Text style={styles.urgencyText}>
              {urgency.level.toUpperCase()}
            </Text>
          </View>
        </View>

        <Text style={[styles.itemDescription, { color: textColor }]}>
          {urgency.description}
        </Text>

        <View style={styles.itemDetailsRow}>
          <Text style={[styles.itemDetails, { color: textColor }]}>
            {item.quantity} {item.unit || "items"}
          </Text>
          <View style={styles.locationBadge}>
            <Ionicons
              name={item.location === "fridge" ? "snow" : "home"}
              size={12}
              color={textColor}
            />
            <Text style={[styles.locationText, { color: textColor }]}>
              {item.location}
            </Text>
          </View>
        </View>
      </View>

      {/* Right Section */}
      <View style={styles.itemRightSection}>
        <Text style={[styles.daysText, { color: urgency.color }]}>
          {urgency.daysUntilExpiry === 0
            ? "Today"
            : urgency.daysUntilExpiry < 0
            ? "Expired"
            : `${urgency.daysUntilExpiry}d`}
        </Text>
        <Ionicons
          name={isExpanded ? "chevron-up" : "chevron-down"}
          size={20}
          color={textColor}
        />
      </View>

      {/* Expanded Details */}
      {isExpanded && (
        <View style={styles.expandedSection}>
          <View
            style={[styles.separator, { backgroundColor: urgency.borderColor }]}
          />

          {item.category && (
            <View style={styles.expandedRow}>
              <Ionicons name="pricetag" size={16} color={textColor} />
              <Text style={[styles.expandedText, { color: textColor }]}>
                Category: {item.category}
              </Text>
            </View>
          )}

          <View style={styles.expandedRow}>
            <Ionicons name="calendar" size={16} color={textColor} />
            <Text style={[styles.expandedText, { color: textColor }]}>
              Added: {new Date(item.created_at).toLocaleDateString()}
            </Text>
          </View>

          {item.expiry_date && (
            <View style={styles.expandedRow}>
              <Ionicons name="alarm" size={16} color={textColor} />
              <Text style={[styles.expandedText, { color: textColor }]}>
                Expires: {new Date(item.expiry_date).toLocaleDateString()}
              </Text>
            </View>
          )}

          {/* Quick Actions */}
          <View style={styles.quickActions}>
            <TouchableOpacity
              style={[styles.actionButton, styles.viewButton]}
              onPress={onPress}
              accessibilityLabel="View full details"
            >
              <Ionicons name="eye" size={16} color="#007AFF" />
              <Text style={styles.viewButtonText}>View Details</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </TouchableOpacity>
  );
};

// Enhanced Calendar Legend Component
const CalendarLegend: React.FC<{ compact?: boolean; styles: any }> = ({
  compact = false,
  styles,
}) => {
  const textColor = useThemeColor(
    { light: "#11181C", dark: "#ECEDEE" },
    "text"
  );

  const legendItems = [
    {
      color: "#EF4444",
      label: "Critical",
      description: "Expires today/expired",
    },
    { color: "#F97316", label: "Warning", description: "1-2 days" },
    { color: "#EAB308", label: "Soon", description: "3-7 days" },
    { color: "#22C55E", label: "Safe", description: "8+ days" },
  ];

  if (compact) {
    return (
      <View style={styles.legendCompact}>
        {legendItems.map((item, index) => (
          <View key={index} style={styles.legendItemCompact}>
            <View style={[styles.legendDot, { backgroundColor: item.color }]} />
            <Text style={[styles.legendTextCompact, { color: textColor }]}>
              {item.label}
            </Text>
          </View>
        ))}
      </View>
    );
  }

  return (
    <View style={styles.legend}>
      <Text style={[styles.legendTitle, { color: textColor }]}>
        Expiry Status
      </Text>
      {legendItems.map((item, index) => (
        <View key={index} style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: item.color }]} />
          <View style={styles.legendTextContainer}>
            <Text style={[styles.legendLabel, { color: textColor }]}>
              {item.label}
            </Text>
            <Text style={[styles.legendDescription, { color: textColor }]}>
              {item.description}
            </Text>
          </View>
        </View>
      ))}
    </View>
  );
};

export default function EnhancedExpiryCalendar({
  onItemPress,
  onAddItem,
}: EnhancedExpiryCalendarProps) {
  const screenHeight = Dimensions.get("window").height;

  const backgroundColor = useThemeColor(
    { light: "#FFFFFF", dark: "#1D1D1D" },
    "background"
  );
  const textColor = useThemeColor(
    { light: "#11181C", dark: "#ECEDEE" },
    "text"
  );
  const surfaceColor = useThemeColor(
    { light: "#F8F9FA", dark: "#2C2C2E" },
    "background"
  );

  // Create styles with current theme colors
  const styles = createStyles(backgroundColor, surfaceColor, screenHeight);

  // Enhanced calendar theme with better contrast
  const calendarTheme = {
    backgroundColor: backgroundColor,
    calendarBackground: backgroundColor,
    textSectionTitleColor: textColor,
    selectedDayBackgroundColor: "#007AFF",
    selectedDayTextColor: "#FFFFFF",
    todayTextColor: "#007AFF",
    dayTextColor: textColor,
    textDisabledColor: useThemeColor(
      { light: "#C7C7CC", dark: "#48484A" },
      "text"
    ),
    monthTextColor: textColor,
    arrowColor: "#007AFF",
    textDayFontSize: 16,
    textMonthFontSize: 18,
    textDayHeaderFontSize: 14,
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
  const [itemsByDate, setItemsByDate] = useState<
    Record<string, FoodItemWithUrgency[]>
  >({});
  const [selectedItems, setSelectedItems] = useState<FoodItemWithUrgency[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [isCompactView, setIsCompactView] = useState<boolean>(true); // Default to compact view

  // Load items for the current month with urgency information
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

      // Generate marked dates with enhanced accessibility
      const enhancedMarkedDates = formatItemsForCalendar(items);

      // Add accessibility information to marked dates
      Object.entries(enhancedMarkedDates).forEach(([date, marking]) => {
        const itemsForDate = items[date] || [];
        const urgencyCount = itemsForDate.reduce((acc, item) => {
          if ("urgency" in item) {
            acc[item.urgency.level] = (acc[item.urgency.level] || 0) + 1;
          }
          return acc;
        }, {} as Record<string, number>);

        // Enhanced accessibility
        const urgencySummary = Object.entries(urgencyCount)
          .map(([level, count]) => `${count} ${level}`)
          .join(", ");

        enhancedMarkedDates[date] = {
          ...marking,
          accessibilityLabel: `${formatDateForDisplay(date)} - ${
            itemsForDate.length
          } items: ${urgencySummary}`,
        };
      });

      setMarkedDates(enhancedMarkedDates);

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

  // Handle date selection with enhanced feedback
  const handleDayPress = (day: { dateString: string }) => {
    const updatedMarkedDates = { ...markedDates };

    // Reset previous selection
    if (selectedDate && updatedMarkedDates[selectedDate]) {
      updatedMarkedDates[selectedDate] = {
        ...updatedMarkedDates[selectedDate],
        selected: false,
        selectedColor: undefined,
      };
    }

    // Set new selection with accessibility
    if (updatedMarkedDates[day.dateString]) {
      updatedMarkedDates[day.dateString] = {
        ...updatedMarkedDates[day.dateString],
        selected: true,
        selectedColor: "#007AFF",
      };
    } else {
      updatedMarkedDates[day.dateString] = {
        marked: false,
        selected: true,
        selectedColor: "#007AFF",
        accessibilityLabel: `${formatDateForDisplay(
          day.dateString
        )} - No items`,
      };
    }

    setMarkedDates(updatedMarkedDates);
    setSelectedDate(day.dateString);

    // Update selected items and clear expanded state
    if (itemsByDate[day.dateString]) {
      setSelectedItems(itemsByDate[day.dateString]);
    } else {
      setSelectedItems([]);
    }
    setExpandedItems(new Set());
  };

  // Handle month change
  const handleMonthChange = (month: { month: number; year: number }) => {
    setCurrentMonth(month);
    setExpandedItems(new Set());
  };

  // Handle item press
  const handleItemPress = (item: FoodItemWithUrgency) => {
    if (onItemPress) {
      onItemPress(item);
    } else {
      router.push({
        pathname: "/item-details",
        params: { id: item.id },
      });
    }
  };

  // Toggle item expansion
  const toggleItemExpansion = (itemId: string) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(itemId)) {
      newExpanded.delete(itemId);
    } else {
      newExpanded.add(itemId);
    }
    setExpandedItems(newExpanded);
  };

  return (
    <View style={styles.container}>
      {/* Calendar Section */}
      <View style={styles.calendarContainer}>
        <Calendar
          style={styles.calendar}
          theme={calendarTheme}
          markingType="multi-dot"
          markedDates={markedDates}
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
          <CalendarLegend compact={true} styles={styles} />
        </View>
      </View>

      {/* Items Section */}
      <View style={styles.itemsContainer}>
        <View style={styles.itemsHeader}>
          <Text style={[styles.dateHeader, { color: textColor }]}>
            {selectedDate
              ? formatDateForDisplay(selectedDate)
              : "Select a date"}
            {selectedItems.length > 0 && ` (${selectedItems.length} items)`}
          </Text>

          {/* View Toggle Button */}
          <TouchableOpacity
            style={[styles.toggleButton, { borderColor: textColor }]}
            onPress={() => setIsCompactView(!isCompactView)}
            accessibilityLabel={`Switch to ${
              isCompactView ? "detailed" : "compact"
            } view`}
          >
            <Ionicons
              name={isCompactView ? "list" : "grid"}
              size={16}
              color={textColor}
            />
            <Text style={[styles.toggleButtonText, { color: textColor }]}>
              {isCompactView ? "Detail" : "Compact"}
            </Text>
          </TouchableOpacity>
        </View>

        {isLoading ? (
          <View
            style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
          >
            <ActivityIndicator size="large" color="#007AFF" />
            <Text style={[{ marginTop: 8, color: textColor }]}>
              Loading items...
            </Text>
          </View>
        ) : selectedItems.length > 0 ? (
          <FlatList
            data={selectedItems}
            renderItem={({ item }) =>
              isCompactView ? (
                <CompactItemCard
                  item={item}
                  onPress={() => handleItemPress(item)}
                  isExpanded={false} // Not used in compact view
                  onToggleExpand={() => {}} // Not used in compact view
                  styles={styles}
                />
              ) : (
                <EnhancedItemCard
                  item={item}
                  onPress={() => handleItemPress(item)}
                  isExpanded={expandedItems.has(item.id)}
                  onToggleExpand={() => toggleItemExpansion(item.id)}
                  styles={styles}
                />
              )
            }
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.itemsList}
            showsVerticalScrollIndicator={false}
          />
        ) : (
          <EmptyStateView
            title="No items expiring on this date"
            message="Select a different date or add new items to your inventory"
            icon="calendar"
            onAction={onAddItem}
            actionLabel="Add New Item"
          />
        )}
      </View>
    </View>
  );
}
