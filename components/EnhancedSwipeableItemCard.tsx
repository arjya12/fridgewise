// Enhanced Swipeable Item Card - Phase 2 Implementation
// Implements advanced gesture recognition, progressive feedback, and accessibility

import { useThemeColor } from "@/hooks/useThemeColor";
import { FoodItem } from "@/lib/supabase";
import { calculateEnhancedUrgency } from "@/utils/urgencyUtils";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useCallback, useMemo, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ViewStyle,
} from "react-native";
import {
  PanGestureHandler,
  PanGestureHandlerGestureEvent,
  State,
} from "react-native-gesture-handler";

// =============================================================================
// PHASE 2 GESTURE SPECIFICATIONS
// =============================================================================

const GESTURE_CONFIG = {
  // Phase 2 thresholds
  RECOGNITION_THRESHOLD: 20, // Minimum movement to recognize gesture
  ACTION_THRESHOLD: 120, // Point where action becomes available
  EXECUTION_THRESHOLD: 200, // Point where action auto-executes
  MAX_TRANSLATION: 280, // Maximum allowed translation

  // Animation timings (Phase 2 specifications)
  FEEDBACK_DURATION: 150, // Quick visual feedback
  RESET_DURATION: 300, // Smooth reset animation
  HAPTIC_DELAY: 50, // Delay between haptic feedbacks

  // Visual feedback progression
  SCALE_REDUCTION: 0.95, // Card scaling during gesture
  SHADOW_EXPANSION: 1.5, // Shadow expansion multiplier
  BORDER_EXPANSION: 2, // Border width increase
};

// =============================================================================
// INTERFACES
// =============================================================================

interface EnhancedSwipeableItemCardProps {
  item: FoodItem;
  onPress: () => void;
  onMarkUsed: () => void;
  onExtendExpiry: () => void;
  compactMode?: boolean;
  accessibilityEnabled?: boolean;
  gesturesEnabled?: boolean;
  onSwipeStart?: () => void;
  onSwipeEnd?: () => void;
}

interface SwipeState {
  action: "none" | "markUsed" | "extendExpiry";
  phase: "idle" | "recognition" | "available" | "committed";
  direction: "left" | "right" | "none";
  intensity: number; // 0-1 scale of gesture intensity
}

interface FoodItemWithUrgency extends FoodItem {
  urgency: ReturnType<typeof calculateEnhancedUrgency>;
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

const EnhancedSwipeableItemCard: React.FC<EnhancedSwipeableItemCardProps> = ({
  item,
  onPress,
  onMarkUsed,
  onExtendExpiry,
  compactMode = false,
  accessibilityEnabled = true,
  gesturesEnabled = true,
  onSwipeStart,
  onSwipeEnd,
}) => {
  const screenWidth = Dimensions.get("window").width;

  // Theme colors
  const textColor = useThemeColor(
    { light: "#11181C", dark: "#ECEDEE" },
    "text"
  );
  const borderColor = useThemeColor(
    { light: "#E5E7EB", dark: "#3C3C3E" },
    "border"
  );

  // Calculate urgency information
  const itemWithUrgency = useMemo(
    (): FoodItemWithUrgency => ({
      ...item,
      urgency: calculateEnhancedUrgency(item.expiry_date!),
    }),
    [item]
  );

  // State management
  const [isExpanded, setIsExpanded] = useState(false);
  const [swipeState, setSwipeState] = useState<SwipeState>({
    action: "none",
    phase: "idle",
    direction: "none",
    intensity: 0,
  });
  const [lastHapticTime, setLastHapticTime] = useState(0);

  // Animation values
  const translateX = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(1)).current;
  const actionOpacity = useRef(new Animated.Value(0)).current;
  const borderWidth = useRef(new Animated.Value(2)).current;
  const shadowOpacity = useRef(new Animated.Value(0.1)).current;

  // Progressive haptic feedback with Phase 2 timing
  const triggerHaptic = useCallback(
    (type: "light" | "medium" | "success", force = false) => {
      if (Platform.OS !== "ios") return;

      const now = Date.now();
      if (!force && now - lastHapticTime < GESTURE_CONFIG.HAPTIC_DELAY) return;

      setLastHapticTime(now);

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
    },
    [lastHapticTime]
  );

