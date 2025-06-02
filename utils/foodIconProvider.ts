// Utility to provide custom SVG food icons

/**
 * Returns the path to the appropriate SVG icon for a food item based on its name
 * @param itemName The name of the food item
 * @returns The path to the appropriate SVG icon
 */
export function getFoodIconPath(itemName: string): string {
  const name = itemName.toLowerCase();

  // Dairy products
  if (name.includes("milk") || name.includes("cream")) {
    return require("../assets/images/food-icons/milk.svg");
  }

  // Bread and baked goods
  if (
    name.includes("bread") ||
    name.includes("toast") ||
    name.includes("bun")
  ) {
    return require("../assets/images/food-icons/bread.svg");
  }

  // Eggs
  if (name.includes("egg")) {
    return require("../assets/images/food-icons/egg.svg");
  }

  // Meat products
  if (
    name.includes("meat") ||
    name.includes("beef") ||
    name.includes("chicken") ||
    name.includes("pork") ||
    name.includes("steak")
  ) {
    return require("../assets/images/food-icons/meat.svg");
  }

  // Fish and seafood
  if (
    name.includes("fish") ||
    name.includes("seafood") ||
    name.includes("shrimp")
  ) {
    return require("../assets/images/food-icons/fish.svg");
  }

  // Fruits
  if (
    name.includes("fruit") ||
    name.includes("apple") ||
    name.includes("banana") ||
    name.includes("orange") ||
    name.includes("berry")
  ) {
    return require("../assets/images/food-icons/fruit.svg");
  }

  // Vegetables
  if (
    name.includes("vegetable") ||
    name.includes("carrot") ||
    name.includes("broccoli") ||
    name.includes("lettuce") ||
    name.includes("tomato")
  ) {
    return require("../assets/images/food-icons/vegetable.svg");
  }

  // Cheese
  if (name.includes("cheese")) {
    return require("../assets/images/food-icons/cheese.svg");
  }

  // Default background for unrecognized items
  return require("../assets/images/food-icons/fruit.svg");
}

/**
 * Returns the appropriate background color for a food item based on its name
 * @param itemName The name of the food item
 * @returns The background color for the icon container
 */
export function getFoodIconBackground(itemName: string): string {
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
}
