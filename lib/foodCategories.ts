/**
 * Single source of truth for food category labels, picker options, icons, and display names.
 */
import type { Icon as PhosphorIcon } from "phosphor-react-native";
import {
  CarrotIcon,
  CoffeeIcon,
  CookieIcon,
  CookingPotIcon,
  CylinderIcon,
  EggIcon,
  FishIcon,
  HandbagIcon,
  JarIcon,
  PackageIcon,
  SnowflakeIcon,
} from "phosphor-react-native";
import { BakeryBaguetteIcon } from "@/lib/icons/BakeryBaguetteIcon";
import { SoySauceIcon } from "@/lib/icons/SoySauceIcon";
import { DairyLucideMilkIcon } from "@/lib/icons/DairyLucideMilkIcon";
import { DeliLucideSandwichIcon } from "@/lib/icons/DeliLucideSandwichIcon";
import { FruitsLucideGrapeIcon } from "@/lib/icons/FruitsLucideGrapeIcon";
import { GiSaltShakerIcon } from "@/lib/icons/GiSaltShakerIcon";
import { GrainsLucideWheatIcon } from "@/lib/icons/GrainsLucideWheatIcon";
import { MeatLucideBeefIcon } from "@/lib/icons/MeatLucideBeefIcon";

/** Phosphor icons + Lucide / custom SVG wrappers (Bakery bread, Dairy, condiment bottle, …). */
export type CategoryIconComponent =
  | PhosphorIcon
  | typeof BakeryBaguetteIcon
  | typeof DairyLucideMilkIcon
  | typeof SoySauceIcon
  | typeof DeliLucideSandwichIcon
  | typeof FruitsLucideGrapeIcon
  | typeof GiSaltShakerIcon
  | typeof GrainsLucideWheatIcon
  | typeof MeatLucideBeefIcon;

export type FoodCategoryOption = {
  label: string;
  Icon: CategoryIconComponent;
};

/** Inventory / add-item order (matches previous AddItemScreen). */
export const FOOD_CATEGORY_OPTIONS: FoodCategoryOption[] = [
  { label: "Dairy", Icon: DairyLucideMilkIcon },
  { label: "Meat", Icon: MeatLucideBeefIcon },
  { label: "Seafood", Icon: FishIcon },
  { label: "Deli", Icon: DeliLucideSandwichIcon },
  { label: "Vegetables", Icon: CarrotIcon },
  { label: "Fruits", Icon: FruitsLucideGrapeIcon },
  { label: "Bakery", Icon: BakeryBaguetteIcon },
  { label: "Eggs", Icon: EggIcon },
  { label: "Grains", Icon: GrainsLucideWheatIcon },
  { label: "Canned", Icon: CylinderIcon },
  { label: "Snacks", Icon: CookieIcon },
  { label: "Beverages", Icon: CoffeeIcon },
  { label: "Condiments", Icon: SoySauceIcon },
  { label: "Sauces", Icon: JarIcon },
  { label: "Spices", Icon: GiSaltShakerIcon },
  { label: "Ready-to-eat", Icon: CookingPotIcon },
  { label: "Frozen", Icon: SnowflakeIcon },
  { label: "Other", Icon: PackageIcon },
];

export const FOOD_CATEGORY_LABELS = FOOD_CATEGORY_OPTIONS.map((o) => o.label);

const OPTION_BY_LABEL_LOWER: Map<string, FoodCategoryOption> = new Map(
  FOOD_CATEGORY_OPTIONS.map((o) => [o.label.toLowerCase(), o])
);

/** Grocery list chip order + Household; Other uses handbag icon for UX only. */
const GROCERY_ORDER: string[] = [
  "Vegetables",
  "Meat",
  "Seafood",
  "Deli",
  "Eggs",
  "Fruits",
  "Dairy",
  "Bakery",
  "Beverages",
  "Snacks",
  "Grains",
  "Canned",
  "Condiments",
  "Sauces",
  "Spices",
  "Ready-to-eat",
  "Frozen",
  "Household",
  "Other",
];

export const GROCERY_CATEGORY_OPTIONS: readonly FoodCategoryOption[] = GROCERY_ORDER.map(
  (label) => {
    if (label === "Household") return { label, Icon: PackageIcon };
    if (label === "Other") return { label, Icon: HandbagIcon };
    const base = OPTION_BY_LABEL_LOWER.get(label.toLowerCase());
    if (!base) {
      throw new Error(`foodCategories: missing grocery mapping for "${label}"`);
    }
    return { label: base.label, Icon: base.Icon };
  }
);

export const GROCERY_CATEGORY_ORDER = GROCERY_CATEGORY_OPTIONS.map((c) => c.label);

/** Insights / reports: lowercase keys and legacy aliases → canonical title case label. */
export const CATEGORY_DISPLAY: Record<string, string> = {
  dairy: "Dairy",
  "dairy & eggs": "Dairy",
  eggs: "Eggs",
  egg: "Eggs",
  vegetables: "Vegetables",
  vegetable: "Vegetables",
  veg: "Vegetables",
  meat: "Meat",
  "meat & fish": "Meat",
  protein: "Meat",
  seafood: "Seafood",
  fish: "Seafood",
  deli: "Deli",
  sauces: "Sauces",
  sauce: "Sauces",
  spices: "Spices",
  spice: "Spices",
  canned: "Canned",
  "ready-to-eat": "Ready-to-eat",
  "ready to eat": "Ready-to-eat",
  fruits: "Fruits",
  fruit: "Fruits",
  bakery: "Bakery",
  bread: "Bakery",
  snacks: "Snacks",
  beverages: "Beverages",
  grains: "Grains",
  frozen: "Frozen",
  condiments: "Condiments",
  "prepared meals": "Ready-to-eat",
  "prepared meal": "Ready-to-eat",
  household: "Household",
  other: "Other",
};

