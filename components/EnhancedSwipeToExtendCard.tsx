/**
 * Enhanced Swipe to Extend Card
 * Provides smooth right swipe gesture to trigger ExtendExpiryModal
 * Features progressive visual feedback, haptic responses, and seamless animations
 */

import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  PanResponder,
  StyleSheet,
  View,
  ViewStyle,
} from "react-native";
import { FoodItem } from "../lib/supabase";
import { convertToCardFormat } from "../utils/foodIconMapping";
import { FoodItemCard } from "./FoodItemCard";

// =============================================================================
// INTERFACES
// =============================================================================

export interface EnhancedSwipeToExtendCardProps {
  item: FoodItem;
  onPress?: (item: FoodItem) => void;
  onExtendExpiry: (item: FoodItem) => void;
  style?: ViewStyle | ViewStyle[];
  disabled?: boolean;
}

// =============================================================================
// CONSTANTS
// =============================================================================

const SCREEN_WIDTH = Dimensions.get("window").width;
const SWIPE_THRESHOLD = 60; // Minimum swipe to show hint
const ACTIVATION_THRESHOLD = 120; // Threshold to trigger action
const MAX_SWIPE_DISTANCE = 180; // Maximum swipe distance

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function EnhancedSwipeToExtendCard({
  item,
  onPress,
  onExtendExpiry,
  style,
  disabled = false,
}: EnhancedSwipeToExtendCardProps) {
  // Animation values
  const translateX = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(1)).current;
  const actionOpacity = useRef(new Animated.Value(0)).current;
  const actionScale = useRef(new Animated.Value(0.8)).current;

  // State
  const [isGestureActive, setIsGestureActive] = useState(false);
  const [swipeState, setSwipeState] = useState<
    "idle" | "hint" | "ready" | "triggered"
  >("idle");
  const [currentTranslationX, setCurrentTranslationX] = useState(0);

  // Haptic feedback tracking
  const lastHapticState = useRef<string>("idle");

  // =============================================================================
  // GESTURE HANDLING
  // =============================================================================

  const triggerHaptic = (type: "light" | "medium" | "success") => {
    if (disabled) return;

    switch (type) {
      case "light":
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        break;
      case "medium":
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        break;
      case "success":
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        break;
    }
  };

  const updateSwipeState = (translationX: number) => {
    let newState: typeof swipeState = "idle";

    if (translationX >= ACTIVATION_THRESHOLD) {
      newState = "triggered";
    } else if (translationX >= SWIPE_THRESHOLD) {
      newState = "ready";
    } else if (translationX > 20) {
      newState = "hint";
    }

    // Trigger haptics on state changes
    if (newState !== swipeState) {
      if (newState === "hint" && lastHapticState.current !== "hint") {
        triggerHaptic("light");
        lastHapticState.current = "hint";
      } else if (newState === "ready" && lastHapticState.current !== "ready") {
        triggerHaptic("medium");
        lastHapticState.current = "ready";
      }
    }

    setSwipeState(newState);
  };

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) => {
        // Only respond to horizontal swipes to the right
        return (
          !disabled &&
          Math.abs(gestureState.dx) > Math.abs(gestureState.dy) &&
          gestureState.dx > 10
        );
      },

      onPanResponderGrant: () => {
        setIsGestureActive(true);
        lastHapticState.current = "idle";
      },

      onPanResponderMove: (_, gestureState) => {
        if (disabled) return;

        const translationX = Math.max(
          0,
          Math.min(gestureState.dx, MAX_SWIPE_DISTANCE)
        );

        // Update current translation state
        setCurrentTranslationX(translationX);

        // Update animations
        translateX.setValue(translationX);

        // Progressive scaling
        const scaleValue = 1 - (translationX / MAX_SWIPE_DISTANCE) * 0.05;
        scale.setValue(scaleValue);

        // Action opacity and scale
        const opacityValue = Math.min(translationX / SWIPE_THRESHOLD, 1);
        actionOpacity.setValue(opacityValue);

        const actionScaleValue = 0.8 + opacityValue * 0.2;
        actionScale.setValue(actionScaleValue);

        // Update swipe state
        updateSwipeState(translationX);
      },

      onPanResponderRelease: (_, gestureState) => {
        if (disabled) return;

        const translationX = gestureState.dx;

        if (translationX >= ACTIVATION_THRESHOLD) {
          // Trigger extend expiry
          triggerHaptic("success");

          // Animate to completion
          Animated.parallel([
            Animated.spring(translateX, {
              toValue: MAX_SWIPE_DISTANCE,
              useNativeDriver: true,
              tension: 100,
              friction: 8,
            }),
            Animated.spring(actionScale, {
              toValue: 1.1,
              useNativeDriver: true,
              tension: 150,
              friction: 8,
            }),
          ]).start(() => {
            // Reset after action
            resetPosition();
            onExtendExpiry(item);
          });
        } else {
          // Reset to original position
          resetPosition();
        }

        setIsGestureActive(false);
        setSwipeState("idle");
        lastHapticState.current = "idle";
      },

      onPanResponderTerminate: () => {
        resetPosition();
        setIsGestureActive(false);
        setSwipeState("idle");
        lastHapticState.current = "idle";
      },
    })
  ).current;

  const resetPosition = () => {
    setCurrentTranslationX(0);
    Animated.parallel([
      Animated.spring(translateX, {
        toValue: 0,
        useNativeDriver: true,
        tension: 150,
        friction: 10,
      }),
      Animated.spring(scale, {
        toValue: 1,
        useNativeDriver: true,
        tension: 150,
        friction: 10,
      }),
      Animated.timing(actionOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.spring(actionScale, {
        toValue: 0.8,
        useNativeDriver: true,
        tension: 150,
        friction: 10,
      }),
    ]).start();
  };

  // =============================================================================
  // RENDER HELPERS
  // =============================================================================

  const getActionText = () => {
    switch (swipeState) {
      case "hint":
        return "→ Swipe to extend";
      case "ready":
        return "→ Release to extend";
      case "triggered":
        return "✓ Extending expiry";
      default:
        return "→ +3d";
    }
  };

  const getActionColor = () => {
    switch (swipeState) {
      case "triggered":
        return "#10B981"; // Green
      case "ready":
        return "#3B82F6"; // Blue
      default:
        return "#6B7280"; // Gray
    }
  };

  // Convert item to card format
  const cardItem = convertToCardFormat(item);

  // =============================================================================
  // RENDER
  // =============================================================================

  return (
    <View style={[styles.container, style]}>
      {/* Background Action */}
      <Animated.View
        style={[styles.actionBackground, { opacity: actionOpacity }]}
      >
        <View style={styles.actionContent}>
          <Animated.View
            style={[
              styles.actionIcon,
              {
                transform: [{ scale: actionScale }],
                backgroundColor: getActionColor(),
              },
            ]}
          >
            <Ionicons
              name={swipeState === "triggered" ? "checkmark" : "time-outline"}
              size={20}
              color="#FFFFFF"
            />
          </Animated.View>
          <Animated.Text
            style={[
              styles.actionText,
              {
                color: getActionColor(),
                transform: [{ scale: actionScale }],
              },
            ]}
          >
            {getActionText()}
          </Animated.Text>
        </View>
      </Animated.View>

      {/* Main Card */}
      <Animated.View
        style={[
          styles.cardContainer,
          {
            transform: [{ translateX }, { scale }],
          },
        ]}
        {...panResponder.panHandlers}
      >
        <FoodItemCard
          item={cardItem}
          onPress={onPress ? () => onPress(item) : undefined}
          style={styles.card}
        />
      </Animated.View>

      {/* Swipe Hint Indicator */}
      {swipeState !== "idle" && (
        <View style={styles.swipeIndicator}>
          <View
            style={[
              styles.swipeProgress,
              {
                backgroundColor: getActionColor(),
                width: `${Math.min(
                  (currentTranslationX / ACTIVATION_THRESHOLD) * 100,
                  100
                )}%`,
              },
            ]}
          />
        </View>
      )}
    </View>
  );
}

// =============================================================================
// STYLES
// =============================================================================

const styles = StyleSheet.create({
  container: {
    position: "relative",
    marginVertical: 4,
  },
  actionBackground: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "#F0F9FF",
    borderRadius: 12,
    justifyContent: "center",
    paddingLeft: 20,
    zIndex: 1,
  },
  actionContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  actionIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  actionText: {
    fontSize: 16,
    fontWeight: "600",
  },
  cardContainer: {
    zIndex: 2,
    backgroundColor: "transparent",
  },
  card: {
    marginHorizontal: 0,
    marginVertical: 0,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  swipeIndicator: {
    position: "absolute",
    bottom: 0,
    left: 16,
    right: 16,
    height: 3,
    backgroundColor: "#E5E7EB",
    borderRadius: 1.5,
    overflow: "hidden",
    zIndex: 3,
  },
  swipeProgress: {
    height: "100%",
    borderRadius: 1.5,
  },
});

export default EnhancedSwipeToExtendCard;
