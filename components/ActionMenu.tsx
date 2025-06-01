import { Ionicons } from "@expo/vector-icons";
import React from "react";
import {
  Modal,
  StyleSheet,
  Text,
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
          <View
            style={[
              styles.menuContainer,
              {
                position: "absolute",
                top: position.y,
                left: position.x,
              },
            ]}
          >
            {/* Edit option */}
            <TouchableOpacity
              style={styles.menuItem}
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
              <Text style={styles.menuText}>Edit Item</Text>
            </TouchableOpacity>

            {/* Delete option */}
            <TouchableOpacity
              style={[styles.menuItem, styles.deleteMenuItem]}
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
              <Text style={styles.deleteMenuText}>Delete Item</Text>
            </TouchableOpacity>
          </View>
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
    backgroundColor: "white",
    borderRadius: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
    overflow: "visible",
    borderWidth: 0.5,
    borderColor: "rgba(0,0,0,0.1)",
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
