/**
 * Phosphor Bread for Bakery — same family as Vegetables / Eggs chips (instant, no icon font).
 */
import { BreadIcon, type IconWeight } from "phosphor-react-native";
import React from "react";

export type BakeryBaguetteIconProps = {
  size?: number;
  color?: string;
  weight?: "regular" | "fill" | "bold" | string;
};

function phosphorWeight(w: string | undefined): IconWeight {
  if (
    w === "thin" ||
    w === "light" ||
    w === "regular" ||
    w === "bold" ||
    w === "fill" ||
    w === "duotone"
  ) {
    return w;
  }
  return "regular";
}

export function BakeryBaguetteIcon({
  size = 24,
  color = "#000",
  weight = "regular",
}: BakeryBaguetteIconProps) {
  return (
    <BreadIcon size={size} color={color} weight={phosphorWeight(weight)} />
  );
}

BakeryBaguetteIcon.displayName = "BakeryBaguetteIcon";
