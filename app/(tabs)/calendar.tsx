import EnhancedCalendarWithIndicators from "@/components/calendar/EnhancedCalendarWithIndicators";
import Next7DaysView from "@/components/Next7DaysView";
import { useThemeColor } from "@/hooks/useThemeColor";
import { FoodItem } from "@/lib/supabase";
import { foodItemsService } from "@/services/foodItems";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useCallback, useState } from "react";
import { Alert, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type ViewMode = "calendar" | "next7days";

export default function CalendarScreen() {
  const [viewMode, setViewMode] = useState<ViewMode>("calendar");

  // Theme colors
  const backgroundColor = useThemeColor(
    { light: "#FFFFFF", dark: "#000000" },
    "background"
  );
  const surfaceColor = useThemeColor(
    { light: "#F8F9FA", dark: "#1D1D1D" },
    "background"
  );
  const textColor = useThemeColor(
    { light: "#11181C", dark: "#ECEDEE" },
    "text"
  );
  const primaryColor = "#007AFF";

  const handleAddItem = useCallback(() => {
    router.push("/add");
  }, []);

  const handleItemPress = useCallback((item: any) => {
    // Navigate to item details with the item data
    router.push({
      pathname: "/item-details",
      params: { itemId: item.id },
    });
  }, []);

  const handleMarkUsed = useCallback(async (itemId: string) => {
    try {
      await foodItemsService.logUsage(itemId, "used", 1);
      // Show success feedback
      Alert.alert("Success", "Item marked as used successfully");
    } catch (error) {
      console.error("Failed to mark item as used:", error);
      Alert.alert("Error", "Failed to mark item as used. Please try again.");
    }
  }, []);

  const handleExtendExpiry = useCallback(async (itemId: string) => {
    try {
      // For now, extend by 3 days - in a real app, this might open a picker
      // Get all items and find the one we need (since there's no getItem method)
      const allItems = await foodItemsService.getItems();
      const item = allItems.find((i) => i.id === itemId);

      if (item && item.expiry_date) {
        const currentExpiry = new Date(item.expiry_date);
        const newExpiry = new Date(currentExpiry);
        newExpiry.setDate(currentExpiry.getDate() + 3);

        await foodItemsService.updateItem(itemId, {
          expiry_date: newExpiry.toISOString().split("T")[0],
        });

        Alert.alert("Success", "Expiry date extended by 3 days");
      }
    } catch (error) {
      console.error("Failed to extend expiry:", error);
      Alert.alert("Error", "Failed to extend expiry date. Please try again.");
    }
  }, []);

  const handleDeleteItem = useCallback(async (itemId: string) => {
    Alert.alert(
      "Delete Item",
      "Are you sure you want to delete this item? This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await foodItemsService.deleteItem(itemId);
              Alert.alert("Success", "Item deleted successfully");
            } catch (error) {
              console.error("Failed to delete item:", error);
              Alert.alert("Error", "Failed to delete item. Please try again.");
            }
          },
        },
      ]
    );
  }, []);

  const ViewToggle = () => (
    <View style={[styles.viewToggle, { backgroundColor: surfaceColor }]}>
      <TouchableOpacity
        style={[
          styles.toggleButton,
          viewMode === "calendar" && {
            backgroundColor: primaryColor,
          },
        ]}
        onPress={() => setViewMode("calendar")}
        accessibilityLabel="Monthly calendar view"
        accessibilityState={{ selected: viewMode === "calendar" }}
      >
        <Ionicons
          name="calendar"
          size={16}
          color={viewMode === "calendar" ? "#FFFFFF" : textColor}
        />
        <Text
          style={[
            styles.toggleText,
            {
              color: viewMode === "calendar" ? "#FFFFFF" : textColor,
            },
          ]}
        >
          Calendar
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[
          styles.toggleButton,
          viewMode === "next7days" && {
            backgroundColor: primaryColor,
          },
        ]}
        onPress={() => setViewMode("next7days")}
        accessibilityLabel="Next 7 days list view"
        accessibilityState={{ selected: viewMode === "next7days" }}
      >
        <Ionicons
          name="list"
          size={16}
          color={viewMode === "next7days" ? "#FFFFFF" : textColor}
        />
        <Text
          style={[
            styles.toggleText,
            {
              color: viewMode === "next7days" ? "#FFFFFF" : textColor,
            },
          ]}
        >
          Next 7 Days
        </Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor }]}
      edges={["top"]}
    >
      {/* Header with View Toggle */}
      <View style={[styles.header, { backgroundColor: surfaceColor }]}>
        <Text style={[styles.title, { color: textColor }]}>
          Food Expiry Calendar
        </Text>
        <ViewToggle />
      </View>

      {/* Content based on view mode */}
      {viewMode === "calendar" ? (
        <EnhancedCalendarWithIndicators
          onAddItem={handleAddItem}
          onItemPress={handleItemPress}
          onDateSelect={(date: string, items: FoodItem[]) => {
            console.log(`Selected ${date} with ${items.length} items`);
          }}
          accessibilityEnabled={true}
        />
      ) : (
        <Next7DaysView
          onItemPress={handleItemPress}
          onAddItem={handleAddItem}
          onMarkUsed={handleMarkUsed}
          onExtendExpiry={handleExtendExpiry}
          onDeleteItem={handleDeleteItem}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.05)",
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 12,
  },
  viewToggle: {
    flexDirection: "row",
    borderRadius: 8,
    padding: 4,
    gap: 4,
  },
  toggleButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    gap: 6,
  },
  toggleText: {
    fontSize: 14,
    fontWeight: "500",
  },
});
