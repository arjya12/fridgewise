import { ThemedText } from "@/components/ThemedText";
import { useColorScheme } from "@/hooks/useColorScheme";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import {
  Animated,
  Modal,
  StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";

type ActionMenuProps = {
  visible: boolean;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
  position: {
    x: number;
    y: number;
  };
};

/**
 * A dropdown menu component that appears when the user taps the three-dot icon
 */
const ActionMenu: React.FC<ActionMenuProps> = ({
  visible,
  onClose,
  onEdit,
  onDelete,
  position,
}) => {
  const theme = useColorScheme();
  const isDark = theme === "dark";

  // Animation for menu appearance
  const [scaleAnim] = React.useState(new Animated.Value(0.9));
  const [opacityAnim] = React.useState(new Animated.Value(0));

  React.useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      // Reset animation values when menu is closed
      scaleAnim.setValue(0.9);
      opacityAnim.setValue(0);
    }
  }, [visible, scaleAnim, opacityAnim]);

  if (!visible) return null;

  return (
    <Modal
      transparent
      visible={visible}
      animationType="none"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <Animated.View
            style={[
              styles.menuContainer,
              {
                position: "absolute",
                top: position.y,
                left: position.x,
                transform: [{ scale: scaleAnim }],
                opacity: opacityAnim,
                backgroundColor: isDark ? "#1C1C1E" : "white",
                borderColor: isDark ? "#2C2C2E" : "rgba(0,0,0,0.1)",
              },
            ]}
          >
            {/* Edit option */}
            <TouchableOpacity
              style={[
                styles.menuItem,
                isDark && { borderBottomColor: "#2C2C2E" },
              ]}
              onPress={() => {
                onClose();
                onEdit();
              }}
            >
              <Ionicons
                name="pencil"
                size={16}
                color="#0066FF"
                style={styles.menuIcon}
              />
              <ThemedText style={styles.menuText}>Edit Item</ThemedText>
            </TouchableOpacity>

            {/* Delete option */}
            <TouchableOpacity
              style={[
                styles.menuItem,
                styles.deleteMenuItem,
                isDark && { backgroundColor: "#2A1414" },
              ]}
              onPress={() => {
                onClose();
                onDelete();
              }}
            >
              <Ionicons
                name="trash"
                size={16}
                color="#DC2626"
                style={styles.menuIcon}
              />
              <ThemedText style={styles.deleteMenuText}>Delete Item</ThemedText>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "transparent",
  },
  menuContainer: {
    width: 160,
    borderRadius: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
    overflow: "visible",
    borderWidth: 0.5,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  deleteMenuItem: {
    backgroundColor: "#FEF2F2",
    borderBottomWidth: 0,
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
  },
  menuIcon: {
    marginRight: 12,
  },
  menuText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#0066FF",
  },
  deleteMenuText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#DC2626",
  },
});

export default ActionMenu;
