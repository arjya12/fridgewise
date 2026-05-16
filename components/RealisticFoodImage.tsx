import FoodIcon from "@/components/FoodIcon";
import React from "react";
import { ImageStyle, ViewStyle } from "react-native";

type RealisticFoodImageProps = {
  foodName: string;
  location?: "fridge" | "shelf";
  size?: number;
  style?: ViewStyle;
  imageStyle?: ImageStyle;
};

/**
 * A component that displays a realistic food image based on the food name
 * Using high-quality food icons for better visual representation
 */
export default function RealisticFoodImage({
  foodName,
  size = 60,
  style,
  imageStyle: _imageStyle,
}: RealisticFoodImageProps) {
  return <FoodIcon foodName={foodName} size={Math.round(size * 0.58)} style={style} />;
}
