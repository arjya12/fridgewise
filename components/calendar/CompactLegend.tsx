// Compact Legend Component - Phase 2 Design Implementation
// Responsive legend with urgency color coding and accessibility features

import React, { useMemo } from "react";
import {
  Dimensions,
  StyleSheet,
  Text,
  useColorScheme,
  View,
} from "react-native";
import { useThemeColor } from "../../hooks/useThemeColor";

// =============================================================================
// INTERFACES & TYPES
// =============================================================================

interface CompactLegendProps {
  mode?: "horizontal" | "vertical" | "grid";
  showDescriptions?: boolean;
  accessibilityEnabled?: boolean;
  style?: any;
}

interface LegendItem {
  key: string;
  color: string;
  darkColor: string;
  label: string;
  description: string;
  urgencyLevel: "critical" | "warning" | "soon" | "safe";
}

// =============================================================================
// PHASE 2 DESIGN CONSTANTS
// =============================================================================

const LEGEND_ITEMS: LegendItem[] = [
  {
    key: "critical",
    color: "#EF4444",
    darkColor: "#FF6B6B",
    label: "Critical",
    description: "Expired or expiring today",
    urgencyLevel: "critical",
  },
  {
    key: "warning",
    color: "#F97316",
    darkColor: "#FFB84D",
    label: "Warning",
    description: "Expiring in 1-2 days",
    urgencyLevel: "warning",
  },
  {
    key: "soon",
    color: "#EAB308",
    darkColor: "#FFD93D",
    label: "Soon",
    description: "Expiring in 3-7 days",
    urgencyLevel: "soon",
  },
  {
    key: "safe",
    color: "#22C55E",
    darkColor: "#51D88A",
    label: "Safe",
    description: "Expiring in 8+ days",
    urgencyLevel: "safe",
  },
];

// =============================================================================
// MAIN COMPONENT
// =============================================================================

const CompactLegend: React.FC<CompactLegendProps> = ({
  mode = "horizontal",
  showDescriptions = false,
  accessibilityEnabled = true,
  style,
}) => {
  const screenWidth = Dimensions.get("window").width;
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  // Theme colors
  const backgroundColor = useThemeColor(
    { light: "#F8F9FA", dark: "#2C2C2E" },
    "background"
  );
  const textColor = useThemeColor(
    { light: "#11181C", dark: "#ECEDEE" },
    "text"
  );
  const borderColor = useThemeColor(
    { light: "#E5E7EB", dark: "#3C3C3E" },
    "border"
  );

  // Determine layout based on screen size and mode
  const isCompactScreen = screenWidth < 400;
  const effectiveMode = isCompactScreen ? "grid" : mode;

  // Dynamic styles based on mode and screen size
  const styles = useMemo(
    () =>
      createStyles(
        backgroundColor,
        textColor,
        borderColor,
        effectiveMode,
        isCompactScreen
      ),
    [backgroundColor, textColor, borderColor, effectiveMode, isCompactScreen]
  );

  // Render legend item
  const renderLegendItem = (item: LegendItem, index: number) => {
    const itemColor = isDark ? item.darkColor : item.color;

    return (
      <View
        key={item.key}
        style={[
          styles.legendItem,
          effectiveMode === "grid" && styles.legendItemGrid,
        ]}
        accessible={accessibilityEnabled}
        accessibilityRole="text"
        accessibilityLabel={`${item.label}: ${item.description}`}
        testID={`legend-item-${item.key}`}
      >
        {/* Color dot indicator */}
        <View
          style={[
            styles.legendDot,
            { backgroundColor: itemColor },
            effectiveMode === "grid" && styles.legendDotGrid,
          ]}
          accessible={false}
        />

        {/* Text content */}
        <View style={styles.textContainer}>
          <Text
            style={[
              styles.legendLabel,
              { color: textColor },
              effectiveMode === "grid" && styles.legendLabelGrid,
            ]}
            numberOfLines={1}
          >
            {item.label}
          </Text>

          {showDescriptions && (
            <Text
              style={[
                styles.legendDescription,
                { color: textColor },
                effectiveMode === "grid" && styles.legendDescriptionGrid,
              ]}
              numberOfLines={effectiveMode === "grid" ? 2 : 1}
            >
              {item.description}
            </Text>
          )}
        </View>
      </View>
    );
  };

  // Accessibility summary for screen readers
  const accessibilitySummary = useMemo(() => {
    if (!accessibilityEnabled) return undefined;

    const summary = LEGEND_ITEMS.map(
      (item) => `${item.label}: ${item.description}`
    ).join(", ");
    return `Calendar legend: ${summary}`;
  }, [accessibilityEnabled]);

  return (
    <View
      style={[styles.container, style]}
      accessible={accessibilityEnabled}
      accessibilityRole="group"
      accessibilityLabel={accessibilitySummary}
      testID="compact-legend"
    >
      {/* Header for vertical mode */}
      {effectiveMode === "vertical" && (
        <Text
          style={[styles.header, { color: textColor }]}
          accessible={accessibilityEnabled}
          accessibilityRole="header"
        >
          Urgency Levels
        </Text>
      )}

      {/* Legend items container */}
      <View
        style={[
          styles.itemsContainer,
          effectiveMode === "horizontal" && styles.itemsContainerHorizontal,
          effectiveMode === "vertical" && styles.itemsContainerVertical,
          effectiveMode === "grid" && styles.itemsContainerGrid,
        ]}
      >
        {LEGEND_ITEMS.map((item, index) => renderLegendItem(item, index))}
      </View>

      {/* Instructions for compact mode */}
      {isCompactScreen && accessibilityEnabled && (
        <Text
          style={[styles.instructions, { color: textColor }]}
          accessible={true}
          accessibilityRole="text"
        >
          Dots indicate item urgency on calendar dates
        </Text>
      )}
    </View>
  );
};

