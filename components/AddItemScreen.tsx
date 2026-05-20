import { ThemedText } from "@/components/ThemedText";
import ScreenLayout from "@/components/ScreenLayout";
import { OfflineNoticeModal } from "@/components/OfflineNoticeModal";
import { FoodItem } from "@/lib/supabase";
import {
  MAX_INVENTORY_QUANTITY,
  clampIntegerQuantity,
  sanitizeQuantityInputString,
} from "@/utils/quantityLimits";
import { foodItemsService } from "@/services/foodItems";
import {
  formatTimeForStorage,
  normalizeItemNotificationRepeat,
  normalizeRepeatForUi,
  parseStoredTimeToDate,
  syncItemExpiryNotificationsAfterSave,
} from "@/services/itemExpiryNotificationService";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker, {
  DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import { useFocusEffect } from "@react-navigation/native";
import Constants from "expo-constants";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Easing,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from "react-native";

import { useCalendar } from "@/contexts/CalendarContext";
import {
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import {
  FOOD_CATEGORY_LABELS,
  FOOD_CATEGORY_OPTIONS,
  normalizeLegacyInventoryCategory,
} from "@/lib/foodCategories";
import { SimpleCalendar } from "./SimpleCalendar";
import { useAuth } from "@/contexts/AuthContext";
import {
  getErrorMessage,
  isNetworkRequestFailed,
  isOfflineLikeError,
} from "@/utils/networkError";

const commonUnits = [
  // most used (quick picks)
  "pcs",
  "kg",
  "g",
  "L",
  "servings",

  // everyday cooking
  "cup",
  "tbsp",
  "tsp",

  // common grocery counts
  "dozen",
  "slice",
  "bunch",
  "clove",

  // weight alternatives
  "lb",
  "oz",
  "fl oz",
  "ml", 

  // containers
  "pack",
  "box",
  "bag",
  "bottle",
  "jar",
  "can",
  "carton",
  "tray",

  // food-specific forms
  "block",
  "stick"
];

const CATEGORY_OPTIONS = FOOD_CATEGORY_OPTIONS;
const CATEGORY_LABELS = FOOD_CATEGORY_LABELS;
const REPEAT_OPTIONS = ["None", "Daily", "Weekly", "Monthly"];
const CUSTOM_REMINDER_UNITS = ["days", "weeks", "months"];
const REMINDER_QUICK_OPTIONS = [
  { label: "3d", days: 3 },
  { label: "5d", days: 5 },
  { label: "1w", days: 7 },
  { label: "2w", days: 14 },
  { label: "1m", days: 30 },
];

const parseYmdToLocalDate = (value?: string): Date | null => {
  if (!value) return null;
  const m = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) {
    const dt = new Date(value);
    return Number.isNaN(dt.getTime()) ? null : dt;
  }
  const y = Number(m[1]);
  const mo = Number(m[2]);
  const d = Number(m[3]);
  return new Date(y, mo - 1, d);
};

const formatLocalDateToYmd = (date?: Date | null): string | undefined => {
  if (!date) return undefined;
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

const createTimeDate = (hours: number, minutes: number) => {
  const date = new Date();
  date.setHours(hours, minutes, 0, 0);
  return date;
};

const formatNotificationTime = (date: Date) =>
  date.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });

const formatReminderDatePreview = (date: Date) =>
  date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

const getCalendarDaysAway = (date?: Date | null) => {
  if (!date) return 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(date);
  target.setHours(0, 0, 0, 0);
  return Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
};

const isRepeatOptionEnabled = (option: string, daysAway: number) => {
  if (option === "Weekly") return daysAway >= 7;
  if (option === "Monthly") return daysAway >= 30;
  return true;
};

const getCustomReminderDays = (countText: string, unit: string) => {
  const count = Math.max(1, parseInt(countText, 10) || 1);
  if (unit === "weeks") return count * 7;
  if (unit === "months") return count * 30;
  return count;
};

const getReminderUnitDays = (unit: string) => {
  if (unit === "weeks") return 7;
  if (unit === "months") return 30;
  return 1;
};

const getMaxReminderCount = (unit: string, daysAway: number, hasExpiryDate: boolean) => {
  if (!hasExpiryDate) return 999;
  return Math.floor(daysAway / getReminderUnitDays(unit));
};

const clampReminderCount = (
  count: number,
  unit: string,
  daysAway: number,
  hasExpiryDate: boolean
) => {
  const maxCount = getMaxReminderCount(unit, daysAway, hasExpiryDate);
  if (maxCount < 1) return 1;
  return Math.min(Math.max(1, count), maxCount);
};

const formatReminderDaysLabel = (days: number) =>
  `${days} ${days === 1 ? "day" : "days"} before`;

const CHIPS_PER_ROW = 9;
const CATEGORY_ROW_1 = CATEGORY_OPTIONS.slice(0, CHIPS_PER_ROW);
const CATEGORY_ROW_2 = CATEGORY_OPTIONS.slice(CHIPS_PER_ROW);

