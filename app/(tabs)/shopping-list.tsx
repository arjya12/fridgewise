/**
 * Shopping List Screen
 * Helps users plan and manage items they need to purchase
 * Completes the core user journey: Add → Track → Use → Plan → Shop
 */

import SafeAreaWrapper from "@/components/SafeAreaWrapper";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { useAuth } from "@/contexts/AuthContext";
import { foodItemsService } from "@/services/foodItems";
import { Ionicons } from "@expo/vector-icons";
import React, { useCallback, useEffect, useState } from "react";
import {
  Alert,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

// =============================================================================
// INTERFACES
// =============================================================================

interface ShoppingItem {
  id: string;
  name: string;
  category?: string;
  quantity: number;
  priority: "high" | "medium" | "low";
  completed: boolean;
  addedDate: Date;
  notes?: string;
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export default function ShoppingListScreen() {
  const { user } = useAuth();
  const [shoppingList, setShoppingList] = useState<ShoppingItem[]>([]);
  const [newItemName, setNewItemName] = useState("");
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);

  // Fixed light theme colors
  const backgroundColor = "#F9FAFB";
  const cardBackgroundColor = "#FFFFFF";
  const cardBorderColor = "#F3F4F6";
  const textColor = "#1F2937";
  const subTextColor = "#6B7280";
  const primaryColor = "#22C55E";

  // =============================================================================
  // DATA LOADING
  // =============================================================================

  const loadShoppingList = useCallback(async () => {
    try {
      setLoading(true);
      // For now, generate smart suggestions based on low stock items
      const allItems = await foodItemsService.getItems();
      const lowStockItems = allItems.filter((item) => item.quantity <= 1);

      // Convert low stock items to shopping suggestions
      const suggestions = lowStockItems.map((item) => ({
        id: `suggestion-${item.id}`,
        name: item.name,
        category: item.category || "Other",
        quantity: 1,
        priority: "medium" as const,
        completed: false,
        addedDate: new Date(),
        notes: "Low stock suggestion",
      }));

      // Add some common staples if list is empty
      if (suggestions.length === 0) {
        const staples = [
          { name: "Milk", category: "Dairy", priority: "medium" as const },
          { name: "Bread", category: "Bakery", priority: "medium" as const },
          { name: "Eggs", category: "Dairy", priority: "low" as const },
        ];

        const stapleItems = staples.map((staple, index) => ({
          id: `staple-${index}`,
          name: staple.name,
          category: staple.category,
          quantity: 1,
          priority: staple.priority,
          completed: false,
          addedDate: new Date(),
          notes: "Common staple",
        }));

        setShoppingList(stapleItems);
      } else {
        setShoppingList(suggestions);
      }
    } catch (error) {
      console.error("Error loading shopping list:", error);
      Alert.alert("Error", "Failed to load shopping list");
    } finally {
      setLoading(false);
    }
  }, []);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadShoppingList();
    setRefreshing(false);
  }, [loadShoppingList]);

  useEffect(() => {
    loadShoppingList();
  }, [loadShoppingList]);

  // =============================================================================
  // ACTIONS
  // =============================================================================

  const addItem = useCallback(() => {
    if (!newItemName.trim()) {
      Alert.alert("Error", "Please enter an item name");
      return;
    }

    const newItem: ShoppingItem = {
      id: `manual-${Date.now()}`,
      name: newItemName.trim(),
      quantity: 1,
      priority: "medium",
      completed: false,
      addedDate: new Date(),
    };

    setShoppingList((prev) => [newItem, ...prev]);
    setNewItemName("");
    setShowAddForm(false);
  }, [newItemName]);

  const toggleItemComplete = useCallback((itemId: string) => {
    setShoppingList((prev) =>
      prev.map((item) =>
        item.id === itemId ? { ...item, completed: !item.completed } : item
      )
    );
  }, []);

  const removeItem = useCallback((itemId: string) => {
    setShoppingList((prev) => prev.filter((item) => item.id !== itemId));
  }, []);

  const clearCompleted = useCallback(() => {
    Alert.alert(
      "Clear Completed",
      "Remove all completed items from your shopping list?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Clear",
          style: "destructive",
          onPress: () => {
            setShoppingList((prev) => prev.filter((item) => !item.completed));
          },
        },
      ]
    );
  }, []);

  // =============================================================================
  // RENDER HELPERS
  // =============================================================================

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "#EF4444";
      case "medium":
        return "#F59E0B";
      case "low":
        return "#6B7280";
      default:
        return "#6B7280";
    }
  };

  const renderShoppingItem = ({ item }: { item: ShoppingItem }) => (
    <View
      style={[
        styles.itemCard,
        {
          backgroundColor: cardBackgroundColor,
          borderColor: cardBorderColor,
        },
        item.completed && styles.completedItem,
      ]}
    >
      <TouchableOpacity
        style={styles.itemContent}
        onPress={() => toggleItemComplete(item.id)}
        activeOpacity={0.7}
      >
        {/* Checkbox */}
        <View
          style={[
            styles.checkbox,
            {
              backgroundColor: item.completed ? primaryColor : "transparent",
              borderColor: item.completed ? primaryColor : "#D1D5DB",
            },
          ]}
        >
          {item.completed && (
            <Ionicons name="checkmark" size={16} color="#FFFFFF" />
          )}
        </View>

        {/* Item Info */}
        <View style={styles.itemInfo}>
          <Text
            style={[
              styles.itemName,
              { color: textColor },
              item.completed && styles.completedText,
            ]}
          >
            {item.name}
          </Text>
          <View style={styles.itemMeta}>
            {item.category && (
              <Text style={[styles.category, { color: subTextColor }]}>
                {item.category}
              </Text>
            )}
            <View
              style={[
                styles.priorityDot,
                { backgroundColor: getPriorityColor(item.priority) },
              ]}
            />
            <Text style={[styles.quantity, { color: subTextColor }]}>
              Qty: {item.quantity}
            </Text>
          </View>
        </View>

        {/* Actions */}
        <TouchableOpacity
          style={styles.removeButton}
          onPress={() => removeItem(item.id)}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="close" size={20} color={subTextColor} />
        </TouchableOpacity>
      </TouchableOpacity>
    </View>
  );

  const renderHeader = () => (
    <View style={styles.header}>
      <ThemedText style={styles.title}>Shopping List</ThemedText>
      <Text style={[styles.subtitle, { color: subTextColor }]}>
        {shoppingList.length === 0
          ? "Your shopping list is empty"
          : `${
              shoppingList.filter((item) => !item.completed).length
            } items to buy`}
      </Text>
    </View>
  );

  const completedCount = shoppingList.filter((item) => item.completed).length;

  return (
    <SafeAreaWrapper usePadding edges={["top"]}>
      <ThemedView style={[styles.container, { backgroundColor }]}>
        {/* Header */}
        {renderHeader()}

        {/* Add Item Form */}
        {showAddForm ? (
          <View
            style={[
              styles.addForm,
              {
                backgroundColor: cardBackgroundColor,
                borderColor: cardBorderColor,
              },
            ]}
          >
            <TextInput
              style={[styles.addInput, { color: textColor }]}
              placeholder="Enter item name..."
              placeholderTextColor={subTextColor}
              value={newItemName}
              onChangeText={setNewItemName}
              autoFocus
              returnKeyType="done"
              onSubmitEditing={addItem}
            />
            <View style={styles.addActions}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => {
                  setShowAddForm(false);
                  setNewItemName("");
                }}
              >
                <Text style={[styles.cancelText, { color: subTextColor }]}>
                  Cancel
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.addButton, { backgroundColor: primaryColor }]}
                onPress={addItem}
              >
                <Text style={styles.addButtonText}>Add Item</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <TouchableOpacity
            style={[
              styles.addItemButton,
              {
                backgroundColor: cardBackgroundColor,
                borderColor: primaryColor,
              },
            ]}
            onPress={() => setShowAddForm(true)}
          >
            <Ionicons name="add" size={20} color={primaryColor} />
            <Text style={[styles.addItemText, { color: primaryColor }]}>
              Add Item
            </Text>
          </TouchableOpacity>
        )}

        {/* Shopping List */}
        <FlatList
          data={shoppingList}
          keyExtractor={(item) => item.id}
          renderItem={renderShoppingItem}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={primaryColor}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="basket-outline" size={48} color={subTextColor} />
              <Text style={[styles.emptyText, { color: textColor }]}>
                No items in your shopping list
              </Text>
              <Text style={[styles.emptySubtext, { color: subTextColor }]}>
                Add items to plan your next grocery trip
              </Text>
            </View>
          }
        />

        {/* Footer Actions */}
        {completedCount > 0 && (
          <View
            style={[
              styles.footer,
              {
                backgroundColor: cardBackgroundColor,
                borderTopColor: cardBorderColor,
              },
            ]}
          >
            <Text style={[styles.footerText, { color: subTextColor }]}>
              {completedCount} completed
            </Text>
            <TouchableOpacity
              style={styles.clearButton}
              onPress={clearCompleted}
            >
              <Text style={[styles.clearButtonText, { color: primaryColor }]}>
                Clear Completed
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </ThemedView>
    </SafeAreaWrapper>
  );
}

// =============================================================================
// STYLES
// =============================================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 20,
    paddingBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
  },
  addItemButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 20,
    marginBottom: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderStyle: "dashed",
  },
  addItemText: {
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },
  addForm: {
    marginHorizontal: 20,
    marginBottom: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  addInput: {
    fontSize: 16,
    paddingVertical: 12,
    paddingHorizontal: 0,
    marginBottom: 16,
  },
  addActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 12,
  },
  cancelButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  cancelText: {
    fontSize: 16,
    fontWeight: "500",
  },
  addButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  addButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  listContainer: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  itemCard: {
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 8,
    overflow: "hidden",
  },
  completedItem: {
    opacity: 0.6,
  },
  itemContent: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  completedText: {
    textDecorationLine: "line-through",
  },
  itemMeta: {
    flexDirection: "row",
    alignItems: "center",
  },
  category: {
    fontSize: 14,
    marginRight: 8,
  },
  priorityDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 8,
  },
  quantity: {
    fontSize: 14,
  },
  removeButton: {
    padding: 4,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "600",
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 16,
    textAlign: "center",
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
  },
  footerText: {
    fontSize: 14,
  },
  clearButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  clearButtonText: {
    fontSize: 14,
    fontWeight: "500",
  },
});
