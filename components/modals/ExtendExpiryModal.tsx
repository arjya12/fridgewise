/**
 * Extend Expiry Modal
 * Allows users to extend the expiry date of food items with quick options or custom dates
 */

import DateTimePicker from "@react-native-community/datetimepicker";
import * as Haptics from "expo-haptics";
import React, { useMemo, useRef, useState } from "react";
import {
  AccessibilityInfo,
  Alert,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { FoodItem } from "../../lib/supabase";

// =============================================================================
// INTERFACES
// =============================================================================

export interface ExtendExpiryModalProps {
  isVisible: boolean;
  item: FoodItem | null;
  onClose: () => void;
  onExtend: (item: FoodItem, days: number) => Promise<void>;
}

// =============================================================================
// COMPONENT
// =============================================================================

export function ExtendExpiryModal({
  isVisible,
  item,
  onClose,
  onExtend,
}: ExtendExpiryModalProps) {
  const [selectedDays, setSelectedDays] = useState<number>(3); // Default to 3 days
  const [showDatePicker, setShowDatePicker] = useState<boolean>(false);
  const [customDate, setCustomDate] = useState<Date | null>(null);
  const [isCustomDateMode, setIsCustomDateMode] = useState<boolean>(false);

  // Ref for focus management
  const firstButtonRef = useRef<any>(null);

  // =============================================================================
  // HELPER FUNCTIONS
  // =============================================================================

  const calculateNewExpiryDate = (days: number, baseDate?: Date): Date => {
    if (!item?.expiry_date) return new Date();

    const currentExpiry = baseDate || new Date(item.expiry_date);
    return new Date(currentExpiry.getTime() + days * 24 * 60 * 60 * 1000);
  };

  const calculateDaysFromCustomDate = (targetDate: Date): number => {
    if (!item?.expiry_date) return 0;

    const currentExpiry = new Date(item.expiry_date);
    const diffInMs = targetDate.getTime() - currentExpiry.getTime();
    return Math.ceil(diffInMs / (24 * 60 * 60 * 1000));
  };

  // Helper to determine if extend button should be enabled
  const isExtendButtonEnabled = useMemo(() => {
    if (!item) return false;
    if (isCustomDateMode) {
      return customDate !== null;
    }
    return selectedDays > 0;
  }, [item, isCustomDateMode, customDate, selectedDays]);

  // Calculate new expiry date
  const newExpiryDate = useMemo(() => {
    if (!item?.expiry_date) return null;

    let targetDate: Date;
    if (isCustomDateMode && customDate) {
      targetDate = customDate;
    } else {
      targetDate = calculateNewExpiryDate(selectedDays);
    }

    return targetDate.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }, [item?.expiry_date, selectedDays, isCustomDateMode, customDate]);

  // =============================================================================
  // HANDLERS
  // =============================================================================

  const handleExtend = async () => {
    if (!item) return;

    try {
      let daysToExtend: number;

      if (isCustomDateMode && customDate) {
        daysToExtend = calculateDaysFromCustomDate(customDate);
      } else {
        daysToExtend = selectedDays;
      }

      await onExtend(item, daysToExtend);

      // Success feedback
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert(
        "Success",
        `Expiry extended by ${daysToExtend} day${
          daysToExtend !== 1 ? "s" : ""
        } for ${item.name}`,
        [{ text: "OK", style: "default" }]
      );
    } catch (error) {
      console.error("Failed to extend expiry:", error);

      // Error feedback
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert("Error", "Failed to extend expiry. Please try again.", [
        { text: "OK", style: "default" },
      ]);
    }
  };

  const handleQuickOption = (days: number) => {
    setIsCustomDateMode(false);
    setCustomDate(null);
    setSelectedDays(days);
  };

  const handleCustomDatePress = () => {
    setShowDatePicker(true);
  };

  const handleDatePickerChange = (event: any, selectedDate?: Date) => {
    const isAndroid = Platform.OS === "android";

    if (isAndroid) {
      setShowDatePicker(false);
    }

    if (selectedDate && item?.expiry_date) {
      const currentExpiry = new Date(item.expiry_date);
      // Ensure the selected date is after the current expiry date
      if (selectedDate > currentExpiry) {
        setCustomDate(selectedDate);
        setIsCustomDateMode(true);
        const days = calculateDaysFromCustomDate(selectedDate);
        setSelectedDays(days);
      } else {
        // Show error or reset to current date
        console.warn("Selected date must be after current expiry date");
      }
    }

    if (Platform.OS === "ios") {
      // iOS: Hide picker when done
      setShowDatePicker(false);
    }
  };

  const resetModalState = () => {
    setSelectedDays(3);
    setIsCustomDateMode(false);
    setCustomDate(null);
    setShowDatePicker(false);
  };

  // Reset state when modal closes or item changes
  React.useEffect(() => {
    if (!isVisible) {
      resetModalState();
    }
  }, [isVisible]);

  React.useEffect(() => {
    resetModalState();
  }, [item?.id]);

  // Trigger haptic feedback and focus management when modal opens
  React.useEffect(() => {
    if (isVisible && item) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      // Focus the first interactive element for screen readers
      const focusTimeout = setTimeout(() => {
        if (firstButtonRef.current) {
          AccessibilityInfo.setAccessibilityFocus(firstButtonRef.current);
        }
      }, 500); // Small delay to ensure modal is fully rendered

      return () => clearTimeout(focusTimeout);
    }
  }, [isVisible, item]);

  // Enhanced null handling
  if (!item) {
    return null;
  }

  return (
    <Modal
      visible={isVisible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
      accessibilityViewIsModal={true}
      supportedOrientations={["portrait", "landscape"]}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.backdrop}>
          <TouchableWithoutFeedback>
            <View style={styles.modalContent}>
              {/* Header */}
              <Text style={styles.header}>Extend Expiry for {item.name}</Text>

              {/* Divider */}
              <View style={styles.divider} />

              {/* Quick Options */}
              <Text style={styles.sectionTitle}>Quick Options:</Text>
              <View style={styles.quickOptionsContainer}>
                <Pressable
                  ref={firstButtonRef}
                  style={[
                    styles.quickOption,
                    selectedDays === 1 && styles.quickOptionSelected,
                  ]}
                  onPress={() => handleQuickOption(1)}
                  accessibilityRole="button"
                  accessibilityLabel="Extend by 1 day"
                  accessibilityHint="Extends the expiry date by 1 day"
                  accessibilityState={{
                    selected: selectedDays === 1 && !isCustomDateMode,
                  }}
                >
                  <Text
                    style={[
                      styles.quickOptionText,
                      selectedDays === 1 && styles.quickOptionTextSelected,
                    ]}
                  >
                    +1d
                  </Text>
                </Pressable>

                <Pressable
                  style={[
                    styles.quickOption,
                    selectedDays === 3 && styles.quickOptionSelected,
                  ]}
                  onPress={() => handleQuickOption(3)}
                  accessibilityRole="button"
                  accessibilityLabel="Extend by 3 days"
                  accessibilityHint="Extends the expiry date by 3 days"
                  accessibilityState={{
                    selected: selectedDays === 3 && !isCustomDateMode,
                  }}
                >
                  <Text
                    style={[
                      styles.quickOptionText,
                      selectedDays === 3 && styles.quickOptionTextSelected,
                    ]}
                  >
                    +3d
                  </Text>
                </Pressable>

                <Pressable
                  style={[
                    styles.quickOption,
                    selectedDays === 7 && styles.quickOptionSelected,
                  ]}
                  onPress={() => handleQuickOption(7)}
                  accessibilityRole="button"
                  accessibilityLabel="Extend by 1 week"
                  accessibilityHint="Extends the expiry date by 7 days"
                  accessibilityState={{
                    selected: selectedDays === 7 && !isCustomDateMode,
                  }}
                >
                  <Text
                    style={[
                      styles.quickOptionText,
                      selectedDays === 7 && styles.quickOptionTextSelected,
                    ]}
                  >
                    +1w
                  </Text>
                </Pressable>

                <Pressable
                  style={[
                    styles.customOption,
                    isCustomDateMode && styles.quickOptionSelected,
                  ]}
                  onPress={handleCustomDatePress}
                  accessibilityRole="button"
                  accessibilityLabel="Choose custom date"
                  accessibilityHint="Opens date picker to select a custom expiry date"
                  accessibilityState={{ selected: isCustomDateMode }}
                >
                  <Text
                    style={[
                      styles.customOptionText,
                      isCustomDateMode && styles.quickOptionTextSelected,
                    ]}
                  >
                    Custom
                  </Text>
                </Pressable>
              </View>

              {/* Preview */}
              <View style={styles.previewContainer}>
                <Text style={styles.previewLabel}>New expiry:</Text>
                <Text style={styles.previewDate}>{newExpiryDate}</Text>
              </View>

              {/* Action Buttons */}
              <View style={styles.actionButtons}>
                <Pressable
                  style={styles.cancelButton}
                  onPress={onClose}
                  accessibilityRole="button"
                  accessibilityLabel="Cancel"
                  accessibilityHint="Closes the modal without extending expiry"
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </Pressable>

                <Pressable
                  style={[
                    styles.extendButton,
                    !isExtendButtonEnabled && styles.extendButtonDisabled,
                  ]}
                  onPress={handleExtend}
                  disabled={!isExtendButtonEnabled}
                  accessibilityRole="button"
                  accessibilityLabel={
                    isCustomDateMode
                      ? `Extend expiry to ${customDate?.toLocaleDateString()}`
                      : `Extend expiry by ${selectedDays} day${
                          selectedDays !== 1 ? "s" : ""
                        }`
                  }
                  accessibilityHint="Confirms the expiry extension"
                  accessibilityState={{
                    disabled: !isExtendButtonEnabled,
                  }}
                >
                  <Text
                    style={[
                      styles.extendButtonText,
                      !isExtendButtonEnabled && styles.extendButtonTextDisabled,
                    ]}
                  >
                    {isCustomDateMode
                      ? `Extend to ${customDate?.toLocaleDateString()}`
                      : `Extend by ${selectedDays} day${
                          selectedDays !== 1 ? "s" : ""
                        }`}
                  </Text>
                </Pressable>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>

      {/* DateTimePicker */}
      {showDatePicker && item?.expiry_date && (
        <DateTimePicker
          value={
            customDate ||
            new Date(new Date(item.expiry_date).getTime() + 24 * 60 * 60 * 1000)
          }
          mode="date"
          display={Platform.OS === "ios" ? "spinner" : "default"}
          onChange={handleDatePickerChange}
          minimumDate={
            new Date(new Date(item.expiry_date).getTime() + 24 * 60 * 60 * 1000)
          }
        />
      )}
    </Modal>
  );
}

