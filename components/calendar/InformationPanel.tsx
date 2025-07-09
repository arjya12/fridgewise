import React, { useEffect, useRef } from "react";
import { Animated, Easing, StyleSheet, View } from "react-native";
import { useThemeColor } from "../../hooks/useThemeColor";
import { InformationPanelProps, PanelState } from "../../types/calendar";
import EmptyStateView from "./EmptyStateView";
import ExpiringSoonView from "./ExpiringSoonView";
import SelectedDateView from "./SelectedDateView";

const InformationPanel: React.FC<InformationPanelProps> = ({
  state,
  selectedDate,
  expiringSoonItems,
  selectedDateItems,
  loading = false,
  onItemPress,
  onMarkUsed,
  onDelete,
  onViewAll,
  onAddItem,
}) => {
  const previousState = useRef<PanelState>(state);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;

  const backgroundColor = useThemeColor(
    { light: "#FFFFFF", dark: "#1D1D1D" },
    "background"
  );

  useEffect(() => {
    if (previousState.current !== state) {
      // Animate state transition
      Animated.sequence([
        // Fade out current content
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
          easing: Easing.bezier(0.4, 0.0, 0.6, 1),
        }),
        // Slide in new content
        Animated.parallel([
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 250,
            useNativeDriver: true,
            easing: Easing.bezier(0.0, 0.0, 0.2, 1),
          }),
          Animated.spring(slideAnim, {
            toValue: 0,
            useNativeDriver: true,
            tension: 100,
            friction: 8,
          }),
        ]),
      ]).start();

      previousState.current = state;
    }
  }, [state, fadeAnim, slideAnim]);

  const renderContent = () => {
    switch (state) {
      case "default":
        return (
          <ExpiringSoonView
            items={expiringSoonItems}
            onItemPress={onItemPress}
            onViewAll={onViewAll}
            loading={loading}
          />
        );

      case "selected":
        if (!selectedDate) {
          return (
            <EmptyStateView type="no-date-selected" onAddItem={onAddItem} />
          );
        }

        return (
          <SelectedDateView
            selectedDate={selectedDate}
            items={selectedDateItems}
            onItemPress={onItemPress}
            onMarkUsed={onMarkUsed}
            onDelete={onDelete}
            loading={loading}
          />
        );

      case "empty":
      default:
        return <EmptyStateView type="no-date-selected" onAddItem={onAddItem} />;
    }
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor,
      borderTopLeftRadius: 16,
      borderTopRightRadius: 16,
      shadowColor: "#000",
      shadowOffset: {
        width: 0,
        height: -2,
      },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 8,
    },
    contentContainer: {
      flex: 1,
      overflow: "hidden",
    },
    animatedContent: {
      flex: 1,
    },
  });

  return (
    <View style={styles.container}>
      <View style={styles.contentContainer}>
        <Animated.View
          style={[
            styles.animatedContent,
            {
              opacity: fadeAnim,
              transform: [
                {
                  translateY: slideAnim.interpolate({
                    inputRange: [-1, 0, 1],
                    outputRange: [-20, 0, 20],
                  }),
                },
              ],
            },
          ]}
        >
          {renderContent()}
        </Animated.View>
      </View>
    </View>
  );
};

export default React.memo(InformationPanel);
