/**
 * Phosphor icons for report category rows (same heuristics as History).
 */
import React from "react";
import {
  AppleLogo,
  BeerBottle,
  Bone,
  Bread,
  Carrot,
  Coffee,
  Cookie,
  CookingPot,
  Cylinder,
  Drop,
  Egg,
  Fish,
  ForkKnife,
  Grains,
  Jar,
  Package,
  Snowflake,
} from "phosphor-react-native";
export type CategoryIconComponent = React.ComponentType<{
  size?: number;
  color?: string;
  weight?: string;
}>;

export function getReportCategoryIcon(
  category?: string | null,
  name?: string | null
): CategoryIconComponent {
  const label = (category || "").toLowerCase().trim();
  const n = (name || "").toLowerCase().trim();

  if (label === "dairy" || label.includes("milk")) return Drop;
  if (label === "meat" || label === "protein") return Bone;
  if (label === "seafood" || label === "fish") return Fish;
  if (label === "deli") return ForkKnife;
  if (label === "vegetable" || label === "vegetables" || label === "veg") return Carrot;
  if (label === "fruit" || label === "fruits") return AppleLogo;
  if (label === "bakery" || label === "bread") return Bread;
  if (label === "egg" || label === "eggs") return Egg;
  if (label === "grains" || label === "grain") return Grains;
  if (label === "canned") return Cylinder;
  if (label === "snacks") return Cookie;
  if (label === "beverages") return Coffee;
  if (label === "condiments") return BeerBottle;
  if (label === "sauces" || label === "sauce") return Jar;
  if (
    label === "ready-to-eat" ||
    label === "ready to eat" ||
    label === "prepared meals" ||
    label === "prepared meal"
  )
    return CookingPot;
  if (label === "frozen") return Snowflake;
  if (label === "other") return Package;

  if (n.includes("milk") || n.includes("yogurt") || n.includes("cheese")) return Drop;
  if (n.includes("chicken") || n.includes("beef") || n.includes("pork") || n.includes("meat"))
    return Bone;
  if (n.includes("salmon") || n.includes("tuna") || n.includes("fish") || n.includes("shrimp"))
    return Fish;
  if (n.includes("deli") || n.includes("salami") || n.includes("prosciutto")) return ForkKnife;
  if (n.includes("carrot") || n.includes("broccoli") || n.includes("lettuce") || n.includes("spinach"))
    return Carrot;
  if (n.includes("apple") || n.includes("banana") || n.includes("orange") || n.includes("grape"))
    return AppleLogo;
  if (n.includes("bread") || n.includes("toast") || n.includes("bun") || n.includes("bagel"))
    return Bread;
  if (n.includes("egg")) return Egg;
  if (n.includes("rice") || n.includes("pasta") || n.includes("oat") || n.includes("grain"))
    return Grains;
  if (n.includes(" canned") || n.startsWith("can ") || n.includes(" tin ")) return Cylinder;
  if (n.includes("cookie") || n.includes("chips") || n.includes("snack")) return Cookie;
  if (n.includes("coffee") || n.includes("tea") || n.includes("juice") || n.includes("soda"))
    return Coffee;
  if (n.includes("ketchup") || n.includes("mayo") || n.includes("mustard")) return BeerBottle;
  if (n.includes("sauce") || n.includes("dressing") || n.includes("marinade")) return Jar;
  if (n.includes("frozen") || n.includes("ice")) return Snowflake;
  return Package;
}
