import React, { useRef } from "react";
import { Animated, StyleSheet, Text, TouchableOpacity } from "react-native";
import { useThemeColor } from "../../hooks/useThemeColor";
import { ActionButtonProps } from "../../types/calendar";

const ActionButton: React.FC<ActionButtonProps> = ({
  type,
  onPress,
  disabled = false,
  size = "medium",
}) => {
  const scaleValue = useRef(new Animated.Value(1)).current;

  const primaryColor = useThemeColor(
    { light: "#0a7ea4", dark: "#9BA1A6" },
    "text"
  );
  const destructiveColor = "#FF3B30";
  const disabledColor = useThemeColor(
    { light: "#6B7280", dark: "#6B7280" },
    "text"
  );

  const isDestructive = type === "delete";
  const buttonColor = disabled
    ? disabledColor
    : isDestructive
    ? destructiveColor
    : primaryColor;

  const handlePressIn = () => {
    if (!disabled) {
      Animated.spring(scaleValue, {
        toValue: 0.96,
        useNativeDriver: true,
        tension: 300,
        friction: 10,
      }).start();
    }
  };

  const handlePressOut = () => {
    if (!disabled) {
      Animated.spring(scaleValue, {
        toValue: 1,
        useNativeDriver: true,
        tension: 300,
        friction: 10,
      }).start();
    }
  };

  const handlePress = () => {
    if (!disabled) {
      onPress();
    }
  };

  const getButtonText = () => {
    switch (type) {
      case "used":
        return "Mark as Used";
      case "delete":
        return "Delete";
      default:
        return "Action";
    }
  };

  const getSizeStyles = () => {
    switch (size) {
      case "small":
        return {
          paddingHorizontal: 12,
          paddingVertical: 6,
          minHeight: 28,
          fontSize: 12,
        };
      case "large":
        return {
          paddingHorizontal: 20,
          paddingVertical: 12,
          minHeight: 48,
          fontSize: 16,
        };
      default: // medium
        return {
          paddingHorizontal: 16,
          paddingVertical: 8,
          minHeight: 36,
          fontSize: 14,
        };
    }
  };

  const sizeStyles = getSizeStyles();

  const styles = StyleSheet.create({
    button: {
      backgroundColor: disabled ? "#f3f4f6" : "transparent",
      borderRadius: 8,
      borderWidth: 1,
      borderColor: buttonColor,
      paddingHorizontal: sizeStyles.paddingHorizontal,
      paddingVertical: sizeStyles.paddingVertical,
      minHeight: sizeStyles.minHeight,
      justifyContent: "center",
      alignItems: "center",
      opacity: disabled ? 0.5 : 1,
    },
    text: {
      color: buttonColor,
      fontSize: sizeStyles.fontSize,
      fontWeight: "500",
      textAlign: "center",
    },
  });

  return (
    <Animated.View
      style={{
        transform: [{ scale: scaleValue }],
      }}
    >
      <TouchableOpacity
        style={styles.button}
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled}
        activeOpacity={0.7}
        accessible={true}
        accessibilityRole="button"
        accessibilityLabel={getButtonText()}
        accessibilityState={{ disabled }}
        accessibilityHint={
          type === "used"
            ? "Marks this item as consumed"
            : "Removes this item from your inventory"
        }
      >
        <Text style={styles.text}>{getButtonText()}</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};

export default React.memo(ActionButton);
