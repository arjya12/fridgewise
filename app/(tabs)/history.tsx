import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Animated,
  Image,
  InteractionManager,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import { runOnJS } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Clock, MagnifyingGlass, Trash } from "phosphor-react-native";

import { modalStackedCancelContainer, modalStackedCancelLabel } from "@/theme/modalActionStyles";
import { getFoodCategoryIcon } from "@/lib/foodCategories";
import { useAuth } from "@/contexts/AuthContext";
import { ItemCardPendingOverlay } from "@/components/ItemCardPendingOverlay";
import SkeletonBlock from "@/components/SkeletonBlock";
import { supabase, UsageLog } from "@/lib/supabase";
import { formatQuantityWithUnit } from "@/utils/formatQuantityUnit";

const fridgeIconAsset = require("@/assets/images/icons/fridge_icon.png");
const shelfIconAsset = require("@/assets/images/icons/shelf_icon.png");

const UI = {
  bg: "#ffffff",
  card: "#ffffff",
  border: "#e8e6e0",
  ink: "#1f2937",
  muted: "#6b7280",
  red: "#991B1B",
  ok: "#166534",
  greenTitle: "#15803D",
  tabTrack: "#ECFDF5",
  tabTrackBorder: "#BBF7D0",
  bannerGreen: "#22C55E",
};

type Row = {
  id: string;
  name: string;
  dateStr: string;
  timeStr: string;
  isoYmd: string;
  status: "used" | "wasted";
  qty: number;
  unit?: string;
  category?: string;
  location: "fridge" | "shelf";
  wasExpiredAtLogTime: boolean;
};

function matchesHistorySearch(r: Row, rawQuery: string): boolean {
  const q = rawQuery.trim().toLowerCase().replace(/\s+/g, " ");
  if (!q) return true;
  const cat = (r.category || "").toLowerCase();
  const y = r.isoYmd.length >= 4 ? r.isoYmd.slice(0, 4) : "";
  const md = r.isoYmd.length >= 10 ? r.isoYmd.slice(5) : "";
  const blob = [
    r.name.toLowerCase(),
    cat,
    r.dateStr.toLowerCase(),
    r.timeStr.toLowerCase(),
    r.isoYmd.toLowerCase(),
    y,
    md,
  ]
    .join(" ")
    .toLowerCase();
  const tokens = q.split(" ").filter(Boolean);
  return tokens.every((t) => blob.includes(t));
}

type LogWithItem = UsageLog & {
  food_items?: {
    name?: string;
    category?: string;
    location?: string;
    unit?: string;
    expiry_date?: string;
  } | null;
};

function isUsedOrWasted(
  log: LogWithItem
): log is LogWithItem & { status: "used" | "wasted" } {
  return log.status === "used" || log.status === "wasted";
}

function toIsoYmd(d: Date): string {
  const y = d.getFullYear();
  const m = d.getMonth() + 1;
  const day = d.getDate();
  const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
  return `${y}-${pad(m)}-${pad(day)}`;
}

function wasExpiredOnOrBefore(expiryDate?: string, at?: Date): boolean {
  if (!expiryDate || !at) return false;
  const expiry = new Date(expiryDate);
  if (Number.isNaN(expiry.getTime())) return false;
  const compare = new Date(at);
  expiry.setHours(0, 0, 0, 0);
  compare.setHours(0, 0, 0, 0);
  return expiry.getTime() < compare.getTime();
}

const getCategoryIcon = getFoodCategoryIcon;

