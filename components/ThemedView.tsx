import { useThemeColor } from "@/hooks/useThemeColor";
import React from "react";
import { StyleSheet, View, ViewProps } from "react-native";
import { Edge, SafeAreaView } from "react-native-safe-area-context";

export type ThemedProps = {
  lightColor?: string;
  darkColor?: string;
};

export type ThemedViewProps = ViewProps &
  ThemedProps & {
    useSafeArea?: boolean;
    safeAreaEdges?: Edge[];
  };

/**
 * A themed View component that supports light/dark mode and optional safe area insets
 */
export function ThemedView(props: ThemedViewProps) {
  const {
    style,
    lightColor,
    darkColor,
    useSafeArea = false,
    safeAreaEdges = ["top", "right", "bottom", "left"],
    ...otherProps
  } = props;
  const backgroundColor = useThemeColor(
    { light: lightColor, dark: darkColor },
    "background"
  );

  const viewStyle = [styles.container, { backgroundColor }, style];

  if (useSafeArea) {
    return (
      <SafeAreaView style={viewStyle} edges={safeAreaEdges} {...otherProps} />
    );
  }

  return <View style={viewStyle} {...otherProps} />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
