/**
 * Enhanced Tab Bar with Floating Action Button
 * Professional 4-tab navigation with integrated FAB and Speed Dial
 */

import { BottomTabBarHeightCallbackContext } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useContext } from "react";
import {
  LayoutChangeEvent,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

/** Extra space above the safe-area line (float look). System nav is cleared by `insets.bottom`, not this alone. */
const PILL_FLOAT_GAP = 10;

// =============================================================================
// INTERFACES
// =============================================================================

interface TabBarProps {
  state: any;
  descriptors: any;
  navigation: any;
}

interface TabConfig {
  name: string;
  title: string;
  icon: string;
  focusedIcon?: string;
}

// =============================================================================
// CONSTANTS
// =============================================================================

const TAB_CONFIG: Record<string, TabConfig> = {
  index: {
    name: "index",
    title: "Home",
    icon: "home-outline",
    focusedIcon: "home",
  },
  calendar: {
    name: "calendar",
    title: "Calendar",
    icon: "calendar-outline",
    focusedIcon: "calendar",
  },
  "shopping-list": {
    name: "shopping-list",
    title: "Groceries",
    icon: "basket-outline",
    focusedIcon: "basket",
  },
  more: {
    name: "more",
    title: "More",
    icon: "ellipsis-horizontal",
    focusedIcon: "ellipsis-horizontal",
  },
};

// Hide these routes from tab bar
const HIDDEN_ROUTES = [
  "add",
  "settings",
  "profile",
  "menu",
];

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function EnhancedTabBar({
  state,
  descriptors,
  navigation,
}: TabBarProps) {
  const insets = useSafeAreaInsets();
  const onTabBarHeightChange = useContext(BottomTabBarHeightCallbackContext);

  const handleTabBarLayout = (e: LayoutChangeEvent) => {
    const h = e.nativeEvent.layout.height;
    if (h > 0) {
      onTabBarHeightChange?.(h);
    }
  };

  // Fixed light theme colors
  const backgroundColor = "#FFFFFF";
  const borderColor = "#F3F4F6";
  const activeColor = "#22C55E";
  const inactiveColor = "#6B7280";

  // =============================================================================
  // HANDLERS
  // =============================================================================

  const handleTabPress = (route: any, isFocused: boolean) => {
    const event = navigation.emit({
      type: "tabPress",
      target: route.key,
      canPreventDefault: true,
    });

    if (!isFocused && !event.defaultPrevented) {
      // Haptic feedback for tab changes
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      navigation.navigate(route.name, route.params);
    }
  };

  const handleFABPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push("/(tabs)/add");
  };

  // =============================================================================
  // RENDER HELPERS
  // =============================================================================

  const renderTab = (route: any, index: number) => {
    const isFocused = state.index === index;
    const tabConfig = TAB_CONFIG[route.name];

    if (!tabConfig || HIDDEN_ROUTES.includes(route.name)) {
      return null;
    }

    const iconName = isFocused
      ? tabConfig.focusedIcon || tabConfig.icon
      : tabConfig.icon;

    return (
      <Pressable
        key={route.key}
        style={styles.tab}
        onPress={() => handleTabPress(route, isFocused)}
        android_ripple={{
          color: "rgba(34, 197, 94, 0.1)",
          borderless: true,
          radius: 32,
        }}
        accessible
        accessibilityRole="button"
        accessibilityLabel={`${tabConfig.title} tab`}
        accessibilityState={{ selected: isFocused }}
      >
        <View style={styles.tabContent}>
          {/* Icon (no filled background when focused for a cleaner look) */}
          <View style={styles.iconContainer}>
            <Ionicons
              name={iconName as any}
              size={22}
              color={isFocused ? activeColor : inactiveColor}
            />
          </View>

          {/* Label */}
          <Text
            style={[
              styles.tabLabel,
              {
                color: isFocused ? activeColor : inactiveColor,
                fontWeight: isFocused ? "600" : "500",
              },
            ]}
          >
            {tabConfig.title}
          </Text>

        </View>
      </Pressable>
    );
  };

  const renderFAB = () => (
    <View style={styles.fabContainer}>
      <Pressable
        style={[styles.fab, { backgroundColor: activeColor }]}
        onPress={handleFABPress}
        android_ripple={{
          color: "rgba(255, 255, 255, 0.2)",
          borderless: true,
        }}
        accessible
        accessibilityRole="button"
        accessibilityLabel="Add new item"
        accessibilityHint="Opens the Add Item screen"
      >
        <Ionicons name="add" size={26} color="#FFFFFF" />
      </Pressable>

      {/* FAB Shadow for iOS */}
      {Platform.OS === "ios" && (
        <View style={[styles.fabShadow, { backgroundColor: activeColor }]} />
      )}
    </View>
  );

  // Filter routes to only show configured tabs
  const visibleRoutes = state.routes.filter(
    (route: any) =>
      TAB_CONFIG[route.name] && !HIDDEN_ROUTES.includes(route.name)
  );

  return (
    <>
      {/* Tab Bar Container with Absolute Positioning for Full Screen Extension */}
      <View style={styles.tabBarContainer} onLayout={handleTabBarLayout}>
        <View
          style={[
            styles.tabBarPill,
            {
              backgroundColor,
              borderColor,
              marginBottom: insets.bottom + PILL_FLOAT_GAP,
            },
          ]}
        >
          {/* Tab Bar Content - positioned with proper spacing */}
          <View style={styles.tabBarContent}>
          {/* Left tabs */}
          <View style={styles.tabSection}>
            {visibleRoutes
              .slice(0, 2)
              .map((route: any, index: number) =>
                renderTab(route, state.routes.indexOf(route))
              )}
          </View>

          {/* Center FAB */}
          {renderFAB()}

            {/* Right tabs */}
            <View style={styles.tabSection}>
              {visibleRoutes
                .slice(2, 4)
                .map((route: any, index: number) =>
                  renderTab(route, state.routes.indexOf(route))
                )}
            </View>
          </View>
        </View>
      </View>

    </>
  );
}

// =============================================================================
// STYLES
// =============================================================================

const styles = StyleSheet.create({
  // Main tab bar container with absolute positioning for full screen extension
  tabBarContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    alignItems: "stretch",
  },
  tabBarPill: {
    flexDirection: "row",
    borderRadius: 999,
    marginHorizontal: 16,
    alignSelf: "stretch",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    // Keep float subtle; strong downward shadow + elevation bleeds over system nav on Android.
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.06,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
      default: {},
    }),
  },
  tabBarContent: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 4,
    paddingHorizontal: 6,
    minHeight: 44,
  },
  tabSection: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-around",
  },
  tab: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 5,
    borderRadius: 14,
    marginHorizontal: 4,
  },
  tabContent: {
    alignItems: "center",
    position: "relative",
  },
  iconContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 2,
  },
  tabLabel: {
    fontSize: 10,
    textAlign: "center",
    marginTop: 1,
  },
  activeIndicator: {
    position: "absolute",
    bottom: -8,
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  fabContainer: {
    position: "relative",
    marginHorizontal: 12,
  },
  fab: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
    // Flatten FAB – no icon shadow
    elevation: 0,
    shadowColor: "transparent",
    shadowOffset: {
      width: 0,
      height: 0,
    },
    shadowOpacity: 0,
    shadowRadius: 0,
  },
  fabShadow: {
    position: "absolute",
    top: 4,
    left: 2,
    right: 2,
    bottom: 2,
    borderRadius: 25,
    // Hide halo completely
    opacity: 0,
    zIndex: -1,
  },
});

export default EnhancedTabBar;
