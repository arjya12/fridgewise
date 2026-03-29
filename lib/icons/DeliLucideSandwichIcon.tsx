/**
 * Lucide "Sandwich" for Deli — props aligned with Phosphor category chips.
 */
import { Sandwich } from "lucide-react-native";
import React from "react";

export type DeliLucideSandwichIconProps = {
  size?: number;
  color?: string;
  weight?: "regular" | "fill" | "bold" | string;
};

export function DeliLucideSandwichIcon({
  size = 24,
  color = "#000",
  weight = "regular",
}: DeliLucideSandwichIconProps) {
  const strokeWidth =
    weight === "fill" || weight === "bold" ? 2.75 : 2;
  return <Sandwich size={size} color={color} strokeWidth={strokeWidth} />;
}

DeliLucideSandwichIcon.displayName = "DeliLucideSandwichIcon";