  // Enhanced gesture event handler with Phase 2 specifications
  const onGestureEvent = useCallback(
    (event: PanGestureHandlerGestureEvent) => {
      const { translationX, velocityX } = event.nativeEvent;

      // Calculate gesture metrics
      const absTranslation = Math.abs(translationX);
      const direction = translationX > 0 ? "right" : "left";
      const intensity = Math.min(
        absTranslation / GESTURE_CONFIG.ACTION_THRESHOLD,
        1
      );

      // Determine action based on direction
      const action = direction === "right" ? "markUsed" : "extendExpiry";

      // Determine gesture phase
      let phase: SwipeState["phase"] = "idle";
      if (absTranslation >= GESTURE_CONFIG.RECOGNITION_THRESHOLD) {
        phase = "recognition";
        if (absTranslation >= GESTURE_CONFIG.ACTION_THRESHOLD) {
          phase = "available";
          if (absTranslation >= GESTURE_CONFIG.EXECUTION_THRESHOLD) {
            phase = "committed";
          }
        }
      }

      // Update swipe state
      const newState: SwipeState = {
        action: phase === "idle" ? "none" : action,
        phase,
        direction: phase === "idle" ? "none" : direction,
        intensity,
      };

      // Trigger haptic feedback for phase transitions
      if (newState.phase !== swipeState.phase) {
        if (newState.phase === "recognition") {
          triggerHaptic("light");
        } else if (newState.phase === "available") {
          triggerHaptic("medium");
        } else if (newState.phase === "committed") {
          triggerHaptic("success", true);
        }
      }

      setSwipeState(newState);

      // Update animations with Phase 2 progressive feedback
      const constrainedTranslation =
        Math.sign(translationX) *
        Math.min(absTranslation, GESTURE_CONFIG.MAX_TRANSLATION);

      translateX.setValue(constrainedTranslation);

      // Progressive visual feedback
      const scaleValue =
        phase === "idle"
          ? 1
          : 1 - (intensity * 0.05 + (phase === "committed" ? 0.05 : 0));
      scale.setValue(scaleValue);

      const opacityValue =
        phase === "idle" ? 0 : Math.min(0.2 + intensity * 0.8, 1);
      actionOpacity.setValue(opacityValue);

      const borderValue =
        phase === "idle" ? 2 : 2 + intensity * GESTURE_CONFIG.BORDER_EXPANSION;
      borderWidth.setValue(borderValue);

      const shadowValue = phase === "idle" ? 0.1 : 0.1 + intensity * 0.2;
      shadowOpacity.setValue(shadowValue);
    },
    [
      swipeState.phase,
      triggerHaptic,
      translateX,
      scale,
      actionOpacity,
      borderWidth,
      shadowOpacity,
    ]
  );

  // Enhanced gesture state change handler
  const onHandlerStateChange = useCallback(
    (event: PanGestureHandlerGestureEvent) => {
      const { state, translationX } = event.nativeEvent;

      if (state === State.BEGAN) {
        onSwipeStart?.();
      }

      if (state === State.END || state === State.CANCELLED) {
        const absTranslation = Math.abs(translationX);

        if (
          absTranslation >= GESTURE_CONFIG.EXECUTION_THRESHOLD &&
          swipeState.action !== "none"
        ) {
          // Execute action
          triggerHaptic("success", true);

          if (swipeState.action === "markUsed") {
            onMarkUsed();
          } else if (swipeState.action === "extendExpiry") {
            onExtendExpiry();
          }
        }

        // Reset to idle state
        resetToIdle();
        onSwipeEnd?.();
      }
    },
    [
      swipeState.action,
      triggerHaptic,
      onMarkUsed,
      onExtendExpiry,
      onSwipeStart,
      onSwipeEnd,
    ]
  );

