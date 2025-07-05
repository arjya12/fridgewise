import { formatExpiry } from "@/utils/formatExpiry";
import { Ionicons } from "@expo/vector-icons";
import React, { useRef } from "react";
import { Alert, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Swipeable } from "react-native-gesture-handler";

type ItemEntryCardProps = {
  quantity: number;
  isUseFirst?: boolean;
  expiryDate?: string;
  onDecrement: () => void;
  onIncrement: () => void;
  onUseAll: () => void;
  onOptionsPress?: () => void;
  onEditPress?: () => void;
  onDeletePress?: () => void;
};

/**
 * A component to display a single food item entry with controls
 */
const ItemEntryCard: React.FC<ItemEntryCardProps> = ({
  quantity,
  isUseFirst = false,
  expiryDate,
  onDecrement,
  onIncrement,
  onUseAll,
  onOptionsPress,
  onEditPress,
  onDeletePress,
}) => {
  const expiryStatus = formatExpiry(expiryDate);
  const { color, backgroundColor, borderColor, iconColor } =
    getExpiryColors(expiryStatus);
  const swipeableRef = useRef<Swipeable>(null);

  const handleEditPress = () => {
    swipeableRef.current?.close();
    if (onEditPress) {
      onEditPress();
    }
  };

  const showDeleteConfirmation = () => {
    swipeableRef.current?.close();
    Alert.alert(
      "Delete Item",
      "Are you sure you want to delete this item? This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            if (onDeletePress) {
              onDeletePress();
            }
          },
        },
      ]
    );
  };

  const renderRightActions = () => {
    return (
      <View style={styles.rightActionsContainer}>
        <TouchableOpacity
          style={styles.editButton}
          onPress={handleEditPress}
          accessibilityLabel="Edit item"
        >
          <Ionicons name="pencil" size={20} color="#FFFFFF" />
          <Text style={styles.actionButtonText}>Edit</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.deleteButton}
          onPress={showDeleteConfirmation}
          accessibilityLabel="Delete item"
        >
          <Ionicons name="trash" size={20} color="#FFFFFF" />
          <Text style={styles.actionButtonText}>Delete</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <Swipeable
      ref={swipeableRef}
      renderRightActions={renderRightActions}
      friction={2}
      rightThreshold={40}
    >
      <View style={[styles.container, { backgroundColor }]}>
        <View style={styles.topRow}>
          <View style={styles.quantitySection}>
            <Text style={styles.quantityText}>{quantity}</Text>
          </View>

          {isUseFirst && (
            <View style={styles.useFirstContainer}>
              <Ionicons
                name="alert-circle"
                size={12}
                color="#92400E"
                style={styles.useFirstIcon}
              />
              <Text style={styles.useFirstText}>Use First</Text>
            </View>
          )}
        </View>

        <View style={styles.bottomRow}>
          {expiryStatus && (
            <View
              style={[
                styles.expiryBadge,
                { backgroundColor: borderColor, borderColor },
              ]}
            >
              <Ionicons
                name="alert-circle"
                size={12}
                color={iconColor}
                style={styles.expiryIcon}
              />
              <Text style={[styles.expiryText, { color }]}>{expiryStatus}</Text>
            </View>
          )}

          <View style={styles.controlsContainer}>
            <TouchableOpacity
              style={styles.decrementButton}
              onPress={onDecrement}
              accessibilityLabel="Decrease quantity"
            >
              <Text style={styles.controlButtonText}>−</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.incrementButton}
              onPress={onIncrement}
              accessibilityLabel="Increase quantity"
            >
              <Text style={styles.controlButtonText}>+</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.useAllButton}
              onPress={onUseAll}
              accessibilityLabel="Use all"
            >
              <Text style={styles.useAllButtonText}>Use All</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Swipeable>
  );
};

const getExpiryColors = (status: string) => {
  if (status.includes("Expired")) {
    return {
      color: "#991B1B",
      backgroundColor: "#FEE2E2",
      borderColor: "#FECACA",
      iconColor: "#DC2626",
    };
  }
  if (status.includes("Today") || status.includes("Tomorrow")) {
    return {
      color: "#9A3412",
      backgroundColor: "#FFEDD5",
      borderColor: "#FED7AA",
      iconColor: "#F97316",
    };
  }
  if (status.includes("days")) {
    return {
      color: "#92400E",
      backgroundColor: "#FEF3C7",
      borderColor: "#FDE68A",
      iconColor: "#FBBF24",
    };
  }
  return {
    color: "#6B7280",
    backgroundColor: "#F3F4F6",
    borderColor: "#E5E7EB",
    iconColor: "#9CA3AF",
  };
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#FFFBEB",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#0000001A",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  quantitySection: {
    flexDirection: "row",
    alignItems: "center",
  },
  useFirstIcon: {
    marginRight: 4,
  },
  quantityText: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1F2937",
  },
  useFirstContainer: {
    backgroundColor: "#FEF3C7",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#FBBF24",
  },
  useFirstText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#92400E",
  },
  bottomRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  expiryBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
  },
  expiryIcon: {
    marginRight: 4,
  },
  expiryText: {
    fontSize: 12,
    fontWeight: "600",
  },
  controlsContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  decrementButton: {
    width: 36,
    height: 36,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    backgroundColor: "white",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
  },
  incrementButton: {
    width: 36,
    height: 36,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    backgroundColor: "white",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
  },
  controlButtonText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#4B5563",
    lineHeight: 22,
  },
  useAllButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: "#374151", // Consistent dark gray
    marginLeft: 8,
  },
  useAllButtonText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#FFFFFF", // White text for high contrast
  },
  rightActionsContainer: {
    flexDirection: "row",
    width: 160,
    marginBottom: 12,
  },
  editButton: {
    backgroundColor: "#0066FF",
    justifyContent: "center",
    alignItems: "center",
    width: 80,
    borderTopLeftRadius: 12,
    borderBottomLeftRadius: 12,
  },
  deleteButton: {
    backgroundColor: "#DC2626",
    justifyContent: "center",
    alignItems: "center",
    width: 80,
    borderTopRightRadius: 12,
    borderBottomRightRadius: 12,
  },
  actionButtonText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "600",
    marginTop: 4,
  },
});

export default ItemEntryCard;
