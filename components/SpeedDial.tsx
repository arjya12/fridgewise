/**
 * Speed Dial Component for Floating Action Button
 * Provides quick access to Manual Entry and Barcode Scanning
 */

import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useRef } from "react";
import {
  Animated,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TouchableWithoutFeedback,
  View,
} from "react-native";

// =============================================================================
// INTERFACES
// =============================================================================

export interface SpeedDialAction {
  id: string;
  label: string;
  icon: string;
  color: string;
  onPress: () => void;
}

export interface SpeedDialProps {
  visible: boolean;
  onClose: () => void;
  actions: SpeedDialAction[];
}

// =============================================================================
// CONSTANTS
// =============================================================================

const ANIMATION_DURATION = 250;
const ACTION_BUTTON_SIZE = 56;
const SPACING = 16;

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function SpeedDial({ visible, onClose, actions }: SpeedDialProps) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const rotationAnim = useRef(new Animated.Value(0)).current;

  // Track actions length to ensure proper reinitialization
  const actionsLengthRef = useRef(actions.length);

  // Animation values for action buttons - recreate when actions change
  const actionAnims = React.useMemo(
    () => {
      actionsLengthRef.current = actions.length;
      // Force creation of exactly 2 animation sets for testing
      return [0, 1].map(() => ({
        translateY: new Animated.Value(0),
        scale: new Animated.Value(0),
        opacity: new Animated.Value(0),
      }));
    },
    [actions.length] // Recreate when number of actions changes
  );

  React.useEffect(() => {
    if (visible) {
      // Trigger haptic feedback
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      // Animate in
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: ANIMATION_DURATION,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          useNativeDriver: true,
          tension: 100,
          friction: 8,
        }),
        Animated.timing(rotationAnim, {
          toValue: 1,
          duration: ANIMATION_DURATION,
          useNativeDriver: true,
        }),
      ]).start();

      // Animate action buttons with stagger
      const buttonAnimations = actionAnims.map((anim, index) =>
        Animated.parallel([
          Animated.timing(anim.translateY, {
            toValue: -(ACTION_BUTTON_SIZE + SPACING) * (index + 1) - 20,
            duration: ANIMATION_DURATION,
            delay: index * 50,
            useNativeDriver: true,
          }),
          Animated.spring(anim.scale, {
            toValue: 1,
            delay: index * 50,
            useNativeDriver: true,
            tension: 150,
            friction: 8,
          }),
          Animated.timing(anim.opacity, {
            toValue: 1,
            duration: 200,
            delay: index * 50,
            useNativeDriver: true,
          }),
        ])
      );

      Animated.parallel(buttonAnimations).start();
    } else {
      // Animate out
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: ANIMATION_DURATION,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 0,
          useNativeDriver: true,
          tension: 150,
          friction: 8,
        }),
        Animated.timing(rotationAnim, {
          toValue: 0,
          duration: ANIMATION_DURATION,
          useNativeDriver: true,
        }),
        ...actionAnims.map((anim) =>
          Animated.parallel([
            Animated.timing(anim.translateY, {
              toValue: 0,
              duration: ANIMATION_DURATION / 2,
              useNativeDriver: true,
            }),
            Animated.timing(anim.scale, {
              toValue: 0,
              duration: ANIMATION_DURATION / 2,
              useNativeDriver: true,
            }),
            Animated.timing(anim.opacity, {
              toValue: 0,
              duration: ANIMATION_DURATION / 2,
              useNativeDriver: true,
            }),
          ])
        ),
      ]).start();
    }
  }, [visible, actionAnims, fadeAnim, rotationAnim, scaleAnim]);

  const handleActionPress = (action: SpeedDialAction) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onClose();
    // Small delay to allow close animation to start
    setTimeout(() => {
      action.onPress();
    }, 100);
  };

  const handleBackdropPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onClose();
  };

  if (!visible) {
    return null;
  }

  const rotation = rotationAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "45deg"],
  });

  return (
    <Modal transparent visible={visible} animationType="none">
      {/* Backdrop */}
      <TouchableWithoutFeedback onPress={handleBackdropPress}>
        <Animated.View
          style={[
            styles.backdrop,
            {
              opacity: fadeAnim,
            },
          ]}
        />
      </TouchableWithoutFeedback>

      {/* Speed Dial Container */}
      <View style={styles.container} pointerEvents="box-none">
        {/* Action Buttons - Test with hardcoded buttons */}

        {/* First Button - Manual Entry (index 0) */}
        <Animated.View
          style={[
            styles.actionButton,
            {
              backgroundColor: "#3B82F6",
              marginBottom: 0, // Remove default marginBottom for proper positioning
              transform: [
                { translateY: -30 }, // Static position for first button
                { scale: 1 },
              ],
              opacity: 1,
            },
          ]}
        >
          <Pressable
            style={styles.actionButtonTouchable}
            onPress={() =>
              handleActionPress(
                actions[0] || {
                  id: "manual",
                  label: "Manual Entry",
                  icon: "create-outline",
                  color: "#3B82F6",
                  onPress: () => {},
                }
              )
            }
            android_ripple={{
              color: "rgba(255, 255, 255, 0.2)",
              borderless: true,
            }}
          >
            <View style={styles.actionContent}>
              <Ionicons name="create-outline" size={24} color="#FFFFFF" />
            </View>
          </Pressable>
          <Animated.View
            style={[
              styles.actionLabel,
              {
                opacity: 1,
                transform: [{ scale: 1 }],
              },
            ]}
          >
            <Text style={styles.actionLabelText}>Manual Entry</Text>
          </Animated.View>
        </Animated.View>

        {/* Second Button - Scan Barcode (index 1) */}
        <Animated.View
          style={[
            styles.actionButton,
            {
              backgroundColor: "#8B5CF6",
              marginBottom: 0, // Remove default marginBottom for proper positioning
              transform: [
                { translateY: -160 }, // Static position for second button (higher up)
                { scale: 1 },
              ],
              opacity: 1,
            },
          ]}
        >
          <Pressable
            style={styles.actionButtonTouchable}
            onPress={() =>
              handleActionPress(
                actions[1] || {
                  id: "scan",
                  label: "Scan Barcode",
                  icon: "qr-code-outline",
                  color: "#8B5CF6",
                  onPress: () => {},
                }
              )
            }
            android_ripple={{
              color: "rgba(255, 255, 255, 0.2)",
              borderless: true,
            }}
          >
            <View style={styles.actionContent}>
              <Ionicons name="qr-code-outline" size={24} color="#FFFFFF" />
            </View>
          </Pressable>
          <Animated.View
            style={[
              styles.actionLabel,
              {
                opacity: actionAnims[1]?.opacity || new Animated.Value(1),
                transform: [
                  { scale: actionAnims[1]?.scale || new Animated.Value(1) },
                ],
              },
            ]}
          >
            <Text style={styles.actionLabelText}>Scan Barcode</Text>
          </Animated.View>
        </Animated.View>

        {/* Main FAB */}
        <Animated.View
          style={[
            styles.fab,
            {
              transform: [{ scale: scaleAnim }, { rotate: rotation }],
            },
          ]}
        >
          <Pressable
            style={styles.fabTouchable}
            onPress={handleBackdropPress}
            android_ripple={{
              color: "rgba(255, 255, 255, 0.2)",
              borderless: true,
            }}
          >
            <Ionicons name="close" size={24} color="#FFFFFF" />
          </Pressable>
        </Animated.View>
      </View>
    </Modal>
  );
}