  // Reset animation and state
  const resetToIdle = useCallback(() => {
    Animated.parallel([
      Animated.spring(translateX, {
        toValue: 0,
        tension: 100,
        friction: 8,
        useNativeDriver: true,
      }),
      Animated.spring(scale, {
        toValue: 1,
        tension: 100,
        friction: 8,
        useNativeDriver: true,
      }),
      Animated.timing(actionOpacity, {
        toValue: 0,
        duration: GESTURE_CONFIG.RESET_DURATION,
        useNativeDriver: true,
      }),
      Animated.timing(borderWidth, {
        toValue: 2,
        duration: GESTURE_CONFIG.RESET_DURATION,
        useNativeDriver: false,
      }),
      Animated.timing(shadowOpacity, {
        toValue: 0.1,
        duration: GESTURE_CONFIG.RESET_DURATION,
        useNativeDriver: false,
      }),
    ]).start();

    setSwipeState({
      action: "none",
      phase: "idle",
      direction: "none",
      intensity: 0,
    });
  }, [translateX, scale, actionOpacity, borderWidth, shadowOpacity]);

  // Action visual configuration
  const getActionConfig = useCallback(() => {
    switch (swipeState.action) {
      case "markUsed":
        return {
          backgroundColor: "#34C759",
          icon: "checkmark-circle" as const,
          text: "Mark as Used",
          description: "Remove from inventory",
        };
      case "extendExpiry":
        return {
          backgroundColor: "#FF9500",
          icon: "time" as const,
          text: "Extend Expiry",
          description: "Add more time",
        };
      default:
        return {
          backgroundColor: textColor,
          icon: "help" as const,
          text: "",
          description: "",
        };
    }
  }, [swipeState.action, textColor]);

  const actionConfig = getActionConfig();

  // Dynamic styles
  const cardStyle = useMemo(
    (): Animated.WithAnimatedObject<ViewStyle> => ({
      backgroundColor: itemWithUrgency.urgency.backgroundColor,
      borderColor: itemWithUrgency.urgency.borderColor,
      borderWidth: borderWidth,
      transform: [{ translateX }, { scale }],
      shadowOpacity: shadowOpacity,
    }),
    [itemWithUrgency.urgency, borderWidth, translateX, scale, shadowOpacity]
  );

  const actionBackgroundStyle = useMemo(
    (): Animated.WithAnimatedObject<ViewStyle> => ({
      opacity: actionOpacity,
      backgroundColor: actionConfig.backgroundColor,
    }),
    [actionOpacity, actionConfig.backgroundColor]
  );

  // Accessibility features
  const accessibilityLabel = useMemo(() => {
    if (!accessibilityEnabled) return undefined;

    return (
      `${item.name}, ${itemWithUrgency.urgency.description}, ${item.location}. ` +
      `Double-tap to expand, or swipe right to mark used, swipe left to extend expiry.`
    );
  }, [
    accessibilityEnabled,
    item.name,
    itemWithUrgency.urgency.description,
    item.location,
  ]);

