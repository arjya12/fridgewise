import React, { useRef } from "react";
import {
  Animated,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useThemeColor } from "../../hooks/useThemeColor";
import { ItemCompactCardProps } from "../../types/calendar";
import RealisticFoodImage from "../RealisticFoodImage";

const ItemCompactCard: React.FC<ItemCompactCardProps> = ({
  item,
  expiryStatus,
  onPress,
}) => {
  const scaleValue = useRef(new Animated.Value(1)).current;
  const opacityValue = useRef(new Animated.Value(1)).current;

  const textColor = useThemeColor(
    { light: "#11181C", dark: "#ECEDEE" },
    "text"
  );
  const secondaryTextColor = useThemeColor(
    { light: "#687076", dark: "#9BA1A6" },
    "text"
  );

  const handlePressIn = () => {
    Animated.parallel([
      Animated.timing(scaleValue, {
        toValue: 0.98,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(opacityValue, {
        toValue: 0.8,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handlePressOut = () => {
    Animated.parallel([
      Animated.spring(scaleValue, {
        toValue: 1,
        useNativeDriver: true,
        tension: 300,
        friction: 10,
      }),
      Animated.timing(opacityValue, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handlePress = () => {
    onPress(item);
  };

  const formatItemTitle = () => {
    if (item.quantity && item.quantity > 1) {
      return `${item.name} (${item.quantity})`;
    }
    return item.name;
  };

  const styles = StyleSheet.create({
    container: {
      flexDirection: "row",
      alignItems: "center",
      minHeight: 44,
      paddingHorizontal: 16,
      paddingVertical: 8,
      backgroundColor: "transparent",
    },
    iconContainer: {
      width: 32,
      height: 32,
      marginRight: 12,
      justifyContent: "center",
      alignItems: "center",
    },
    contentContainer: {
      flex: 1,
      justifyContent: "center",
    },
    itemTitle: {
      fontSize: 16,
      fontWeight: "600",
      color: textColor,
    },
    quantityText: {
      fontWeight: "400",
      color: secondaryTextColor,
    },
    badgeContainer: {
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 12,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: expiryStatus.color,
    },
    badgeText: {
      fontSize: 12,
      fontWeight: "500",
      color: "#FFFFFF",
    },
  });

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ scale: scaleValue }],
          opacity: opacityValue,
        },
      ]}
    >
      <TouchableOpacity
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={1}
        style={{ flexDirection: "row", alignItems: "center", flex: 1 }}
        accessible={true}
        accessibilityRole="button"
        accessibilityLabel={`${item.name}, quantity ${
          item.quantity || 1
        }, expires ${expiryStatus.text}`}
        accessibilityHint="Tap to view item details"
      >
        <View style={styles.iconContainer}>
          <RealisticFoodImage foodName={item.name} size={32} />
        </View>

        <View style={styles.contentContainer}>
          <Text style={styles.itemTitle} numberOfLines={1}>
            {formatItemTitle()}
          </Text>
        </View>

        <View style={styles.badgeContainer}>
          <Text style={styles.badgeText}>{expiryStatus.text}</Text>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

export default React.memo(ItemCompactCard);
