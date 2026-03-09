import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import { FoodItem } from "@/lib/supabase";
import { foodItemsService } from "@/services/foodItems";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import Constants from "expo-constants";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Easing,
  Image,
  KeyboardAvoidingView,
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
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
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
import { SimpleCalendar } from "./SimpleCalendar";

// Move these up before their first use
const commonUnits = [
  "pcs",
  "kg",
  "g",
  "lb",
  "oz",
  "L",
  "ml",
  "pack",
  "can",
  "jar",
  "bottle",
  "box",
  "bag",
  "servings",
  "portion",
];

const CATEGORY_OPTIONS: {
  label: string;
  Icon: React.ComponentType<{ size?: number; color?: string; weight?: "regular" | "fill" | "bold" }>;
}[] = [
  { label: "Dairy", Icon: DropIcon },
  { label: "Meat", Icon: BoneIcon },
  { label: "Seafood", Icon: FishIcon },
  { label: "Vegetables", Icon: CarrotIcon },
  { label: "Fruits", Icon: AppleLogoIcon },
  { label: "Bakery", Icon: BreadIcon },
  { label: "Eggs", Icon: EggIcon },
  { label: "Grains", Icon: GrainsIcon },
  { label: "Snacks", Icon: CookieIcon },
  { label: "Beverages", Icon: CoffeeIcon },
  { label: "Condiments", Icon: BeerBottleIcon },
  { label: "Prepared Meals", Icon: CookingPotIcon },
  { label: "Frozen", Icon: SnowflakeIcon },
  { label: "Other", Icon: PackageIcon },
];
const CATEGORY_LABELS = CATEGORY_OPTIONS.map((o) => o.label);

const CHIPS_PER_ROW = 7;
const CATEGORY_ROW_1 = CATEGORY_OPTIONS.slice(0, CHIPS_PER_ROW);
const CATEGORY_ROW_2 = CATEGORY_OPTIONS.slice(CHIPS_PER_ROW);

