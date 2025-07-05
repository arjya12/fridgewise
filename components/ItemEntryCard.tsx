import { formatExpiry } from "@/utils/formatExpiry";
import { Ionicons } from "@expo/vector-icons";
import React, { useRef, useState } from "react";
import {
  Dimensions,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import ActionMenu from "./ActionMenu";

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
  const [menuVisible, setMenuVisible] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });
  const optionsButtonRef = useRef<View>(null);

  const handleOptionsPress = () => {
    if (optionsButtonRef.current) {
      // We're directly measuring the three-dot button's position on screen
      optionsButtonRef.current.measure(
        (
          x: number,
          y: number,
          width: number,
          height: number,
          pageX: number,
          pageY: number
        ) => {
          // Get screen dimensions to ensure menu stays on screen
          const screenWidth = Dimensions.get("window").width;

          // Calculate the absolute position for the menu
          // - Horizontal position: Align with the right side of the controls section
          // - Vertical position: Place exactly 2px below the button's bottom edge
          const menuX = Math.min(screenWidth - 170, pageX - 140);
          const menuY = pageY + height + 2; // Exactly 2px below button

          setMenuPosition({ x: menuX, y: menuY });
          setMenuVisible(true);

          // Also call the original onOptionsPress if provided
          if (onOptionsPress) {
            onOptionsPress();
          }
        }
      );
    }
  };

  const handleEditPress = () => {
    if (onEditPress) {
      onEditPress();
    }
  };

  const handleDeletePress = () => {
    if (onDeletePress) {
      onDeletePress();
    }
  };

  return (
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

          {(onOptionsPress || onEditPress || onDeletePress) && (
            <TouchableOpacity
              style={styles.optionsButton}
              onPress={handleOptionsPress}
              accessibilityLabel="More options"
            >
              <View ref={optionsButtonRef} collapsable={false}>
                <Ionicons name="ellipsis-vertical" size={16} color="#9CA3AF" />
              </View>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Action Menu */}
      {menuVisible && (
        <ActionMenu
          visible={menuVisible}
          onClose={() => setMenuVisible(false)}
          onEdit={handleEditPress}
          onDelete={handleDeletePress}
          position={menuPosition}
        />
      )}
    </View>
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
    paddingHorizontal: 12,
    height: 36,
    borderRadius: 6,
    backgroundColor: "#F3F4F6",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
  },
  useAllButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#4B5563",
  },
  optionsButton: {
    width: 36,
    height: 36,
    borderRadius: 6,
    justifyContent: "center",
    alignItems: "center",
  },
});

export default ItemEntryCard;
