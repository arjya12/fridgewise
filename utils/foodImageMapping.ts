// Auto-generated file mapping food categories to image files
import { ImageSourcePropType } from "react-native";

// Define the categories and their corresponding image paths
export type FoodImageCategory =
  // Fridge items
  | "beef"
  | "chicken"
  | "fish"
  | "milk"
  | "cheese"
  | "yogurt"
  | "eggs"
  | "butter"
  | "vegetables"
  | "carrots"
  | "tomato"
  | "fruits"
  | "apple"
  | "banana"
  | "leftovers"
  // Shelf items
  | "bread"
  | "pasta"
  | "rice"
  | "cereal"
  | "canned"
  | "snacks"
  | "flour"
  | "sugar"
  | "oil"
  | "spices";

// Map of food categories to their image paths
export const foodImagePaths: Record<FoodImageCategory, ImageSourcePropType> = {
  beef: require("../assets/images/realistic-food-icons/beef.png"),
  chicken: require("../assets/images/realistic-food-icons/chicken.png"),
  fish: require("../assets/images/realistic-food-icons/fish.png"),
  eggs: require("../assets/images/realistic-food-icons/eggs.png"),
  milk: require("../assets/images/realistic-food-icons/milk.png"),
  cheese: require("../assets/images/realistic-food-icons/cheese.png"),
  yogurt: require("../assets/images/realistic-food-icons/yogurt.png"),
  butter: require("../assets/images/realistic-food-icons/butter.png"),
  vegetables: require("../assets/images/realistic-food-icons/vegetables.png"),
  carrots: require("../assets/images/realistic-food-icons/carrots.png"),
  tomato: require("../assets/images/realistic-food-icons/tomato.png"),
  fruits: require("../assets/images/realistic-food-icons/fruits.png"),
  apple: require("../assets/images/realistic-food-icons/apple.png"),
  banana: require("../assets/images/realistic-food-icons/banana.png"),
  bread: require("../assets/images/realistic-food-icons/bread.png"),
  pasta: require("../assets/images/realistic-food-icons/pasta.png"),
  rice: require("../assets/images/realistic-food-icons/rice.png"),
  cereal: require("../assets/images/realistic-food-icons/cereal.png"),
  canned: require("../assets/images/realistic-food-icons/canned.png"),
  snacks: require("../assets/images/realistic-food-icons/snacks.png"),
  flour: require("../assets/images/realistic-food-icons/flour.png"),
  sugar: require("../assets/images/realistic-food-icons/sugar.png"),
  oil: require("../assets/images/realistic-food-icons/oil.png"),
  spices: require("../assets/images/realistic-food-icons/spices.png"),
  leftovers: require("../assets/images/realistic-food-icons/leftovers.png"),
};

/**
 * Determines the appropriate food image category based on the food item name
 * @param itemName The name of the food item
 * @returns The appropriate food image category
 */
export function getFoodImageCategory(itemName: string): FoodImageCategory {
  const name = itemName.toLowerCase();

  // Specific vegetables
  if (
    name.includes("carrot") ||
    name.includes("carrots")
  ) {
    return "carrots";
  }
  if (
    name.includes("tomato") ||
    name.includes("tomatoes")
  ) {
    return "tomato";
  }
  
  // Specific fruits
  if (
    name.includes("apple") ||
    name.includes("apples")
  ) {
    return "apple";
  }
  if (
    name.includes("banana") ||
    name.includes("bananas")
  ) {
    return "banana";
  }

  // Meat products
  if (name.includes("beef") || name.includes("steak")) {
    return "beef";
  }
  if (name.includes("chicken") || name.includes("turkey")) {
    return "chicken";
  }
  if (
    name.includes("fish") ||
    name.includes("seafood") ||
    name.includes("shrimp")
  ) {
    return "fish";
  }

  // Dairy products
  if (name.includes("milk")) {
    return "milk";
  }
  if (name.includes("cheese")) {
    return "cheese";
  }
  if (name.includes("yogurt")) {
    return "yogurt";
  }
  if (name.includes("egg")) {
    return "eggs";
  }
  if (name.includes("butter") || name.includes("margarine")) {
    return "butter";
  }

  // Produce
  if (
    name.includes("vegetable") ||
    name.includes("broccoli") ||
    name.includes("lettuce") ||
    name.includes("onion") ||
    name.includes("potato") ||
    name.includes("pepper")
  ) {
    return "vegetables";
  }
  if (
    name.includes("fruit") ||
    name.includes("orange") ||
    name.includes("berry") ||
    name.includes("grape")
  ) {
    return "fruits";
  }

  // Shelf items
  if (
    name.includes("bread") ||
    name.includes("toast") ||
    name.includes("bun")
  ) {
    return "bread";
  }
  if (
    name.includes("pasta") ||
    name.includes("noodle") ||
    name.includes("spaghetti")
  ) {
    return "pasta";
  }
  if (name.includes("rice") || name.includes("grain")) {
    return "rice";
  }
  if (
    name.includes("cereal") ||
    name.includes("oat") ||
    name.includes("granola")
  ) {
    return "cereal";
  }
  if (name.includes("can") || name.includes("canned") || name.includes("tin")) {
    return "canned";
  }
  if (
    name.includes("snack") ||
    name.includes("chip") ||
    name.includes("cracker") ||
    name.includes("cookie") ||
    name.includes("nut")
  ) {
    return "snacks";
  }
  if (name.includes("flour")) {
    return "flour";
  }
  if (name.includes("sugar")) {
    return "sugar";
  }
  if (name.includes("oil")) {
    return "oil";
  }
  if (
    name.includes("spice") ||
    name.includes("herb") ||
    name.includes("salt") ||
    name.includes("pepper")
  ) {
    return "spices";
  }

  // Default based on location
  if (name.includes("leftover")) {
    return "leftovers";
  }

  // Default to vegetables for fridge items and canned for shelf items
  return "vegetables";
}

/**
 * Gets the image path for a food item based on its name
 * @param itemName The name of the food item
 * @returns The path to the appropriate food image
 */
export function getFoodImagePath(itemName: string): ImageSourcePropType {
  const category = getFoodImageCategory(itemName);
  return foodImagePaths[category];
}