// =============================================================================
// STYLES FACTORY
// =============================================================================

const createStyles = (
  backgroundColor: string,
  textColor: string,
  borderColor: string,
  mode: string,
  isCompactScreen: boolean
) =>
  StyleSheet.create({
    container: {
      backgroundColor: backgroundColor,
      borderTopWidth: 1,
      borderTopColor: borderColor,
      paddingVertical: isCompactScreen ? 8 : 12,
      paddingHorizontal: isCompactScreen ? 12 : 16,
    },

    header: {
      fontSize: 14,
      fontWeight: "600",
      marginBottom: 8,
      textAlign: "center",
    },

    // Items container layouts
    itemsContainer: {
      // Base container styles
    },
    itemsContainerHorizontal: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    itemsContainerVertical: {
      flexDirection: "column",
      gap: 8,
    },
    itemsContainerGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      justifyContent: "space-between",
      gap: 8,
    },

    // Legend item layouts
    legendItem: {
      flexDirection: "row",
      alignItems: "center",
      flex: mode === "horizontal" ? 1 : undefined,
      justifyContent: mode === "horizontal" ? "center" : "flex-start",
    },
    legendItemGrid: {
      width: "48%", // Two items per row in grid mode
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "flex-start",
    },

    // Dot styles
    legendDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      marginRight: 6,
    },
    legendDotGrid: {
      width: 6,
      height: 6,
      borderRadius: 3,
      marginRight: 4,
    },

    // Text container
    textContainer: {
      flex: 1,
    },

    // Label styles
    legendLabel: {
      fontSize: isCompactScreen ? 11 : 12,
      fontWeight: "600",
    },
    legendLabelGrid: {
      fontSize: 10,
      fontWeight: "500",
    },

    // Description styles
    legendDescription: {
      fontSize: isCompactScreen ? 9 : 10,
      opacity: 0.8,
      marginTop: 2,
    },
    legendDescriptionGrid: {
      fontSize: 8,
      opacity: 0.7,
      marginTop: 1,
    },

    // Instructions
    instructions: {
      fontSize: 9,
      opacity: 0.6,
      textAlign: "center",
      marginTop: 6,
      fontStyle: "italic",
    },
  });

// =============================================================================
// CONVENIENCE EXPORTS
// =============================================================================

export const HorizontalLegend: React.FC<Omit<CompactLegendProps, "mode">> = (
  props
) => <CompactLegend {...props} mode="horizontal" />;

export const VerticalLegend: React.FC<Omit<CompactLegendProps, "mode">> = (
  props
) => <CompactLegend {...props} mode="vertical" />;

export const GridLegend: React.FC<Omit<CompactLegendProps, "mode">> = (
  props
) => <CompactLegend {...props} mode="grid" />;

export default CompactLegend;
