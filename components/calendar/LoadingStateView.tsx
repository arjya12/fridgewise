import React, { useEffect, useRef } from "react";
import { Animated, StyleSheet, View } from "react-native";
import { useThemeColor } from "../../hooks/useThemeColor";
import { LoadingStateViewProps } from "../../types/calendar";

const LoadingStateView: React.FC<LoadingStateViewProps> = ({
  itemCount = 3,
}) => {
  const animatedValue = useRef(new Animated.Value(0)).current;

  const surfaceColor = useThemeColor(
    { light: "#FFFFFF", dark: "#1D1D1D" },
    "background"
  );
  const skeletonColor = useThemeColor(
    { light: "#F3F4F6", dark: "#374151" },
    "text"
  );

  useEffect(() => {
    // Only run animations if not in test environment
    if (typeof jest === "undefined") {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(animatedValue, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: false,
          }),
          Animated.timing(animatedValue, {
            toValue: 0,
            duration: 1000,
            useNativeDriver: false,
          }),
        ])
      );
      pulse.start();

      return () => pulse.stop();
    }
  }, [animatedValue]);

  const animatedOpacity = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  const styles = StyleSheet.create({
    container: {
      padding: 16,
    },
    skeletonCard: {
      backgroundColor: surfaceColor,
      borderRadius: 12,
      padding: 16,
      marginVertical: 4,
      shadowColor: "#000",
      shadowOffset: {
        width: 0,
        height: 1,
      },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 2,
    },
    skeletonHeader: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 8,
    },
    skeletonIcon: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: skeletonColor,
      marginRight: 12,
    },
    skeletonContent: {
      flex: 1,
    },
    skeletonTitle: {
      height: 18,
      backgroundColor: skeletonColor,
      borderRadius: 4,
      marginBottom: 4,
      width: "70%",
    },
    skeletonMeta: {
      height: 14,
      backgroundColor: skeletonColor,
      borderRadius: 4,
      width: "50%",
    },
    skeletonBadge: {
      width: 60,
      height: 24,
      backgroundColor: skeletonColor,
      borderRadius: 12,
    },
  });

  const renderSkeletonCard = (index: number) => (
    <Animated.View
      key={index}
      style={[styles.skeletonCard, { opacity: animatedOpacity }]}
    >
      <View style={styles.skeletonHeader}>
        <View style={styles.skeletonIcon} />
        <View style={styles.skeletonContent}>
          <View style={styles.skeletonTitle} />
          <View style={styles.skeletonMeta} />
        </View>
        <View style={styles.skeletonBadge} />
      </View>
    </Animated.View>
  );

  return (
    <View style={styles.container}>
      {Array.from({ length: itemCount }, (_, index) =>
        renderSkeletonCard(index)
      )}
    </View>
  );
};

export default React.memo(LoadingStateView);
