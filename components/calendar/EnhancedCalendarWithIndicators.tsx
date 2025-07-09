// Enhanced Calendar with Phase 2 Date Indicators
// Implements urgency-based visual hierarchy and accessibility features

import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Animated,
  Dimensions,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Calendar, DateData } from "react-native-calendars";
import { useThemeColor } from "../../hooks/useThemeColor";
import { FoodItem } from "../../lib/supabase";
import { foodItemsService } from "../../services/foodItems";
import { getMonthRange } from "../../utils/calendarUtils";
import {
  calculateEnhancedUrgency,
  getCalendarDateAccessibilityLabel,
  getCalendarDotColors,
} from "../../utils/urgencyUtils";

// =============================================================================
// INTERFACES & TYPES
// =============================================================================

interface EnhancedCalendarWithIndicatorsProps {
  onDateSelect?: (date: string, items: FoodItem[]) => void;
  onItemPress?: (item: FoodItem) => void;
  onAddItem?: () => void;
  initialDate?: string;
  compactMode?: boolean;
  accessibilityEnabled?: boolean;
}

interface FoodItemWithUrgency extends FoodItem {
  urgency: ReturnType<typeof calculateEnhancedUrgency>;
}

interface CalendarTheme {
  backgroundColor: string;
  calendarBackground: string;
  textSectionTitleColor: string;
  selectedDayBackgroundColor: string;
  selectedDayTextColor: string;
  todayTextColor: string;
  dayTextColor: string;
  textDisabledColor: string;
  monthTextColor: string;
  arrowColor: string;
  textDayFontSize: number;
  textMonthFontSize: number;
  textDayHeaderFontSize: number;
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

const EnhancedCalendarWithIndicators: React.FC<
  EnhancedCalendarWithIndicatorsProps
> = ({
  onDateSelect,
  onItemPress,
  onAddItem,
  initialDate,
  compactMode = false,
  accessibilityEnabled = true,
}) => {
  const screenHeight = Dimensions.get("window").height;
  const screenWidth = Dimensions.get("window").width;

  // Theme colors
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
  const disabledTextColor = useThemeColor(
    { light: "#C7C7CC", dark: "#48484A" },
    "text"
  );

  // State management
  const [selectedDate, setSelectedDate] = useState<string>(
    initialDate || new Date().toISOString().split("T")[0]
  );
  const [currentMonth, setCurrentMonth] = useState<{
    month: number;
    year: number;
  }>(() => {
    const date = initialDate ? new Date(initialDate) : new Date();
    return { month: date.getMonth() + 1, year: date.getFullYear() };
  });
  const [itemsByDate, setItemsByDate] = useState<
    Record<string, FoodItemWithUrgency[]>
  >({});
  const [isLoading, setIsLoading] = useState(true);
  const [markedDates, setMarkedDates] = useState<Record<string, any>>({});

  // Animation values for Phase 2 specifications
  const fadeAnim = useMemo(() => new Animated.Value(0), []);
  const scaleAnim = useMemo(() => new Animated.Value(0.95), []);

  // Calendar theme configuration
  const calendarTheme = useMemo(
    (): CalendarTheme => ({
      backgroundColor: backgroundColor,
      calendarBackground: backgroundColor,
      textSectionTitleColor: textColor,
      selectedDayBackgroundColor: "#007AFF",
      selectedDayTextColor: "#FFFFFF",
      todayTextColor: "#007AFF",
      dayTextColor: textColor,
      textDisabledColor: disabledTextColor,
      monthTextColor: textColor,
      arrowColor: "#007AFF",
      textDayFontSize: compactMode ? 14 : 16,
      textMonthFontSize: compactMode ? 16 : 18,
      textDayHeaderFontSize: compactMode ? 12 : 14,
    }),
    [backgroundColor, textColor, disabledTextColor, compactMode]
  );

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

      // Add urgency information to items
      const itemsWithUrgency: Record<string, FoodItemWithUrgency[]> = {};
      Object.entries(items).forEach(([date, dateItems]) => {
        itemsWithUrgency[date] = dateItems.map((item) => ({
          ...item,
          urgency: calculateEnhancedUrgency(item.expiry_date!),
        }));
      });

      setItemsByDate(itemsWithUrgency);

      // Generate enhanced marked dates with Phase 2 specifications
      const enhancedMarkedDates = generateEnhancedMarkedDates(itemsWithUrgency);
      setMarkedDates(enhancedMarkedDates);

      // Animate appearance (Phase 2 animation specifications)
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } catch (error) {
      console.error("Failed to load calendar items:", error);
    } finally {
      setIsLoading(false);
    }
  }, [currentMonth, fadeAnim, scaleAnim]);

  // Generate enhanced marked dates with Phase 2 design
  const generateEnhancedMarkedDates = useCallback(
    (itemsData: Record<string, FoodItemWithUrgency[]>): Record<string, any> => {
      const marked: Record<string, any> = {};

      Object.entries(itemsData).forEach(([date, items]) => {
        if (items.length === 0) return;

        // Get Phase 2 enhanced dots (single dominant dot)
        const dots = getCalendarDotColors(items);

        // Enhanced accessibility label
        const accessibilityLabel = accessibilityEnabled
          ? getCalendarDateAccessibilityLabel(date, items)
          : undefined;

        marked[date] = {
          marked: true,
          dots,
          // Phase 2 accessibility enhancements
          accessibilityLabel,
          accessibilityHint: "Double-tap to view items expiring on this date",
          accessibilityRole: "button",
        };
      });

      // Add selection state
      if (selectedDate) {
        if (marked[selectedDate]) {
          marked[selectedDate] = {
            ...marked[selectedDate],
            selected: true,
            selectedColor: "#007AFF",
          };
        } else {
          marked[selectedDate] = {
            selected: true,
            selectedColor: "#007AFF",
            accessibilityLabel: accessibilityEnabled
              ? getCalendarDateAccessibilityLabel(selectedDate, [])
              : undefined,
          };
        }
      }

      return marked;
    },
    [selectedDate, accessibilityEnabled]
  );

  // Handle date press with Phase 2 interaction patterns
  const handleDayPress = useCallback(
    (day: DateData) => {
      setSelectedDate(day.dateString);

      const dateItems = itemsByDate[day.dateString] || [];

      // Phase 2 haptic feedback (if available)
      if (Platform.OS === "ios") {
        const { HapticFeedback } = require("expo-haptics");
        HapticFeedback?.impactAsync(HapticFeedback.ImpactFeedbackStyle.Light);
      }

      // Update marked dates with new selection
      const updatedMarkedDates = generateEnhancedMarkedDates(itemsByDate);
      setMarkedDates(updatedMarkedDates);

      // Callback with items
      if (onDateSelect) {
        onDateSelect(day.dateString, dateItems);
      }
    },
    [itemsByDate, generateEnhancedMarkedDates, onDateSelect]
  );

  // Handle month change
  const handleMonthChange = useCallback(
    (month: { month: number; year: number }) => {
      setCurrentMonth(month);
    },
    []
  );

  // Load items when month changes
  useEffect(() => {
    loadItems();
  }, [loadItems]);

  // Dynamic styles based on screen size and mode
  const styles = useMemo(
    () =>
      createStyles(
        backgroundColor,
        surfaceColor,
        screenHeight,
        screenWidth,
        compactMode
      ),
    [backgroundColor, surfaceColor, screenHeight, screenWidth, compactMode]
  );

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity: fadeAnim,
          transform: [{ scale: scaleAnim }],
        },
      ]}
    >
      {/* Enhanced Calendar with Phase 2 specifications */}
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
          // Phase 2 accessibility enhancements
          accessible={accessibilityEnabled}
          accessibilityLabel="Food expiry calendar with urgency indicators"
          accessibilityHint="Navigate through dates to view items by urgency level"
          accessibilityRole="none"
        />

        {/* Enhanced Legend with Phase 2 design */}
        <EnhancedLegend compact={compactMode} styles={styles} />
      </View>

      {/* Selected Date Information */}
      <SelectedDatePanel
        selectedDate={selectedDate}
        items={itemsByDate[selectedDate] || []}
        onItemPress={onItemPress}
        onAddItem={onAddItem}
        isLoading={isLoading}
        compactMode={compactMode}
        styles={styles}
      />
    </Animated.View>
  );
};