export default function AddItemScreen() {
  const params = useLocalSearchParams<{
    edit?: string;
    id?: string;
    name?: string;
    quantity?: string;
    unit?: string;
    location?: "fridge" | "shelf";
    category?: string;
    expiryDate?: string;
    notes?: string;
  }>();
  const { user } = useAuth();
  const isEditing = params.edit === "true" && Boolean(params.id);
  const hasPrefill =
    !isEditing &&
    Boolean(
      params.name ||
        params.quantity ||
        params.unit ||
        params.location ||
        params.category
    );

  const [name, setName] = useState(params.name ?? "");
  const [quantity, setQuantity] = useState(params.quantity ?? "1");
  const [unit, setUnit] = useState(params.unit ?? "pcs");
  const [location, setLocation] = useState<"fridge" | "shelf">(
    params.location ?? "fridge"
  );
  const [category, setCategory] = useState(params.category ?? "");
  const [expiryDate, setExpiryDate] = useState<Date | null>(null);
  const [notes, setNotes] = useState("");
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [loading, setLoading] = useState(false);
  const [notesFocused, setNotesFocused] = useState(false);
  const [showUnitDropdown, setShowUnitDropdown] = useState(false);
  const [notificationSettingsOpen, setNotificationSettingsOpen] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [notificationTime, setNotificationTime] = useState(() =>
    createTimeDate(13, 0)
  );
  const [pendingNotificationTime, setPendingNotificationTime] = useState(() =>
    createTimeDate(13, 0)
  );
  const [showNotificationTimePicker, setShowNotificationTimePicker] =
    useState(false);
  const [reminderMenuOpen, setReminderMenuOpen] = useState(false);
  const [customReminderCount, setCustomReminderCount] = useState("7");
  const [customReminderUnit, setCustomReminderUnit] = useState("days");
  const [repeatOption, setRepeatOption] = useState("None");
  const [repeatMenuOpen, setRepeatMenuOpen] = useState(false);
  const unitDropdownTriggerRef = useRef<View>(null);
  const [dropdownPos, setDropdownPos] = useState<{ x: number; y: number }>({
    x: 0,
    y: 0,
  });

  // State for suggestions
  const [suggestions, setSuggestions] = useState<FoodItem[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [offlineNoticeVisible, setOfflineNoticeVisible] = useState(false);

  const [calendarWeeks, setCalendarWeeks] = useState(5);

  const { width } = useWindowDimensions();
  const addItemScrollRef = useRef<ScrollView>(null);
  const addButtonScale = useRef(new Animated.Value(1)).current;
  const notificationExpandAnim = useRef(new Animated.Value(0)).current;
  const notificationToggleAnim = useRef(new Animated.Value(1)).current;
  const reminderStepHoldRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const quantityStepHoldRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const reminderDefaultModeRef = useRef(true);
  const [showSuccess, setShowSuccess] = useState(false);
  /** Measured height of green header + Fridge/Shelf row (absolute overlay) for scroll inset. */
  const [headerChromeHeight, setHeaderChromeHeight] = useState(96);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const successAnim = useRef(new Animated.Value(0)).current;
  const successPop = useRef(new Animated.Value(0)).current;
  const successScale = successAnim.interpolate({
    inputRange: [0, 0.7, 1],
    outputRange: [0.8, 1.05, 1],
  });
  const successPopScale = successPop.interpolate({
    inputRange: [0, 1],
    outputRange: [0.6, 1],
  });
  const successTranslateY = successAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [24, 0],
  });
  const insets = useSafeAreaInsets();
  const navigateBackAfterSuccessRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const customReminderDays = getCustomReminderDays(
    customReminderCount,
    customReminderUnit
  );
  const reminderOffsetDays = customReminderDays;
  const reminderLabel = formatReminderDaysLabel(reminderOffsetDays);
  const notificationTimeLabel = formatNotificationTime(notificationTime);
  const expiryDaysAway = getCalendarDaysAway(expiryDate);
  const hasExpiryDate = Boolean(expiryDate);
  const notificationsUnavailable = hasExpiryDate && expiryDaysAway <= 0;
  const todayNotificationTime = createTimeDate(
    notificationTime.getHours(),
    notificationTime.getMinutes()
  );
  const latestValidReminderDays = hasExpiryDate
    ? Math.max(
        1,
        expiryDaysAway - (todayNotificationTime.getTime() <= Date.now() ? 1 : 0)
      )
    : 999;
  const maxReminderCount = getMaxReminderCount(
    customReminderUnit,
    latestValidReminderDays,
    hasExpiryDate
  );
  const parsedReminderCount = Math.max(
    1,
    parseInt(customReminderCount, 10) || 1
  );
  const reminderRangeInvalid =
    notificationsEnabled &&
    Boolean(expiryDate) &&
    reminderOffsetDays > latestValidReminderDays;
  const reminderDateCandidate = expiryDate ? new Date(expiryDate) : null;
  if (reminderDateCandidate) {
    reminderDateCandidate.setDate(
      reminderDateCandidate.getDate() - reminderOffsetDays
    );
    reminderDateCandidate.setHours(
      notificationTime.getHours(),
      notificationTime.getMinutes(),
      0,
      0
    );
  }
  const reminderTimeInvalid =
    notificationsEnabled &&
    Boolean(reminderDateCandidate) &&
    !reminderRangeInvalid &&
    reminderDateCandidate!.getTime() <= Date.now();
  const notificationReminderInvalid = reminderRangeInvalid || reminderTimeInvalid;
  const notificationControlsEnabled =
    notificationsEnabled && !notificationsUnavailable;
  const notificationExpandedHeight =
    repeatMenuOpen ? 260 : reminderMenuOpen ? 306 : 232;
  const notificationCardHeight = notificationExpandAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [48, notificationExpandedHeight],
  });
  const notificationBodyOpacity = notificationExpandAnim.interpolate({
    inputRange: [0, 0.45, 1],
    outputRange: [0, 0, 1],
  });
  const setClampedReminderCount = useCallback(
    (count: number, unit = customReminderUnit) => {
      setCustomReminderCount(
        String(
          clampReminderCount(count, unit, latestValidReminderDays, hasExpiryDate)
        )
      );
    },
    [customReminderUnit, hasExpiryDate, latestValidReminderDays]
  );
  const adjustReminderCount = useCallback(
    (delta: number) => {
      setCustomReminderCount((currentCount) => {
        const current = parseInt(currentCount, 10) || 1;
        return String(
          clampReminderCount(
            current + delta,
            customReminderUnit,
            latestValidReminderDays,
            hasExpiryDate
          )
        );
      });
    },
    [customReminderUnit, hasExpiryDate, latestValidReminderDays]
  );
  const stopReminderStepHold = useCallback(() => {
    if (reminderStepHoldRef.current) {
      clearInterval(reminderStepHoldRef.current);
      reminderStepHoldRef.current = null;
    }
  }, []);
  const startReminderStepHold = useCallback(
    (delta: number) => {
      stopReminderStepHold();
      adjustReminderCount(delta);
      reminderStepHoldRef.current = setInterval(() => {
        adjustReminderCount(delta);
      }, 95);
    },
    [adjustReminderCount, stopReminderStepHold]
  );
  const adjustQuantityCount = useCallback((delta: number) => {
    setQuantity((currentQuantity) =>
      String(
        Math.max(
          1,
          Math.min(
            MAX_INVENTORY_QUANTITY,
            (parseInt(currentQuantity, 10) || 1) + delta
          )
        )
      )
    );
  }, []);
  const stopQuantityStepHold = useCallback(() => {
    if (quantityStepHoldRef.current) {
      clearInterval(quantityStepHoldRef.current);
      quantityStepHoldRef.current = null;
    }
  }, []);
  const startQuantityStepHold = useCallback(
    (delta: number) => {
      stopQuantityStepHold();
      adjustQuantityCount(delta);
      quantityStepHoldRef.current = setInterval(() => {
        adjustQuantityCount(delta);
      }, 95);
    },
    [adjustQuantityCount, stopQuantityStepHold]
  );
  const reminderPreviewText = (() => {
    if (notificationsUnavailable) {
      return "Choose a later expiry date or turn notifications off";
    }
    if (!notificationsEnabled) return "Notifications are off for this item";
    if (!expiryDate) return "Select an expiry date to schedule a reminder";

    if (reminderRangeInvalid) {
      return "Reminder needs to happen before expiry.";
    }

    if (!reminderDateCandidate || reminderTimeInvalid) {
      return "Set a later reminder time.";
    }

    const reminderDateLabel = formatReminderDatePreview(reminderDateCandidate);
    if (repeatOption === "None") {
      return `You'll be reminded on ${reminderDateLabel} at ${notificationTimeLabel}`;
    }

    return `You'll be reminded ${repeatOption.toLowerCase()} from ${reminderDateLabel} until expiry at ${notificationTimeLabel}`;
  })();
  const reminderPreviewIsGuidance =
    notificationsUnavailable ||
    !notificationsEnabled ||
    !expiryDate ||
    reminderRangeInvalid ||
    reminderTimeInvalid;

  // Calendar context for real-time updates after save
  const { refresh, invalidateCache } = useCalendar();

  useEffect(() => {
    Animated.timing(notificationExpandAnim, {
      toValue: notificationSettingsOpen ? 1 : 0,
      duration: 220,
      easing: Easing.inOut(Easing.cubic),
      useNativeDriver: false,
    }).start();

    const scrollWithAnimation = () => {
      addItemScrollRef.current?.scrollToEnd({ animated: true });
    };
    const scrollUpWithAnimation = () => {
      addItemScrollRef.current?.scrollTo({ y: 0, animated: true });
    };
    const scrollTimers = notificationSettingsOpen
      ? [
          requestAnimationFrame(scrollWithAnimation),
          setTimeout(scrollWithAnimation, 80),
          setTimeout(scrollWithAnimation, 160),
          setTimeout(scrollWithAnimation, 240),
        ]
      : [
          setTimeout(scrollUpWithAnimation, 120),
          setTimeout(scrollUpWithAnimation, 230),
        ];

    return () => {
      scrollTimers.forEach((timer) => {
        if (typeof timer === "number") {
          clearTimeout(timer);
        } else {
          cancelAnimationFrame(timer);
        }
      });
    };
  }, [notificationExpandAnim, notificationSettingsOpen]);

  useEffect(() => {
    Animated.timing(notificationToggleAnim, {
      toValue: notificationsEnabled ? 1 : 0,
      duration: 160,
      easing: Easing.inOut(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [notificationToggleAnim, notificationsEnabled]);

  useEffect(() => {
    if (!notificationsUnavailable) return;
    setNotificationsEnabled(false);
    setReminderMenuOpen(false);
    setRepeatMenuOpen(false);
  }, [notificationsUnavailable]);

  useEffect(() => stopReminderStepHold, [stopReminderStepHold]);

  useEffect(() => stopQuantityStepHold, [stopQuantityStepHold]);

  useEffect(() => {
    if (!isRepeatOptionEnabled(repeatOption, expiryDaysAway)) {
      setRepeatOption("None");
    }
  }, [expiryDaysAway, repeatOption]);

  useEffect(() => {
    if (reminderDefaultModeRef.current && hasExpiryDate) {
      const defaultReminderDays = latestValidReminderDays < 7 ? 1 : 7;
      if (customReminderUnit !== "days") {
        setCustomReminderUnit("days");
      }
      if (customReminderCount !== String(defaultReminderDays)) {
        setCustomReminderCount(String(defaultReminderDays));
      }
      return;
    }

    const maxForCurrentUnit = getMaxReminderCount(
      customReminderUnit,
      latestValidReminderDays,
      hasExpiryDate
    );

    if (hasExpiryDate && maxForCurrentUnit < 1) {
      setCustomReminderUnit("days");
      setClampedReminderCount(parsedReminderCount, "days");
      return;
    }

    const clampedCount = clampReminderCount(
      parsedReminderCount,
      customReminderUnit,
      latestValidReminderDays,
      hasExpiryDate
    );

    if (String(clampedCount) !== customReminderCount) {
      setCustomReminderCount(String(clampedCount));
    }
  }, [
    customReminderCount,
    customReminderUnit,
    hasExpiryDate,
    latestValidReminderDays,
    parsedReminderCount,
    setClampedReminderCount,
  ]);

  const openNotificationTimePicker = useCallback(() => {
    if (!notificationControlsEnabled) return;
    setPendingNotificationTime(new Date(notificationTime));
    setShowNotificationTimePicker(true);
    Haptics.selectionAsync();
  }, [notificationControlsEnabled, notificationTime]);

  const handleAndroidNotificationTimeChange = useCallback(
    (event: DateTimePickerEvent, selectedDate?: Date) => {
      setShowNotificationTimePicker(false);
      if (event.type !== "set" || !selectedDate) return;
      const nextTime = createTimeDate(
        selectedDate.getHours(),
        selectedDate.getMinutes()
      );
      setNotificationTime(nextTime);
      setPendingNotificationTime(nextTime);
      Haptics.selectionAsync();
    },
    []
  );

  const applyIosNotificationTime = useCallback(() => {
    setNotificationTime(pendingNotificationTime);
    setShowNotificationTimePicker(false);
    Haptics.selectionAsync();
  }, [pendingNotificationTime]);

  const runSuccessCelebrationAndExit = useCallback(() => {
    successAnim.setValue(0);
    successPop.setValue(0);
    setShowSuccess(true);
    Keyboard.dismiss();
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Animated.parallel([
      Animated.spring(successAnim, {
        toValue: 1,
        friction: 8,
        tension: 72,
        useNativeDriver: true,
      }),
      Animated.sequence([
        Animated.delay(70),
        Animated.spring(successPop, {
          toValue: 1,
          friction: 5,
          tension: 135,
          useNativeDriver: true,
        }),
      ]),
    ]).start();

    if (navigateBackAfterSuccessRef.current) {
      clearTimeout(navigateBackAfterSuccessRef.current);
    }
    navigateBackAfterSuccessRef.current = setTimeout(() => {
      navigateBackAfterSuccessRef.current = null;
      router.back();
    }, 1500);
  }, [successAnim, successPop]);

  useEffect(() => {
    return () => {
      if (navigateBackAfterSuccessRef.current) {
        clearTimeout(navigateBackAfterSuccessRef.current);
      }
    };
  }, []);

  // Add icon requires
  const fridgeIcon = require("../assets/images/icons/fridge_icon.png");
  const shelfIcon = require("../assets/images/icons/shelf_icon.png");

  // Layout constants
  const UNIT_DROPDOWN_WIDTH = 95;
  const unitDropdownLeft = Math.min(
    Math.max(dropdownPos.x - UNIT_DROPDOWN_WIDTH / 2, 16),
    width - 16 - UNIT_DROPDOWN_WIDTH
  );

  // Animate card entrance
  const cardAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(cardAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, []);

  // Animate food icon preview
  const iconAnim = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    Animated.spring(iconAnim, {
      toValue: name.length > 0 ? 1.2 : 1,
      friction: 4,
      useNativeDriver: true,
    }).start();
  }, [name]);

  useEffect(() => {
    // Reset success state when component mounts or navigation changes
    setShowSuccess(false);
    fadeAnim.setValue(1);

    // Load item data if editing
    if (isEditing) {
      loadItemData();
    }

    // Load existing items for suggestions
    loadExistingItems();
  }, [isEditing, params.id]);

  // Apply prefill from navigation params before paint to prevent old-item flicker
  useLayoutEffect(() => {
    if (params.name) setName(params.name);
    if (params.quantity) setQuantity(params.quantity);
    if (params.unit) setUnit(params.unit);
    if (params.location) setLocation(params.location);
    if (params.category) setCategory(params.category);
    if (typeof params.expiryDate === "string") {
      setExpiryDate(parseYmdToLocalDate(params.expiryDate));
    }
    if (typeof params.notes === "string") {
      setNotes(params.notes);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    params.id,
    params.name,
    params.quantity,
    params.unit,
    params.location,
    params.category,
    params.expiryDate,
    params.notes,
  ]);

  // Reset form and success state when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      // Reset success state
      setShowSuccess(false);
      fadeAnim.setValue(1);

      // Reset form fields if not editing and there's no prefill from groceries
      if (!isEditing && !hasPrefill) {
        setName("");
        setQuantity("1");
        setUnit("pcs");
        setLocation("fridge");
        setCategory("");
        setExpiryDate(null);
        setNotes("");
        setShowUnitDropdown(false);
      }
    }, [isEditing, hasPrefill])
  );

  const loadExistingItems = async () => {
    try {
      const existingItems = await foodItemsService.getItems();
      setSuggestions(existingItems);
    } catch (error) {
      if (isNetworkRequestFailed(error)) {
        setOfflineNoticeVisible(true);
      }
    }
  };

  const showSaveError = useCallback(
    (error: unknown, fallback: string) => {
      if (isOfflineLikeError(error, { hasAuthenticatedUser: Boolean(user) })) {
        setOfflineNoticeVisible(true);
        return;
      }

      Alert.alert("Error", getErrorMessage(error) || fallback);
    },
    [user]
  );

  // Update the name input handler to show suggestions
  const handleNameChange = (text: string) => {
    setName(text);

    if (text.length > 0) {
      const filtered = suggestions.filter((item) =>
        item.name.toLowerCase().includes(text.toLowerCase())
      );
      setShowSuggestions(filtered.length > 0);
    } else {
      setShowSuggestions(false);
    }
  };

  const loadItemData = async () => {
    try {
      // Get items and find the one with matching ID
      const items = await foodItemsService.getItems();
      const item = items.find((item) => item.id === params.id);

      if (item) {
        reminderDefaultModeRef.current = false;
        setName(item.name);
        setQuantity(String(item.quantity));
        setUnit(item.unit || "pcs");
        setLocation(item.location as "fridge" | "shelf");
        let cat = normalizeLegacyInventoryCategory(item.category || "");
        // Map legacy / unknown categories to chip set
        setCategory(CATEGORY_LABELS.includes(cat) ? cat : cat ? "Other" : "");
        setNotes(item.notes || "");
        setExpiryDate(parseYmdToLocalDate(item.expiry_date ?? undefined));
        setNotificationsEnabled(item.notifications_enabled ?? true);
        setCustomReminderUnit("days");
        setCustomReminderCount(
          String(Math.max(1, item.notification_reminder_days ?? 7))
        );
        const t = parseStoredTimeToDate(item.notification_time);
        setNotificationTime(t);
        setPendingNotificationTime(new Date(t.getTime()));
        setRepeatOption(normalizeRepeatForUi(item.notification_repeat));
      } else {
        Alert.alert("Error", "Item not found");
        router.back();
      }
    } catch (error: any) {
      showSaveError(error, "Failed to load item. Please try again.");
    }
  };

  const handleSave = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (!name.trim()) {
      Alert.alert("Error", "Please enter an item name");
      return;
    }

    const qStr =
      quantity.trim() === "" ? "1" : sanitizeQuantityInputString(quantity);
    const quantityNum = clampIntegerQuantity(
      parseInt(qStr, 10),
      1,
      MAX_INVENTORY_QUANTITY
    );
    if (quantityNum <= 0) {
      Alert.alert("Error", "Please enter a valid quantity");
      return;
    }

    if (!category.trim()) {
      Alert.alert("Error", "Please select a category");
      return;
    }

    setLoading(true);
    try {
      const expiryYmd = formatLocalDateToYmd(expiryDate);
      const daysAway = expiryDate ? getCalendarDaysAway(expiryDate) : 0;
      const effectiveNotificationsEnabled =
        !expiryDate || daysAway <= 0 ? false : notificationsEnabled;

      const itemData = {
        name: name.trim(),
        quantity: quantityNum,
        unit: unit.trim() || undefined,
        location,
        category: category.trim() || undefined,
        expiry_date: expiryYmd,
        notes: notes.trim() || undefined,
        notifications_enabled: effectiveNotificationsEnabled,
        notification_reminder_days: Math.max(1, reminderOffsetDays),
        notification_time: formatTimeForStorage(notificationTime),
        notification_repeat: normalizeItemNotificationRepeat(
          repeatOption.toLowerCase(),
          expiryYmd
        ),
      };

      const saved = isEditing
        ? await foodItemsService.updateItem(params.id!, itemData)
        : await foodItemsService.addItem(itemData);

      await syncItemExpiryNotificationsAfterSave(saved, {
        showPermissionDeniedAlert: true,
      });

      try {
        invalidateCache();
        void refresh();
      } catch {}
      runSuccessCelebrationAndExit();
    } catch (error: any) {
      showSaveError(error, "Failed to save item. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenLayout
      topInsetColor={showSuccess ? "#FFFFFF" : "#22C55E"}
      backgroundColor="#FFF"
    >
      <StatusBar
        barStyle="dark-content"
        translucent
        backgroundColor={showSuccess ? "#FFFFFF" : "transparent"}
      />
      {!showSuccess && (
        <>
      {/* Green header + toggles: fixed overlay (green above scrolling form; labels above white scroll fill). */}
      <View
        pointerEvents="box-none"
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 40,
          elevation: 40,
        }}
      >
        <View
          onLayout={(e) =>
            setHeaderChromeHeight(e.nativeEvent.layout.height)
          }
        >
      {/* Add Item / Edit Item Heading with green background */}
      <View
        style={{
          width: "100%",
          backgroundColor: "#22C55E",
          paddingTop: 5,
          paddingBottom: 2,
          alignItems: "center",
          borderBottomLeftRadius: 18,
          borderBottomRightRadius: 18,
          marginBottom: 0,
        }}
      >
        <ThemedText
          style={{
            fontSize: 18,
            fontWeight: "700",
            color: "#FFF",
            textAlign: "center",
          }}
        >
          {isEditing ? "Edit Item" : "Add Item"}
        </ThemedText>
        <ThemedText
          style={{
            fontSize: 12,
            fontWeight: "400",
            color: "#FFF",
            opacity: 0.8,
            marginTop: 1,
            marginBottom: 1,
            textAlign: "center",
          }}
        >
          {isEditing ? "" : "to"}
        </ThemedText>
      </View>
      {/* Fridge/Shelf buttons below heading */}
      <View
        style={{
          flexDirection: "row",
          justifyContent: "center",
          alignItems: "center",
          gap: 16,
          marginTop: -22,
          marginBottom: 8,
        }}
      >
        <Pressable
          style={{
            flexDirection: "row",
            alignItems: "center",
            width: 90,
            height: 36,
            borderRadius: 10,
            backgroundColor: "#FFF",
            borderWidth: 2,
            borderColor: location === "fridge" ? "#22C55E" : "#E5E7EB",
            justifyContent: "center",
            marginRight: 4,
            shadowColor: location === "fridge" ? "#000" : undefined,
            shadowOpacity: location === "fridge" ? 0.1 : 0,
            shadowRadius: location === "fridge" ? 6 : 0,
            elevation: location === "fridge" ? 2 : 0,
          }}
          onPress={() => {
            setLocation("fridge");
            Haptics.selectionAsync();
          }}
          accessibilityRole="button"
          accessibilityState={{ selected: location === "fridge" }}
        >
          <Image
            source={fridgeIcon}
            style={{
              width: 18,
              height: 18,
              marginRight: 4,
              tintColor: location === "fridge" ? "#22C55E" : "#A1A1AB",
            }}
            resizeMode="contain"
          />
          <ThemedText
            style={{
              color: location === "fridge" ? "#22C55E" : "#A1A1AB",
              fontWeight: "700",
              fontSize: 15,
              fontFamily: Platform.OS === "ios" ? "System" : "Roboto",
            }}
          >
            Fridge
          </ThemedText>
        </Pressable>
        <Pressable
          style={{
            flexDirection: "row",
            alignItems: "center",
            width: 90,
            height: 36,
            borderRadius: 10,
            backgroundColor: "#FFF",
            borderWidth: 2,
            borderColor: location === "shelf" ? "#22C55E" : "#E5E7EB",
            justifyContent: "center",
            marginLeft: 4,
            shadowColor: location === "shelf" ? "#000" : undefined,
            shadowOpacity: location === "shelf" ? 0.1 : 0,
            shadowRadius: location === "shelf" ? 6 : 0,
            elevation: location === "shelf" ? 2 : 0,
          }}
          onPress={() => {
            setLocation("shelf");
            Haptics.selectionAsync();
          }}
          accessibilityRole="button"
          accessibilityState={{ selected: location === "shelf" }}
        >
          <Image
            source={shelfIcon}
            style={{
              width: 18,
              height: 18,
              marginRight: 4,
              tintColor: location === "shelf" ? "#22C55E" : "#A1A1AB",
            }}
            resizeMode="contain"
          />
          <ThemedText
            style={{
              color: location === "shelf" ? "#22C55E" : "#A1A1AB",
              fontWeight: "700",
              fontSize: 15,
              fontFamily: Platform.OS === "ios" ? "System" : "Roboto",
            }}
          >
            Shelf
          </ThemedText>
        </Pressable>
      </View>
        </View>
      </View>
        </>
      )}
      {/* Main Content with horizontal padding */}
      {!showSuccess && (
        <KeyboardAvoidingView
          style={{ flex: 1, zIndex: 0 }}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 24}
        >
          <Animated.View style={{ flex: 1, opacity: fadeAnim, zIndex: 0 }}>
            <ScrollView
              ref={addItemScrollRef}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              style={{
                flex: 1,
                backgroundColor: "transparent",
                zIndex: 0,
                elevation: 0,
              }}
              contentContainerStyle={{
                paddingHorizontal: 16,
                paddingTop: headerChromeHeight + 6,
                paddingBottom: notificationSettingsOpen
                  ? insets.bottom + 72
                  : 42,
                justifyContent: "flex-start",
                backgroundColor: "#FFF",
              }}
            >
            {/* Name | Quantity (same row) — above scroll fill, below fixed green chrome */}
            <View
              style={{
                width: "100%",
                marginBottom: 8,
                alignItems: "center",
                zIndex: 1,
                elevation: Platform.OS === "android" ? 1 : 0,
              }}
            >
              <View style={{ width: "100%", maxWidth: 360 }}>
                <View style={{ flexDirection: "row", alignItems: "flex-end", gap: 8 }}>
                  {/* Item Name */}
                  <View style={{ flex: 1 }}>
                    <ThemedText
                      style={{
                        fontSize: 13,
                        fontWeight: "500",
                        fontFamily: Platform.OS === "ios" ? "System" : "Roboto",
                        color: "#4B5563",
                        marginBottom: 2,
                        marginLeft: 12,
                      }}
                    >
                      Item Name
                    </ThemedText>
                    <View style={{ position: "relative", width: "100%" }}>
                      {name.length === 0 && (
                        <Text
                          style={{
                            position: "absolute",
                            left: 18,
                            top: 11,
                            fontSize: 13,
                            color: "#A1A1AB",
                            zIndex: 1,
                          }}
                        >
                          e.g. Milk, Chicken, Apples
                        </Text>
                      )}
                      <TextInput
                        style={{
                          fontSize: 15,
                          fontWeight: "500",
                          color: "#222",
                          backgroundColor: "#F5F5F5",
                          borderRadius: 16,
                          borderWidth: 1.2,
                          borderColor: "#E5E7EB",
                          paddingHorizontal: 14,
                          paddingVertical: 8,
                          width: "100%",
                          height: 40,
                          fontFamily: Platform.OS === "ios" ? "System" : "Roboto",
                          textAlign: "left",
                        }}
                        value={name}
                        onChangeText={(text) => {
                          setName(text);
                          Haptics.selectionAsync();
                        }}
                        accessibilityLabel="Item Name"
                      />
                    </View>
                  </View>

                  {/* Quantity (compact, right) */}
                  <View style={{ width: 116 }}>
                    <ThemedText
                      style={{
                        fontSize: 13,
                        fontWeight: "500",
                        fontFamily: Platform.OS === "ios" ? "System" : "Roboto",
                        color: "#4B5563",
                        marginBottom: 2,
                        textAlign: "center",
                      }}
                    >
                      Quantity
                    </ThemedText>
                    <View
                      style={{
                        height: 40,
                        backgroundColor: "#F5F5F5",
                        borderRadius: 16,
                        borderWidth: 1.2,
                        borderColor: "#E5E7EB",
                        paddingHorizontal: 6,
                        paddingVertical: 4,
                        justifyContent: "space-between",
                      }}
                    >
                      {/* Row: - 1 + */}
                      <View
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          justifyContent: "space-between",
                        }}
                      >
                        <Pressable
                          onPress={() => {
                            adjustQuantityCount(-1);
                            Haptics.selectionAsync();
                          }}
                          onLongPress={() => startQuantityStepHold(-1)}
                          onPressOut={stopQuantityStepHold}
                          delayLongPress={260}
                          style={{
                            width: 22,
                            height: 22,
                            borderRadius: 11,
                            backgroundColor: "#FFF",
                            alignItems: "center",
                            justifyContent: "center",
                            borderWidth: 1,
                            borderColor: "#E5E7EB",
                          }}
                          accessibilityRole="button"
                          accessibilityLabel="Decrease quantity"
                        >
                          <ThemedText
                            style={{
                              fontSize: 14,
                              lineHeight: 14,
                              color: "#111827",
                              fontWeight: "500",
                            }}
                          >
                            −
                          </ThemedText>
                        </Pressable>

                        <TextInput
                          value={quantity}
                          onChangeText={(t) =>
                            setQuantity(sanitizeQuantityInputString(t, { allowEmpty: true }))
                          }
                          onBlur={() =>
                            setQuantity((q) =>
                              q.trim() === ""
                                ? "1"
                                : sanitizeQuantityInputString(q)
                            )
                          }
                          keyboardType="number-pad"
                          selectTextOnFocus
                          style={{
                            minWidth: 28,
                            maxWidth: 56,
                            textAlign: "center",
                            fontSize: 15,
                            color: "#111",
                            fontWeight: "500",
                            fontFamily: Platform.OS === "ios" ? "System" : "Roboto",
                            paddingVertical: 0,
                            paddingHorizontal: 2,
                          }}
                          accessibilityLabel="Quantity"
                        />

                        <Pressable
                          onPress={() => {
                            adjustQuantityCount(1);
                            Haptics.selectionAsync();
                          }}
                          onLongPress={() => startQuantityStepHold(1)}
                          onPressOut={stopQuantityStepHold}
                          delayLongPress={260}
                          style={{
                            width: 22,
                            height: 22,
                            borderRadius: 11,
                            backgroundColor: "#FFF",
                            alignItems: "center",
                            justifyContent: "center",
                            borderWidth: 1,
                            borderColor: "#E5E7EB",
                          }}
                          accessibilityRole="button"
                          accessibilityLabel="Increase quantity"
                        >
                          <ThemedText
                            style={{
                              fontSize: 14,
                              lineHeight: 14,
                              color: "#111827",
                              fontWeight: "500",
                            }}
                          >
                            +
                          </ThemedText>
                        </Pressable>
                      </View>

                      {/* Row: unit dropdown centered under number */}
                      <View
                        style={{
                          flexDirection: "row",
                          justifyContent: "center",
                          alignItems: "center",
                        }}
                      >
                        <Pressable
                          ref={unitDropdownTriggerRef}
                          onPress={() => {
                            // Dismiss keyboard first so dropdown isn't immediately closed
                            Keyboard.dismiss();
                            setTimeout(() => {
                              if (unitDropdownTriggerRef.current) {
                                unitDropdownTriggerRef.current.measureInWindow(
                                  (
                                    x: number,
                                    y: number,
                                    width: number,
                                    height: number
                                  ) => {
                                    let offsetY = y + height;
                                    if (Platform.OS === "android") {
                                      offsetY -= Constants.statusBarHeight || 0;
                                    } else {
                                      offsetY -= insets.top;
                                    }
                                    setDropdownPos({ x: x + width / 2, y: offsetY });
                                    setShowUnitDropdown(true);
                                  }
                                );
                              } else {
                                setShowUnitDropdown(true);
                              }
                            }, 10);
                          }}
                          style={{
                            minWidth: 44,
                            flexDirection: "row",
                            alignItems: "center",
                            justifyContent: "center",
                            paddingHorizontal: 6,
                            paddingVertical: 2,
                            borderRadius: 999,
                            backgroundColor: "#FFF",
                            borderWidth: 1,
                            borderColor: "#E5E7EB",
                            gap: 2,
                          }}
                          accessibilityRole="button"
                          accessibilityLabel="Select unit"
                        >
                          <ThemedText
                            style={{
                              color: "#222",
                              fontWeight: "500",
                              fontSize: 11,
                              fontFamily: Platform.OS === "ios" ? "System" : "Roboto",
                              textAlign: "center",
                            }}
                          >
                            {unit || "pcs"}
                          </ThemedText>
                          <ThemedText style={{ fontSize: 9, color: "#A1A1AB" }}>▾</ThemedText>
                        </Pressable>
                      </View>
                    </View>
                  </View>
                </View>
              </View>
            </View>

            {/* Category — DoorDash-style: Phosphor icons, 2 rows, compact pills */}
            <View style={{ width: "100%", marginBottom: 10 }}>
              <ThemedText
                style={{
                  fontSize: 12,
                  fontWeight: "500",
                  fontFamily: Platform.OS === "ios" ? "System" : "Roboto",
                  color: "#4B5563",
                  marginBottom: 2,
                }}
              >
                Category
              </ThemedText>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingRight: 16 }}
                style={{ marginHorizontal: -4 }}
              >
                <View
                  style={{
                    minWidth: width * 1.6,
                    flexDirection: "column",
                    gap: 4,
                  }}
                >
                  <View style={{ flexDirection: "row", gap: 6, flexWrap: "nowrap" }}>
                    {CATEGORY_ROW_1.map(({ label, Icon }) => {
                      const selected = category === label;
                      return (
                        <Pressable
                          key={label}
                          onPress={() => {
                            setCategory(label);
                            Haptics.selectionAsync();
                          }}
                          style={{
                            flexDirection: "row",
                            alignItems: "center",
                            paddingVertical: 4,
                            paddingHorizontal: 9,
                            borderRadius: 999,
                            backgroundColor: selected ? "#22C55E" : "#F0F0F0",
                            borderWidth: 0,
                            gap: 4,
                          }}
                          accessibilityRole="button"
                          accessibilityLabel={`Category ${label}`}
                          accessibilityState={{ selected }}
                        >
                          <Icon
                            size={13}
                            color={selected ? "#FFF" : "#1A1A1A"}
                            weight="regular"
                          />
                          <ThemedText
                            style={{
                              fontSize: 10,
                              fontWeight: "500",
                              fontFamily: Platform.OS === "ios" ? "System" : "Roboto",
                              color: selected ? "#FFF" : "#4B5563",
                            }}
                          >
                            {label}
                          </ThemedText>
                        </Pressable>
                      );
                    })}
                  </View>
                  <View style={{ flexDirection: "row", gap: 6, flexWrap: "nowrap" }}>
                    {CATEGORY_ROW_2.map(({ label, Icon }) => {
                      const selected = category === label;
                      return (
                        <Pressable
                          key={label}
                          onPress={() => {
                            setCategory(label);
                            Haptics.selectionAsync();
                          }}
                          style={{
                            flexDirection: "row",
                            alignItems: "center",
                            paddingVertical: 4,
                            paddingHorizontal: 9,
                            borderRadius: 999,
                            backgroundColor: selected ? "#22C55E" : "#F0F0F0",
                            borderWidth: 0,
                            gap: 4,
                          }}
                          accessibilityRole="button"
                          accessibilityLabel={`Category ${label}`}
                          accessibilityState={{ selected }}
                        >
                          <Icon
                            size={13}
                            color={selected ? "#FFF" : "#1A1A1A"}
                            weight="regular"
                          />
                          <ThemedText
                            style={{
                              fontSize: 10,
                              fontWeight: "500",
                              fontFamily: Platform.OS === "ios" ? "System" : "Roboto",
                              color: selected ? "#FFF" : "#4B5563",
                            }}
                          >
                            {label}
                          </ThemedText>
                        </Pressable>
                      );
                    })}
                  </View>
                </View>
              </ScrollView>
            </View>
            {/* Calendar full width below */}
            <View
              style={{
                width: "100%",
                marginTop: 0,
                alignItems: "center",
                paddingBottom: 0,
              }}
            >
              <ThemedText
                style={{
                  fontSize: 13,
                  fontWeight: "500",
                  fontFamily: Platform.OS === "ios" ? "System" : "Roboto",
                  color: "#4B5563",
                  marginBottom: -6,
                }}
              >
                Expiry Date
              </ThemedText>
              <View
                style={{
                  width: "92%",
                  maxWidth: 320,
                  marginLeft: "auto",
                  marginRight: "auto",
                  alignItems: "center",
                  marginTop: -4,
                  marginBottom: 0,
                  paddingBottom: 0,
                  paddingTop: 0,
                }}
              >
                <SimpleCalendar
                  key={`calendar-${String(params.id ?? "new")}`}
                  selectedDate={expiryDate}
                  onSelect={(date: Date) => {
                    setExpiryDate(date);
                    if (reminderDefaultModeRef.current) {
                      const daysAway = getCalendarDaysAway(date);
                      setCustomReminderUnit("days");
                      setCustomReminderCount(daysAway < 7 ? "1" : "7");
                    }
                  }}
                  onWeeksChange={(weeks) => setCalendarWeeks(weeks)}
                />
              </View>
            </View>
            <View
              style={{
                width: "100%",
                alignItems: "center",
                marginTop: calendarWeeks >= 6 ? 6 : 8,
                marginBottom: 6,
              }}
            >
              <Animated.View
                style={{
                  width: "92%",
                  maxWidth: 320,
                  height: notificationCardHeight,
                  borderRadius: 11,
                  backgroundColor: "#FFF",
                  borderWidth: 1.2,
                  borderColor: "#E5E7EB",
                  borderStyle: "solid",
                  overflow: "hidden",
                }}
              >
                <Pressable
                  onPress={() => {
                    setNotificationSettingsOpen((open) => !open);
                    Haptics.selectionAsync();
                  }}
                  style={{
                    height: 48,
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                    paddingHorizontal: 14,
                    paddingVertical: 5,
                }}
                accessibilityRole="button"
                accessibilityLabel="Notification settings"
                accessibilityState={{ expanded: notificationSettingsOpen }}
              >
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 8,
                    flex: 1,
                  }}
                >
                  <Ionicons name="notifications-outline" size={17} color="#22C55E" />
                  <View style={{ flex: 1 }}>
                    <ThemedText
                      style={{
                        color: "#111827",
                          fontSize: 13,
                          fontWeight: "500",
                          lineHeight: 16,
                        fontFamily: Platform.OS === "ios" ? "System" : "Roboto",
                      }}
                    >
                      Notifications
                    </ThemedText>
                  </View>
                </View>
                <Pressable
                  onPress={(event) => {
                    event.stopPropagation();
                    if (notificationsUnavailable) return;
                    setNotificationsEnabled((enabled) => !enabled);
                    Haptics.selectionAsync();
                  }}
                  disabled={notificationsUnavailable}
                  style={{
                    width: 34,
                    height: 20,
                    borderRadius: 999,
                    backgroundColor: notificationsEnabled ? "#16A34A" : "#E5E7EB",
                    justifyContent: "center",
                    paddingHorizontal: 2,
                    marginLeft: 8,
                    marginRight: 8,
                    opacity: notificationsUnavailable ? 0.55 : 1,
                  }}
                  accessibilityRole="switch"
                  accessibilityState={{ checked: notificationsEnabled }}
                  accessibilityLabel="Enable notifications"
                >
                  <Animated.View
                    style={{
                      width: 16,
                      height: 16,
                      borderRadius: 999,
                      backgroundColor: "#FFFFFF",
                      transform: [
                        {
                          translateX: notificationToggleAnim.interpolate({
                            inputRange: [0, 1],
                            outputRange: [0, 14],
                          }),
                        },
                      ],
                    }}
                  />
                </Pressable>
                <Ionicons
                  name={notificationSettingsOpen ? "chevron-up" : "chevron-down"}
                  size={16}
                  color="#22C55E"
                />
                </Pressable>
                <Animated.View
                  style={{
                    opacity: notificationBodyOpacity,
                    borderTopWidth: 1,
                    borderTopColor: "#D1D5DB",
                    marginHorizontal: 16,
                    paddingTop: 6,
                    paddingHorizontal: 8,
                  }}
                >
                  <View
                    style={{
                      borderTopWidth: 0,
                    }}
                  >
                    <Pressable
                      disabled={!notificationControlsEnabled}
                      onPress={() => {
                        setReminderMenuOpen((open) => !open);
                        setRepeatMenuOpen(false);
                        Haptics.selectionAsync();
                      }}
                      style={{
                        height: 36,
                        flexDirection: "row",
                        alignItems: "center",
                        justifyContent: "space-between",
                        opacity: notificationControlsEnabled ? 1 : 0.45,
                      }}
                    >
                      <ThemedText
                        style={{
                          color: "#111827",
                          fontSize: 13,
                          fontWeight: "500",
                          fontFamily: Platform.OS === "ios" ? "System" : "Roboto",
                        }}
                      >
                        Reminder
                      </ThemedText>
                      <View
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          gap: 8,
                        }}
                      >
                        <ThemedText
                          style={{
                            color: "#111827",
                            fontSize: 13,
                            fontWeight: "500",
                            fontFamily: Platform.OS === "ios" ? "System" : "Roboto",
                          }}
                        >
                          {reminderLabel}
                        </ThemedText>
                        <Ionicons
                          name={reminderMenuOpen ? "chevron-up" : "chevron-down"}
                          size={17}
                          color="#22C55E"
                        />
                      </View>
                    </Pressable>

                    {reminderMenuOpen && (
                      <View
                        style={{
                          borderTopWidth: 0,
                          paddingTop: 8,
                          paddingBottom: 8,
                        }}
                      >
                        <View
                          style={{
                            borderWidth: 1,
                            borderColor: "#E5E7EB",
                            borderRadius: 10,
                            paddingVertical: 10,
                            paddingHorizontal: 12,
                            backgroundColor: "#FFF",
                          }}
                        >
                          <View
                            style={{
                              flexDirection: "row",
                              alignItems: "center",
                              justifyContent: "center",
                              gap: 8,
                            }}
                          >
                            <Pressable
                              disabled={parsedReminderCount <= 1}
                              onPress={() => {
                                reminderDefaultModeRef.current = false;
                                adjustReminderCount(-1);
                                Haptics.selectionAsync();
                              }}
                              onLongPress={() => {
                                reminderDefaultModeRef.current = false;
                                startReminderStepHold(-1);
                              }}
                              onPressOut={stopReminderStepHold}
                              delayLongPress={260}
                              style={({ pressed }) => ({
                                width: 36,
                                height: 34,
                                borderRadius: 8,
                                borderWidth: 1,
                                borderColor: "#E5E7EB",
                                alignItems: "center",
                                justifyContent: "center",
                                backgroundColor:
                                  pressed && parsedReminderCount > 1
                                    ? "#F9FAFB"
                                    : "#FFF",
                                opacity: parsedReminderCount > 1 ? 1 : 0.45,
                              })}
                            >
                              <Ionicons name="remove" size={20} color="#22C55E" />
                            </Pressable>

                            <TextInput
                              value={customReminderCount}
                              onChangeText={(text) => {
                                reminderDefaultModeRef.current = false;
                                const clean = text.replace(/\D/g, "").slice(0, 3);
                                if (!clean) {
                                  setCustomReminderCount("");
                                  return;
                                }
                                setClampedReminderCount(parseInt(clean, 10));
                              }}
                              onBlur={() => {
                                reminderDefaultModeRef.current = false;
                                if (!customReminderCount.trim()) {
                                  setClampedReminderCount(1);
                                }
                              }}
                              keyboardType="number-pad"
                              selectTextOnFocus
                              style={{
                                width: 80,
                                height: 34,
                                borderRadius: 8,
                                borderWidth: 1,
                                borderColor: "#E5E7EB",
                                textAlign: "center",
                                textAlignVertical: "center",
                                color: "#111827",
                                fontSize: 18,
                                fontWeight: "600",
                                lineHeight: 22,
                                includeFontPadding: false,
                                paddingVertical: 0,
                                paddingHorizontal: 6,
                              }}
                            />

                            <Pressable
                              disabled={
                                maxReminderCount < 1 ||
                                parsedReminderCount >= maxReminderCount
                              }
                              onPress={() => {
                                reminderDefaultModeRef.current = false;
                                adjustReminderCount(1);
                                Haptics.selectionAsync();
                              }}
                              onLongPress={() => {
                                reminderDefaultModeRef.current = false;
                                startReminderStepHold(1);
                              }}
                              onPressOut={stopReminderStepHold}
                              delayLongPress={260}
                              style={({ pressed }) => {
                                const canIncrease =
                                  maxReminderCount >= 1 &&
                                  parsedReminderCount < maxReminderCount;
                                return {
                                  width: 36,
                                  height: 34,
                                  borderRadius: 8,
                                  borderWidth: 1,
                                  borderColor: "#E5E7EB",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  backgroundColor:
                                    pressed && canIncrease ? "#F9FAFB" : "#FFF",
                                  opacity: canIncrease ? 1 : 0.45,
                                };
                              }}
                            >
                              <Ionicons name="add" size={21} color="#22C55E" />
                            </Pressable>
                          </View>

                          <View
                            style={{
                              flexDirection: "row",
                              alignItems: "center",
                              justifyContent: "space-between",
                              gap: 6,
                              marginTop: 10,
                            }}
                          >
                            {REMINDER_QUICK_OPTIONS.map((option) => {
                              const optionEnabled =
                                !hasExpiryDate ||
                                option.days <= latestValidReminderDays;
                              const selected = reminderOffsetDays === option.days;

                              return (
                                <Pressable
                                  key={option.label}
                                  disabled={!optionEnabled}
                                  onPress={() => {
                                    if (!optionEnabled) return;
                                    reminderDefaultModeRef.current = false;
                                    setCustomReminderUnit("days");
                                    setCustomReminderCount(String(option.days));
                                    Haptics.selectionAsync();
                                  }}
                                  style={({ pressed }) => ({
                                    flex: 1,
                                    height: 30,
                                    minWidth: 36,
                                    borderRadius: 15,
                                    borderWidth: 1,
                                    borderColor: selected ? "#22C55E" : "#E5E7EB",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    backgroundColor: selected
                                      ? "#DCFCE7"
                                      : pressed && optionEnabled
                                        ? "#F9FAFB"
                                        : "#F8FAFC",
                                    opacity: optionEnabled ? 1 : 0.35,
                                  })}
                                >
                                  <ThemedText
                                    style={{
                                      color: selected ? "#16A34A" : "#374151",
                                      fontSize: 13,
                                      fontWeight: "600",
                                    }}
                                  >
                                    {option.label}
                                  </ThemedText>
                                </Pressable>
                              );
                            })}
                          </View>
                        </View>

                      </View>
                    )}

                    <Pressable
                      disabled={!notificationControlsEnabled}
                      onPress={openNotificationTimePicker}
                      style={{
                        height: 36,
                        borderTopWidth: 1,
                        borderTopColor: "#E5E7EB",
                        flexDirection: "row",
                        alignItems: "center",
                        justifyContent: "space-between",
                        opacity: notificationControlsEnabled ? 1 : 0.45,
                      }}
                    >
                      <ThemedText
                        style={{
                          color: "#111827",
                          fontSize: 13,
                          fontWeight: "500",
                          fontFamily: Platform.OS === "ios" ? "System" : "Roboto",
                        }}
                      >
                        Time
                      </ThemedText>
                      <View
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          gap: 8,
                        }}
                      >
                        <ThemedText
                          style={{
                            color: "#111827",
                            fontSize: 13,
                            fontWeight: "500",
                            fontFamily: Platform.OS === "ios" ? "System" : "Roboto",
                          }}
                        >
                          {notificationTimeLabel}
                        </ThemedText>
                        <Ionicons name="chevron-down" size={17} color="#22C55E" />
                      </View>
                    </Pressable>

                    <Pressable
                      onPress={() => {
                        setRepeatMenuOpen((open) => !open);
                        setReminderMenuOpen(false);
                        Haptics.selectionAsync();
                      }}
                      disabled={!notificationControlsEnabled}
                      style={{
                        height: 36,
                        borderTopWidth: 1,
                        borderTopColor: "#E5E7EB",
                        flexDirection: "row",
                        alignItems: "center",
                        justifyContent: "space-between",
                        opacity: notificationControlsEnabled ? 1 : 0.45,
                      }}
                    >
                      <ThemedText
                        style={{
                          color: "#111827",
                          fontSize: 13,
                          fontWeight: "500",
                          fontFamily: Platform.OS === "ios" ? "System" : "Roboto",
                        }}
                      >
                        Repeat
                      </ThemedText>
                      <View
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          gap: 8,
                        }}
                      >
                        <ThemedText
                          style={{
                            color: "#111827",
                            fontSize: 13,
                            fontWeight: "500",
                            fontFamily: Platform.OS === "ios" ? "System" : "Roboto",
                          }}
                        >
                          {repeatOption}
                        </ThemedText>
                        <Ionicons
                          name={repeatMenuOpen ? "chevron-up" : "chevron-down"}
                          size={17}
                          color="#22C55E"
                        />
                      </View>
                    </Pressable>

                    {repeatMenuOpen && (
                      <View
                        style={{
                          borderTopWidth: 1,
                          borderTopColor: "#E5E7EB",
                          paddingVertical: 2,
                        }}
                      >
                        {REPEAT_OPTIONS.map((option) => {
                          const optionEnabled = isRepeatOptionEnabled(
                            option,
                            expiryDaysAway
                          );
                          const selected = repeatOption === option;

                          return (
                            <Pressable
                              key={option}
                              disabled={!optionEnabled}
                              onPress={() => {
                                if (!optionEnabled) return;
                                setRepeatOption(option);
                                setRepeatMenuOpen(false);
                                Haptics.selectionAsync();
                              }}
                              style={({ pressed }) => ({
                                height: 22,
                                flexDirection: "row",
                                alignItems: "center",
                                justifyContent: "space-between",
                                paddingHorizontal: 8,
                                borderRadius: 7,
                                opacity: optionEnabled ? 1 : 0.38,
                                backgroundColor: selected
                                  ? "#ECFDF3"
                                  : pressed && optionEnabled
                                    ? "#F9FAFB"
                                    : "#FFF",
                              })}
                            >
                              <ThemedText
                                style={{
                                  color: selected ? "#166534" : "#4B5563",
                                  fontSize: 11,
                                  fontWeight: "500",
                                  fontFamily: Platform.OS === "ios" ? "System" : "Roboto",
                                }}
                              >
                                {option}
                              </ThemedText>
                              {selected && optionEnabled && (
                                <Ionicons name="checkmark" size={15} color="#22C55E" />
                              )}
                            </Pressable>
                          );
                        })}
                      </View>
                    )}

                    {!repeatMenuOpen && !reminderMenuOpen && (
                      <View
                        style={{
                          marginTop: 5,
                          borderTopWidth: 1,
                          borderTopColor: "#E5E7EB",
                          minHeight: 42,
                          paddingTop: 8,
                          paddingHorizontal: 8,
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <ThemedText
                          style={{
                            color: reminderPreviewIsGuidance ? "#64748B" : "#16A34A",
                            fontSize: 12,
                            fontWeight: "600",
                            textAlign: "center",
                            lineHeight: 16,
                            fontFamily: Platform.OS === "ios" ? "System" : "Roboto",
                          }}
                          numberOfLines={2}
                        >
                          {reminderPreviewText}
                        </ThemedText>
                      </View>
                    )}
                  </View>
                </Animated.View>
              </Animated.View>
            </View>
            {/* FloatingAddItemButton below the calendar, kept a bit higher so it doesn't sit too close to the bottom even with tall calendars */}
            <View
              style={{
                width: "100%",
                alignItems: "center",
                marginTop: calendarWeeks >= 6 ? 4 : 8,
                paddingBottom: notificationSettingsOpen
                  ? insets.bottom + (calendarWeeks >= 6 ? 28 : 36)
                  : insets.bottom + (calendarWeeks >= 6 ? 8 : 20),
              }}
            >
              <FloatingAddItemButton
                onPress={handleSave}
                disabled={
                  !name.trim() ||
                  !quantity.trim() ||
                  !unit.trim() ||
                  !location ||
                  !category ||
                  !expiryDate ||
                  notificationReminderInvalid
                }
                loading={loading}
                singleLineText
                isEditing={isEditing}
              />
            </View>
          </ScrollView>
        </Animated.View>
      </KeyboardAvoidingView>
      )}
      {/* Dropdown overlays moved here, as siblings to KeyboardAvoidingView */}
      {showUnitDropdown && (
        <>
          <Pressable
            onPress={() => setShowUnitDropdown(false)}
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: "rgba(0,0,0,0.01)",
              zIndex: 1000,
            }}
          />
          <View
            style={{
              position: "absolute",
              top: dropdownPos.y + 25,
              left: unitDropdownLeft,
              width: UNIT_DROPDOWN_WIDTH,
              backgroundColor: "#FFF",
              borderRadius: 12,
              borderWidth: 1,
              borderColor: "#E5E7EB",
              zIndex: 1001,
              elevation: 8,
              shadowColor: "#000",
              shadowOpacity: 0.08,
              shadowRadius: 10,
              overflow: "hidden",
              alignSelf: "center",
            }}
          >
            <ScrollView
              style={{ maxHeight: 160, zIndex: 1 }}
              showsVerticalScrollIndicator={true}
              persistentScrollbar={true}
              contentContainerStyle={{ paddingVertical: 4, paddingBottom: 8 }}
            >
              {commonUnits.map((u, i) => (
                <Pressable
                  key={u}
                  onPress={() => {
                    setUnit(u);
                    setShowUnitDropdown(false);
                    Haptics.selectionAsync();
                  }}
                  style={{
                    alignItems: "center",
                    paddingVertical: 6,
                    paddingHorizontal: 10,
                    backgroundColor: unit === u ? "#DCFCE7" : "#FFF",
                    marginHorizontal: 8,
                    marginVertical: 1,
                    borderRadius: 8,
                  }}
                >
                  <ThemedText
                    style={{
                      color: unit === u ? "#166534" : "#111827",
                      fontWeight: "500",
                      fontSize: 13,
                      lineHeight: 18,
                      textAlign: "center",
                      fontFamily: Platform.OS === "ios" ? "System" : "Roboto",
                    }}
                  >
                    {u}
                  </ThemedText>
                </Pressable>
              ))}
            </ScrollView>
            <Pressable
              onPress={() => setShowUnitDropdown(false)}
              style={{
                paddingVertical: 8,
                paddingHorizontal: 10,
                alignItems: "center",
                borderTopWidth: 1,
                borderColor: "#E5E7EB",
                backgroundColor: "#FFF",
                borderBottomLeftRadius: 12,
                borderBottomRightRadius: 12,
              }}
            >
              <ThemedText
                style={{
                  color: "#166534",
                  fontWeight: "500",
                  fontSize: 14,
                  letterSpacing: 0.2,
                  fontFamily: Platform.OS === "ios" ? "System" : "Roboto",
                }}
              >
                Cancel
              </ThemedText>
            </Pressable>
          </View>
        </>
      )}
      {showNotificationTimePicker && Platform.OS === "android" && (
        <DateTimePicker
          value={notificationTime}
          mode="time"
          display="default"
          onChange={handleAndroidNotificationTimeChange}
        />
      )}
      {showNotificationTimePicker && Platform.OS !== "android" && (
        <Modal
          transparent
          animationType="fade"
          visible={showNotificationTimePicker}
          onRequestClose={() => setShowNotificationTimePicker(false)}
        >
          <View
            style={{
              flex: 1,
              backgroundColor: "rgba(15,23,42,0.35)",
              justifyContent: "center",
              paddingHorizontal: 24,
            }}
          >
            <View
              style={{
                backgroundColor: "#FFF",
                borderRadius: 18,
                padding: 16,
              }}
            >
              <DateTimePicker
                value={pendingNotificationTime}
                mode="time"
                display="spinner"
                onChange={(_, selectedDate) => {
                  if (selectedDate) setPendingNotificationTime(selectedDate);
                }}
              />
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "flex-end",
                  gap: 12,
                  marginTop: 12,
                }}
              >
                <Pressable
                  onPress={() => setShowNotificationTimePicker(false)}
                  style={{ paddingHorizontal: 12, paddingVertical: 8 }}
                >
                  <Text style={{ color: "#6B7280", fontWeight: "600" }}>
                    Cancel
                  </Text>
                </Pressable>
                <Pressable
                  onPress={applyIosNotificationTime}
                  style={{
                    paddingHorizontal: 16,
                    paddingVertical: 8,
                    borderRadius: 999,
                    backgroundColor: "#22C55E",
                  }}
                >
                  <Text style={{ color: "#FFF", fontWeight: "700" }}>Done</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>
      )}
      {showSuccess && (
        <>
          {/* Success badge (no full-screen dim) */}
          <Animated.View
            style={{
              position: "absolute",
              top: "40%",
              left: 0,
              right: 0,
              alignItems: "center",
              zIndex: 999,
              opacity: successAnim,
              transform: [
                { scale: Animated.multiply(successScale, successPopScale) },
                { translateY: successTranslateY },
              ],
            }}
          >
            <View style={styles.successCard}>
              <Ionicons name="checkmark-circle" size={78} color="#22C55E" />
              <Text style={styles.successText}>{isEditing ? "Item Edited!" : "Item Added!"}</Text>
            </View>
          </Animated.View>
        </>
      )}
      <OfflineNoticeModal
        visible={offlineNoticeVisible}
        onDismiss={() => setOfflineNoticeVisible(false)}
      />
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  header: {
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
    alignItems: "center",
  },
  form: {
    paddingHorizontal: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
  },
  input: {
    height: 50,
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 16,
  },
  textArea: {
    height: 80,
    paddingTop: 12,
    textAlignVertical: "top",
  },
  row: {
    flexDirection: "row",
    gap: 16,
  },
  successCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    paddingVertical: 16,
    paddingHorizontal: 18,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  successText: {
    fontSize: 18,
    color: "#16A34A",
    fontWeight: "800",
    marginTop: 10,
    letterSpacing: 0.2,
  },
  halfWidth: {
    flex: 1,
  },
  unitContainer: {
    height: 50,
  },
  unitButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: "#E0E0E0",
    marginRight: 8,
    height: 36,
    justifyContent: "center",
  },
  unitButtonActive: {
    backgroundColor: "#007AFF",
  },
  unitText: {
    fontSize: 14,
    fontWeight: "500",
  },
  unitTextActive: {
    color: "#FFF",
    fontSize: 14,
    fontWeight: "500",
  },
  locationContainer: {
    flexDirection: "row",
    gap: 12,
  },
  locationButton: {
    flex: 1,
    height: 50,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#E0E0E0",
  },
  locationButtonActive: {
    backgroundColor: "#007AFF",
  },
  locationText: {
    fontSize: 16,
    fontWeight: "600",
  },
  locationTextActive: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "600",
  },
  categoryScroll: {
    maxHeight: 40,
  },
  categoryButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: "#E0E0E0",
    marginRight: 8,
    height: 36,
    justifyContent: "center",
  },
  categoryButtonActive: {
    backgroundColor: "#007AFF",
  },
  categoryText: {
    fontSize: 14,
    fontWeight: "500",
  },
  categoryTextActive: {
    color: "#FFF",
    fontSize: 14,
    fontWeight: "500",
  },
  dateButton: {
    height: 50,
    borderRadius: 8,
    paddingHorizontal: 16,
    justifyContent: "center",
  },
  saveButton: {
    height: 50,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 20,
  },
  saveButtonDisabled: {
    opacity: 0.7,
  },
  saveButtonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "600",
  },
  loadingContainer: {
    justifyContent: "center",
    alignItems: "center",
  },
  inputWithPreview: {
    position: "relative",
    flexDirection: "row",
    alignItems: "center",
  },
  inputWithIcon: {
    flex: 1,
    paddingRight: 50, // Make room for the icon
  },
  foodIconPreview: {
    position: "absolute",
    right: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  suggestionContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  floatingInput: {
    height: 50,
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 16,
    backgroundColor: "#F5F5F5",
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  floatingLabel: {
    position: "absolute",
    top: 20,
    left: 16,
    fontSize: 16,
    color: "#999",
    backgroundColor: "transparent",
    zIndex: 1,
  },
});

