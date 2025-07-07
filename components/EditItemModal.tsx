import { useColorScheme } from "@/hooks/useColorScheme";
import { foodCategoryIcons } from "@/utils/foodCategoryIcons";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import React, { useEffect, useState } from "react";
import {
  Animated,
  Modal,
  Platform,
  ScrollView,
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
    expiryDate: string;
    location: string;
    category: string;
    notes: string;
  }) => void;
  onDelete: () => void;
  itemData: {
    name: string;
    quantity: number;
    expiryDate: string;
    location: string;
    category: string;
    notes: string;
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
  const theme = useColorScheme();
  const isDark = theme === "dark";

  const [name, setName] = useState(itemData.name);
  const [quantity, setQuantity] = useState(itemData.quantity);
  const [expiryDate, setExpiryDate] = useState(new Date(itemData.expiryDate));
  const [location, setLocation] = useState(itemData.location);
  const [category, setCategory] = useState(itemData.category);
  const [notes, setNotes] = useState(itemData.notes);

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showLocationDropdown, setShowLocationDropdown] = useState(false);

  // Animation for dropdown
  const [dropdownAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    if (showLocationDropdown) {
      Animated.timing(dropdownAnim, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }).start();
    } else {
      dropdownAnim.setValue(0);
    }
  }, [showLocationDropdown, dropdownAnim]);

  // Update local state when itemData changes
  useEffect(() => {
    if (visible) {
      setName(itemData.name);
      setQuantity(itemData.quantity);
      setExpiryDate(new Date(itemData.expiryDate));
      setLocation(itemData.location);
      setCategory(itemData.category);
      setNotes(itemData.notes || "");
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
      expiryDate: expiryDate.toISOString(),
      location,
      category,
      notes,
    });
    onClose();
  };

  const onDateChange = (event: any, selectedDate?: Date) => {
    const currentDate = selectedDate || expiryDate;
    setShowDatePicker(Platform.OS === "ios");
    setExpiryDate(currentDate);
  };

  const locationOptions = ["Fridge", "Shelf"];
  const categoryOptions = Object.keys(foodCategoryIcons);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View
          style={[
            styles.modalContainer,
            isDark && { backgroundColor: "#1C1C1E" },
          ]}
        >
          {/* Header */}
          <View
            style={[styles.header, isDark && { borderBottomColor: "#2C2C2E" }]}
          >
            <Text style={[styles.title, isDark && { color: "#ECEDEE" }]}>
              Edit {name}
            </Text>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Ionicons
                name="close"
                size={24}
                color={isDark ? "#9BA1A6" : "#374151"}
              />
            </TouchableOpacity>
          </View>

          {/* Form Content */}
          <ScrollView style={styles.content}>
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

            {/* Quantity & Expiry Date */}
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
                <Text style={styles.label}>Expiry Date</Text>
                <TouchableOpacity
                  style={styles.textInput}
                  onPress={() => setShowDatePicker(true)}
                >
                  <Text>{expiryDate.toLocaleDateString()}</Text>
                </TouchableOpacity>
              </View>
            </View>

            {showDatePicker && (
              <DateTimePicker
                value={expiryDate}
                mode="date"
                display="default"
                onChange={onDateChange}
              />
            )}

            {/* Location */}
            <View style={styles.formGroup}>
              <Text style={[styles.label, isDark && { color: "#9BA1A6" }]}>
                Location
              </Text>
              <TouchableOpacity
                style={[
                  styles.dropdownButton,
                  isDark && {
                    backgroundColor: "#2C2C2E",
                    borderColor: "#3C3C3E",
                  },
                ]}
                onPress={() => setShowLocationDropdown(!showLocationDropdown)}
              >
                <Text
                  style={[
                    styles.dropdownButtonText,
                    isDark && { color: "#ECEDEE" },
                  ]}
                >
                  {location}
                </Text>
                <Ionicons
                  name={showLocationDropdown ? "chevron-up" : "chevron-down"}
                  size={16}
                  color={isDark ? "#9BA1A6" : "#374151"}
                />
              </TouchableOpacity>

              {showLocationDropdown && (
                <Animated.View
                  style={[
                    styles.dropdownMenu,
                    isDark && {
                      backgroundColor: "#1C1C1E",
                      borderColor: "#3C3C3E",
                    },
                    {
                      opacity: dropdownAnim,
                      transform: [
                        {
                          scale: dropdownAnim.interpolate({
                            inputRange: [0, 1],
                            outputRange: [0.95, 1],
                          }),
                        },
                      ],
                      position: "absolute",
                      top: 52,
                      left: 0,
                      right: 0,
                      zIndex: 1000,
                    },
                  ]}
                >
                  {locationOptions.map((option) => (
                    <TouchableOpacity
                      key={option}
                      style={[
                        styles.dropdownItem,
                        location === option &&
                          (isDark
                            ? { backgroundColor: "#2C2C2E" }
                            : styles.dropdownItemSelected),
                        isDark && { borderBottomColor: "#3C3C3E" },
                      ]}
                      onPress={() => {
                        setLocation(option);
                        setShowLocationDropdown(false);
                      }}
                    >
                      <Text
                        style={[
                          styles.dropdownItemText,
                          isDark && { color: "#ECEDEE" },
                          location === option &&
                            (isDark
                              ? { fontWeight: "600", color: "#22C55E" }
                              : styles.dropdownItemTextSelected),
                        ]}
                      >
                        {option}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </Animated.View>
              )}
            </View>

            {/* Category */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Category</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {categoryOptions.map((cat) => (
                  <TouchableOpacity
                    key={cat}
                    style={[
                      styles.categoryButton,
                      category === cat && styles.categoryButtonSelected,
                    ]}
                    onPress={() => setCategory(cat)}
                  >
                    <Text>
                      {foodCategoryIcons[cat as keyof typeof foodCategoryIcons]}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* Notes */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Notes</Text>
              <TextInput
                style={[styles.textInput, styles.notesInput]}
                value={notes}
                onChangeText={setNotes}
                placeholder="Add any notes..."
                multiline
              />
            </View>
          </ScrollView>

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
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: "500",
    color: "#374151",
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: "#F9FAFB",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#D1D5DB",
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: "#111827",
  },
  notesInput: {
    height: 100,
    textAlignVertical: "top",
  },
  formRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  quantityContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F9FAFB",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#D1D5DB",
  },
  quantityButton: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  quantityButtonText: {
    fontSize: 20,
    fontWeight: "600",
    color: "#374151",
  },
  quantityInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
    color: "#111827",
    textAlign: "center",
    fontWeight: "500",
  },
  dropdownButton: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#F9FAFB",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#D1D5DB",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  dropdownButtonText: {
    fontSize: 16,
    color: "#111827",
  },
  dropdownMenu: {
    marginTop: 4,
    backgroundColor: "white",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  dropdownItem: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  dropdownItemSelected: {
    backgroundColor: "#F3F4F6",
  },
  dropdownItemText: {
    fontSize: 16,
    color: "#111827",
  },
  dropdownItemTextSelected: {
    fontWeight: "600",
  },
  categoryButton: {
    height: 60,
    width: 60,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#D1D5DB",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  categoryButtonSelected: {
    borderColor: "#0066FF",
    backgroundColor: "#EBF5FF",
  },
  actions: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
    backgroundColor: "#F9FAFB",
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
