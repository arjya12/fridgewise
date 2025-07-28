/**
 * Enhanced Extend Expiry Modal
 * Allows users to extend the expiry date of food items with quick options or custom dates
 * Features toast notifications, improved UI, and seamless user experience
 */

import DateTimePicker from "@react-native-community/datetimepicker";
import * as Haptics from "expo-haptics";
import React, { useMemo, useRef, useState } from "react";
import {
  AccessibilityInfo,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { FoodItem } from "../../lib/supabase";
import { useToast } from "../ToastNotification";

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
  const [isExtending, setIsExtending] = useState<boolean>(false);

  // Toast notifications
  const { showSuccess, showError, ToastComponent } = useToast();

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
    if (!item || isExtending) return false;
    if (isCustomDateMode) {
      return customDate !== null;
    }
    return selectedDays > 0;
  }, [item, isExtending, isCustomDateMode, customDate, selectedDays]);

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
      setIsExtending(true);
      let daysToExtend: number;

      if (isCustomDateMode && customDate) {
        daysToExtend = calculateDaysFromCustomDate(customDate);
      } else {
        daysToExtend = selectedDays;
      }

      await onExtend(item, daysToExtend);

      // Success feedback with toast
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      showSuccess(
        `✅ Expiry extended by ${daysToExtend} day${
          daysToExtend !== 1 ? "s" : ""
        } for ${item.name}`
      );

      // Close modal after a short delay
      setTimeout(() => {
        onClose();
        resetModalState();
      }, 500);
    } catch (error) {
      console.error("Failed to extend expiry:", error);

      // Error feedback with toast
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      showError("❌ Failed to extend expiry. Please try again.");
    } finally {
      setIsExtending(false);
    }
  };

  const handleQuickOption = (days: number) => {
    setIsCustomDateMode(false);
    setCustomDate(null);
    setSelectedDays(days);

    // Light haptic feedback for selection
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleCustomDatePress = () => {
    setShowDatePicker(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
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

        // Success haptic for valid date selection
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      } else {
        // Error haptic for invalid date
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        showError("Please select a date after the current expiry date");
      }
    }

    if (Platform.OS === "ios") {
      setShowDatePicker(false);
    }
  };

  const resetModalState = () => {
    setSelectedDays(3);
    setIsCustomDateMode(false);
    setCustomDate(null);
    setShowDatePicker(false);
    setIsExtending(false);
  };

  const handleClose = () => {
    if (!isExtending) {
      onClose();
      resetModalState();
    }
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
      }, 500);

      return () => clearTimeout(focusTimeout);
    }
  }, [isVisible, item]);

  // Enhanced null handling
  if (!item) {
    return null;
  }

  return (
    <>
      <Modal
        visible={isVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={handleClose}
        accessibilityViewIsModal={true}
        supportedOrientations={["portrait", "landscape"]}
      >
        <TouchableWithoutFeedback onPress={handleClose}>
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
                      selectedDays === 1 &&
                        !isCustomDateMode &&
                        styles.quickOptionSelected,
                    ]}
                    onPress={() => handleQuickOption(1)}
                    disabled={isExtending}
                    accessibilityRole="button"
                    accessibilityLabel="Extend by 1 day"
                    accessibilityHint="Extends the expiry date by 1 day"
                    accessibilityState={{
                      selected: selectedDays === 1 && !isCustomDateMode,
                      disabled: isExtending,
                    }}
                  >
                    <Text
                      style={[
                        styles.quickOptionText,
                        selectedDays === 1 &&
                          !isCustomDateMode &&
                          styles.quickOptionTextSelected,
                      ]}
                    >
                      +1d
                    </Text>
                  </Pressable>

                  <Pressable
                    style={[
                      styles.quickOption,
                      selectedDays === 3 &&
                        !isCustomDateMode &&
                        styles.quickOptionSelected,
                    ]}
                    onPress={() => handleQuickOption(3)}
                    disabled={isExtending}
                    accessibilityRole="button"
                    accessibilityLabel="Extend by 3 days"
                    accessibilityHint="Extends the expiry date by 3 days"
                    accessibilityState={{
                      selected: selectedDays === 3 && !isCustomDateMode,
                      disabled: isExtending,
                    }}
                  >
                    <Text
                      style={[
                        styles.quickOptionText,
                        selectedDays === 3 &&
                          !isCustomDateMode &&
                          styles.quickOptionTextSelected,
                      ]}
                    >
                      +3d
                    </Text>
                  </Pressable>

                  <Pressable
                    style={[
                      styles.quickOption,
                      selectedDays === 7 &&
                        !isCustomDateMode &&
                        styles.quickOptionSelected,
                    ]}
                    onPress={() => handleQuickOption(7)}
                    disabled={isExtending}
                    accessibilityRole="button"
                    accessibilityLabel="Extend by 1 week"
                    accessibilityHint="Extends the expiry date by 7 days"
                    accessibilityState={{
                      selected: selectedDays === 7 && !isCustomDateMode,
                      disabled: isExtending,
                    }}
                  >
                    <Text
                      style={[
                        styles.quickOptionText,
                        selectedDays === 7 &&
                          !isCustomDateMode &&
                          styles.quickOptionTextSelected,
                      ]}
                    >
                      +1w
                    </Text>
                  </Pressable>

                  <Pressable
                    style={[
                      styles.customOption,
                      isCustomDateMode && styles.customOptionSelected,
                    ]}
                    onPress={handleCustomDatePress}
                    disabled={isExtending}
                    accessibilityRole="button"
                    accessibilityLabel="Choose custom date"
                    accessibilityHint="Opens date picker to select a custom expiry date"
                    accessibilityState={{
                      selected: isCustomDateMode,
                      disabled: isExtending,
                    }}
                  >
                    <Text
                      style={[
                        styles.customOptionText,
                        isCustomDateMode && styles.customOptionTextSelected,
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
                    style={[
                      styles.cancelButton,
                      isExtending && styles.buttonDisabled,
                    ]}
                    onPress={handleClose}
                    disabled={isExtending}
                    accessibilityRole="button"
                    accessibilityLabel="Cancel"
                    accessibilityHint="Closes the modal without extending expiry"
                    accessibilityState={{ disabled: isExtending }}
                  >
                    <Text
                      style={[
                        styles.cancelButtonText,
                        isExtending && styles.buttonTextDisabled,
                      ]}
                    >
                      Cancel
                    </Text>
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
                        !isExtendButtonEnabled &&
                          styles.extendButtonTextDisabled,
                      ]}
                    >
                      {isExtending
                        ? "Extending..."
                        : isCustomDateMode
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
              new Date(
                new Date(item.expiry_date).getTime() + 24 * 60 * 60 * 1000
              )
            }
            mode="date"
            display={Platform.OS === "ios" ? "spinner" : "default"}
            onChange={handleDatePickerChange}
            minimumDate={
              new Date(
                new Date(item.expiry_date).getTime() + 24 * 60 * 60 * 1000
              )
            }
          />
        )}
      </Modal>

      {/* Toast Component */}
      <ToastComponent />
    </>
  );
}

// =============================================================================
// ENHANCED STYLES
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
    minHeight: 320,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: -4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 20,
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
    fontWeight: "600",
  },
  customOption: {
    flex: 1,
    height: 44,
    backgroundColor: "#F9FAFB",
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#D1D5DB",
  },
  customOptionSelected: {
    backgroundColor: "#EBF4FF",
    borderColor: "#3B82F6",
  },
  customOptionText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#374151",
  },
  customOptionTextSelected: {
    color: "#3B82F6",
    fontWeight: "600",
  },
  previewContainer: {
    backgroundColor: "#F9FAFB",
    padding: 16,
    borderRadius: 8,
    marginBottom: 24,
    borderLeftWidth: 4,
    borderLeftColor: "#3B82F6",
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
    borderWidth: 1,
    borderColor: "#E5E7EB",
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
    shadowColor: "#3B82F6",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  extendButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "white",
  },
  extendButtonDisabled: {
    backgroundColor: "#D1D5DB",
    opacity: 0.7,
    shadowOpacity: 0,
    elevation: 0,
  },
  extendButtonTextDisabled: {
    color: "#9CA3AF",
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonTextDisabled: {
    color: "#9CA3AF",
  },
});

export default ExtendExpiryModal;
