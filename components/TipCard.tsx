import { Tip } from "@/services/tipService";
import { MaterialIcons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, View } from "react-native";

interface TipCardProps {
  tip: Tip;
}

/**
 * A component to display a helpful tip with an icon
 */
const TipCard: React.FC<TipCardProps> = ({ tip }) => {
  // Get the appropriate icon based on the tip category
  const getIconName = (): keyof typeof MaterialIcons.glyphMap => {
    switch (tip.category) {
      case "storage":
        return "kitchen";
      case "expiration":
        return "event-available";
      case "safety":
        return "health-and-safety";
      case "organization":
        return "category";
      case "waste":
        return "delete-outline";
      default:
        return "emoji-objects";
    }
  };

  return (
    <View style={styles.card}>
      <MaterialIcons
        name={getIconName()}
        size={22}
        color="#FFCC00"
        style={styles.tipCardIcon}
      />
      <Text style={styles.tipText}>{tip.text}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#FFFBE5",
    paddingVertical: 18,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 15,
    flexDirection: "row",
    alignItems: "flex-start",
    borderLeftWidth: 4,
    borderLeftColor: "#FFCC00",
  },
  tipCardIcon: {
    width: 22,
    height: 22,
    marginRight: 14,
    marginTop: 2,
  },
  tipText: {
    fontSize: 14,
    lineHeight: 20,
    color: "#BA9F7C",
    flex: 1,
    fontWeight: "600",
  },
});

export default TipCard;
