// CalendarFAB - Floating Action Button with safe positioning
// Avoids tab bar overlap and provides accessible navigation

import React, { useCallback, useMemo } from "react";
import {
  Animated,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ViewStyle,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useThemeColor } from "../../hooks/useThemeColor";
import {
  CalendarFABProps,
  FABPosition,
  NavigationSafetyConfig,
} from "../../types/calendar-enhanced";

// =============================================================================
// CONSTANTS
// =============================================================================

const FAB_SIZE = 56;
const FAB_SMALL_SIZE = 40;
// const DEFAULT_MARGIN = 16; // Unused
const TAB_BAR_HEIGHT = 80; // Standard tab bar height + safe area

const DEFAULT_NAVIGATION_SAFETY: NavigationSafetyConfig = {
  tabBarHeight: TAB_BAR_HEIGHT,
  fabSize: FAB_SIZE,
  minimumClearance: 8,
  dynamicPositioning: true,
};

// =============================================================================
// MAIN COMPONENT
// =============================================================================

interface CalendarFABPropsExtended {
  onPress: () => void;
  position: FABPosition;
  icon?: string;
  size?: "small" | "medium" | "large";
  backgroundColor?: string;
  iconColor?: string;
  disabled?: boolean;
  loading?: boolean;
  label?: string;
  navigationSafety?: NavigationSafetyConfig;
  style?: any;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  testID?: string;
}

const CalendarFAB: React.FC<CalendarFABPropsExtended> = ({
  onPress,
  icon = "+",
  label,
  size = "medium",
  position,
  navigationSafety = DEFAULT_NAVIGATION_SAFETY,
  style,
  disabled = false,
  accessibilityLabel = "Add new item",
  accessibilityHint = "Navigate to add item screen",
  testID = "calendar-fab",
}) => {
  const insets = useSafeAreaInsets();

  // Theme colors
  const primaryColor = useThemeColor(
    { light: "#0a7ea4", dark: "#0a7ea4" },
    "tint"
  );
  const backgroundColor = useThemeColor(
    { light: "#FFFFFF", dark: "#1C1C1E" },
    "background"
  );
  const shadowColor = useThemeColor(
    { light: "#000000", dark: "#FFFFFF" },
    "text"
  );

  // Calculate safe positioning
  const fabPosition = useMemo(() => {
    const fabSize = size === "small" ? FAB_SMALL_SIZE : FAB_SIZE;

    // Calculate bottom offset to avoid tab bar
    const bottomOffset = Math.max(
      insets.bottom + navigationSafety.minimumClearance,
      navigationSafety.tabBarHeight + navigationSafety.minimumClearance
    );

    return {
      position: "absolute" as const,
      width: fabSize,
      height: fabSize,
      borderRadius: fabSize / 2,
      zIndex: 1000,
      bottom: position.adjustForTabBar ? bottomOffset : position.bottom,
      right: position.right,
    };
  }, [size, position, navigationSafety, insets]);

  // FAB container styles
  const fabContainerStyle = useMemo((): ViewStyle => {
    const isDisabled = disabled;
    const fabSize = size === "small" ? FAB_SMALL_SIZE : FAB_SIZE;

    return {
      ...fabPosition,
      backgroundColor: isDisabled ? "#CCCCCC" : primaryColor,
      justifyContent: "center",
      alignItems: "center",
      elevation: Platform.OS === "android" ? (isDisabled ? 2 : 8) : 0,
      shadowColor: Platform.OS === "ios" ? shadowColor : undefined,
      shadowOffset: Platform.OS === "ios" ? { width: 0, height: 4 } : undefined,
      shadowOpacity:
        Platform.OS === "ios" ? (isDisabled ? 0.1 : 0.3) : undefined,
      shadowRadius: Platform.OS === "ios" ? 8 : undefined,
      opacity: isDisabled ? 0.6 : 1,
      ...style,
    };
  }, [fabPosition, disabled, primaryColor, shadowColor, size, style]);

  // Icon styles
  const iconStyle = useMemo(() => {
    const fontSize = size === "small" ? 20 : 24;
    return {
      fontSize,
      fontWeight: "600" as const,
      color: "#FFFFFF",
      textAlign: "center" as const,
    };
  }, [size]);

  // Label styles (if provided)
  const labelStyle = useMemo(() => {
    return {
      fontSize: 12,
      fontWeight: "500" as const,
      color: "#FFFFFF",
      marginTop: 2,
      textAlign: "center" as const,
    };
  }, []);

  // Handle press with safety checks
  const handlePress = useCallback(() => {
    if (!disabled && onPress) {
      onPress();
    }
  }, [disabled, onPress]);

  return (
    <TouchableOpacity
      style={fabContainerStyle}
      onPress={handlePress}
      disabled={disabled}
      accessible={true}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled }}
      testID={testID}
    >
      <Text style={iconStyle}>{icon}</Text>
      {label && (
        <Text style={labelStyle} numberOfLines={1}>
          {label}
        </Text>
      )}
    </TouchableOpacity>
  );
};

// =============================================================================
// EXTENDED FAB COMPONENT
// =============================================================================

interface ExtendedFABProps extends Omit<CalendarFABProps, "icon" | "label"> {
  actions: {
    icon: string;
    label: string;
    onPress: () => void;
    accessibilityLabel?: string;
  }[];
  isExpanded?: boolean;
  onToggle?: () => void;
}

