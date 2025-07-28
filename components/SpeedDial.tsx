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

  // Animation values for action buttons
  const actionAnims = useRef(
    actions.map(() => ({
      translateY: new Animated.Value(0),
      scale: new Animated.Value(0),
      opacity: new Animated.Value(0),
    }))
  ).current;

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
    setTimeout(() => action.onPress(), 100);
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
        {/* Action Buttons */}
        {actions.map((action, index) => (
          <Animated.View
            key={action.id}
            style={[
              styles.actionButton,
              {
                backgroundColor: action.color,
                transform: [
                  { translateY: actionAnims[index].translateY },
                  { scale: actionAnims[index].scale },
                ],
                opacity: actionAnims[index].opacity,
              },
            ]}
          >
            <Pressable
              style={styles.actionButtonTouchable}
              onPress={() => handleActionPress(action)}
              android_ripple={{
                color: "rgba(255, 255, 255, 0.2)",
                borderless: true,
              }}
            >
              <View style={styles.actionContent}>
                <Ionicons name={action.icon as any} size={24} color="#FFFFFF" />
              </View>
            </Pressable>

            {/* Action Label */}
            <Animated.View
              style={[
                styles.actionLabel,
                {
                  opacity: actionAnims[index].opacity,
                  transform: [{ scale: actionAnims[index].scale }],
                },
              ]}
            >
              <Text style={styles.actionLabelText}>{action.label}</Text>
            </Animated.View>
          </Animated.View>
        ))}

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
    right: ACTION_BUTTON_SIZE + 12,
    backgroundColor: "rgba(0, 0, 0, 0.8)",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    minWidth: 100,
  },
  actionLabelText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "500",
    textAlign: "center",
  },
});

export default SpeedDial;
