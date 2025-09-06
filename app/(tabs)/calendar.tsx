import { EnhancedCalendarScreen } from "@/components/EnhancedCalendarScreen";
import { useCalendar } from "@/contexts/CalendarContext";
import { foodItemsService } from "@/services/foodItems";
import { router, useFocusEffect } from "expo-router";
import React, { useCallback } from "react";
import { Alert, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function CalendarScreen() {
  // Get refresh function from CalendarContext
  const { refresh } = useCalendar();

  // Fixed light theme colors - no system detection
  const backgroundColor = "#FFFFFF";
  const textColor = "#11181C";

  // Refresh data when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh])
  );

  // Handlers for item actions
  const handleItemPress = useCallback((item: any) => {
    router.push({
      pathname: "/item-details",
      params: { itemId: item.id },
    });
  }, []);

  const handleDeleteItem = useCallback((itemId: string) => {
    Alert.alert("Delete Item", "Are you sure you want to delete this item?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => {
          foodItemsService
            .deleteItem(itemId)
            .then(() => Alert.alert("Success", "Item deleted successfully"))
            .catch((error) => {
              console.error("Failed to delete item:", error);
              Alert.alert("Error", "Failed to delete item. Please try again.");
            });
        },
      },
    ]);
  }, []);

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor,
    },
    header: {
      paddingHorizontal: 20,
      paddingTop: 8,
      paddingBottom: 0,
    },
    title: {
      fontSize: 20,
      fontWeight: "600",
      color: textColor,
      marginBottom: 0,
    },
  });

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Simple Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Food Expiry Calendar</Text>
      </View>

      {/* Calendar Content */}
      <EnhancedCalendarScreen
        foodItemsService={foodItemsService}
        onItemPress={handleItemPress}
        onItemEdit={handleItemPress}
        onItemDelete={(item) => handleDeleteItem(item.id)}
        onAddItem={() => router.push("/(tabs)/add")}
        enablePerformanceMonitoring={true}
      />
    </SafeAreaView>
  );
}
