/**
 * Enhanced Tab Bar with Floating Action Button
 * Professional 4-tab navigation with integrated FAB and Speed Dial
 */

import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useState } from "react";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { SpeedDial, SpeedDialAction } from "./SpeedDial";

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
    title: "Shopping",
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
  "item-details",
  "settings",
  "profile",
  "menu",
  "barcode-test",
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
  const [speedDialVisible, setSpeedDialVisible] = useState(false);

  // Fixed light theme colors
  const backgroundColor = "#FFFFFF";
  const borderColor = "#F3F4F6";
  const activeColor = "#22C55E";
  const inactiveColor = "#6B7280";

  // =============================================================================
  // FAB ACTIONS
  // =============================================================================

  const speedDialActions: SpeedDialAction[] = [
    {
      id: "manual-entry",
      label: "Manual Entry",
      icon: "create-outline",
      color: "#3B82F6",
      onPress: () => {
        router.push("/(tabs)/add");
      },
    },
    {
      id: "scan-barcode",
      label: "Scan Barcode",
      icon: "barcode-outline",
      color: "#8B5CF6",
      onPress: () => {
        router.push("/(tabs)/barcode-test");
      },
    },
  ];

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
    setSpeedDialVisible(true);
  };

  const handleSpeedDialClose = () => {
    setSpeedDialVisible(false);
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
          {/* Icon with background indicator */}
          <View
            style={[
              styles.iconContainer,
              isFocused && {
                backgroundColor: `${activeColor}15`,
              },
            ]}
          >
            <Ionicons
              name={iconName as any}
              size={24}
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

          {/* Active indicator dot */}
          {isFocused && (
            <View
              style={[styles.activeIndicator, { backgroundColor: activeColor }]}
            />
          )}
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
        accessibilityHint="Opens options to add items manually or scan barcode"
      >
        <Ionicons name="add" size={28} color="#FFFFFF" />
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
      <View
        style={[
          styles.container,
          {
            backgroundColor,
            borderTopColor: borderColor,
            paddingBottom: insets.bottom,
          },
        ]}
      >
        {/* Tab Bar Content */}
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

      {/* Speed Dial */}
      <SpeedDial
        visible={speedDialVisible}
        onClose={handleSpeedDialClose}
        actions={speedDialActions}
      />
    </>
  );
}

// =============================================================================
// STYLES
// =============================================================================

const styles = StyleSheet.create({
  container: {
    borderTopWidth: 1,
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  tabBarContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 8,
    paddingBottom: 4,
    paddingHorizontal: 16,
    minHeight: 64,
  },
  tabSection: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-around",
  },
  tab: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 8,
    borderRadius: 16,
    marginHorizontal: 4,
  },
  tabContent: {
    alignItems: "center",
    position: "relative",
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 4,
  },
  tabLabel: {
    fontSize: 11,
    textAlign: "center",
    marginTop: 2,
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
    marginHorizontal: 16,
  },
  fab: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  fabShadow: {
    position: "absolute",
    top: 4,
    left: 2,
    right: 2,
    bottom: 2,
    borderRadius: 28,
    opacity: 0.2,
    zIndex: -1,
  },
});

export default EnhancedTabBar;
