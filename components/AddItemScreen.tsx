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
import { SimpleCalendar } from "./SimpleCalendar";

// Move these up before their first use
const commonUnits = ["pcs", "kg", "g", "L", "ml", "oz", "lb", "servings"];
const commonCategories = [
  "Dairy",
  "Meat",
  "Vegetables",
  "Fruits",
  "Beverages",
  "Snacks",
  "Frozen",
  "Condiments",
];

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

  // 1. Add state for category dropdown and search
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [categorySearch, setCategorySearch] = useState("");
  const categoryDropdownTriggerRef = useRef<View>(null);
  const [categoryDropdownPos, setCategoryDropdownPos] = useState<{
    x: number;
    y: number;
  }>({ x: 0, y: 0 });

  const { width } = useWindowDimensions();
  const addButtonScale = useRef(new Animated.Value(1)).current;
  const [showSuccess, setShowSuccess] = useState(false);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const insets = useSafeAreaInsets();
  const quantityInputRef = useRef<TextInput>(null);

  // Calendar context for real-time updates after save
  const { refresh, invalidateCache } = useCalendar();

  // Add icon requires
  const fridgeIcon = require("../assets/images/icons/fridge_icon.png");
  const shelfIcon = require("../assets/images/icons/shelf_icon.png");

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
        setShowCategoryDropdown(false);
        setCategorySearch("");
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
        setCategory(item.category || "");
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
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 350,
          useNativeDriver: true,
        }).start(() => {
          setTimeout(() => {
            router.back();
          }, 700);
        });
      } else {
        await foodItemsService.addItem(itemData);
        // Immediately propagate new item to calendar/state
        try {
          invalidateCache();
          await refresh();
        } catch {}
        setShowSuccess(true);
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 350,
          useNativeDriver: true,
        }).start(() => {
          setTimeout(() => {
            router.back();
          }, 700);
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
            {/* Item Name and Category side by side */}
            <View
              style={{
                width: "100%",
                flexDirection: "row",
                alignItems: "flex-end",
                gap: 12,
                marginBottom: 16,
              }}
            >
              {/* Item Name input (left) */}
              <View style={{ flex: 1 }}>
                <ThemedText
                  style={{
                    fontSize: 13,
                    fontWeight: "600",
                    fontFamily: Platform.OS === "ios" ? "System" : "Roboto",
                    color: "#222",
                    marginBottom: 2,
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
              {/* Category selector (right) */}
              <View style={{ flex: 1 }}>
                <ThemedText
                  style={{
                    fontSize: 13,
                    fontWeight: "600",
                    fontFamily: Platform.OS === "ios" ? "System" : "Roboto",
                    color: "#222",
                    marginBottom: 2,
                  }}
                >
                  Category
                </ThemedText>
                <Pressable
                  ref={categoryDropdownTriggerRef}
                  onPress={() => {
                    if (categoryDropdownTriggerRef.current) {
                      categoryDropdownTriggerRef.current.measureInWindow(
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
                          setCategoryDropdownPos({ x, y: offsetY });
                          setShowCategoryDropdown(true);
                        }
                      );
                    } else {
                      setShowCategoryDropdown(true);
                    }
                  }}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    borderWidth: 1.2,
                    borderColor: "#E5E7EB",
                    borderRadius: 16,
                    backgroundColor: "#F5F5F5",
                    paddingHorizontal: 14,
                    paddingVertical: 10,
                    width: "100%",
                    height: 44,
                    justifyContent: "space-between",
                  }}
                  accessibilityRole="button"
                  accessibilityLabel="Select category"
                >
                  <ThemedText
                    style={{
                      color: "#222",
                      fontWeight: "500",
                      fontSize: 15,
                      fontFamily: Platform.OS === "ios" ? "System" : "Roboto",
                    }}
                  >
                    {category || "Select category"}
                  </ThemedText>
                  <View style={{ marginLeft: 6 }}>
                    <ThemedText style={{ fontSize: 14, color: "#A1A1AB" }}>
                      ▼
                    </ThemedText>
                  </View>
                </Pressable>
              </View>
            </View>

            <View style={{ width: "100%", marginBottom: 8 }}>
              <ThemedText
                style={{
                  fontSize: 15,
                  fontWeight: "700",
                  fontFamily: Platform.OS === "ios" ? "System" : "Roboto",
                  color: "#222",
                  marginBottom: 8,
                  textAlign: "center",
                }}
              >
                Quantity
              </ThemedText>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  backgroundColor: "#FFF",
                  borderRadius: 16,
                  borderWidth: 1,
                  borderColor: "#E5E7EB",
                  paddingVertical: 8,
                  paddingHorizontal: 4,
                  shadowColor: "#111",
                  shadowOpacity: 0.04,
                  shadowRadius: 6,
                  elevation: 2,
                  width: "65%",
                  alignSelf: "center",
                }}
              >
                {/* Quantity controls */}
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <Pressable
                    onPress={() =>
                      setQuantity((q) =>
                        String(Math.max(1, (parseInt(q) || 1) - 1))
                      )
                    }
                    style={{
                      width: 24,
                      height: 24,
                      borderRadius: 12,
                      backgroundColor: "#F3F4F6",
                      alignItems: "center",
                      justifyContent: "center",
                      borderWidth: 1.2,
                      borderColor: "#E5E7EB",
                      marginLeft: 28,
                    }}
                    accessibilityRole="button"
                    accessibilityLabel="Decrease quantity"
                  >
                    <ThemedText
                      style={{
                        fontSize: 16,
                        color: "#22C55E",
                        fontWeight: "700",
                      }}
                    >
                      –
                    </ThemedText>
                  </Pressable>
                  <View
                    style={{
                      minWidth: 36,
                      maxWidth: 44,
                      height: 28,
                      borderRadius: 8,
                      backgroundColor: "#FFF",
                      borderWidth: 1.5,
                      borderColor: "#22C55E",
                      alignItems: "center",
                      justifyContent: "center",
                      marginHorizontal: 2,
                    }}
                  >
                    <TextInput
                      ref={quantityInputRef}
                      style={{
                        fontSize: 16,
                        color: "#222",
                        fontWeight: "700",
                        textAlign: "center",
                        width: 36,
                        height: 24,
                        paddingVertical: 0,
                        paddingHorizontal: 0,
                        fontFamily: Platform.OS === "ios" ? "System" : "Roboto",
                      }}
                      value={quantity}
                      onChangeText={(val) =>
                        setQuantity(val.replace(/[^0-9]/g, ""))
                      }
                      keyboardType="numeric"
                      accessibilityLabel="Quantity"
                      maxLength={3}
                      textAlignVertical="center"
                      onFocus={() => {
                        if (quantity === "1" && quantityInputRef.current) {
                          quantityInputRef.current.setSelection(
                            0,
                            quantity.length
                          );
                        }
                      }}
                    />
                  </View>
                  <Pressable
                    onPress={() =>
                      setQuantity((q) =>
                        String(Math.min(999, (parseInt(q) || 1) + 1))
                      )
                    }
                    style={{
                      width: 24,
                      height: 24,
                      borderRadius: 12,
                      backgroundColor: "#F3F4F6",
                      alignItems: "center",
                      justifyContent: "center",
                      borderWidth: 1.2,
                      borderColor: "#E5E7EB",
                      marginRight: 12,
                    }}
                    accessibilityRole="button"
                    accessibilityLabel="Increase quantity"
                  >
                    <ThemedText
                      style={{
                        fontSize: 16,
                        color: "#22C55E",
                        fontWeight: "700",
                      }}
                    >
                      +
                    </ThemedText>
                  </Pressable>
                </View>
                {/* Unit selector on the right */}
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
                    flexDirection: "row",
                    alignItems: "center",
                    borderWidth: 2,
                    borderColor: "#22C55E",
                    borderRadius: 18,
                    backgroundColor: "#F5F5F5",
                    paddingHorizontal: 10,
                    paddingVertical: 5,
                    minWidth: 36,
                    marginLeft: 6,
                    justifyContent: "center",
                    alignSelf: "center",
                  }}
                  accessibilityRole="button"
                  accessibilityLabel="Select unit"
                >
                  <ThemedText
                    style={{
                      color: "#222",
                      fontWeight: "700",
                      fontSize: 13,
                      fontFamily: Platform.OS === "ios" ? "System" : "Roboto",
                    }}
                  >
                    {unit || "Unit"}
                  </ThemedText>
                  <ThemedText
                    style={{ fontSize: 12, color: "#A1A1AB", marginLeft: 4 }}
                  >
                    ▼
                  </ThemedText>
                </Pressable>
              </View>
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
                  fontWeight: "600",
                  fontFamily: Platform.OS === "ios" ? "System" : "Roboto",
                  color: "#222",
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
                />
              </View>
            </View>
            {/* Move the FloatingAddItemButton below the calendar, centered horizontally, but keep its original styling and make the text one line */}
            <View
              style={{
                width: "100%",
                alignItems: "center",
                marginTop: 18,
                paddingBottom: insets.bottom + 40,
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
          {/* Properly close the main content View here */}
        </Animated.View>
      </KeyboardAvoidingView>
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
              top: dropdownPos.y,
              left: dropdownPos.x - 10,
              width: 125,
              backgroundColor: "#F6FFF9",
              borderRadius: 16,
              borderWidth: 2,
              borderColor: "#22C55E",
              zIndex: 1001,
              elevation: 8,
              shadowColor: "#000",
              shadowOpacity: 0.06,
              shadowRadius: 8,
              overflow: "visible",
              alignSelf: "flex-start",
            }}
          >
            <ScrollView
              style={{ maxHeight: 200, zIndex: 1, paddingRight: 6 }}
              showsVerticalScrollIndicator={true}
              persistentScrollbar={true}
              contentContainerStyle={{ paddingVertical: 4, paddingBottom: 24 }}
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
                    paddingVertical: 8,
                    paddingHorizontal: 18,
                    backgroundColor:
                      unit === u
                        ? "#22C55E"
                        : i % 2 === 0
                        ? "#E0F7EC"
                        : "#D1F5E0",
                    borderRadius: 12,
                    marginHorizontal: 8,
                    marginVertical: 2,
                  }}
                >
                  <ThemedText
                    style={{
                      color: unit === u ? "#FFF" : "#222",
                      fontWeight: "500",
                      fontSize: 16,
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
                padding: 12,
                alignItems: "center",
                borderTopWidth: 1,
                borderColor: "#E5E7EB",
                backgroundColor: "#F6FFF9",
                borderBottomLeftRadius: 16,
                borderBottomRightRadius: 16,
              }}
            >
              <ThemedText
                style={{
                  color: "#22C55E",
                  fontWeight: "700",
                  fontSize: 15,
                  letterSpacing: 0.2,
                }}
              >
                Cancel
              </ThemedText>
            </Pressable>
          </View>
        </>
      )}
      {showCategoryDropdown && (
        <>
          <Pressable
            onPress={() => setShowCategoryDropdown(false)}
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
              top: categoryDropdownPos.y,
              left: categoryDropdownPos.x,
              width: 170,
              backgroundColor: "#F6FFF9",
              borderRadius: 16,
              borderWidth: 2,
              borderColor: "#22C55E",
              zIndex: 1001,
              elevation: 24,
              shadowColor: "#22C55E",
              shadowOpacity: 0.1,
              shadowRadius: 16,
              overflow: "visible",
            }}
          >
            <View style={{ padding: 8 }}>
              <TextInput
                value={categorySearch}
                onChangeText={setCategorySearch}
                placeholder="Search category"
                placeholderTextColor="#A1A1AB"
                style={{
                  backgroundColor: "#FFF",
                  borderRadius: 8,
                  borderWidth: 1,
                  borderColor: "#E5E7EB",
                  paddingHorizontal: 10,
                  paddingVertical: 6,
                  fontSize: 15,
                  marginBottom: 8,
                  color: "#222",
                  fontFamily: Platform.OS === "ios" ? "System" : "Roboto",
                }}
              />
            </View>
            <ScrollView
              style={{ height: 160, zIndex: 1, paddingRight: 6 }}
              showsVerticalScrollIndicator={true}
              persistentScrollbar={true}
              contentContainerStyle={{ paddingVertical: 4, paddingBottom: 24 }}
            >
              {commonCategories
                .filter((cat) =>
                  cat.toLowerCase().includes(categorySearch.toLowerCase())
                )
                .map((cat, i) => (
                  <Pressable
                    key={cat}
                    onPress={() => {
                      setCategory(cat);
                      setShowCategoryDropdown(false);
                      Haptics.selectionAsync();
                      setCategorySearch("");
                    }}
                    style={{
                      paddingVertical: 8,
                      paddingHorizontal: 18,
                      backgroundColor:
                        category === cat
                          ? "#22C55E"
                          : i % 2 === 0
                          ? "#E0F7EC"
                          : "#D1F5E0",
                      borderRadius: 12,
                      marginHorizontal: 8,
                      marginVertical: 2,
                    }}
                  >
                    <ThemedText
                      style={{
                        color: category === cat ? "#FFF" : "#222",
                        fontWeight: "500",
                        fontSize: 16,
                      }}
                    >
                      {cat}
                    </ThemedText>
                  </Pressable>
                ))}
            </ScrollView>
            <Pressable
              onPress={() => {
                setShowCategoryDropdown(false);
                setCategorySearch("");
              }}
              style={{
                padding: 12,
                alignItems: "center",
                borderTopWidth: 1,
                borderColor: "#E5E7EB",
                backgroundColor: "#F6FFF9",
                borderBottomLeftRadius: 16,
                borderBottomRightRadius: 16,
              }}
            >
              <ThemedText
                style={{
                  color: "#22C55E",
                  fontWeight: "700",
                  fontSize: 15,
                  letterSpacing: 0.2,
                }}
              >
                Cancel
              </ThemedText>
            </Pressable>
          </View>
        </>
      )}
      {showSuccess && (
        <View
          style={{
            position: "absolute",
            top: "40%",
            left: 0,
            right: 0,
            alignItems: "center",
            zIndex: 999,
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
        </View>
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
