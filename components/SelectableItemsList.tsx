// components/SelectableItemsList.tsx
import { FoodItemWithUrgency } from "@/services/foodItems";
import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  Animated,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { getFoodIcon } from "../utils/foodIconMapping";

interface SelectableItemsListProps {
  items: FoodItemWithUrgency[];
  selectedItems: string[];
  onSelectionChange: (selectedIds: string[]) => void;
  onItemPress?: (item: FoodItemWithUrgency) => void;
  showSelection: boolean;
  groupBy?: "urgency" | "location" | "category" | "none";
  textColor: string;
  backgroundColor: string;
  borderColor: string;
}

interface ItemGroup {
  title: string;
  items: FoodItemWithUrgency[];
  color?: string;
  icon?: keyof typeof Ionicons.glyphMap;
}

export default function SelectableItemsList({
  items,
  selectedItems,
  onSelectionChange,
  onItemPress,
  showSelection,
  groupBy = "urgency",
  textColor,
  backgroundColor,
  borderColor,
}: SelectableItemsListProps) {
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(
    new Set(["all"])
  );

  // Group items based on groupBy prop
  const groupedItems = React.useMemo(() => {
    if (groupBy === "none") {
      return [{ title: "All Items", items, color: textColor }];
    }

    const groups: Record<string, ItemGroup> = {};

    items.forEach((item) => {
      let groupKey: string;
      let groupData: Partial<ItemGroup>;

      switch (groupBy) {
        case "urgency":
          groupKey = item.urgency.level;
          groupData = {
            title: `${
              item.urgency.level.charAt(0).toUpperCase() +
              item.urgency.level.slice(1)
            } Items`,
            color: item.urgency.color,
            icon: getUrgencyIcon(item.urgency.level),
          };
          break;
        case "location":
          groupKey = item.location;
          groupData = {
            title: `${
              item.location.charAt(0).toUpperCase() + item.location.slice(1)
            } Items`,
            color: item.location === "fridge" ? "#007AFF" : "#8E8E93",
            icon: item.location === "fridge" ? "snow" : "home",
          };
          break;
        case "category":
          groupKey = item.category || "uncategorized";
          groupData = {
            title:
              groupKey === "uncategorized"
                ? "Uncategorized"
                : `${groupKey.charAt(0).toUpperCase() + groupKey.slice(1)}`,
            color: textColor,
            icon: "pricetag",
          };
          break;
        default:
          groupKey = "all";
          groupData = { title: "All Items", color: textColor };
      }

      if (!groups[groupKey]) {
        groups[groupKey] = {
          title: groupData.title || groupKey,
          items: [],
          color: groupData.color,
          icon: groupData.icon,
        };
      }

      groups[groupKey].items.push(item);
    });

    // Sort groups by priority (urgency-based sorting)
    return Object.values(groups).sort((a, b) => {
      if (groupBy === "urgency") {
        const urgencyOrder = ["critical", "warning", "soon", "safe"];
        const aIndex = urgencyOrder.findIndex((level) =>
          a.title.toLowerCase().includes(level)
        );
        const bIndex = urgencyOrder.findIndex((level) =>
          b.title.toLowerCase().includes(level)
        );
        return aIndex - bIndex;
      }
      return a.title.localeCompare(b.title);
    });
  }, [items, groupBy, textColor]);

  const toggleItemSelection = (itemId: string) => {
    const newSelection = selectedItems.includes(itemId)
      ? selectedItems.filter((id) => id !== itemId)
      : [...selectedItems, itemId];
    onSelectionChange(newSelection);
  };

  const toggleGroupSelection = (groupItems: FoodItemWithUrgency[]) => {
    const groupItemIds = groupItems.map((item) => item.id);
    const allSelected = groupItemIds.every((id) => selectedItems.includes(id));

    if (allSelected) {
      // Deselect all items in group
      const newSelection = selectedItems.filter(
        (id) => !groupItemIds.includes(id)
      );
      onSelectionChange(newSelection);
    } else {
      // Select all items in group
      const newSelection = [...new Set([...selectedItems, ...groupItemIds])];
      onSelectionChange(newSelection);
    }
  };

  const toggleGroupExpansion = (groupTitle: string) => {
    const newExpanded = new Set(expandedGroups);
    if (newExpanded.has(groupTitle)) {
      newExpanded.delete(groupTitle);
    } else {
      newExpanded.add(groupTitle);
    }
    setExpandedGroups(newExpanded);
  };

  const getSelectionProgress = (groupItems: FoodItemWithUrgency[]) => {
    const groupItemIds = groupItems.map((item) => item.id);
    const selectedCount = groupItemIds.filter((id) =>
      selectedItems.includes(id)
    ).length;
    return selectedCount / groupItems.length;
  };

  return (
    <View style={[styles.container, { backgroundColor }]}>
      {groupedItems.map((group) => {
        const isExpanded = expandedGroups.has(group.title);
        const selectionProgress = getSelectionProgress(group.items);
        const hasSelection = selectionProgress > 0;
        const allSelected = selectionProgress === 1;

        return (
          <View key={group.title} style={[styles.group, { borderColor }]}>
            {/* Group Header */}
            <TouchableOpacity
              style={[styles.groupHeader, { borderBottomColor: borderColor }]}
              onPress={() => toggleGroupExpansion(group.title)}
            >
              <View style={styles.groupHeaderLeft}>
                {group.icon && (
                  <Ionicons name={group.icon} size={20} color={group.color} />
                )}
                <Text
                  style={[
                    styles.groupTitle,
                    { color: group.color || textColor },
                  ]}
                >
                  {group.title}
                </Text>
                <Text style={[styles.groupCount, { color: textColor }]}>
                  ({group.items.length})
                </Text>
              </View>

              <View style={styles.groupHeaderRight}>
                {showSelection && (
                  <TouchableOpacity
                    style={styles.groupSelectionButton}
                    onPress={() => toggleGroupSelection(group.items)}
                  >
                    {hasSelection && (
                      <View style={styles.selectionProgressContainer}>
                        <View
                          style={[
                            styles.selectionProgressBar,
                            {
                              width: `${selectionProgress * 100}%`,
                              backgroundColor: allSelected
                                ? "#34C759"
                                : "#007AFF",
                            },
                          ]}
                        />
                      </View>
                    )}
                    <Ionicons
                      name={
                        allSelected
                          ? "checkmark-circle"
                          : hasSelection
                          ? "ellipse"
                          : "ellipse-outline"
                      }
                      size={20}
                      color={
                        allSelected
                          ? "#34C759"
                          : hasSelection
                          ? "#007AFF"
                          : textColor
                      }
                    />
                  </TouchableOpacity>
                )}

                <Ionicons
                  name={isExpanded ? "chevron-up" : "chevron-down"}
                  size={20}
                  color={textColor}
                />
              </View>
            </TouchableOpacity>

            {/* Group Items */}
            {isExpanded && (
              <View style={styles.groupItems}>
                {group.items.map((item) => (
                  <SelectableItemCard
                    key={item.id}
                    item={item}
                    isSelected={selectedItems.includes(item.id)}
                    showSelection={showSelection}
                    onPress={() => onItemPress?.(item)}
                    onSelectionToggle={() => toggleItemSelection(item.id)}
                    textColor={textColor}
                    backgroundColor={backgroundColor}
                    borderColor={borderColor}
                  />
                ))}
              </View>
            )}
          </View>
        );
      })}
    </View>
  );
}

