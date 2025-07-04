import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  LayoutAnimation,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  UIManager,
  View,
} from "react-native";
import FoodIcon from "./FoodIcon";
import ItemEntryCard from "./ItemEntryCard";

// Enable LayoutAnimation for Android
if (Platform.OS === "android") {
  if (UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
  }
}

type ItemEntry = {
  id: string;
  quantity: number;
  expiryDate?: string; // ISO date string
  isUseFirst?: boolean;
  expiryStatus?: string;
};

type ItemGroupCardProps = {
  itemName: string;
  entries: ItemEntry[];
  onDecrement: (entryId: string) => void;
  onIncrement: (entryId: string) => void;
  onUseAll: (entryId: string) => void;
  onEntryOptions?: (entryId: string) => void;
  onEditEntry?: (entryId: string) => void;
  onDeleteEntry?: (entryId: string) => void;
  initialExpanded?: boolean;
};

/**
 * A component to display a food item with its entries and controls
 */
const ItemGroupCard: React.FC<ItemGroupCardProps> = ({
  itemName,
  entries,
  onDecrement,
  onIncrement,
  onUseAll,
  onEntryOptions,
  onEditEntry,
  onDeleteEntry,
  initialExpanded = false,
}) => {
  // State to track if the card is expanded
  const [expanded, setExpanded] = useState(initialExpanded);

  // Animation value for rotating the arrow
  const arrowRotation = useRef(
    new Animated.Value(initialExpanded ? 1 : 0)
  ).current;

  // Configure the animation when expanded state changes
  useEffect(() => {
    // Configure spring animation for the arrow
    Animated.spring(arrowRotation, {
      toValue: expanded ? 1 : 0,
      tension: 40,
      friction: 7,
      useNativeDriver: true,
    }).start();

    // Configure layout animation for smooth height transition
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
  }, [expanded]);

  // Interpolate rotation value for the arrow
  const arrowRotationDegrees = arrowRotation.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "90deg"],
  });

  // Format expiry date for display
  const formatExpiryStatus = (dateString?: string): string | undefined => {
    if (!dateString) return undefined;

    const expiryDate = new Date(dateString);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const diffTime = expiryDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return "Expired";
    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Tomorrow";
    if (diffDays <= 7) return `${diffDays} days`;

    return undefined; // No urgent expiry badge needed
  };

  // Calculate total quantity
  const totalQuantity = entries.reduce((sum, entry) => sum + entry.quantity, 0);

  return (
    <View style={styles.container}>
      {/* Header with item info and toggle */}
      <View style={styles.header}>
        <View style={styles.itemInfoContainer}>
          <View style={styles.iconContainer}>
            <FoodIcon foodName={itemName} size={24} />
          </View>
          <View style={styles.itemInfo}>
            <Text style={styles.itemName}>{itemName}</Text>
            <Text style={styles.entryCount}>
              {totalQuantity} total • {entries.length}{" "}
              {entries.length === 1 ? "entry" : "entries"}
            </Text>
          </View>
        </View>

        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.toggleButton}
            onPress={() => setExpanded(!expanded)}
            accessibilityLabel={expanded ? "Collapse item" : "Expand item"}
          >
            <Animated.View
              style={{ transform: [{ rotate: arrowRotationDegrees }] }}
            >
              <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
            </Animated.View>
          </TouchableOpacity>
        </View>
      </View>

      {/* Expandable entries container */}
      {expanded && (
        <View style={styles.entriesContainer}>
          {entries.map((entry) => (
            <ItemEntryCard
              key={entry.id}
              quantity={entry.quantity}
              isUseFirst={entry.isUseFirst}
              expiryStatus={
                entry.expiryStatus || formatExpiryStatus(entry.expiryDate)
              }
              onDecrement={() => onDecrement(entry.id)}
              onIncrement={() => onIncrement(entry.id)}
              onUseAll={() => onUseAll(entry.id)}
              onOptionsPress={
                onEntryOptions ? () => onEntryOptions(entry.id) : undefined
              }
              onEditPress={
                onEditEntry ? () => onEditEntry(entry.id) : undefined
              }
              onDeletePress={
                onDeleteEntry ? () => onDeleteEntry(entry.id) : undefined
              }
            />
          ))}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: "white",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#F3F4F6",
    overflow: "hidden",
    marginBottom: 16,
    shadowColor: "#0000001A",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 12,
    backgroundColor: "#FFFFFF",
  },
  itemInfoContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  iconContainer: {
    marginRight: 12,
  },
  itemInfo: {
    justifyContent: "center",
  },
  itemName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 2,
  },
  entryCount: {
    fontSize: 14,
    color: "#6B7280",
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
  },
  toggleButton: {
    padding: 8,
  },
  entriesContainer: {
    paddingHorizontal: 12,
    paddingBottom: 12,
  },
});

export default ItemGroupCard;
