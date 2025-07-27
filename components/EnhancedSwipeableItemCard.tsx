/**
 * Enhanced Swipeable Item Card
 * Implements progressive swipe animations with haptic feedback
 * Based on Phase 1 animation validation
 */

import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useCallback, useMemo } from "react";
import { Alert, StyleSheet, Text, View } from "react-native";
import {
  PanGestureHandler,
  PanGestureHandlerGestureEvent,
} from "react-native-gesture-handler";
import Animated, {
  interpolate,
  interpolateColor,
  runOnJS,
  useAnimatedGestureHandler,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { useThemeColor } from "../hooks/useThemeColor";
import { FoodItem } from "../lib/supabase";
import { formatExpiry } from "../utils/formatExpiry";
import RealisticFoodImage from "./RealisticFoodImage";

// =============================================================================
// INTERFACES
// =============================================================================

export interface EnhancedSwipeableItemCardProps {
  item: FoodItem;
  onMarkUsed: (item: FoodItem, quantity?: number) => void;
  onExtendExpiry: (item: FoodItem, days: number) => void;
  onPress?: (item: FoodItem) => void;
  onDelete?: (item: FoodItem) => void;
  disabled?: boolean;
  showQuantitySelector?: boolean;
  enableHaptics?: boolean;
  animationConfig?: SwipeAnimationConfig;
}

export interface SwipeAnimationConfig {
  swipeThreshold: number;
  maxSwipeDistance: number;
  springConfig: {
    stiffness: number;
    damping: number;
    mass: number;
  };
  timingConfig: {
    duration: number;
  };
  progressiveThresholds: {
    light: number;
    medium: number;
    strong: number;
    action: number;
  };
}

// =============================================================================
// DEFAULT CONFIGURATION
// =============================================================================

const DEFAULT_ANIMATION_CONFIG: SwipeAnimationConfig = {
  swipeThreshold: 80,
  maxSwipeDistance: 150,
  springConfig: {
    stiffness: 150,
    damping: 20,
    mass: 1,
  },
  timingConfig: {
    duration: 300,
  },
  progressiveThresholds: {
    light: 20,
    medium: 50,
    strong: 80,
    action: 120,
  },
};

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function EnhancedSwipeableItemCard({
  item,
  onMarkUsed,
  onExtendExpiry,
  onPress,
  onDelete,
  disabled = false,
  showQuantitySelector = true,
  enableHaptics = true,
  animationConfig = DEFAULT_ANIMATION_CONFIG,
}: EnhancedSwipeableItemCardProps) {
  // =============================================================================
  // THEME AND COLORS
  // =============================================================================

  const backgroundColor = useThemeColor({}, "background");
  const textColor = useThemeColor({}, "text");
  const tintColor = useThemeColor({}, "tint");
  const borderColor = useThemeColor({}, "icon");

  // =============================================================================
  // ANIMATED VALUES
  // =============================================================================

  const translateX = useSharedValue(0);
  const scale = useSharedValue(1);
  const backgroundOpacity = useSharedValue(0);
  const iconOpacity = useSharedValue(0);
  const iconScale = useSharedValue(0.8);

  // =============================================================================
  // HAPTIC FEEDBACK
  // =============================================================================

  const triggerHaptic = useCallback(
    (type: "light" | "medium" | "heavy" | "success") => {
      if (!enableHaptics) return;

      switch (type) {
        case "light":
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          break;
        case "medium":
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          break;
        case "heavy":
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
          break;
        case "success":
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          break;
      }
    },
    [enableHaptics]
  );

  // =============================================================================
  // GESTURE HANDLER
  // =============================================================================

  const gestureHandler =
    useAnimatedGestureHandler<PanGestureHandlerGestureEvent>({
      onStart: () => {
        if (disabled) return;
        scale.value = withSpring(0.98, animationConfig.springConfig);
      },

      onActive: (event) => {
        if (disabled) return;

        const { translationX } = event;
        const clampedTranslation = Math.max(
          -animationConfig.maxSwipeDistance,
          Math.min(animationConfig.maxSwipeDistance, translationX)
        );

        translateX.value = clampedTranslation;

        // Progressive background opacity based on swipe distance
        const progress =
          Math.abs(clampedTranslation) / animationConfig.maxSwipeDistance;
        backgroundOpacity.value = interpolate(
          progress,
          [0, 0.2, 0.5, 0.8, 1.0],
          [0, 0.15, 0.3, 0.6, 0.8]
        );

        // Progressive icon opacity and scale
        iconOpacity.value = interpolate(
          progress,
          [0, 0.2, 0.4, 0.7, 1.0],
          [0, 0, 0.3, 0.7, 1.0]
        );

        iconScale.value = interpolate(
          progress,
          [0, 0.2, 0.4, 0.7, 1.0],
          [0.8, 0.85, 0.9, 0.95, 1.0]
        );

        // Progressive haptic feedback
        const absTranslation = Math.abs(clampedTranslation);
        if (
          absTranslation >= animationConfig.progressiveThresholds.light &&
          absTranslation < animationConfig.progressiveThresholds.medium
        ) {
          runOnJS(triggerHaptic)("light");
        } else if (
          absTranslation >= animationConfig.progressiveThresholds.medium &&
          absTranslation < animationConfig.progressiveThresholds.strong
        ) {
          runOnJS(triggerHaptic)("medium");
        } else if (
          absTranslation >= animationConfig.progressiveThresholds.strong
        ) {
          runOnJS(triggerHaptic)("heavy");
        }
      },

      onEnd: (event) => {
        if (disabled) return;

        const { translationX, velocityX } = event;
        const shouldTriggerAction =
          Math.abs(translationX) > animationConfig.swipeThreshold ||
          Math.abs(velocityX) > 500;

        if (shouldTriggerAction) {
          // Trigger action based on swipe direction
          if (translationX > 0) {
            // Right swipe - Mark as used
            runOnJS(triggerHaptic)("success");
            runOnJS(handleMarkUsed)();
          } else {
            // Left swipe - Show action menu or delete
            runOnJS(triggerHaptic)("success");
            runOnJS(handleLeftSwipeAction)();
          }
        }

        // Reset animations
        translateX.value = withSpring(0, animationConfig.springConfig);
        scale.value = withSpring(1, animationConfig.springConfig);
        backgroundOpacity.value = withTiming(0, animationConfig.timingConfig);
        iconOpacity.value = withTiming(0, animationConfig.timingConfig);
        iconScale.value = withTiming(0.8, animationConfig.timingConfig);
      },
    });

  // =============================================================================
  // ACTION HANDLERS
  // =============================================================================

  const handleMarkUsed = useCallback(() => {
    if (showQuantitySelector && item.quantity > 1) {
      Alert.alert("Mark as Used", `How much of ${item.name} did you use?`, [
        { text: "Some", onPress: () => onMarkUsed(item, 1) },
        {
          text: "Half",
          onPress: () => onMarkUsed(item, Math.floor(item.quantity / 2)),
        },
        { text: "All", onPress: () => onMarkUsed(item) },
        { text: "Cancel", style: "cancel" },
      ]);
    } else {
      onMarkUsed(item);
    }
  }, [item, onMarkUsed, showQuantitySelector]);

  const handleLeftSwipeAction = useCallback(() => {
    Alert.alert(
      "Item Actions",
      `What would you like to do with ${item.name}?`,
      [
        {
          text: "Extend Expiry (+3 days)",
          onPress: () => onExtendExpiry(item, 3),
        },
        {
          text: "Extend Expiry (+7 days)",
          onPress: () => onExtendExpiry(item, 7),
        },
        ...(onDelete
          ? [
              {
                text: "Delete",
                style: "destructive" as const,
                onPress: () => onDelete(item),
              },
            ]
          : []),
        { text: "Cancel", style: "cancel" },
      ]
    );
  }, [item, onExtendExpiry, onDelete]);

  const handlePress = useCallback(() => {
    if (onPress && !disabled) {
      onPress(item);
    }
  }, [onPress, item, disabled]);

  // =============================================================================
  // ANIMATED STYLES
  // =============================================================================

  const cardAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }, { scale: scale.value }],
  }));

  const backgroundAnimatedStyle = useAnimatedStyle(() => {
    const isRightSwipe = translateX.value > 0;
    return {
      backgroundColor: interpolateColor(
        backgroundOpacity.value,
        [0, 1],
        [
          "transparent",
          isRightSwipe ? "#16A34A" : "#DC2626", // Green for right (mark used), red for left (action)
        ]
      ),
      opacity: backgroundOpacity.value,
    };
  });

  const leftIconAnimatedStyle = useAnimatedStyle(() => ({
    opacity: translateX.value < 0 ? iconOpacity.value : 0,
    transform: [{ scale: translateX.value < 0 ? iconScale.value : 0.8 }],
  }));

  const rightIconAnimatedStyle = useAnimatedStyle(() => ({
    opacity: translateX.value > 0 ? iconOpacity.value : 0,
    transform: [{ scale: translateX.value > 0 ? iconScale.value : 0.8 }],
  }));

  // =============================================================================
  // ITEM STATUS
  // =============================================================================

  const itemStatus = useMemo(() => {
    if (!item.expiry_date) return "unknown";

    const today = new Date().toISOString().split("T")[0];
    const expiry = item.expiry_date;

    if (expiry < today) return "expired";
    if (expiry === today) return "expires-today";

    const daysUntilExpiry = Math.ceil(
      (new Date(expiry).getTime() - new Date(today).getTime()) /
        (1000 * 60 * 60 * 24)
    );

    if (daysUntilExpiry <= 3) return "expires-soon";
    return "fresh";
  }, [item.expiry_date]);

  const statusColor = useMemo(() => {
    switch (itemStatus) {
      case "expired":
        return "#DC2626";
      case "expires-today":
        return "#EA580C";
      case "expires-soon":
        return "#D97706";
      default:
        return "#16A34A";
    }
  }, [itemStatus]);

  // =============================================================================
  // RENDER
  // =============================================================================

  return (
    <View style={styles.container}>
      {/* Background Actions */}
      <Animated.View
        style={[styles.actionsBackground, backgroundAnimatedStyle]}
      >
        {/* Left Action - Extend/Delete */}
        <Animated.View style={[styles.leftAction, leftIconAnimatedStyle]}>
          <Ionicons name="time-outline" size={24} color="white" />
          <Text style={styles.actionText}>Extend</Text>
        </Animated.View>

        {/* Right Action - Mark Used */}
        <Animated.View style={[styles.rightAction, rightIconAnimatedStyle]}>
          <Ionicons name="checkmark-circle-outline" size={24} color="white" />
          <Text style={styles.actionText}>Used</Text>
        </Animated.View>
      </Animated.View>

      {/* Main Card */}
      <PanGestureHandler onGestureEvent={gestureHandler} enabled={!disabled}>
        <Animated.View
          style={[styles.card, { backgroundColor }, cardAnimatedStyle]}
        >
          <View style={styles.cardContent} onTouchEnd={handlePress}>
            {/* Food Image */}
            <RealisticFoodImage
              foodName={item.name}
              style={styles.foodImage}
              size={48}
            />

            {/* Item Info */}
            <View style={styles.itemInfo}>
              <Text
                style={[styles.itemName, { color: textColor }]}
                numberOfLines={1}
              >
                {item.name}
              </Text>

              <View style={styles.itemDetails}>
                <Text style={[styles.itemQuantity, { color: textColor }]}>
                  {item.quantity} {item.unit || "units"}
                </Text>

                {item.location && (
                  <View style={styles.locationBadge}>
                    <Ionicons
                      name={
                        item.location === "fridge"
                          ? "snow-outline"
                          : "home-outline"
                      }
                      size={12}
                      color={borderColor}
                    />
                    <Text style={[styles.locationText, { color: textColor }]}>
                      {item.location}
                    </Text>
                  </View>
                )}
              </View>

              {/* Expiry Info */}
              <View style={styles.expiryInfo}>
                <View
                  style={[
                    styles.statusIndicator,
                    { backgroundColor: statusColor },
                  ]}
                />
                <Text style={[styles.expiryText, { color: statusColor }]}>
                  {formatExpiry(item.expiry_date)}
                </Text>
              </View>
            </View>

            {/* Swipe Hint */}
            <View style={styles.swipeHint}>
              <Ionicons
                name="swap-horizontal-outline"
                size={16}
                color={borderColor}
              />
            </View>
          </View>
        </Animated.View>
      </PanGestureHandler>
    </View>
  );
}

// =============================================================================
// STYLES
// =============================================================================

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginVertical: 8,
  },
  actionsBackground: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    borderRadius: 12,
  },
  leftAction: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
  },
  rightAction: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
  },
  actionText: {
    color: "white",
    fontSize: 14,
    fontWeight: "600",
  },
  card: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.1)",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  cardContent: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    gap: 12,
  },
  foodImage: {
    borderRadius: 8,
  },
  itemInfo: {
    flex: 1,
    gap: 4,
  },
  itemName: {
    fontSize: 16,
    fontWeight: "600",
  },
  itemDetails: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  itemQuantity: {
    fontSize: 14,
    opacity: 0.7,
  },
  locationBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    backgroundColor: "rgba(0,0,0,0.05)",
    borderRadius: 8,
  },
  locationText: {
    fontSize: 12,
    textTransform: "capitalize",
  },
  expiryInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  expiryText: {
    fontSize: 14,
    fontWeight: "500",
  },
  swipeHint: {
    opacity: 0.3,
  },
});

// Default export for backward compatibility
export default EnhancedSwipeableItemCard;
