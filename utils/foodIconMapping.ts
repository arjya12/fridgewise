// =============================================================================
// FOOD ICON MAPPING UTILITY
// =============================================================================

/**
 * Maps food item names/categories to appropriate emoji icons
 */
const FOOD_ICON_MAP: Record<string, string> = {
  // Dairy Products
  milk: "🥛",
  cheese: "🧀",
  butter: "🧈",
  yogurt: "🥛",
  cream: "🥛",

  // Vegetables
  lettuce: "🥬",
  spinach: "🥬",
  carrot: "🥕",
  tomato: "🍅",
  potato: "🥔",
  onion: "🧅",
  garlic: "🧄",
  broccoli: "🥦",
  cucumber: "🥒",
  pepper: "🌶️",
  "bell pepper": "🫑",
  mushroom: "🍄",
  corn: "🌽",
  cabbage: "🥬",

  // Fruits
  apple: "🍎",
  banana: "🍌",
  orange: "🍊",
  grape: "🍇",
  strawberry: "🍓",
  lemon: "🍋",
  lime: "🍋",
  watermelon: "🍉",
  peach: "🍑",
  pear: "🍐",
  pineapple: "🍍",
  kiwi: "🥝",
  mango: "🥭",
  avocado: "🥑",

  // Meat & Protein
  chicken: "🍗",
  beef: "🥩",
  pork: "🥩",
  fish: "🐟",
  salmon: "🐟",
  tuna: "🐟",
  egg: "🥚",
  eggs: "🥚",
  bacon: "🥓",

  // Bread & Grains
  bread: "🍞",
  rice: "🍚",
  pasta: "🍝",
  noodles: "🍜",
  cereal: "🥣",
  crackers: "🍪",

  // Beverages
  water: "💧",
  juice: "🧃",
  soda: "🥤",
  coffee: "☕",
  tea: "🍵",
  wine: "🍷",
  beer: "🍺",

  // Snacks & Desserts
  cookie: "🍪",
  cake: "🍰",
  chocolate: "🍫",
  candy: "🍬",
  "ice cream": "🍦",
  chips: "🍟",
  nuts: "🥜",

  // Condiments & Sauces
  ketchup: "🍅",
  mustard: "🌶️",
  mayo: "🥄",
  sauce: "🥄",
  oil: "🫒",
  vinegar: "🫒",

  // Default fallbacks by category
  dairy: "🥛",
  meat: "🥩",
  vegetable: "🥬",
  fruit: "🍎",
  beverage: "🥤",
  snack: "🍿",
  frozen: "🧊",
  condiment: "🥄",
};

/**
 * Get emoji icon for a food item based on name or category
 */
export function getFoodIcon(name: string, category?: string): string {
  const lowercaseName = name.toLowerCase();

  // Try exact name match first
  if (FOOD_ICON_MAP[lowercaseName]) {
    return FOOD_ICON_MAP[lowercaseName];
  }

  // Try partial name matches
  for (const [key, icon] of Object.entries(FOOD_ICON_MAP)) {
    if (lowercaseName.includes(key) || key.includes(lowercaseName)) {
      return icon;
    }
  }

  // Try category match if provided
  if (category) {
    const lowercaseCategory = category.toLowerCase();
    if (FOOD_ICON_MAP[lowercaseCategory]) {
      return FOOD_ICON_MAP[lowercaseCategory];
    }
  }

  // Default fallback
  return "🍽️";
}

/**
 * Determine expiry status based on expiry date
 */
export function getExpiryStatus(
  expiryDate: Date | string
): "EXPIRED" | "WARNING" | "SAFE" {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const expiry = new Date(expiryDate);
  expiry.setHours(0, 0, 0, 0);

  const daysUntilExpiry = Math.ceil(
    (expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (daysUntilExpiry <= 0) {
    return "EXPIRED";
  } else if (daysUntilExpiry <= 3) {
    return "WARNING";
  } else {
    return "SAFE";
  }
}

/**
 * Convert existing FoodItem to new FoodItemCard format
 */
export function convertToCardFormat(existingItem: {
  id: string;
  name: string;
  location: string;
  quantity: number;
  expiry_date?: string;
  category?: string;
}): {
  id: string;
  name: string;
  icon: string;
  location: string;
  quantity: number;
  status: "EXPIRED" | "WARNING" | "SAFE";
  expiryDate: Date;
} {
  const expiryDate = existingItem.expiry_date
    ? new Date(existingItem.expiry_date)
    : new Date();

  return {
    id: existingItem.id,
    name: existingItem.name,
    icon: getFoodIcon(existingItem.name, existingItem.category),
    location: existingItem.location,
    quantity: existingItem.quantity,
    status: existingItem.expiry_date
      ? getExpiryStatus(existingItem.expiry_date)
      : "SAFE",
    expiryDate: expiryDate,
  };
}

/**
 * Convert array of existing food items to card format
 */
export function convertItemsToCardFormat(
  existingItems: Array<{
    id: string;
    name: string;
    location: string;
    quantity: number;
    expiry_date?: string;
    category?: string;
  }>
): Array<{
  id: string;
  name: string;
  icon: string;
  location: string;
  quantity: number;
  status: "EXPIRED" | "WARNING" | "SAFE";
  expiryDate: Date;
}> {
  return existingItems.map(convertToCardFormat);
}

export default {
  getFoodIcon,
  getExpiryStatus,
  convertToCardFormat,
  convertItemsToCardFormat,
};
