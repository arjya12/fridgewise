import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  Easing,
  Alert,
  LayoutAnimation,
  Image,
  Keyboard,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  UIManager,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  CaretLeft,
  CaretRight,
  ClockCounterClockwise,
  Hourglass,
  MagnifyingGlass,
  PushPin,
  X,
  Thermometer,
  WarningCircle,
} from "phosphor-react-native";
import Svg, { Path } from "react-native-svg";
import { LinearGradient } from "expo-linear-gradient";
import { Dimensions } from "react-native";

import { ConsumeModal } from "@/components/ConsumeModal";
import { ItemCardPendingOverlay } from "@/components/ItemCardPendingOverlay";
import { ThrowAwayModal } from "@/components/ThrowAwayModal";
import ScreenLayout from "@/components/ScreenLayout";
import { useAuth } from "@/contexts/AuthContext";
import {
  loadPinnedItemIds,
  MAX_PINNED_ITEMS,
  savePinnedItemIds,
} from "@/lib/pinnedItemsStorage";
import { FoodItem, supabase, UsageLog } from "@/lib/supabase";
import { getFoodCategoryIcon } from "@/lib/foodCategories";
import { foodItemsService } from "@/services/foodItems";
import { formatExpiry } from "@/utils/formatExpiry";
import { formatQuantityWithUnit } from "@/utils/formatQuantityUnit";

type LocationFilter = "all" | "fridge" | "shelf";

type ItemEntry = {
  id: string;
  quantity: number;
  expiryDate?: string;
  daysUntilExpiry?: number;
  location: "fridge" | "shelf";
};

type ItemGroup = {
  name: string;
  totalQuantity: number;
  soonestExpiry?: string;
  soonestDays?: number;
  entries: ItemEntry[];
};

type ThisWeekCard = {
  kind: "expiring" | "expired" | "used" | "wasted";
  id: string;
  title: string;
  quantity: number;
  unit?: string;
  location?: "fridge" | "shelf";
  category?: string;
  expiryDate?: string;
  statusText: string;
};

const UI = {
  bg: "#ffffff",
  card: "#ffffff",
  border: "#e8e6e0",
  divider: "#ece9e2",
  ink: "#1f2937",
  muted: "#6b7280",
  neutral: "#334155",
  neutralBg: "#F1F5F9",
  neutralBorder: "#CBD5E1",
  greenBg: "#EAF3DE",
  greenInk: "#27500A",
  greenBorder: "#C0DD97",
  amber: "#B45309",
  amberBg: "#FEF3C7",
  amberBorder: "#FDE68A",
  red: "#991B1B",
  redBg: "#FEE2E2",
  redBorder: "#FECACA",
  ok: "#166534",
  okBg: "#DCFCE7",
  okBorder: "#BBF7D0",
};

const getDaysUntilExpiry = (expiryDate?: string): number | undefined => {
  if (!expiryDate) return undefined;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const expiry = new Date(expiryDate);
  return Math.ceil(
    (expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
  );
};

const getDaysAgo = (dateString?: string): number | undefined => {
  if (!dateString) return undefined;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dt = new Date(dateString);
  dt.setHours(0, 0, 0, 0);
  const diff = Math.floor((today.getTime() - dt.getTime()) / (1000 * 60 * 60 * 24));
  return diff >= 0 ? diff : undefined;
};

const fridgeIconAsset = require("@/assets/images/icons/fridge_icon.png");
const shelfIconAsset = require("@/assets/images/icons/shelf_icon.png");
const PINNED_ACTION_ROW_H = 44;
const INVENTORY_ACTION_ROW_H = 44;

const runSmoothLayout = () => {
  LayoutAnimation.configureNext({
    duration: 220,
    update: {
      type: LayoutAnimation.Types.easeInEaseOut,
    },
    delete: {
      type: LayoutAnimation.Types.easeInEaseOut,
      property: LayoutAnimation.Properties.opacity,
    },
    create: {
      type: LayoutAnimation.Types.easeInEaseOut,
      property: LayoutAnimation.Properties.opacity,
    },
  });
};

function parseExpiryYmd(iso?: string): string | null {
  if (!iso || iso.length < 10) return null;
  return iso.includes("T") ? iso.split("T")[0]! : iso.slice(0, 10);
}

function parseExpiryDate(iso?: string): Date | null {
  if (!iso) return null;
  const ymd = parseExpiryYmd(iso);
  if (ymd) {
    const midday = new Date(`${ymd}T12:00:00`);
    if (!Number.isNaN(midday.getTime())) return midday;
  }
  // Fallback for non-ISO variants that still parse in JS/engine
  const direct = new Date(iso);
  return Number.isNaN(direct.getTime()) ? null : direct;
}

function isFoodItemExpired(item: FoodItem): boolean {
  const d = parseExpiryDate(item.expiry_date);
  if (!d) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  d.setHours(0, 0, 0, 0);
  return d < today;
}

/** Upcoming (soonest expiry first), then no date, then expired (earlier date first). */
function compareFoodItemsByExpirySoonestFirst(a: FoodItem, b: FoodItem): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const da = parseExpiryDate(a.expiry_date);
  const db = parseExpiryDate(b.expiry_date);
  const bucket = (d: Date | null) => {
    if (!d) return 2;
    const x = new Date(d);
    x.setHours(0, 0, 0, 0);
    if (x < today) return 1;
    return 0;
  };
  const ba = bucket(da);
  const bb = bucket(db);
  if (ba !== bb) return ba - bb;
  if (da && db) return da.getTime() - db.getTime();
  return a.name.localeCompare(b.name);
}

function formatPinExpiryLine(item: FoodItem): { text: string; expired: boolean } {
  if (!parseExpiryYmd(item.expiry_date)) {
    return { text: "No expiry date", expired: false };
  }
  const d = parseExpiryDate(item.expiry_date)!;
  const label = d.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  const expired = isFoodItemExpired(item);
  return { text: expired ? `Expired · ${label}` : label, expired };
}

const getCategoryIcon = getFoodCategoryIcon;

const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 5) return "Good Night";
  if (hour < 12) return "Good Morning";
  if (hour < 17) return "Good Afternoon";
  if (hour < 22) return "Good Evening";
  return "Good Night";
};

const firstNameFromProfile = (fullName?: string, email?: string) => {
  const candidate =
    (fullName && fullName.trim().split(" ")[0]) ||
    (email && email.split("@")[0]) ||
    "";
  const match = candidate.match(/[A-Za-z]+/);
  const cleaned = match ? match[0] : candidate;
  if (!cleaned) return undefined;
  return cleaned.charAt(0).toUpperCase() + cleaned.slice(1).toLowerCase();
};

function Divider() {
  return (
    <View
      style={styles.sectionLine}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    />
  );
}

function CardRow({
  title,
  subtitle,
  leftDotColor,
  icon,
  onPress,
}: {
  title: string;
  subtitle: string;
  leftDotColor: string;
  icon: React.ReactNode;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={styles.rowCard} accessibilityRole="button">
      <View style={[styles.rowAccentDot, { backgroundColor: leftDotColor }]} />
      <View style={{ flex: 1 }}>
        <Text style={styles.rowTitle} numberOfLines={1}>
          {title}
        </Text>
        <Text style={styles.rowSubtitle} numberOfLines={1}>
          {subtitle}
        </Text>
      </View>
      <View style={styles.rowRight}>
        {icon}
        <CaretRight size={18} color={UI.muted} weight="bold" />
      </View>
    </Pressable>
  );
}

