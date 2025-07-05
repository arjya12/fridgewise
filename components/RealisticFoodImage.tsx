import {
  getFoodImageCategory,
  getFoodImagePath,
} from "@/utils/foodImageMapping";
import React from "react";
import {
  Image,
  ImageSourcePropType,
  ImageStyle,
  StyleSheet,
  View,
  ViewStyle,
} from "react-native";

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
  location,
  size = 60,
  style,
  imageStyle,
}: RealisticFoodImageProps) {
  // Get the appropriate image path based on the food name
  const imagePath = getFoodImagePath(foodName) as ImageSourcePropType;

  // Get the category for accessibility label
  const category = getFoodImageCategory(foodName);

  // Get background color based on category
  const getBackgroundColor = () => {
    switch (category) {
      case "beef":
      case "chicken":
        return "#fee2e2"; // Light red
      case "fish":
        return "#e0f2fe"; // Light blue
      case "milk":
      case "yogurt":
      case "butter":
        return "#eff6ff"; // Light blue
      case "cheese":
      case "eggs":
        return "#fefce8"; // Light yellow
      case "vegetables":
      case "carrots":
      case "tomato":
        return "#ecfdf5"; // Light green
      case "fruits":
      case "apple":
      case "banana":
        return "#fff7ed"; // Light orange
      case "bread":
      case "pasta":
      case "rice":
      case "cereal":
        return "#fff7ed"; // Light orange
      default:
        return "#f3f4f6"; // Light gray
    }
  };

  return (
    <View
      style={[
        styles.container,
        { width: size, height: size, backgroundColor: getBackgroundColor() },
        style,
      ]}
    >
      <Image
        source={imagePath}
        style={[
          styles.image,
          { width: size * 0.7, height: size * 0.7 },
          imageStyle,
        ]}
        resizeMode="contain"
        accessibilityLabel={`${foodName} (${category})`}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 8,
    padding: 8,
  },
  image: {
    borderRadius: 4,
  },
});
