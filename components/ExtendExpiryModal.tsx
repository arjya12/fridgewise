// Extend Expiry Modal - Phase 2 Implementation
// Quick action modal for extending item expiry dates with preset options

import { useThemeColor } from "@/hooks/useThemeColor";
import { FoodItem } from "@/lib/supabase";
import { calculateEnhancedUrgency } from "@/utils/urgencyUtils";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import * as Haptics from "expo-haptics";
import React, { useCallback, useMemo, useState } from "react";
import {
  Alert,
  Animated,
  Dimensions,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

// =============================================================================
// INTERFACES & TYPES
// =============================================================================

interface ExtendExpiryModalProps {
  visible: boolean;
  item: FoodItem | null;
  onClose: () => void;
  onExtend: (itemId: string, newExpiryDate: string) => void;
  accessibilityEnabled?: boolean;
}

interface QuickOption {
  id: string;
  days: number;
  label: string;
  icon: string;
  description: string;
  color: string;
}

// =============================================================================
// QUICK EXTEND OPTIONS (PHASE 2 SPECIFICATIONS)
// =============================================================================

const QUICK_OPTIONS: QuickOption[] = [
  {
    id: "1day",
    days: 1,
    label: "1 Day",
    icon: "today",
    description: "Quick 24h extension",
    color: "#FF6B6B",
  },
  {
    id: "3days",
    days: 3,
    label: "3 Days",
    icon: "calendar",
    description: "Weekend extension",
    color: "#FFB84D",
  },
  {
    id: "1week",
    days: 7,
    label: "1 Week",
    icon: "calendar-outline",
    description: "Full week extension",
    color: "#51D88A",
  },
  {
    id: "2weeks",
    days: 14,
    label: "2 Weeks",
    icon: "calendar-number",
    description: "Bi-weekly extension",
    color: "#4ECDC4",
  },
];

// =============================================================================
// MAIN COMPONENT
// =============================================================================

const ExtendExpiryModal: React.FC<ExtendExpiryModalProps> = ({
  visible,
  item,
  onClose,
  onExtend,
  accessibilityEnabled = true,
}) => {
  const screenHeight = Dimensions.get("window").height;

  // Theme colors
  const backgroundColor = useThemeColor(
    { light: "#FFFFFF", dark: "#1D1D1D" },
    "background"
  );
  const textColor = useThemeColor(
    { light: "#11181C", dark: "#ECEDEE" },
    "text"
  );
  const borderColor = useThemeColor(
    { light: "#E5E7EB", dark: "#3C3C3E" },
    "text"
  );
  const surfaceColor = useThemeColor(
    { light: "#F8F9FA", dark: "#2C2C2E" },
    "background"
  );

  // State management
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [customDate, setCustomDate] = useState<Date>(new Date());
  const [animatedValue] = useState(new Animated.Value(0));

  // Calculate item urgency information
  const itemWithUrgency = useMemo(() => {
    if (!item?.expiry_date) return null;
    return {
      ...item,
      urgency: calculateEnhancedUrgency(item.expiry_date),
    };
  }, [item]);

  // Animation for modal appearance
  React.useEffect(() => {
    if (visible) {
      Animated.spring(animatedValue, {
        toValue: 1,
        tension: 100,
        friction: 8,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(animatedValue, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [visible, animatedValue]);

  // Handle quick option selection
  const handleQuickOptionPress = useCallback((option: QuickOption) => {
    if (Platform.OS === "ios") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setSelectedOption(option.id);
    setShowDatePicker(false);
  }, []);

  // Handle custom date selection
  const handleCustomDatePress = useCallback(() => {
    if (Platform.OS === "ios") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setSelectedOption("custom");
    setShowDatePicker(true);
  }, []);

  // Handle date picker change
  const handleDateChange = useCallback((event: any, selectedDate?: Date) => {
    if (Platform.OS === "android") {
      setShowDatePicker(false);
    }
    if (selectedDate) {
      setCustomDate(selectedDate);
    }
  }, []);

  // Calculate new expiry date
  const calculateNewExpiryDate = useCallback(
    (option: QuickOption | "custom"): string => {
      if (!item?.expiry_date) return "";

      const currentExpiry = new Date(item.expiry_date);
      let newExpiry: Date;

      if (option === "custom") {
        newExpiry = customDate;
      } else {
        newExpiry = new Date(currentExpiry);
        newExpiry.setDate(currentExpiry.getDate() + option.days);
      }

      return newExpiry.toISOString().split("T")[0];
    },
    [item?.expiry_date, customDate]
  );

  // Handle extend action
  const handleExtend = useCallback(() => {
    if (!item || !selectedOption) return;

    const option =
      selectedOption === "custom"
        ? "custom"
        : QUICK_OPTIONS.find((opt) => opt.id === selectedOption);

    if (!option) return;

    const newExpiryDate = calculateNewExpiryDate(option);

    if (Platform.OS === "ios") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }

    onExtend(item.id, newExpiryDate);
    onClose();

    // Show confirmation
    Alert.alert(
      "Expiry Extended",
      `${item.name} expiry date updated to ${new Date(
        newExpiryDate
      ).toLocaleDateString()}`,
      [{ text: "OK", style: "default" }]
    );
  }, [item, selectedOption, calculateNewExpiryDate, onExtend, onClose]);

  // Handle cancel
  const handleCancel = useCallback(() => {
    if (Platform.OS === "ios") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onClose();
  }, [onClose]);

  // Get preview of new expiry date
  const getExpiryPreview = useCallback(() => {
    if (!selectedOption || !item?.expiry_date) return null;

    const option =
      selectedOption === "custom"
        ? "custom"
        : QUICK_OPTIONS.find((opt) => opt.id === selectedOption);

    if (!option) return null;

    const newExpiryDate = calculateNewExpiryDate(option);
    const newUrgency = calculateEnhancedUrgency(newExpiryDate);

    return {
      date: new Date(newExpiryDate).toLocaleDateString(),
      urgency: newUrgency,
    };
  }, [selectedOption, item?.expiry_date, calculateNewExpiryDate]);

  const expiryPreview = getExpiryPreview();

  if (!item || !itemWithUrgency) {
    return null;
  }

  const modalStyle = {
    transform: [
      {
        translateY: animatedValue.interpolate({
          inputRange: [0, 1],
          outputRange: [screenHeight, 0],
        }),
      },
    ],
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="none"
      onRequestClose={onClose}
      accessible={accessibilityEnabled}
      accessibilityViewIsModal={true}
    >
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} />

        <Animated.View
          style={[styles.modalContainer, { backgroundColor }, modalStyle]}
          accessible={accessibilityEnabled}
          accessibilityLabel={`Extend expiry for ${item.name}`}
        >
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: borderColor }]}>
            <View style={styles.headerContent}>
              <Text style={[styles.title, { color: textColor }]}>
                Extend Expiry Date
              </Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={handleCancel}
                accessible={accessibilityEnabled}
                accessibilityRole="button"
                accessibilityLabel="Close modal"
              >
                <Ionicons name="close" size={24} color={textColor} />
              </TouchableOpacity>
            </View>

            {/* Item Info */}
            <View style={[styles.itemInfo, { backgroundColor: surfaceColor }]}>
              <View style={styles.itemDetails}>
                <Text
                  style={[
                    styles.itemName,
                    { color: itemWithUrgency.urgency.color },
                  ]}
                >
                  {item.name}
                </Text>
                <Text style={[styles.currentExpiry, { color: textColor }]}>
                  Current: {new Date(item.expiry_date!).toLocaleDateString()}
                </Text>
                <Text
                  style={[
                    styles.urgencyStatus,
                    { color: itemWithUrgency.urgency.color },
                  ]}
                >
                  {itemWithUrgency.urgency.description}
                </Text>
              </View>
              <View
                style={[
                  styles.urgencyBadge,
                  { backgroundColor: itemWithUrgency.urgency.color },
                ]}
              >
                <Text style={styles.urgencyText}>
                  {itemWithUrgency.urgency.level.toUpperCase()}
                </Text>
              </View>
            </View>
          </View>

          {/* Content */}
          <ScrollView
            style={styles.content}
            showsVerticalScrollIndicator={false}
            accessible={accessibilityEnabled}
            accessibilityLabel="Extension options"
          >
            {/* Quick Options */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: textColor }]}>
                Quick Options
              </Text>
              <View style={styles.quickOptions}>
                {QUICK_OPTIONS.map((option) => (
                  <TouchableOpacity
                    key={option.id}
                    style={[
                      styles.quickOption,
                      {
                        backgroundColor: surfaceColor,
                        borderColor:
                          selectedOption === option.id
                            ? option.color
                            : borderColor,
                        borderWidth: selectedOption === option.id ? 2 : 1,
                      },
                    ]}
                    onPress={() => handleQuickOptionPress(option)}
                    accessible={accessibilityEnabled}
                    accessibilityRole="button"
                    accessibilityLabel={`${option.label}, ${option.description}`}
                    accessibilityState={{
                      selected: selectedOption === option.id,
                    }}
                  >
                    <View
                      style={[
                        styles.optionIcon,
                        { backgroundColor: option.color },
                      ]}
                    >
                      <Ionicons
                        name={option.icon as any}
                        size={20}
                        color="#FFFFFF"
                      />
                    </View>
                    <Text style={[styles.optionLabel, { color: textColor }]}>
                      {option.label}
                    </Text>
                    <Text
                      style={[styles.optionDescription, { color: textColor }]}
                    >
                      {option.description}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Custom Date Option */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: textColor }]}>
                Custom Date
              </Text>
              <TouchableOpacity
                style={[
                  styles.customDateOption,
                  {
                    backgroundColor: surfaceColor,
                    borderColor:
                      selectedOption === "custom" ? "#007AFF" : borderColor,
                    borderWidth: selectedOption === "custom" ? 2 : 1,
                  },
                ]}
                onPress={handleCustomDatePress}
                accessible={accessibilityEnabled}
                accessibilityRole="button"
                accessibilityLabel="Choose custom date"
                accessibilityState={{ selected: selectedOption === "custom" }}
              >
                <View
                  style={[styles.optionIcon, { backgroundColor: "#007AFF" }]}
                >
                  <Ionicons name="calendar-clear" size={20} color="#FFFFFF" />
                </View>
                <View style={styles.customDateContent}>
                  <Text style={[styles.optionLabel, { color: textColor }]}>
                    Choose Date
                  </Text>
                  <Text
                    style={[styles.optionDescription, { color: textColor }]}
                  >
                    {selectedOption === "custom"
                      ? customDate.toLocaleDateString()
                      : "Pick any date"}
                  </Text>
                </View>
              </TouchableOpacity>
            </View>

            {/* Date Picker for iOS */}
            {showDatePicker && Platform.OS === "ios" && (
              <View
                style={[
                  styles.datePickerContainer,
                  { backgroundColor: surfaceColor },
                ]}
              >
                <DateTimePicker
                  value={customDate}
                  mode="date"
                  display="compact"
                  onChange={handleDateChange}
                  minimumDate={new Date()}
                  accessible={accessibilityEnabled}
                />
              </View>
            )}

            {/* Preview */}
            {expiryPreview && (
              <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: textColor }]}>
                  Preview
                </Text>
                <View
                  style={[styles.preview, { backgroundColor: surfaceColor }]}
                >
                  <View style={styles.previewContent}>
                    <Text style={[styles.previewLabel, { color: textColor }]}>
                      New Expiry Date
                    </Text>
                    <Text style={[styles.previewDate, { color: textColor }]}>
                      {expiryPreview.date}
                    </Text>
                    <Text
                      style={[
                        styles.previewStatus,
                        { color: expiryPreview.urgency.color },
                      ]}
                    >
                      {expiryPreview.urgency.description}
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.previewBadge,
                      { backgroundColor: expiryPreview.urgency.color },
                    ]}
                  >
                    <Text style={styles.previewBadgeText}>
                      {expiryPreview.urgency.level.toUpperCase()}
                    </Text>
                  </View>
                </View>
              </View>
            )}
          </ScrollView>

          {/* Footer Actions */}
          <View style={[styles.footer, { borderTopColor: borderColor }]}>
            <TouchableOpacity
              style={[styles.cancelButton, { backgroundColor: surfaceColor }]}
              onPress={handleCancel}
              accessible={accessibilityEnabled}
              accessibilityRole="button"
              accessibilityLabel="Cancel"
            >
              <Text style={[styles.cancelButtonText, { color: textColor }]}>
                Cancel
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.extendButton,
                {
                  backgroundColor: selectedOption ? "#007AFF" : borderColor,
                  opacity: selectedOption ? 1 : 0.5,
                },
              ]}
              onPress={handleExtend}
              disabled={!selectedOption}
              accessible={accessibilityEnabled}
              accessibilityRole="button"
              accessibilityLabel="Extend expiry date"
              accessibilityState={{ disabled: !selectedOption }}
            >
              <Ionicons name="time" size={16} color="#FFFFFF" />
              <Text style={styles.extendButtonText}>Extend Expiry</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>

      {/* Android Date Picker */}
      {showDatePicker && Platform.OS === "android" && (
        <DateTimePicker
          value={customDate}
          mode="date"
          display="default"
          onChange={handleDateChange}
          minimumDate={new Date()}
        />
      )}
    </Modal>
  );
};