export default function HomeScreen() {
  const { user, userProfile, getUserProfile } = useAuth();
  const insets = useSafeAreaInsets();

  const [items, setItems] = useState<FoodItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const hasLoadedOnceRef = useRef(false);
  const lastLoadedAtRef = useRef(0);

  const [locationFilter, setLocationFilter] = useState<LocationFilter>("fridge");
  const [inventoryToggleWidth, setInventoryToggleWidth] = useState(0);
  const [searchText, setSearchText] = useState("");
  const [keyboardInset, setKeyboardInset] = useState(0);
  const homeScrollRef = useRef<ScrollView>(null);
  const inventorySectionYRef = useRef(0);
  const inventoryListYRef = useRef(0);

  const [thisWeekTab, setThisWeekTab] = useState<"upcoming" | "recent" | "expired">(
    "upcoming"
  );
  const twStripRef = useRef<ScrollView>(null);
  const twSlideAnim = useRef(new Animated.Value(0)).current;
  const inventoryToggleAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(twSlideAnim, {
      toValue: thisWeekTab === "recent" ? 1 : thisWeekTab === "expired" ? 2 : 0,
      duration: 200,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start();
    requestAnimationFrame(() => {
      twStripRef.current?.scrollTo({ x: 0, animated: false });
    });
  }, [thisWeekTab]);
  useEffect(() => {
    Animated.timing(inventoryToggleAnim, {
      toValue: locationFilter === "shelf" ? 1 : 0,
      duration: 220,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start();
  }, [locationFilter, inventoryToggleAnim]);
  const scrollInventoryIntoView = useCallback(() => {
    const hasSearchQuery = searchText.trim().length > 0;
    const targetY = hasSearchQuery
      ? inventoryListYRef.current
      : inventorySectionYRef.current;
    const extraTopOffset = keyboardInset > 0 ? (hasSearchQuery ? 245 : 170) : 8;
    requestAnimationFrame(() => {
      homeScrollRef.current?.scrollTo({
        y: Math.max(targetY - extraTopOffset, 0),
        animated: true,
      });
    });
  }, [keyboardInset, searchText]);
  useEffect(() => {
    const onShow = Keyboard.addListener("keyboardDidShow", (e) => {
      setKeyboardInset(e.endCoordinates?.height ?? 0);
      scrollInventoryIntoView();
    });
    const onHide = Keyboard.addListener("keyboardDidHide", () => {
      setKeyboardInset(0);
    });
    return () => {
      onShow.remove();
      onHide.remove();
    };
  }, [scrollInventoryIntoView]);
  useEffect(() => {
    if (keyboardInset <= 0) return;
    if (!searchText.trim()) return;
    scrollInventoryIntoView();
  }, [keyboardInset, searchText, scrollInventoryIntoView]);
  const [thisWeekExpiring, setThisWeekExpiring] = useState<FoodItem[]>([]);
  const [thisWeekExpired, setThisWeekExpired] = useState<FoodItem[]>([]);
  const [thisWeekLogs, setThisWeekLogs] = useState<
    Array<
      UsageLog & {
        food_items?: { name?: string; location?: string; category?: string } | null;
      }
    >
  >([]);
  const [historyTotals, setHistoryTotals] = useState<{ used: number; wasted: number } | null>(null);
  const [homeMetaLoading, setHomeMetaLoading] = useState(true);
  const historyTotalsCacheRef = useRef<{
    value: { used: number; wasted: number };
    at: number;
  } | null>(null);
  const [pinnedIds, setPinnedIds] = useState<string[]>([]);
  const [pinModalVisible, setPinModalVisible] = useState(false);
  const [pinSearchQuery, setPinSearchQuery] = useState("");
  const [expandedPinnedId, setExpandedPinnedId] = useState<string | null>(null);
  const pinnedActionAnimRef = useRef<Record<string, Animated.Value>>({});
  const [expandedInventoryId, setExpandedInventoryId] = useState<string | null>(
    null
  );
  const inventoryActionAnimRef = useRef<Record<string, Animated.Value>>({});
  const [consumeModalItem, setConsumeModalItem] = useState<FoodItem | null>(null);
  const [throwAwayModalItem, setThrowAwayModalItem] = useState<FoodItem | null>(null);
  const [removeModalItem, setRemoveModalItem] = useState<FoodItem | null>(null);
  /** Spinner overlay on the row/card while consume / throw / delete / use-all hits the server */
  const [homeItemActionPendingId, setHomeItemActionPendingId] = useState<string | null>(
    null
  );

  const name = firstNameFromProfile(userProfile?.full_name, user?.email);
  const { width } = Dimensions.get("window");
  const pinnedStripInnerW = width - 36;
  const pinnedCardHalfW = Math.floor((pinnedStripInnerW - 8) / 2);

  const loadHistoryTotals = useCallback(async (options?: { force?: boolean }) => {
    if (!user?.id) return;
    try {
      const now = Date.now();
      const cache = historyTotalsCacheRef.current;
      if (!options?.force && cache && now - cache.at < 5 * 60_000) {
        setHistoryTotals(cache.value);
        return;
      }

      const [{ count: usedCount, error: usedErr }, { count: wastedCount, error: wastedErr }] =
        await Promise.all([
          supabase
            .from("usage_logs")
            .select("id", { count: "exact", head: true })
            .eq("user_id", user.id)
            .eq("status", "used"),
          supabase
            .from("usage_logs")
            .select("id", { count: "exact", head: true })
            .eq("user_id", user.id)
            .eq("status", "wasted"),
        ]);

      if (usedErr) throw usedErr;
      if (wastedErr) throw wastedErr;
      const next = { used: usedCount ?? 0, wasted: wastedCount ?? 0 };
      historyTotalsCacheRef.current = { value: next, at: now };
      setHistoryTotals(next);
    } catch (e) {
      console.warn("History totals load failed", e);
      setHistoryTotals((prev) => prev ?? { used: 0, wasted: 0 });
    }
  }, [user?.id]);

  const loadHomeMeta = useCallback(async (options?: { showLoading?: boolean; itemsSource?: FoodItem[] }) => {
    const showLoading = options?.showLoading ?? true;
    const itemsSource = options?.itemsSource;
    if (!user?.id) {
      if (showLoading) setHomeMetaLoading(false);
      return;
    }
    try {
      if (showLoading) setHomeMetaLoading(true);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      // "Recent" window: last 7 days up to end of today
      const recentStart = new Date(today);
      recentStart.setDate(recentStart.getDate() - 7);
      const recentEnd = new Date(today);
      recentEnd.setHours(23, 59, 59, 999);

      const [expiringResult, expiredResult] = await Promise.allSettled([
        foodItemsService.getExpiringItems(7),
        foodItemsService.getExpiredItems(),
      ]);

      if (expiringResult.status === "fulfilled") {
        setThisWeekExpiring(expiringResult.value as unknown as FoodItem[]);
      } else if (itemsSource && itemsSource.length > 0) {
        // Fallback to local derivation if backend call fails
        const localExpiring = itemsSource.filter((it) => {
          const d = getDaysUntilExpiry(it.expiry_date);
          return typeof d === "number" && d >= 0 && d <= 7;
        });
        setThisWeekExpiring(localExpiring);
      } else {
        setThisWeekExpiring([]);
      }

      if (expiredResult.status === "fulfilled") {
        setThisWeekExpired(expiredResult.value as unknown as FoodItem[]);
      } else if (itemsSource && itemsSource.length > 0) {
        // Fallback to local derivation if backend call fails
        const localExpired = itemsSource.filter((it) => isFoodItemExpired(it));
        setThisWeekExpired(localExpired);
      } else {
        setThisWeekExpired([]);
      }

      const logsResult = await supabase
        .from("usage_logs")
        .select(
          `
          *,
          food_items!usage_logs_item_id_fkey (
            name,
            location,
            category
          )
        `
        )
        .eq("user_id", user.id)
        .in("status", ["used", "wasted"])
        .gte("logged_at", recentStart.toISOString())
        .lte("logged_at", recentEnd.toISOString())
        .order("logged_at", { ascending: false });

      if (logsResult.error) throw logsResult.error;
      setThisWeekLogs((logsResult.data as any) ?? []);

      await loadHistoryTotals({ force: true });
    } catch (e) {
      // keep screen usable even if some meta calls fail
      console.warn("Home meta load failed", e);
      await loadHistoryTotals({ force: false });
      setHistoryTotals((prev) => prev ?? { used: 0, wasted: 0 });
    } finally {
      if (showLoading) setHomeMetaLoading(false);
    }
  }, [loadHistoryTotals, user?.id]);

  const loadItems = useCallback(async (options?: { showLoader?: boolean }) => {
    const showLoader = options?.showLoader ?? true;
    try {
      if (showLoader) setLoading(true);
      const data = await foodItemsService.getItems();
      setItems(data);
      lastLoadedAtRef.current = Date.now();
      if (showLoader && user?.id) {
        const pinned = await loadPinnedItemIds(user.id);
        setPinnedIds(pinned);
      }
      await loadHomeMeta({ showLoading: showLoader, itemsSource: data as FoodItem[] });
    } catch (error: any) {
      Alert.alert("Error", error?.message ?? "Failed to load items");
    } finally {
      if (showLoader) setLoading(false);
    }
  }, [loadHomeMeta, user?.id]);

  useFocusEffect(
    useCallback(() => {
      if (!user) {
        router.replace({ pathname: "/(auth)/welcome" });
        return;
      }
      // Always refresh on focus so Expired/Recent labels stay current.
      loadItems({ showLoader: !hasLoadedOnceRef.current });
      hasLoadedOnceRef.current = true;
      if (!userProfile) getUserProfile();
    }, [user, userProfile, getUserProfile, loadItems])
  );

  useEffect(() => {
    if (!user?.id || loading) return;
    setPinnedIds((prev) => {
      if (prev.length === 0) return prev;
      const valid = prev.filter((id) => items.some((it) => it.id === id));
      if (valid.length === prev.length) return prev;
      savePinnedItemIds(user.id, valid).catch(() => {});
      return valid;
    });
  }, [user?.id, items, loading]);

  const pinnedItemsOrdered = useMemo(() => {
    const list: FoodItem[] = [];
    for (const id of pinnedIds) {
      const it = items.find((x) => x.id === id);
      if (it) list.push(it);
    }
    return list;
  }, [pinnedIds, items]);

  const pinPickerCandidates = useMemo(() => {
    const q = pinSearchQuery.trim().toLowerCase();
    return items
      .filter((it) => !pinnedIds.includes(it.id))
      .filter((it) => {
        if (!q) return true;
        const name = it.name.toLowerCase();
        const cat = (it.category || "").toLowerCase();
        return name.includes(q) || cat.includes(q);
      })
      .sort(compareFoodItemsByExpirySoonestFirst);
  }, [items, pinnedIds, pinSearchQuery]);

  const openPinPicker = useCallback(() => {
    if (!user?.id) return;
    if (items.length === 0 && pinnedIds.length === 0) {
      Alert.alert("Nothing to pin", "Add items to your inventory first.");
      return;
    }
    setPinSearchQuery("");
    setPinModalVisible(true);
  }, [user?.id, pinnedIds, items]);

  const addPinnedItem = useCallback(
    async (itemId: string) => {
      if (!user?.id) return;
      if (pinnedIds.includes(itemId)) return;
      if (pinnedIds.length >= MAX_PINNED_ITEMS) return;
      const prev = pinnedIds;
      const next = [...prev, itemId];
      setPinnedIds(next);
      try {
        await savePinnedItemIds(user.id, next);
      } catch {
        setPinnedIds(prev);
        return;
      }
      // Keep modal open so user can pin a second item; close only at max.
      if (next.length >= MAX_PINNED_ITEMS) {
        setPinModalVisible(false);
        setPinSearchQuery("");
      }
    },
    [user?.id, pinnedIds]
  );

  const removePinnedItem = useCallback(
    async (itemId: string) => {
      if (!user?.id) return;
      const next = pinnedIds.filter((id) => id !== itemId);
      setPinnedIds(next);
      await savePinnedItemIds(user.id, next).catch(() => {});
    },
    [user?.id, pinnedIds]
  );

  const goToPinnedOnCalendar = useCallback((item: FoodItem) => {
    const nonce = `${Date.now()}-${Math.random()}`;
    const raw = item.expiry_date;
    const ymd =
      raw && raw.length >= 10
        ? raw.includes("T")
          ? raw.split("T")[0]!
          : raw.slice(0, 10)
        : null;
    const todayStr = new Date().toISOString().split("T")[0]!;

    if (ymd) {
      if (ymd < todayStr) {
        router.push(
          `/(tabs)/calendar?view=timeline&itemId=${encodeURIComponent(
            item.id
          )}&nonce=${encodeURIComponent(nonce)}&openExpired=true`
        );
      } else {
        router.push({
          pathname: "/(tabs)/calendar",
          params: {
            view: "calendar",
            date: ymd,
            itemId: item.id,
            nonce,
          },
        });
      }
      return;
    }

    router.push({
      pathname: "/item-details",
      params: { itemId: item.id },
    });
  }, []);

  const derived = useMemo(() => {
    const groupsByName = new Map<string, ItemGroup>();
    let fridgeCount = 0;
    let shelfCount = 0;

    for (const item of items) {
      if (item.location === "fridge") fridgeCount += 1;
      if (item.location === "shelf") shelfCount += 1;

      const days = getDaysUntilExpiry(item.expiry_date);
      const entry: ItemEntry = {
        id: item.id,
        quantity: item.quantity,
        expiryDate: item.expiry_date ?? undefined,
        daysUntilExpiry: days,
        location: item.location as "fridge" | "shelf",
      };

      const key = item.name;
      const existing = groupsByName.get(key);
      if (!existing) {
        groupsByName.set(key, {
          name: key,
          totalQuantity: item.quantity,
          soonestExpiry: item.expiry_date ?? undefined,
          soonestDays: days,
          entries: [entry],
        });
      } else {
        existing.totalQuantity += item.quantity;
        existing.entries.push(entry);

        const currSoonest = existing.soonestDays;
        if (
          days !== undefined &&
          (currSoonest === undefined || days < currSoonest)
        ) {
          existing.soonestDays = days;
          existing.soonestExpiry = item.expiry_date ?? undefined;
        }
      }
    }

    const groups = Array.from(groupsByName.values()).map((g) => {
      g.entries.sort(
        (a, b) => (a.daysUntilExpiry ?? 999) - (b.daysUntilExpiry ?? 999)
      );
      return g;
    });

    groups.sort((a, b) => {
      const ad = a.soonestDays ?? 999;
      const bd = b.soonestDays ?? 999;
      if (ad !== bd) return ad - bd;
      return a.name.localeCompare(b.name);
    });

    const expiringSoon = items.filter((i) => {
      const d = getDaysUntilExpiry(i.expiry_date);
      return d !== undefined && d <= 3;
    }).length;

    const lowStockGroups = groups.filter((g) => g.totalQuantity <= 2).length;

    return {
      groups,
      fridgeCount,
      shelfCount,
    };
  }, [items]);

  const filteredItems = useMemo(() => {
    const q = searchText.trim().toLowerCase();
    if (!q) return [];
    const showAll = q === "all";
    const filtered = items
      .filter((it) => (locationFilter === "all" ? true : it.location === locationFilter))
      .filter((it) => {
        if (showAll) return true;
        const nameMatch = (it.name ?? "").toLowerCase().includes(q);
        const categoryMatch = (it.category ?? "").toLowerCase().includes(q);
        const rawExpiry = (it.expiry_date ?? "").toLowerCase();
        const expiryDateObj = parseExpiryDate(it.expiry_date);
        const expirySearchText = expiryDateObj
          ? [
              expiryDateObj.toLocaleDateString(undefined, {
                day: "numeric",
                month: "short",
                year: "numeric",
              }),
              expiryDateObj.toLocaleDateString(undefined, {
                day: "numeric",
                month: "long",
                year: "numeric",
              }),
              expiryDateObj.toLocaleDateString(undefined, {
                month: "short",
                year: "numeric",
              }),
              expiryDateObj.toLocaleDateString(undefined, {
                month: "long",
                year: "numeric",
              }),
              String(expiryDateObj.getFullYear()),
              formatExpiry(it.expiry_date),
            ]
              .join(" ")
              .toLowerCase()
          : "";
        const expiryMatch = rawExpiry.includes(q) || expirySearchText.includes(q);
        return nameMatch || categoryMatch || expiryMatch;
      });
    return filtered.sort(
      showAll
        ? (a, b) => {
            const aExpired = isFoodItemExpired(a);
            const bExpired = isFoodItemExpired(b);
            if (aExpired !== bExpired) return aExpired ? -1 : 1;
            return compareFoodItemsByExpirySoonestFirst(a, b);
          }
        : (a, b) => a.name.localeCompare(b.name)
    );
  }, [items, locationFilter, searchText]);

  const showHomeSkeleton =
    loading || homeMetaLoading || historyTotals === null;

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadItems({ showLoader: false });
    setRefreshing(false);
  };

  const handleEntryDecrement = async (itemId: string) => {
    try {
      const item = items.find((i) => i.id === itemId);
      if (!item || item.quantity <= 1) return;
      await foodItemsService.updateItem(itemId, { quantity: item.quantity - 1 });
      setItems((prev) =>
        prev.map((i) => (i.id === itemId ? { ...i, quantity: i.quantity - 1 } : i))
      );
    } catch (error: any) {
      Alert.alert("Error", error?.message ?? "Failed to update item");
    }
  };

  const handleEntryIncrement = async (itemId: string) => {
    try {
      const item = items.find((i) => i.id === itemId);
      if (!item) return;
      await foodItemsService.updateItem(itemId, { quantity: item.quantity + 1 });
      setItems((prev) =>
        prev.map((i) => (i.id === itemId ? { ...i, quantity: i.quantity + 1 } : i))
      );
    } catch (error: any) {
      Alert.alert("Error", error?.message ?? "Failed to update item");
    }
  };

  const handleEntryUseAll = async (itemId: string) => {
    const id = String(itemId);
    try {
      const item = items.find((i) => i.id === itemId);
      if (!item) return;
      setHomeItemActionPendingId(id);
      await foodItemsService.logUsage(itemId, "used", item.quantity);
      runSmoothLayout();
      setItems((prev) => prev.filter((i) => i.id !== itemId));
      setExpandedInventoryId((prev) => (prev === id ? null : prev));
      setExpandedPinnedId((prev) => (prev === id ? null : prev));
      await removePinnedItem(itemId);
      await loadHomeMeta({ showLoading: false });
    } catch (error: any) {
      await loadItems({ showLoader: false });
      Alert.alert("Error", error?.message ?? "Failed to mark used");
    } finally {
      setHomeItemActionPendingId(null);
    }
  };

  const toggleInventoryItemExpanded = useCallback((rawId: string) => {
    const itemId = String(rawId);
    setExpandedInventoryId((prev) => (prev === itemId ? null : itemId));
  }, []);

  const openInventoryEdit = useCallback((item: FoodItem) => {
    setExpandedInventoryId(null);
    router.push({
      pathname: "/(tabs)/add",
      params: {
        edit: "true",
        nonce: `${Date.now()}-${Math.random()}`,
        id: item.id,
        name: item.name,
        quantity: String(item.quantity),
        unit: item.unit || "pcs",
        location: item.location as "fridge" | "shelf",
        category: item.category || "",
        expiryDate: item.expiry_date || "",
        notes: item.notes || "",
      },
    });
  }, []);

  const confirmDeleteInventoryItem = useCallback((item: FoodItem) => {
    setRemoveModalItem(item);
  }, []);

  const executeThrowAwayForItem = useCallback(
    (currentItem: FoodItem, quantity: number) => {
      const id = String(currentItem.id);
      const pinnedIdsSnapshot = [...pinnedIds];
      const fullWaste = quantity >= currentItem.quantity;
      const nextPinned = fullWaste
        ? pinnedIdsSnapshot.filter((pid) => String(pid) !== id)
        : pinnedIdsSnapshot;

      setExpandedInventoryId((prev) => (prev === id ? null : prev));
      setHomeItemActionPendingId(id);

      void (async () => {
        try {
          await foodItemsService.logUsage(currentItem.id, "wasted", quantity);
          runSmoothLayout();
          if (fullWaste) {
            setItems((prev) => prev.filter((i) => String(i.id) !== id));
            setExpandedPinnedId((prev) => (prev === id ? null : prev));
            setPinnedIds(nextPinned);
            if (user?.id) {
              await savePinnedItemIds(user.id, nextPinned);
            }
          } else {
            setItems((prev) =>
              prev.map((i) =>
                String(i.id) === id
                  ? { ...i, quantity: Math.max(0, i.quantity - quantity) }
                  : i
              )
            );
          }
          await loadHomeMeta({ showLoading: false });
        } catch (error: any) {
          await loadItems({ showLoader: false });
          Alert.alert(
            "Error",
            error?.message ?? "Failed to throw away item. Please try again."
          );
        } finally {
          setHomeItemActionPendingId(null);
        }
      })();
    },
    [pinnedIds, user?.id, loadHomeMeta, loadItems]
  );

  const openThrowAwayQuantityModal = useCallback(() => {
    if (!removeModalItem) return;
    const item = removeModalItem;
    setRemoveModalItem(null);
    const maxQty =
      typeof item.quantity === "number" && item.quantity > 0 ? item.quantity : 1;
    if (maxQty <= 1) {
      executeThrowAwayForItem(item, 1);
      return;
    }
    setThrowAwayModalItem(item);
  }, [removeModalItem, executeThrowAwayForItem]);

  const handleThrowAwayConfirm = useCallback(
    (quantity: number) => {
      if (!throwAwayModalItem) return;
      const item = throwAwayModalItem;
      setThrowAwayModalItem(null);
      executeThrowAwayForItem(item, quantity);
    },
    [throwAwayModalItem, executeThrowAwayForItem]
  );

  const handleDeleteItem = useCallback(() => {
    if (!removeModalItem) return;
    const item = removeModalItem;
    const id = String(item.id);
    const pinnedIdsSnapshot = [...pinnedIds];
    const nextPinned = pinnedIdsSnapshot.filter((pid) => String(pid) !== id);

    setRemoveModalItem(null);
    setExpandedInventoryId((prev) => (prev === id ? null : prev));
    setExpandedPinnedId((prev) => (prev === id ? null : prev));
    setHomeItemActionPendingId(id);

    void (async () => {
      try {
        await foodItemsService.deleteItem(item.id);
        runSmoothLayout();
        setItems((prev) => prev.filter((i) => i.id !== item.id));
        setPinnedIds(nextPinned);
        if (user?.id) {
          await savePinnedItemIds(user.id, nextPinned);
        }
        await loadHomeMeta({ showLoading: false });
      } catch (error: any) {
        setPinnedIds(pinnedIdsSnapshot);
        await loadItems({ showLoader: false });
        Alert.alert(
          "Error",
          error?.message ?? "Failed to delete item. Please try again."
        );
      } finally {
        setHomeItemActionPendingId(null);
      }
    })();
  }, [removeModalItem, pinnedIds, user?.id, loadHomeMeta, loadItems]);

  const executeConsumeForItem = useCallback(
    (currentItem: FoodItem, quantity: number) => {
      const id = String(currentItem.id);
      const pinnedIdsSnapshot = [...pinnedIds];
      const fullConsume = quantity >= currentItem.quantity;
      const nextPinned = fullConsume
        ? pinnedIdsSnapshot.filter((pid) => String(pid) !== id)
        : pinnedIdsSnapshot;

      setExpandedInventoryId((prev) => (prev === id ? null : prev));
      setHomeItemActionPendingId(id);

      void (async () => {
        try {
          await foodItemsService.markItemUsed(currentItem.id, quantity);
          runSmoothLayout();
          if (fullConsume) {
            setItems((prev) => prev.filter((i) => String(i.id) !== id));
            setExpandedPinnedId((prev) => (prev === id ? null : prev));
            setPinnedIds(nextPinned);
            if (user?.id) {
              await savePinnedItemIds(user.id, nextPinned);
            }
          } else {
            setItems((prev) =>
              prev.map((i) =>
                String(i.id) === id
                  ? { ...i, quantity: Math.max(0, i.quantity - quantity) }
                  : i
              )
            );
          }
          await loadHomeMeta({ showLoading: false });
        } catch (error: any) {
          await loadItems({ showLoader: false });
          Alert.alert(
            "Error",
            error?.message ?? "Failed to log consumption. Please try again."
          );
        } finally {
          setHomeItemActionPendingId(null);
        }
      })();
    },
    [pinnedIds, user?.id, loadHomeMeta, loadItems]
  );

  const requestConsumeModal = useCallback(
    (it: FoodItem) => {
      const maxQty =
        typeof it.quantity === "number" && it.quantity > 0 ? it.quantity : 1;
      if (maxQty <= 1) {
        executeConsumeForItem(it, 1);
        return;
      }
      setConsumeModalItem(it);
    },
    [executeConsumeForItem]
  );

  const handleInventoryConsumeConfirm = useCallback(
    (quantity: number) => {
      if (!consumeModalItem) return;
      const item = consumeModalItem;
      setConsumeModalItem(null);
      executeConsumeForItem(item, quantity);
    },
    [consumeModalItem, executeConsumeForItem]
  );

  useEffect(() => {
    const dur = 220;
    const easing = Easing.bezier(0.25, 0.1, 0.25, 1);
    const expandAllPinnedRows =
      pinnedItemsOrdered.length === 2 && expandedPinnedId !== null;
    pinnedItemsOrdered.forEach((item) => {
      const id = String(item.id);
      const isExpanded = expandAllPinnedRows || expandedPinnedId === id;
      if (!pinnedActionAnimRef.current[id]) {
        pinnedActionAnimRef.current[id] = new Animated.Value(
          isExpanded ? 1 : 0
        );
      } else {
        Animated.timing(pinnedActionAnimRef.current[id], {
          toValue: isExpanded ? 1 : 0,
          duration: dur,
          easing,
          useNativeDriver: false,
        }).start();
      }
    });
  }, [expandedPinnedId, pinnedItemsOrdered]);
  useEffect(() => {
    const dur = 220;
    const easing = Easing.bezier(0.25, 0.1, 0.25, 1);
    filteredItems.forEach((item) => {
      const id = String(item.id);
      const isExpanded = expandedInventoryId === id;
      if (!inventoryActionAnimRef.current[id]) {
        inventoryActionAnimRef.current[id] = new Animated.Value(isExpanded ? 1 : 0);
      } else {
        Animated.timing(inventoryActionAnimRef.current[id], {
          toValue: isExpanded ? 1 : 0,
          duration: dur,
          easing,
          useNativeDriver: false,
        }).start();
      }
    });
  }, [expandedInventoryId, filteredItems]);

  useEffect(() => {
    const isFabric = Boolean((globalThis as any)?.nativeFabricUIManager);
    if (
      Platform.OS === "android" &&
      !isFabric &&
      UIManager.setLayoutAnimationEnabledExperimental
    ) {
      UIManager.setLayoutAnimationEnabledExperimental(true);
    }
  }, []);

  const upcomingCards = useMemo<ThisWeekCard[]>(() => {
    return thisWeekExpiring.map((it) => ({
      kind: "expiring" as const,
      id: it.id,
      title: it.name,
      quantity: it.quantity,
      unit: it.unit,
      location: it.location as "fridge" | "shelf" | undefined,
      category: it.category,
      expiryDate: it.expiry_date ?? undefined,
      statusText: formatExpiry(it.expiry_date),
    }));
  }, [thisWeekExpiring]);

  const expiredCards = useMemo<ThisWeekCard[]>(() => {
    return thisWeekExpired.map((it) => ({
        kind: "expired" as const,
        id: it.id,
        title: it.name,
        quantity: it.quantity,
        unit: it.unit,
        location: it.location as "fridge" | "shelf" | undefined,
        category: it.category,
        expiryDate: it.expiry_date ?? undefined,
        statusText: "Expired",
      }));
  }, [thisWeekExpired]);

  const recentCards = useMemo<ThisWeekCard[]>(() => {
    const itemsById = new Map(items.map((it) => [it.id, it]));
    return thisWeekLogs.map((log) => {
      const daysAgo = getDaysAgo(log.logged_at);
      const agoText =
        typeof daysAgo === "number"
          ? daysAgo === 0
            ? "today"
            : daysAgo === 1
              ? "yesterday"
            : `${daysAgo}d ago`
          : "recently";
      const fallbackItem = itemsById.get(log.item_id);
      const logAny = log as any;
      const title =
        log.food_items?.name ||
        logAny.item_name ||
        logAny.name ||
        fallbackItem?.name ||
        "Item";
      const loc =
        (log.food_items?.location as "fridge" | "shelf" | undefined) ||
        (logAny.item_location as "fridge" | "shelf" | undefined) ||
        (logAny.location as "fridge" | "shelf" | undefined) ||
        (fallbackItem?.location as "fridge" | "shelf" | undefined);
      const category =
        log.food_items?.category ||
        fallbackItem?.category ||
        undefined;
      const base = {
        id: log.id,
        title,
        quantity:
          log.quantity && log.quantity > 0
            ? log.quantity
            : (fallbackItem?.quantity ?? 1),
        unit: fallbackItem?.unit ?? undefined,
        location: loc,
        category,
      };
      if (log.status === "used") {
        return { ...base, kind: "used" as const, statusText: `Used ${agoText}` };
      }
      return { ...base, kind: "wasted" as const, statusText: `Thrown ${agoText}` };
    });
  }, [thisWeekLogs, items]);
  const activeThisWeekCards =
    thisWeekTab === "upcoming"
      ? upcomingCards
      : thisWeekTab === "expired"
      ? expiredCards
      : recentCards;

  return (
    <ScreenLayout
      topInsetColor="#3CBA8D"
      topInsetContent={
        <LinearGradient
          colors={["#3CBA8D", "#C8FACC"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={{ flex: 1 }}
        />
      }
      backgroundColor="#FFFFFF"
    >
      <ScrollView
        ref={homeScrollRef}
        contentContainerStyle={[
          styles.content,
          {
            paddingBottom:
              keyboardInset > 0
                ? keyboardInset + 80
                : 28 + insets.bottom + 78,
          },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        removeClippedSubviews={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={UI.greenInk}
          />
        }
      >
        {/* 1) TOP GREETING BANNER – same gradient family, single dip + rise */}
        <View style={styles.topBanner}>
          <LinearGradient
            colors={["#3CBA8D", "#C8FACC"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }} // darker on the left, lighter on the right
            style={styles.topBannerGradient}
          >
            {/* White wave at bottom */}
            <View style={styles.topBannerWave}>
              <Svg width={width} height={90} viewBox={`0 0 ${width} 90`}>
                <Path
                  d={`M0,65 
                     Q${width * 0.30},95 ${width * 0.55},80 
                     Q${width * 0.75},70 ${width * 0.9},78 
                     Q${width * 1.02},86 ${width},82 
                     L${width},90 L0,90 Z`}
                  fill="#FFFFFF"
                />
              </Svg>
            </View>

            {/* Ensure no green strip below wave */}
            <View style={styles.topBannerBottomFill} />

            <View style={styles.greetingBlock}>
              <Text style={styles.greetingHeadline} numberOfLines={1}>
                {getGreeting()}
              </Text>
              <Text style={styles.greetingName} numberOfLines={1}>
                {name ?? ""}
              </Text>
            </View>
          </LinearGradient>
        </View>

        {/* 2) THIS WEEK — toggle + cards */}
        <View style={styles.twToggleWrap}>
          <View style={styles.twToggleOuter}>
            {/* Animated sliding pill background */}
            <Animated.View
              style={[
                styles.twSlidingPill,
                {
                  transform: [{
                    translateX: twSlideAnim.interpolate({
                      inputRange: [0, 1, 2],
                      outputRange: [0, 96, 192],
                    }),
                  }],
                },
                thisWeekTab === "expired"
                  ? styles.twSlidingPillExpired
                  : thisWeekTab === "recent"
                  ? styles.twSlidingPillRecent
                  : styles.twSlidingPillDefault,
              ]}
            />
            {(["upcoming", "recent", "expired"] as const).map((tab) => {
              const isActive = thisWeekTab === tab;
              const iconColor =
                tab === "expired"
                  ? isActive
                    ? "#fff"
                    : "#b91c1c"
                  : tab === "recent"
                  ? isActive
                    ? "#fff"
                    : "#475569"
                  : isActive
                  ? "#fff"
                  : "#166534";
              const labelColor =
                tab === "expired" && !isActive
                  ? "#b91c1c"
                  : tab === "recent" && !isActive
                  ? "#475569"
                  : undefined;
              return (
                <Pressable
                  key={tab}
                  style={styles.twToggleTab}
                  onPress={() => setThisWeekTab(tab)}
                  accessibilityRole="tab"
                  accessibilityState={{ selected: isActive }}
                >
                  {tab === "upcoming" ? (
                    <Hourglass size={14} color={iconColor} weight="fill" style={{ marginRight: 5 }} />
                  ) : tab === "expired" ? (
                    <WarningCircle size={14} color={iconColor} weight="fill" style={{ marginRight: 5 }} />
                  ) : (
                    <ClockCounterClockwise size={14} color={iconColor} weight="fill" style={{ marginRight: 5 }} />
                  )}
                  <Text
                    style={[
                      styles.twToggleTabText,
                      isActive && styles.twToggleTabTextActive,
                      labelColor ? { color: labelColor } : null,
                    ]}
                  >
                    {tab === "upcoming" ? "Upcoming" : tab === "expired" ? "Expired" : "Recent"}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <ScrollView
          ref={twStripRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.twStrip}
          style={styles.twStripOuter}
        >
            {showHomeSkeleton ? (
              <View style={[styles.twLoadingCard, { minWidth: width - 32 }]}>
                <View style={styles.twLoadingLineLg} />
                <View style={styles.twLoadingLineSm} />
              </View>
            ) : activeThisWeekCards.length === 0 ? (
              <View style={[styles.twEmptyCard, { minWidth: width - 32 }]}>
                <Text style={styles.twEmpty}>
                  {thisWeekTab === "upcoming"
                    ? "Nothing expiring soon"
                    : thisWeekTab === "expired"
                      ? "No expired items"
                      : "No recent activity"}
                </Text>
              </View>
            ) : (
              activeThisWeekCards.map((c) => {
                const displayName = (c.title || "").trim() || "Item";
                const qtyStr = formatQuantityWithUnit(c.quantity, c.unit, {
                  fallbackUnit: "pcs",
                });
                const locImg =
                  c.location === "shelf"
                    ? require("@/assets/images/icons/shelf_icon.png")
                    : require("@/assets/images/icons/fridge_icon.png");
                const accent =
                  c.kind === "wasted"
                    ? { fg: UI.red, bg: UI.redBg, border: UI.redBorder }
                    : c.kind === "used"
                      ? { fg: UI.ok, bg: UI.okBg, border: UI.okBorder }
                      : c.kind === "expired"
                        ? { fg: UI.red, bg: UI.redBg, border: UI.redBorder }
                        : { fg: UI.ok, bg: UI.okBg, border: UI.okBorder };
                const chipText = c.kind === "wasted" ? "Wasted" : c.kind === "used" ? "Used" : undefined;
                const daysLeft = c.kind === "expiring" ? getDaysUntilExpiry(c.expiryDate) : undefined;
                const expiredDaysAgo =
                  c.kind === "expired" ? getDaysAgo(c.expiryDate) : undefined;
                const CategoryIcon = getCategoryIcon(c.category, c.title);
                const dueLabel =
                  typeof daysLeft !== "number"
                    ? "—"
                    : daysLeft <= 0
                      ? "Today"
                      : daysLeft === 1
                        ? "1 day"
                        : `${daysLeft} days`;

                return (
                  <Pressable
                    key={`${c.kind}-${c.id}`}
                    style={styles.twCard}
                    onPress={() =>
                      c.kind === "expiring"
                        ? router.push({
                            pathname: "/(tabs)/calendar",
                            params: {
                              view: "calendar",
                              date: c.expiryDate,
                              itemId: c.id,
                              nonce: `${Date.now()}-${Math.random()}`,
                            },
                          })
                        : c.kind === "expired"
                        ? router.push(
                            `/(tabs)/calendar?view=timeline&itemId=${encodeURIComponent(
                              c.id
                            )}&nonce=${encodeURIComponent(
                              `${Date.now()}-${Math.random()}`
                            )}&openExpired=${
                              c.kind === "expired" ? "true" : "false"
                            }`
                          )
                        : c.kind === "used" || c.kind === "wasted"
                          ? router.push({
                              pathname: "/(tabs)/history",
                              params: {
                                filter: c.kind,
                                focusLogId: c.id,
                              },
                            })
                          : router.push("/(tabs)/this-week")
                    }
                    accessibilityRole="button"
                    accessibilityLabel={`${c.title}. ${c.statusText}`}
                  >
                    <View style={styles.twMainRow}>
                      <View style={styles.twIconWrap}>
                        <CategoryIcon size={18} color={accent.fg} weight="fill" />
                      </View>
                      <View style={styles.twBody}>
                        <Text style={styles.twName} numberOfLines={1}>
                          {displayName}
                        </Text>
                        <View style={styles.twMetaRow}>
                          <Image source={locImg} style={styles.twMetaLocIcon} />
                          <Text style={styles.twMeta} numberOfLines={1}>
                            {qtyStr}
                          </Text>
                        </View>
                      </View>
                    </View>
                    <View
                      style={[
                        styles.twStatusBar,
                        { backgroundColor: accent.bg },
                      ]}
                    >
                      <Text
                        style={[
                          styles.twStatusBarText,
                          { color: accent.fg },
                        ]}
                        numberOfLines={1}
                      >
                        {c.kind === "expiring"
                          ? dueLabel
                          : c.kind === "expired"
                          ? `Expired ${
                              typeof expiredDaysAgo === "number"
                                ? expiredDaysAgo === 0
                                  ? "today"
                                  : expiredDaysAgo === 1
                                    ? "yesterday"
                                    : `${expiredDaysAgo} days ago`
                                : "recently"
                            }`
                          : c.statusText || chipText}
                      </Text>
                    </View>
                  </Pressable>
                );
              })
            )}
        </ScrollView>

        <View style={styles.sectionGap} />

        {/* Item history — one row; detail screen has Consumed / Thrown Away toggle */}
        <Pressable
          style={styles.itemHistoryCard}
          onPress={() => router.push("/(tabs)/history")}
          accessibilityRole="button"
          accessibilityLabel="Item history"
        >
          <View style={styles.itemHistoryTextCol}>
            <Text style={styles.itemHistoryTitle}>Item History</Text>
            {showHomeSkeleton ? (
              <View style={styles.itemHistorySubtitleSkeleton} />
            ) : (
              <Text style={styles.itemHistorySubtitle} numberOfLines={1}>
                {`${historyTotals!.used} Consumed · ${historyTotals!.wasted} Thrown away`}
              </Text>
            )}
          </View>
          <CaretRight size={18} color="#15803D" weight="bold" />
        </Pressable>

        <View style={styles.sectionGap} />

        {/* Pinned items (max 2) */}
        <View style={styles.pinnedHeaderRow}>
          <View style={styles.pinnedTitleCluster}>
            <Text style={styles.pinnedSectionTitle}>Pinned</Text>
            <Pressable
              onPress={openPinPicker}
              style={styles.pinnedPinButton}
              hitSlop={10}
              accessibilityRole="button"
              accessibilityLabel={
                pinnedIds.length >= MAX_PINNED_ITEMS
                  ? "Manage pinned items"
                  : "Pin an item"
              }
            >
              <PushPin
                size={20}
                color="#15803D"
                weight={pinnedIds.length > 0 ? "fill" : "regular"}
              />
            </Pressable>
          </View>
        </View>
        {showHomeSkeleton ? (
          <View style={[styles.pinnedLoadingWrap, styles.pinnedLoadingWrapTwoCol]}>
            <View style={[styles.pinnedLoadingBar, styles.pinnedLoadingBarHalf]} />
            <View style={[styles.pinnedLoadingBar, styles.pinnedLoadingBarHalf]} />
          </View>
        ) : pinnedItemsOrdered.length === 0 ? (
          <View style={styles.pinnedEmptyWrap}>
            <Text style={styles.pinnedEmptySubtitle}>
              Pin up to 2 items for quick access.
            </Text>
          </View>
        ) : (
          <View
            style={[
              styles.pinnedList,
              pinnedItemsOrdered.length === 2 && styles.pinnedListTwoCol,
            ]}
          >
            {pinnedItemsOrdered.map((it) => {
              const pinnedRowId = String(it.id);
              const isTwoCol = pinnedItemsOrdered.length === 2;
              const cardWidth = isTwoCol ? pinnedCardHalfW : pinnedStripInnerW;
              const CategoryIcon = getCategoryIcon(it.category, it.name);
              const locImg =
                it.location === "shelf" ? shelfIconAsset : fridgeIconAsset;
              const qtyStr = formatQuantityWithUnit(it.quantity, it.unit, {
                fallbackUnit: "pcs",
              });
              const expLine = formatPinExpiryLine(it);
              const catColor = expLine.expired ? "#DC2626" : "#15803D";
              const rowExpanded =
                (isTwoCol && expandedPinnedId !== null) ||
                expandedPinnedId === pinnedRowId;
              const animVal =
                pinnedActionAnimRef.current[pinnedRowId] ??
                (pinnedActionAnimRef.current[pinnedRowId] = new Animated.Value(
                  rowExpanded ? 1 : 0
                ));
              return (
                <View
                  key={it.id}
                  style={[
                    styles.pinnedRow,
                    { width: cardWidth },
                    isTwoCol && styles.pinnedRowHalf,
                  ]}
                >
                  <Pressable
                    style={[
                      styles.pinnedRowTop,
                      isTwoCol && styles.pinnedRowTopCompact,
                    ]}
                    onPress={() =>
                      setExpandedPinnedId((prev) =>
                        prev === pinnedRowId ? null : pinnedRowId
                      )
                    }
                    accessibilityRole="button"
                    accessibilityLabel={`Toggle actions for ${it.name}`}
                    accessibilityState={{ expanded: rowExpanded }}
                  >
                    <View
                      style={[
                        styles.pinnedRowIcon,
                        isTwoCol && styles.pinnedRowIconSmall,
                        expLine.expired && styles.pinnedRowIconExpired,
                      ]}
                    >
                      <CategoryIcon
                        size={isTwoCol ? 18 : 20}
                        color={catColor}
                        weight="fill"
                      />
                    </View>
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <Text
                        style={[
                          styles.pinnedRowName,
                          isTwoCol && styles.pinnedRowNameCompact,
                        ]}
                        numberOfLines={1}
                        ellipsizeMode="tail"
                      >
                        {it.name}
                      </Text>
                      <View style={styles.pinnedRowMetaRow}>
                        <Image
                          source={locImg}
                          style={styles.pinnedRowLocIcon}
                          resizeMode="contain"
                        />
                        <Text
                          style={[
                            styles.pinnedRowMeta,
                            isTwoCol && styles.pinnedRowMetaCompact,
                          ]}
                          numberOfLines={1}
                        >
                          {qtyStr}
                        </Text>
                      </View>
                      <Text
                        style={[
                          styles.pinnedRowExpiry,
                          isTwoCol && styles.pinnedRowExpiryCompact,
                          expLine.expired && styles.pinnedRowExpiryExpired,
                        ]}
                        numberOfLines={1}
                      >
                        {expLine.text}
                      </Text>
                    </View>
                  </Pressable>
                  <Animated.View
                    style={[
                      styles.pinnedRowActionsWrap,
                      {
                        height: animVal.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0, PINNED_ACTION_ROW_H],
                        }),
                        opacity: animVal.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0, 1],
                        }),
                        transform: [
                          {
                            translateY: animVal.interpolate({
                              inputRange: [0, 1],
                              outputRange: [6, 0],
                            }),
                          },
                        ],
                      },
                    ]}
                  >
                    <View style={styles.pinnedRowActions}>
                      <TouchableOpacity
                        style={styles.pinnedActionBtn}
                        onPress={() => {
                          setExpandedPinnedId((prev) =>
                            prev === pinnedRowId ? null : prev
                          );
                          openInventoryEdit(it);
                        }}
                        activeOpacity={0.7}
                        accessibilityRole="button"
                        accessibilityLabel={`Edit ${it.name}`}
                      >
                        <Ionicons name="create-outline" size={14} color="#6B7280" />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.pinnedConsumeBtn}
                        onPress={() => {
                          setExpandedPinnedId((prev) =>
                            prev === pinnedRowId ? null : prev
                          );
                          requestConsumeModal(it);
                        }}
                        activeOpacity={0.7}
                        accessibilityRole="button"
                        accessibilityLabel={`Consume ${it.name}`}
                      >
                        <Text style={styles.pinnedConsumeBtnText}>Consume</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.pinnedActionBtn}
                        onPress={() => {
                          setExpandedPinnedId((prev) =>
                            prev === pinnedRowId ? null : prev
                          );
                          confirmDeleteInventoryItem(it);
                        }}
                        activeOpacity={0.7}
                        accessibilityRole="button"
                        accessibilityLabel={`Delete ${it.name}`}
                      >
                        <Ionicons name="trash-outline" size={14} color="#EF4444" />
                      </TouchableOpacity>
                    </View>
                  </Animated.View>
                  <ItemCardPendingOverlay visible={homeItemActionPendingId === pinnedRowId} />
                </View>
              );
            })}
          </View>
        )}

        {pinnedItemsOrdered.length === 0 ? (
          <Divider />
        ) : (
          <View style={styles.sectionGap} />
        )}

        <View
          onLayout={(e) => {
            inventorySectionYRef.current = e.nativeEvent.layout.y;
          }}
        >
          <Text style={styles.inventorySectionTitle}>Inventory</Text>
        </View>

        <View style={styles.inventoryControlsCard}>
          <View style={styles.inventoryToggleWrap}>
            <View
              style={styles.inventoryToggleOuter}
              onLayout={(e) => setInventoryToggleWidth(e.nativeEvent.layout.width)}
            >
              <Animated.View
                style={[
                  styles.inventoryToggleSlidingPill,
                  {
                    width:
                      inventoryToggleWidth > 0
                        ? (inventoryToggleWidth - 12) / 2
                        : undefined,
                    opacity: inventoryToggleWidth > 0 ? 1 : 0,
                    transform: [
                      {
                        translateX: inventoryToggleAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange:
                            inventoryToggleWidth > 0
                              ? [0, (inventoryToggleWidth - 12) / 2 + 4]
                              : [0, 0],
                        }),
                      },
                    ],
                  },
                ]}
              />
              <Pressable
                style={[
                  styles.inventoryToggleTab,
                  locationFilter === "fridge" && styles.inventoryToggleTabActive,
                ]}
                onPress={() => setLocationFilter("fridge")}
                accessibilityRole="button"
                accessibilityState={{ selected: locationFilter === "fridge" }}
              >
                <View style={styles.inventoryToggleContent}>
                  <View style={styles.inventoryToggleLabelRow}>
                    <Image
                      source={fridgeIconAsset}
                      style={[
                        styles.inventoryToggleIcon,
                        locationFilter === "fridge"
                          ? styles.inventoryToggleIconActive
                          : styles.inventoryToggleIconInactive,
                      ]}
                      resizeMode="contain"
                    />
                    <Text
                      style={[
                        styles.inventoryToggleText,
                        locationFilter === "fridge" && styles.inventoryToggleTextActive,
                      ]}
                    >
                      Fridge
                    </Text>
                  </View>
                </View>
              </Pressable>
              <Pressable
                style={[
                  styles.inventoryToggleTab,
                  locationFilter === "shelf" && styles.inventoryToggleTabActive,
                ]}
                onPress={() => setLocationFilter("shelf")}
                accessibilityRole="button"
                accessibilityState={{ selected: locationFilter === "shelf" }}
              >
                <View style={styles.inventoryToggleContent}>
                  <View style={styles.inventoryToggleLabelRow}>
                    <Image
                      source={shelfIconAsset}
                      style={[
                        styles.inventoryToggleIcon,
                        locationFilter === "shelf"
                          ? styles.inventoryToggleIconActive
                          : styles.inventoryToggleIconInactive,
                      ]}
                      resizeMode="contain"
                    />
                    <Text
                      style={[
                        styles.inventoryToggleText,
                        locationFilter === "shelf" && styles.inventoryToggleTextActive,
                      ]}
                    >
                      Shelf
                    </Text>
                  </View>
                </View>
              </Pressable>
            </View>
          </View>

          <View style={styles.searchBar}>
            <MagnifyingGlass size={18} color="#94A3B8" />
            <TextInput
              value={searchText}
              onChangeText={setSearchText}
              placeholder="Search by name, date, or category."
              placeholderTextColor="#94A3B8"
              style={styles.searchInput}
              returnKeyType="search"
              onFocus={scrollInventoryIntoView}
            />
          </View>
        </View>

        <View
          style={styles.inventoryList}
          onLayout={(e) => {
            inventoryListYRef.current = e.nativeEvent.layout.y;
          }}
        >
          {searchText.trim().toLowerCase() === "all" && filteredItems.length > 40 ? (
            <Text style={styles.searchHintText}>
              Large list loaded. Try a specific keyword (for example, milk, dairy, or february).
            </Text>
          ) : null}
          {loading && searchText.trim().length > 0 ? (
            <>
              <View style={styles.skeleton} />
              <View style={styles.skeleton} />
              <View style={styles.skeleton} />
            </>
          ) : filteredItems.length === 0 ? (
            searchText.trim().length > 0 ? (
              <View style={styles.searchEmptyWrap}>
                <Text style={styles.searchEmptyTitle}>No matches</Text>
                <Text style={styles.searchEmptySubtitle}>
                  Try another name, date, or category.
                </Text>
              </View>
            ) : (
              <View style={styles.searchEmptyWrap}>
                <Text style={styles.searchEmptyTitle}>Search inventory</Text>
                <Text style={styles.searchEmptySubtitle}>
                  Enter a keyword, or type "all" to view every item.
                </Text>
              </View>
            )
          ) : (
            filteredItems.map((it) => {
              const rowId = String(it.id);
              const expiryText = formatExpiry(it.expiry_date);
              const expired = isFoodItemExpired(it);
              const expiryDateObj = parseExpiryDate(it.expiry_date);
              const expiryDateLabel = expiryDateObj
                ? expiryDateObj.toLocaleDateString(undefined, {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })
                : "";
              const daysUntilExpiry = getDaysUntilExpiry(it.expiry_date);
              const expiredDaysAgo = expired ? getDaysAgo(it.expiry_date) : undefined;
              const expiryRelative = formatExpiry(it.expiry_date);
              const expiryStatusText = expired
                ? `Expired ${
                    typeof expiredDaysAgo === "number"
                      ? expiredDaysAgo === 0
                        ? "today"
                        : expiredDaysAgo === 1
                        ? "yesterday"
                        : `${expiredDaysAgo} days ago`
                      : "recently"
                  }`
                : expiryRelative === "Today"
                ? "Expires today"
                : expiryRelative === "Tomorrow"
                ? "Expires tomorrow"
                : `Expires in ${expiryRelative.toLowerCase()}`;
              const CategoryIcon = getCategoryIcon(it.category, it.name);
              const iconColor = expired ? "#B91C1C" : "#16A34A";
              const qtyText = it.quantity
                ? formatQuantityWithUnit(it.quantity, it.unit, {
                    fallbackUnit: "pcs",
                  })
                : "";
              const expanded = expandedInventoryId === rowId;
              const animVal =
                inventoryActionAnimRef.current[rowId] ??
                (inventoryActionAnimRef.current[rowId] = new Animated.Value(
                  expanded ? 1 : 0
                ));

              return (
                <View key={rowId} style={styles.inventoryCalCard}>
                  <Pressable
                    style={styles.inventoryCalCardInner}
                    onPress={() => toggleInventoryItemExpanded(rowId)}
                    accessibilityRole="button"
                    accessibilityLabel={`${it.name}. ${it.location}. ${expiryText}. ${
                      expanded ? "Expanded" : "Tap for Edit, Consume, or Delete"
                    }`}
                    accessibilityState={{ expanded }}
                  >      
                    <View style={styles.inventoryCalIconTile}>
                      <CategoryIcon
                        size={22}
                        color={iconColor}
                        weight="fill"
                      />
                    </View>
                    <View style={styles.inventoryCalBody}>
                      <View style={styles.inventoryCalTopRow}>
                        <Text
                          style={styles.inventoryCalName}
                          numberOfLines={1}
                        >
                          {it.name}
                        </Text>
                      </View>
                      <View style={styles.inventoryCalMetaRow}>
                        <Text style={styles.inventoryCalMetaText}>
                          {qtyText || "Quantity not set"}
                        </Text>
                      </View>
                    </View>
                    {!!expiryText ? (
                      <View style={styles.inventoryCalRightCol}>
                        <Text style={styles.inventoryCalDateLabelText} numberOfLines={1}>
                          {expiryDateLabel || expiryText}
                        </Text>
                        <View
                          style={[
                            styles.inventoryCalDaysPill,
                            expired
                              ? styles.inventoryCalDaysPillExpired
                              : styles.inventoryCalDaysPillSoon,
                          ]}
                        >
                          <Text
                            style={[
                              styles.inventoryCalDaysPillText,
                              expired
                                ? styles.inventoryCalDaysPillTextExpired
                                : styles.inventoryCalDaysPillTextSoon,
                            ]}
                            numberOfLines={1}
                          >
                            {expiryStatusText}
                          </Text>
                        </View>
                      </View>
                    ) : null}
                  </Pressable>
                  <Animated.View
                    style={[
                      styles.inventoryCalActionsWrap,
                      {
                        height: animVal.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0, INVENTORY_ACTION_ROW_H],
                        }),
                        opacity: animVal.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0, 1],
                        }),
                        transform: [
                          {
                            translateY: animVal.interpolate({
                              inputRange: [0, 1],
                              outputRange: [6, 0],
                            }),
                          },
                        ],
                      },
                    ]}
                    collapsable={false}
                  >
                    <View style={styles.inventoryCalActionRowOuter}>
                      <View style={styles.inventoryCalActionRow}>
                        <TouchableOpacity
                          style={styles.inventoryCalActionBtn}
                          onPress={() => openInventoryEdit(it)}
                          activeOpacity={0.7}
                          accessibilityRole="button"
                          accessibilityLabel={`Edit ${it.name}`}
                        >
                          <Ionicons
                            name="create-outline"
                            size={14}
                            color="#6B7280"
                          />
                          <Text style={styles.inventoryCalActionEdit}>Edit</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.inventoryCalUseBtn}
                          onPress={() => {
                            setExpandedInventoryId((prev) =>
                              prev === rowId ? null : prev
                            );
                            requestConsumeModal(it);
                          }}
                          activeOpacity={0.7}
                          accessibilityRole="button"
                          accessibilityLabel={`Consume ${it.name}`}
                        >
                          <Text style={styles.inventoryCalUseBtnText}>
                            Consume
                          </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.inventoryCalActionBtn}
                          onPress={() => confirmDeleteInventoryItem(it)}
                          activeOpacity={0.7}
                          accessibilityRole="button"
                          accessibilityLabel={`Delete ${it.name}`}
                        >
                          <Ionicons
                            name="trash-outline"
                            size={14}
                            color="#EF4444"
                          />
                        </TouchableOpacity>
                      </View>
                    </View>
                  </Animated.View>
                  <ItemCardPendingOverlay visible={homeItemActionPendingId === rowId} />
                </View>
              );
            })
          )}
        </View>

        <View style={styles.sectionGap} />

        <View style={{ height: 0 }} />
      </ScrollView>

      <ConsumeModal
        visible={consumeModalItem !== null}
        item={consumeModalItem}
        onConfirm={handleInventoryConsumeConfirm}
        onCancel={() => setConsumeModalItem(null)}
      />

      <ThrowAwayModal
        visible={throwAwayModalItem !== null}
        item={throwAwayModalItem}
        onConfirm={handleThrowAwayConfirm}
        onCancel={() => setThrowAwayModalItem(null)}
      />

      <Modal
        visible={removeModalItem !== null}
        transparent
        animationType="none"
        onRequestClose={() => setRemoveModalItem(null)}
      >
        <View style={styles.removeModalBackdrop}>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={() => setRemoveModalItem(null)}
          />
          <View style={styles.removeModalCard}>
            <Text style={styles.removeModalTitle}>
              {removeModalItem ? `Remove ${removeModalItem.name}?` : "Remove item?"}
            </Text>

            <View style={styles.removeOptionsRow}>
              <TouchableOpacity
                delayPressIn={0}
                style={[styles.removeOptionSideBySide, styles.removeOptionPrimary]}
                activeOpacity={0.88}
                onPress={openThrowAwayQuantityModal}
              >
                <Ionicons name="trash-outline" size={16} color="#B91C1C" />
                <View style={styles.removeOptionTextCol}>
                  <Text style={styles.removeOptionTitlePrimary}>Throw Away</Text>
                  <Text style={styles.removeOptionBody}>Logged as waste</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                delayPressIn={0}
                style={[styles.removeOptionSideBySide, styles.removeOptionSecondary]}
                activeOpacity={0.88}
                onPress={handleDeleteItem}
              >
                <Ionicons name="close" size={16} color="#111827" />
                <View style={styles.removeOptionTextCol}>
                  <Text style={styles.removeOptionTitleSecondary}>Delete</Text>
                  <Text style={styles.removeOptionBody}>Removed from inventory</Text>
                </View>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.removeModalCancel}
              activeOpacity={0.9}
              onPress={() => setRemoveModalItem(null)}
            >
              <Text style={styles.removeModalCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal
        visible={pinModalVisible}
        animationType="fade"
        transparent
        onRequestClose={() => {
          setPinModalVisible(false);
          setPinSearchQuery("");
        }}
      >
        <View style={styles.pinModalBackdrop}>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={() => {
              setPinModalVisible(false);
              setPinSearchQuery("");
            }}
            accessibilityLabel="Close pin picker"
          />
          <View style={styles.pinModalCenter} pointerEvents="box-none">
            <View style={styles.pinModalCard}>
              <View style={styles.pinModalHeaderRow}>
                <View style={styles.pinModalHeaderSide}>
                  <Pressable
                    onPress={() => {
                      setPinModalVisible(false);
                      setPinSearchQuery("");
                    }}
                    style={styles.pinModalClosePlain}
                    hitSlop={12}
                    accessibilityRole="button"
                    accessibilityLabel="Go back"
                  >
                    <CaretLeft size={18} color="#15803D" weight="regular" />
                  </Pressable>
                </View>
                <Text style={styles.pinModalTitle}>Pin an item</Text>
                <View style={styles.pinModalHeaderSide} />
              </View>
              {pinnedItemsOrdered.length > 0 && (
                <View style={styles.pinModalPinnedSection}>
                  <View style={styles.pinModalPinnedHeaderRow}>
                    <View style={{ flex: 1 }} />
                    <View style={styles.pinModalPinnedHighlightBadge}>
                      <Text style={styles.pinModalPinnedHighlightBadgeText}>
                        {pinnedIds.length}/{MAX_PINNED_ITEMS}
                      </Text>
                    </View>
                  </View>
                  {pinnedItemsOrdered.map((it, idx) => {
                    const expired = isFoodItemExpired(it);
                    const CategoryIcon = getCategoryIcon(it.category, it.name);
                    const iconColor = expired ? "#DC2626" : "#15803D";
                    const locImg =
                      it.location === "shelf" ? shelfIconAsset : fridgeIconAsset;
                    const qtyStr = formatQuantityWithUnit(it.quantity, it.unit, {
                      fallbackUnit: "pcs",
                    });
                    const expLine = formatPinExpiryLine(it);
                    return (
                      <View
                        key={it.id}
                        style={[
                          styles.pinModalPinnedRowCard,
                          idx > 0 && styles.pinModalPinnedRowCardFollow,
                        ]}
                      >
                        <View
                          style={[
                            styles.pinModalPinnedIconTile,
                            expired && styles.pinPickIconExpired,
                          ]}
                        >
                          <CategoryIcon
                            size={15}
                            color={iconColor}
                            weight="fill"
                          />
                        </View>
                        <View style={{ flex: 1, minWidth: 0 }}>
                          <Text
                            style={styles.pinModalPinnedItemName}
                            numberOfLines={1}
                            ellipsizeMode="tail"
                          >
                            {it.name}
                          </Text>
                          <View style={styles.pinModalPinnedMetaRow}>
                            <Image
                              source={locImg}
                              style={styles.pinModalPinnedLocIcon}
                              resizeMode="contain"
                            />
                            <Text
                              style={[
                                styles.pinModalPinnedMetaLine,
                                expLine.expired &&
                                  styles.pinModalPinnedMetaLineExpired,
                              ]}
                              numberOfLines={1}
                            >
                              {qtyStr} · {expLine.text}
                            </Text>
                          </View>
                        </View>
                        <Pressable
                          style={styles.pinModalPinnedUnpin}
                          onPress={() => removePinnedItem(it.id)}
                          accessibilityRole="button"
                          accessibilityLabel={`Unpin ${it.name}`}
                          hitSlop={8}
                        >
                          <X size={14} color="#15803D" weight="regular" />
                        </Pressable>
                      </View>
                    );
                  })}
                </View>
              )}
              <View style={styles.pinModalSearchBar}>
                <MagnifyingGlass size={18} color="#64748B" weight="regular" />
                <TextInput
                  value={pinSearchQuery}
                  onChangeText={setPinSearchQuery}
                  placeholder="Search name or category…"
                  placeholderTextColor="rgba(100,116,139,0.85)"
                  style={styles.pinModalSearchInput}
                  autoCorrect={false}
                  autoCapitalize="none"
                  returnKeyType="search"
                />
              </View>
              {pinnedIds.length >= MAX_PINNED_ITEMS && (
                <View style={styles.pinModalAtMaxHint}>
                  <Text style={styles.pinModalAtMaxHintText}>
                    Unpin an item above to add another.
                  </Text>
                </View>
              )}
              <ScrollView
                style={styles.pinModalList}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
              >
                {pinPickerCandidates.length === 0 ? (
                  <View style={styles.pinModalEmptyWrap}>
                    <MagnifyingGlass
                      size={32}
                      color={UI.neutralBorder}
                      weight="regular"
                    />
                    <Text style={styles.pinModalEmpty}>
                      {(() => {
                        const unpinnedCount = items.filter(
                          (x) => !pinnedIds.includes(x.id)
                        ).length;
                        if (items.length === 0) {
                          return "Add items to your inventory first.";
                        }
                        if (pinnedItemsOrdered.length > 0) {
                          if (unpinnedCount === 0) {
                            return "Nothing left to pin.";
                          }
                          return "No items match your search.";
                        }
                        if (unpinnedCount === 0) {
                          return pinnedIds.length >= MAX_PINNED_ITEMS
                            ? "That’s both pins — close to finish."
                            : "Everything is already pinned.";
                        }
                        return "No items match your search.";
                      })()}
                    </Text>
                  </View>
                ) : (
                  pinPickerCandidates.map((it, index) => {
                    const expired = isFoodItemExpired(it);
                    const CategoryIcon = getCategoryIcon(it.category, it.name);
                    const iconColor = expired ? "#DC2626" : "#15803D";
                    const locImg =
                      it.location === "shelf" ? shelfIconAsset : fridgeIconAsset;
                    const qtyStr = formatQuantityWithUnit(it.quantity, it.unit, {
                      fallbackUnit: "pcs",
                    });
                    const expLine = formatPinExpiryLine(it);
                    const last = index === pinPickerCandidates.length - 1;
                    const atMaxPins = pinnedIds.length >= MAX_PINNED_ITEMS;
                    return (
                      <Pressable
                        key={it.id}
                        style={[
                          styles.pinPickRow,
                          last && styles.pinPickRowLast,
                          atMaxPins && styles.pinPickRowDisabled,
                        ]}
                        onPress={() => addPinnedItem(it.id)}
                        disabled={atMaxPins}
                        accessibilityRole="button"
                        accessibilityLabel={`Pin ${it.name}`}
                        accessibilityState={{ disabled: atMaxPins }}
                      >
                        <View
                          style={[
                            styles.pinPickIcon,
                            expired && styles.pinPickIconExpired,
                          ]}
                        >
                          <CategoryIcon
                            size={20}
                            color={iconColor}
                            weight="fill"
                          />
                        </View>
                        <View style={{ flex: 1, minWidth: 0 }}>
                          <Text style={styles.pinPickName} numberOfLines={1}>
                            {it.name}
                          </Text>
                          <View style={styles.pinPickQtyRow}>
                            <Image
                              source={locImg}
                              style={styles.pinPickLocIcon}
                              resizeMode="contain"
                            />
                            <Text style={styles.pinPickMeta} numberOfLines={1}>
                              {qtyStr}
                            </Text>
                          </View>
                          <Text
                            style={[
                              styles.pinPickExpiry,
                              expLine.expired && styles.pinPickExpiryExpired,
                            ]}
                            numberOfLines={1}
                          >
                            {expLine.text}
                          </Text>
                        </View>
                      </Pressable>
                    );
                  })
                )}
              </ScrollView>
            </View>
          </View>
        </View>
      </Modal>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: UI.bg,
  },
  content: {
    paddingHorizontal: 18,
    paddingTop: 0,
  },
  topBanner: {
    marginHorizontal: -18,
    height: 100,
  },
  topBannerGradient: {
    width: "100%",
    height: "100%",
    justifyContent: "flex-start",
    overflow: "hidden",
  },
  topBannerWave: {
    position: "absolute",
    bottom: 10,
    left: 0,
    right: 0,
  },
  topBannerBottomFill: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: 12,
    backgroundColor: "#FFFFFF",
  },
  greetingBlock: {
    paddingTop: 14,
    paddingLeft: 0,
    alignItems: "center",
  },
  greetingHeadline: {
    fontSize: 16,
    color: "#FDFDF9",
    letterSpacing: 0.25,
    fontFamily: "PlusJakartaSans_600SemiBold",
    textAlign: "center",
    textShadowColor: "rgba(0,0,0,0.25)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  greetingName: {
    marginTop: -10,
    marginLeft: 0,
    fontSize: 25,
    color: "#1B5C3A",
    letterSpacing: -0.5,
    textTransform: "none",
    fontFamily: "PlusJakartaSans_700Bold",
    textAlign: "center",
  },
  sectionHeaderRow: {
    marginTop: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: "800",
    color: UI.ink,
  },
  seeAll: {
    fontSize: 13,
    fontWeight: "700",
    color: UI.muted,
  },
  // This Week toggle — mirrors calendar toggle style
  twToggleWrap: {
    marginTop: 6,
    marginBottom: 8,
    alignItems: "center",
  },
  twToggleOuter: {
    flexDirection: "row",
    width: 300,
    backgroundColor: "#fff",
    borderRadius: 999,
    borderWidth: 1,
    borderColor: UI.neutralBorder,
    paddingHorizontal: 4,
    paddingVertical: 4,
    gap: 4,
    overflow: "hidden",
  },
  twSlidingPill: {
    position: "absolute",
    left: 4,
    top: 4,
    bottom: 4,
    width: 92,
    borderRadius: 999,
  },
  twSlidingPillDefault: {
    backgroundColor: "#15803D",
  },
  twSlidingPillRecent: {
    backgroundColor: "#737a85",
  },
  twSlidingPillExpired: {
    backgroundColor: "#B91C1C",
  },
  twToggleTab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 7,
    borderRadius: 999,
    zIndex: 1,
  },
  twToggleTabText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#4a8c35",
  },
  twToggleTabTextActive: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
  twStripOuter: {
    marginHorizontal: -18,
  },
  twStrip: {
    paddingLeft: 16,
    paddingRight: 16,
    paddingTop: 2,
    paddingBottom: 0,
    gap: 8,
  },
  twCard: {
    flexDirection: "column",
    alignItems: "stretch",
    minWidth: 96,
    maxWidth: 165,
    alignSelf: "flex-start",
    flexShrink: 0,
    backgroundColor: "#FAFAFA",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: UI.neutralBorder,
    overflow: "hidden",
    paddingRight: 0,
    paddingTop: 9,
    paddingBottom: 0,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  twEmptyCard: {
    justifyContent: "center",
    alignItems: "center",
    minHeight: 42,
    paddingHorizontal: 12,
  },
  twLoadingCard: {
    justifyContent: "center",
    alignItems: "center",
    minHeight: 42,
    paddingHorizontal: 12,
    gap: 6,
  },
  twLoadingLineLg: {
    width: 136,
    height: 11,
    borderRadius: 999,
    backgroundColor: "#E5E7EB",
  },
  twLoadingLineSm: {
    width: 92,
    height: 9,
    borderRadius: 999,
    backgroundColor: "#ECEFF3",
  },
  twIconWrap: {
    marginLeft: 0,
    width: 30,
    height: 30,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 4,
  },
  twLocImg: {
    width: 11,
    height: 11,
    resizeMode: "contain",
    flexShrink: 0,
  },
  twBody: {
    flexShrink: 1,
  },
  twName: {
    fontSize: 13,
    fontWeight: "700",
    color: "#0F172A",
    lineHeight: 18,
  },
  twMeta: {
    fontSize: 11,
    fontWeight: "500",
    color: "#64748B",
  },
  twMetaRow: {
    marginTop: 3,
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  twMetaLocIcon: {
    width: 9,
    height: 9,
    resizeMode: "contain",
    tintColor: "#64748B",
  },
  twMainRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingLeft: 3,
    paddingRight: 10,
  },
  twStatusBar: {
    marginTop: 6,
    alignSelf: "stretch",
    borderBottomLeftRadius: 14,
    borderBottomRightRadius: 14,
    paddingHorizontal: 0,
    paddingVertical: 4,
  },
  twStatusBarText: {
    fontSize: 9,
    fontWeight: "700",
    textAlign: "center",
  },
  twEmpty: {
    fontSize: 12,
    color: "#6B7280",
    textAlign: "center",
    fontWeight: "500",
  },
  sectionGap: {
    height: 15,
  },
  sectionLine: {
    height: 0.5,
    backgroundColor: UI.divider,
    marginVertical: 10,
  },
  rowCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: UI.card,
    borderWidth: 0.5,
    borderColor: UI.border,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 12,
    marginTop: 10,
  },
  rowAccentDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  rowTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: UI.ink,
  },
  rowSubtitle: {
    marginTop: 2,
    fontSize: 12,
    fontWeight: "600",
    color: UI.muted,
  },
  rowRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  itemHistoryCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginTop: 4,
    backgroundColor: UI.card,
    borderWidth: 1,
    borderColor: UI.ok,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  itemHistoryTextCol: {
    flex: 1,
    minWidth: 0,
  },
  itemHistoryTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#15803D",
  },
  itemHistorySubtitle: {
    marginTop: 3,
    fontSize: 12,
    fontWeight: "600",
    color: UI.muted,
  },
  itemHistorySubtitleSkeleton: {
    marginTop: 6,
    width: 190,
    height: 11,
    borderRadius: 6,
    backgroundColor: "#E5E7EB",
  },
  pinnedHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4,
  },
  pinnedTitleCluster: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  pinnedSectionTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#15803D",
  },
  inventorySectionTitle: {
    alignSelf: "center",
    fontSize: 15,
    fontWeight: "700",
    color: "#15803D",
    marginBottom: 10,
  },
  inventoryControlsCard: {
    backgroundColor: "#22C55E",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#16A34A",
    paddingHorizontal: 10,
    paddingVertical: 10,
  },
  pinnedPinButton: {
    padding: 2,
    marginTop: 1,
  },
  pinnedEmptyWrap: {
    marginTop: 4,
    marginBottom: 0,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 4,
    paddingHorizontal: 12,
  },
  pinnedEmptySubtitle: {
    marginTop: 3,
    fontSize: 12,
    fontWeight: "600",
    color: UI.muted,
    textAlign: "center",
    lineHeight: 16,
    maxWidth: 280,
  },
  pinnedLoadingWrap: {
    marginTop: 10,
    gap: 8,
  },
  pinnedLoadingWrapTwoCol: {
    flexDirection: "row",
    alignItems: "stretch",
    alignSelf: "stretch",
    width: "100%",
  },
  pinnedLoadingBar: {
    height: 64,
    borderRadius: 14,
    backgroundColor: "#E5E7EB",
    opacity: 0.8,
  },
  pinnedLoadingBarHalf: {
    flex: 1,
  },
  pinnedList: {
    marginTop: 10,
    gap: 8,
    alignItems: "center",
  },
  pinnedListTwoCol: {
    flexDirection: "row",
    alignItems: "stretch",
    justifyContent: "flex-start",
    alignSelf: "stretch",
    width: "100%",
    gap: 8,
  },
  pinnedRow: {
    position: "relative",
    flexDirection: "column",
    alignItems: "stretch",
    alignSelf: "center",
    backgroundColor: UI.card,
    borderWidth: 0.5,
    borderColor: UI.border,
    borderRadius: 14,
    overflow: "hidden",
  },
  pinnedRowHalf: {
    paddingTop: 0,
  },
  pinnedRowTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    minWidth: 0,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  pinnedRowTopCompact: {
    paddingVertical: 8,
    paddingHorizontal: 10,
    alignItems: "center",
  },
  pinnedRowActionsWrap: {
    overflow: "hidden",
  },
  pinnedRowActions: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 6,
    paddingVertical: 6,
    minHeight: PINNED_ACTION_ROW_H,
    borderTopWidth: 1,
    borderTopColor: "#E2E8F0",
    backgroundColor: "#FAFAFA",
  },
  pinnedActionBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    paddingVertical: 8,
  },
  pinnedConsumeBtn: {
    flex: 0,
    minWidth: 88,
    paddingVertical: 3,
    paddingHorizontal: 10,
    borderRadius: 999,
    backgroundColor: "#22C55E",
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 2,
  },
  pinnedConsumeBtnText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  pinnedRowIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  pinnedRowIconSmall: {
    width: 30,
    height: 30,
    borderRadius: 9,
  },
  pinnedRowIconExpired: {
    backgroundColor: "#FFFFFF",
  },
  pinnedRowName: {
    fontSize: 14,
    fontWeight: "700",
    color: UI.ink,
  },
  pinnedRowNameCompact: {
    fontSize: 13,
    fontWeight: "700",
    lineHeight: 17,
  },
  pinnedRowMetaRow: {
    marginTop: 3,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  pinnedRowLocIcon: {
    width: 12,
    height: 12,
    tintColor: UI.muted,
  },
  pinnedRowMeta: {
    fontSize: 12,
    fontWeight: "500",
    color: UI.muted,
    flex: 1,
  },
  pinnedRowMetaCompact: {
    fontSize: 10,
    fontWeight: "500",
  },
  pinnedRowExpiry: {
    marginTop: 3,
    fontSize: 11,
    fontWeight: "600",
    color: "#16A34A",
  },
  pinnedRowExpiryCompact: {
    fontSize: 10,
  },
  pinnedRowExpiryExpired: {
    color: "#DC2626",
  },
  pinModalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(15,23,42,0.4)",
  },
  pinModalCenter: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    paddingHorizontal: 22,
  },
  pinModalCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    paddingHorizontal: 18,
    paddingTop: 16,
    paddingBottom: 14,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    maxHeight: "82%",
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.12,
    shadowRadius: 28,
    elevation: 14,
    overflow: "hidden",
  },
  pinModalHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 2,
  },
  pinModalHeaderSide: {
    width: 32,
    alignItems: "flex-start",
    justifyContent: "center",
  },
  pinModalTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: "700",
    color: UI.ink,
    letterSpacing: -0.2,
    textAlign: "center",
    includeFontPadding: false,
  },
  pinModalClosePlain: {
    marginLeft: -2,
    paddingVertical: 0,
    paddingHorizontal: 0,
    justifyContent: "center",
    alignItems: "center",
  },
  pinModalPinnedSection: {
    marginTop: 8,
  },
  pinModalPinnedHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
    paddingHorizontal: 2,
  },
  pinModalPinnedHighlightBadge: {
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 6,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#E2E8F0",
  },
  pinModalPinnedHighlightBadgeText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#15803D",
    fontVariant: ["tabular-nums"],
  },
  pinModalPinnedRowCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 8,
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#CBD5E1",
  },
  pinModalPinnedRowCardFollow: {
    marginTop: 4,
  },
  pinModalPinnedIconTile: {
    width: 28,
    height: 28,
    borderRadius: 7,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#EEF2F6",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FAFAFA",
  },
  pinModalPinnedItemName: {
    fontSize: 13,
    fontWeight: "600",
    color: "#0F172A",
    letterSpacing: -0.15,
  },
  pinModalPinnedMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    marginTop: 1,
  },
  pinModalPinnedLocIcon: {
    width: 10,
    height: 10,
    tintColor: "#94A3B8",
  },
  pinModalPinnedMetaLine: {
    flex: 1,
    fontSize: 10,
    fontWeight: "500",
    color: "#64748B",
  },
  pinModalPinnedMetaLineExpired: {
    color: "#DC2626",
  },
  pinModalSearchBar: {
    marginTop: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "#F8FAFC",
    borderRadius: 999,
    paddingHorizontal: 16,
    height: 48,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  pinModalSearchInput: {
    flex: 1,
    fontSize: 15,
    fontWeight: "400",
    color: UI.ink,
    paddingVertical: 0,
  },
  pinModalList: {
    marginTop: 8,
    maxHeight: 340,
  },
  pinModalAtMaxHint: {
    marginTop: 8,
    paddingVertical: 8,
    paddingHorizontal: 10,
    backgroundColor: "#F0FDF4",
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#BBF7D0",
  },
  pinModalAtMaxHintText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#166534",
    textAlign: "center",
    lineHeight: 16,
  },
  pinModalPinnedUnpin: {
    padding: 2,
  },
  pinPickRowDisabled: {
    opacity: 0.45,
  },
  pinModalEmptyWrap: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 28,
    paddingHorizontal: 12,
    gap: 10,
  },
  pinModalEmpty: {
    textAlign: "center",
    fontSize: 14,
    fontWeight: "500",
    color: UI.muted,
    lineHeight: 20,
  },
  pinPickRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 6,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#EEF2F6",
  },
  pinPickRowLast: {
    borderBottomWidth: 0,
  },
  pinPickIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E8F5E9",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F0FDF4",
  },
  pinPickIconExpired: {
    backgroundColor: "#FEF2F2",
    borderColor: "#FECACA",
  },
  pinPickQtyRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 3,
  },
  pinPickLocIcon: {
    width: 13,
    height: 13,
    tintColor: UI.muted,
  },
  pinPickName: {
    fontSize: 15,
    fontWeight: "600",
    color: UI.ink,
  },
  pinPickMeta: {
    fontSize: 12,
    fontWeight: "500",
    color: UI.muted,
    flex: 1,
  },
  pinPickExpiry: {
    marginTop: 3,
    fontSize: 11,
    fontWeight: "600",
    color: UI.muted,
  },
  pinPickExpiryExpired: {
    color: "#DC2626",
  },
  searchBar: {
    marginTop: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 42,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    fontWeight: "500",
    color: UI.ink,
  },
  inventoryToggleWrap: {
    marginTop: 0,
    marginBottom: 0,
  },
  inventoryToggleOuter: {
    flexDirection: "row",
    backgroundColor: "rgba(255,255,255,0.20)",
    borderRadius: 999,
    paddingHorizontal: 4,
    paddingVertical: 4,
    gap: 4,
    alignItems: "center",
    borderWidth: 0,
    position: "relative",
    overflow: "hidden",
  },
  inventoryToggleSlidingPill: {
    position: "absolute",
    left: 4,
    top: 4,
    bottom: 4,
    borderRadius: 999,
    backgroundColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOpacity: 0.07,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  inventoryToggleTab: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 999,
    minHeight: 31,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderWidth: 0,
    zIndex: 1,
  },
  inventoryToggleTabActive: {
    backgroundColor: "transparent",
  },
  inventoryToggleContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 0,
  },
  inventoryToggleLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
  },
  inventoryToggleIcon: {
    width: 16,
    height: 16,
  },
  inventoryToggleIconActive: {
    tintColor: "#15803D",
  },
  inventoryToggleIconInactive: {
    tintColor: "#FFFFFF",
    opacity: 0.85,
  },
  inventoryToggleText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  inventoryToggleTextActive: {
    color: "#15803D",
  },
  inventoryList: {
    marginTop: 10,
    gap: 8,
  },
  searchHintText: {
    fontSize: 11,
    fontWeight: "500",
    color: "#64748B",
    textAlign: "center",
    marginBottom: 4,
  },
  /** Calendar-style inventory cards (matches EnhancedCalendarScreen day items) */
  inventoryCalCard: {
    position: "relative",
    flexDirection: "column",
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    overflow: "hidden",
    marginBottom: 0,
    shadowColor: "#0F172A",
    shadowOpacity: 0.03,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  inventoryCalCardInner: {
    flexDirection: "row",
    alignItems: "center",
    paddingLeft: 10,
    paddingRight: 10,
    paddingVertical: 8,
    minWidth: 0,
    minHeight: 50,
  },
  inventoryCalIconTile: {
    width: 28,
    height: 28,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 6,
    borderRadius: 10,
    backgroundColor: "transparent",
  },
  inventoryCalBody: {
    flex: 1,
    minWidth: 0,
  },
  inventoryCalTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
    minWidth: 0,
  },
  inventoryCalHeaderRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 8,
  },
  inventoryCalTextCol: {
    flexShrink: 1,
    minWidth: 0,
  },
  inventoryCalName: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1F2937",
  },
  inventoryCalMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 2,
  },
  inventoryCalMetaText: {
    fontSize: 11,
    fontWeight: "500",
    color: "#64748B",
  },
  inventoryCalRightCol: {
    marginLeft: 8,
    alignItems: "flex-end",
    justifyContent: "center",
    minWidth: 78,
  },
  inventoryCalDateLabelText: {
    fontSize: 10,
    fontWeight: "500",
    color: "#64748B",
  },
  inventoryCalDaysPill: {
    marginTop: 4,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 999,
  },
  inventoryCalDaysPillSoon: {
    backgroundColor: "#DCFCE7",
  },
  inventoryCalDaysPillExpired: {
    backgroundColor: "#FEE2E2",
  },
  inventoryCalDaysPillText: {
    fontSize: 9,
    fontWeight: "700",
  },
  inventoryCalDaysPillTextSoon: {
    color: "#166534",
  },
  inventoryCalDaysPillTextExpired: {
    color: "#991B1B",
  },
  inventoryCalActionsWrap: {
    overflow: "hidden",
  },
  inventoryCalActionRowOuter: {
    backgroundColor: "#FAFAFA",
    borderTopWidth: 1,
    borderTopColor: "#E2E8F0",
  },
  inventoryCalActionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 6,
    paddingVertical: 6,
    minHeight: INVENTORY_ACTION_ROW_H,
  },
  inventoryCalActionBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    paddingVertical: 8,
  },
  inventoryCalActionEdit: {
    fontSize: 12,
    fontWeight: "500",
    color: "#64748B",
  },
  inventoryCalUseBtn: {
    flex: 1,
    paddingVertical: 5,
    paddingHorizontal: 8,
    borderRadius: 999,
    backgroundColor: "#22C55E",
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 4,
  },
  inventoryCalUseBtnText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  removeModalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(15,23,42,0.25)",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  removeModalCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    paddingVertical: 16,
    paddingHorizontal: 18,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 6,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  removeModalTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 10,
    textAlign: "center",
  },
  removeOptionsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 4,
    marginBottom: 8,
    gap: 8,
  },
  removeOptionSideBySide: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: 999,
    borderWidth: 1,
    gap: 6,
  },
  removeOptionPrimary: {
    backgroundColor: "#FFFFFF",
    borderColor: "#FCA5A5",
  },
  removeOptionSecondary: {
    backgroundColor: "#FFFFFF",
    borderColor: "#E5E7EB",
  },
  removeOptionTextCol: {
    marginTop: 0,
    alignItems: "flex-start",
  },
  removeOptionTitlePrimary: {
    fontSize: 13,
    fontWeight: "600",
    color: "#B91C1C",
    marginBottom: 2,
  },
  removeOptionTitleSecondary: {
    fontSize: 13,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 2,
  },
  removeOptionBody: {
    fontSize: 10.5,
    fontWeight: "500",
    color: "#6B7280",
    textAlign: "left",
  },
  removeModalCancel: {
    marginTop: 6,
    borderRadius: 999,
    backgroundColor: "#E5E7EB",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 9,
    alignSelf: "center",
    paddingHorizontal: 32,
  },
  removeModalCancelText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#111827",
  },
  skeleton: {
    height: 58,
    borderRadius: 14,
    backgroundColor: "rgba(232,230,224,0.55)",
    borderWidth: 0.5,
    borderColor: UI.border,
  },
  emptyCard: {
    backgroundColor: UI.card,
    borderWidth: 0.5,
    borderColor: UI.border,
    borderRadius: 14,
    padding: 12,
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: UI.ink,
  },
  emptyText: {
    marginTop: 4,
    fontSize: 12,
    fontWeight: "600",
    color: UI.muted,
  },
  searchEmptyWrap: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    paddingHorizontal: 12,
  },
  searchEmptyTitle: {
    fontSize: 15,
    fontWeight: "400",
    color: "#6B7280",
    textAlign: "center",
  },
  searchEmptySubtitle: {
    marginTop: 3,
    fontSize: 13,
    fontWeight: "400",
    color: "#6B7280",
    textAlign: "center",
  },
});
