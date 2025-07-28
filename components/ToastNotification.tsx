import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useEffect, useRef } from "react";
import { Animated, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// =============================================================================
// INTERFACES
// =============================================================================

export interface ToastProps {
  visible: boolean;
  message: string;
  type: "success" | "error" | "warning" | "info";
  duration?: number;
  onHide: () => void;
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function ToastNotification({
  visible,
  message,
  type = "success",
  duration = 3000,
  onHide,
}: ToastProps) {
  const translateY = useRef(new Animated.Value(-100)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const insets = useSafeAreaInsets();

  const getToastConfig = () => {
    switch (type) {
      case "success":
        return {
          backgroundColor: "#10B981",
          icon: "checkmark-circle" as keyof typeof Ionicons.glyphMap,
          iconColor: "#FFFFFF",
          textColor: "#FFFFFF",
        };
      case "error":
        return {
          backgroundColor: "#EF4444",
          icon: "close-circle" as keyof typeof Ionicons.glyphMap,
          iconColor: "#FFFFFF",
          textColor: "#FFFFFF",
        };
      case "warning":
        return {
          backgroundColor: "#F59E0B",
          icon: "warning" as keyof typeof Ionicons.glyphMap,
          iconColor: "#FFFFFF",
          textColor: "#FFFFFF",
        };
      case "info":
        return {
          backgroundColor: "#3B82F6",
          icon: "information-circle" as keyof typeof Ionicons.glyphMap,
          iconColor: "#FFFFFF",
          textColor: "#FFFFFF",
        };
      default:
        return {
          backgroundColor: "#10B981",
          icon: "checkmark-circle" as keyof typeof Ionicons.glyphMap,
          iconColor: "#FFFFFF",
          textColor: "#FFFFFF",
        };
    }
  };

  const config = getToastConfig();

  useEffect(() => {
    if (visible) {
      // Trigger haptic feedback
      if (type === "success") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else if (type === "error") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      } else {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }

      // Show animation
      Animated.parallel([
        Animated.spring(translateY, {
          toValue: 0,
          useNativeDriver: true,
          tension: 100,
          friction: 8,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();

      // Auto hide after duration
      const timer = setTimeout(() => {
        hideToast();
      }, duration);

      return () => clearTimeout(timer);
    } else {
      hideToast();
    }
  }, [visible]);

  const hideToast = () => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: -100,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onHide();
    });
  };

  if (!visible) {
    return null;
  }

  return (
    <Animated.View
      style={[
        styles.container,
        {
          top: insets.top + 10,
          backgroundColor: config.backgroundColor,
          transform: [{ translateY }],
          opacity,
        },
      ]}
    >
      <View style={styles.content}>
        <Ionicons
          name={config.icon}
          size={24}
          color={config.iconColor}
          style={styles.icon}
        />
        <Text
          style={[styles.message, { color: config.textColor }]}
          numberOfLines={2}
        >
          {message}
        </Text>
      </View>
    </Animated.View>
  );
}

// =============================================================================
// TOAST MANAGER HOOK
// =============================================================================

export function useToast() {
  const [toast, setToast] = React.useState<{
    visible: boolean;
    message: string;
    type: "success" | "error" | "warning" | "info";
  }>({
    visible: false,
    message: "",
    type: "success",
  });

  const showToast = (
    message: string,
    type: "success" | "error" | "warning" | "info" = "success"
  ) => {
    setToast({ visible: true, message, type });
  };

  const hideToast = () => {
    setToast((prev) => ({ ...prev, visible: false }));
  };

  const showSuccess = (message: string) => showToast(message, "success");
  const showError = (message: string) => showToast(message, "error");
  const showWarning = (message: string) => showToast(message, "warning");
  const showInfo = (message: string) => showToast(message, "info");

  return {
    toast,
    showToast,
    hideToast,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    ToastComponent: () => (
      <ToastNotification
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
        onHide={hideToast}
      />
    ),
  };
}

// =============================================================================
// STYLES
// =============================================================================

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    left: 16,
    right: 16,
    zIndex: 1000,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  icon: {
    marginRight: 12,
  },
  message: {
    flex: 1,
    fontSize: 16,
    fontWeight: "500",
    lineHeight: 20,
  },
});

export default ToastNotification;
