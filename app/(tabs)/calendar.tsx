import { ConsumeModal } from "@/components/ConsumeModal";
import { EnhancedCalendarScreen } from "@/components/EnhancedCalendarScreen";
import ScreenLayout from "@/components/ScreenLayout";
import SkeletonBlock from "@/components/SkeletonBlock";
import { useCalendar } from "@/contexts/CalendarContext";
import { FoodItem } from "@/lib/supabase";
import { foodItemsService } from "@/services/foodItems";
import { router, useFocusEffect, useGlobalSearchParams } from "expo-router";
import React, { useCallback, useRef, useState } from "react";
import { Alert, StyleSheet, View } from "react-native";

export default function CalendarScreen() {
  const { refresh, markItemUsed, state } = useCalendar();
  const hasRefreshedOnceRef = useRef(false);
  const lastRefreshAtRef = useRef(0);
  const [consumeItem, setConsumeItem] = useState<FoodItem | null>(null);
  const params = useGlobalSearchParams<{
    view?: string;
    date?: string;
    itemId?: string;
    nonce?: string;
    openExpired?: string;
  }>();
  const [openIntent, setOpenIntent] = useState<{
    view: "calendar" | "timeline";
    date?: string;
    itemId?: string;
    nonce?: string;
    openExpired?: boolean;
  }>({ view: "calendar" });

  React.useEffect(() => {
    if (typeof params.nonce !== "string") return;
    setOpenIntent({
      view: params.view === "timeline" ? "timeline" : "calendar",
      date: typeof params.date === "string" ? params.date : undefined,
      itemId: typeof params.itemId === "string" ? params.itemId : undefined,
      nonce: params.nonce,
      openExpired: params.openExpired === "true",
    });
  }, [params.nonce, params.view, params.date, params.itemId, params.openExpired]);

  const backgroundColor = "#FFFFFF";

  useFocusEffect(
    useCallback(() => {
      const now = Date.now();
      const hasFreshData = state.items.length > 0 && now - lastRefreshAtRef.current < 30_000;
      if (hasRefreshedOnceRef.current && hasFreshData) return;
      hasRefreshedOnceRef.current = true;
      refresh().finally(() => {
        lastRefreshAtRef.current = Date.now();
      });
    }, [refresh, state.items.length])
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
      params: {
        edit: "true",
        nonce: `${Date.now()}-${Math.random()}`,
        id: item.id,
        name: item.name,
        quantity: String(item.quantity),
        unit: item.unit || "pcs",
        location: item.location,
        category: item.category || "",
        expiryDate: item.expiry_date || "",
        notes: item.notes || "",
      },
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

  const handleThrowAwayItem = useCallback(
    async (item: FoodItem) => {
      try {
        const qty =
          typeof item.quantity === "number" && item.quantity > 0
            ? item.quantity
            : 1;
        await foodItemsService.logUsage(item.id, "wasted", qty);
        refresh();
      } catch (error) {
        console.error("Failed to log throw away:", error);
        Alert.alert("Error", "Failed to throw away item. Please try again.");
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
    initialSkeletonWrap: {
      flex: 1,
      alignItems: "center",
      paddingTop: 16,
      paddingHorizontal: 12,
    },
  });

  return (
    <ScreenLayout topInsetColor="#22C55E" backgroundColor="#FFFFFF">
      {state.loading && state.items.length === 0 ? (
        <View style={styles.initialSkeletonWrap}>
          <SkeletonBlock width="90%" height={44} borderRadius={20} />
          <SkeletonBlock width="70%" height={28} borderRadius={14} style={{ marginTop: 14 }} />
          <SkeletonBlock width="94%" height={320} borderRadius={16} style={{ marginTop: 14 }} />
        </View>
      ) : (
        <EnhancedCalendarScreen
          foodItemsService={foodItemsService}
          onItemPress={handleItemPress}
          onItemEdit={handleItemEdit}
          onItemDelete={(item) => handleDeleteItem(item.id)}
          onItemThrowAway={handleThrowAwayItem}
          onConsume={handleConsumeClick}
          onAddItem={() => router.push("/(tabs)/add")}
          initialViewMode={openIntent.view}
          initialDate={openIntent.date}
          initialDateToken={openIntent.nonce}
          initialFocusItemId={openIntent.itemId}
          initialFocusToken={openIntent.nonce}
          initialOpenExpired={!!openIntent.openExpired}
          enablePerformanceMonitoring={true}
        />
      )}
      <ConsumeModal
        visible={consumeItem != null}
        item={consumeItem}
        onConfirm={handleConsumeConfirm}
        onCancel={handleConsumeCancel}
      />
    </ScreenLayout>
  );
}