export default function HistoryScreen() {
  const { user } = useAuth();
  const [initialLoading, setInitialLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [logs, setLogs] = useState<LogWithItem[]>([]);
  const hasLoadedOnceRef = useRef(false);
  const lastLoadedAtRef = useRef<number>(0);
  const params = useLocalSearchParams<{ filter?: string; focusLogId?: string }>();
  const [historyTab, setHistoryTab] = useState<"used" | "wasted">("used");
  const [highlightLogId, setHighlightLogId] = useState<string | null>(null);
  const usedScrollRef = useRef<ScrollView>(null);
  const wastedScrollRef = useRef<ScrollView>(null);
  const processedFocusKeyRef = useRef<string | null>(null);
  /** Y offset within the list container — used for accurate scrollTo with many rows */
  const rowOffsetUsedRef = useRef<Record<string, number>>({});
  const rowOffsetWastedRef = useRef<Record<string, number>>({});
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Row | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (params.filter === "used" || params.filter === "wasted") {
      setHistoryTab(params.filter);
    }
  }, [params.filter]);

  useEffect(() => {
    if (!params.focusLogId) {
      processedFocusKeyRef.current = null;
    }
  }, [params.focusLogId]);

  const load = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("usage_logs")
        .select(
          `
          *,
          food_items!usage_logs_item_id_fkey (
            name,
            category,
            location,
            unit,
            expiry_date
          )
        `
        )
        .in("status", ["used", "wasted"])
        .order("logged_at", { ascending: false })
        .limit(400);
      if (error) throw error;
      setLogs((data as any) ?? []);
      lastLoadedAtRef.current = Date.now();
    } finally {
      setInitialLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (!user) {
        router.replace({ pathname: "/(auth)/welcome" });
        return;
      }
      const fromDeepLink =
        typeof params.focusLogId === "string" && params.focusLogId.length > 0;
      const now = Date.now();
      if (
        !fromDeepLink &&
        hasLoadedOnceRef.current &&
        now - lastLoadedAtRef.current < 30_000
      ) {
        return;
      }
      hasLoadedOnceRef.current = true;
      void load();
    }, [user, load, params.focusLogId])
  );

  const allRows = useMemo<Row[]>(() => {
    return logs.filter(isUsedOrWasted).map((l) => {
      const dt = new Date(l.logged_at);
      const dateStr = dt.toLocaleDateString(undefined, {
        month: "long",
        day: "numeric",
      });
      const timeRaw = dt.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      });
      const timeStr = timeRaw.replace(" AM", " am").replace(" PM", " pm");
      const locRaw = (l.food_items?.location || "fridge").toLowerCase();
      const location: "fridge" | "shelf" = locRaw === "shelf" ? "shelf" : "fridge";
      const qty =
        typeof l.quantity === "number" ? l.quantity : 1;
      const isoYmd = toIsoYmd(dt);
      return {
        id: l.id,
        name: l.food_items?.name || "Item",
        dateStr,
        timeStr,
        isoYmd,
        status: l.status,
        qty,
        unit: l.food_items?.unit,
        category: l.food_items?.category,
        location,
        wasExpiredAtLogTime: wasExpiredOnOrBefore(l.food_items?.expiry_date, dt),
      };
    });
  }, [logs]);

  const counts = useMemo(() => {
    const used = allRows.filter((r) => r.status === "used").length;
    const wasted = allRows.filter((r) => r.status === "wasted").length;
    return { used, wasted };
  }, [allRows]);

  const filteredUsed = useMemo(() => {
    const base = allRows.filter((r) => r.status === "used");
    const q = searchQuery.trim();
    if (!q) return base;
    return base.filter((r) => matchesHistorySearch(r, q));
  }, [allRows, searchQuery]);

  const filteredWasted = useMemo(() => {
    const base = allRows.filter((r) => r.status === "wasted");
    const q = searchQuery.trim();
    if (!q) return base;
    return base.filter((r) => matchesHistorySearch(r, q));
  }, [allRows, searchQuery]);

  const scheduleScrollToLog = useCallback((fid: string, tab: "used" | "wasted") => {
    const scrollRef = tab === "used" ? usedScrollRef : wastedScrollRef;
    const offsets = tab === "used" ? rowOffsetUsedRef : rowOffsetWastedRef;
    const leadMs = tab === "wasted" ? 300 : 120;

    const tryScroll = (attempt: number) => {
      const y = offsets.current[fid];
      if (typeof y === "number" && scrollRef.current) {
        scrollRef.current.scrollTo({
          y: Math.max(0, y - 52),
          animated: true,
        });
        return;
      }
      if (attempt < 55) {
        setTimeout(() => tryScroll(attempt + 1), attempt < 8 ? 32 : 48);
      }
    };

    InteractionManager.runAfterInteractions(() => {
      setTimeout(() => tryScroll(0), leadMs);
    });
  }, []);

  useEffect(() => {
    const fid =
      typeof params.focusLogId === "string" && params.focusLogId.length > 0
        ? params.focusLogId
        : null;
    if (!fid || initialLoading) return;

    const tab: "used" | "wasted" =
      params.filter === "wasted" ? "wasted" : "used";
    const dedupeKey = `${tab}:${fid}`;
    if (processedFocusKeyRef.current === dedupeKey) return;

    const usedList = allRows.filter((r) => r.status === "used");
    const wastedList = allRows.filter((r) => r.status === "wasted");
    const list = tab === "used" ? usedList : wastedList;
    const idx = list.findIndex((r) => r.id === fid);
    if (idx < 0) return;

    processedFocusKeyRef.current = dedupeKey;
    setHistoryTab(tab);
    setSearchQuery("");
    setHighlightLogId(fid);
    const clearHi = setTimeout(() => setHighlightLogId(null), 3600);

    scheduleScrollToLog(fid, tab);

    requestAnimationFrame(() => {
      router.setParams({ focusLogId: undefined, filter: undefined });
    });

    return () => clearTimeout(clearHi);
  }, [initialLoading, params.focusLogId, params.filter, allRows, scheduleScrollToLog]);

  const anyUsed = counts.used > 0;
  const anyWasted = counts.wasted > 0;

  const { width: screenWidth } = useWindowDimensions();
  const slideTranslate = useRef(new Animated.Value(0)).current;
  const pillTranslate = useRef(new Animated.Value(0)).current;
  const [tabBarWidth, setTabBarWidth] = useState(0);
  const TAB_INNER_PAD = 4;
  const TAB_GAP = 4;
  const segmentW =
    tabBarWidth > TAB_INNER_PAD * 2 + TAB_GAP
      ? (tabBarWidth - TAB_INNER_PAD * 2 - TAB_GAP) / 2
      : 0;

  const setTabUsed = useCallback(() => setHistoryTab("used"), []);
  const setTabWasted = useCallback(() => setHistoryTab("wasted"), []);

  const historySwipeGesture = useMemo(
    () =>
      Gesture.Pan()
        .activeOffsetX([-24, 24])
        .failOffsetY([-28, 28])
        .onEnd((e) => {
          if (e.translationX < -48 && historyTab === "used") {
            runOnJS(setTabWasted)();
          } else if (e.translationX > 48 && historyTab === "wasted") {
            runOnJS(setTabUsed)();
          }
        }),
    [historyTab, setTabUsed, setTabWasted]
  );

  useEffect(() => {
    const target = historyTab === "used" ? 0 : -screenWidth;
    Animated.spring(slideTranslate, {
      toValue: target,
      useNativeDriver: true,
      damping: 20,
      stiffness: 200,
    }).start();
  }, [historyTab, screenWidth, slideTranslate]);

  useEffect(() => {
    if (segmentW <= 0) return;
    const x = historyTab === "used" ? 0 : segmentW + TAB_GAP;
    Animated.spring(pillTranslate, {
      toValue: x,
      useNativeDriver: true,
      damping: 20,
      stiffness: 200,
    }).start();
  }, [historyTab, segmentW, pillTranslate]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await load();
    } finally {
      setRefreshing(false);
    }
  };

  const qtyLabel = (r: Row) => {
    return formatQuantityWithUnit(r.qty, r.unit, { fallbackUnit: "pcs" });
  };

  const renderHistoryRow = useCallback(
    (r: Row, panel: "used" | "wasted") => {
      const CategoryIcon = getCategoryIcon(r.category, r.name);
      const iconColor =
        r.status === "wasted" || r.wasExpiredAtLogTime ? "#B91C1C" : "#16A34A";
      const isShelf = r.location === "shelf";
      const isHi = highlightLogId === r.id;
      const hiStyle =
        isHi && r.status === "wasted"
          ? styles.rowHighlightWaste
          : isHi
            ? styles.rowHighlightConsume
            : null;
      const rowBusy = deletingId === r.id;
      return (
        <View
          key={r.id}
          style={[styles.row, hiStyle]}
          onLayout={(e) => {
            const y = e.nativeEvent.layout.y;
            if (panel === "used") {
              rowOffsetUsedRef.current[r.id] = y;
            } else {
              rowOffsetWastedRef.current[r.id] = y;
            }
          }}
        >
          <View style={styles.rowIconTile}>
            <CategoryIcon size={22} color={iconColor} weight="fill" />
          </View>
          <View style={styles.rowBody}>
            <Text style={styles.rowTitle} numberOfLines={1}>
              {r.name}
            </Text>
            <View style={styles.rowMetaRow}>
              <Image
                source={isShelf ? shelfIconAsset : fridgeIconAsset}
                style={styles.locIcon}
                resizeMode="contain"
              />
              <Text style={styles.rowMeta} numberOfLines={1}>
                {isShelf ? "Shelf" : "Fridge"} · {qtyLabel(r)}
              </Text>
            </View>
            <View style={styles.rowTimeRow}>
              <Clock size={12} color={UI.muted} weight="bold" />
              <Text style={styles.rowTime} numberOfLines={2}>
                {r.dateStr} · {r.timeStr}
              </Text>
            </View>
          </View>
          <Pressable
            style={styles.rowDelete}
            onPress={() => setDeleteTarget(r)}
            disabled={rowBusy}
            accessibilityRole="button"
            accessibilityLabel={`Delete ${r.name} from history`}
          >
            <Trash
              size={18}
              color={rowBusy ? UI.muted : "#DC2626"}
              weight="regular"
            />
          </Pressable>
          <ItemCardPendingOverlay
            visible={rowBusy}
            tone={panel === "used" ? "green" : "red"}
          />
        </View>
      );
    },
    [deletingId, highlightLogId]
  );

  const confirmDeleteFromModal = useCallback(async () => {
    if (!deleteTarget) return;
    const id = deleteTarget.id;
    setDeletingId(id);
    setDeleteTarget(null);
    try {
      const { error } = await supabase.from("usage_logs").delete().eq("id", id);
      if (error) throw error;
      setLogs((prev) => prev.filter((l) => l.id !== id));
    } catch {
      Alert.alert("Couldn't delete", "Please try again.");
    } finally {
      setDeletingId(null);
    }
  }, [deleteTarget]);

  return (
    <View style={styles.screenRoot}>
      <View
        style={[
          styles.heroBanner,
          { paddingTop: insets.top + 8 },
        ]}
      >
        <Text style={styles.heroTitle}>Item History</Text>

        <Text style={styles.statInline}>
          <Text style={styles.statInlineEm}>{counts.used}</Text>
          <Text> consumed · </Text>
          <Text style={styles.statInlineEm}>{counts.wasted}</Text>
          <Text> thrown away</Text>
        </Text>

        <View
          style={styles.heroTabBar}
          onLayout={(e) => setTabBarWidth(e.nativeEvent.layout.width)}
        >
          <Animated.View
            pointerEvents="none"
            style={[
              styles.heroTabSlidingPill,
              {
                width: Math.max(0, segmentW),
                transform: [{ translateX: pillTranslate }],
              },
            ]}
          />
          <Pressable
            style={styles.heroTab}
            onPress={() => setHistoryTab("used")}
            accessibilityRole="tab"
            accessibilityState={{ selected: historyTab === "used" }}
          >
            <Text
              style={[
                styles.heroTabText,
                historyTab === "used" && styles.heroTabTextActive,
              ]}
            >
              Consumed
            </Text>
          </Pressable>
          <Pressable
            style={styles.heroTab}
            onPress={() => setHistoryTab("wasted")}
            accessibilityRole="tab"
            accessibilityState={{ selected: historyTab === "wasted" }}
          >
            <Text
              style={[
                styles.heroTabText,
                historyTab === "wasted" && styles.heroTabTextActiveWasted,
              ]}
            >
              Thrown Away
            </Text>
          </Pressable>
        </View>

        <View style={styles.searchBar}>
          <MagnifyingGlass size={17} color="#64748B" weight="bold" />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search name, date, category…"
            placeholderTextColor="rgba(15,23,42,0.45)"
            style={styles.searchInput}
            returnKeyType="search"
            clearButtonMode="while-editing"
          />
        </View>
      </View>

      <GestureDetector gesture={historySwipeGesture}>
        <View style={styles.panelsClip}>
          <Animated.View
            style={[
              styles.panelsRow,
              {
                width: screenWidth * 2,
                transform: [{ translateX: slideTranslate }],
              },
            ]}
          >
            <ScrollView
              ref={usedScrollRef}
              style={[styles.panelScroll, { width: screenWidth }]}
              contentContainerStyle={[
                styles.scrollContent,
                { paddingBottom: insets.bottom + 88 },
              ]}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={handleRefresh}
                />
              }
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              <View style={styles.list}>
                {initialLoading ? (
                  <>
                    <View style={styles.skeletonRow}>
                      <SkeletonBlock width={36} height={36} borderRadius={10} />
                      <View style={{ flex: 1 }}>
                        <SkeletonBlock width="55%" height={14} />
                        <SkeletonBlock
                          width="70%"
                          height={11}
                          style={styles.skeletonGap}
                        />
                        <SkeletonBlock width="45%" height={10} style={styles.skeletonGap} />
                      </View>
                    </View>
                    <View style={styles.skeletonRow}>
                      <SkeletonBlock width={36} height={36} borderRadius={10} />
                      <View style={{ flex: 1 }}>
                        <SkeletonBlock width="48%" height={14} />
                        <SkeletonBlock
                          width="64%"
                          height={11}
                          style={styles.skeletonGap}
                        />
                        <SkeletonBlock width="40%" height={10} style={styles.skeletonGap} />
                      </View>
                    </View>
                  </>
                ) : filteredUsed.length === 0 ? (
                  !anyUsed ? (
                    <View style={styles.emptyMinimal}>
                      <Text style={styles.emptyOnboardingTitle}>
                        Nothing consumed yet
                      </Text>
                      <Text style={styles.emptyOnboardingHint}>
                        When you mark items as used, they show up here with the
                        date.
                      </Text>
                    </View>
                  ) : (
                    <View style={styles.emptyMinimal}>
                      <Text style={styles.emptyNoMatchTitle}>No matches</Text>
                      <Text style={styles.emptyNoMatchHint}>
                        Try another name, date, or category.
                      </Text>
                    </View>
                  )
                ) : (
                  filteredUsed.map((r) => renderHistoryRow(r, "used"))
                )}
              </View>
            </ScrollView>
            <ScrollView
              ref={wastedScrollRef}
              style={[styles.panelScroll, { width: screenWidth }]}
              contentContainerStyle={[
                styles.scrollContent,
                { paddingBottom: insets.bottom + 88 },
              ]}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={handleRefresh}
                />
              }
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              <View style={styles.list}>
                {initialLoading ? (
                  <>
                    <View style={styles.skeletonRow}>
                      <SkeletonBlock width={36} height={36} borderRadius={10} />
                      <View style={{ flex: 1 }}>
                        <SkeletonBlock width="55%" height={14} />
                        <SkeletonBlock
                          width="70%"
                          height={11}
                          style={styles.skeletonGap}
                        />
                        <SkeletonBlock width="45%" height={10} style={styles.skeletonGap} />
                      </View>
                    </View>
                    <View style={styles.skeletonRow}>
                      <SkeletonBlock width={36} height={36} borderRadius={10} />
                      <View style={{ flex: 1 }}>
                        <SkeletonBlock width="48%" height={14} />
                        <SkeletonBlock
                          width="64%"
                          height={11}
                          style={styles.skeletonGap}
                        />
                        <SkeletonBlock width="40%" height={10} style={styles.skeletonGap} />
                      </View>
                    </View>
                  </>
                ) : filteredWasted.length === 0 ? (
                  !anyWasted ? (
                    <View style={styles.emptyMinimal}>
                      <Text style={styles.emptyOnboardingTitle}>
                        Nothing thrown away yet
                      </Text>
                      <Text style={styles.emptyOnboardingHint}>
                        When you throw items away, they show up here with the
                        date.
                      </Text>
                    </View>
                  ) : (
                    <View style={styles.emptyMinimal}>
                      <Text style={styles.emptyNoMatchTitle}>No matches</Text>
                      <Text style={styles.emptyNoMatchHint}>
                        Try another name, date, or category.
                      </Text>
                    </View>
                  )
                ) : (
                  filteredWasted.map((r) => renderHistoryRow(r, "wasted"))
                )}
              </View>
            </ScrollView>
          </Animated.View>
        </View>
      </GestureDetector>

      <Modal
        transparent
        visible={deleteTarget != null}
        animationType="fade"
        onRequestClose={() => setDeleteTarget(null)}
      >
        <View style={styles.delModalBackdrop}>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={() => setDeleteTarget(null)}
          />
          <View style={styles.delModalCard}>
            <Text style={styles.delModalTitle}>
              {deleteTarget ? `Delete ${deleteTarget.name}?` : "Delete?"}
            </Text>

            <TouchableOpacity
              style={styles.delModalPrimary}
              activeOpacity={0.9}
              onPress={confirmDeleteFromModal}
              disabled={deletingId != null}
            >
              <Text style={styles.delModalPrimaryText}>
                Remove this from Item History
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.delModalCancel}
              activeOpacity={0.9}
              onPress={() => setDeleteTarget(null)}
            >
              <Text style={styles.delModalCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screenRoot: {
    flex: 1,
    backgroundColor: UI.bg,
  },
  heroBanner: {
    backgroundColor: UI.bannerGreen,
    paddingHorizontal: 20,
    paddingBottom: 12,
    borderBottomLeftRadius: 18,
    borderBottomRightRadius: 18,
  },
  heroTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#FFFFFF",
    textAlign: "center",
    letterSpacing: -0.3,
  },
  statInline: {
    marginTop: 8,
    textAlign: "center",
    fontSize: 12,
    fontWeight: "500",
    color: "rgba(255,255,255,0.88)",
    letterSpacing: 0.1,
  },
  statInlineEm: {
    fontWeight: "600",
    color: "#FFFFFF",
  },
  heroTabBar: {
    position: "relative",
    flexDirection: "row",
    marginTop: 10,
    marginHorizontal: 2,
    paddingHorizontal: 4,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.22)",
    gap: 4,
  },
  heroTabSlidingPill: {
    position: "absolute",
    left: 4,
    top: 4,
    bottom: 4,
    borderRadius: 999,
    backgroundColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  heroTab: {
    flex: 1,
    zIndex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    borderRadius: 999,
  },
  heroTabText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  heroTabTextActive: {
    color: "#15803D",
    fontWeight: "700",
  },
  heroTabTextActiveWasted: {
    color: "#991B1B",
    fontWeight: "700",
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 10,
    backgroundColor: "#FFFFFF",
    borderRadius: 999,
    paddingHorizontal: 14,
    height: 40,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.65)",
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    fontWeight: "400",
    color: UI.ink,
    paddingVertical: 0,
  },
  panelsClip: {
    flex: 1,
    overflow: "hidden",
  },
  panelsRow: {
    flex: 1,
    flexDirection: "row",
  },
  panelScroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 18,
    paddingTop: 12,
  },
  list: {
    gap: 10,
  },
  skeletonRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: UI.card,
    borderWidth: 1,
    borderColor: UI.border,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 10,
  },
  skeletonGap: {
    marginTop: 6,
  },
  row: {
    position: "relative",
    overflow: "hidden",
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: UI.card,
    borderWidth: 1,
    borderColor: UI.border,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 10,
  },
  /** Focus-from-home: subtle green (consumed) vs red (thrown away) */
  rowHighlightConsume: {
    backgroundColor: "rgba(220, 252, 232, 0.78)",
    borderColor: "rgba(22, 101, 52, 0.22)",
    borderWidth: 1,
  },
  rowHighlightWaste: {
    backgroundColor: "rgba(254, 226, 226, 0.78)",
    borderColor: "rgba(185, 28, 28, 0.22)",
    borderWidth: 1,
  },
  rowIconTile: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  rowBody: {
    flex: 1,
    minWidth: 0,
  },
  rowTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: UI.ink,
  },
  rowMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 5,
  },
  locIcon: {
    width: 12,
    height: 12,
    tintColor: UI.muted,
  },
  rowMeta: {
    flex: 1,
    fontSize: 12,
    fontWeight: "600",
    color: UI.muted,
  },
  rowTimeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 4,
  },
  rowTime: {
    flex: 1,
    fontSize: 11,
    fontWeight: "600",
    color: UI.muted,
  },
  rowDelete: {
    padding: 8,
    marginLeft: 2,
    alignSelf: "center",
  },
  emptyMinimal: {
    alignItems: "center",
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  emptyNoMatchTitle: {
    fontSize: 15,
    fontWeight: "500",
    color: UI.muted,
    textAlign: "center",
  },
  emptyNoMatchHint: {
    marginTop: 8,
    fontSize: 13,
    fontWeight: "400",
    color: "rgba(107, 114, 128, 0.92)",
    textAlign: "center",
    lineHeight: 19,
    maxWidth: 280,
  },
  emptyOnboardingTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: UI.ink,
    textAlign: "center",
  },
  emptyOnboardingHint: {
    marginTop: 8,
    fontSize: 13,
    fontWeight: "400",
    color: UI.muted,
    textAlign: "center",
    lineHeight: 19,
    maxWidth: 300,
  },
  delModalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(15,23,42,0.25)",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  delModalCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    paddingVertical: 16,
    paddingHorizontal: 18,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 6,
  },
  delModalTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 16,
    textAlign: "center",
  },
  delModalPrimary: {
    alignSelf: "center",
    alignItems: "center",
    justifyContent: "center",
    maxWidth: 220,
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#FCA5A5",
    backgroundColor: "#FFFFFF",
  },
  delModalPrimaryText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#B91C1C",
    textAlign: "center",
  },
  delModalCancel: {
    ...modalStackedCancelContainer,
  },
  delModalCancelText: {
    ...modalStackedCancelLabel,
  },
});
