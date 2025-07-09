// components/SwipeableItemCard.tsx
import { FoodItemWithUrgency } from "@/services/foodItems";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useRef, useState } from "react";
import {
  Animated,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import {
  PanGestureHandler,
  PanGestureHandlerGestureEvent,
} from "react-native-gesture-handler";

interface SwipeableItemCardProps {
  item: FoodItemWithUrgency;
  onPress: () => void;
  onMarkUsed: () => void;
  onExtendExpiry: () => void;
  cardBackgroundColor: string;
  textColor: string;
  borderColor: string;
}

const SWIPE_THRESHOLD = 80;
const SWIPE_COMPLETE_THRESHOLD = 120;

export default function SwipeableItemCard({
  item,
  onPress,
  onMarkUsed,
  onExtendExpiry,
  cardBackgroundColor,
  textColor,
  borderColor,
}: SwipeableItemCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [swipeAction, setSwipeAction] = useState<"none" | "used" | "extend">(
    "none"
  );

  const translateX = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(1)).current;
  const actionOpacity = useRef(new Animated.Value(0)).current;

  const urgency = item.urgency;

  const triggerHaptic = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  const resetPosition = () => {
    Animated.parallel([
      Animated.spring(translateX, {
        toValue: 0,
        useNativeDriver: true,
      }),
      Animated.spring(scale, {
        toValue: 1,
        useNativeDriver: true,
      }),
      Animated.timing(actionOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
    setSwipeAction("none");
  };

  const executeAction = () => {
    if (swipeAction === "used") {
      onMarkUsed();
    } else if (swipeAction === "extend") {
      onExtendExpiry();
    }
    resetPosition();
  };

  const onGestureEvent = (event: PanGestureHandlerGestureEvent) => {
    const { translationX } = event.nativeEvent;

    // Determine swipe direction and action
    let newAction: "none" | "used" | "extend" = "none";
    let targetTranslateX = translationX;

    if (translationX > SWIPE_THRESHOLD) {
      // Swipe right - Mark as Used
      newAction = "used";
      targetTranslateX = Math.min(translationX, SWIPE_COMPLETE_THRESHOLD * 1.5);
    } else if (translationX < -SWIPE_THRESHOLD) {
      // Swipe left - Extend Expiry
      newAction = "extend";
      targetTranslateX = Math.max(
        translationX,
        -SWIPE_COMPLETE_THRESHOLD * 1.5
      );
    } else {
      targetTranslateX = translationX;
    }

    // Update action state and trigger haptic if changed
    if (newAction !== swipeAction) {
      setSwipeAction(newAction);
      if (newAction !== "none") {
        triggerHaptic();
      }
    }

    // Update animations
    translateX.setValue(targetTranslateX);

    const scaleValue = newAction !== "none" ? 0.95 : 1;
    scale.setValue(scaleValue);

    const opacityValue = newAction !== "none" ? 1 : 0;
    actionOpacity.setValue(opacityValue);
  };

  const onHandlerStateChange = (event: PanGestureHandlerGestureEvent) => {
    const { state, translationX } = event.nativeEvent;

    if (state === 5) {
      // ENDED
      if (
        Math.abs(translationX) > SWIPE_COMPLETE_THRESHOLD &&
        swipeAction !== "none"
      ) {
        // Complete the action
        triggerHaptic();
        executeAction();
      } else {
        // Reset position
        resetPosition();
      }
    }
  };

  const getActionText = () => {
    switch (swipeAction) {
      case "used":
        return "Mark as Used";
      case "extend":
        return "Extend Expiry";
      default:
        return "";
    }
  };

  const getActionIcon = () => {
    switch (swipeAction) {
      case "used":
        return "checkmark-circle";
      case "extend":
        return "time";
      default:
        return "help";
    }
  };

  const getActionColor = () => {
    switch (swipeAction) {
      case "used":
        return "#34C759";
      case "extend":
        return "#FF9500";
      default:
        return textColor;
    }
  };

  return (
    <View style={styles.container}>
      {/* Background Action Indicators */}
      <Animated.View
        style={[
          styles.actionBackground,
          {
            opacity: actionOpacity,
            backgroundColor: getActionColor(),
          },
        ]}
      >
        <View style={styles.actionContent}>
          <Ionicons name={getActionIcon() as any} size={24} color="#FFFFFF" />
          <Text style={styles.actionText}>{getActionText()}</Text>
        </View>
      </Animated.View>

      {/* Main Card */}
      <PanGestureHandler
        onGestureEvent={onGestureEvent}
        onHandlerStateChange={onHandlerStateChange}
        activeOffsetX={[-10, 10]}
      >
        <Animated.View
          style={[
            styles.card,
            {
              backgroundColor: urgency.backgroundColor,
              borderColor: urgency.borderColor,
              borderWidth: 2,
              transform: [{ translateX }, { scale }],
            },
          ]}
        >
          <TouchableOpacity
            style={styles.cardContent}
            onPress={() => setIsExpanded(!isExpanded)}
            activeOpacity={0.7}
          >
            <View style={styles.mainInfo}>
              <View style={styles.nameRow}>
                <Text style={[styles.itemName, { color: urgency.color }]}>
                  {item.name}
                </Text>
                <View
                  style={[
                    styles.urgencyBadge,
                    { backgroundColor: urgency.color },
                  ]}
                >
                  <Text style={styles.urgencyText}>
                    {urgency.level.toUpperCase()}
                  </Text>
                </View>
              </View>

              <Text style={[styles.description, { color: textColor }]}>
                {urgency.description}
              </Text>

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
            </View>

            <View style={styles.rightSection}>
              <Text style={[styles.daysText, { color: urgency.color }]}>
                {urgency.daysUntilExpiry === 0
                  ? "Today"
                  : urgency.daysUntilExpiry < 0
                  ? "Expired"
                  : `${urgency.daysUntilExpiry}d`}
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
            <View style={styles.expandedSection}>
              <View
                style={[styles.separator, { backgroundColor: borderColor }]}
              />

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
          )}

          {/* Swipe Instruction Hint */}
          {!isExpanded && swipeAction === "none" && (
            <View style={styles.swipeHint}>
              <Text style={[styles.swipeHintText, { color: textColor }]}>
                ← Extend • Used →
              </Text>
            </View>
          )}
        </Animated.View>
      </PanGestureHandler>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 12,
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
    fontSize: 14,
    fontWeight: "600",
  },
  card: {
    borderRadius: 12,
    padding: 16,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
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
    textTransform: "capitalize",
  },
  rightSection: {
    alignItems: "center",
    gap: 4,
  },
  daysText: {
    fontSize: 14,
    fontWeight: "bold",
  },
  expandedSection: {
    marginTop: 12,
  },
  separator: {
    height: 1,
    marginBottom: 12,
  },
  expandedRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  expandedText: {
    fontSize: 12,
  },
  actionButtons: {
    flexDirection: "row",
    marginTop: 12,
    gap: 8,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    flex: 1,
    justifyContent: "center",
    gap: 4,
  },
  viewButton: {
    backgroundColor: "#E3F2FD",
  },
  viewButtonText: {
    color: "#007AFF",
    fontSize: 12,
    fontWeight: "500",
  },
  usedButton: {
    backgroundColor: "#E8F5E8",
  },
  usedButtonText: {
    color: "#34C759",
    fontSize: 12,
    fontWeight: "500",
  },
  extendButton: {
    backgroundColor: "#FFF3E0",
  },
  extendButtonText: {
    color: "#FF9500",
    fontSize: 12,
    fontWeight: "500",
  },
  swipeHint: {
    position: "absolute",
    bottom: 4,
    right: 16,
    opacity: 0.4,
  },
  swipeHintText: {
    fontSize: 10,
  },
});
