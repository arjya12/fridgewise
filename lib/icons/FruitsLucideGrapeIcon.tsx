/**
 * Lucide "Grape" for Fruits — suggests variety vs a single apple logo; props match category chips.
 */
import { Grape } from "lucide-react-native";
import React from "react";

export type FruitsLucideGrapeIconProps = {
  size?: number;
  color?: string;
  weight?: "regular" | "fill" | "bold" | string;
};

export function FruitsLucideGrapeIcon({
  size = 24,
  color = "#000",
  weight = "regular",
}: FruitsLucideGrapeIconProps) {
  const strokeWidth =
    weight === "fill" || weight === "bold" ? 2.75 : 2;
  return <Grape size={size} color={color} strokeWidth={strokeWidth} />;
}

FruitsLucideGrapeIcon.displayName = "FruitsLucideGrapeIcon";
