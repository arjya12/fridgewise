// components/BatchSelectionManager.tsx
import { useThemeColor } from "@/hooks/useThemeColor";
import { FoodItemWithUrgency } from "@/services/foodItems";
import { Ionicons } from "@expo/vector-icons";
import React, { useMemo, useState } from "react";
import {
  Animated,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

interface BatchSelectionManagerProps {
  items: FoodItemWithUrgency[];
  selectedItemIds: string[];
  onSelectionChange: (selectedIds: string[]) => void;
  onOpenBatchActions: () => void;
  selectionMode: boolean;
  onToggleSelectionMode: () => void;
}

const BatchSelectionManager: React.FC<BatchSelectionManagerProps> = ({
  items,
  selectedItemIds,
  onSelectionChange,
  onOpenBatchActions,
  selectionMode,
  onToggleSelectionMode,
}) => {
  const [showQuickFilters, setShowQuickFilters] = useState(false);
  const [animatedValue] = useState(new Animated.Value(0));

  const backgroundColor = useThemeColor(
    { light: "#FFFFFF", dark: "#1D1D1D" },
    "background"
  );
  const surfaceColor = useThemeColor(
    { light: "#F8F9FA", dark: "#2C2C2E" },
    "background"
  );
  const textColor = useThemeColor(
    { light: "#11181C", dark: "#ECEDEE" },
    "text"
  );
  const primaryColor = "#007AFF";
  const borderColor = useThemeColor(
    { light: "#E0E0E0", dark: "#3C3C3E" },
    "border"
  );

  // Animate selection mode visibility
  React.useEffect(() => {
    Animated.timing(animatedValue, {
      toValue: selectionMode ? 1 : 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [selectionMode, animatedValue]);

  const selectedItems = useMemo(() => {
    return items.filter((item) => selectedItemIds.includes(item.id));
  }, [items, selectedItemIds]);

  const selectionStats = useMemo(() => {
    const stats = {
      total: selectedItemIds.length,
      critical: 0,
      warning: 0,
      soon: 0,
      safe: 0,
      categories: new Set<string>(),
      locations: new Set<string>(),
    };

    selectedItems.forEach((item) => {
      stats[item.urgency.level as keyof typeof stats]++;
      if (item.category) {
        stats.categories.add(item.category);
      }
      stats.locations.add(item.location);
    });

    return stats;
  }, [selectedItems]);

  const quickFilterOptions = [
    {
      id: "all",
      label: "Select All",
      icon: "checkmark-circle",
      action: () => onSelectionChange(items.map((item) => item.id)),
    },
    {
      id: "critical",
      label: "Critical Items",
      icon: "alert-circle",
      color: "#EF4444",
      action: () =>
        onSelectionChange(
          items
            .filter((item) => item.urgency.level === "critical")
            .map((item) => item.id)
        ),
    },
    {
      id: "warning",
      label: "Warning Items",
      icon: "warning",
      color: "#F97316",
      action: () =>
        onSelectionChange(
          items
            .filter((item) => item.urgency.level === "warning")
            .map((item) => item.id)
        ),
    },
    {
      id: "fridge",
      label: "Fridge Items",
      icon: "snow",
      color: "#3B82F6",
      action: () =>
        onSelectionChange(
          items
            .filter((item) => item.location.toLowerCase().includes("fridge"))
            .map((item) => item.id)
        ),
    },
    {
      id: "expiring-week",
      label: "Expiring This Week",
      icon: "time",
      color: "#F59E0B",
      action: () =>
        onSelectionChange(
          items
            .filter((item) => {
              if (!item.expiry_date) return false;
              const expiryDate = new Date(item.expiry_date);
              const weekFromNow = new Date();
              weekFromNow.setDate(weekFromNow.getDate() + 7);
              return expiryDate <= weekFromNow;
            })
            .map((item) => item.id)
        ),
    },
    {
      id: "low-quantity",
      label: "Low Quantity",
      icon: "pie-chart",
      color: "#8B5CF6",
      action: () =>
        onSelectionChange(
          items.filter((item) => item.quantity <= 2).map((item) => item.id)
        ),
    },
    {
      id: "clear",
      label: "Clear Selection",
      icon: "close-circle",
      color: "#6B7280",
      action: () => onSelectionChange([]),
    },
  ];

  const toggleItemSelection = (itemId: string) => {
    if (selectedItemIds.includes(itemId)) {
      onSelectionChange(selectedItemIds.filter((id) => id !== itemId));
    } else {
      onSelectionChange([...selectedItemIds, itemId]);
    }
  };

  const handleLongPress = (itemId: string) => {
    if (!selectionMode) {
      onToggleSelectionMode();
      onSelectionChange([itemId]);
    }
  };

  const renderQuickFiltersModal = () => (
    <Modal
      visible={showQuickFilters}
      transparent
      animationType="fade"
      onRequestClose={() => setShowQuickFilters(false)}
    >
      <TouchableOpacity
        style={styles.modalOverlay}
        activeOpacity={1}
        onPress={() => setShowQuickFilters(false)}
      >
        <View
          style={[styles.quickFiltersModal, { backgroundColor: surfaceColor }]}
        >
          <Text style={[styles.quickFiltersTitle, { color: textColor }]}>
            Quick Select
          </Text>

          <View style={styles.quickFiltersGrid}>
            {quickFilterOptions.map((option) => (
              <TouchableOpacity
                key={option.id}
                style={[
                  styles.quickFilterButton,
                  { backgroundColor: backgroundColor, borderColor },
                ]}
                onPress={() => {
                  option.action();
                  setShowQuickFilters(false);
                }}
              >
                <Ionicons
                  name={option.icon as any}
                  size={20}
                  color={option.color || textColor}
                />
                <Text
                  style={[
                    styles.quickFilterText,
                    { color: option.color || textColor },
                  ]}
                  numberOfLines={2}
                >
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </TouchableOpacity>
    </Modal>
  );

  if (!selectionMode && selectedItemIds.length === 0) {
    return null;
  }

  return (
    <Animated.View
      style={[
        styles.container,
        {
          backgroundColor: surfaceColor,
          borderTopColor: borderColor,
          opacity: animatedValue,
          transform: [
            {
              translateY: animatedValue.interpolate({
                inputRange: [0, 1],
                outputRange: [100, 0],
              }),
            },
          ],
        },
      ]}
    >
      {selectionMode && (
        <>
          {/* Selection Header */}
          <View style={styles.selectionHeader}>
            <View style={styles.selectionInfo}>
              <Text style={[styles.selectionCount, { color: textColor }]}>
                {selectedItemIds.length} selected
              </Text>

              {selectedItemIds.length > 0 && (
                <View style={styles.selectionStats}>
                  {selectionStats.critical > 0 && (
                    <View
                      style={[
                        styles.statBadge,
                        { backgroundColor: "#EF444420" },
                      ]}
                    >
                      <Text style={[styles.statText, { color: "#EF4444" }]}>
                        {selectionStats.critical} critical
                      </Text>
                    </View>
                  )}
                  {selectionStats.warning > 0 && (
                    <View
                      style={[
                        styles.statBadge,
                        { backgroundColor: "#F9731620" },
                      ]}
                    >
                      <Text style={[styles.statText, { color: "#F97316" }]}>
                        {selectionStats.warning} warning
                      </Text>
                    </View>
                  )}
                </View>
              )}
            </View>

            <View style={styles.selectionActions}>
              <TouchableOpacity
                style={[styles.actionButton, { borderColor }]}
                onPress={() => setShowQuickFilters(true)}
              >
                <Ionicons name="options" size={20} color={textColor} />
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionButton, { borderColor }]}
                onPress={onToggleSelectionMode}
              >
                <Ionicons name="close" size={20} color={textColor} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Selection Summary */}
          {selectedItemIds.length > 0 && (
            <View style={styles.selectionSummary}>
              <View style={styles.summaryRow}>
                <Ionicons name="pricetag" size={16} color={textColor} />
                <Text style={[styles.summaryText, { color: textColor }]}>
                  {Array.from(selectionStats.categories).join(", ")}
                </Text>
              </View>

              <View style={styles.summaryRow}>
                <Ionicons name="location" size={16} color={textColor} />
                <Text style={[styles.summaryText, { color: textColor }]}>
                  {Array.from(selectionStats.locations).join(", ")}
                </Text>
              </View>
            </View>
          )}
        </>
      )}

      {/* Action Button */}
      {selectedItemIds.length > 0 && (
        <TouchableOpacity
          style={[styles.batchActionButton, { backgroundColor: primaryColor }]}
          onPress={onOpenBatchActions}
        >
          <Ionicons name="layers" size={20} color="#FFFFFF" />
          <Text style={styles.batchActionText}>
            Batch Actions ({selectedItemIds.length})
          </Text>
          <Ionicons name="chevron-forward" size={20} color="#FFFFFF" />
        </TouchableOpacity>
      )}

      {renderQuickFiltersModal()}
    </Animated.View>
  );
};

// Selection checkbox component for individual items
export const SelectionCheckbox: React.FC<{
  selected: boolean;
  onPress: () => void;
  selectionMode: boolean;
}> = ({ selected, onPress, selectionMode }) => {
  const primaryColor = "#007AFF";
  const backgroundColor = useThemeColor(
    { light: "#FFFFFF", dark: "#1D1D1D" },
    "background"
  );
  const borderColor = useThemeColor(
    { light: "#E0E0E0", dark: "#3C3C3E" },
    "border"
  );

  if (!selectionMode) return null;

  return (
    <TouchableOpacity
      style={[
        styles.checkbox,
        {
          backgroundColor: selected ? primaryColor : backgroundColor,
          borderColor: selected ? primaryColor : borderColor,
        },
      ]}
      onPress={onPress}
    >
      {selected && <Ionicons name="checkmark" size={16} color="#FFFFFF" />}
    </TouchableOpacity>
  );
};

// Enhanced item card wrapper for selection support
export const SelectableItemWrapper: React.FC<{
  children: React.ReactNode;
  item: FoodItemWithUrgency;
  selected: boolean;
  selectionMode: boolean;
  onPress: () => void;
  onLongPress: () => void;
  onSelectionToggle: () => void;
}> = ({
  children,
  item,
  selected,
  selectionMode,
  onPress,
  onLongPress,
  onSelectionToggle,
}) => {
  const borderColor = useThemeColor(
    { light: "#E0E0E0", dark: "#3C3C3E" },
    "border"
  );
  const primaryColor = "#007AFF";

  return (
    <TouchableOpacity
      style={[
        styles.selectableWrapper,
        selectionMode && {
          borderWidth: 2,
          borderColor: selected ? primaryColor : borderColor,
          backgroundColor: selected ? primaryColor + "10" : "transparent",
        },
      ]}
      onPress={selectionMode ? onSelectionToggle : onPress}
      onLongPress={onLongPress}
      delayLongPress={500}
    >
      <View style={styles.selectableContent}>
        {selectionMode && (
          <SelectionCheckbox
            selected={selected}
            onPress={onSelectionToggle}
            selectionMode={selectionMode}
          />
        )}
        <View
          style={[
            styles.itemContent,
            selectionMode && styles.itemContentWithSelection,
          ]}
        >
          {children}
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    borderTopWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingBottom: 20,
  },
  selectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  selectionInfo: {
    flex: 1,
  },
  selectionCount: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 4,
  },
  selectionStats: {
    flexDirection: "row",
    gap: 6,
  },
  statBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  statText: {
    fontSize: 12,
    fontWeight: "500",
  },
  selectionActions: {
    flexDirection: "row",
    gap: 8,
  },
  actionButton: {
    padding: 8,
    borderWidth: 1,
    borderRadius: 8,
  },
  selectionSummary: {
    gap: 4,
    marginBottom: 12,
  },
  summaryRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  summaryText: {
    fontSize: 14,
    opacity: 0.8,
    flex: 1,
  },
  batchActionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  batchActionText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  quickFiltersModal: {
    width: "90%",
    maxWidth: 400,
    borderRadius: 16,
    padding: 20,
  },
  quickFiltersTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 16,
    textAlign: "center",
  },
  quickFiltersGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  quickFilterButton: {
    width: "48%",
    alignItems: "center",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
  },
  quickFilterText: {
    fontSize: 14,
    fontWeight: "500",
    textAlign: "center",
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    justifyContent: "center",
    alignItems: "center",
  },
  selectableWrapper: {
    borderRadius: 12,
  },
  selectableContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  itemContent: {
    flex: 1,
  },
  itemContentWithSelection: {
    opacity: 0.9,
  },
});

export default BatchSelectionManager;
