// Utility to get the appropriate icon for a food item based on its name

/**
 * Returns the appropriate icon for a food item based on its name
 * @param itemName The name of the food item
 * @returns The require statement for the appropriate icon
 */
export function getFoodIcon(itemName: string) {
  const name = itemName.toLowerCase();

  // Check for specific food types
  if (name.includes("milk") || name.includes("dairy")) {
    return require("../assets/images/food-icons/milk_icon.png");
  }
  if (name.includes("bread") || name.includes("toast")) {
    return require("../assets/images/icons/bread.png");
  }
  if (name.includes("egg")) {
    return require("../assets/images/icons/egg.png");
  }
  if (
    name.includes("meat") ||
    name.includes("beef") ||
    name.includes("chicken") ||
    name.includes("pork")
  ) {
    return require("../assets/images/icons/meat.png");
  }
  if (
    name.includes("fish") ||
    name.includes("seafood") ||
    name.includes("shrimp")
  ) {
    return require("../assets/images/icons/fish.png");
  }
  if (
    name.includes("fruit") ||
    name.includes("apple") ||
    name.includes("banana") ||
    name.includes("orange")
  ) {
    return require("../assets/images/icons/fruit.png");
  }
  if (
    name.includes("vegetable") ||
    name.includes("carrot") ||
    name.includes("broccoli")
  ) {
    return require("../assets/images/icons/vegetable.png");
  }
  if (name.includes("cheese")) {
    return require("../assets/images/icons/cheese.png");
  }
  if (name.includes("pasta") || name.includes("noodle")) {
    return require("../assets/images/icons/pasta.png");
  }
  if (name.includes("rice") || name.includes("grain")) {
    return require("../assets/images/icons/rice.png");
  }
  if (name.includes("soup") || name.includes("stew")) {
    return require("../assets/images/icons/soup.png");
  }
  if (
    name.includes("cake") ||
    name.includes("dessert") ||
    name.includes("sweet")
  ) {
    return require("../assets/images/icons/dessert.png");
  }
  if (
    name.includes("sauce") ||
    name.includes("ketchup") ||
    name.includes("condiment")
  ) {
    return require("../assets/images/icons/sauce.png");
  }
  if (
    name.includes("juice") ||
    name.includes("drink") ||
    name.includes("beverage")
  ) {
    return require("../assets/images/icons/drink.png");
  }

  // Default icon for unrecognized food items
  return require("../assets/images/icons/food.png");
}
