import React from "react";
import { StyleSheet, View, ViewProps, ViewStyle } from "react-native";
import {
  Edge,
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

interface SafeAreaWrapperProps extends ViewProps {
  children: React.ReactNode;
  edges?: Edge[];
  style?: ViewStyle;
  /**
   * If true, will use padding instead of SafeAreaView
   * Useful for screens where you want to apply safe area padding
   * but need to have scrollable content
   */
  usePadding?: boolean;
}

/**
 * A wrapper component that handles safe area insets consistently
 * Can either use SafeAreaView or apply padding based on insets
 */
const SafeAreaWrapper: React.FC<SafeAreaWrapperProps> = ({
  children,
  edges = ["top", "right", "left", "bottom"],
  style,
  usePadding = false,
  ...props
}) => {
  const insets = useSafeAreaInsets();

  if (usePadding) {
    // Calculate padding based on the edges prop
    const padding = {
      paddingTop: edges.includes("top") ? insets.top : 0,
      paddingRight: edges.includes("right") ? insets.right : 0,
      paddingBottom: edges.includes("bottom") ? insets.bottom : 0,
      paddingLeft: edges.includes("left") ? insets.left : 0,
    };

    return (
      <View style={[styles.container, padding, style]} {...props}>
        {children}
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.container, style]} edges={edges} {...props}>
      {children}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default SafeAreaWrapper;
