import { MaterialIcons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, View, ViewStyle } from "react-native";

interface AchievementCardProps {
  title: string;
  message: string;
  iconName?: keyof typeof MaterialIcons.glyphMap;
  iconColor?: string;
  style?: ViewStyle;
  showAnimation?: boolean;
}

/**
 * A component to display achievement messages with an icon
 */
const AchievementCard: React.FC<AchievementCardProps> = ({
  title,
  message,
  iconName = "check-circle",
  iconColor = "#22C55E",
  style,
  showAnimation = true,
}) => {
  return (
    <View style={[styles.container, style]}>
      <MaterialIcons
        name={iconName}
        size={48}
        color={iconColor}
        style={styles.icon}
      />
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.message}>{message}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#F0FDF4",
    borderRadius: 8,
    padding: 20,
    alignItems: "center",
    marginBottom: 15,
    borderLeftWidth: 4,
    borderLeftColor: "#22C55E",
  },
  icon: {
    marginBottom: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    color: "#22C55E",
    marginBottom: 8,
    textAlign: "center",
  },
  message: {
    fontSize: 16,
    color: "#4B5563",
    textAlign: "center",
    lineHeight: 22,
  },
});

export default AchievementCard;
