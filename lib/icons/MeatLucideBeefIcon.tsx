/**
 * Lucide "Beef" for the Meat category — props aligned with Phosphor chips (size / color / weight).
 */
import { Beef } from "lucide-react-native";
import React from "react";

export type MeatLucideBeefIconProps = {
  size?: number;
  color?: string;
  weight?: "regular" | "fill" | "bold" | string;
};

export function MeatLucideBeefIcon({
  size = 24,
  color = "#000",
  weight = "regular",
}: MeatLucideBeefIconProps) {
  const strokeWidth =
    weight === "fill" || weight === "bold" ? 2.75 : 2;
  return <Beef size={size} color={color} strokeWidth={strokeWidth} />;
}

MeatLucideBeefIcon.displayName = "MeatLucideBeefIcon";
