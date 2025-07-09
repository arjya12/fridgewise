// components/BatchActionPanel.tsx
import { useThemeColor } from "@/hooks/useThemeColor";
import { FoodItemWithUrgency } from "@/services/foodItems";
import { Ionicons } from "@expo/vector-icons";
import React, { useMemo, useState } from "react";
import {
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

export interface BatchAction {
  id: string;
  type:
    | "mark_used"
    | "extend_expiry"
    | "delete"
    | "move_location"
    | "update_category"
    | "adjust_quantity";
  title: string;
  icon: string;
  color: string;
  description: string;
  requiresInput?: boolean;
  inputType?: "text" | "number" | "date" | "select";
  inputOptions?: string[];
  destructive?: boolean;
}

export interface BatchOperationResult {
  action: BatchAction;
  itemIds: string[];
  success: boolean;
  errors?: string[];
  data?: any;
}

interface BatchActionPanelProps {
  selectedItems: FoodItemWithUrgency[];
  onBatchAction: (
    action: BatchAction,
    items: FoodItemWithUrgency[],
    data?: any
  ) => Promise<BatchOperationResult>;
  onClose: () => void;
  visible: boolean;
}

const BatchActionPanel: React.FC<BatchActionPanelProps> = ({
  selectedItems,
  onBatchAction,
  onClose,
  visible,
}) => {
  const [activeAction, setActiveAction] = useState<BatchAction | null>(null);
  const [inputValue, setInputValue] = useState<string>("");
  const [processing, setProcessing] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);

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
  const borderColor = useThemeColor(
    { light: "#E0E0E0", dark: "#3C3C3E" },
    "text"
  );

  const batchActions: BatchAction[] = [
    {
      id: "mark_used",
      type: "mark_used",
      title: "Mark as Used",
      icon: "checkmark-circle",
      color: "#22C55E",
      description: "Mark selected items as consumed/used",
    },
    {
      id: "extend_expiry",
      type: "extend_expiry",
      title: "Extend Expiry",
      icon: "time",
      color: "#3B82F6",
      description: "Extend expiry date for selected items",
      requiresInput: true,
      inputType: "number",
    },
    {
      id: "move_location",
      type: "move_location",
      title: "Move Location",
      icon: "location",
      color: "#8B5CF6",
      description: "Move items to a different storage location",
      requiresInput: true,
      inputType: "select",
      inputOptions: ["Fridge", "Freezer", "Pantry", "Counter"],
    },
    {
      id: "update_category",
      type: "update_category",
      title: "Update Category",
      icon: "pricetag",
      color: "#F59E0B",
      description: "Change category for selected items",
      requiresInput: true,
      inputType: "select",
      inputOptions: [
        "Dairy",
        "Meat",
        "Produce",
        "Pantry",
        "Snacks",
        "Beverages",
        "Other",
      ],
    },
    {
      id: "adjust_quantity",
      type: "adjust_quantity",
      title: "Adjust Quantity",
      icon: "calculator",
      color: "#06B6D4",
      description: "Update quantity for selected items",
      requiresInput: true,
      inputType: "number",
    },
    {
      id: "delete",
      type: "delete",
      title: "Delete Items",
      icon: "trash",
      color: "#EF4444",
      description: "Permanently remove selected items",
      destructive: true,
    },
  ];

  // Filter available actions based on selected items
  const availableActions = useMemo(() => {
    if (selectedItems.length === 0) return [];

    return batchActions.filter((action) => {
      switch (action.type) {
        case "mark_used":
          // Only show if items are not already used
          return selectedItems.some((item) => true); // Simplified logic
        case "extend_expiry":
          // Only show for items that have expiry dates
          return selectedItems.some((item) => item.expiry_date);
        case "move_location":
          // Show if items have different locations or can be moved
          return true;
        case "update_category":
          // Always available
          return true;
        case "adjust_quantity":
          // Show if any items have quantity > 0
          return selectedItems.some((item) => item.quantity > 0);
        case "delete":
          // Always available
          return true;
        default:
          return true;
      }
    });
  }, [selectedItems]);

  const getSelectionSummary = () => {
    const total = selectedItems.length;
    const categories = new Set(selectedItems.map((item) => item.category));
    const locations = new Set(selectedItems.map((item) => item.location));
    const urgencyLevels = selectedItems.reduce((acc, item) => {
      acc[item.urgency.level] = (acc[item.urgency.level] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      total,
      categories: Array.from(categories),
      locations: Array.from(locations),
      urgencyLevels,
    };
  };

  const handleActionPress = (action: BatchAction) => {
    setActiveAction(action);
    setInputValue("");

    if (action.requiresInput) {
      // Show input modal
      return;
    }

    if (action.destructive) {
      setShowConfirmation(true);
      return;
    }

    // Execute action immediately
    executeAction(action);
  };

  const executeAction = async (action: BatchAction, inputData?: any) => {
    setProcessing(true);
    try {
      const result = await onBatchAction(action, selectedItems, inputData);

      if (result.success) {
        Alert.alert(
          "Success",
          `${action.title} completed successfully for ${
            result.itemIds.length
          } item${result.itemIds.length !== 1 ? "s" : ""}.`
        );
        onClose();
      } else {
        Alert.alert(
          "Partial Success",
          `${action.title} completed with some errors. ${result.errors?.join(
            ", "
          )}`
        );
      }
    } catch (error) {
      Alert.alert(
        "Error",
        `Failed to ${action.title.toLowerCase()}. Please try again.`
      );
    } finally {
      setProcessing(false);
      setActiveAction(null);
      setShowConfirmation(false);
    }
  };

  const handleConfirmAction = () => {
    if (!activeAction) return;

    if (activeAction.requiresInput) {
      let processedInput = inputValue;

      if (activeAction.inputType === "number") {
        const num = parseInt(inputValue);
        if (isNaN(num) || num < 0) {
          Alert.alert("Invalid Input", "Please enter a valid number.");
          return;
        }
        processedInput = num.toString();
      }

      executeAction(activeAction, processedInput);
    } else {
      executeAction(activeAction);
    }
  };

  const renderInputModal = () => {
    if (!activeAction?.requiresInput) return null;

    return (
      <Modal
        visible={!!activeAction}
        transparent
        animationType="fade"
        onRequestClose={() => setActiveAction(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.inputModal, { backgroundColor: surfaceColor }]}>
            <View style={styles.inputModalHeader}>
              <Text style={[styles.inputModalTitle, { color: textColor }]}>
                {activeAction.title}
              </Text>
              <TouchableOpacity
                onPress={() => setActiveAction(null)}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={24} color={textColor} />
              </TouchableOpacity>
            </View>

            <Text style={[styles.inputModalDescription, { color: textColor }]}>
              {activeAction.description} for {selectedItems.length} item
              {selectedItems.length !== 1 ? "s" : ""}.
            </Text>

            {activeAction.inputType === "select" &&
            activeAction.inputOptions ? (
              <ScrollView style={styles.optionsContainer}>
                {activeAction.inputOptions.map((option, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.optionButton,
                      { borderColor },
                      inputValue === option && {
                        backgroundColor: activeAction.color + "20",
                      },
                    ]}
                    onPress={() => setInputValue(option)}
                  >
                    <Text
                      style={[
                        styles.optionText,
                        {
                          color:
                            inputValue === option
                              ? activeAction.color
                              : textColor,
                        },
                      ]}
                    >
                      {option}
                    </Text>
                    {inputValue === option && (
                      <Ionicons
                        name="checkmark"
                        size={20}
                        color={activeAction.color}
                      />
                    )}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            ) : (
              <TextInput
                style={[
                  styles.textInput,
                  { backgroundColor, borderColor, color: textColor },
                ]}
                value={inputValue}
                onChangeText={setInputValue}
                placeholder={
                  activeAction.inputType === "number"
                    ? "Enter number"
                    : "Enter value"
                }
                placeholderTextColor={textColor + "80"}
                keyboardType={
                  activeAction.inputType === "number" ? "numeric" : "default"
                }
                autoFocus
              />
            )}

            <View style={styles.inputModalActions}>
              <TouchableOpacity
                style={[styles.cancelButton, { borderColor }]}
                onPress={() => setActiveAction(null)}
              >
                <Text style={[styles.cancelButtonText, { color: textColor }]}>
                  Cancel
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.confirmButton,
                  { backgroundColor: activeAction.color },
                  !inputValue && styles.disabledButton,
                ]}
                onPress={handleConfirmAction}
                disabled={!inputValue || processing}
              >
                <Text style={styles.confirmButtonText}>
                  {processing ? "Processing..." : "Confirm"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    );
  };

  const renderConfirmationModal = () => {
    if (!activeAction?.destructive) return null;

    return (
      <Modal
        visible={showConfirmation}
        transparent
        animationType="fade"
        onRequestClose={() => setShowConfirmation(false)}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.confirmationModal,
              { backgroundColor: surfaceColor },
            ]}
          >
            <View style={styles.confirmationHeader}>
              <Ionicons name="warning" size={32} color="#EF4444" />
              <Text style={[styles.confirmationTitle, { color: textColor }]}>
                Confirm {activeAction.title}
              </Text>
            </View>

            <Text
              style={[styles.confirmationDescription, { color: textColor }]}
            >
              Are you sure you want to {activeAction.title.toLowerCase()}{" "}
              {selectedItems.length} item{selectedItems.length !== 1 ? "s" : ""}
              ? This action cannot be undone.
            </Text>

            <View style={styles.confirmationActions}>
              <TouchableOpacity
                style={[styles.cancelButton, { borderColor }]}
                onPress={() => setShowConfirmation(false)}
              >
                <Text style={[styles.cancelButtonText, { color: textColor }]}>
                  Cancel
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.deleteButton, { backgroundColor: "#EF4444" }]}
                onPress={handleConfirmAction}
                disabled={processing}
              >
                <Text style={styles.deleteButtonText}>
                  {processing ? "Deleting..." : "Delete"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    );
  };

  const summary = getSelectionSummary();

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={[styles.container, { backgroundColor }]}>
        {/* Header */}
        <View
          style={[
            styles.header,
            { backgroundColor: surfaceColor, borderBottomColor: borderColor },
          ]}
        >
          <View style={styles.headerContent}>
            <Text style={[styles.headerTitle, { color: textColor }]}>
              Batch Actions
            </Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={textColor} />
            </TouchableOpacity>
          </View>

          {/* Selection Summary */}
          <View style={styles.summaryContainer}>
            <Text style={[styles.summaryText, { color: textColor }]}>
              {summary.total} item{summary.total !== 1 ? "s" : ""} selected
            </Text>

            <View style={styles.summaryDetails}>
              <View style={styles.summaryRow}>
                <Ionicons name="pricetag" size={14} color={textColor} />
                <Text style={[styles.summaryDetailText, { color: textColor }]}>
                  {summary.categories.join(", ")}
                </Text>
              </View>

              <View style={styles.summaryRow}>
                <Ionicons name="location" size={14} color={textColor} />
                <Text style={[styles.summaryDetailText, { color: textColor }]}>
                  {summary.locations.join(", ")}
                </Text>
              </View>

              <View style={styles.summaryRow}>
                <Ionicons name="alert-circle" size={14} color={textColor} />
                <Text style={[styles.summaryDetailText, { color: textColor }]}>
                  {Object.entries(summary.urgencyLevels)
                    .map(([level, count]) => `${count} ${level}`)
                    .join(", ")}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Actions */}
        <ScrollView
          style={styles.actionsContainer}
          showsVerticalScrollIndicator={false}
        >
          {availableActions.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="ban" size={48} color={textColor} opacity={0.3} />
              <Text style={[styles.emptyStateText, { color: textColor }]}>
                No actions available
              </Text>
              <Text style={[styles.emptyStateSubtext, { color: textColor }]}>
                Select some items to see available batch actions
              </Text>
            </View>
          ) : (
            <View style={styles.actionsGrid}>
              {availableActions.map((action) => (
                <TouchableOpacity
                  key={action.id}
                  style={[
                    styles.actionButton,
                    { backgroundColor: surfaceColor, borderColor },
                    action.destructive && styles.destructiveAction,
                  ]}
                  onPress={() => handleActionPress(action)}
                  disabled={processing}
                >
                  <View
                    style={[
                      styles.actionIcon,
                      { backgroundColor: action.color + "20" },
                    ]}
                  >
                    <Ionicons
                      name={action.icon as any}
                      size={24}
                      color={action.color}
                    />
                  </View>

                  <View style={styles.actionContent}>
                    <Text style={[styles.actionTitle, { color: textColor }]}>
                      {action.title}
                    </Text>
                    <Text
                      style={[styles.actionDescription, { color: textColor }]}
                    >
                      {action.description}
                    </Text>
                  </View>

                  <Ionicons
                    name="chevron-forward"
                    size={20}
                    color={textColor}
                    opacity={0.5}
                  />
                </TouchableOpacity>
              ))}
            </View>
          )}
        </ScrollView>

        {/* Selected Items Preview */}
        <View
          style={[
            styles.previewContainer,
            { backgroundColor: surfaceColor, borderTopColor: borderColor },
          ]}
        >
          <Text style={[styles.previewTitle, { color: textColor }]}>
            Selected Items ({selectedItems.length})
          </Text>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.previewScroll}
          >
            {selectedItems.slice(0, 10).map((item) => (
              <View
                key={item.id}
                style={[
                  styles.previewItem,
                  { backgroundColor: item.urgency.backgroundColor },
                ]}
              >
                <Text
                  style={[
                    styles.previewItemText,
                    { color: item.urgency.color },
                  ]}
                  numberOfLines={1}
                >
                  {item.name}
                </Text>
              </View>
            ))}
            {selectedItems.length > 10 && (
              <View
                style={[styles.previewItem, { backgroundColor: borderColor }]}
              >
                <Text style={[styles.previewItemText, { color: textColor }]}>
                  +{selectedItems.length - 10} more
                </Text>
              </View>
            )}
          </ScrollView>
        </View>

        {renderInputModal()}
        {renderConfirmationModal()}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 20,
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  headerContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
  },
  closeButton: {
    padding: 4,
  },
  summaryContainer: {
    gap: 8,
  },
  summaryText: {
    fontSize: 16,
    fontWeight: "600",
  },
  summaryDetails: {
    gap: 4,
  },
  summaryRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  summaryDetailText: {
    fontSize: 14,
    opacity: 0.8,
    flex: 1,
  },
  actionsContainer: {
    flex: 1,
    padding: 16,
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: "600",
    marginTop: 16,
    textAlign: "center",
  },
  emptyStateSubtext: {
    fontSize: 14,
    opacity: 0.7,
    marginTop: 4,
    textAlign: "center",
  },
  actionsGrid: {
    gap: 12,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    gap: 12,
  },
  destructiveAction: {
    borderColor: "#EF4444",
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  actionContent: {
    flex: 1,
    gap: 2,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: "600",
  },
  actionDescription: {
    fontSize: 14,
    opacity: 0.8,
  },
  previewContainer: {
    padding: 16,
    borderTopWidth: 1,
  },
  previewTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
  },
  previewScroll: {
    flexGrow: 0,
  },
  previewItem: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.1)",
  },
  previewItemText: {
    fontSize: 12,
    fontWeight: "500",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  inputModal: {
    width: "90%",
    maxWidth: 400,
    borderRadius: 16,
    padding: 20,
  },
  inputModalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  inputModalTitle: {
    fontSize: 20,
    fontWeight: "bold",
  },
  inputModalDescription: {
    fontSize: 14,
    opacity: 0.8,
    marginBottom: 16,
    lineHeight: 20,
  },
  optionsContainer: {
    maxHeight: 200,
    marginBottom: 16,
  },
  optionButton: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 12,
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 8,
  },
  optionText: {
    fontSize: 16,
    fontWeight: "500",
  },
  textInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 16,
  },
  inputModalActions: {
    flexDirection: "row",
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    padding: 12,
    borderWidth: 1,
    borderRadius: 8,
    alignItems: "center",
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: "500",
  },
  confirmButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  confirmButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  disabledButton: {
    opacity: 0.5,
  },
  confirmationModal: {
    width: "90%",
    maxWidth: 350,
    borderRadius: 16,
    padding: 20,
  },
  confirmationHeader: {
    alignItems: "center",
    marginBottom: 16,
  },
  confirmationTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginTop: 8,
    textAlign: "center",
  },
  confirmationDescription: {
    fontSize: 14,
    opacity: 0.8,
    marginBottom: 20,
    lineHeight: 20,
    textAlign: "center",
  },
  confirmationActions: {
    flexDirection: "row",
    gap: 12,
  },
  deleteButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  deleteButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
});

export default BatchActionPanel;
