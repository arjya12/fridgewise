import React from "react";
import { StyleSheet, View, ViewStyle } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type ScreenLayoutProps = {
  children: React.ReactNode;
  topInsetColor: string;
  topInsetContent?: React.ReactNode;
  backgroundColor?: string;
  style?: ViewStyle;
};

/**
 * Screen wrapper that lets each screen own the status-bar area color.
 * This avoids global hardcoded top colors while keeping behavior consistent.
 */
export default function ScreenLayout({
  children,
  topInsetColor,
  topInsetContent,
  backgroundColor = "#FFFFFF",
  style,
}: ScreenLayoutProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.root, { backgroundColor }, style]}>
      <View style={{ height: insets.top, backgroundColor: topInsetColor }}>
        {topInsetContent ? (
          <View style={styles.topInsetContentWrap}>{topInsetContent}</View>
        ) : null}
      </View>
      <View style={[styles.content, { backgroundColor }]}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  topInsetContentWrap: {
    ...StyleSheet.absoluteFillObject,
  },
});