// =============================================================================
// STYLES
// =============================================================================

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  backdrop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  modalContainer: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "90%",
    elevation: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
  },
  header: {
    borderBottomWidth: 1,
    paddingBottom: 16,
  },
  headerContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 20,
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
  },
  closeButton: {
    padding: 4,
  },
  itemInfo: {
    marginHorizontal: 20,
    padding: 16,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
  },
  itemDetails: {
    flex: 1,
  },
  itemName: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 4,
  },
  currentExpiry: {
    fontSize: 14,
    marginBottom: 2,
  },
  urgencyStatus: {
    fontSize: 12,
    fontWeight: "500",
  },
  urgencyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  urgencyText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "bold",
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  section: {
    marginVertical: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 12,
  },
  quickOptions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  quickOption: {
    width: "48%",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    gap: 8,
  },
  optionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  optionLabel: {
    fontSize: 14,
    fontWeight: "600",
  },
  optionDescription: {
    fontSize: 12,
    opacity: 0.7,
    textAlign: "center",
  },
  customDateOption: {
    padding: 16,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  customDateContent: {
    flex: 1,
  },
  datePickerContainer: {
    padding: 16,
    borderRadius: 12,
    marginTop: 12,
    alignItems: "center",
  },
  preview: {
    padding: 16,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
  },
  previewContent: {
    flex: 1,
  },
  previewLabel: {
    fontSize: 12,
    opacity: 0.7,
    marginBottom: 4,
  },
  previewDate: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 2,
  },
  previewStatus: {
    fontSize: 12,
    fontWeight: "500",
  },
  previewBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  previewBadgeText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "bold",
  },
  footer: {
    flexDirection: "row",
    gap: 12,
    padding: 20,
    borderTopWidth: 1,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
  extendButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  extendButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
});

export default ExtendExpiryModal;
