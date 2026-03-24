/**
 * FridgeWise — Calendar Screen (Redesigned UI)
 * All logic/hooks unchanged. Full visual overhaul.
 */

import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  Easing,
  InteractionManager,
  Image,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import {
  DropIcon,
  BoneIcon,
  FishIcon,
  CarrotIcon,
  AppleLogoIcon,
  BreadIcon,
  EggIcon,
  GrainsIcon,
  CookieIcon,
  CoffeeIcon,
  BeerBottleIcon,
  CookingPotIcon,
  SnowflakeIcon,
  PackageIcon,
} from "phosphor-react-native";
import { Calendar } from "react-native-calendars";
import {
  Gesture,
  GestureDetector,
  PanGestureHandlerEventPayload,
} from "react-native-gesture-handler";
import { runOnJS, useSharedValue } from "react-native-reanimated";
import {
  useCalendarPerformance,
  useEnhancedCalendar,
} from "../hooks/useEnhancedCalendar";
import { useThemeColor } from "../hooks/useThemeColor";
import { FoodItem } from "../lib/supabase";
import { formatQuantityWithUnit } from "../utils/formatQuantityUnit";

// ─── Asset & icon helpers ────────────────────────────────────────────────────

function getCategoryAsset(category?: string, name?: string) {
  const cat = (category || "").toLowerCase();
  const n = (name || "").toLowerCase();
  const pick = (k: string) => {
    switch (k) {
      case "milk": case "dairy":       return require("../assets/images/food-icons/milk.svg");
      case "bread": case "bakery": case "grain": case "grains":
                                        return require("../assets/images/food-icons/bread.svg");
      case "egg": case "eggs":         return require("../assets/images/food-icons/egg.svg");
      case "meat": case "protein": case "chicken": case "beef": case "pork":
                                        return require("../assets/images/food-icons/meat.svg");
      case "fish": case "seafood":     return require("../assets/images/food-icons/fish.svg");
      case "vegetable": case "vegetables": case "veg":
                                        return require("../assets/images/food-icons/vegetable.svg");
      case "fruit": case "fruits":     return require("../assets/images/food-icons/fruit.svg");
      case "cheese":                   return require("../assets/images/food-icons/cheese.svg");
      default:                         return null;
    }
  };
  const direct = pick(cat);
  if (direct) return direct;
  if (n.includes("milk") || n.includes("cream"))   return require("../assets/images/food-icons/milk.svg");
  if (n.includes("bread") || n.includes("toast"))  return require("../assets/images/food-icons/bread.svg");
  if (n.includes("egg"))                           return require("../assets/images/food-icons/egg.svg");
  if (n.includes("meat") || n.includes("beef") || n.includes("chicken") || n.includes("pork"))
                                                    return require("../assets/images/food-icons/meat.svg");
  if (n.includes("fish") || n.includes("shrimp"))  return require("../assets/images/food-icons/fish.svg");
  if (n.includes("carrot") || n.includes("broccoli") || n.includes("lettuce"))
                                                    return require("../assets/images/food-icons/vegetable.svg");
  if (n.includes("apple") || n.includes("banana") || n.includes("orange"))
                                                    return require("../assets/images/food-icons/fruit.svg");
  if (n.includes("cheese"))                        return require("../assets/images/food-icons/cheese.svg");
  return require("../assets/images/food-icons/fruit.svg");
}

function getCategoryIconComponent(category?: string) {
  const label = (category || "").toLowerCase();
  if (label === "dairy") return DropIcon;
  if (label === "meat") return BoneIcon;
  if (label === "seafood") return FishIcon;
  if (label === "vegetables" || label === "vegetable") return CarrotIcon;
  if (label === "fruits" || label === "fruit") return AppleLogoIcon;
  if (label === "bakery" || label === "bread") return BreadIcon;
  if (label === "eggs" || label === "egg") return EggIcon;
  if (label === "grains" || label === "grain") return GrainsIcon;
  if (label === "snacks") return CookieIcon;
  if (label === "beverages") return CoffeeIcon;
  if (label === "condiments") return BeerBottleIcon;
  if (label === "prepared meals") return CookingPotIcon;
  if (label === "frozen") return SnowflakeIcon;
  if (label === "other") return PackageIcon;
  return PackageIcon;
}

function getCategoryEmoji(category?: string, name?: string) {
  const label = (category || name || "").toLowerCase();
  if (label.includes("meat") || label.includes("chicken") || label.includes("beef")) return "🥩";
  if (label.includes("dairy") || label.includes("milk") || label.includes("cream")) return "🥛";
  if (label.includes("vegetable") || label.includes("veg") || label.includes("broccoli") || label.includes("lettuce")) return "🥦";
  if (label.includes("fruit") || label.includes("apple") || label.includes("banana")) return "🍎";
  if (label.includes("fish") || label.includes("seafood") || label.includes("salmon")) return "🐟";
  if (label.includes("egg")) return "🥚";
  if (label.includes("bread") || label.includes("bakery")) return "🍞";
  if (label.includes("cheese")) return "🧀";
  return "🥫";
}

const fridgeIconAsset = require("../assets/images/icons/fridge_icon.png");
const shelfIconAsset  = require("../assets/images/icons/shelf_icon.png");

// ─── Types ───────────────────────────────────────────────────────────────────

export interface EnhancedCalendarScreenProps {
  foodItemsService?: any;
  onItemPress?:   (item: FoodItem) => void;
  onItemEdit?:    (item: FoodItem) => void;
  onItemDelete?:  (item: FoodItem) => void;
  onItemThrowAway?: (item: FoodItem) => void;
  onConsume?:     (item: FoodItem) => void;
  onAddItem?:     () => void;
  initialViewMode?: "calendar" | "timeline";
  initialDate?: string;
  initialDateToken?: string;
  initialFocusItemId?: string;
  initialFocusToken?: string;
  initialOpenExpired?: boolean;
  enablePerformanceMonitoring?: boolean;
  style?: any;
}

type ViewMode = "calendar" | "timeline";

// ─── Urgency helpers ─────────────────────────────────────────────────────────

function urgencyColor(diffDays: number) {
  if (diffDays < 0)  return "#EF4444"; // expired  – red
  if (diffDays <= 3) return "#F59E0B"; // soon     – amber
  return "#22C55E";                    // fresh    – green
}

function urgencyBg(diffDays: number) {
  if (diffDays < 0)  return "#FEF2F2";
  if (diffDays <= 3) return "#FFFBEB";
  return "#F0FDF4";
}

function diffDaysFromToday(expiryDate: string | null | undefined, todayIso: string) {
  if (!expiryDate) return 99;
  const base = new Date(todayIso + "T00:00:00").getTime();
  const target = new Date(expiryDate + "T00:00:00").getTime();
  return Math.round((target - base) / 86400000);
}

function getExpiryUrgencyLabel(expiryDate: string | null | undefined, todayIso: string): string {
  if (!expiryDate) return "";
  const diff = diffDaysFromToday(expiryDate, todayIso);

  // Past: "X days past" / "X M Y days past" (mirror of future format)
  if (diff < 0) {
    const abs = Math.abs(diff);
    if (abs === 1) return "yesterday";
    if (abs < 30) return `${abs} days past`;
    const months = Math.floor(abs / 30);
    const days = abs % 30;
    if (days === 0) return `${months} M past`;
    return `${months} M ${days} days past`;
  }

  if (diff === 0) return "Expires today";
  if (diff === 1) return "Expires tomorrow";
  if (diff < 30) return `Expires in ${diff} days`;

  const months = Math.floor(diff / 30);
  const days = diff % 30;
  if (days === 0) return `Expires in ${months} M`;
  return `Expires in ${months} M ${days} days`;
}

// ─── Core screen ─────────────────────────────────────────────────────────────