export function categoryLabelForInsights(raw: string): string {
  const t = raw.trim();
  if (!t) return "Other";
  const k = t.toLowerCase();
  if (CATEGORY_DISPLAY[k]) return CATEGORY_DISPLAY[k]!;
  return t.charAt(0).toUpperCase() + t.slice(1).toLowerCase();
}

/** Emoji fallbacks for `getFoodIcon` when matching stored category (lowercase keys). */
export const CATEGORY_EMOJI_BY_SLUG: Record<string, string> = {
  dairy: "🥛",
  meat: "🥩",
  seafood: "🐟",
  deli: "🥪",
  vegetable: "🥬",
  vegetables: "🥬",
  fruit: "🍎",
  fruits: "🍎",
  bakery: "🍞",
  eggs: "🥚",
  grains: "🍚",
  canned: "🥫",
  sauces: "🫙",
  sauce: "🫙",
  spices: "🌶️",
  spice: "🌶️",
  "ready-to-eat": "🍱",
  beverage: "🥤",
  beverages: "🥤",
  snack: "🍿",
  snacks: "🍿",
  frozen: "🧊",
  condiment: "🥄",
  condiments: "🧂",
  household: "🧴",
  other: "🍴",
};

/** Normalize legacy DB / UI strings to a current inventory category label when possible. */
export function normalizeLegacyInventoryCategory(raw: string): string {
  if (raw === "Prepared Meals") return "Ready-to-eat";
  return raw;
}

const DEFAULT_ICON = PackageIcon;

/**
 * Resolves a Phosphor icon for UI lists. Uses stored `category` first, then `name` heuristics.
 */
export function getFoodCategoryIcon(
  category?: string | null,
  name?: string | null
): CategoryIconComponent {
  const label = (category || "").toLowerCase().trim();
  const n = (name || "").toLowerCase().trim();

  if (label === "dairy" || label.includes("milk")) return DairyLucideMilkIcon;
  if (label === "meat" || label === "protein") return MeatLucideBeefIcon;
  if (label === "seafood" || label === "fish") return FishIcon;
  if (label === "deli") return DeliLucideSandwichIcon;
  if (label === "vegetable" || label === "vegetables" || label === "veg") return CarrotIcon;
  if (label === "fruit" || label === "fruits") return FruitsLucideGrapeIcon;
  if (label === "bakery" || label === "bread") return BakeryBaguetteIcon;
  if (label === "egg" || label === "eggs") return EggIcon;
  if (label === "grains" || label === "grain") return GrainsLucideWheatIcon;
  if (label === "canned") return CylinderIcon;
  if (label === "snacks") return CookieIcon;
  if (label === "beverages") return CoffeeIcon;
  if (label === "condiments") return SoySauceIcon;
  if (label === "sauces" || label === "sauce") return JarIcon;
  if (label === "spices" || label === "spice") return GiSaltShakerIcon;
  if (
    label === "ready-to-eat" ||
    label === "ready to eat" ||
    label === "prepared meals" ||
    label === "prepared meal"
  )
    return CookingPotIcon;
  if (label === "frozen") return SnowflakeIcon;
  if (label === "household") return PackageIcon;
  if (label === "other") return PackageIcon;

  if (n.includes("milk") || n.includes("yogurt") || n.includes("cheese"))
    return DairyLucideMilkIcon;
  if (n.includes("chicken") || n.includes("beef") || n.includes("pork") || n.includes("meat"))
    return MeatLucideBeefIcon;
  if (n.includes("salmon") || n.includes("tuna") || n.includes("fish") || n.includes("shrimp"))
    return FishIcon;
  if (n.includes("deli") || n.includes("salami") || n.includes("prosciutto"))
    return DeliLucideSandwichIcon;
  if (n.includes("carrot") || n.includes("broccoli") || n.includes("lettuce") || n.includes("spinach"))
    return CarrotIcon;
  if (n.includes("apple") || n.includes("banana") || n.includes("orange") || n.includes("grape"))
    return FruitsLucideGrapeIcon;
  if (n.includes("bread") || n.includes("toast") || n.includes("bun") || n.includes("bagel"))
    return BakeryBaguetteIcon;
  if (n.includes("egg")) return EggIcon;
  if (n.includes("rice") || n.includes("pasta") || n.includes("oat") || n.includes("grain"))
    return GrainsLucideWheatIcon;
  if (n.includes(" canned") || n.startsWith("can ") || n.includes(" tin "))
    return CylinderIcon;
  if (n.includes("cookie") || n.includes("chips") || n.includes("snack")) return CookieIcon;
  if (n.includes("coffee") || n.includes("tea") || n.includes("juice") || n.includes("soda"))
    return CoffeeIcon;
  if (n.includes("ketchup") || n.includes("mayo") || n.includes("mustard"))
    return SoySauceIcon;
  if (
    n.includes("cinnamon") ||
    n.includes("paprika") ||
    n.includes("cumin") ||
    n.includes("turmeric") ||
    n.includes("nutmeg") ||
    n.includes("cardamom")
  )
    return GiSaltShakerIcon;
  if (n.includes("sauce") || n.includes("dressing") || n.includes("marinade")) return JarIcon;
  if (n.includes("frozen") || n.includes("ice")) return SnowflakeIcon;
  return DEFAULT_ICON;
}
