/**
 * Lucide "Milk" (bottle/carton) for Dairy — props aligned with Phosphor category chips.
 */
import { Milk } from "lucide-react-native";
import React from "react";

export type DairyLucideMilkIconProps = {
  size?: number;
  color?: string;
  weight?: "regular" | "fill" | "bold" | string;
};

export function DairyLucideMilkIcon({
  size = 24,
  color = "#000",
  weight = "regular",
}: DairyLucideMilkIconProps) {
  const strokeWidth =
    weight === "fill" || weight === "bold" ? 2.75 : 2;
  return <Milk size={size} color={color} strokeWidth={strokeWidth} />;
}

DairyLucideMilkIcon.displayName = "DairyLucideMilkIcon";
