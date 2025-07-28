import React from "react";
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ViewStyle,
} from "react-native";

// =============================================================================
// TYPESCRIPT INTERFACES
// =============================================================================

export interface FoodItem {
  id: string;
  name: string;
  icon: string; // emoji
  location: string;
  quantity: number;
  status: "EXPIRED" | "WARNING" | "SAFE";
  expiryDate: Date;
}

export interface FoodItemCardProps {
  item: FoodItem;
  onPress?: (item: FoodItem) => void;
  style?: ViewStyle | ViewStyle[];
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Get status label colors based on expiry status
 */
function getStatusColors(status: FoodItem["status"]) {
  switch (status) {
    case "EXPIRED":
      return {
        backgroundColor: "#EF4444", // Red
        textColor: "#FFFFFF",
      };
    case "WARNING":
      return {
        backgroundColor: "#F97316", // Orange
        textColor: "#FFFFFF",
      };
    case "SAFE":
      return {
        backgroundColor: "#22C55E", // Green
        textColor: "#FFFFFF",
      };
    default:
      return {
        backgroundColor: "#22C55E",
        textColor: "#FFFFFF",
      };
  }
}

/**
 * Format location text for display
 */
function formatLocation(location: string): string {
  return location === "fridge" ? "Refrigerator" : "Shelf";
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function FoodItemCard({ item, onPress, style }: FoodItemCardProps) {
  const statusColors = getStatusColors(item.status);

  const handlePress = () => {
    if (onPress) {
      onPress(item);
    }
  };

  return (
    <View style={[styles.container, style]}>
      <TouchableOpacity
        style={styles.card}
        onPress={handlePress}
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityLabel={`${item.name}, ${formatLocation(
          item.location
        )}, quantity ${item.quantity}, status ${item.status}`}
      >
        {/* Top Row: Icon + Name + Status */}
        <View style={styles.topRow}>
          {/* Left Side: Icon + Name */}
          <View style={styles.leftSection}>
            <Text style={styles.itemIcon}>{item.icon}</Text>
            <Text style={styles.itemName} numberOfLines={1}>
              {item.name}
            </Text>
          </View>

          {/* Right Side: Status Label */}
          <View
            style={[
              styles.statusLabel,
              { backgroundColor: statusColors.backgroundColor },
            ]}
          >
            <Text
              style={[styles.statusText, { color: statusColors.textColor }]}
            >
              {item.status}
            </Text>
          </View>
        </View>

        {/* Bottom Row: Location + Quantity */}
        <View style={styles.bottomRow}>
          <Text style={styles.metadataText}>
            {formatLocation(item.location)} • Qty: {item.quantity}
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
    backgroundColor: "#FFFBEB", // Light yellow/neutral background
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  leftSection: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    marginRight: 12,
  },
  itemIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  itemName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1F2937",
    flex: 1,
  },
  statusLabel: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    minWidth: 60,
    alignItems: "center",
  },
  statusText: {
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  bottomRow: {
    marginTop: 4,
  },
  metadataText: {
    fontSize: 14,
    color: "#6B7280",
    fontWeight: "400",
  },
});

// =============================================================================
// EXAMPLE USAGE AND SAMPLE DATA
// =============================================================================

/**
 * Sample data for testing the component
 */
export const sampleFoodItems: FoodItem[] = [
  {
    id: "1",
    name: "Milk",
    icon: "🥛",
    location: "fridge",
    quantity: 1,
    status: "SAFE",
    expiryDate: new Date("2024-08-05"),
  },
  {
    id: "2",
    name: "Lettuce",
    icon: "🥬",
    location: "fridge",
    quantity: 2,
    status: "WARNING",
    expiryDate: new Date("2024-07-30"),
  },
  {
    id: "3",
    name: "Cheese",
    icon: "🧀",
    location: "fridge",
    quantity: 1,
    status: "EXPIRED",
    expiryDate: new Date("2024-07-25"),
  },
  {
    id: "4",
    name: "Bread",
    icon: "🍞",
    location: "shelf",
    quantity: 1,
    status: "SAFE",
    expiryDate: new Date("2024-08-02"),
  },
];

/**
 * Example usage component
 */
export function FoodItemCardExample() {
  const handleItemPress = (item: FoodItem) => {
    console.log("Item pressed:", item.name);
    // Handle navigation or modal opening here
  };

  return (
    <View style={{ padding: 20 }}>
      {sampleFoodItems.map((item) => (
        <FoodItemCard key={item.id} item={item} onPress={handleItemPress} />
      ))}
    </View>
  );
}

export default FoodItemCard;