// =============================================================================
// ENHANCED LEGEND COMPONENT
// =============================================================================

interface EnhancedLegendProps {
  compact: boolean;
  styles: any;
}

const EnhancedLegend: React.FC<EnhancedLegendProps> = ({ compact, styles }) => {
  const legendItems = [
    { color: "#EF4444", label: "Critical", description: "Expired/Today" },
    { color: "#F97316", label: "Warning", description: "1-2 days" },
    { color: "#EAB308", label: "Soon", description: "3-7 days" },
    { color: "#22C55E", label: "Safe", description: "8+ days" },
  ];

  return (
    <View style={compact ? styles.legendCompact : styles.legend}>
      {legendItems.map((item, index) => (
        <View
          key={index}
          style={compact ? styles.legendItemCompact : styles.legendItem}
          accessible={true}
          accessibilityLabel={`${item.label}: ${item.description}`}
          accessibilityRole="text"
        >
          <View
            style={[
              compact ? styles.legendDotCompact : styles.legendDot,
              { backgroundColor: item.color },
            ]}
          />
          <Text style={compact ? styles.legendTextCompact : styles.legendText}>
            {item.label}
          </Text>
          {!compact && (
            <Text style={styles.legendDescription}>{item.description}</Text>
          )}
        </View>
      ))}
    </View>
  );
};

