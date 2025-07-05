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
  daysUntilExpiry?: number;
};

type ItemGroupCardProps = {
  itemName: string;
  entries: ItemEntry[];
  onDecrement: (entryId: string) => void;
  onIncrement: (entryId: string) => void;
  onUseAll: (entryId: string) => void;
  onAddMore: () => void; // Add this line
  onEntryOptions?: (entryId: string) => void;
  onEditEntry?: (entryId: string) => void;
  onDeleteEntry?: (entryId: string) => void;
  initialExpanded?: boolean;
};

// Status types for expiry indicators
type ExpiryStatus = "expired" | "today" | "soon" | "fresh" | "none";

/**
 * A component to display a food item with its entries and controls
 */
const ItemGroupCard: React.FC<ItemGroupCardProps> = ({
  itemName,
  entries,
  onDecrement,
  onIncrement,
  onUseAll,
  onAddMore, // Add this line
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

  // Get expiry status for the status dot
  const getExpiryStatus = (): ExpiryStatus => {
    if (entries.length === 0) return "none";

    // Find the earliest expiry date
    let earliestDays: number | undefined;

    for (const entry of entries) {
      if (!entry.expiryDate) continue;

      const expiryDate = new Date(entry.expiryDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const diffTime = expiryDate.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (earliestDays === undefined || diffDays < earliestDays) {
        earliestDays = diffDays;
      }
    }

    if (earliestDays === undefined) return "none";

    if (earliestDays < 0) return "expired";
    if (earliestDays === 0) return "today";
    if (earliestDays <= 3) return "soon";
    return "fresh";
  };

  // Get the color for the status dot
  const getStatusDotColor = (): string => {
    const status = getExpiryStatus();

    switch (status) {
      case "expired":
        return "#FF3B30"; // Red
      case "today":
        return "#FF9500"; // Orange
      case "soon":
        return "#FFCC00"; // Yellow
      case "fresh":
        return "#34C759"; // Green
      default:
        return "transparent";
    }
  };

  // Get the status label for accessibility
  const getStatusLabel = (): string => {
    const status = getExpiryStatus();

    switch (status) {
      case "expired":
        return "Expired";
      case "today":
        return "Expires today";
      case "soon":
        return "Expires soon";
      case "fresh":
        return "Fresh";
      default:
        return "";
    }
  };

  // Calculate total quantity
  const totalQuantity = entries.reduce((sum, entry) => sum + entry.quantity, 0);

  // Generate visual quantity indicators
  const renderQuantityIndicator = () => {
    // Cap the visual representation at 10 for UI clarity
    const maxVisualQuantity = Math.min(totalQuantity, 10);

    // Calculate how many full blocks to show
    const fullBlocks = Math.floor(maxVisualQuantity);

    // Calculate if we need a partial block (for quantities with decimals)
    const partialBlock = maxVisualQuantity - fullBlocks > 0;

    // Calculate the percentage fill for the partial block
    const partialFillPercent = (maxVisualQuantity - fullBlocks) * 100;

    return (
      <View style={styles.quantityIndicatorContainer}>
        {Array.from({ length: fullBlocks }).map((_, index) => (
          <View
            key={`block-${index}`}
            style={styles.quantityBlock}
            accessibilityLabel={`Quantity block ${index + 1} of ${fullBlocks}`}
          />
        ))}
        {partialBlock && (
          <View
            style={[styles.quantityBlock, { width: `${partialFillPercent}%` }]}
            accessibilityLabel={`Partial quantity block`}
          />
        )}
      </View>
    );
  };

  const statusDotColor = getStatusDotColor();
  const statusLabel = getStatusLabel();

  return (
    <View style={styles.container}>
      {/* Header with item info and toggle */}
      <View style={styles.header}>
        <View style={styles.itemInfoContainer}>
          <View style={styles.iconContainer}>
            <FoodIcon foodName={itemName} size={24} />
            {statusDotColor !== "transparent" && (
              <View
                style={[styles.statusDot, { backgroundColor: statusDotColor }]}
                accessibilityLabel={statusLabel}
              />
            )}
          </View>
          <View style={styles.itemInfo}>
            <Text style={styles.itemName}>{itemName}</Text>
            <View style={styles.quantityRow}>
              <Text style={styles.entryCount}>
                {totalQuantity} total • {entries.length}{" "}
                {entries.length === 1 ? "entry" : "entries"}
              </Text>
              {renderQuantityIndicator()}
            </View>
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
              expiryDate={entry.expiryDate}
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
          <TouchableOpacity style={styles.addMoreButton} onPress={onAddMore}>
            <Ionicons name="add-circle-outline" size={22} color="#22C55E" />
            <Text style={styles.addMoreButtonText}>Add More</Text>
          </TouchableOpacity>
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
    flex: 1,
  },
  iconContainer: {
    marginRight: 12,
    position: "relative",
  },
  statusDot: {
    position: "absolute",
    width: 10,
    height: 10,
    borderRadius: 5,
    bottom: -2,
    right: -2,
    borderWidth: 1,
    borderColor: "#FFFFFF",
  },
  itemInfo: {
    justifyContent: "center",
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 2,
  },
  quantityRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  entryCount: {
    fontSize: 14,
    color: "#6B7280",
  },
  quantityIndicatorContainer: {
    flexDirection: "row",
    height: 6,
    width: 50,
    backgroundColor: "#F3F4F6",
    borderRadius: 3,
    overflow: "hidden",
    marginLeft: 8,
  },
  quantityBlock: {
    height: "100%",
    width: "10%", // 10% for each of 10 blocks
    backgroundColor: "#22C55E",
    marginRight: 1,
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
  addMoreButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    marginTop: 8,
    backgroundColor: "#F3F4F6",
    borderRadius: 8,
  },
  addMoreButtonText: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: "600",
    color: "#22C55E",
  },
});

export default ItemGroupCard;
