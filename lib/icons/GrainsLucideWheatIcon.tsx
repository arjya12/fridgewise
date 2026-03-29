/**
 * Lucide "Wheat" for Grains — clearer at small sizes than Phosphor Grains; chip props aligned.
 */
import { Wheat } from "lucide-react-native";
import React from "react";

export type GrainsLucideWheatIconProps = {
  size?: number;
  color?: string;
  weight?: "regular" | "fill" | "bold" | string;
};

export function GrainsLucideWheatIcon({
  size = 24,
  color = "#000",
  weight = "regular",
}: GrainsLucideWheatIconProps) {
  const strokeWidth =
    weight === "fill" || weight === "bold" ? 2.75 : 2;
  return <Wheat size={size} color={color} strokeWidth={strokeWidth} />;
}

GrainsLucideWheatIcon.displayName = "GrainsLucideWheatIcon";
