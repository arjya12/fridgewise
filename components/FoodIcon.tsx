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

// Common food icon SVGs
const milkIconSvg = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M7 2H17L19 5V19C19 20.1046 18.1046 21 17 21H7C5.89543 21 5 20.1046 5 19V5L7 2Z" stroke="#3b82f6" stroke-width="1.5" stroke-linejoin="round"/>
  <path d="M7 2L7 5" stroke="#3b82f6" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M17 2L17 5" stroke="#3b82f6" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M5 5H19" stroke="#3b82f6" stroke-width="1.5" stroke-linecap="round"/>
  <path d="M9 10C9 10 10 9 12 9C14 9 15 10 15 10" stroke="#3b82f6" stroke-width="1.5" stroke-linecap="round"/>
</svg>`;

const meatIconSvg = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M15.5 10.5C15.5 13.5376 13.0376 16 10 16C6.96243 16 4.5 13.5376 4.5 10.5C4.5 7.46243 6.96243 5 10 5C13.0376 5 15.5 7.46243 15.5 10.5Z" stroke="#ef4444" stroke-width="1.5"/>
  <path d="M14.2591 5C14.2591 5 16.5 4.5 18.5 7C20.5 9.5 19.7841 15 19.7841 15" stroke="#ef4444" stroke-width="1.5" stroke-linecap="round"/>
  <path d="M18.5 14C18.5 14 17.5 19 13.5 19C9.5 19 6 18 6 18" stroke="#ef4444" stroke-width="1.5" stroke-linecap="round"/>
  <path d="M8 8.5L7.17675 7.67675C7.00162 7.50162 6.70414 7.57303 6.61732 7.81001L6.3001 8.76044C6.25615 8.89307 6.15009 8.99913 6.01746 9.04309L5.70501 9.14501C5.47753 9.22562 5.39549 9.50407 5.55375 9.68339C5.64992 9.78809 5.78502 9.84531 5.91889 9.84518L7 9.84456" stroke="#ef4444" stroke-width="1.5" stroke-linecap="round"/>
  <path d="M13.5 11L13.8661 11.3661C14.0439 11.5439 14.3309 11.5313 14.4929 11.3376L15.0429 10.6876C15.1471 10.5638 15.3085 10.4992 15.4687 10.5163L15.9381 10.5698C16.2336 10.6006 16.4571 10.8679 16.3998 11.1605C16.3666 11.3271 16.2553 11.4661 16.1025 11.5357L14.5 12.5" stroke="#ef4444" stroke-width="1.5" stroke-linecap="round"/>
</svg>`;

const fruitIconSvg = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M11.2175 6.98074C10.4388 6.2207 10.4264 5.11665 10.4264 4.26795C10.4264 3.56879 11.1306 3 11.9967 3C12.8628 3 13.567 3.56879 13.567 4.26795C13.567 5.11669 13.5546 6.2207 12.7759 6.98074" stroke="#f97316" stroke-width="1.5" stroke-linecap="round"/>
  <path d="M8.5 11.5C8.5 11.5 10 9.5 12 9.5C14 9.5 15.5 11.5 15.5 11.5" stroke="#f97316" stroke-width="1.5" stroke-linecap="round"/>
  <path d="M18.3627 9.83077C19.3704 10.5904 19.9934 12.2344 19.9934 14.0729C19.9934 16.6165 18.4546 19.5 16.4601 19.5C14.6978 19.5 13.4547 18.3084 11.9967 18.3084C10.5387 18.3084 9.29555 19.5 7.53328 19.5C5.53881 19.5 4 16.6165 4 14.0729C4 11.5294 5.32024 9.5 7.22326 9.5C8.71384 9.5 9.56878 10.3097 11.9967 10.3097C14.4246 10.3097 15.3816 9.5 16.7722 9.5C17.2439 9.5 17.7876 9.61748 18.3627 9.83077Z" stroke="#f97316" stroke-width="1.5"/>