interface GradientAddItemButtonProps {
  onPress: () => void;
  disabled: boolean;
  loading: boolean;
  isEditing?: boolean;
}

function GradientAddItemButton(props: GradientAddItemButtonProps) {
  const { onPress, disabled, loading, isEditing } = props;
  const actionLabel = isEditing ? "Edit Item" : "Add Item";
  const scale = useRef(new Animated.Value(1)).current;

  function handlePressIn() {
    Animated.spring(scale, { toValue: 0.97, useNativeDriver: true }).start();
  }
  function handlePressOut() {
    Animated.spring(scale, { toValue: 1, useNativeDriver: true }).start();
  }

  return (
    <Animated.View
      style={{
        transform: [{ scale }],
        width: "100%",
        alignItems: "center",
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 10,
        paddingBottom: 12,
        backgroundColor: "transparent",
      }}
    >
      <Pressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled || loading}
        style={{
          width: "90%",
          height: 52,
          borderRadius: 26,
          overflow: "hidden",
          opacity: loading ? 1 : disabled ? 0.6 : 1,
          shadowColor: "#22C55E",
          shadowOpacity: loading || !disabled ? 0.12 : 0,
          shadowRadius: 8,
          elevation: loading || !disabled ? 4 : 0,
          borderWidth: loading ? 2 : 0,
          borderColor: loading ? "#22C55E" : "transparent",
        }}
      >
        <LinearGradient
          colors={
            loading
              ? ["#FFFFFF", "#FFFFFF"]
              : disabled
                ? ["#A1A1AB", "#A1A1AB"]
                : ["#22C55E", "#16A34A"]
          }
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={{
            flex: 1,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: 26,
            paddingHorizontal: 12,
          }}
        >
          {loading ? (
            <ActivityIndicator color="#22C55E" size="small" />
          ) : (
            <>
              <Ionicons name="add" size={24} color="#FFF" style={{ marginRight: 10 }} />
              <Text
                style={{
                  color: "#FFF",
                  fontSize: 20,
                  fontWeight: "700",
                  fontFamily: Platform.OS === "ios" ? "System" : "Roboto",
                  letterSpacing: 0.5,
                }}
              >
                {actionLabel}
              </Text>
            </>
          )}
        </LinearGradient>
      </Pressable>
    </Animated.View>
  );
}