export const ExtendedFAB: React.FC<ExtendedFABProps> = ({
  actions,
  isExpanded = false,
  onToggle,
  onPress,
  ...fabProps
}) => {
  const animatedValue = useMemo(
    () => new Animated.Value(isExpanded ? 1 : 0),
    []
  );

  React.useEffect(() => {
    Animated.timing(animatedValue, {
      toValue: isExpanded ? 1 : 0,
      duration: 200,
      useNativeDriver: true,
    }).start();
  }, [isExpanded, animatedValue]);

  const handleMainPress = useCallback(() => {
    if (onToggle) {
      onToggle();
    } else if (onPress) {
      onPress();
    }
  }, [onToggle, onPress]);

  return (
    <View style={styles.extendedContainer}>
      {/* Action buttons */}
      {actions.map((action, index) => (
        <Animated.View
          key={action.label}
          style={[
            styles.actionButton,
            {
              transform: [
                {
                  translateY: animatedValue.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, -(60 * (index + 1))],
                  }),
                },
                {
                  scale: animatedValue.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, 1],
                  }),
                },
              ],
              opacity: animatedValue,
            },
          ]}
        >
          <TouchableOpacity
            style={styles.actionButtonTouchable}
            onPress={action.onPress}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel={action.accessibilityLabel || action.label}
          >
            <Text style={styles.actionIcon}>{action.icon}</Text>
          </TouchableOpacity>
          <Text style={styles.actionLabel}>{action.label}</Text>
        </Animated.View>
      ))}

      {/* Main FAB */}
      <CalendarFAB
        {...fabProps}
        onPress={handleMainPress}
        icon={isExpanded ? "×" : "+"}
        accessibilityLabel={isExpanded ? "Close menu" : "Open menu"}
      />
    </View>
  );
};

// =============================================================================
// MINI FAB COMPONENT
// =============================================================================

interface MiniFABProps {
  icon: string;
  onPress: () => void;
  position: { bottom: number; right: number };
  backgroundColor?: string;
  accessibilityLabel?: string;
}

export const MiniFAB: React.FC<MiniFABProps> = ({
  icon,
  onPress,
  position,
  backgroundColor,
  accessibilityLabel,
}) => {
  const primaryColor = useThemeColor(
    { light: "#0a7ea4", dark: "#0a7ea4" },
    "tint"
  );

  const miniStyle = useMemo((): ViewStyle => {
    return {
      position: "absolute",
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: backgroundColor || primaryColor,
      justifyContent: "center",
      alignItems: "center",
      bottom: position.bottom,
      right: position.right,
      elevation: Platform.OS === "android" ? 4 : 0,
      shadowColor: Platform.OS === "ios" ? "#000000" : undefined,
      shadowOffset: Platform.OS === "ios" ? { width: 0, height: 2 } : undefined,
      shadowOpacity: Platform.OS === "ios" ? 0.2 : undefined,
      shadowRadius: Platform.OS === "ios" ? 4 : undefined,
    };
  }, [position, backgroundColor, primaryColor]);

  return (
    <TouchableOpacity
      style={miniStyle}
      onPress={onPress}
      accessible={true}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
    >
      <Text style={styles.miniIcon}>{icon}</Text>
    </TouchableOpacity>
  );
};

// =============================================================================
// HOOKS
// =============================================================================

/**
 * Hook to calculate safe FAB positioning
 */
export function useSafeFABPosition(
  basePosition: FABPosition,
  navigationSafety: NavigationSafetyConfig = DEFAULT_NAVIGATION_SAFETY
) {
  const insets = useSafeAreaInsets();

  return useMemo(() => {
    const bottomOffset = Math.max(
      insets.bottom + navigationSafety.minimumClearance,
      navigationSafety.tabBarHeight + navigationSafety.minimumClearance
    );

    return {
      ...basePosition,
      safeBottomOffset: bottomOffset,
      effectiveBottom: bottomOffset,
    };
  }, [basePosition, navigationSafety, insets]);
}

/**
 * Hook for FAB interaction state
 */
export function useFABState(initialExpanded = false) {
  const [isExpanded, setIsExpanded] = React.useState(initialExpanded);
  const [isVisible, setIsVisible] = React.useState(true);

  const toggle = useCallback(() => {
    setIsExpanded((prev) => !prev);
  }, []);

  const expand = useCallback(() => {
    setIsExpanded(true);
  }, []);

  const collapse = useCallback(() => {
    setIsExpanded(false);
  }, []);

  const show = useCallback(() => {
    setIsVisible(true);
  }, []);

  const hide = useCallback(() => {
    setIsVisible(false);
    setIsExpanded(false);
  }, []);

  return {
    isExpanded,
    isVisible,
    toggle,
    expand,
    collapse,
    show,
    hide,
  };
}

// =============================================================================
// STYLES
// =============================================================================

const styles = StyleSheet.create({
  extendedContainer: {
    position: "relative",
  },
  actionButton: {
    position: "absolute",
    alignItems: "center",
    bottom: 0,
    right: 0,
  },
  actionButtonTouchable: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#666666",
    justifyContent: "center",
    alignItems: "center",
    elevation: Platform.OS === "android" ? 4 : 0,
    shadowColor: Platform.OS === "ios" ? "#000000" : undefined,
    shadowOffset: Platform.OS === "ios" ? { width: 0, height: 2 } : undefined,
    shadowOpacity: Platform.OS === "ios" ? 0.2 : undefined,
    shadowRadius: Platform.OS === "ios" ? 4 : undefined,
  },
  actionIcon: {
    fontSize: 16,
    color: "#FFFFFF",
    fontWeight: "600",
  },
  actionLabel: {
    fontSize: 10,
    color: "#666666",
    marginTop: 4,
    textAlign: "center",
  },
  miniIcon: {
    fontSize: 14,
    color: "#FFFFFF",
    fontWeight: "600",
  },
});

// =============================================================================
// EXPORT
// =============================================================================

CalendarFAB.displayName = "CalendarFAB";
ExtendedFAB.displayName = "ExtendedFAB";
MiniFAB.displayName = "MiniFAB";

export default CalendarFAB;
