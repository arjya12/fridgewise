import { Ionicons } from "@expo/vector-icons";
import { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { useRouter } from "expo-router";
import React from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import SafeText from "./SafeText";

// Utility function to ensure text props are properly handled
const ensureTextSafety = (text: string | number | undefined): string => {
  if (text === undefined || text === null) {
    return "";
  }
  return String(text);
};

/**
 * Custom tab bar component with a modern, clean design
 */
const CustomTabBar: React.FC<BottomTabBarProps> = ({
  state,
  descriptors,
  navigation,
}) => {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  // Handle add button press
  const handleAddPress = () => {
    router.push("/(tabs)/add");
  };

  // Render a tab icon based on route name and focus state
  const renderIcon = (routeName: string, isFocused: boolean) => {
    let iconName: keyof typeof Ionicons.glyphMap;

    switch (routeName) {
      case "index":
        iconName = isFocused ? "home" : "home-outline";
        break;
      case "stats":
        iconName = isFocused ? "settings" : "settings-outline";
        break;
      case "menu":
        iconName = isFocused ? "menu" : "menu-outline";
        break;
      default:
        iconName = isFocused ? "ellipse" : "ellipse-outline";
        break;
    }

    return (
      <Ionicons
        name={iconName as keyof typeof Ionicons.glyphMap}
        size={24}
        color={isFocused ? "#22C55E" : "#A4A8B1"}
      />
    );
  };

  // Filter out the hidden tabs
  const visibleRoutes = state.routes.filter(
    (route) => route.name !== "add" && route.name !== "item-details"
  );

  // Calculate the number of visible tabs for layout
  const numVisibleTabs = visibleRoutes.length;

  // Split the visible routes into left and right sides
  const leftRoutes = visibleRoutes.slice(0, Math.floor(numVisibleTabs / 2));
  const rightRoutes = visibleRoutes.slice(Math.floor(numVisibleTabs / 2));

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      <View style={styles.navigationBar}>
        {/* Left side tabs */}
        {leftRoutes.map((route, index) => {
          const { options } = descriptors[route.key];
          const label =
            options.title !== undefined ? options.title.toString() : route.name;

          const isFocused = state.index === state.routes.indexOf(route);

          const onPress = () => {
            const event = navigation.emit({
              type: "tabPress",
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          // Create the accessibility label safely
          const accessibilityLabel = `${ensureTextSafety(label)}, tab`;

          return (
            <TouchableOpacity
              key={route.key}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityState={isFocused ? { selected: true } : {}}
              accessibilityLabel={accessibilityLabel}
              testID={`${ensureTextSafety(label)}-tab`}
              onPress={onPress}
              style={[styles.tabButton, isFocused && styles.activeTabButton]}
            >
              <View style={styles.tabContent}>
                {renderIcon(route.name, isFocused)}
                <SafeText
                  style={[
                    styles.tabLabel,
                    isFocused ? styles.activeTabLabel : styles.inactiveTabLabel,
                  ]}
                >
                  {ensureTextSafety(label)}
                </SafeText>

                {/* Active indicator line */}
                {isFocused && <View style={styles.activeIndicator} />}
              </View>
            </TouchableOpacity>
          );
        })}

        {/* Center Add Button */}
        <TouchableOpacity
          style={styles.addButton}
          activeOpacity={0.8}
          onPress={handleAddPress}
          accessibilityLabel="Add new item"
          accessibilityRole="button"
        >
          <View style={styles.addButtonInner}>
            <Ionicons name="add" size={24} color="#FFFFFF" />
          </View>
        </TouchableOpacity>

        {/* Right side tabs */}
        {rightRoutes.map((route, index) => {
          const { options } = descriptors[route.key];
          const label =
            options.title !== undefined ? options.title.toString() : route.name;

          const isFocused = state.index === state.routes.indexOf(route);

          const onPress = () => {
            const event = navigation.emit({
              type: "tabPress",
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          // Create the accessibility label safely
          const accessibilityLabel = `${ensureTextSafety(label)}, tab`;

          return (
            <TouchableOpacity
              key={route.key}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityState={isFocused ? { selected: true } : {}}
              accessibilityLabel={accessibilityLabel}
              testID={`${ensureTextSafety(label)}-tab`}
              onPress={onPress}
              style={[styles.tabButton, isFocused && styles.activeTabButton]}
            >
              <View style={styles.tabContent}>
                {renderIcon(route.name, isFocused)}
                <SafeText
                  style={[
                    styles.tabLabel,
                    isFocused ? styles.activeTabLabel : styles.inactiveTabLabel,
                  ]}
                >
                  {ensureTextSafety(label)}
                </SafeText>

                {/* Active indicator line */}
                {isFocused && <View style={styles.activeIndicator} />}
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 5,
  },
  navigationBar: {
    flexDirection: "row",
    height: 60,
    alignItems: "center",
    justifyContent: "space-around",
  },
  tabButton: {
    flex: 1,
    height: "100%",
    alignItems: "center",
    justifyContent: "center", // Center vertically
  },
  activeTabButton: {
    backgroundColor: "transparent", // Remove solid background
  },
  tabContent: {
    alignItems: "center",
    justifyContent: "center",
    height: "100%", // Take full height
    position: "relative", // For positioning the indicator
  },
  tabLabel: {
    fontSize: 12,
    marginTop: 4,
    textAlign: "center",
  },
  activeTabLabel: {
    color: "#22C55E",
    fontWeight: "600",
  },
  inactiveTabLabel: {
    color: "#A4A8B1",
    fontWeight: "500",
  },
  activeIndicator: {
    position: "absolute",
    bottom: 0,
    width: 24,
    height: 3,
    backgroundColor: "#22C55E",
    borderRadius: 1.5,
  },
  addButton: {
    width: 56,
    height: 56,
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 10,
    marginBottom: 10, // Lift it up slightly from the bottom
  },
  addButtonInner: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#22C55E",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "rgba(0,0,0,0.3)",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 4,
  },
});

export default CustomTabBar;