</svg>`;

const vegetableIconSvg = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M13.6569 5.34315L16.5 8.18629L9.31371 15.3726L6.47057 12.5294L13.6569 5.34315Z" stroke="#22c55e" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M16.5 8.18628L18.6568 10.3431C18.6568 10.3431 18.6568 13.1863 15.8137 15.3726C12.9705 17.5589 9.31369 15.3726 9.31369 15.3726" stroke="#22c55e" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M5 14L7 16" stroke="#22c55e" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M4.5 18.25L6.5 16.25" stroke="#22c55e" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M11.5 16.5L14 19" stroke="#22c55e" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M10.5 19.5L12.5 21.5" stroke="#22c55e" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;

const breadIconSvg = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M19 14.75V14C19 10.134 15.866 7 12 7V7C8.13401 7 5 10.134 5 14V14.75C5 16.269 6.23122 17.5 7.75 17.5H16.25C17.7688 17.5 19 16.269 19 14.75Z" stroke="#d97706" stroke-width="1.5"/>
  <path d="M18 13.5C18 13.5 16.5 12.5 12 12.5C7.5 12.5 6 13.5 6 13.5" stroke="#d97706" stroke-width="1.5" stroke-linecap="round"/>
  <path d="M12 7V5" stroke="#d97706" stroke-width="1.5" stroke-linecap="round"/>
  <path d="M10 5.5H14" stroke="#d97706" stroke-width="1.5" stroke-linecap="round"/>
  <path d="M11 17.5V19" stroke="#d97706" stroke-width="1.5" stroke-linecap="round"/>
  <path d="M13 17.5V19" stroke="#d97706" stroke-width="1.5" stroke-linecap="round"/>
</svg>`;

const eggIconSvg = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M12 20C16.4183 20 20 16.4183 20 12C20 7.58172 16.4183 4 12 4C7.58172 4 4 7.58172 4 12C4 16.4183 7.58172 20 12 20Z" stroke="#eab308" stroke-width="1.5"/>
  <path d="M12 14.5C13.3807 14.5 14.5 13.3807 14.5 12C14.5 10.6193 13.3807 9.5 12 9.5C10.6193 9.5 9.5 10.6193 9.5 12C9.5 13.3807 10.6193 14.5 12 14.5Z" stroke="#eab308" stroke-width="1.5"/>
</svg>`;

const cheeseIconSvg = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M2 11L20.5 7L19 17.5H3.5L2 11Z" stroke="#facc15" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M2 11H20.5" stroke="#facc15" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M8 7.5V10.5" stroke="#facc15" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M15 7.5V10.5" stroke="#facc15" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M5.5 14C5.5 14 5.5 15.5 6.5 15.5C7.5 15.5 7.5 14 7.5 14" stroke="#facc15" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M14.5 14C14.5 14 14.5 15.5 15.5 15.5C16.5 15.5 16.5 14 16.5 14" stroke="#facc15" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;

const fishIconSvg = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M11.5 8C7.5 8 3 10.5 3 15C3 19.5 7.5 22 11.5 22C17.5 22 21 15 21 15C21 15 17.5 8 11.5 8Z" stroke="#0ea5e9" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M10 12C10 12 13 11 15 13C17 15 16 18 16 18" stroke="#0ea5e9" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M14.5 4L11.5 8L15.5 10.5L16.5 8L14.5 4Z" stroke="#0ea5e9" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M7.5 14.5C7.5 15.0523 7.05228 15.5 6.5 15.5C5.94772 15.5 5.5 15.0523 5.5 14.5C5.5 13.9477 5.94772 13.5 6.5 13.5C7.05228 13.5 7.5 13.9477 7.5 14.5Z" stroke="#0ea5e9" stroke-width="1.5"/>
</svg>`;

const defaultIconSvg = fruitIconSvg;

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
  // Get the appropriate icon SVG based on the food name
  const getSvgForFood = (name: string): string => {
    const lowerName = name.toLowerCase();

    if (lowerName.includes("milk") || lowerName.includes("cream")) {
      return milkIconSvg;
    }

    if (
      lowerName.includes("meat") ||
      lowerName.includes("beef") ||
      lowerName.includes("chicken") ||
      lowerName.includes("pork") ||
      lowerName.includes("steak")
    ) {
      return meatIconSvg;
    }

    if (
      lowerName.includes("fruit") ||
      lowerName.includes("apple") ||
      lowerName.includes("banana") ||
      lowerName.includes("orange")
    ) {
      return fruitIconSvg;
    }

    if (
      lowerName.includes("vegetable") ||
      lowerName.includes("carrot") ||
      lowerName.includes("broccoli") ||
      lowerName.includes("tomato")
    ) {
      return vegetableIconSvg;
    }

    if (
      lowerName.includes("bread") ||
      lowerName.includes("toast") ||
      lowerName.includes("bun")
    ) {
      return breadIconSvg;
    }

    if (lowerName.includes("egg")) {
      return eggIconSvg;
    }

    if (lowerName.includes("cheese")) {
      return cheeseIconSvg;
    }

    if (
      lowerName.includes("fish") ||
      lowerName.includes("seafood") ||
      lowerName.includes("shrimp")
    ) {
      return fishIconSvg;
    }

    return defaultIconSvg;
  };

  const iconSvg = getSvgForFood(foodName);
  const backgroundColor = getFoodIconBackground(foodName);
  return (
    <View style={[styles.container, { backgroundColor }]}>
      {iconSvg}
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
