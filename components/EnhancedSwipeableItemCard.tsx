/**
 * Enhanced Swipeable Item Card
 * Simplified version focusing on clean layout and proper rendering
 */

import React, { useCallback, useMemo } from "react";
import {
  Alert,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ViewStyle,
} from "react-native";
import { useThemeColor } from "../hooks/useThemeColor";
import { FoodItem } from "../lib/supabase";

// Helper function to get status text based on expiry date
function getStatusText(expiryDate: string): string {
  if (!expiryDate) return "SAFE";

  const today = new Date();
  const expiry = new Date(expiryDate);
  const diffTime = expiry.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return "EXPIRED";
  if (diffDays <= 2) return "WARNING";
  return "SAFE";
}

// =============================================================================
// INTERFACES
// =============================================================================

export interface EnhancedSwipeableItemCardProps {
  item: FoodItem;
  onMarkUsed: (item: FoodItem, quantity?: number) => void;
  onExtendExpiry: (item: FoodItem, days: number) => void;
  onPress?: (item: FoodItem) => void;
  onDelete?: (item: FoodItem) => void;
  disabled?: boolean;
  showQuantitySelector?: boolean;
  enableHaptics?: boolean;
  style?: ViewStyle | ViewStyle[];
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function EnhancedSwipeableItemCard({
  item,
  onMarkUsed,
  onExtendExpiry,
  onPress,
  onDelete,
  disabled = false,
  showQuantitySelector = true,
  enableHaptics = true,
  style,
}: EnhancedSwipeableItemCardProps) {
  // =============================================================================
  // THEME AND COLORS
  // =============================================================================

  const backgroundColor = useThemeColor({}, "background");
  const textColor = useThemeColor({}, "text");
  const tintColor = useThemeColor({}, "tint");
  const borderColor = useThemeColor({}, "icon");

  // =============================================================================
  // ACTION HANDLERS
  // =============================================================================

  const handleMarkUsed = useCallback(() => {
    if (showQuantitySelector && item.quantity > 1) {
      Alert.alert("Mark as Used", `How much of ${item.name} did you use?`, [
        { text: "Some", onPress: () => onMarkUsed(item, 1) },
        {
          text: "Half",
          onPress: () => onMarkUsed(item, Math.floor(item.quantity / 2)),
        },
        { text: "All", onPress: () => onMarkUsed(item) },
        { text: "Cancel", style: "cancel" },
      ]);
    } else {
      onMarkUsed(item);
    }
  }, [item, onMarkUsed, showQuantitySelector]);

  const handleExtendExpiry = useCallback(() => {
    Alert.alert(
      "Extend Expiry",
      `How many days would you like to extend ${item.name}?`,
      [
        {
          text: "3 days",
          onPress: () => onExtendExpiry(item, 3),
        },
        {
          text: "7 days",
          onPress: () => onExtendExpiry(item, 7),
        },
        ...(onDelete
          ? [
              {
                text: "Delete",
                style: "destructive" as const,
                onPress: () => onDelete(item),
              },
            ]
          : []),
        { text: "Cancel", style: "cancel" },
      ]
    );
  }, [item, onExtendExpiry, onDelete]);

  const handlePress = useCallback(() => {
    if (onPress && !disabled) {
      onPress(item);
    }
  }, [onPress, item, disabled]);

  // =============================================================================
  // ITEM STATUS
  // =============================================================================

  const itemStatus = useMemo(() => {
    if (!item.expiry_date) return "unknown";

    const today = new Date().toISOString().split("T")[0];
    const expiry = item.expiry_date;

    if (expiry < today) return "expired";
    if (expiry === today) return "expires-today";

    const daysUntilExpiry = Math.ceil(
      (new Date(expiry).getTime() - new Date(today).getTime()) /
        (1000 * 60 * 60 * 24)
    );

    if (daysUntilExpiry <= 3) return "expires-soon";
    return "fresh";
  }, [item.expiry_date]);

  const statusColor = useMemo(() => {
    switch (itemStatus) {
      case "expired":
        return "#DC2626";
      case "expires-today":
        return "#EA580C";
      case "expires-soon":
        return "#D97706";
      default:
        return "#16A34A";
    }
  }, [itemStatus]);

  const backgroundColorMap = useMemo(() => {
    switch (itemStatus) {
      case "expired":
        return "#FECACA"; // Light red background
      case "expires-today":
        return "#FED7AA"; // Light orange background
      case "expires-soon":
        return "#FEF3C7"; // Light yellow background
      default:
        return "#D1FAE5"; // Light green background
    }
  }, [itemStatus]);

  // =============================================================================
  // RENDER
  // =============================================================================

  return (
    <View style={[styles.container, style]}>
      <TouchableOpacity
        style={[styles.card, { backgroundColor: backgroundColorMap }]}
        onPress={handlePress}
        onLongPress={handleExtendExpiry}
        disabled={disabled}
        activeOpacity={0.7}
      >
        {/* Left border indicator */}
        <View style={[styles.leftBorder, { backgroundColor: statusColor }]} />

        {/* Card content */}
        <View style={styles.cardContent}>
          {/* Top row: Item name and status badge */}
          <View style={styles.topRow}>
            <Text style={styles.itemName} numberOfLines={1}>
              {item.name}
            </Text>
            <View
              style={[styles.statusBadge, { backgroundColor: statusColor }]}
            >
              <Text style={styles.statusText}>
                {getStatusText(item.expiry_date || "")}
              </Text>
            </View>
          </View>

          {/* Bottom row: Location and quantity */}
          <Text style={styles.locationText}>
            {item.location === "fridge" ? "Refrigerator" : "Shelf"} • Qty:{" "}
            {item.quantity}
          </Text>
        </View>
      </TouchableOpacity>
    </View>
  );
}

// =============================================================================
// STYLES
// =============================================================================

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginVertical: 6,
  },
  card: {
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    paddingLeft: 20,
    minHeight: 68,
    position: "relative",
    flexDirection: "row",
    alignItems: "center",
  },
  leftBorder: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
    borderTopLeftRadius: 8,
    borderBottomLeftRadius: 8,
  },
  cardContent: {
    flex: 1,
    justifyContent: "center",
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  itemName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000000",
    flex: 1,
    marginRight: 12,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#FFFFFF",
    textTransform: "uppercase",
  },
  locationText: {
    fontSize: 14,
    color: "#666666",
    fontWeight: "400",
  },
});

// Default export for backward compatibility
export default EnhancedSwipeableItemCard;
