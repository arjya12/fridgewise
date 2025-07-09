// components/Next7DaysView.tsx
import { useThemeColor } from "@/hooks/useThemeColor";
import { FoodItemWithUrgency, foodItemsService } from "@/services/foodItems";
import React, { useCallback, useEffect, useState } from "react";
import {
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import EmptyStateView from "./EmptyStateView";
import EnhancedSwipeableItemCard from "./EnhancedSwipeableItemCard";

interface Next7DaysViewProps {
  onItemPress?: (item: FoodItemWithUrgency) => void;
  onAddItem?: () => void;
  onMarkUsed?: (itemId: string) => void;
  onExtendExpiry?: (itemId: string) => void;
  onDeleteItem?: (itemId: string) => void;
}

interface DayGroup {
  date: string;
  dayName: string;
  formattedDate: string;
  items: FoodItemWithUrgency[];
  urgencyStats: {
    critical: number;
    warning: number;
    soon: number;
    safe: number;
  };
}

export default function Next7DaysView({
  onItemPress,
  onAddItem,
  onMarkUsed,
  onExtendExpiry,
  onDeleteItem,
}: Next7DaysViewProps) {
  const [dayGroups, setDayGroups] = useState<DayGroup[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<
    "all" | "critical" | "warning"
  >("all");

  const insets = useSafeAreaInsets();
  const backgroundColor = useThemeColor(
    { light: "#FFFFFF", dark: "#000000" },
    "background"
  );
  const surfaceColor = useThemeColor(
    { light: "#F8F9FA", dark: "#1D1D1D" },
    "background"
  );
  const textColor = useThemeColor(
    { light: "#11181C", dark: "#ECEDEE" },
    "text"
  );

  const loadNext7Days = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }

    try {
      // Get next 7 days starting from today
      const today = new Date();
      const endDate = new Date(today);
      endDate.setDate(today.getDate() + 6);

      const startDateStr = today.toISOString().split("T")[0];
      const endDateStr = endDate.toISOString().split("T")[0];

      const itemsByDate = await foodItemsService.getItemsByExpiryDate(
        startDateStr,
        endDateStr
      );

      // Process into day groups
      const groups: DayGroup[] = [];
      for (let i = 0; i < 7; i++) {
        const currentDate = new Date(today);
        currentDate.setDate(today.getDate() + i);
        const dateStr = currentDate.toISOString().split("T")[0];
        const items = itemsByDate[dateStr] || [];

        // Calculate urgency stats
        const urgencyStats = items.reduce(
          (stats, item) => {
            if ("urgency" in item) {
              stats[item.urgency.level as keyof typeof stats]++;
            }
            return stats;
          },
          { critical: 0, warning: 0, soon: 0, safe: 0 }
        );

        // Format day name
        let dayName = "";
        if (i === 0) {
          dayName = "Today";
        } else if (i === 1) {
          dayName = "Tomorrow";
        } else {
          dayName = currentDate.toLocaleDateString("en-US", {
            weekday: "long",
          });
        }

        const formattedDate = currentDate.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        });

        groups.push({
          date: dateStr,
          dayName,
          formattedDate,
          items,
          urgencyStats,
        });
      }

      setDayGroups(groups);
    } catch (error) {
      console.error("Failed to load next 7 days data:", error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadNext7Days();
  }, [loadNext7Days]);

  const onRefresh = useCallback(() => {
    loadNext7Days(true);
  }, [loadNext7Days]);

  const getFilteredItems = (items: FoodItemWithUrgency[]) => {
    if (selectedFilter === "all") return items;
    return items.filter((item) => {
      if ("urgency" in item) {
        return item.urgency.level === selectedFilter;
      }
      return false;
    });
  };

  const getTotalStats = () => {
    return dayGroups.reduce(
      (total, group) => ({
        critical: total.critical + group.urgencyStats.critical,
        warning: total.warning + group.urgencyStats.warning,
        soon: total.soon + group.urgencyStats.soon,
        safe: total.safe + group.urgencyStats.safe,
      }),
      { critical: 0, warning: 0, soon: 0, safe: 0 }
    );
  };

  const renderDayHeader = (group: DayGroup) => {
    const totalItems = group.items.length;
    const filteredItems = getFilteredItems(group.items);

    if (filteredItems.length === 0 && selectedFilter !== "all") {
      return null; // Don't show empty filtered groups
    }

    return (
      <View style={[styles.dayHeader, { backgroundColor: surfaceColor }]}>
        <View style={styles.dayTitleRow}>
          <View style={styles.dayTitleLeft}>
            <Text style={[styles.dayName, { color: textColor }]}>
              {group.dayName}
            </Text>
            <Text style={[styles.dayDate, { color: textColor }]}>
              {group.formattedDate}
            </Text>
          </View>

          <View style={styles.dayStats}>
            {group.urgencyStats.critical > 0 && (
              <View style={[styles.statBadge, { backgroundColor: "#EF4444" }]}>
                <Text style={styles.statText}>
                  {group.urgencyStats.critical}
                </Text>
              </View>
            )}
            {group.urgencyStats.warning > 0 && (
              <View style={[styles.statBadge, { backgroundColor: "#F97316" }]}>
                <Text style={styles.statText}>
                  {group.urgencyStats.warning}
                </Text>
              </View>
            )}
            {group.urgencyStats.soon > 0 && (
              <View style={[styles.statBadge, { backgroundColor: "#EAB308" }]}>
                <Text style={styles.statText}>{group.urgencyStats.soon}</Text>
              </View>
            )}
            {totalItems > 0 && (
              <Text style={[styles.totalCount, { color: textColor }]}>
                {totalItems} item{totalItems !== 1 ? "s" : ""}
              </Text>
            )}
          </View>
        </View>
      </View>
    );
  };

  const renderDayGroup = ({ item: group }: { item: DayGroup }) => {
    const filteredItems = getFilteredItems(group.items);

    if (filteredItems.length === 0 && selectedFilter !== "all") {
      return null;
    }

    return (
      <View style={styles.dayGroup}>
        {renderDayHeader(group)}

        {filteredItems.length > 0 ? (
          <View style={styles.itemsList}>
            {filteredItems.map((item) => (
              <EnhancedSwipeableItemCard
                key={item.id}
                item={item}
                onPress={() => onItemPress?.(item)}
                onMarkUsed={() => onMarkUsed?.(item.id)}
                onExtendExpiry={() => onExtendExpiry?.(item.id)}
                onDelete={() => onDeleteItem?.(item.id)}
                style={styles.itemCard}
              />
            ))}
          </View>
        ) : (
          <View style={styles.emptyDay}>
            <Text style={[styles.emptyDayText, { color: textColor }]}>
              No items expiring
            </Text>
          </View>
        )}
      </View>
    );
  };

  const FilterButton = ({
    filter,
    label,
    count,
    color,
  }: {
    filter: typeof selectedFilter;
    label: string;
    count: number;
    color: string;
  }) => (
    <TouchableOpacity
      style={[
        styles.filterButton,
        selectedFilter === filter && { backgroundColor: color },
      ]}
      onPress={() => setSelectedFilter(filter)}
    >
      <Text
        style={[
          styles.filterText,
          { color: selectedFilter === filter ? "#FFFFFF" : textColor },
        ]}
      >
        {label}
      </Text>
      {count > 0 && (
        <View
          style={[
            styles.filterCount,
            {
              backgroundColor:
                selectedFilter === filter ? "rgba(255,255,255,0.3)" : color,
            },
          ]}
        >
          <Text
            style={[
              styles.filterCountText,
              { color: selectedFilter === filter ? "#FFFFFF" : "#FFFFFF" },
            ]}
          >
            {count}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );

  const totalStats = getTotalStats();
  const hasItems = dayGroups.some((group) => group.items.length > 0);

  return (
    <View style={[styles.container, { backgroundColor }]}>
      {/* Header with Filter Options */}
      <View style={[styles.header, { backgroundColor: surfaceColor }]}>
        <Text style={[styles.title, { color: textColor }]}>Next 7 Days</Text>

        <View style={styles.filterRow}>
          <FilterButton
            filter="all"
            label="All"
            count={
              totalStats.critical +
              totalStats.warning +
              totalStats.soon +
              totalStats.safe
            }
            color="#007AFF"
          />
          <FilterButton
            filter="critical"
            label="Critical"
            count={totalStats.critical}
            color="#EF4444"
          />
          <FilterButton
            filter="warning"
            label="Warning"
            count={totalStats.warning}
            color="#F97316"
          />
        </View>
      </View>

      {/* Content */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <Text style={[styles.loadingText, { color: textColor }]}>
            Loading next 7 days...
          </Text>
        </View>
      ) : hasItems ? (
        <FlatList
          data={dayGroups}
          renderItem={renderDayGroup}
          keyExtractor={(item) => item.date}
          contentContainerStyle={[
            styles.listContent,
            { paddingBottom: insets.bottom + 16 },
          ]}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={onRefresh}
              tintColor={textColor}
            />
          }
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <EmptyStateView
          title="No items expiring in the next 7 days"
          message="Your inventory looks great! Add new items or check your calendar for longer-term planning."
          icon="calendar-outline"
          onAction={onAddItem}
          actionLabel="Add New Item"
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.1)",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 12,
  },
  filterRow: {
    flexDirection: "row",
    gap: 8,
  },
  filterButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.1)",
    gap: 6,
  },
  filterText: {
    fontSize: 14,
    fontWeight: "500",
  },
  filterCount: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    minWidth: 20,
    alignItems: "center",
  },
  filterCountText: {
    fontSize: 11,
    fontWeight: "bold",
  },
  listContent: {
    padding: 16,
  },
  dayGroup: {
    marginBottom: 16,
  },
  dayHeader: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  dayTitleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  dayTitleLeft: {
    flex: 1,
  },
  dayName: {
    fontSize: 18,
    fontWeight: "bold",
  },
  dayDate: {
    fontSize: 14,
    opacity: 0.7,
  },
  dayStats: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  statBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    minWidth: 24,
    alignItems: "center",
  },
  statText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "bold",
  },
  totalCount: {
    fontSize: 12,
    opacity: 0.7,
    marginLeft: 4,
  },
  itemsList: {
    gap: 8,
  },
  itemCard: {
    marginHorizontal: 8,
  },
  emptyDay: {
    padding: 16,
    alignItems: "center",
  },
  emptyDayText: {
    fontSize: 14,
    opacity: 0.6,
    fontStyle: "italic",
  },
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