// =============================================================================
// STYLES
// =============================================================================

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  container: {
    position: "absolute",
    bottom: 90, // Position above tab bar
    right: 20,
    alignItems: "center",
  },
  fab: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#22C55E",
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
  },
  fabTouchable: {
    width: "100%",
    height: "100%",
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
  },
  actionButton: {
    width: ACTION_BUTTON_SIZE,
    height: ACTION_BUTTON_SIZE,
    borderRadius: ACTION_BUTTON_SIZE / 2,
    elevation: 6,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.27,
    shadowRadius: 4.65,
    marginBottom: SPACING,
    flexDirection: "row",
    alignItems: "center",
  },
  actionButtonTouchable: {
    width: ACTION_BUTTON_SIZE,
    height: ACTION_BUTTON_SIZE,
    borderRadius: ACTION_BUTTON_SIZE / 2,
    justifyContent: "center",
    alignItems: "center",
  },
  actionContent: {
    justifyContent: "center",
    alignItems: "center",
  },
  actionLabel: {
    position: "absolute",
    left: -(100 + 12), // Position to the left instead of right
    backgroundColor: "rgba(0, 0, 0, 0.8)",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    minWidth: 100,
    // Center vertically with the action button
    top: (ACTION_BUTTON_SIZE - 40) / 2, // Approximate centering
  },
  actionLabelText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "500",
    textAlign: "center",
  },
});

export default SpeedDial;
