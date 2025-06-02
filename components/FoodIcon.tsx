import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, View, ViewStyle } from "react-native";

// Function to get background color based on food name
const getFoodIconBackground = (itemName: string): string => {
  const name = itemName.toLowerCase();

  // Dairy products
  if (name.includes("milk") || name.includes("cream")) {
    return "#eff6ff";
  }

  // Bread and baked goods
  if (
    name.includes("bread") ||
    name.includes("toast") ||
    name.includes("bun")
  ) {
    return "#fff7ed";
  }

  // Eggs
  if (name.includes("egg")) {
    return "#fefce8";
  }

  // Meat products
  if (
    name.includes("meat") ||
    name.includes("beef") ||
    name.includes("chicken") ||
    name.includes("pork") ||
    name.includes("steak")
  ) {
    return "#fee2e2";
  }

  // Fish and seafood
  if (
    name.includes("fish") ||
    name.includes("seafood") ||
    name.includes("shrimp")
  ) {
    return "#e0f2fe";
  }

  // Fruits
  if (
    name.includes("fruit") ||
    name.includes("apple") ||
    name.includes("banana") ||
    name.includes("orange") ||
    name.includes("berry")
  ) {
    return "#fff7ed";
  }

  // Vegetables
  if (
    name.includes("vegetable") ||
    name.includes("carrot") ||
    name.includes("broccoli") ||
    name.includes("lettuce") ||
    name.includes("tomato")
  ) {
    return "#ecfdf5";
  }

  // Cheese
  if (name.includes("cheese")) {
    return "#fefce8";
  }

  // Default background for unrecognized items
  return "#f3f4f6";
};

// Function to get icon name and color based on food name
const getFoodIconInfo = (
  name: string
): { icon: keyof typeof Ionicons.glyphMap; color: string } => {
  const lowerName = name.toLowerCase();

  if (lowerName.includes("milk") || lowerName.includes("cream")) {
    return { icon: "water", color: "#3b82f6" };
  }

  if (
    lowerName.includes("meat") ||
    lowerName.includes("beef") ||
    lowerName.includes("chicken") ||
    lowerName.includes("pork") ||
    lowerName.includes("steak")
  ) {
    return { icon: "restaurant", color: "#ef4444" };
  }

  if (
    lowerName.includes("fruit") ||
    lowerName.includes("apple") ||
    lowerName.includes("banana") ||
    lowerName.includes("orange")
  ) {
    return { icon: "leaf", color: "#f97316" };
  }

  if (
    lowerName.includes("vegetable") ||
    lowerName.includes("carrot") ||
    lowerName.includes("broccoli") ||
    lowerName.includes("tomato")
  ) {
    return { icon: "nutrition", color: "#22c55e" };
  }

  if (
    lowerName.includes("bread") ||
    lowerName.includes("toast") ||
    lowerName.includes("bun")
  ) {
    return { icon: "restaurant-outline", color: "#d97706" };
  }

  if (lowerName.includes("egg")) {
    return { icon: "ellipse", color: "#eab308" };
  }

  if (lowerName.includes("cheese")) {
    return { icon: "square", color: "#facc15" };
  }

  if (
    lowerName.includes("fish") ||
    lowerName.includes("seafood") ||
    lowerName.includes("shrimp")
  ) {
    return { icon: "fish", color: "#0ea5e9" };
  }

  if (
    lowerName.includes("pasta") ||
    lowerName.includes("noodle") ||
    lowerName.includes("spaghetti")
  ) {
    return { icon: "cafe", color: "#f59e0b" };
  }

  if (
    lowerName.includes("rice") ||
    lowerName.includes("grain") ||
    lowerName.includes("cereal")
  ) {
    return { icon: "apps", color: "#d97706" };
  }

  if (lowerName.includes("soup") || lowerName.includes("stew")) {
    return { icon: "flask", color: "#ea580c" };
  }

  if (
    lowerName.includes("cake") ||
    lowerName.includes("dessert") ||
    lowerName.includes("sweet") ||
    lowerName.includes("chocolate") ||
    lowerName.includes("ice cream")
  ) {
    return { icon: "happy", color: "#ec4899" };
  }

  if (
    lowerName.includes("sauce") ||
    lowerName.includes("ketchup") ||
    lowerName.includes("condiment") ||
    lowerName.includes("mayo") ||
    lowerName.includes("mustard")
  ) {
    return { icon: "wine", color: "#ef4444" };
  }

  if (
    lowerName.includes("juice") ||
    lowerName.includes("drink") ||
    lowerName.includes("beverage") ||
    lowerName.includes("soda") ||
    lowerName.includes("water")
  ) {
    return { icon: "wine", color: "#3b82f6" };
  }

  if (lowerName.includes("frozen")) {
    return { icon: "snow", color: "#0ea5e9" };
  }

  if (
    lowerName.includes("can") ||
    lowerName.includes("canned") ||
    lowerName.includes("tin")
  ) {
    return { icon: "cube", color: "#6b7280" };
  }

  // Default for unrecognized items
  return { icon: "restaurant-outline", color: "#6b7280" };
};

type FoodIconProps = {
  foodName: string;
  size?: number;
  style?: ViewStyle;
};

/**
 * A component that displays an appropriate food icon based on the food name
 */
export default function FoodIcon({
  foodName,
  size = 24,
  style,
}: FoodIconProps) {
  const backgroundColor = getFoodIconBackground(foodName);
  const { icon, color } = getFoodIconInfo(foodName);

  return (
    <View
      style={[
        styles.container,
        { backgroundColor, width: size + 16, height: size + 16 },
        style,
      ]}
    >
      <Ionicons name={icon} size={size} color={color} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 8,
    padding: 8,
  },
});