function FloatingAddItemButton(props: {
  onPress: () => void;
  disabled: boolean;
  loading: boolean;
  singleLineText?: boolean;
  isEditing?: boolean;
}) {
  const { onPress, disabled, loading, singleLineText, isEditing } = props;
  const actionLabel = isEditing ? "Edit Item" : "Add Item";
  const scale = useRef(new Animated.Value(1)).current;

  function handlePressIn() {
    Animated.spring(scale, { toValue: 0.95, useNativeDriver: true }).start();
  }
  function handlePressOut() {
    Animated.spring(scale, { toValue: 1, useNativeDriver: true }).start();
  }

  return (
    <Animated.View
      style={{
        // Remove position: 'absolute' and right/bottom for centering
        transform: [{ scale }],
        shadowColor: "#22C55E",
        shadowOpacity: disabled ? 0 : 0.18,
        shadowRadius: 8,
        elevation: disabled ? 0 : 6,
      }}
    >
      <Pressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled || loading}
        style={{
          minWidth: 70,
          height: 44,
          borderRadius: 22,
          backgroundColor: loading ? "#FFFFFF" : disabled ? "#A1EACB" : "#22C55E",
          alignItems: "center",
          justifyContent: "center",
          opacity: loading ? 1 : disabled ? 0.7 : 1,
          paddingHorizontal: 18,
          borderWidth: loading ? 2 : 0,
          borderColor: loading ? "#22C55E" : "transparent",
        }}
        accessibilityRole="button"
        accessibilityLabel={actionLabel}
      >
        {loading ? (
          <ActivityIndicator color="#22C55E" size="small" />
        ) : (
          <Text
            style={{
              color: "#FFF",
              fontSize: 15,
              fontWeight: "700",
              fontFamily: Platform.OS === "ios" ? "System" : "Roboto",
              letterSpacing: 0.5,
              textAlign: "center",
              lineHeight: 18,
            }}
          >
            {singleLineText ? actionLabel : actionLabel.replace(" ", "\n")}
          </Text>
        )}
      </Pressable>
    </Animated.View>
  );
}
