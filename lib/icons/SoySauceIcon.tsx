/**
 * Lucide BottleWine for Condiments — bottle silhouette (this Lucide build has no generic Bottle).
 * Export name kept for `foodCategories` compatibility.
 */
import { BottleWine } from "lucide-react-native";
import React from "react";

export type SoySauceIconProps = {
  size?: number;
  color?: string;
  weight?: "regular" | "fill" | "bold" | string;
};

export function SoySauceIcon({
  size = 24,
  color = "#000",
  weight = "regular",
}: SoySauceIconProps) {
  const strokeWidth =
    weight === "fill" || weight === "bold" ? 2.75 : 2;
  return (
    <BottleWine size={size} color={color} strokeWidth={strokeWidth} />
  );
}

SoySauceIcon.displayName = "SoySauceIcon";
