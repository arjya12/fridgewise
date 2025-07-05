import React, { useEffect, useRef } from "react";
import { Animated, StyleSheet, ViewProps } from "react-native";
import ItemGroupCard from "./ItemGroupCard";

interface AnimatedItemGroupCardProps {
  itemName: string;
  entries: any[];
  onDecrement: (entryId: string) => void;
  onIncrement: (entryId: string) => void;
  onUseAll: (entryId: string) => void;
  onAddMore: () => void;
  onEntryOptions?: (entryId: string) => void;
  onEditEntry?: (entryId: string) => void;
  onDeleteEntry?: (entryId: string) => void;
  initialExpanded?: boolean;
  isNew?: boolean;
  style?: ViewProps["style"];
}

/**
 * A wrapper component that adds animations to ItemGroupCard
 */
const AnimatedItemGroupCard: React.FC<AnimatedItemGroupCardProps> = ({
  itemName,
  entries,
  onDecrement,
  onIncrement,
  onUseAll,
  onAddMore,
  onEntryOptions,
  onEditEntry,
  onDeleteEntry,
  initialExpanded = false,
  isNew = false,
  style,
}) => {
  // Animation values
  const opacity = useRef(new Animated.Value(isNew ? 0 : 1)).current;
  const scale = useRef(new Animated.Value(isNew ? 0.9 : 1)).current;
  const translateY = useRef(new Animated.Value(isNew ? 20 : 0)).current;

  // Run entrance animation when component mounts
  useEffect(() => {
    if (isNew) {
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(scale, {
          toValue: 1,
          friction: 8,
          tension: 40,
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, []);

  // Run animation when entries change
  useEffect(() => {
    // Only animate if it's not the initial render
    if (!isNew) {
      // Pulse animation to highlight changes
      Animated.sequence([
        Animated.timing(scale, {
          toValue: 1.03,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(scale, {
          toValue: 1,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [entries.length]);

  return (
    <Animated.View
      style={[
        styles.container,
        style,
        {
          opacity,
          transform: [{ scale }, { translateY }],
        },
      ]}
    >
      <ItemGroupCard
        itemName={itemName}
        entries={entries}
        onDecrement={onDecrement}
        onIncrement={onIncrement}
        onUseAll={onUseAll}
        onAddMore={onAddMore}
        onEntryOptions={onEntryOptions}
        onEditEntry={onEditEntry}
        onDeleteEntry={onDeleteEntry}
        initialExpanded={initialExpanded}
      />
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    // No additional styles needed here, as ItemGroupCard has its own styles
  },
});

export default AnimatedItemGroupCard;