export default function AddItemScreen() {
  const params = useLocalSearchParams<{ edit: string; id: string }>();
  const isEditing = params.edit === "true" && Boolean(params.id);

  const [name, setName] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [unit, setUnit] = useState("pcs");
  const [location, setLocation] = useState<"fridge" | "shelf">("fridge");
  const [category, setCategory] = useState("");
  const [expiryDate, setExpiryDate] = useState<Date | null>(null);
  const [notes, setNotes] = useState("");
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(isEditing);
  const colorScheme = useColorScheme();
  const [notesFocused, setNotesFocused] = useState(false);
  const [showUnitDropdown, setShowUnitDropdown] = useState(false);
  const unitDropdownTriggerRef = useRef<View>(null);
  const [dropdownPos, setDropdownPos] = useState<{ x: number; y: number }>({
    x: 0,
    y: 0,
  });

  // State for suggestions
  const [suggestions, setSuggestions] = useState<FoodItem[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const [calendarWeeks, setCalendarWeeks] = useState(5);

  const { width } = useWindowDimensions();
  const addButtonScale = useRef(new Animated.Value(1)).current;
  const [showSuccess, setShowSuccess] = useState(false);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const successAnim = useRef(new Animated.Value(0)).current;
  const successScale = successAnim.interpolate({
    inputRange: [0, 0.7, 1],
    outputRange: [0.8, 1.05, 1],
  });
  const successTranslateY = successAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [24, 0],
  });
  const insets = useSafeAreaInsets();

  // Calendar context for real-time updates after save
  const { refresh, invalidateCache } = useCalendar();

  // Add icon requires
  const fridgeIcon = require("../assets/images/icons/fridge_icon.png");
  const shelfIcon = require("../assets/images/icons/shelf_icon.png");

  // Layout constants
  const UNIT_DROPDOWN_WIDTH = 115;
  const unitDropdownLeft = Math.min(
    Math.max(dropdownPos.x - 10, 16),
    width - 25 - UNIT_DROPDOWN_WIDTH
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

  // Reset form and success state when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      // Reset success state
      setShowSuccess(false);
      fadeAnim.setValue(1);

      // Reset form fields if not editing
      if (!isEditing) {
        setName("");
        setQuantity("1");
        setUnit("pcs");
        setLocation("fridge");
        setCategory("");
        setExpiryDate(null);
        setNotes("");
        setShowUnitDropdown(false);
      }
    }, [isEditing])
  );

  const loadExistingItems = async () => {
    try {
      const existingItems = await foodItemsService.getItems();
      setSuggestions(existingItems);
    } catch (error) {
      console.error("Failed to load suggestions:", error);
    }
  };

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
      setInitialLoading(true);
      // Get items and find the one with matching ID
      const items = await foodItemsService.getItems();
      const item = items.find((item) => item.id === params.id);

      if (item) {
        setName(item.name);
        setQuantity(String(item.quantity));
        setUnit(item.unit || "pcs");
        setLocation(item.location as "fridge" | "shelf");
        const cat = item.category || "";
        // Map legacy categories to chip set (Dairy, Meat, Vegetables, Fruits, Beverages, Other)
        setCategory(CATEGORY_LABELS.includes(cat) ? cat : cat ? "Other" : "");
        setNotes(item.notes || "");
        if (item.expiry_date) {
          setExpiryDate(new Date(item.expiry_date));
        }
      } else {
        Alert.alert("Error", "Item not found");
        router.back();
      }
    } catch (error: any) {
      Alert.alert("Error", error.message);
    } finally {
      setInitialLoading(false);
    }
  };

  const handleSave = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (!name.trim()) {
      Alert.alert("Error", "Please enter an item name");
      return;
    }

    const quantityNum = parseFloat(quantity);
    if (isNaN(quantityNum) || quantityNum <= 0) {
      Alert.alert("Error", "Please enter a valid quantity");
      return;
    }

    setLoading(true);
    try {
      const itemData = {
        name: name.trim(),
        quantity: quantityNum,
        unit: unit.trim() || undefined,
        location,
        category: category.trim() || undefined,
        expiry_date: expiryDate?.toISOString().split("T")[0],
        notes: notes.trim() || undefined,
      };

      if (isEditing) {
        await foodItemsService.updateItem(params.id!, itemData);
        // Immediately propagate changes to calendar/state
        try {
          invalidateCache();
          await refresh();
        } catch {}
        setShowSuccess(true);
        successAnim.setValue(0);
        Animated.timing(successAnim, {
          toValue: 1,
          duration: 400,
          easing: Easing.out(Easing.exp),
          useNativeDriver: true,
        }).start();
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 450,
          useNativeDriver: true,
        }).start(() => {
          setTimeout(() => {
            router.back();
          }, 600);
        });
      } else {
        await foodItemsService.addItem(itemData);
        // Immediately propagate new item to calendar/state
        try {
          invalidateCache();
          await refresh();
        } catch {}
        setShowSuccess(true);
        successAnim.setValue(0);
        Animated.timing(successAnim, {
          toValue: 1,
          duration: 400,
          easing: Easing.out(Easing.exp),
          useNativeDriver: true,
        }).start();
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 450,
          useNativeDriver: true,
        }).start(() => {
          setTimeout(() => {
            router.back();
          }, 600);
        });

        // Reset form only if adding new item
        setName("");
        setQuantity("1");
        setUnit("pcs");
        setCategory("");
        setExpiryDate(null);
        setNotes("");
      }
    } catch (error: any) {
      Alert.alert("Error", error.message);
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <ThemedView style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator
          size="large"
          color={Colors[colorScheme ?? "light"].tint}
        />
      </ThemedView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#FFF" }}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFF" />
      {/* Add Item Heading with green background */}
      <View
        style={{
          width: "100%",
          backgroundColor: "#22C55E",
          paddingTop: 18,
          paddingBottom: 10,
          alignItems: "center",
          borderBottomLeftRadius: 18,
          borderBottomRightRadius: 18,
          marginBottom: 0,
        }}
      >
        <ThemedText
          style={{
            fontSize: 22,
            fontWeight: "900",
            fontFamily: Platform.OS === "ios" ? "System" : "Roboto",
            color: "#FFF",
            letterSpacing: 0.5,
            textAlign: "center",
          }}
        >
          Add Item
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
          to
        </ThemedText>
      </View>
      {/* Fridge/Shelf buttons below heading */}
      <View
        style={{
          flexDirection: "row",
          justifyContent: "center",
          alignItems: "center",
          gap: 16,
          marginTop: -18,
          marginBottom: 18,
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
      {/* Main Content with horizontal padding */}
      {!showSuccess && (
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 24}
        >
          <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
            <View
              style={{
                flex: 1,
                backgroundColor: "#FFF",
                paddingHorizontal: 16,
                paddingBottom: 32,
                justifyContent: "flex-start",
              }}
            >
            {/* Name | Quantity (same row) */}
            <View style={{ width: "100%", marginBottom: 16, alignItems: "center" }}>
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
                        marginBottom: 6,
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
                            top: 14,
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
                          paddingVertical: 10,
                          width: "100%",
                          height: 44,
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
                        marginBottom: 6,
                        marginLeft: 10,
                      }}
                    >
                      Quantity
                    </ThemedText>
                    <View
                      style={{
                        height: 44,
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
                          marginBottom: 2,
                        }}
                      >
                        <Pressable
                          onPress={() => {
                            setQuantity((q) =>
                              String(Math.max(1, (parseInt(q) || 1) - 1))
                            );
                            Haptics.selectionAsync();
                          }}
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
                            style={{ fontSize: 14, color: "#111827", fontWeight: "800" }}
                          >
                            −
                          </ThemedText>
                        </Pressable>

                        <ThemedText
                          style={{
                            minWidth: 18,
                            textAlign: "center",
                            fontSize: 15,
                            color: "#111",
                            fontWeight: "800",
                            fontFamily: Platform.OS === "ios" ? "System" : "Roboto",
                          }}
                        >
                          {String(Math.max(1, parseInt(quantity) || 1))}
                        </ThemedText>

                        <Pressable
                          onPress={() => {
                            setQuantity((q) =>
                              String(Math.min(999, (parseInt(q) || 1) + 1))
                            );
                            Haptics.selectionAsync();
                          }}
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
                            style={{ fontSize: 14, color: "#111827", fontWeight: "800" }}
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
                                  setDropdownPos({ x, y: offsetY });
                                  setShowUnitDropdown(true);
                                }
                              );
                            } else {
                              setShowUnitDropdown(true);
                            }
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
                              fontWeight: "700",
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
            <View style={{ width: "100%", marginBottom: 16 }}>
              <ThemedText
                style={{
                  fontSize: 12,
                  fontWeight: "500",
                  fontFamily: Platform.OS === "ios" ? "System" : "Roboto",
                  color: "#4B5563",
                  marginBottom: 6,
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
                    gap: 5,
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
                            paddingVertical: 6,
                            paddingHorizontal: 10,
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
                            size={14}
                            color={selected ? "#FFF" : "#1A1A1A"}
                            weight="regular"
                          />
                          <ThemedText
                            style={{
                              fontSize: 11,
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
                            paddingVertical: 6,
                            paddingHorizontal: 10,
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
                            size={14}
                            color={selected ? "#FFF" : "#1A1A1A"}
                            weight="regular"
                          />
                          <ThemedText
                            style={{
                              fontSize: 11,
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
                  marginBottom: 2,
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
                  marginTop: 0,
                  marginBottom: 0,
                  paddingBottom: 0,
                  paddingTop: 0,
                }}
              >
                <SimpleCalendar
                  selectedDate={expiryDate}
                  onSelect={(date: Date) => setExpiryDate(date)}
                  onWeeksChange={(weeks) => setCalendarWeeks(weeks)}
                />
              </View>
            </View>
            {/* FloatingAddItemButton below the calendar, kept a bit higher so it doesn't sit too close to the bottom even with tall calendars */}
            <View
              style={{
                width: "100%",
                alignItems: "center",
                marginTop: calendarWeeks >= 6 ? 4 : 12,
                paddingBottom:
                  insets.bottom + (calendarWeeks >= 6 ? 8 : 20),
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
                  loading
                }
                loading={loading}
                singleLineText
              />
            </View>
          </View>
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
                  fontSize: 13,
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
      {showSuccess && (
        <>
          {/* Dim background */}
          <Animated.View
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: "rgba(15,23,42,0.35)",
              opacity: successAnim,
              zIndex: 998,
            }}
          />
          {/* Success badge */}
          <Animated.View
            style={{
              position: "absolute",
              top: "40%",
              left: 0,
              right: 0,
              alignItems: "center",
              zIndex: 999,
              opacity: successAnim,
              transform: [{ scale: successScale }, { translateY: successTranslateY }],
            }}
          >
            <Ionicons name="checkmark-circle" size={80} color="#22C55E" />
            <Text
              style={{
                fontSize: 22,
                color: "#22C55E",
                fontWeight: "bold",
                marginTop: 12,
              }}
            >
              Item Added!
            </Text>
          </Animated.View>
        </>
      )}
    </SafeAreaView>
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
}

function GradientAddItemButton(props: GradientAddItemButtonProps) {
  const { onPress, disabled, loading } = props;
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
          opacity: disabled ? 0.6 : 1,
          shadowColor: "#22C55E",
          shadowOpacity: disabled ? 0 : 0.18,
          shadowRadius: 8,
          elevation: disabled ? 0 : 4,
        }}
      >
        <LinearGradient
          colors={disabled ? ["#A1A1AB", "#A1A1AB"] : ["#22C55E", "#16A34A"]}
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
          <Ionicons
            name={loading ? "checkmark" : "add"}
            size={24}
            color="#FFF"
            style={{ marginRight: 10 }}
          />
          <Text
            style={{
              color: "#FFF",
              fontSize: 20,
              fontWeight: "700",
              fontFamily: Platform.OS === "ios" ? "System" : "Roboto",
              letterSpacing: 0.5,
            }}
          >
            {loading ? "Saving..." : "Add Item"}
          </Text>
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
}) {
  const { onPress, disabled, loading, singleLineText } = props;
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
          backgroundColor: disabled ? "#A1EACB" : "#22C55E",
          alignItems: "center",
          justifyContent: "center",
          opacity: disabled ? 0.7 : 1,
          paddingHorizontal: 18,
        }}
        accessibilityRole="button"
        accessibilityLabel="Add Item"
      >
        {/* Ensure all text is wrapped in <Text> */}
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
          {loading ? "Saving..." : singleLineText ? "Add Item" : "Add\nItem"}
        </Text>
      </Pressable>
    </Animated.View>
  );
}
