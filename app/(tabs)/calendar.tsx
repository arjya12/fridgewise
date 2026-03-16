import { ConsumeModal } from "@/components/ConsumeModal";
import { EnhancedCalendarScreen } from "@/components/EnhancedCalendarScreen";
import { useCalendar } from "@/contexts/CalendarContext";
import { FoodItem } from "@/lib/supabase";
import { foodItemsService } from "@/services/foodItems";
import { router, useFocusEffect } from "expo-router";
import React, { useCallback, useState } from "react";
import { Alert, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function CalendarScreen() {
  const { refresh, markItemUsed } = useCalendar();
  const [consumeItem, setConsumeItem] = useState<FoodItem | null>(null);

  const backgroundColor = "#FFFFFF";

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh])
  );

  const handleItemPress = useCallback((item: any) => {
    router.push({
      pathname: "/item-details",
      params: { itemId: item.id },
    });
  }, []);

  const handleItemEdit = useCallback((item: any) => {
    router.push({
      pathname: "/(tabs)/add",
      params: { edit: "true", id: item.id },
    });
  }, []);

  const handleDeleteItem = useCallback(
    async (itemId: string) => {
      try {
        await foodItemsService.deleteItem(itemId);
        refresh();
      } catch (error) {
        console.error("Failed to delete item:", error);
        Alert.alert("Error", "Failed to delete item. Please try again.");
      }
    },
    [refresh]
  );

  const handleConsumeClick = useCallback((item: FoodItem) => {
    setConsumeItem(item);
  }, []);

  const handleConsumeConfirm = useCallback(
    async (quantity: number) => {
      if (!consumeItem) return;
      const id = consumeItem.id;
      setConsumeItem(null);
      try {
        await markItemUsed(id, quantity);
        refresh();
      } catch (error) {
        console.error("Failed to log consumption:", error);
        Alert.alert("Error", "Failed to log consumption. Please try again.");
      }
    },
    [consumeItem, markItemUsed, refresh]
  );

  const handleConsumeCancel = useCallback(() => {
    setConsumeItem(null);
  }, []);

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor,
    },
  });

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <EnhancedCalendarScreen
        foodItemsService={foodItemsService}
        onItemPress={handleItemPress}
        onItemEdit={handleItemEdit}
        onItemDelete={(item) => handleDeleteItem(item.id)}
        onConsume={handleConsumeClick}
        onAddItem={() => router.push("/(tabs)/add")}
        enablePerformanceMonitoring={true}
      />
      <ConsumeModal
        visible={consumeItem != null}
        item={consumeItem}
        onConfirm={handleConsumeConfirm}
        onCancel={handleConsumeCancel}
      />
    </SafeAreaView>
  );
}