  return (
    <View style={styles.container}>
      {/* Background Action Indicator */}
      <Animated.View style={[styles.actionBackground, actionBackgroundStyle]}>
        <View style={styles.actionContent}>
          <Ionicons name={actionConfig.icon} size={28} color="#FFFFFF" />
          <Text style={styles.actionText}>{actionConfig.text}</Text>
          <Text style={styles.actionDescription}>
            {actionConfig.description}
          </Text>

          {/* Progress indicator */}
          <View style={styles.progressContainer}>
            <View
              style={[
                styles.progressBar,
                { width: `${swipeState.intensity * 100}%` },
              ]}
            />
          </View>
        </View>
      </Animated.View>

      {/* Main Card */}
      <PanGestureHandler
        enabled={gesturesEnabled}
        onGestureEvent={onGestureEvent}
        onHandlerStateChange={onHandlerStateChange}
        activeOffsetX={[
          -GESTURE_CONFIG.RECOGNITION_THRESHOLD,
          GESTURE_CONFIG.RECOGNITION_THRESHOLD,
        ]}
        failOffsetY={[-20, 20]}
      >
        <Animated.View
          style={[styles.card, cardStyle]}
          accessible={accessibilityEnabled}
          accessibilityLabel={accessibilityLabel}
          accessibilityRole="button"
          accessibilityActions={[
            { name: "activate", label: "View details" },
            { name: "markUsed", label: "Mark as used" },
            { name: "extendExpiry", label: "Extend expiry date" },
          ]}
          onAccessibilityAction={(event) => {
            switch (event.nativeEvent.actionName) {
              case "activate":
                onPress();
                break;
              case "markUsed":
                onMarkUsed();
                break;
              case "extendExpiry":
                onExtendExpiry();
                break;
            }
          }}
        >
          <TouchableOpacity
            style={styles.cardContent}
            onPress={() => setIsExpanded(!isExpanded)}
            activeOpacity={0.7}
          >
            <View style={styles.mainInfo}>
              <View style={styles.nameRow}>
                <Text
                  style={[
                    styles.itemName,
                    { color: itemWithUrgency.urgency.color },
                  ]}
                >
                  {item.name}
                </Text>
                <View
                  style={[
                    styles.urgencyBadge,
                    { backgroundColor: itemWithUrgency.urgency.color },
                  ]}
                >
                  <Text style={styles.urgencyText}>
                    {itemWithUrgency.urgency.level.toUpperCase()}
                  </Text>
                </View>
              </View>

              <Text style={[styles.description, { color: textColor }]}>
                {itemWithUrgency.urgency.description}
              </Text>

              {!compactMode && (
                <View style={styles.detailsRow}>
                  <Text style={[styles.details, { color: textColor }]}>
                    {item.quantity} {item.unit}
                  </Text>
                  <View style={styles.locationBadge}>
                    <Ionicons
                      name={item.location === "fridge" ? "snow" : "home"}
                      size={12}
                      color={textColor}
                    />
                    <Text style={[styles.locationText, { color: textColor }]}>
                      {item.location}
                    </Text>
                  </View>
                </View>
              )}
            </View>

            <View style={styles.rightSection}>
              <Text
                style={[
                  styles.daysText,
                  { color: itemWithUrgency.urgency.color },
                ]}
              >
                {itemWithUrgency.urgency.description.includes("today")
                  ? "Today"
                  : itemWithUrgency.urgency.description.includes("Expired")
                  ? "Expired"
                  : `${Math.abs(getDaysUntilExpiry(item.expiry_date!))}d`}
              </Text>
              <Ionicons
                name={isExpanded ? "chevron-up" : "chevron-down"}
                size={20}
                color={textColor}
              />
            </View>
          </TouchableOpacity>

          {/* Expanded Section */}
          {isExpanded && (
            <ExpandedSection
              item={item}
              onPress={onPress}
              onMarkUsed={onMarkUsed}
              onExtendExpiry={onExtendExpiry}
              textColor={textColor}
              borderColor={borderColor}
            />
          )}

          {/* Swipe Instruction Hint */}
          {!isExpanded && swipeState.phase === "idle" && gesturesEnabled && (
            <View style={styles.swipeHint}>
              <Text style={[styles.swipeHintText, { color: textColor }]}>
                ← Extend • Used →
              </Text>
            </View>
          )}

          {/* Gesture State Indicator */}
          {swipeState.phase !== "idle" && (
            <View style={styles.gestureIndicator}>
              <Text style={[styles.gestureText, { color: "#FFFFFF" }]}>
                {swipeState.phase === "recognition" && "Recognized"}
                {swipeState.phase === "available" && "Release to Action"}
                {swipeState.phase === "committed" && "Executing..."}
              </Text>
            </View>
          )}
        </Animated.View>
      </PanGestureHandler>
    </View>
  );
};

// =============================================================================
// EXPANDED SECTION COMPONENT
// =============================================================================

interface ExpandedSectionProps {
  item: FoodItem;
  onPress: () => void;
  onMarkUsed: () => void;
  onExtendExpiry: () => void;
  textColor: string;
  borderColor: string;
}

