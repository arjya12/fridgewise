import { Ionicons } from "@expo/vector-icons";
import { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import React from "react";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

/**
 * Custom tab bar component that matches the Figma design
 */
const CustomTabBar: React.FC<BottomTabBarProps> = ({
  state,
  descriptors,
  navigation,
}) => {
  const insets = useSafeAreaInsets();

  // Render a tab icon based on route name and focus state
  const renderIcon = (routeName: string, isFocused: boolean) => {
    if (routeName === "index") {
      // Use the custom home icon for Dashboard
      return (
        <Image
          source={require("../assets/images/figma/home_icon.png")}
          style={[
            styles.homeIcon,
            { tintColor: isFocused ? "#22C55E" : "#A4A8B1" },
          ]}
          resizeMode="contain"
        />
      );
    }

    // For other tabs, use Ionicons
    let iconName: keyof typeof Ionicons.glyphMap = "home";

    if (routeName === "demo") {
      iconName = "cube";
    } else if (routeName === "profile") {
      iconName = "person";
    } else if (routeName === "stats") {
      iconName = "settings";
    }

    return (
      <Ionicons
        name={iconName}
        size={24}
        color={isFocused ? "#22C55E" : "#A4A8B1"}
      />
    );
  };

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom || 10 }]}>
      {state.routes.map((route, index) => {
        if (route.name === "add" || route.name === "item-details") {
          // Skip hidden tabs
          return null;
        }

        const { options } = descriptors[route.key];
        const label =
          options.title !== undefined ? options.title.toString() : route.name;

        const isFocused = state.index === index;

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

        return (
          <TouchableOpacity
            key={route.key}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityState={isFocused ? { selected: true } : {}}
            accessibilityLabel={`${label}, tab`}
            testID={`${label}-tab`}
            onPress={onPress}
            style={[
              styles.tabButton,
              isFocused && route.name === "index" && styles.activeTabBackground,
            ]}
          >
            {renderIcon(route.name, isFocused)}
            <Text
              style={[
                styles.tabLabel,
                isFocused ? styles.activeTabLabel : styles.inactiveTabLabel,
              ]}
            >
              {label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
    height: 76,
    alignItems: "center",
    justifyContent: "space-around",
  },
  tabButton: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    borderRadius: 12,
  },
  activeTabBackground: {
    backgroundColor: "#EFFCF3",
    borderWidth: 1,
    borderColor: "#FCFEFD",
    margin: 5,
  },
  tabLabel: {
    fontSize: 11,
    marginTop: 4,
    textAlign: "center",
  },
  activeTabLabel: {
    color: "#22C55E",
    fontWeight: "500",
  },
  inactiveTabLabel: {
    color: "#A4A8B1",
    fontWeight: "400",
  },
  homeIcon: {
    width: 24,
    height: 24,
  },
});

export default CustomTabBar;