function EnhancedCalendarScreenCore({
  foodItemsService,
  onItemPress,
  onItemEdit,
  onItemDelete,
  onItemThrowAway,
  onConsume,
  initialViewMode = "calendar",
  initialDate,
  initialDateToken,
  initialFocusItemId,
  initialFocusToken,
  initialOpenExpired = false,
  enablePerformanceMonitoring = true,
  style,
}: EnhancedCalendarScreenProps) {

  // ── hooks (unchanged) ──
  const {
    selectedDate, currentMonth, items, markedDates,
    selectDate, setCurrentMonth, getDateItems,
  } = useEnhancedCalendar();

  const { startMeasurement, endMeasurement } = useCalendarPerformance({
    enableMetrics: enablePerformanceMonitoring,
    onWarning: () => {},
  });

  const backgroundColor = useThemeColor({}, "background");
  const textColor       = useThemeColor({}, "text");

  const [viewMode, setViewMode] = React.useState<ViewMode>(initialViewMode);
  const [monthPickerOpen, setMonthPickerOpen] = useState(false);
  const [tempMonth, setTempMonth] = useState(currentMonth.month);
  const [tempYear, setTempYear] = useState(currentMonth.year);
  const [timelinePastCollapsed, setTimelinePastCollapsed] = useState(true);
  const [timelineExpandedIds, setTimelineExpandedIds] = useState<Set<string>>(new Set());
  const [preferredExpandedItemId, setPreferredExpandedItemId] = useState<string | null>(null);
  const timelineItemAnimRef = useRef<Record<string, Animated.Value>>({});
  const timelineScrollRef = useRef<ScrollView>(null);
  const calendarScrollRef = useRef<ScrollView>(null);
  const dayPanelYRef = useRef(0);
  const appliedTimelineFocusKeyRef = useRef<string | null>(null);
  const scrolledTimelineFocusKeyRef = useRef<string | null>(null);
  const expiredDropdownAnim = useRef(new Animated.Value(0)).current;
  const [showExpiredBox, setShowExpiredBox] = useState(false);
  const [removeModalItem, setRemoveModalItem] = useState<FoodItem | null>(null);

  React.useEffect(() => {
    setViewMode(initialViewMode);
  }, [initialViewMode]);

  React.useEffect(() => {
    if (!initialDate) return;
    const d = new Date(initialDate + "T00:00:00");
    if (Number.isNaN(d.getTime())) return;
    const y = d.getFullYear();
    const m = d.getMonth() + 1;
    const dateStr = `${y}-${String(m).padStart(2, "0")}-${String(
      d.getDate()
    ).padStart(2, "0")}`;
    setCurrentMonth({ year: y, month: m });
    selectDate(dateStr);
  }, [initialDate, initialDateToken, setCurrentMonth, selectDate]);

  const WHEEL_ITEM_H = 32;
  const WHEEL_VISIBLE = 5; // odd count = true centered highlight
  const WHEEL_PAD = Math.floor(WHEEL_VISIBLE / 2); // 2
  const MONTHS = useMemo(
    () => ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
    []
  );
  const MONTH_LOOP_REPEATS = 40; // 12*40 = 480 rows (+ padding)
  const MONTH_LOOP_START = Math.floor(MONTH_LOOP_REPEATS / 2) * 12; // center block start
  const wheelSpacerH = WHEEL_PAD * WHEEL_ITEM_H;

  const YEAR_PAST = 2;
  const YEAR_FUTURE = 12;
  const baseYear = useMemo(() => new Date().getFullYear(), []);
  const yearStart = baseYear - YEAR_PAST;
  const yearsData = useMemo(
    () => Array.from({ length: YEAR_PAST + 1 + YEAR_FUTURE }).map((_, i) => yearStart + i),
    [yearStart]
  );

  const [monthWheelIndex, setMonthWheelIndex] = useState(
    MONTH_LOOP_START + (currentMonth.month - 1)
  );
  const [yearWheelIndex, setYearWheelIndex] = useState(() => {
    const idx = yearsData.indexOf(currentMonth.year);
    return idx === -1 ? YEAR_PAST : idx;
  });

  // Multiple items can show action buttons; Set of expanded item ids
  const [expandedItemIds, setExpandedItemIds] = useState<Set<string>>(
    () => new Set()
  );
  const dayItemAnimRef = useRef<Record<string, Animated.Value>>({});

  const monthWheelRef = useRef<FlatList<any>>(null);
  const yearWheelRef = useRef<FlatList<any>>(null);

  const scrollWheelToIndex = useCallback(
    (ref: React.RefObject<FlatList<any>>, index: number, animated: boolean) => {
      // With top/bottom padding equal to wheelSpacerH and highlight sitting at
      // (WHEEL_PAD * WHEEL_ITEM_H), the centered index maps to offset = index * rowHeight.
      const offset = Math.max(0, index * WHEEL_ITEM_H);
      ref.current?.scrollToOffset({ offset, animated });
    },
    []
  );

  const todayStr = useMemo(() => new Date().toISOString().split("T")[0], []);
  const { width: screenWidth } = useWindowDimensions();

  const slideTranslate = useRef(new Animated.Value(0)).current;
  const slideTarget = useSharedValue(0);

  const switchViewMode = useCallback((next: ViewMode) => {
    if (next === viewMode) return;
    setViewMode(next);
  }, [viewMode]);

  useEffect(() => {
    const target = viewMode === "calendar" ? 0 : -screenWidth;
    slideTarget.value = target;
    Animated.spring(slideTranslate, {
      toValue: target,
      useNativeDriver: true,
      damping: 20,
      stiffness: 200,
    }).start();
  }, [viewMode, screenWidth, slideTranslate, slideTarget]);

  const runSpringTo = useCallback(
    (target: number) => {
      Animated.spring(slideTranslate, {
        toValue: target,
        useNativeDriver: true,
        damping: 22,
        stiffness: 220,
      }).start();
    },
    [slideTranslate]
  );

  const viewModeSwipeGesture = useMemo(() => {
    const SWIPE_THRESHOLD = screenWidth * 0.25;
    const VELOCITY_THRESHOLD = 300;
    return Gesture.Pan()
      .activeOffsetX([-25, 25])
      .failOffsetY([-30, 30])
      .onUpdate((e: PanGestureHandlerEventPayload) => {
        const rest = slideTarget.value;
        const next = Math.min(0, Math.max(-screenWidth, rest + e.translationX));
        slideTranslate.setValue(next);
      })
      .onEnd((e: PanGestureHandlerEventPayload) => {
        const rest = slideTarget.value;
        const finalX = rest + e.translationX;
        const goTimeline = e.velocityX < -VELOCITY_THRESHOLD || (rest === 0 && finalX < -SWIPE_THRESHOLD);
        const goCalendar = e.velocityX > VELOCITY_THRESHOLD || (rest === -screenWidth && finalX > -screenWidth + SWIPE_THRESHOLD);
        const newTarget = goTimeline ? -screenWidth : goCalendar ? 0 : rest;
        if (newTarget !== rest) {
          runOnJS(setViewMode)(newTarget === 0 ? "calendar" : "timeline");
        }
        slideTarget.value = newTarget;
        runOnJS(runSpringTo)(newTarget);
      });
  }, [screenWidth, slideTranslate, slideTarget, runSpringTo]);

  // ── icon renderer ──
  const renderAssetIcon = useCallback((asset: any, size: number, bg?: string) => {
    const Comp = asset?.default ?? asset;
    const wrapStyle = [S.iconWrap, bg ? { backgroundColor: bg, borderColor: "transparent" } : null];
    if (typeof Comp === "function") {
      return <View style={wrapStyle}><Comp width={size} height={size} /></View>;
    }
    if (typeof asset === "number") {
      return (
        <View style={wrapStyle}>
          <Image source={asset} style={{ width: size, height: size }} resizeMode="contain" />
        </View>
      );
    }
    return null;
  }, []);

  // ── handlers ──
  const handleDatePress = useCallback((day: any) => {
    if (!day?.dateString) return;
    const next = day.dateString;
    const current = selectedDate ?? todayStr;
    if (next === current) return;
    startMeasurement();
    selectDate(next);
    endMeasurement("date selection");
  }, [selectedDate, todayStr, selectDate, startMeasurement, endMeasurement]);

  const handleMonthChange = useCallback((month: any) => {
    startMeasurement();
    setCurrentMonth({ year: month.year, month: month.month });
    endMeasurement("month change");
  }, [setCurrentMonth, startMeasurement, endMeasurement]);

  // ── derived data ──
  const selectedLabel = useMemo(() => {
    const d = selectedDate ?? todayStr;
    const date = new Date(d + "T00:00:00");
    const isToday    = d === todayStr;
    const tomorrow   = new Date(todayStr + "T00:00:00");
    tomorrow.setDate(tomorrow.getDate() + 1);
    const isTomorrow = d === tomorrow.toISOString().split("T")[0];
    if (isToday)    return "Today";
    if (isTomorrow) return "Tomorrow";
    return date.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" });
  }, [selectedDate, todayStr]);

  const itemsForSelectedDate = useMemo(() => {
    return getDateItems(selectedDate ?? todayStr);
  }, [getDateItems, selectedDate, todayStr]);

  const sortedDayItems = useMemo(() => {
    return [...itemsForSelectedDate].sort((a, b) => {
      const da = diffDaysFromToday(a.expiry_date as any, todayStr);
      const db = diffDaysFromToday(b.expiry_date as any, todayStr);
      return da - db;
    });
  }, [itemsForSelectedDate, todayStr]);

  React.useEffect(() => {
    // Single source of truth for which day item is expanded.
    // If navigation asks us to focus an item on this date, prefer that item.
    if (initialViewMode === "calendar" && initialFocusItemId) {
      const targetId = String(initialFocusItemId);
      const existsOnSelectedDate = sortedDayItems.some(
        (it) => String(it.id) === targetId
      );
      if (existsOnSelectedDate) {
        setExpandedItemIds(new Set([targetId]));
        sortedDayItems.forEach((it) => {
          const id = String(it.id);
          const toValue = id === targetId ? 1 : 0;
          const anim = dayItemAnimRef.current[id];
          if (anim) anim.setValue(toValue);
        });
        return;
      }
    }

    const firstId = sortedDayItems[0]?.id;
    setExpandedItemIds(firstId == null ? new Set() : new Set([firstId]));
  }, [
    selectedDate,
    sortedDayItems,
    initialViewMode,
    initialFocusItemId,
    initialFocusToken,
  ]);

  useLayoutEffect(() => {
    if (initialViewMode !== "calendar" || !initialFocusItemId) return;
    const targetId = String(initialFocusItemId);
    const existsOnSelectedDate = sortedDayItems.some((it) => String(it.id) === targetId);
    if (!existsOnSelectedDate) return;

    let task: { cancel?: () => void } | null = null;
    const t = setTimeout(() => {
      task = InteractionManager.runAfterInteractions(() => {
        calendarScrollRef.current?.scrollTo({
          y: Math.max(0, dayPanelYRef.current - 24),
          animated: true,
        });
      });
    }, 120);

    return () => {
      clearTimeout(t);
      task?.cancel?.();
    };
  }, [initialViewMode, initialFocusItemId, initialFocusToken, sortedDayItems]);

  const toggleDayItemExpanded = useCallback((itemId: string) => {
    setExpandedItemIds((prev) => {
      const next = new Set(prev);
      if (next.has(itemId)) next.delete(itemId);
      else next.add(itemId);
      return next;
    });
  }, []);

  const DAY_ACTION_ROW_H = 44;
  React.useEffect(() => {
    const dur = 220;
    const easing = Easing.bezier(0.25, 0.1, 0.25, 1);
    sortedDayItems.forEach((item) => {
      const isExpanded = expandedItemIds.has(item.id);
      if (!dayItemAnimRef.current[item.id]) {
        dayItemAnimRef.current[item.id] = new Animated.Value(isExpanded ? 1 : 0);
      } else {
        Animated.timing(dayItemAnimRef.current[item.id], {
          toValue: isExpanded ? 1 : 0,
          duration: dur,
          easing,
          useNativeDriver: false,
        }).start();
      }
    });
  }, [expandedItemIds, sortedDayItems]);

  const selectedDateHeader = useMemo(() => {
    const iso = selectedDate ?? todayStr;
    const d = new Date(iso + "T00:00:00");
    const weekday = d.toLocaleDateString(undefined, { weekday: "long" });
    const monthName = d.toLocaleDateString(undefined, { month: "long" });
    const day = d.getDate();
    const year = d.getFullYear();
    const count = itemsForSelectedDate.length;
    const isToday = iso === todayStr;

    let badgeLabel = "All clear";
    let badgeBg = "#F1F5F9";
    let badgeColor = "#64748B";
    let badgeBorder: string | undefined = "#E5E7EB";

    let hasUrgent = false;
    for (const item of itemsForSelectedDate) {
      const diff = diffDaysFromToday(item.expiry_date as any, todayStr);
      if (diff <= 3) {
        hasUrgent = true;
        break;
      }
    }

    if (hasUrgent) {
      badgeLabel = "⚠ Act soon";
      badgeBg = "#FEF9C3";
      badgeColor = "#92400E";
      badgeBorder = undefined;
    } else if (count === 0) {
      badgeLabel = "All clear";
      badgeBg = "#F1F5F9";
      badgeColor = "#64748B";
      badgeBorder = "#E5E7EB";
    }

    // Common expiry: when all items share the same expiry, show pill once at bottom of last item
    let commonExpiryLabel: string | null = null;
    let commonExpiryBg = "#DCFCE7";
    let commonExpiryColor = "#15803D";
    if (count > 0) {
      const diffs = itemsForSelectedDate.map((it) =>
        diffDaysFromToday(it.expiry_date as any, todayStr)
      );
      const unique = new Set(diffs);
      if (unique.size === 1) {
        const diff = diffs[0];
        if (diff < 0) {
          const daysPast = Math.abs(diff);
          commonExpiryLabel =
            daysPast === 0
              ? "Expired today"
              : daysPast === 1
                ? "Expired yesterday"
                : `Expired ${daysPast} days ago`;
          commonExpiryBg = "#FEE2E2";
          commonExpiryColor = "#991B1B";
        } else if (diff === 0) {
          commonExpiryLabel = "Expires today";
          commonExpiryBg = "#FEF9C3";
          commonExpiryColor = "#92400E";
        } else if (diff === 1) {
          commonExpiryLabel = "Expires tomorrow";
          commonExpiryBg = "#FEF9C3";
          commonExpiryColor = "#92400E";
        } else {
          commonExpiryLabel = `Expires in ${diff} days`;
          commonExpiryBg = "#DCFCE7";
          commonExpiryColor = "#15803D";
        }
      }
    }

    return {
      weekday,
      day,
      monthName,
      year,
      count,
      isToday,
      commonExpiryLabel,
      commonExpiryBg,
      commonExpiryColor,
      badgeLabel,
      badgeBg,
      badgeColor,
      badgeBorder,
    };
  }, [itemsForSelectedDate, selectedDate, todayStr]);

  const timelineByDate = useMemo(() => {
    const withDate = (items || []).filter((i): i is FoodItem & { expiry_date: string } => Boolean(i.expiry_date));
    const byDate = new Map<string, FoodItem[]>();
    withDate.forEach((item) => {
      const raw = item.expiry_date!;
      const d = raw.includes("T") ? raw.split("T")[0]! : raw;
      if (!byDate.has(d)) byDate.set(d, []);
      byDate.get(d)!.push(item);
    });
    const sortedDates = Array.from(byDate.keys()).sort();
    const past: { dateStr: string; items: FoodItem[] }[] = [];
    const upcoming: { dateStr: string; items: FoodItem[] }[] = [];
    sortedDates.forEach((dateStr) => {
      const group = { dateStr, items: byDate.get(dateStr)! };
      if (dateStr < todayStr) past.push(group);
      else upcoming.push(group);
    });
    return { past, upcoming };
  }, [items, todayStr]);

  const firstTimelineItemId = useMemo(() => {
    const fromPast = timelineByDate.past[0]?.items[0]?.id;
    if (fromPast) return fromPast;
    return timelineByDate.upcoming[0]?.items[0]?.id ?? null;
  }, [timelineByDate.past, timelineByDate.upcoming]);

  React.useEffect(() => {
    if (initialViewMode !== "timeline") return;
    const focusKey = `${initialFocusToken ?? "no-token"}:${initialFocusItemId ?? "no-item"}:${initialOpenExpired ? "expired-open" : "expired-closed"}`;
    if (appliedTimelineFocusKeyRef.current === focusKey) return;
    const targetIdRaw = initialFocusItemId || firstTimelineItemId;
    const targetId = targetIdRaw ? String(targetIdRaw) : null;
    if (!targetId) return;

    appliedTimelineFocusKeyRef.current = focusKey;
    if (initialOpenExpired) {
      setTimelinePastCollapsed(false);
    }
    // Ensure the intended item action row is the one opened.
    setPreferredExpandedItemId(targetId);
    setTimelineExpandedIds(new Set([targetId]));
  }, [
    initialViewMode,
    initialFocusItemId,
    initialFocusToken,
    initialOpenExpired,
    firstTimelineItemId,
  ]);

  React.useEffect(() => {
    if (initialViewMode !== "timeline" || !initialFocusItemId) return;
    const focusKey = `${initialFocusToken ?? "no-token"}:${initialFocusItemId}:${initialOpenExpired ? "expired-open" : "expired-closed"}`;
    if (scrolledTimelineFocusKeyRef.current === focusKey) return;

    const targetId = String(initialFocusItemId);
    const estimateTargetY = () => {
      const groups: Array<{ items: FoodItem[]; kind: "past" | "upcoming" }> = [];
      if (!timelinePastCollapsed) {
        timelineByDate.past.forEach((g) => groups.push({ items: g.items, kind: "past" }));
      }
      timelineByDate.upcoming.forEach((g) => groups.push({ items: g.items, kind: "upcoming" }));

      let y = 0;
      for (const g of groups) {
        // Approx header block per date section
        y += g.kind === "past" ? 56 : 48;
        for (const it of g.items) {
          if (String(it.id) === targetId) {
            return Math.max(0, y - 36);
          }
          // Approx expanded item card height budget
          y += timelineExpandedIds.has(it.id) ? 124 : 76;
        }
        y += 10; // section spacing
      }
      return 0;
    };

    let task: { cancel?: () => void } | null = null;
    const t = setTimeout(() => {
      task = InteractionManager.runAfterInteractions(() => {
        timelineScrollRef.current?.scrollTo({
          y: estimateTargetY(),
          animated: true,
        });
        scrolledTimelineFocusKeyRef.current = focusKey;
      });
    }, initialOpenExpired ? 220 : 120);
    return () => {
      clearTimeout(t);
      task?.cancel?.();
    };
  }, [
    initialViewMode,
    initialFocusItemId,
    initialFocusToken,
    initialOpenExpired,
    showExpiredBox,
    timelinePastCollapsed,
    timelineExpandedIds,
    timelineByDate.past.length,
    timelineByDate.upcoming.length,
  ]);

  const toggleTimelineItemExpanded = useCallback((itemId: string) => {
    // User interaction takes over from deep-link preferred expansion.
    setPreferredExpandedItemId(null);
    setTimelineExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(itemId)) next.delete(itemId);
      else next.add(itemId);
      return next;
    });
  }, []);

  const timelineItemsFlat = useMemo(() => {
    const list: FoodItem[] = [];
    timelineByDate.past.forEach((g) => list.push(...g.items));
    timelineByDate.upcoming.forEach((g) => list.push(...g.items));
    return list;
  }, [timelineByDate.past, timelineByDate.upcoming]);

  React.useEffect(() => {
    const dur = 220;
    const easing = Easing.bezier(0.25, 0.1, 0.25, 1);
    timelineItemsFlat.forEach((item) => {
      const isExpanded = timelineExpandedIds.has(item.id);
      if (!timelineItemAnimRef.current[item.id]) {
        timelineItemAnimRef.current[item.id] = new Animated.Value(isExpanded ? 1 : 0);
      } else {
        Animated.timing(timelineItemAnimRef.current[item.id], {
          toValue: isExpanded ? 1 : 0,
          duration: dur,
          easing,
          useNativeDriver: false,
        }).start();
      }
    });
  }, [timelineExpandedIds, timelineItemsFlat]);

  React.useEffect(() => {
    if (!timelinePastCollapsed) {
      setShowExpiredBox(true);
    } else {
      setShowExpiredBox(false);
    }
  }, [timelinePastCollapsed]);

  const handleThrowAway = useCallback(async () => {
    if (!removeModalItem) return;
    try {
      if (onItemThrowAway) {
        await Promise.resolve(onItemThrowAway(removeModalItem));
      } else {
        const qty =
          typeof removeModalItem.quantity === "number" &&
          removeModalItem.quantity > 0
            ? removeModalItem.quantity
            : 1;
        if (foodItemsService?.logUsage) {
          await foodItemsService.logUsage(removeModalItem.id, "wasted", qty);
        } else {
          onItemDelete?.(removeModalItem);
        }
      }
    } catch (e) {
      console.error("Failed to throw away item:", e);
    } finally {
      setRemoveModalItem(null);
    }
  }, [removeModalItem, foodItemsService, onItemDelete, onItemThrowAway]);

  const handleDeleteItem = useCallback(() => {
    if (!removeModalItem) return;
    onItemDelete?.(removeModalItem);
    setRemoveModalItem(null);
  }, [removeModalItem, onItemDelete]);

  const formatExpiryHint = useCallback((expiryDate?: string) => {
    if (!expiryDate) return "no expiry";
    const diff = Math.round(
      (new Date(expiryDate + "T00:00:00").getTime() - new Date(todayStr + "T00:00:00").getTime()) / 86400000
    );
    if (diff < 0)  return `${Math.abs(diff)}d ago`;
    if (diff === 0) return "today";
    if (diff === 1) return "tomorrow";
    return `in ${diff}d`;
  }, [todayStr]);

  // ── month nav ──
  const monthLabel = useMemo(() => {
    return new Date(currentMonth.year, currentMonth.month - 1, 1)
      .toLocaleDateString(undefined, { month: "long", year: "numeric" });
  }, [currentMonth.month, currentMonth.year]);

  const goPrevMonth = useCallback(() => {
    const m = currentMonth.month === 1  ? 12 : currentMonth.month - 1;
    const y = currentMonth.month === 1  ? currentMonth.year - 1 : currentMonth.year;
    setCurrentMonth({ year: y, month: m });
  }, [currentMonth, setCurrentMonth]);

  const goNextMonth = useCallback(() => {
    const m = currentMonth.month === 12 ? 1  : currentMonth.month + 1;
    const y = currentMonth.month === 12 ? currentMonth.year + 1 : currentMonth.year;
    setCurrentMonth({ year: y, month: m });
  }, [currentMonth, setCurrentMonth]);

  // ── swipe gesture ──
  const panGesture = Gesture.Pan()
    .activeOffsetX([-20, 20])
    .onEnd((e: PanGestureHandlerEventPayload) => {
      if      (e.translationX > 50)  goPrevMonth();
      else if (e.translationX < -50) goNextMonth();
    });

  // ── calendar theme ──
  const calTheme = useMemo(
    () => ({
      backgroundColor: "transparent",
      calendarBackground: "transparent",
      textSectionTitleColor: "#94A3B8",
      selectedDayBackgroundColor: "#22C55E",
      selectedDayTextColor: "#FFFFFF",
      todayTextColor: "#22C55E",
      dayTextColor: textColor,
      textDisabledColor: "#D1D5DB",
      dotColor: "#22C55E",
      selectedDotColor: "#FFFFFF",
      arrowColor: "#22C55E",
      monthTextColor: textColor,
      textDayFontWeight: "500" as const,
      textMonthFontWeight: "700" as const,
      textDayHeaderFontWeight: "600" as const,
      textDayFontSize: 15,
      textMonthFontSize: 17,
      textDayHeaderFontSize: 12,
      // Weekday typography + subtle divider (premium)
      "stylesheet.calendar.header": {
        week: {
          marginTop: 6,
          marginBottom: 0,
          paddingBottom: 8,
          borderBottomWidth: StyleSheet.hairlineWidth,
          borderBottomColor: "#E5E7EB",
          flexDirection: "row",
          justifyContent: "space-around",
        },
        dayHeader: {
          width: 36,
          textAlign: "center",
          fontSize: 11,
          fontWeight: "600",
          color: "#9CA3AF",
          textTransform: "uppercase",
          letterSpacing: 0.4,
        },
      },
    }),
    [textColor]
  );

  // ═══════════════════════════════════════════════════════════════════════════
  // ITEM CARD
  // ═══════════════════════════════════════════════════════════════════════════

  const renderTimelineDayItem = useCallback(
    (
      item: FoodItem,
      isExpanded: boolean,
      onToggleExpand: () => void,
      animVal: Animated.Value,
    ) => {
      const isShelf = (item.location || "fridge") === "shelf";
      const qtyText = item.quantity
        ? formatQuantityWithUnit(item.quantity, item.unit, {
            fallbackUnit: "pcs",
          })
        : "";
      const CategoryIcon = getCategoryIconComponent(item.category);
      const diff = diffDaysFromToday(item.expiry_date as any, todayStr);
      const iconColor = diff < 0 ? "#B91C1C" : "#16A34A";

      return (
        <View key={item.id} style={S.timelineItemCard}>
          <Pressable style={S.dayItemCardInner} onPress={onToggleExpand}>
            <View style={S.timelineItemIconTile}>
              <CategoryIcon size={22} color={iconColor} weight="fill" />
            </View>
            <View style={S.dayItemBody}>
              <View style={S.dayItemHeaderRow}>
                <View style={S.dayItemTextCol}>
                  <Text style={S.dayItemName} numberOfLines={1}>
                    {item.name}
                  </Text>
                  <View style={S.dayItemMetaRow}>
                    <Image
                      source={isShelf ? shelfIconAsset : fridgeIconAsset}
                      style={S.dayItemLocationIcon}
                      resizeMode="contain"
                    />
                    <Text style={S.dayItemMetaText}>
                      {isShelf ? "Shelf" : "Fridge"}
                      {qtyText ? ` · ${qtyText}` : ""}
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          </Pressable>
          <Animated.View
            style={[
              S.dayItemActionRowWrap,
              {
                height: animVal.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, DAY_ACTION_ROW_H],
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
            <View style={S.dayItemActionRow}>
              <TouchableOpacity
                style={S.dayItemActionBtn}
                onPress={() => onItemEdit?.(item)}
                activeOpacity={0.7}
              >
                <Ionicons name="create-outline" size={14} color="#6B7280" />
                <Text style={S.dayItemActionEdit}>Edit</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={S.dayItemUseBtn}
                onPress={() => (onConsume ? onConsume(item) : onItemPress?.(item))}
                activeOpacity={0.7}
              >
                <Text style={S.dayItemUseBtnText}>Consume</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={S.dayItemActionBtn}
                onPress={() => setRemoveModalItem(item)}
                activeOpacity={0.7}
              >
                <Ionicons name="trash-outline" size={14} color="#EF4444" />
              </TouchableOpacity>
            </View>
          </Animated.View>
        </View>
      );
    },
    [onItemEdit, onConsume, onItemPress, onItemDelete, todayStr]
  );

  const formatTimelineDate = useCallback((dateStr: string) => {
    const d = new Date(dateStr + "T00:00:00");
    const day = d.getDate();
    const month = d.toLocaleDateString(undefined, { month: "long" });
    if (dateStr === todayStr) return `Today, ${day} ${month}`;
    const tomorrow = new Date(todayStr + "T00:00:00");
    tomorrow.setDate(tomorrow.getDate() + 1);
    if (dateStr === tomorrow.toISOString().split("T")[0]) return `Tomorrow, ${day} ${month}`;
    const weekday = d.toLocaleDateString(undefined, { weekday: "long" });
    return `${weekday}, ${day} ${month}`;
  }, [todayStr]);

  // ═══════════════════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════════════════

  return (
    <View style={[S.root, { backgroundColor }, style]}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>

        {/* Green banner header with embedded toggle */}
        <View style={S.banner}>
          <View style={S.toggleBar}>
            {(["calendar", "timeline"] as ViewMode[]).map(mode => (
              <TouchableOpacity
                key={mode}
                onPress={() => switchViewMode(mode)}
                activeOpacity={0.8}
                style={[S.toggleBtn, viewMode === mode && S.toggleBtnActive]}
              >
                <Ionicons
                  name={mode === "calendar" ? "calendar-outline" : "list-outline"}
                  size={14}
                  color={viewMode === mode ? "#15803D" : "#FFFFFF"}
                  style={{ marginRight: 5, opacity: viewMode === mode ? 1 : 0.85 }}
                />
                <Text style={[S.toggleText, viewMode === mode && S.toggleTextActive]}>
                  {mode === "calendar" ? "Calendar" : "Timeline"}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <GestureDetector gesture={viewModeSwipeGesture}>
          <View style={{ flex: 1, overflow: "hidden" }}>
            <Animated.View
              style={{
                flexDirection: "row",
                width: screenWidth * 2,
                flex: 1,
                transform: [{ translateX: slideTranslate }],
              }}
            >
              {/* Calendar panel */}
              <View style={{ width: screenWidth, flex: 1 }}>
            <ScrollView
              ref={calendarScrollRef}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={S.calScrollContent}
              keyboardShouldPersistTaps="handled"
            >
              {/* Month navigation */}
              <View style={S.monthNav}>
                <TouchableOpacity onPress={goPrevMonth} style={S.monthNavBtn} activeOpacity={0.7}>
                  <Ionicons name="chevron-back" size={16} color="#15803D" />
                </TouchableOpacity>
                <TouchableOpacity
                  style={S.monthLabelButton}
                  activeOpacity={0.8}
                  onPress={() => {
                    setTempMonth(currentMonth.month);
                    setTempYear(currentMonth.year);
                    setMonthPickerOpen(true);
                    // Ensure both wheels open centered on current month/year
                    requestAnimationFrame(() => {
                      const mIdx = MONTH_LOOP_START + (currentMonth.month - 1);
                      const yIdx = Math.max(0, yearsData.indexOf(currentMonth.year));
                      setMonthWheelIndex(mIdx);
                      setYearWheelIndex(yIdx);
                      scrollWheelToIndex(monthWheelRef, mIdx, false);
                      scrollWheelToIndex(yearWheelRef, yIdx, false);
                    });
                  }}
                >
                  <Text style={S.monthLabel}>{monthLabel}</Text>
                  <Ionicons
                    name={monthPickerOpen ? "chevron-up" : "chevron-down"}
                    size={16}
                    color="#15803D"
                    style={{ marginLeft: 6 }}
                  />
                </TouchableOpacity>
                <TouchableOpacity onPress={goNextMonth} style={S.monthNavBtn} activeOpacity={0.7}>
                  <Ionicons name="chevron-forward" size={16} color="#15803D" />
                </TouchableOpacity>
              </View>

              {/* Calendar grid */}
              <GestureDetector gesture={panGesture}>
                <View style={S.calCard}>
                  <Calendar
                    key={`${currentMonth.year}-${currentMonth.month}`} // force remount when month changes
                    current={`${currentMonth.year}-${String(currentMonth.month).padStart(2, "0")}-01`}
                    onDayPress={handleDatePress}
                    onMonthChange={handleMonthChange}
                    markedDates={markedDates}
                    markingType="multi-dot"
                    theme={calTheme}
                    firstDay={1}
                    hideExtraDays={true}
                    hideArrows={true}
                    hideDayNames={false}
                    monthFormat="MMMM yyyy"
                    renderHeader={() => <View />}
                    dayComponent={({ date, state }) => {
                      const ds         = date?.dateString ?? "";
                      const isSelected = (selectedDate ?? todayStr) === ds;
                      const isToday    = ds === todayStr;
                      const disabled   = state === "disabled";

                      const dayItems: FoodItem[] = ds ? getDateItems(ds) : [];

                      // Group by category label and sum quantities
                      const categoryMap = new Map<string, { quantity: number; item: FoodItem }>();
                      dayItems.forEach((item: FoodItem) => {
                        const key = (item.category || "Other").trim();
                        const prev = categoryMap.get(key);
                        const qty = typeof item.quantity === "number" ? item.quantity : 1;
                        if (prev) {
                          prev.quantity += qty;
                        } else {
                          categoryMap.set(key, { quantity: qty, item });
                        }
                      });

                      const pillEntries = Array.from(categoryMap.entries());
                      const hasPills = pillEntries.length > 0;

                      const todayDate = new Date(todayStr + "T00:00:00");
                      const dsDate = ds ? new Date(ds + "T00:00:00") : todayDate;
                      const diffDays = Math.round(
                        (dsDate.getTime() - todayDate.getTime()) / 86400000
                      );
                      const pillColor = urgencyColor(diffDays);
                      const pillBg    = urgencyBg(diffDays);

                      return (
                        <TouchableOpacity
                          activeOpacity={0.75}
                          onPress={() => ds && handleDatePress({ dateString: ds })}
                          style={[
                            S.dayCell,
                            hasPills ? S.dayCellWithPills : S.dayCellEmpty,
                            disabled && S.dayCellDisabled,
                          ]}
                        >
                          <View
                            style={[
                              S.dayNumWrap,
                              isSelected && S.dayNumWrapSelected,
                              isToday && S.dayNumWrapToday,
                              isSelected && isToday && S.dayNumWrapTodaySelected,
                            ]}
                          >
                            <Text
                              style={[
                                S.dayText,
                                isSelected && S.dayTextSelected,
                                isToday && S.dayTextToday,
                                isSelected && isToday && S.dayTextTodaySelected,
                                disabled && S.dayTextDisabled,
                              ]}
                            >
                              {date?.day}
                            </Text>
                          </View>

                          {/* Category pills row */}
                          <View style={S.dayPillsRow}>
                            {pillEntries.slice(0, 2).map(([cat, { quantity, item }]) => {
                              const IconComp = getCategoryIconComponent(item.category);
                              return (
                                <View
                                  key={cat}
                                  style={[
                                    S.dayPillBadge,
                                    {
                                      backgroundColor: pillBg,
                                      borderColor: pillColor + "40",
                                    },
                                  ]}
                                >
                                  <IconComp size={10} color={pillColor} weight="fill" />
                                  <Text style={[S.dayPillText, { color: pillColor }]}>
                                    ×{quantity}
                                  </Text>
                                </View>
                              );
                            })}
                            {pillEntries.length > 2 && (
                              <View
                                style={[
                                  S.dayMorePill,
                                  { backgroundColor: pillBg, borderColor: pillColor + "55" },
                                ]}
                              >
                                <Text style={[S.dayMoreText, { color: pillColor }]}>
                                  +{pillEntries.length - 2}
                                </Text>
                              </View>
                            )}
                          </View>
                        </TouchableOpacity>
                      );
                    }}
                  />
                </View>
              </GestureDetector>

              {/* ── Selected day panel ── */}
              <View
                style={S.dayPanel}
                onLayout={(e) => {
                  dayPanelYRef.current = e.nativeEvent.layout.y;
                }}
              >
                  {/* Panel header */}
                  <View style={S.dayPanelHeader}>
                    <View style={S.dayPanelHeaderLeft}>
                      <Text style={S.dayPanelWeekday}>
                        {selectedDateHeader.isToday
                          ? "TODAY"
                          : selectedDateHeader.weekday.toUpperCase()}
                      </Text>
                      <Text style={S.dayPanelDayMonth}>
                        {selectedDateHeader.day} {selectedDateHeader.monthName}
                      </Text>
                      <Text style={S.dayPanelYear}>
                        {selectedDateHeader.year}
                      </Text>
                      {selectedDateHeader.count > 0 && (
                        <Text style={S.dayPanelCount}>
                          {`${selectedDateHeader.count} item${
                            selectedDateHeader.count === 1 ? "" : "s"
                          } expiring`}
                        </Text>
                      )}
                    </View>
                  </View>

                  {itemsForSelectedDate.length === 0 ? (
                    <View style={S.emptyDay}>
                      <Text style={S.emptyDayTitle}>
                        {selectedDateHeader.isToday
                          ? "Nothing expiring today"
                          : "Nothing expiring on this day"}
                      </Text>
                    </View>
                  ) : (
                    <View style={S.dayItems}>
                      {sortedDayItems.map((item, index) => {
                          const isExpanded = expandedItemIds.has(item.id);
                          const animVal =
                            dayItemAnimRef.current[item.id] ??
                            (dayItemAnimRef.current[item.id] = new Animated.Value(
                              isExpanded ? 1 : 0
                            ));
                          const diff = diffDaysFromToday(
                            item.expiry_date as any,
                            todayStr
                          );

                          let cardBg = "#F0FDF4";
                          let iconBg = "#DCFCE7";
                          let nameColor = "#15803D";
                          let metaColor = "#16A34A";
                          let tagBg = "#DCFCE7";
                          let tagColor = "#15803D";
                          let tagLabel = "";

                          let barColor = "#22C55E";
                          if (diff < 0) {
                            barColor = "#EF4444";
                            cardBg = "#FEF2F2";
                            iconBg = "#FEE2E2";
                            nameColor = "#991B1B";
                            metaColor = "#EF4444";
                            tagBg = "#FEE2E2";
                            tagColor = "#991B1B";
                            const daysPast = Math.abs(diff);
                            tagLabel =
                              daysPast === 0
                                ? "Expired today"
                                : daysPast === 1
                                  ? "Expired yesterday"
                                  : `Expired ${daysPast} days ago`;
                          } else if (diff <= 3) {
                            barColor = "#F59E0B";
                            cardBg = "#FFFBEB";
                            iconBg = "#FEF9C3";
                            nameColor = "#92400E";
                            metaColor = "#B45309";
                            tagBg = "#FEF9C3";
                            tagColor = "#92400E";
                            if (diff === 0) {
                              tagLabel = "Expires today";
                            } else if (diff === 1) {
                              tagLabel = "Expires tomorrow";
                            } else {
                              tagLabel = `Expires in ${diff} days`;
                            }
                          } else {
                            barColor = "#22C55E";
                            cardBg = "#F0FDF4";
                            iconBg = "#DCFCE7";
                            nameColor = "#15803D";
                            metaColor = "#16A34A";
                            tagBg = "#DCFCE7";
                            tagColor = "#15803D";
                            tagLabel =
                              diff === 1
                                ? "Expires tomorrow"
                                : `Expires in ${diff} days`;
                          }

                          const isShelf =
                            (item.location || "fridge") === "shelf";
                          const qtyText = item.quantity
                            ? formatQuantityWithUnit(item.quantity, item.unit, {
                                fallbackUnit: "pcs",
                              })
                            : "";

                          const CategoryIcon =
                            getCategoryIconComponent(item.category);
                          const iconNode = (
                            <CategoryIcon
                              size={22}
                              color={diff < 0 ? "#B91C1C" : "#16A34A"}
                              weight="fill"
                            />
                          );

                          return (
                            <View key={item.id} style={S.dayItemCard}>
                              <Pressable
                                style={S.dayItemContentRow}
                                onPress={() =>
                                  toggleDayItemExpanded(item.id)
                                }
                              >
                                <View style={S.dayItemCardInner}>
                                  <View style={S.dayItemIconTile}>
                                    {iconNode}
                                  </View>
                                  <View style={S.dayItemBody}>
                                    <View style={S.dayItemHeaderRow}>
                                      <View style={S.dayItemTextCol}>
                                        <Text
                                          style={S.dayItemName}
                                          numberOfLines={1}
                                        >
                                          {item.name}
                                        </Text>
                                        <View style={S.dayItemMetaRow}>
                                          <Image
                                            source={
                                              isShelf
                                                ? shelfIconAsset
                                                : fridgeIconAsset
                                            }
                                            style={S.dayItemLocationIcon}
                                            resizeMode="contain"
                                          />
                                          <Text style={S.dayItemMetaText}>
                                            {isShelf ? "Shelf" : "Fridge"}
                                            {qtyText ? ` · ${qtyText}` : ""}
                                          </Text>
                                        </View>
                                      </View>
                                      {tagLabel &&
                                      !selectedDateHeader.commonExpiryLabel ? (
                                        <View
                                          style={[
                                            S.dayItemTag,
                                            { backgroundColor: tagBg },
                                          ]}
                                        >
                                          <Text
                                            style={[
                                              S.dayItemTagText,
                                              { color: tagColor },
                                            ]}
                                          >
                                            {tagLabel}
                                          </Text>
                                        </View>
                                      ) : null}
                                    </View>
                                  </View>
                                </View>
                              </Pressable>
                              <Animated.View
                                style={[
                                  S.dayItemActionRowWrap,
                                  {
                                    height: animVal.interpolate({
                                      inputRange: [0, 1],
                                      outputRange: [0, DAY_ACTION_ROW_H],
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
                              <View style={S.dayItemActionRow}>
                                <TouchableOpacity
                                  style={S.dayItemActionBtn}
                                  onPress={() => onItemEdit?.(item)}
                                  activeOpacity={0.7}
                                >
                                  <Ionicons
                                    name="create-outline"
                                    size={14}
                                    color="#6B7280"
                                  />
                                  <Text style={S.dayItemActionEdit}>Edit</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                  style={S.dayItemUseBtn}
                                  onPress={() => (onConsume ? onConsume(item) : onItemPress?.(item))}
                                  activeOpacity={0.7}
                                >
                                  <Text style={S.dayItemUseBtnText}>Consume</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                  style={S.dayItemActionBtn}
                                  onPress={() => setRemoveModalItem(item)}
                                  activeOpacity={0.7}
                                >
                                  <Ionicons
                                    name="trash-outline"
                                    size={14}
                                    color="#EF4444"
                                  />
                                </TouchableOpacity>
                              </View>
                              </Animated.View>
                            </View>
                          );
                        })}
                      {selectedDateHeader.commonExpiryLabel ? (
                        <View style={S.dayItemCommonExpiryWrap}>
                          <View
                            style={[
                              S.dayItemCommonExpiryPill,
                              {
                                backgroundColor:
                                  selectedDateHeader.commonExpiryBg,
                              },
                            ]}
                          >
                            <Text
                              style={[
                                S.dayItemTagText,
                                {
                                  color:
                                    selectedDateHeader.commonExpiryColor,
                                },
                              ]}
                            >
                              {selectedDateHeader.commonExpiryLabel}
                            </Text>
                          </View>
                        </View>
                      ) : null}
                    </View>
                  )}
                </View>
            </ScrollView>
              </View>
              {/* Timeline panel */}
              <View style={{ width: screenWidth, flex: 1 }}>
            <ScrollView
              ref={timelineScrollRef}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={S.timelineScrollContent}
            >
              {timelineByDate.past.length === 0 && timelineByDate.upcoming.length === 0 ? (
                <View style={S.emptyTimeline}>
                  <Text style={S.emptyTimelineTitle}>No items with expiry dates</Text>
                  <Text style={S.emptyTimelineSub}>Add items with expiry dates to track them here</Text>
                </View>
              ) : (
                <>
                  {timelineByDate.past.length > 0 && (
                    <View style={S.timelineSection}>
                      <View style={S.timelineExpiredPillWrap}>
                        <TouchableOpacity
                          style={S.timelineExpiredPill}
                          onPress={() => setTimelinePastCollapsed((c) => !c)}
                          activeOpacity={0.8}
                        >
                          <Text style={S.timelineExpiredPillTitle}>Expired</Text>
                          <Text style={S.timelineExpiredPillCount}>
                            {(() => {
                              const n = timelineByDate.past.reduce((s, g) => s + g.items.length, 0);
                              return n === 1 ? "1 item" : `${n} items`;
                            })()}
                          </Text>
                          <Ionicons
                            name={timelinePastCollapsed ? "chevron-down" : "chevron-up"}
                            size={16}
                            color="#B91C1C"
                            style={{ marginLeft: 6 }}
                          />
                        </TouchableOpacity>
                      </View>
                  {showExpiredBox && (
                    <View style={S.timelineExpiredDropdownBox}>
                      {timelineByDate.past.map(({ dateStr, items: dayItems }) => {
                        const firstWithExpiry = dayItems.find((it) => it.expiry_date);
                        const urgency =
                          firstWithExpiry && firstWithExpiry.expiry_date
                            ? getExpiryUrgencyLabel(firstWithExpiry.expiry_date, todayStr)
                            : "";

                        return (
                          <View key={dateStr} style={S.expiredDateGroupCard}>
                            <View style={S.expiredDateHeaderRow}>
                              <Text style={S.expiredDateHeaderText}>
                                {formatTimelineDate(dateStr)}
                              </Text>
                              {urgency ? (
                                <View style={S.expiredDatePill}>
                                  <Text style={S.expiredDatePillText}>{urgency}</Text>
                                </View>
                              ) : null}
                            </View>

                            <View style={S.timelineDayItems}>
                              {dayItems.map((item) => {
                                const animVal =
                                  timelineItemAnimRef.current[item.id] ??
                                  (timelineItemAnimRef.current[item.id] = new Animated.Value(
                                    timelineExpandedIds.has(item.id) ? 1 : 0,
                                  ));
                                return renderTimelineDayItem(
                                  item,
                                  preferredExpandedItemId
                                    ? String(item.id) === preferredExpandedItemId
                                    : timelineExpandedIds.has(item.id),
                                  () => toggleTimelineItemExpanded(item.id),
                                  animVal,
                                );
                              })}
                            </View>
                          </View>
                        );
                      })}
                    </View>
                  )}
                    </View>
                  )}
                  {timelineByDate.upcoming.map(({ dateStr, items: dayItems }) => {
                    const firstWithExpiry = dayItems.find((it) => it.expiry_date);
                    const urgency =
                      firstWithExpiry && firstWithExpiry.expiry_date
                        ? getExpiryUrgencyLabel(firstWithExpiry.expiry_date, todayStr)
                        : "";
                    let pillBg = "#F1F5F9";
                    let pillColor = "#64748B";
                    if (firstWithExpiry && firstWithExpiry.expiry_date) {
                      const d = diffDaysFromToday(firstWithExpiry.expiry_date, todayStr);
                      if (d < 0) {
                        pillBg = "#FEE2E2";
                        pillColor = "#B91C1C";
                      } else if (d <= 3) {
                        pillBg = "#FEF3C7";
                        pillColor = "#B45309";
                      } else {
                        pillBg = "#DCFCE7";
                        pillColor = "#15803D";
                      }
                    }
                    return (
                      <View key={dateStr} style={S.timelineDateBlock}>
                        <View style={S.timelineDateHeaderRow}>
                          <Text style={S.timelineDateHeaderText}>
                            {formatTimelineDate(dateStr)}
                          </Text>
                          {urgency ? (
                            <View style={[S.timelineDateUrgencyPill, { backgroundColor: pillBg }]}>
                              <Text
                                style={[S.timelineDateUrgencyPillText, { color: pillColor }]}
                                numberOfLines={1}
                              >
                                {urgency}
                              </Text>
                            </View>
                          ) : null}
                        </View>
                        <View style={S.timelineDayItems}>
                          {dayItems.map((item) => {
                            const animVal =
                              timelineItemAnimRef.current[item.id] ??
                              (timelineItemAnimRef.current[item.id] = new Animated.Value(
                                timelineExpandedIds.has(item.id) ? 1 : 0,
                              ));
                            return renderTimelineDayItem(
                              item,
                              preferredExpandedItemId
                                ? String(item.id) === preferredExpandedItemId
                                : timelineExpandedIds.has(item.id),
                              () => toggleTimelineItemExpanded(item.id),
                              animVal,
                            );
                          })}
                        </View>
                      </View>
                    );
                  })}
                </>
              )}
            </ScrollView>
              </View>
            </Animated.View>
          </View>
        </GestureDetector>

        {/* Remove item modal: Throw Away vs Delete */}
        <Modal
          transparent
          visible={!!removeModalItem}
          animationType="fade"
          onRequestClose={() => setRemoveModalItem(null)}
        >
          <View style={S.removeModalBackdrop}>
            <Pressable style={StyleSheet.absoluteFill} onPress={() => setRemoveModalItem(null)} />
            <View style={S.removeModalCard}>
              <Text style={S.removeModalTitle}>
                {removeModalItem ? `Remove ${removeModalItem.name}?` : "Remove item?"}
              </Text>

              <View style={S.removeOptionsRow}>
                <TouchableOpacity
                  style={[S.removeOptionSideBySide, S.removeOptionPrimary]}
                  activeOpacity={0.9}
                  onPress={handleThrowAway}
                >
                  <Ionicons name="trash-outline" size={16} color="#B91C1C" />
                  <View style={S.removeOptionTextCol}>
                    <Text style={S.removeOptionTitlePrimary}>Throw Away</Text>
                    <Text style={S.removeOptionBody}>Logged as waste</Text>
                  </View>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[S.removeOptionSideBySide, S.removeOptionSecondary]}
                  activeOpacity={0.9}
                  onPress={handleDeleteItem}
                >
                  <Ionicons name="close" size={16} color="#111827" />
                  <View style={S.removeOptionTextCol}>
                    <Text style={S.removeOptionTitleSecondary}>Delete</Text>
                    <Text style={S.removeOptionBody}>Removed from inventory</Text>
                  </View>
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={S.removeModalCancel}
                activeOpacity={0.9}
                onPress={() => setRemoveModalItem(null)}
              >
                <Text style={S.removeModalCancelText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* Month/year dropdown - two wheel columns with snap */}
        <Modal
          transparent
          visible={monthPickerOpen}
          animationType="fade"
          onRequestClose={() => setMonthPickerOpen(false)}
        >
          <View style={S.monthModalBackdrop}>
            <Pressable style={StyleSheet.absoluteFill} onPress={() => setMonthPickerOpen(false)} />
            <View style={S.monthModalCard}>
              <Text style={S.monthModalViewLabel}>View</Text>
              {/* Two-column wheel */}
              <View style={S.monthWheelRow}>
                {/* Month wheel */}
                <View style={S.monthWheelColumn}>
                  <View style={S.monthWheelBody}>
                    <View style={S.monthWheelHighlight} pointerEvents="none" />
                    <FlatList
                      ref={monthWheelRef}
                      showsVerticalScrollIndicator={false}
                      bounces={false}
                      overScrollMode="never"
                      data={Array.from({ length: 12 * MONTH_LOOP_REPEATS }).map(
                        (_, i) => MONTHS[i % 12]
                      )}
                      keyExtractor={(it, idx) => `${it}-${idx}`}
                      getItemLayout={(_, index) => ({
                        length: WHEEL_ITEM_H,
                        offset: WHEEL_ITEM_H * index,
                        index,
                      })}
                      snapToInterval={WHEEL_ITEM_H}
                      decelerationRate="fast"
                      disableIntervalMomentum
                      contentContainerStyle={[S.monthWheelContent, { paddingVertical: wheelSpacerH }]}
                      onScrollToIndexFailed={() => {}}
                      initialScrollIndex={MONTH_LOOP_START + (tempMonth - 1)}
                      onMomentumScrollEnd={(e) => {
                        const idx = Math.round(e.nativeEvent.contentOffset.y / WHEEL_ITEM_H);
                        setMonthWheelIndex(idx);
                        const raw = (Array.from({ length: 12 * MONTH_LOOP_REPEATS }).map(
                          (_, i) => MONTHS[i % 12]
                        ) as any[])[idx];
                        if (!raw) return;
                        const monthIdx = MONTHS.indexOf(raw);
                        if (monthIdx >= 0) setTempMonth(monthIdx + 1);

                        // Looping feel: if user scrolls near ends, recenter silently
                        const minSafe = 12 * 6;
                        const maxSafe = 12 * (MONTH_LOOP_REPEATS - 6);
                        const innerIdx = idx; // into repeated list
                        if (innerIdx < minSafe || innerIdx > maxSafe) {
                          scrollWheelToIndex(
                            monthWheelRef,
                            MONTH_LOOP_START + (monthIdx >= 0 ? monthIdx : 0),
                            false
                          );
                        }
                      }}
                      renderItem={({ item, index }) => {
                        const active = index === monthWheelIndex;
                        return (
                          <View style={S.monthWheelItem}>
                            <Text
                              style={[
                                S.monthWheelItemText,
                                active && S.monthWheelItemTextActive,
                              ]}
                            >
                              {item}
                            </Text>
                          </View>
                        );
                      }}
                    />
                  </View>
                </View>

                {/* Year wheel */}
                <View style={S.monthWheelColumn}>
                  <View style={S.monthWheelBody}>
                    <View style={S.monthWheelHighlight} pointerEvents="none" />
                    <FlatList
                      ref={yearWheelRef}
                      showsVerticalScrollIndicator={false}
                      bounces={false}
                      overScrollMode="never"
                      data={yearsData}
                      keyExtractor={(it, idx) => `${it}-${idx}`}
                      getItemLayout={(_, index) => ({
                        length: WHEEL_ITEM_H,
                        offset: WHEEL_ITEM_H * index,
                        index,
                      })}
                      snapToInterval={WHEEL_ITEM_H}
                      decelerationRate="fast"
                      disableIntervalMomentum
                      contentContainerStyle={[S.monthWheelContent, { paddingVertical: wheelSpacerH }]}
                      onScrollToIndexFailed={() => {}}
                      initialScrollIndex={Math.max(0, yearsData.indexOf(tempYear))}
                      onMomentumScrollEnd={(e) => {
                        let idx = Math.round(
                          e.nativeEvent.contentOffset.y / WHEEL_ITEM_H
                        );
                        if (idx < 0) idx = 0;
                        if (idx > yearsData.length - 1) idx = yearsData.length - 1;
                        setYearWheelIndex(idx);
                        const years = (yearsData as any[])[idx];
                        if (typeof years === "number") setTempYear(years);

                        // Hard clamp to minimum year (currentYear-2)
                        if (idx === 0) {
                          scrollWheelToIndex(yearWheelRef, 0, false);
                        }
                      }}
                      renderItem={({ item, index }) => {
                        const active = index === yearWheelIndex;
                        return (
                          <View style={S.monthWheelItem}>
                            <Text
                              style={[
                                S.monthWheelItemText,
                                active && S.monthWheelItemTextActive,
                              ]}
                            >
                              {String(item)}
                            </Text>
                          </View>
                        );
                      }}
                    />
                  </View>
                </View>
              </View>

              <View style={S.monthModalActions}>
                <TouchableOpacity
                  style={S.monthModalCancel}
                  onPress={() => setMonthPickerOpen(false)}
                  activeOpacity={0.8}
                >
                  <Text style={S.monthModalCancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={S.monthModalApply}
                  onPress={() => {
                    setCurrentMonth({ year: tempYear, month: tempMonth });
                      // keep wheel indices consistent with selection
                      setMonthWheelIndex(MONTH_LOOP_START + (tempMonth - 1));
                      {
                        const yi = yearsData.indexOf(tempYear);
                        setYearWheelIndex(yi === -1 ? yearWheelIndex : yi);
                      }
                    setMonthPickerOpen(false);
                  }}
                  activeOpacity={0.9}
                >
                  <Text style={S.monthModalApplyText}>Apply</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </KeyboardAvoidingView>
    </View>
  );
}

// ─── Exported wrapper ────────────────────────────────────────────────────────
// Uses the app's CalendarProvider from _layout (no nested provider) so refresh()
// and calendar data stay in sync (e.g. delete updates the list immediately).

export function EnhancedCalendarScreen(props: EnhancedCalendarScreenProps) {
  return <EnhancedCalendarScreenCore {...props} />;
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const S = StyleSheet.create({
  root: {
    flex: 1,
  },

  // ── Banner ──
  banner: {
    width: "100%",
    backgroundColor: "#22C55E",
    paddingTop: 12,
    paddingBottom: 12,
    borderBottomLeftRadius: 18,
    borderBottomRightRadius: 18,
  },
  // bannerLabel removed

  // ── Toggle ──
  toggleBar: {
    flexDirection: "row",
    marginHorizontal: 18,
    marginTop: 0,
    marginBottom: 0,
    paddingHorizontal: 4,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.20)", // glassy pill on green
    gap: 4,
  },
  toggleBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.0)",
  },
  toggleBtnActive: {
    backgroundColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOpacity: 0.07,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  toggleText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  toggleTextActive: {
    color: "#15803D",
    fontWeight: "700",
  },

  // ── Month nav ──
  monthNav: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginHorizontal: 18,
    marginTop: 12,
    marginBottom: 14,
  },
  monthNavBtn: {
    width: 32,
    height: 32,
    borderRadius: 16, // perfect circle for month arrows
    backgroundColor: "#F0FDF4",
    borderWidth: 1,
    borderColor: "#BBF7D0",
    alignItems: "center",
    justifyContent: "center",
  },
  monthLabelButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  monthLabel: {
    fontSize: 18,
    fontWeight: "700",
    color: "#15803D",
    letterSpacing: 0.4,
  },

  // ── Calendar card ──
  calCard: {
    marginHorizontal: 18,
    borderRadius: 20,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
    paddingTop: 4,
    paddingBottom: 0,
    overflow: "hidden",
  },
  calScrollContent: {
    paddingBottom: 150,
  },

  // ── Day cells ──
  dayCell: {
    width: 36,
    alignItems: "center",
    justifyContent: "flex-start",
    borderRadius: 12,
    margin: 1,
    paddingTop: 6,
  },
  dayCellEmpty: {
    paddingBottom: 0,
  },
  dayCellWithPills: {
    paddingBottom: 0,
    // Slight negative margin to tighten gap after last pill
    marginBottom: -2,
  },
  dayNumWrap: {
    minWidth: 26,
    height: 26,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "transparent",
    marginBottom: 2,
  },
  dayNumWrapSelected: {
    backgroundColor: "#22C55E",
    borderWidth: 0,
  },
  dayNumWrapToday: {
    borderWidth: 2,
    borderColor: "#22C55E",
  },
  dayNumWrapTodaySelected: {
    backgroundColor: "#22C55E",
    borderWidth: 2,
    borderColor: "#15803D",
  },
  dayCellDisabled: {
    opacity: 0.25,
  },
  dayText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#1E293B",
    lineHeight: 16,
  },
  dayTextSelected: {
    color: "#FFFFFF",
    fontWeight: "900",
  },
  dayTextToday: {
    color: "#22C55E",
    fontWeight: "900",
  },
  dayTextTodaySelected: {
    color: "#FFFFFF",
  },
  dayTextDisabled: {
    color: "#CBD5E1",
  },

  // Dots (no longer used for grid but kept in case of legacy)
  dotRow: {
    flexDirection: "row",
    height: 6,
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
    marginTop: 1,
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  dotPlaceholder: {
    width: 4,
    height: 4,
  },

  // Category pills under day number
  dayPillsRow: {
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 0,
    gap: 1,
    minHeight: 0,
    // Pull pills slightly closer to next week row
    marginBottom: -1,
  },
  dayPillBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 6,
    paddingVertical: 0,
    borderRadius: 999,
    borderWidth: 1,
  },
  dayPillText: {
    fontSize: 9,
    fontWeight: "700",
    marginLeft: 3,
  },
  dayMorePill: {
    minWidth: 24,
    height: 16,
    paddingHorizontal: 7,
    borderRadius: 999,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  dayMoreText: {
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 0.1,
  },

  // Legend (no longer rendered; kept for potential reuse)

  // ── Day panel ──
  dayPanel: {
    marginHorizontal: 18,
    marginTop: 14,
    borderRadius: 20,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
    overflow: "hidden",
  },
  dayPanelHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingVertical: 13,
    borderBottomWidth: 0.5,
    borderBottomColor: "#E5E7EB",
  },
  dayPanelHeaderLeft: {
    flexShrink: 1,
  },
  dayPanelWeekday: {
    fontSize: 11,
    fontWeight: "600",
    color: "#22C55E",
    letterSpacing: 0.07,
    textTransform: "uppercase",
  },
  dayPanelDayMonth: {
    fontSize: 20,
    fontWeight: "700",
    color: "#0F172A",
    letterSpacing: -0.02,
    marginTop: 2,
  },
  dayPanelYear: {
    fontSize: 13,
    fontWeight: "500",
    color: "#94A3B8",
    marginTop: 1,
  },
  dayPanelCount: {
    fontSize: 12,
    fontWeight: "500",
    color: "#94A3B8",
    marginTop: 4,
  },
  dayPanelBadge: {
    alignSelf: "flex-start",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  dayPanelBadgeText: {
    fontSize: 12,
    fontWeight: "700",
  },
  dayItems: {
    paddingHorizontal: 12,
    paddingTop: 6,
    paddingBottom: 8,
    gap: 5,
  },
  emptyDay: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  emptyDayTitle: {
    fontSize: 14,
    fontWeight: "500",
    color: "#6B7280",
  },
  emptyDaySubtitle: {
    fontSize: 12,
    fontWeight: "500",
    color: "#9CA3AF",
    marginTop: 3,
    lineHeight: 18,
  },

  // ── Item card (white card + left urgency bar + action row) ──
  dayItemCard: {
    flexDirection: "column",
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    overflow: "hidden",
    marginBottom: 8,
    elevation: 0,
    shadowOpacity: 0,
  },
  dayItemContentRow: {
    flexDirection: "row",
  },
  dayItemBar: {
    width: 5,
    alignSelf: "stretch",
  },
  dayItemCardInner: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    paddingLeft: 10,
    paddingRight: 10,
    paddingVertical: 10,
    minWidth: 0,
    minHeight: 52,
  },
  dayItemIconTile: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
    backgroundColor: "transparent",
    elevation: 0,
    shadowColor: "transparent",
    shadowOpacity: 0,
    shadowRadius: 0,
    shadowOffset: { width: 0, height: 0 },
  },
  dayItemEmoji: {
    fontSize: 22,
  },
  dayItemBody: {
    flex: 1,
    minWidth: 0,
  },
  dayItemHeaderRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 8,
  },
  dayItemTextCol: {
    flexShrink: 1,
    minWidth: 0,
  },
  dayItemName: {
    fontSize: 14,
    fontWeight: "700",
    color: "#374151",
  },
  dayItemMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 3,
  },
  dayItemLocationIcon: {
    width: 12,
    height: 12,
    marginRight: 1,
  },
  dayItemMetaText: {
    fontSize: 11,
    fontWeight: "500",
    color: "#6B7280",
    marginLeft: 0,
  },
  dayItemMetaDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    marginHorizontal: 4,
    opacity: 0.4,
  },
  dayItemTag: {
    alignSelf: "flex-start",
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 999,
    marginTop: 3,
  },
  dayItemCommonExpiryWrap: {
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 6,
    paddingBottom: 10,
  },
  dayItemCommonExpiryPill: {
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 999,
  },
  dayItemTagText: {
    fontSize: 10,
    fontWeight: "700",
  },
  dayItemActionRowWrap: {
    overflow: "hidden",
  },
  dayItemActionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 6,
    paddingVertical: 6,
    borderTopWidth: 1,
    borderTopColor: "#E2E8F0",
    minHeight: 44,
    backgroundColor: "#FAFAFA",
    gap: 0,
  },
  dayItemActionBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    paddingVertical: 8,
  },
  dayItemActionDivider: {
    width: 1,
    alignSelf: "stretch",
    backgroundColor: "#E5E7EB",
    marginVertical: 4,
  },
  dayItemActionEdit: {
    fontSize: 12,
    fontWeight: "500",
    color: "#64748B",
  },
  dayItemActionUsed: {
    fontSize: 12,
    fontWeight: "500",
    color: "#16A34A",
  },
  dayItemActionDelete: {
    fontSize: 12,
    fontWeight: "500",
    color: "#EF4444",
  },
  dayItemUseBtn: {
    flex: 1,
    paddingVertical: 5,
    paddingHorizontal: 8,
    borderRadius: 999,
    backgroundColor: "#22C55E",
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 4,
  },
  dayItemUseBtnText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#FFFFFF",
  },


  itemCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "#FAFAFA",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    overflow: "hidden",
    paddingRight: 12,
    paddingVertical: 11,
  },
  itemBar: {
    width: 3,
    alignSelf: "stretch",
    borderRadius: 2,
    marginLeft: 0,
  },
  itemIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  iconWrap: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 5,
  },
  itemBody: {
    flex: 1,
  },
  itemName: {
    fontSize: 14,
    fontWeight: "700",
    color: "#0F172A",
    lineHeight: 18,
  },
  itemMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 3,
  },
  itemMeta: {
    fontSize: 12,
    fontWeight: "500",
    color: "#64748B",
  },
  expiryChip: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    borderWidth: 1,
  },
  expiryChipText: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.1,
  },

  monthModalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(15,23,42,0.35)",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  monthModalCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 16,
    maxHeight: "60%",
    width: "100%",
    shadowColor: "#000",
    shadowOpacity: 0.14,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 10,
  },
  monthModalViewLabel: {
    textAlign: "center",
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 0.8,
    color: "#94A3B8",
    marginBottom: 10,
  },
  monthWheelRow: {
    flexDirection: "row",
    marginTop: 4,
  },
  monthWheelColumn: {
    flex: 1,
    marginHorizontal: 4,
  },
  monthWheelHeader: {
    alignItems: "center",
    marginBottom: 4,
  },
  monthWheelHeaderText: {
    fontSize: 11,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 1,
    color: "#9CA3AF",
  },
  monthWheelBody: {
    borderRadius: 12,
    backgroundColor: "#F9FAFB",
    overflow: "hidden",
    position: "relative",
    height: 32 * 5, // exactly 5 rows visible (true center)
  },
  monthWheelHighlight: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 64, // center row for 5 visible rows: 2 * 32
    height: 32,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#BBF7D0",
    backgroundColor: "rgba(220,252,231,0.35)",
  },
  monthWheelContent: {
    paddingVertical: 0,
  },
  monthWheelItem: {
    height: 32,
    alignItems: "center",
    justifyContent: "center",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#E5E7EB",
  },
  monthWheelItemActive: {
    // visual weight comes from highlight overlay + text color
  },
  monthWheelItemText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#6B7280",
  },
  monthWheelItemTextActive: {
    color: "#15803D",
    fontWeight: "700",
  },
  monthModalActions: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 12,
    gap: 16,
  },
  monthModalCancel: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
  },
  monthModalCancelText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#6B7280",
  },
  monthModalApply: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: "#22C55E",
  },
  monthModalApplyText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#FFFFFF",
  },

  // ── Timeline ──
  timelineScrollContent: {
    paddingHorizontal: 18,
    paddingBottom: 135,
    paddingTop: 4,
  },
  timelineSection: {
    marginBottom: 20,
  },
  timelineSectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  timelineSectionPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flex: 1,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
  },
  timelineSectionDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  timelineSectionLabel: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.2,
  },
  timelineSectionCount: {
    fontSize: 11,
    fontWeight: "600",
    opacity: 0.9,
    marginLeft: 4,
  },
  timelineDateBlock: {
    marginBottom: 15,
  },
  timelineDateHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
    marginBottom: 4,
  },
  timelineDateHeaderText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#475569",
  },
  timelineExpiredPillWrap: {
    alignItems: "center",
    marginTop: 10,
    marginBottom: 8,
  },
  timelineExpiredPill: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 6,
    paddingHorizontal: 12,
    paddingRight: 10,
    borderRadius: 999,
    backgroundColor: "#FEF2F2",
    borderWidth: 1,
    borderColor: "#FECACA",
  },
  timelineExpiredPillTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: "#B91C1C",
  },
  timelineExpiredPillCount: {
    fontSize: 12,
    fontWeight: "500",
    color: "#B91C1C",
    marginLeft: 6,
  },
  timelineExpiredDropdownBox: {
    backgroundColor: "#FFFBFB",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#FECACA",
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginTop: 8,
    marginBottom: 14,
    gap: 10,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  timelineDayItems: {
    gap: 5,
  },
  timelineItemCard: {
    flexDirection: "column",
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    overflow: "hidden",
    marginBottom: 5,
    elevation: 0,
    shadowOpacity: 0,
    minHeight: 56,
  },
  // ── Expired-only cards (timeline past dropdown) ──
  expiredDateGroupCard: {
    paddingVertical: 4,
  },
  expiredMainHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  expiredMainHeaderLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: "#991B1B",
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  expiredMainHeaderCount: {
    fontSize: 11,
    fontWeight: "500",
    color: "#B91C1C",
  },
  expiredMainDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: "#FECACA",
    marginBottom: 8,
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
  removeModalSubtitle: {
    fontSize: 12,
    fontWeight: "500",
    color: "#6B7280",
    marginBottom: 0,
  },
  removeOption: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    backgroundColor: "#F9FAFB",
    marginBottom: 8,
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
  removeOptionIconWrapPrimary: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#FEE2E2",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  removeOptionIconWrapSecondary: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
    borderWidth: 1,
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
  expiredDateHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  expiredDateHeaderText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#334155",
  },
  expiredDatePill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    backgroundColor: "#FEE2E2",
  },
  expiredDatePillText: {
    fontSize: 10,
    fontWeight: "600",
    color: "#B91C1C",
  },
  // expiredItemsList + per-item row removed; we reuse standard timeline item cards
  timelineItemIconTile: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
    backgroundColor: "transparent",
    elevation: 0,
    shadowColor: "transparent",
    shadowOpacity: 0,
    shadowRadius: 0,
    shadowOffset: { width: 0, height: 0 },
  },
  timelineItemChevron: {
    marginLeft: 8,
    opacity: 0.6,
  },
  timelineDateUrgencyPill: {
    alignSelf: "flex-start",
    backgroundColor: "#F1F5F9",
    paddingHorizontal: 5,
    paddingVertical: 1.5,
    borderRadius: 999,
    marginTop: 2,
    marginBottom: 2,
  },
  timelineDateUrgencyPillText: {
    fontSize: 9,
    fontWeight: "500",
    color: "#64748B",
  },
  timelineUrgencyPill: {
    backgroundColor: "#F1F5F9",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginLeft: 8,
    maxWidth: 140,
    flexShrink: 0,
  },
  timelineUrgencyPillText: {
    fontSize: 10,
    fontWeight: "600",
    color: "#64748B",
  },
  timelineDateLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#94A3B8",
    marginBottom: 6,
    marginTop: 4,
    paddingLeft: 2,
  },
  emptyTimeline: {
    alignItems: "center",
    marginTop: 60,
    gap: 10,
  },
  emptyTimelineIcon: {
    fontSize: 40,
  },
  emptyTimelineTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#0F172A",
  },
  emptyTimelineSub: {
    fontSize: 13,
    color: "#94A3B8",
    textAlign: "center",
    fontWeight: "500",
    paddingHorizontal: 30,
  },
});