const ExpandedSection: React.FC<ExpandedSectionProps> = ({
  item,
  onPress,
  onMarkUsed,
  onExtendExpiry,
  textColor,
  borderColor,
}) => (
  <View style={styles.expandedSection}>
    <View style={[styles.separator, { backgroundColor: borderColor }]} />

    {item.category && (
      <View style={styles.expandedRow}>
        <Ionicons name="pricetag" size={16} color={textColor} />
        <Text style={[styles.expandedText, { color: textColor }]}>
          {item.category}
        </Text>
      </View>
    )}

    <View style={styles.expandedRow}>
      <Ionicons name="calendar" size={16} color={textColor} />
      <Text style={[styles.expandedText, { color: textColor }]}>
        Added {new Date(item.created_at).toLocaleDateString()}
      </Text>
    </View>

    {item.expiry_date && (
      <View style={styles.expandedRow}>
        <Ionicons name="alarm" size={16} color={textColor} />
        <Text style={[styles.expandedText, { color: textColor }]}>
          Expires {new Date(item.expiry_date).toLocaleDateString()}
        </Text>
      </View>
    )}

    {/* Action Buttons */}
    <View style={styles.actionButtons}>
      <TouchableOpacity
        style={[styles.actionButton, styles.viewButton]}
        onPress={onPress}
      >
        <Ionicons name="eye" size={16} color="#007AFF" />
        <Text style={styles.viewButtonText}>View Details</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.actionButton, styles.usedButton]}
        onPress={onMarkUsed}
      >
        <Ionicons name="checkmark" size={16} color="#34C759" />
        <Text style={styles.usedButtonText}>Mark Used</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.actionButton, styles.extendButton]}
        onPress={onExtendExpiry}
      >
        <Ionicons name="time" size={16} color="#FF9500" />
        <Text style={styles.extendButtonText}>Extend</Text>
      </TouchableOpacity>
    </View>
  </View>
);

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

function getDaysUntilExpiry(expiryDate: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const expiry = new Date(expiryDate);
  expiry.setHours(0, 0, 0, 0);

  const diffTime = expiry.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

// =============================================================================
// STYLES
// =============================================================================

const styles = StyleSheet.create({
  container: {
    marginBottom: 12,
    position: "relative",
  },
  actionBackground: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 0,
  },
  actionContent: {
    alignItems: "center",
    gap: 4,
  },
  actionText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
  actionDescription: {
    color: "#FFFFFF",
    fontSize: 12,
    opacity: 0.9,
  },
  progressContainer: {
    width: 60,
    height: 4,
    backgroundColor: "rgba(255,255,255,0.3)",
    borderRadius: 2,
    marginTop: 4,
  },
  progressBar: {
    height: "100%",
    backgroundColor: "#FFFFFF",
    borderRadius: 2,
  },
  card: {
    borderRadius: 12,
    padding: 16,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    zIndex: 1,
  },
  cardContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  mainInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  itemName: {
    fontSize: 16,
    fontWeight: "600",
    flex: 1,
  },
  urgencyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    marginLeft: 8,
  },
  urgencyText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "bold",
  },
  description: {
    fontSize: 14,
    marginBottom: 6,
    opacity: 0.8,
  },
  detailsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  details: {
    fontSize: 12,
    opacity: 0.7,
  },
  locationBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    backgroundColor: "rgba(0,0,0,0.05)",
  },
  locationText: {
    fontSize: 11,
    fontWeight: "500",
  },
  rightSection: {
    alignItems: "center",
    gap: 4,
  },
  daysText: {
    fontSize: 14,
    fontWeight: "700",
  },
  expandedSection: {
    marginTop: 12,
    gap: 8,
  },
  separator: {
    height: 1,
    marginBottom: 4,
  },
  expandedRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  expandedText: {
    fontSize: 13,
    opacity: 0.8,
  },
  actionButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 12,
    gap: 8,
  },
  actionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    gap: 4,
  },
  viewButton: {
    backgroundColor: "rgba(0, 122, 255, 0.1)",
  },
  usedButton: {
    backgroundColor: "rgba(52, 199, 89, 0.1)",
  },
  extendButton: {
    backgroundColor: "rgba(255, 149, 0, 0.1)",
  },
  viewButtonText: {
    color: "#007AFF",
    fontSize: 12,
    fontWeight: "600",
  },
  usedButtonText: {
    color: "#34C759",
    fontSize: 12,
    fontWeight: "600",
  },
  extendButtonText: {
    color: "#FF9500",
    fontSize: 12,
    fontWeight: "600",
  },
  swipeHint: {
    position: "absolute",
    bottom: 4,
    right: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    backgroundColor: "rgba(0,0,0,0.05)",
  },
  swipeHintText: {
    fontSize: 10,
    opacity: 0.6,
    fontStyle: "italic",
  },
  gestureIndicator: {
    position: "absolute",
    top: 8,
    right: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: "rgba(0,0,0,0.7)",
    borderRadius: 12,
  },
  gestureText: {
    fontSize: 10,
    fontWeight: "600",
  },
});

export default EnhancedSwipeableItemCard;
