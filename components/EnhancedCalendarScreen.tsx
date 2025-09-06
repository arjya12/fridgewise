/**
 * Enhanced Calendar Screen with food expiry tracking
 * Displays calendar with marked dates and expiring items
 */

import { CalendarProvider } from "@/contexts/CalendarContext";
import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Animated,
  Easing,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Calendar } from "react-native-calendars";
import {
  Gesture,
  GestureDetector,
  PanGestureHandlerEventPayload,
} from "react-native-gesture-handler";
import {
  useCalendarPerformance,
  useEnhancedCalendar,
} from "../hooks/useEnhancedCalendar";
import { useThemeColor } from "../hooks/useThemeColor";
import { FoodItem } from "../lib/supabase";
import { EnhancedSwipeToExtendCard } from "./EnhancedSwipeToExtendCard";
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
  onAddItem?: () => void;
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
  onAddItem,
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
    items,
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
  const primaryGreen = "#22C55E"; // App primary green

  // =============================================================================
  // SEGMENTED TABS STATE
  // =============================================================================

  type CalendarTab = "expiring" | "expired";
  const TAB_STORAGE_KEY = "calendar_active_tab";
  const [activeTab, setActiveTab] = useState<CalendarTab>("expiring");
  const [tabWidth, setTabWidth] = useState(0);
  const indicatorX = useRef(new Animated.Value(0)).current;
  const contentFade = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    (async function loadTab() {
      try {
        const saved = await AsyncStorage.getItem(TAB_STORAGE_KEY);
        if (saved === "expired" || saved === "expiring") setActiveTab(saved);
      } catch {}
    })();
  }, []);

  const animateToTab = useCallback(
    (next: CalendarTab) => {
      const toValue = next === "expiring" ? 0 : tabWidth / 2;

      Animated.parallel([
        Animated.timing(indicatorX, {
          toValue,
          duration: 180,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.sequence([
          Animated.timing(contentFade, {
            toValue: 0.15,
            duration: 120,
            useNativeDriver: true,
          }),
          Animated.timing(contentFade, {
            toValue: 1,
            duration: 160,
            useNativeDriver: true,
          }),
        ]),
      ]).start();
    },
    [indicatorX, contentFade, tabWidth]
  );

  const handleTabPress = useCallback(
    async (next: CalendarTab) => {
      if (activeTab === next) return;
      setActiveTab(next);
      animateToTab(next);
      try {
        await AsyncStorage.setItem(TAB_STORAGE_KEY, next);
      } catch {}
    },
    [activeTab, animateToTab]
  );

  // =============================================================================
  // CALENDAR CONFIGURATION
  // =============================================================================

  const calendarTheme = useMemo(
    () => ({
      backgroundColor: "transparent",
      calendarBackground: "transparent",
      textSectionTitleColor: textColor,
      selectedDayBackgroundColor: primaryGreen, // changed from blue to app green
      selectedDayTextColor: "#FFFFFF",
      todayTextColor: primaryGreen, // changed from blue to app green
      dayTextColor: textColor,
      textDisabledColor: "#C7C7CC",
      dotColor: primaryGreen, // changed from blue to app green
      selectedDotColor: "#FFFFFF",
      arrowColor: textColor,
      monthTextColor: textColor,
      indicatorColor: primaryGreen, // changed from blue to app green
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
          borderColor: primaryGreen, // changed from blue to app green
        },
        todayText: {
          color: primaryGreen, // changed from blue to app green
          fontWeight: "500",
        },
        selected: {
          backgroundColor: primaryGreen, // changed from blue to app green
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

        // Refresh calendar data to update status dots immediately
        await refresh();

        handleCloseExtendModal();
      } catch (error) {
        console.error("Failed to extend expiry:", error);
      }
    },
    [extendExpiry, refresh, handleCloseExtendModal]
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

  const todayStr = useMemo(() => new Date().toISOString().split("T")[0], []);

  const sourceItems = useMemo(() => {
    if (selectedDate) return getDateItems(selectedDate);
    return items;
  }, [selectedDate, getDateItems, items]);

  function isExpired(item: FoodItem) {
    if (!item.expiry_date) return false;
    return item.expiry_date < todayStr;
  }

  function isExpiringSoon(item: FoodItem) {
    if (!item.expiry_date) return false;
    if (isExpired(item)) return false;
    const limit = new Date();
    limit.setDate(limit.getDate() + 5);
    const limitStr = limit.toISOString().split("T")[0];
    return item.expiry_date <= limitStr;
  }

  const filteredItems: FoodItem[] = useMemo(() => {
    if (selectedDate) {
      if (activeTab === "expired")
        return sourceItems.filter((i: FoodItem) => isExpired(i));
      return sourceItems.filter((i: FoodItem) => !isExpired(i));
    }
    if (activeTab === "expired")
      return sourceItems.filter((i: FoodItem) => isExpired(i));
    return sourceItems.filter((i: FoodItem) => isExpiringSoon(i));
  }, [activeTab, sourceItems, selectedDate]);

  const expiringCount = useMemo(() => {
    const source = selectedDate ? getDateItems(selectedDate) : items;
    return source.filter((i: FoodItem) => !isExpired(i) && isExpiringSoon(i))
      .length;
  }, [selectedDate, getDateItems, items]);

  const expiredCount = useMemo(() => {
    const source = selectedDate ? getDateItems(selectedDate) : items;
    return source.filter((i: FoodItem) => isExpired(i)).length;
  }, [selectedDate, getDateItems, items]);

  const renderEmptyState = useCallback(() => {
    const dateLabel = selectedDate
      ? new Date(selectedDate + "T00:00:00").toLocaleDateString(undefined, {
          month: "short",
          day: "numeric",
        })
      : null;

    let title = "";
    let subtitle = "";

    if (activeTab === "expiring") {
      if (selectedDate && dateLabel) {
        title = `Nothing expiring on ${dateLabel}.`;
        subtitle = "Add item for this date.";
      } else {
        title = "No items expiring soon";
        subtitle = "Add items to start tracking expiry";
      }
    } else {
      title = "Nice! Nothing has expired recently.";
      subtitle = "Keep it up!";
    }

    return (
      <View style={styles.emptyState}>
        <Text style={[styles.emptyTitle, { color: textColor }]}>{title}</Text>
        {subtitle ? (
          <Text style={[styles.emptySubtitle, { color: borderColor }]}>
            {subtitle}
          </Text>
        ) : null}
        {activeTab === "expiring" && onAddItem ? (
          <TouchableOpacity
            accessibilityRole="button"
            onPress={() => onAddItem()}
            style={styles.addButton}
          >
            <Text style={styles.addButtonText}>+ Add Item</Text>
          </TouchableOpacity>
        ) : null}
      </View>
    );
  }, [activeTab, selectedDate, textColor, borderColor, onAddItem]);

  const renderItem = useCallback(
    ({ item }: { item: FoodItem }) => (
      <EnhancedSwipeToExtendCard
        key={item.id}
        item={item}
        onPress={() => onItemPress && onItemPress(item)}
        onExtendExpiry={() => handleOpenExtendModal(item)}
        style={styles.itemCardWrapper}
      />
    ),
    [onItemPress, handleOpenExtendModal]
  );

  // =============================================================================
  // RENDER
  // =============================================================================

  const panGesture = Gesture.Pan()
    // Require horizontal movement before activating so simple taps are not intercepted
    .activeOffsetX([-20, 20])
    .onEnd((event: PanGestureHandlerEventPayload) => {
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
    });

  return (
    <View style={[styles.container, { backgroundColor }, style]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
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
                dayComponent={({ date, state }) => {
                  const dateString = date?.dateString;
                  const isSelected = selectedDate === dateString;
                  const isToday = dateString === todayStr;
                  const disabled = state === "disabled";

                  const indicators = dateString
                    ? getDateIndicators(dateString)
                    : ({
                        count: 0,
                        hasExpired: false,
                        hasExpiring: false,
                      } as any);

                  // Prefer precomputed multi-dot data when available
                  const dotsForDate: Array<{
                    key: string;
                    color: string;
                    selectedDotColor?: string;
                  }> =
                    (dateString &&
                      (enhancedMarkedDates as any)?.[dateString]?.dots) ||
                    [];

                  // Single-dot fallback when no multi-dot data exists
                  let fallbackDotColor: string | null = null;
                  if ((indicators as any).hasExpired)
                    fallbackDotColor = "#EF4444"; // red
                  else if ((indicators as any).hasExpiring)
                    fallbackDotColor = "#22C55E"; // green

                  return (
                    <TouchableOpacity
                      accessibilityRole="button"
                      accessibilityState={{ selected: isSelected, disabled }}
                      activeOpacity={0.7}
                      onPress={() =>
                        dateString && handleDatePress({ dateString })
                      }
                      style={[
                        styles.dateCell,
                        isToday && !isSelected ? styles.dateToday : null,
                        isSelected ? styles.dateSelected : null,
                        disabled ? styles.dateDisabled : null,
                      ]}
                    >
                      <View>
                        <Text
                          style={[
                            styles.dateText,
                            isSelected ? styles.dateTextSelected : null,
                            disabled ? styles.dateTextDisabled : null,
                          ]}
                        >
                          {date?.day}
                        </Text>
                        {dotsForDate.length > 0 ? (
                          <View style={styles.dateDotsRow}>
                            {dotsForDate.slice(0, 3).map((d) => (
                              <View
                                key={d.key}
                                style={[
                                  styles.dateDot,
                                  {
                                    backgroundColor: isSelected
                                      ? d.selectedDotColor || d.color
                                      : d.color,
                                  },
                                ]}
                              />
                            ))}
                          </View>
                        ) : fallbackDotColor ? (
                          <View
                            style={[
                              styles.dateDot,
                              { backgroundColor: fallbackDotColor },
                            ]}
                          />
                        ) : null}
                      </View>
                    </TouchableOpacity>
                  );
                }}
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

          {/* Segmented Tabs */}
          <View style={styles.tabsContainer}>
            <View
              style={styles.tabsRow}
              onLayout={(e) => setTabWidth(e.nativeEvent.layout.width)}
            >
              {/* Indicator behind buttons */}
              <Animated.View
                style={[
                  styles.tabIndicator,
                  { transform: [{ translateX: indicatorX }] },
                ]}
                pointerEvents="none"
              />

              <TouchableOpacity
                accessibilityRole="button"
                onPress={() => handleTabPress("expiring")}
                style={styles.tabButton}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.tabText,
                    activeTab === "expiring"
                      ? styles.tabTextActive
                      : styles.tabTextInactive,
                  ]}
                >
                  Expiring Soon
                </Text>
                <View style={styles.countBadge}>
                  <Text style={styles.countBadgeText}>
                    {expiringCount} item{expiringCount === 1 ? "" : "s"}
                  </Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                accessibilityRole="button"
                onPress={() => handleTabPress("expired")}
                style={styles.tabButton}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.tabText,
                    activeTab === "expired"
                      ? styles.tabTextActive
                      : styles.tabTextInactive,
                  ]}
                >
                  Expired
                </Text>
                <View style={styles.countBadge}>
                  <Text style={styles.countBadgeText}>
                    {expiredCount} item{expiredCount === 1 ? "" : "s"}
                  </Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>

          {/* Items List */}
          <Animated.View style={{ opacity: contentFade }}>
            <View style={styles.itemsContainer}>
              {filteredItems.length === 0 ? (
                renderEmptyState()
              ) : (
                <FlatList
                  data={filteredItems}
                  keyExtractor={(item) => item.id}
                  renderItem={renderItem}
                  ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
                  showsVerticalScrollIndicator={false}
                />
              )}
            </View>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>

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
  scrollContent: {
    paddingBottom: 130,
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
    marginBottom: 30, // Added bottom spacing for natural scroll completion
    paddingHorizontal: 0,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 8,
    marginBottom: 16,
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
  itemsContainer: {
    paddingHorizontal: 20,
  },
  itemCardWrapper: {
    marginBottom: 16,
  },
  // Calendar day styles
  dateCell: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 16,
    margin: 1,
  },
  dateToday: {
    borderWidth: 1,
    borderColor: "#22C55E", // changed from blue to app green
  },
  dateSelected: {
    backgroundColor: "#22C55E", // changed from blue to app green
  },
  dateDisabled: {
    opacity: 0.3,
  },
  dateText: {
    fontSize: 16,
    color: "#000",
  },
  dateTextSelected: {
    color: "#FFF",
    fontWeight: "600",
  },
  dateTextDisabled: {
    color: "#C7C7CC",
  },
  dateDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    marginTop: 2,
    marginHorizontal: 1,
    alignSelf: "center",
  },
  dateDotsRow: {
    flexDirection: "row",
    alignSelf: "center",
    marginTop: 2,
  },
  // Segmented tabs
  tabsContainer: {
    marginTop: 8,
    marginBottom: 12,
    paddingHorizontal: 20,
  },
  tabsRow: {
    flexDirection: "row",
    backgroundColor: "#F2F2F7",
    borderRadius: 10,
    overflow: "hidden",
    position: "relative",
    alignItems: "stretch",
  },
  tabButton: {
    flex: 1,
    minHeight: 44,
    paddingVertical: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  tabText: {
    fontSize: 14,
    fontWeight: "600",
  },
  tabTextActive: {
    color: "#22C55E", // changed from blue to app green
  },
  tabTextInactive: {
    color: "#8E8E93",
  },
  tabIndicator: {
    position: "absolute",
    top: 0,
    left: 0,
    width: "50%",
    height: "100%",
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    elevation: 1,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  countBadge: {
    marginTop: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    backgroundColor: "#E5E5EA",
  },
  countBadgeText: {
    fontSize: 12,
    color: "#3A3A3C",
    fontWeight: "600",
  },
  // Empty state
  emptyState: {
    alignItems: "center",
    paddingVertical: 24,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 14,
    color: "#8E8E93",
    textAlign: "center",
    marginBottom: 12,
  },
  addButton: {
    marginTop: 6,
    backgroundColor: "#22C55E", // match app green (ensures consistent CTA coloring)
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addButtonText: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
});
