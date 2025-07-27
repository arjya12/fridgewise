/**
 * Enhanced Swipeable Item Card
 * Implements progressive swipe animations with haptic feedback
 * Based on Phase 1 animation validation
 */

import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useCallback, useMemo } from "react";
import { Alert, StyleSheet, Text, View, ViewStyle } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  interpolate,
  interpolateColor,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { useThemeColor } from "../hooks/useThemeColor";
import { FoodItem } from "../lib/supabase";
import { useBreakpoint } from "../utils/responsiveUtils";

// Helper function to get status text based on expiry date
function getStatusText(expiryDate: string): string {
  if (!expiryDate) return "SAFE";

  const today = new Date();
  const expiry = new Date(expiryDate);
  const diffTime = expiry.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return "EXPIRED";
  if (diffDays <= 2) return "WARNING";
  return "SAFE";
}

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
  style?: ViewStyle | ViewStyle[];
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
  style,
}: EnhancedSwipeableItemCardProps) {
  // =============================================================================
  // THEME AND COLORS
  // =============================================================================

  const backgroundColor = useThemeColor({}, "background");
  const textColor = useThemeColor({}, "text");
  const tintColor = useThemeColor({}, "tint");
  const borderColor = useThemeColor({}, "icon");

  // =============================================================================
  // RESPONSIVE BREAKPOINTS
  // =============================================================================

  const { isSmall, width } = useBreakpoint();
  const isVerySmall = width < 350;

  // =============================================================================
  // ANIMATED VALUES
  // =============================================================================

  const translateX = useSharedValue(0);
  const scale = useSharedValue(1);
  const backgroundOpacity = useSharedValue(0);
  const iconOpacity = useSharedValue(0);
  const iconScale = useSharedValue(0.8);
  const isCommitted = useSharedValue(false);
  const hapticState = useSharedValue(0);
  const cardHeight = useSharedValue(1);
  const cardOpacity = useSharedValue(1);

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

  const foregroundAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  // Left swipe (Mark Used) background
  const leftActionBackgroundAnimatedStyle = useAnimatedStyle(() => ({
    opacity: interpolate(translateX.value, [-200, -20, 0], [1, 0.1, 0]),
    width: interpolate(translateX.value, [-200, -20, 0], [300, 50, 0]),
  }));

  // Right swipe (Extend Expiry) background
  const rightActionBackgroundAnimatedStyle = useAnimatedStyle(() => ({
    opacity: interpolate(translateX.value, [0, 20, 200], [0, 0.1, 1]),
    width: interpolate(translateX.value, [0, 20, 200], [0, 50, 300]),
  }));

  // Left swipe (Mark Used) icon and text styles
  const leftCheckmarkIconAnimatedStyle = useAnimatedStyle(() => ({
    opacity: interpolate(translateX.value, [-40, -20, 0], [1, 0, 0]),
    transform: [
      {
        scale: interpolate(translateX.value, [-40, -20, 0], [1, 0.8, 0.8]),
      },
    ],
  }));

  const leftActionTextAnimatedStyle = useAnimatedStyle(() => ({
    opacity: interpolate(translateX.value, [-140, -120, 0], [1, 0, 0]),
    transform: [
      {
        translateX: interpolate(translateX.value, [-140, -120, 0], [0, 10, 20]),
      },
    ],
  }));

  // Right swipe (Extend Expiry) icon and text styles
  const rightExtendIconAnimatedStyle = useAnimatedStyle(() => ({
    opacity: interpolate(translateX.value, [0, 20, 40], [0, 0, 1]),
    transform: [
      {
        scale: interpolate(translateX.value, [0, 20, 40], [0.8, 0.8, 1]),
      },
    ],
  }));

  const rightActionTextAnimatedStyle = useAnimatedStyle(() => ({
    opacity: interpolate(translateX.value, [0, 120, 140], [0, 0, 1]),
    transform: [
      {
        translateX: interpolate(translateX.value, [0, 120, 140], [-20, -10, 0]),
      },
    ],
  }));

  const exitAnimationStyle = useAnimatedStyle(() => ({
    height: cardHeight.value,
    opacity: cardOpacity.value,
    transform: [
      {
        scaleY: cardHeight.value,
      },
    ],
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

  const backgroundColorMap = useMemo(() => {
    switch (itemStatus) {
      case "expired":
        return "#FECACA"; // Light red background like in Figma
      case "expires-today":
        return "#FED7AA"; // Light orange background
      case "expires-soon":
        return "#FEF3C7"; // Light yellow background like in Figma
      default:
        return "#D1FAE5"; // Light green background like in Figma
    }
  }, [itemStatus]);

  // =============================================================================
  // RENDER
  // =============================================================================

  // Define the new pan gesture using modern react-native-gesture-handler
  const panGesture = Gesture.Pan()
    .activeOffsetX([-Infinity, Infinity]) // Activate on both left and right swipes
    .failOffsetY([-10, 10]) // Yield to vertical scroll if vertical movement > 10px
    .onStart(() => {
      // Reset state for new gesture
      isCommitted.value = false;
      hapticState.value = 0;
    })
    .onUpdate((event) => {
      // Update translateX based on swipe distance (allow both directions)
      translateX.value = event.translationX;

      // Trigger haptic feedback when crossing thresholds
      if (enableHaptics) {
        // Right swipe threshold (extend expiry)
        if (event.translationX >= 20 && hapticState.value === 0) {
          hapticState.value = 1;
          runOnJS(triggerHaptic)("light");
        }
        // Left swipe threshold (mark used)
        else if (event.translationX <= -20 && hapticState.value === 0) {
          hapticState.value = 1;
          runOnJS(triggerHaptic)("light");
        }
      }
    })
    .onEnd((event) => {
      // Evaluate final position and decide action
      if (event.translationX <= -200 && !isCommitted.value) {
        // Left swipe: Mark Used action
        isCommitted.value = true;
        runOnJS(onMarkUsed)(item);

        // Start exit animation
        cardHeight.value = withTiming(0, { duration: 300 });
        cardOpacity.value = withTiming(0, { duration: 300 });
      } else if (event.translationX >= 200 && !isCommitted.value) {
        // Right swipe: Extend Expiry action
        isCommitted.value = true;
        runOnJS(onExtendExpiry)(item, 3); // Default to 3 days for now

        // Reset position without exit animation
        translateX.value = withSpring(0);
      } else {
        // Animate back to original position
        translateX.value = withSpring(0);
      }
    });

  return (
    <Animated.View style={[styles.rootContainer, exitAnimationStyle, style]}>
      <GestureDetector gesture={panGesture}>
        <View style={styles.gestureContainer}>
          {/* Left Swipe Action (Mark Used) */}
          <Animated.View
            style={[
              styles.leftActionBackground,
              leftActionBackgroundAnimatedStyle,
            ]}
          >
            <View style={styles.leftActionContent}>
              <Animated.View style={leftCheckmarkIconAnimatedStyle}>
                <Ionicons name="checkmark" size={24} color="white" />
              </Animated.View>
              <Animated.Text
                style={[styles.actionLabel, leftActionTextAnimatedStyle]}
              >
                ✓ USED
              </Animated.Text>
            </View>
          </Animated.View>

          {/* Right Swipe Action (Extend Expiry) */}
          <Animated.View
            style={[
              styles.rightActionBackground,
              rightActionBackgroundAnimatedStyle,
            ]}
          >
            <View style={styles.rightActionContent}>
              <Animated.View style={rightExtendIconAnimatedStyle}>
                <Ionicons name="time-outline" size={24} color="white" />
              </Animated.View>
              <Animated.Text
                style={[styles.actionLabel, rightActionTextAnimatedStyle]}
              >
                +3d EXTEND
              </Animated.Text>
            </View>
          </Animated.View>

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
              <Ionicons
                name="checkmark-circle-outline"
                size={24}
                color="white"
              />
              <Text style={styles.actionText}>Used</Text>
            </Animated.View>
          </Animated.View>

          {/* Main Card */}
          <Animated.View
            style={[styles.foregroundCard, foregroundAnimatedStyle]}
          >
            <Animated.View
              style={[
                styles.card,
                {
                  backgroundColor: backgroundColorMap, // Use exact background colors from Figma
                  borderColor: "transparent",
                },
                cardAnimatedStyle,
              ]}
            >
              <View style={styles.cardContent} onTouchEnd={handlePress}>
                {/* Main Content Container */}
                <View style={styles.mainContentContainer}>
                  {/* Top Row: Name and Status */}
                  <View style={styles.topRow}>
                    <View style={styles.leftSection}>
                      <Text
                        style={[styles.itemName, { color: "#000000" }]}
                        numberOfLines={1}
                      >
                        {item.name}
                      </Text>
                    </View>

                    <View style={styles.rightSection}>
                      <Text
                        style={[
                          styles.statusLabel,
                          { backgroundColor: statusColor },
                        ]}
                      >
                        {getStatusText(item.expiry_date || "")}
                      </Text>
                    </View>
                  </View>

                  {/* Bottom Row: Location + Quantity */}
                  <View style={styles.bottomRow}>
                    <View style={styles.locationQuantityContainer}>
                      <Text
                        style={[
                          styles.locationQuantityText,
                          { color: "#666666" },
                        ]}
                      >
                        {item.location === "fridge" ? "Refrigerator" : "Shelf"}{" "}
                        • Qty: {item.quantity}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
            </Animated.View>
          </Animated.View>
        </View>
      </GestureDetector>
    </Animated.View>
  );
}

// =============================================================================
// STYLES
// =============================================================================

const styles = StyleSheet.create({
  rootContainer: {
    position: "relative",
  },
  leftActionBackground: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "#22C55E",
    borderRadius: 12,
    opacity: 0,
  },
  leftActionContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 8,
    flex: 1,
    height: "100%",
    paddingRight: 20,
  },
  rightActionBackground: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "#3B82F6",
    borderRadius: 12,
    opacity: 0,
  },
  rightActionContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
    gap: 8,
    flex: 1,
    height: "100%",
    paddingLeft: 20,
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
    borderRadius: 8,
    borderWidth: 0,
    shadowColor: "transparent",
    shadowOffset: {
      width: 0,
      height: 0,
    },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
    overflow: "hidden",
    minHeight: 68,
    marginBottom: 8,
  },
  cardContent: {
    position: "relative",
    paddingVertical: 12,
    paddingHorizontal: 16,
    paddingLeft: 20,
    minHeight: 68,
    justifyContent: "center",
  },
  foodImage: {
    borderRadius: 8,
    width: 0, // Hide the food image to match Figma design
    height: 0,
  },
  itemName: {
    fontSize: 16,
    fontWeight: "500",
    flex: 1,
  },
  actionContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    flex: 1,
    height: "100%",
  },
  actionLabel: {
    color: "white",
    fontSize: 14,
    fontWeight: "600",
  },
  foregroundCard: {
    zIndex: 1,
  },
  gestureContainer: {
    flex: 1,
  },
  leftBorderIndicator: {
    display: "none", // We'll use full background color instead
  },
  mainContentContainer: {
    flex: 1,
    paddingLeft: 0, // Remove extra padding since we don't have the border indicator
    justifyContent: "space-between",
    paddingVertical: 4,
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  leftSection: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: 0, // No gap since no image
  },
  rightSection: {
    alignItems: "flex-end",
    marginLeft: 12,
  },
  statusLabel: {
    fontSize: 12,
    fontWeight: "600",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
    textAlign: "center",
    color: "white",
    overflow: "hidden",
    textTransform: "uppercase",
  },
  bottomRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  locationQuantityContainer: {
    flex: 1,
  },
  locationQuantityText: {
    fontSize: 14,
    opacity: 0.7,
    fontWeight: "400",
  },
  arrowIndicator: {
    display: "none", // Hide arrow to match Figma design
  },
  arrowText: {
    fontSize: 20,
    fontWeight: "600",
    opacity: 0.3,
  },
});

// Default export for backward compatibility
export default EnhancedSwipeableItemCard;