// =============================================================================
// SELECTED DATE PANEL COMPONENT
// =============================================================================

interface SelectedDatePanelProps {
  selectedDate: string;
  items: FoodItemWithUrgency[];
  onItemPress?: (item: FoodItem) => void;
  onAddItem?: () => void;
  isLoading: boolean;
  compactMode: boolean;
  styles: any;
}

const SelectedDatePanel: React.FC<SelectedDatePanelProps> = ({
  selectedDate,
  items,
  onItemPress,
  onAddItem,
  isLoading,
  compactMode,
  styles,
}) => {
  const textColor = useThemeColor(
    { light: "#11181C", dark: "#ECEDEE" },
    "text"
  );

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={[styles.loadingText, { color: textColor }]}>
          Loading items...
        </Text>
      </View>
    );
  }

  const formatDateForDisplay = (dateString: string): string => {
    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (date.toDateString() === today.toDateString()) {
      return "Today";
    }

    if (date.toDateString() === tomorrow.toDateString()) {
      return "Tomorrow";
    }

    return date.toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <View style={styles.selectedDatePanel}>
      <Text
        style={[styles.selectedDateHeader, { color: textColor }]}
        accessible={true}
        accessibilityRole="header"
      >
        {formatDateForDisplay(selectedDate)}
        {items.length > 0 && ` (${items.length} items)`}
      </Text>

      {items.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={[styles.emptyStateText, { color: textColor }]}>
            No items expiring on this date
          </Text>
          {onAddItem && (
            <TouchableOpacity
              style={styles.addButton}
              onPress={onAddItem}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel="Add new item"
            >
              <Text style={styles.addButtonText}>Add Item</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <View style={styles.itemsList}>
          {items.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={[
                styles.itemCard,
                {
                  backgroundColor: item.urgency.backgroundColor,
                  borderLeftColor: item.urgency.borderColor,
                  borderLeftWidth: 4,
                },
              ]}
              onPress={() => onItemPress?.(item)}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel={`${item.name}, ${item.urgency.description}`}
              accessibilityHint="Double-tap to view item details"
            >
              <View style={styles.itemContent}>
                <Text
                  style={[
                    styles.itemName,
                    {
                      color: item.urgency.color,
                      fontWeight:
                        item.urgency.visualWeight > 75 ? "700" : "600",
                    },
                  ]}
                  numberOfLines={1}
                >
                  {item.name}
                </Text>
                <Text style={[styles.itemDetails, { color: textColor }]}>
                  {item.location} • Qty: {item.quantity}
                </Text>
              </View>
              <View
                style={[
                  styles.statusBadge,
                  { backgroundColor: item.urgency.color },
                ]}
              >
                <Text style={styles.statusText}>
                  {item.urgency.level.toUpperCase()}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
};

// =============================================================================
// STYLES
// =============================================================================

const createStyles = (
  backgroundColor: string,
  surfaceColor: string,
  screenHeight: number,
  screenWidth: number,
  compactMode: boolean
) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: backgroundColor,
    },
    calendarContainer: {
      height: compactMode ? screenHeight * 0.25 : screenHeight * 0.3,
      minHeight: compactMode ? 240 : 280,
      maxHeight: compactMode ? 300 : 350,
    },
    calendar: {
      paddingHorizontal: compactMode ? 8 : 12,
      paddingTop: compactMode ? 2 : 4,
    },

    // Legend styles
    legend: {
      flexDirection: "row",
      justifyContent: "space-around",
      paddingVertical: 12,
      paddingHorizontal: 16,
      backgroundColor: surfaceColor,
    },
    legendCompact: {
      flexDirection: "row",
      justifyContent: "space-around",
      paddingVertical: 6,
      paddingHorizontal: 8,
      backgroundColor: surfaceColor,
    },
    legendItem: {
      alignItems: "center",
      flex: 1,
    },
    legendItemCompact: {
      flexDirection: "row",
      alignItems: "center",
      flex: 1,
      justifyContent: "center",
    },
    legendDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      marginBottom: 4,
    },
    legendDotCompact: {
      width: 6,
      height: 6,
      borderRadius: 3,
      marginRight: 4,
    },
    legendText: {
      fontSize: 12,
      fontWeight: "600",
    },
    legendTextCompact: {
      fontSize: 10,
      fontWeight: "500",
    },
    legendDescription: {
      fontSize: 10,
      opacity: 0.7,
      marginTop: 2,
    },

    // Selected date panel
    selectedDatePanel: {
      flex: 1,
      padding: 16,
    },
    selectedDateHeader: {
      fontSize: 18,
      fontWeight: "600",
      marginBottom: 16,
    },

    // Empty state
    emptyState: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
    },
    emptyStateText: {
      fontSize: 16,
      opacity: 0.7,
      textAlign: "center",
      marginBottom: 16,
    },
    addButton: {
      backgroundColor: "#007AFF",
      paddingHorizontal: 24,
      paddingVertical: 12,
      borderRadius: 8,
    },
    addButtonText: {
      color: "#FFFFFF",
      fontSize: 16,
      fontWeight: "600",
    },

    // Items list
    itemsList: {
      flex: 1,
    },
    itemCard: {
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
      flexDirection: "row",
      alignItems: "center",
      elevation: 2,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
    },
    itemContent: {
      flex: 1,
    },
    itemName: {
      fontSize: 16,
      fontWeight: "600",
      marginBottom: 4,
    },
    itemDetails: {
      fontSize: 14,
      opacity: 0.8,
    },
    statusBadge: {
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 12,
    },
    statusText: {
      color: "#FFFFFF",
      fontSize: 10,
      fontWeight: "700",
    },

    // Loading state
    loadingContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
    },
    loadingText: {
      fontSize: 16,
      opacity: 0.7,
    },
  });

export default EnhancedCalendarWithIndicators;
