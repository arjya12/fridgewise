import { ConsumeModal } from "@/components/ConsumeModal";
import type { ItemCardPendingTone } from "@/components/ItemCardPendingOverlay";
import { EnhancedCalendarScreen } from "@/components/EnhancedCalendarScreen";
import { OfflineNoticeModal } from "@/components/OfflineNoticeModal";
import { ThrowAwayModal } from "@/components/ThrowAwayModal";
import ScreenLayout from "@/components/ScreenLayout";
import SkeletonBlock from "@/components/SkeletonBlock";
import { useAuth } from "@/contexts/AuthContext";
import { useCalendar } from "@/contexts/CalendarContext";
import { FoodItem } from "@/lib/supabase";
import { foodItemsService } from "@/services/foodItems";
import {
  getErrorMessage,
  isOfflineLikeError,
} from "@/utils/networkError";
import { router, useFocusEffect, useGlobalSearchParams } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { Alert, StyleSheet, View } from "react-native";

export default function CalendarScreen() {
  const { user } = useAuth();
  const { refresh, markItemUsed, state } = useCalendar();
  const hasRefreshedOnceRef = useRef(false);
  const lastRefreshAtRef = useRef(0);
  /** After first completed fetch, keep calendar mounted so empty + refresh does not unmount/remount loop */
  const calendarHydratedRef = useRef(false);
  const prevUserIdRef = useRef<string | undefined>(user?.id);

  useEffect(() => {
    if (prevUserIdRef.current !== user?.id) {
      prevUserIdRef.current = user?.id;
      calendarHydratedRef.current = false;
    }
  }, [user?.id]);

  useEffect(() => {
    if (!state.loading) {
      calendarHydratedRef.current = true;
    }
  }, [state.loading]);
  const [consumeItem, setConsumeItem] = useState<FoodItem | null>(null);
  const [throwAwayItem, setThrowAwayItem] = useState<FoodItem | null>(null);
  const [offlineNoticeVisible, setOfflineNoticeVisible] = useState(false);
  const [itemActionPending, setItemActionPending] = useState<{
    id: string;
    tone: ItemCardPendingTone;
  } | null>(null);

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
    const hasDayFocus =
      typeof params.date === "string" && /^\d{4}-\d{2}-\d{2}/.test(params.date);
    // Deep-link to a specific day always opens calendar (avoids stale ?view=timeline from last visit).
    const view: "calendar" | "timeline" =
      hasDayFocus ? "calendar" : params.view === "timeline" ? "timeline" : "calendar";
    const itemId = typeof params.itemId === "string" ? params.itemId : undefined;

    const hasDeepLinkIntent = hasDayFocus || view === "timeline" || Boolean(itemId);

    if (!hasDeepLinkIntent) return;

    const nonce =
      typeof params.nonce === "string" && params.nonce.length > 0
        ? params.nonce
        : `route-${view}-${itemId ?? "none"}-${params.date ?? "nodate"}-${
            params.openExpired ?? ""
          }`;

    setOpenIntent({
      view,
      date: typeof params.date === "string" ? params.date : undefined,
      itemId,
      nonce,
      openExpired: params.openExpired === "true",
    });
  }, [params.nonce, params.view, params.date, params.itemId, params.openExpired]);

  const backgroundColor = "#FFFFFF";

  const showActionError = useCallback((error: unknown, fallback: string) => {
    if (isOfflineLikeError(error, { hasAuthenticatedUser: Boolean(user?.id) })) {
      setOfflineNoticeVisible(true);
      return;
    }

    Alert.alert("Error", getErrorMessage(error) || fallback);
  }, [user?.id]);

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
    async (item: FoodItem) => {
      const id = String(item.id);
      setItemActionPending({ id, tone: "red" });
      try {
        await foodItemsService.deleteItem(item.id);
        await refresh();
      } catch (error: any) {
        if (!isOfflineLikeError(error, { hasAuthenticatedUser: Boolean(user?.id) })) {
          console.error("Failed to delete item:", error);
        }
        showActionError(error, "Failed to delete item. Please try again.");
      } finally {
        setItemActionPending(null);
      }
    },
    [refresh, showActionError, user?.id]
  );

  const performConsume = useCallback(
    async (item: FoodItem, quantity: number) => {
      const id = String(item.id);
      setItemActionPending({ id, tone: "green" });
      try {
        await markItemUsed(id, quantity);
        await refresh();
      } catch (error: any) {
        if (!isOfflineLikeError(error, { hasAuthenticatedUser: Boolean(user?.id) })) {
          console.error("Failed to log consumption:", error);
        }
        showActionError(error, "Failed to log consumption. Please try again.");
      } finally {
        setItemActionPending(null);
      }
    },
    [markItemUsed, refresh, showActionError, user?.id]
  );

  const handleConsumeClick = useCallback(
    (item: FoodItem) => {
      const maxQty =
        typeof item.quantity === "number" && item.quantity > 0 ? item.quantity : 1;
      if (maxQty <= 1) {
        void performConsume(item, 1);
        return;
      }
      setConsumeItem(item);
    },
    [performConsume]
  );

  const handleConsumeConfirm = useCallback(
    async (quantity: number) => {
      if (!consumeItem) return;
      const item = consumeItem;
      setConsumeItem(null);
      await performConsume(item, quantity);
    },
    [consumeItem, performConsume]
  );

  const handleConsumeCancel = useCallback(() => {
    setConsumeItem(null);
  }, []);

  const performThrowAway = useCallback(
    async (item: FoodItem, quantity: number) => {
      const id = String(item.id);
      setItemActionPending({ id, tone: "red" });
      try {
        await foodItemsService.logUsage(item.id, "wasted", quantity);
        await refresh();
      } catch (error: any) {
        if (!isOfflineLikeError(error, { hasAuthenticatedUser: Boolean(user?.id) })) {
          console.error("Failed to log throw away:", error);
        }
        showActionError(error, "Failed to throw away item. Please try again.");
      } finally {
        setItemActionPending(null);
      }
    },
    [refresh, showActionError, user?.id]
  );

  const handleThrowAwayConfirm = useCallback(
    async (quantity: number) => {
      if (!throwAwayItem) return;
      const item = throwAwayItem;
      setThrowAwayItem(null);
      await performThrowAway(item, quantity);
    },
    [throwAwayItem, performThrowAway]
  );

  const requestThrowAwayModal = useCallback(
    (item: FoodItem) => {
      const maxQty =
        typeof item.quantity === "number" && item.quantity > 0 ? item.quantity : 1;
      if (maxQty <= 1) {
        void performThrowAway(item, 1);
        return;
      }
      setThrowAwayItem(item);
    },
    [performThrowAway]
  );

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

  const showInitialSkeleton =
    state.loading && state.items.length === 0 && !calendarHydratedRef.current;

  return (
    <ScreenLayout topInsetColor="#22C55E" backgroundColor="#FFFFFF">
      {showInitialSkeleton ? (
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
          onItemDelete={handleDeleteItem}
          onRequestThrowAwayQuantity={requestThrowAwayModal}
          pendingItemAction={itemActionPending}
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
      <ThrowAwayModal
        visible={throwAwayItem != null}
        item={throwAwayItem}
        onConfirm={handleThrowAwayConfirm}
        onCancel={() => setThrowAwayItem(null)}
      />
      <OfflineNoticeModal
        visible={offlineNoticeVisible}
        onDismiss={() => setOfflineNoticeVisible(false)}
      />
    </ScreenLayout>
  );
}