// =============================================================================
// STYLES
// =============================================================================

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "white",
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 24,
    minHeight: 300,
  },
  header: {
    fontSize: 20,
    fontWeight: "600",
    color: "#1F2937",
    textAlign: "center",
    marginBottom: 16,
  },
  divider: {
    height: 1,
    backgroundColor: "#E5E7EB",
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "500",
    color: "#374151",
    marginBottom: 16,
  },
  quickOptionsContainer: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 24,
  },
  quickOption: {
    flex: 1,
    height: 44,
    backgroundColor: "#F3F4F6",
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "transparent",
  },
  quickOptionSelected: {
    backgroundColor: "#EBF4FF",
    borderColor: "#3B82F6",
  },
  quickOptionText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#6B7280",
  },
  quickOptionTextSelected: {
    color: "#3B82F6",
  },
  customOption: {
    flex: 1,
    height: 44,
    backgroundColor: "#F9FAFB",
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#D1D5DB",
  },
  customOptionText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#374151",
  },
  previewContainer: {
    backgroundColor: "#F9FAFB",
    padding: 16,
    borderRadius: 8,
    marginBottom: 24,
  },
  previewLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: "#6B7280",
    marginBottom: 4,
  },
  previewDate: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1F2937",
  },
  actionButtons: {
    flexDirection: "row",
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    height: 48,
    backgroundColor: "#F3F4F6",
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#6B7280",
  },
  extendButton: {
    flex: 2,
    height: 48,
    backgroundColor: "#3B82F6",
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  extendButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "white",
  },
  extendButtonDisabled: {
    backgroundColor: "#D1D5DB",
    opacity: 0.7,
  },
  extendButtonTextDisabled: {
    color: "#9CA3AF",
  },
});

export default ExtendExpiryModal;