// Selectable Item Card Component
interface SelectableItemCardProps {
  item: FoodItemWithUrgency;
  isSelected: boolean;
  showSelection: boolean;
  onPress: () => void;
  onSelectionToggle: () => void;
  textColor: string;
  backgroundColor: string;
  borderColor: string;
}

function SelectableItemCard({
  item,
  isSelected,
  showSelection,
  onPress,
  onSelectionToggle,
  textColor,
  backgroundColor,
  borderColor,
}: SelectableItemCardProps) {
  const animatedScale = React.useRef(new Animated.Value(1)).current;

  const handlePress = () => {
    if (showSelection) {
      // Animate selection
      Animated.sequence([
        Animated.timing(animatedScale, {
          toValue: 0.95,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(animatedScale, {
          toValue: 1,
          duration: 100,
          useNativeDriver: true,
        }),
      ]).start();

      onSelectionToggle();
    } else {
      onPress();
    }
  };

  const cardBackgroundColor = isSelected
    ? item.urgency.backgroundColor + "40" // More transparent when selected
    : item.urgency.backgroundColor;

  return (
    <Animated.View
      style={[
        styles.itemCard,
        {
          backgroundColor: cardBackgroundColor,
          borderColor: isSelected ? "#007AFF" : item.urgency.borderColor,
          borderWidth: isSelected ? 2 : 1,
          transform: [{ scale: animatedScale }],
        },
      ]}
    >
      <TouchableOpacity
        style={styles.itemCardContent}
        onPress={handlePress}
        onLongPress={showSelection ? undefined : onSelectionToggle}
      >
        {/* Selection Indicator */}
        {showSelection && (
          <View style={styles.selectionIndicator}>
            <Ionicons
              name={isSelected ? "checkmark-circle" : "ellipse-outline"}
              size={24}
              color={isSelected ? "#007AFF" : textColor}
            />
          </View>
        )}

        {/* Food Icon */}
        <View style={styles.itemIcon}>
          <Text style={styles.emojiIcon}>
            {getFoodIcon(item.name, item.category)}
          </Text>
        </View>

        {/* Item Info */}
        <View style={styles.itemInfo}>
          <Text style={[styles.itemName, { color: item.urgency.color }]}>
            {item.name}
          </Text>
          <Text style={[styles.itemDetails, { color: textColor }]}>
            {item.quantity} {item.unit} • {item.location}
          </Text>
          <Text style={[styles.itemExpiry, { color: textColor }]}>
            {item.urgency.description}
          </Text>
        </View>

        {/* Urgency Badge */}
        <View
          style={[styles.urgencyBadge, { backgroundColor: item.urgency.color }]}
        >
          <Text style={styles.urgencyText}>
            {item.urgency.level.charAt(0).toUpperCase()}
          </Text>
        </View>

        {/* Arrow or Selection State */}
        {!showSelection && (
          <Ionicons
            name="chevron-forward"
            size={16}
            color={textColor}
            style={{ opacity: 0.5 }}
          />
        )}
      </TouchableOpacity>
    </Animated.View>
  );
}

// Helper function to get urgency icon
function getUrgencyIcon(urgencyLevel: string): keyof typeof Ionicons.glyphMap {
  switch (urgencyLevel) {
    case "critical":
      return "warning";
    case "warning":
      return "alert-circle";
    case "soon":
      return "time";
    case "safe":
      return "checkmark-circle";
    default:
      return "information-circle";
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  // Group Styles
  group: {
    borderWidth: 1,
    borderRadius: 12,
    margin: 8,
    overflow: "hidden",
  },
  groupHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
  },
  groupHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flex: 1,
  },
  groupTitle: {
    fontSize: 16,
    fontWeight: "600",
  },
  groupCount: {
    fontSize: 14,
    opacity: 0.7,
  },
  groupHeaderRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  groupSelectionButton: {
    position: "relative",
    justifyContent: "center",
    alignItems: "center",
  },
  selectionProgressContainer: {
    position: "absolute",
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#E0E0E0",
    overflow: "hidden",
  },
  selectionProgressBar: {
    height: "100%",
    borderRadius: 10,
  },
  groupItems: {
    padding: 8,
  },

  // Item Card Styles
  itemCard: {
    borderRadius: 12,
    marginVertical: 4,
    overflow: "hidden",
  },
  itemCardContent: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    gap: 12,
  },
  selectionIndicator: {
    width: 24,
    alignItems: "center",
  },
  itemIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  itemInfo: {
    flex: 1,
    gap: 2,
  },
  itemName: {
    fontSize: 16,
    fontWeight: "600",
  },
  itemDetails: {
    fontSize: 14,
    opacity: 0.8,
  },
  itemExpiry: {
    fontSize: 12,
    opacity: 0.7,
  },
  urgencyBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  urgencyText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "bold",
  },
  emojiIcon: {
    fontSize: 24,
  },
});
