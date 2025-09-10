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
import { getFoodIcon } from "../utils/foodIconMapping";
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
    if (diffDays < 7) return `${diffDays} days`;

    if (diffDays < 30) {
      const diffWeeks = Math.floor(diffDays / 7);
      return `${diffWeeks} week${diffWeeks > 1 ? "s" : ""}`;
    }

    if (diffDays < 365) {
      const diffMonths = Math.floor(diffDays / 30.44);
      return `${diffMonths} month${diffMonths > 1 ? "s" : ""}`;
    }

    const diffYears = Math.floor(diffDays / 365);
    return `${diffYears} year${diffYears > 1 ? "s" : ""}`;
  };

  // Get earliest expiry status text for display in collapsed view
  const getEarliestExpiryText = (): string | undefined => {
    if (entries.length === 0) return undefined;

    let earliestDays: number | undefined;
    let earliestExpiryDate: Date | undefined;

    for (const entry of entries) {
      if (!entry.expiryDate) continue;

      const expiryDate = new Date(entry.expiryDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const diffTime = expiryDate.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (earliestDays === undefined || diffDays < earliestDays) {
        earliestDays = diffDays;
        earliestExpiryDate = expiryDate;
      }
    }

    if (earliestDays === undefined) return undefined;

    return formatExpiryStatus(earliestExpiryDate?.toISOString());
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
    if (earliestDays <= 7) return "soon"; // Changed from 3 to 7 days for "soon"
    return "fresh";
  };

  // Get the color for the status dot and text
  const getExpiryColor = (): string => {
    const status = getExpiryStatus();

    switch (status) {
      case "expired":
        return "#FF3B30"; // Red
      case "today":
        return "#FF9500"; // Orange
      case "soon":
        return "#FFCC00"; // Yellow
      case "fresh":
        return "#6B7280"; // Neutral gray for fresh items
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

  const expiryColor = getExpiryColor();
  const statusLabel = getStatusLabel();
  const earliestExpiryText = getEarliestExpiryText();

  return (
    <View style={styles.container}>
      {/* Header with item info and toggle */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.itemInfoContainer}
          onPress={() => setExpanded(!expanded)}
          accessibilityLabel={expanded ? "Collapse item" : "Expand item"}
        >
          <View style={styles.iconContainer}>
            <Text style={styles.emojiIcon}>{getFoodIcon(itemName)}</Text>
            {/* Add a status indicator dot */}
            <View
              style={[styles.statusDot, { backgroundColor: getExpiryColor() }]}
              accessibilityLabel={statusLabel}
            />
          </View>
          <View style={styles.itemInfo}>
            <View style={styles.nameAndExpiryContainer}>
              <Text style={styles.itemName}>{itemName}</Text>
              {/* Only show expiry text in header when collapsed to avoid redundancy */}
              {!expanded && earliestExpiryText && (
                <Text
                  style={[
                    styles.expiryText,
                    {
                      color:
                        getExpiryStatus() === "fresh"
                          ? "#6B7280"
                          : getExpiryColor(),
                    },
                  ]}
                  accessibilityLabel={statusLabel}
                >
                  {earliestExpiryText}
                </Text>
              )}
            </View>
            <View style={styles.quantityRow}>
              <Text style={styles.entryCount}>
                {totalQuantity} total • {entries.length}{" "}
                {entries.length === 1 ? "entry" : "entries"}
              </Text>
              {renderQuantityIndicator()}
            </View>
          </View>
        </TouchableOpacity>

        <View style={styles.headerActions}>
          {/* Add "Add More" button in collapsed view */}
          {!expanded && (
            <TouchableOpacity
              style={styles.collapsedAddButton}
              onPress={onAddMore}
              accessibilityLabel={`Add more ${itemName}`}
            >
              <Ionicons name="add-circle-outline" size={18} color="#9CA3AF" />
              <Text style={styles.addMoreButtonText}>Add More</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={styles.toggleButton}
            onPress={() => setExpanded(!expanded)}
            accessibilityLabel={expanded ? "Collapse item" : "Expand item"}
          >
            <Animated.View
              style={{
                transform: [{ rotate: arrowRotationDegrees }],
              }}
            >
              <Ionicons name="chevron-forward" size={18} color="#6B7280" />
            </Animated.View>
          </TouchableOpacity>
        </View>
      </View>

      {/* Entries (visible when expanded) */}
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
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: "white",
    borderRadius: 12,
    marginBottom: 16,
    overflow: "hidden",
    shadowColor: "#0000001A",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 2,
    borderWidth: 1,
    borderColor: "#F3F4F6",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
  },
  itemInfoContainer: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  iconContainer: {
    position: "relative",
    marginRight: 12,
  },
  emojiIcon: {
    fontSize: 24,
  },
  statusDot: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: "white",
  },
  itemInfo: {
    justifyContent: "center",
    flex: 1,
  },
  nameAndExpiryContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 2,
  },
  itemName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
    marginRight: 8,
  },
  expiryText: {
    fontSize: 14,
    fontWeight: "600",
  },
  quantityRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  entryCount: {
    fontSize: 14,
    color: "#6B7280",
    flex: 1,
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
    marginLeft: 8,
  },
  collapsedAddButton: {
    padding: 8,
    marginRight: 4,
  },
  toggleButton: {
    padding: 8,
    width: 34,
    height: 34,
    alignItems: "center",
    justifyContent: "center",
  },
  entriesContainer: {
    paddingHorizontal: 12,
    paddingBottom: 12,
  },
  addMoreButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: "#F3F4F6",
    borderRadius: 8,
    marginTop: 12,
  },
  addMoreButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#22C55E",
    marginLeft: 6,
  },
});

export default ItemGroupCard;
