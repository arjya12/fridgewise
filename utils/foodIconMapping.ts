// Utility to map food items to appropriate Material icons

type IconMap = {
  name: string; // Icon name from Material Icons
  color: string; // Icon color
  background: string; // Background color for the icon container
};

/**
 * Returns the appropriate Material icon info for a food item based on its name
 * @param itemName The name of the food item
 * @returns Object containing icon name, color and background color
 */
export function getFoodIconInfo(itemName: string): IconMap {
  const name = itemName.toLowerCase();

  // Dairy products
  if (name.includes("milk") || name.includes("cream")) {
    return {
      name: "water-drop",
      color: "#3b82f6",
      background: "#eff6ff",
    };
  }

  // Bread and baked goods
  if (
    name.includes("bread") ||
    name.includes("toast") ||
    name.includes("bun")
  ) {
    return {
      name: "breakfast-dining",
      color: "#d97706",
      background: "#fff7ed",
    };
  }

  // Eggs
  if (name.includes("egg")) {
    return {
      name: "egg",
      color: "#eab308",
      background: "#fefce8",
    };
  }

  // Meat products
  if (
    name.includes("meat") ||
    name.includes("beef") ||
    name.includes("chicken") ||
    name.includes("pork") ||
    name.includes("steak")
  ) {
    return {
      name: "restaurant",
      color: "#ef4444",
      background: "#fee2e2",
    };
  }

  // Fish and seafood
  if (
    name.includes("fish") ||
    name.includes("seafood") ||
    name.includes("shrimp")
  ) {
    return {
      name: "water",
      color: "#0ea5e9",
      background: "#e0f2fe",
    };
  }

  // Fruits
  if (
    name.includes("fruit") ||
    name.includes("apple") ||
    name.includes("banana") ||
    name.includes("orange") ||
    name.includes("berry")
  ) {
    return {
      name: "nutrition",
      color: "#f97316",
      background: "#fff7ed",
    };
  }

  // Vegetables
  if (
    name.includes("vegetable") ||
    name.includes("carrot") ||
    name.includes("broccoli") ||
    name.includes("lettuce") ||
    name.includes("tomato")
  ) {
    return {
      name: "eco",
      color: "#22c55e",
      background: "#ecfdf5",
    };
  }

  // Cheese
  if (name.includes("cheese")) {
    return {
      name: "rectangle",
      color: "#facc15",
      background: "#fefce8",
    };
  }

  // Pasta and noodles
  if (
    name.includes("pasta") ||
    name.includes("noodle") ||
    name.includes("spaghetti")
  ) {
    return {
      name: "ramen-dining",
      color: "#f59e0b",
      background: "#fffbeb",
    };
  }

  // Rice and grains
  if (
    name.includes("rice") ||
    name.includes("grain") ||
    name.includes("cereal")
  ) {
    return {
      name: "grain",
      color: "#d97706",
      background: "#fff7ed",
    };
  }

  // Soup and stews
  if (name.includes("soup") || name.includes("stew")) {
    return {
      name: "soup-kitchen",
      color: "#ea580c",
      background: "#fff7ed",
    };
  }

  // Desserts and sweets
  if (
    name.includes("cake") ||
    name.includes("dessert") ||
    name.includes("sweet") ||
    name.includes("chocolate") ||
    name.includes("ice cream")
  ) {
    return {
      name: "cake",
      color: "#ec4899",
      background: "#fdf2f8",
    };
  }

  // Sauces and condiments
  if (
    name.includes("sauce") ||
    name.includes("ketchup") ||
    name.includes("condiment") ||
    name.includes("mayo") ||
    name.includes("mustard")
  ) {
    return {
      name: "local-drink",
      color: "#ef4444",
      background: "#fee2e2",
    };
  }

  // Beverages
  if (
    name.includes("juice") ||
    name.includes("drink") ||
    name.includes("beverage") ||
    name.includes("soda") ||
    name.includes("water")
  ) {
    return {
      name: "local-bar",
      color: "#3b82f6",
      background: "#eff6ff",
    };
  }

  // Frozen food
  if (name.includes("frozen")) {
    return {
      name: "ac-unit",
      color: "#0ea5e9",
      background: "#e0f2fe",
    };
  }

  // Canned foods
  if (name.includes("can") || name.includes("canned") || name.includes("tin")) {
    return {
      name: "inventory-2",
      color: "#6b7280",
      background: "#f3f4f6",
    };
  }

  // Default for unrecognized items
  return {
    name: "restaurant-menu",
    color: "#6b7280",
    background: "#f3f4f6",
  };
}
