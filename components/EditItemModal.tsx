import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import {
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

type EditItemModalProps = {
  visible: boolean;
  onClose: () => void;
  onUpdate: (itemData: {
    name: string;
    quantity: number;
    daysUntilExpiry: number;
    location: string;
  }) => void;
  onDelete: () => void;
  itemData: {
    name: string;
    quantity: number;
    daysUntilExpiry: number;
    location: string;
  };
};

/**
 * A modal component for editing food item details
 */
const EditItemModal: React.FC<EditItemModalProps> = ({
  visible,
  onClose,
  onUpdate,
  onDelete,
  itemData,
}) => {
  const [name, setName] = useState(itemData.name);
  const [quantity, setQuantity] = useState(itemData.quantity);
  const [daysUntilExpiry, setDaysUntilExpiry] = useState(
    itemData.daysUntilExpiry.toString()
  );
  const [location, setLocation] = useState(itemData.location);
  const [showLocationDropdown, setShowLocationDropdown] = useState(false);

  // Update local state when itemData changes
  useEffect(() => {
    if (visible) {
      setName(itemData.name);
      setQuantity(itemData.quantity);
      setDaysUntilExpiry(itemData.daysUntilExpiry.toString());
      setLocation(itemData.location);
    }
  }, [visible, itemData]);

  const handleDecrement = () => {
    if (quantity > 1) {
      setQuantity(quantity - 1);
    }
  };

  const handleIncrement = () => {
    setQuantity(quantity + 1);
  };

  const handleUpdate = () => {
    onUpdate({
      name,
      quantity,
      daysUntilExpiry: parseInt(daysUntilExpiry) || 0,
      location,
    });
    onClose();
  };

  const locationOptions = ["Fridge", "Shelf"];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Edit {name}</Text>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Ionicons name="close" size={24} color="#374151" />
            </TouchableOpacity>
          </View>

          {/* Form Content */}
          <View style={styles.content}>
            {/* Item Name */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Item Name</Text>
              <TextInput
                style={styles.textInput}
                value={name}
                onChangeText={setName}
                placeholder="Enter item name"
              />
            </View>

            {/* Quantity & Days Until Expiry */}
            <View style={styles.formRow}>
              <View style={[styles.formGroup, { flex: 1, marginRight: 8 }]}>
                <Text style={styles.label}>Quantity</Text>
                <View style={styles.quantityContainer}>
                  <TouchableOpacity
                    style={styles.quantityButton}
                    onPress={handleDecrement}
                  >
                    <Text style={styles.quantityButtonText}>−</Text>
                  </TouchableOpacity>
                  <TextInput
                    style={styles.quantityInput}
                    value={quantity.toString()}
                    onChangeText={(text) => {
                      const num = parseInt(text);
                      if (!isNaN(num) && num > 0) {
                        setQuantity(num);
                      } else if (text === "") {
                        setQuantity(0);
                      }
                    }}
                    keyboardType="numeric"
                  />
                  <TouchableOpacity
                    style={styles.quantityButton}
                    onPress={handleIncrement}
                  >
                    <Text style={styles.quantityButtonText}>+</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={[styles.formGroup, { flex: 1 }]}>
                <Text style={styles.label}>Days Until Expiry</Text>
                <TextInput
                  style={styles.textInput}
                  value={daysUntilExpiry}
                  onChangeText={(text) => {
                    // Allow only numbers
                    if (/^\d*$/.test(text)) {
                      setDaysUntilExpiry(text);
                    }
                  }}
                  keyboardType="numeric"
                  placeholder="Days"
                />
              </View>
            </View>

            {/* Location */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Location</Text>
              <TouchableOpacity
                style={styles.dropdownButton}
                onPress={() => setShowLocationDropdown(!showLocationDropdown)}
              >
                <Text style={styles.dropdownButtonText}>{location}</Text>
                <Ionicons
                  name={showLocationDropdown ? "chevron-up" : "chevron-down"}
                  size={16}
                  color="#374151"
                />
              </TouchableOpacity>

              {showLocationDropdown && (
                <View style={styles.dropdownMenu}>
                  {locationOptions.map((option) => (
                    <TouchableOpacity
                      key={option}
                      style={[
                        styles.dropdownItem,
                        location === option && styles.dropdownItemSelected,
                      ]}
                      onPress={() => {
                        setLocation(option);
                        setShowLocationDropdown(false);
                      }}
                    >
                      <Text
                        style={[
                          styles.dropdownItemText,
                          location === option &&
                            styles.dropdownItemTextSelected,
                        ]}
                      >
                        {option}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.actions}>
            <TouchableOpacity
              style={styles.updateButton}
              onPress={handleUpdate}
            >
              <Text style={styles.updateButtonText}>Update Item</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.deleteButton} onPress={onDelete}>
              <Ionicons name="trash" size={16} color="#EF4444" />
              <Text style={styles.deleteButtonText}>Delete</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    width: "90%",
    maxWidth: 400,
    backgroundColor: "white",
    borderRadius: 12,
    overflow: "hidden",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    color: "#111827",
  },
  closeButton: {
    padding: 4,
  },
  content: {
    padding: 20,
  },
  formGroup: {
    marginBottom: 16,
  },
  formRow: {
    flexDirection: "row",
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: "500",
    color: "#374151",
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: "#111827",
  },
  quantityContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  quantityButton: {
    width: 36,
    height: 36,
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 6,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "white",
  },
  quantityButtonText: {
    fontSize: 20,
    color: "#374151",
    fontWeight: "400",
  },
  quantityInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginHorizontal: 8,
    fontSize: 16,
    color: "#111827",
    textAlign: "center",
  },
  dropdownButton: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  dropdownButtonText: {
    fontSize: 16,
    color: "#111827",
  },
  dropdownMenu: {
    marginTop: 4,
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 6,
    backgroundColor: "white",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  dropdownItem: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  dropdownItemSelected: {
    backgroundColor: "#F3F8FF",
  },
  dropdownItemText: {
    fontSize: 16,
    color: "#374151",
  },
  dropdownItemTextSelected: {
    color: "#2563EB",
    fontWeight: "500",
  },
  actions: {
    flexDirection: "row",
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
  },
  updateButton: {
    flex: 1,
    backgroundColor: "#3B82F6",
    borderRadius: 6,
    paddingVertical: 12,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
  },
  updateButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "white",
  },
  deleteButton: {
    flexDirection: "row",
    borderWidth: 1,
    borderColor: "#EF4444",
    borderRadius: 6,
    paddingVertical: 12,
    paddingHorizontal: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  deleteButtonText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#EF4444",
    marginLeft: 8,
  },
});

export default EditItemModal;
