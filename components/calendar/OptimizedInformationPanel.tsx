// OptimizedInformationPanel - Space-efficient information display
// Addresses information architecture and space utilization issues

import React, { useCallback, useMemo, useState } from "react";
import {
  Animated,
  LayoutAnimation,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  UIManager,
  View,
  ViewStyle,
} from "react-native";
import { useThemeColor } from "../../hooks/useThemeColor";
import { FoodItem } from "../../lib/supabase";
import {
  OptimizedInformationPanelProps,
  PanelLayoutMode,
} from "../../types/calendar-enhanced";
import { calculateExpiryStatistics } from "../../utils/calendarEnhancedDataUtils";
import RealisticFoodImage from "../RealisticFoodImage";
import { useCalendarColorScheme } from "./ColorSchemeProvider";
import ItemCountIndicator from "./ItemCountIndicator";

// Enable LayoutAnimation on Android
if (
  Platform.OS === "android" &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

const OptimizedInformationPanel: React.FC<OptimizedInformationPanelProps> = ({
  selectedDate,
  items = [],
  colorScheme: propColorScheme,
  layout = "adaptive",
  sections = ["summary", "items", "insights"],
  collapsible = true,
  maxHeight,
  onItemPress,
  onSectionToggle,
  style,
  testID = "optimized-information-panel",
}) => {
  const { colorScheme: contextColorScheme } = useCalendarColorScheme();
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(
    new Set()
  );
  const [panelHeight] = useState(new Animated.Value(0));

  // Use prop color scheme or context color scheme
  const activeColorScheme = propColorScheme || contextColorScheme;

  // Theme colors
  const backgroundColor = useThemeColor(
    { light: "#FFFFFF", dark: "#1C1C1E" },
    "background"
  );
  const textColor = useThemeColor(
    { light: "#374151", dark: "#D1D5DB" },
    "text"
  );
  const borderColor = useThemeColor(
    { light: "#E5E7EB", dark: "#374151" },
    "background"
  );
  const surfaceColor = useThemeColor(
    { light: "#F8F9FA", dark: "#2C2C2E" },
    "background"
  );

  // Filter items for selected date
  const selectedDateItems = useMemo(() => {
    if (!selectedDate) return [];
    return items.filter((item) => item.expiry_date === selectedDate);
  }, [items, selectedDate]);

  // Calculate statistics
  const statistics = useMemo(() => {
    return calculateExpiryStatistics(selectedDateItems, activeColorScheme);
  }, [selectedDateItems, activeColorScheme]);

  // Group items by category and location
  const groupedData = useMemo(() => {
    const byCategory: Record<string, FoodItem[]> = {};
    const byLocation: Record<string, FoodItem[]> = {};
    selectedDateItems.forEach((it) => {
      const c = it.category || "Uncategorized";
      byCategory[c] = byCategory[c] || [];
      byCategory[c].push(it);
      const l = it.location || "Unknown";
      byLocation[l] = byLocation[l] || [];
      byLocation[l].push(it);
    });
    return { byCategory, byLocation };
  }, [selectedDateItems]);

  // Determine layout mode
  const layoutMode = useMemo((): PanelLayoutMode => {
    if (layout === "adaptive") {
      const itemCount = selectedDateItems.length;
      if (itemCount === 0) return "empty";
      if (itemCount <= 3) return "compact";
      if (itemCount <= 10) return "standard";
      return "expanded";
    }
    return layout;
  }, [layout, selectedDateItems.length]);

  // Handle section collapse/expand
  const toggleSection = useCallback(
    (sectionKey: string) => {
      if (!collapsible) return;

      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);

      setCollapsedSections((prev) => {
        const newSet = new Set(prev);
        if (newSet.has(sectionKey)) {
          newSet.delete(sectionKey);
        } else {
          newSet.add(sectionKey);
        }
        return newSet;
      });

      onSectionToggle?.(sectionKey, !collapsedSections.has(sectionKey));
    },
    [collapsible, collapsedSections, onSectionToggle]
  );

  // Container styles based on layout mode
  const containerStyle = useMemo((): ViewStyle => {
    const baseStyle: ViewStyle = {
      backgroundColor,
      borderRadius: 12,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor,
      overflow: "hidden",
    };

    if (maxHeight) {
      baseStyle.maxHeight = maxHeight;
    }

    switch (layoutMode) {
      case "empty":
        return {
          ...baseStyle,
          minHeight: 80,
          justifyContent: "center",
          alignItems: "center",
        };
      case "compact":
        return {
          ...baseStyle,
          minHeight: 120,
        };
      case "standard":
        return {
          ...baseStyle,
          minHeight: 200,
        };
      case "expanded":
        return {
          ...baseStyle,
          minHeight: 300,
          maxHeight: maxHeight || 400,
        };
      default:
        return baseStyle;
    }
  }, [layoutMode, backgroundColor, borderColor, maxHeight]);

  // Render sections based on layout mode
  const renderSections = useCallback(() => {
    if (layoutMode === "empty") {
      return <EmptyState selectedDate={selectedDate} />;
    }

    return sections.map((sectionKey) => {
      const isCollapsed = collapsedSections.has(sectionKey);

      switch (sectionKey) {
        case "summary":
          return (
            <SummarySection
              key="summary"
              statistics={statistics}
              colorScheme={activeColorScheme}
              layoutMode={layoutMode}
              collapsible={collapsible}
              isCollapsed={isCollapsed}
              onToggle={() => toggleSection("summary")}
            />
          );
        case "items":
          return (
            <ItemsSection
              key="items"
              items={selectedDateItems}
              colorScheme={activeColorScheme}
              layoutMode={layoutMode}
              collapsible={collapsible}
              isCollapsed={isCollapsed}
              onToggle={() => toggleSection("items")}
              onItemPress={onItemPress}
            />
          );
        case "insights":
          return (
            <InsightsSection
              key="insights"
              groupedData={groupedData}
              statistics={statistics}
              colorScheme={activeColorScheme}
              layoutMode={layoutMode}
              collapsible={collapsible}
              isCollapsed={isCollapsed}
              onToggle={() => toggleSection("insights")}
            />
          );
        default:
          return null;
      }
    });
  }, [
    layoutMode,
    sections,
    collapsedSections,
    statistics,
    selectedDateItems,
    groupedData,
    activeColorScheme,
    collapsible,
    toggleSection,
    onItemPress,
    selectedDate,
  ]);

  return (
    <View
      style={[containerStyle, style]}
      testID={testID}
      accessible={true}
      accessibilityLabel={`Information panel for ${selectedDate || "calendar"}`}
    >
      {layoutMode === "expanded" ? (
        <ScrollView
          style={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          {renderSections()}
        </ScrollView>
      ) : (
        renderSections()
      )}
    </View>
  );
};

// =============================================================================
// EMPTY STATE COMPONENT
// =============================================================================

interface EmptyStateProps {
  selectedDate?: string;
}

const EmptyState: React.FC<EmptyStateProps> = ({ selectedDate }) => {
  const textColor = useThemeColor(
    { light: "#6B7280", dark: "#9CA3AF" },
    "text"
  );

  return (
    <View style={styles.emptyState}>
      <Text style={[styles.emptyText, { color: textColor }]}>
        {selectedDate
          ? "No items expiring on this date"
          : "Select a date to view details"}
      </Text>
    </View>
  );
};

// =============================================================================
// SUMMARY SECTION COMPONENT
// =============================================================================

interface SummarySectionProps {
  statistics: any;
  colorScheme: any;
  layoutMode: PanelLayoutMode;
  collapsible: boolean;
  isCollapsed: boolean;
  onToggle: () => void;
}

const SummarySection: React.FC<SummarySectionProps> = ({
  statistics,
  colorScheme,
  layoutMode,
  collapsible,
  isCollapsed,
  onToggle,
}) => {
  const textColor = useThemeColor(
    { light: "#374151", dark: "#D1D5DB" },
    "text"
  );
  const surfaceColor = useThemeColor(
    { light: "#F8F9FA", dark: "#2C2C2E" },
    "background"
  );

  const summaryItems = useMemo(
    () => [
      {
        key: "total",
        label: "Total Items",
        value: statistics.totalItems,
        color: "#6B7280",
      },
      {
        key: "expired",
        label: "Expired",
        value: statistics.expiredItems,
        color: colorScheme.expired.primary,
      },
      {
        key: "today",
        label: "Today",
        value: statistics.expiringToday,
        color: colorScheme.today.primary,
      },
    ],
    [statistics, colorScheme]
  );

  if (layoutMode === "compact" && !isCollapsed) {
    return (
      <View style={[styles.summaryCompact, { backgroundColor: surfaceColor }]}>
        <View style={styles.summaryRow}>
          {summaryItems.map((item) => (
            <View key={item.key} style={styles.summaryItemCompact}>
              <ItemCountIndicator
                count={item.value}
                type={item.key as any}
                size="small"
                position="center"
              />
              <Text style={[styles.summaryLabelCompact, { color: textColor }]}>
                {item.label}
              </Text>
            </View>
          ))}
        </View>
      </View>
    );
  }

  return (
    <SectionContainer
      title="Summary"
      collapsible={collapsible}
      isCollapsed={isCollapsed}
      onToggle={onToggle}
    >
      {!isCollapsed && (
        <View style={styles.summaryContent}>
          {summaryItems.map((item) => (
            <View key={item.key} style={styles.summaryItem}>
              <View style={styles.summaryItemHeader}>
                <View
                  style={[
                    styles.summaryIndicator,
                    { backgroundColor: item.color },
                  ]}
                />
                <Text style={[styles.summaryLabel, { color: textColor }]}>
                  {item.label}
                </Text>
              </View>
              <ItemCountIndicator
                count={item.value}
                type={item.key as any}
                size="medium"
                position="center"
              />
            </View>
          ))}
        </View>
      )}
    </SectionContainer>
  );
};

// =============================================================================
// ITEMS SECTION COMPONENT
// =============================================================================

interface ItemsSectionProps {
  items: FoodItem[];
  colorScheme: any;
  layoutMode: PanelLayoutMode;
  collapsible: boolean;
  isCollapsed: boolean;
  onToggle: () => void;
  onItemPress?: (item: FoodItem) => void;
}

const ItemsSection: React.FC<ItemsSectionProps> = ({
  items,
  colorScheme,
  layoutMode,
  collapsible,
  isCollapsed,
  onToggle,
  onItemPress,
}) => {
  const textColor = useThemeColor(
    { light: "#374151", dark: "#D1D5DB" },
    "text"
  );

  const displayItems = useMemo(() => {
    if (layoutMode === "compact") {
      return items.slice(0, 3);
    }
    return items;
  }, [items, layoutMode]);

  return (
    <SectionContainer
      title={`Items (${items.length})`}
      collapsible={collapsible}
      isCollapsed={isCollapsed}
      onToggle={onToggle}
    >
      {!isCollapsed && (
        <View style={styles.itemsContent}>
          {displayItems.map((item, index) => (
            <ItemRow
              key={`${item.id}-${index}`}
              item={item}
              colorScheme={colorScheme}
              compact={layoutMode === "compact"}
              onPress={onItemPress}
            />
          ))}
          {layoutMode === "compact" && items.length > 3 && (
            <View style={styles.moreItemsIndicator}>
              <Text style={[styles.moreItemsText, { color: textColor }]}>
                +{items.length - 3} more items
              </Text>
            </View>
          )}
        </View>
      )}
    </SectionContainer>
  );
};

// =============================================================================
// INSIGHTS SECTION COMPONENT
// =============================================================================

interface InsightsSectionProps {
  groupedData: {
    byCategory: Record<string, FoodItem[]>;
    byLocation: Record<string, FoodItem[]>;
  };
  statistics: any;
  colorScheme: any;
  layoutMode: PanelLayoutMode;
  collapsible: boolean;
  isCollapsed: boolean;
  onToggle: () => void;
}

const InsightsSection: React.FC<InsightsSectionProps> = ({
  groupedData,
  statistics,
  colorScheme,
  layoutMode,
  collapsible,
  isCollapsed,
  onToggle,
}) => {
  const textColor = useThemeColor(
    { light: "#374151", dark: "#D1D5DB" },
    "text"
  );

  const insights = useMemo(() => {
    const categoryCount = Object.keys(groupedData.byCategory).length;
    const locationCount = Object.keys(groupedData.byLocation).length;
    const mostCommonCategory = Object.entries(groupedData.byCategory).sort(
      ([, a], [, b]) => b.length - a.length
    )[0];

    return {
      categoryCount,
      locationCount,
      mostCommonCategory: mostCommonCategory
        ? {
            name: mostCommonCategory[0],
            count: mostCommonCategory[1].length,
          }
        : null,
    };
  }, [groupedData]);

  if (layoutMode === "compact") {
    return null; // Hide insights in compact mode
  }

  return (
    <SectionContainer
      title="Insights"
      collapsible={collapsible}
      isCollapsed={isCollapsed}
      onToggle={onToggle}
    >
      {!isCollapsed && (
        <View style={styles.insightsContent}>
          <View style={styles.insightItem}>
            <Text style={[styles.insightLabel, { color: textColor }]}>
              Categories: {insights.categoryCount}
            </Text>
          </View>
          <View style={styles.insightItem}>
            <Text style={[styles.insightLabel, { color: textColor }]}>
              Locations: {insights.locationCount}
            </Text>
          </View>
          {insights.mostCommonCategory && (
            <View style={styles.insightItem}>
              <Text style={[styles.insightLabel, { color: textColor }]}>
                Most common: {insights.mostCommonCategory.name} (
                {insights.mostCommonCategory.count})
              </Text>
            </View>
          )}
        </View>
      )}
    </SectionContainer>
  );
};

// =============================================================================
// SECTION CONTAINER COMPONENT
// =============================================================================

interface SectionContainerProps {
  title: string;
  collapsible: boolean;
  isCollapsed: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}

const SectionContainer: React.FC<SectionContainerProps> = ({
  title,
  collapsible,
  isCollapsed,
  onToggle,
  children,
}) => {
  const textColor = useThemeColor(
    { light: "#374151", dark: "#D1D5DB" },
    "text"
  );
  const borderColor = useThemeColor(
    { light: "#E5E7EB", dark: "#374151" },
    "text"
  );

  const HeaderComponent = collapsible ? TouchableOpacity : View;

  return (
    <View style={[styles.sectionContainer, { borderBottomColor: borderColor }]}>
      <HeaderComponent
        style={styles.sectionHeader}
        onPress={collapsible ? onToggle : undefined}
        accessible={true}
        accessibilityRole={collapsible ? "button" : "text"}
        accessibilityLabel={`${title} section`}
        accessibilityHint={
          collapsible
            ? isCollapsed
              ? "Tap to expand"
              : "Tap to collapse"
            : undefined
        }
      >
        <Text style={[styles.sectionTitle, { color: textColor }]}>{title}</Text>
        {collapsible && (
          <Text style={[styles.collapseIndicator, { color: textColor }]}>
            {isCollapsed ? "+" : "−"}
          </Text>
        )}
      </HeaderComponent>
      {children}
    </View>
  );
};

// =============================================================================
// ITEM ROW COMPONENT
// =============================================================================

interface ItemRowProps {
  item: FoodItem;
  colorScheme: any;
  compact: boolean;
  onPress?: (item: FoodItem) => void;
}

const ItemRow: React.FC<ItemRowProps> = ({
  item,
  colorScheme,
  compact,
  onPress,
}) => {
  const textColor = useThemeColor(
    { light: "#374151", dark: "#D1D5DB" },
    "text"
  );
  const surfaceColor = useThemeColor(
    { light: "#F8F9FA", dark: "#2C2C2E" },
    "background"
  );

  const ItemComponent = onPress ? TouchableOpacity : View;

  return (
    <ItemComponent
      style={[styles.itemRow, { backgroundColor: surfaceColor }]}
      onPress={onPress ? () => onPress(item) : undefined}
      accessible={true}
      accessibilityRole={onPress ? "button" : "text"}
      accessibilityLabel={`${item.name}, expires ${item.expiry_date}`}
    >
      <View style={styles.itemIcon}>
        <RealisticFoodImage foodName={item.name} style={styles.foodImage} />
      </View>
      <View style={styles.itemContent}>
        <Text
          style={[styles.itemName, { color: textColor }]}
          numberOfLines={compact ? 1 : 2}
        >
          {item.name}
        </Text>
        {!compact && (
          <Text
            style={[styles.itemDetails, { color: textColor, opacity: 0.7 }]}
          >
            {item.category} • {item.location}
          </Text>
        )}
      </View>
      <View style={styles.itemIndicator}>
        <ItemCountIndicator
          count={item.quantity}
          type="future"
          size="small"
          position="center"
        />
      </View>
    </ItemComponent>
  );
};

// =============================================================================
// STYLES
// =============================================================================

const styles = StyleSheet.create({
  scrollContainer: {
    flex: 1,
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  emptyText: {
    fontSize: 16,
    textAlign: "center",
    fontWeight: "500",
  },
  summaryCompact: {
    padding: 12,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
  },
  summaryItemCompact: {
    alignItems: "center",
    gap: 4,
  },
  summaryLabelCompact: {
    fontSize: 12,
    fontWeight: "500",
  },
  summaryContent: {
    padding: 16,
    gap: 12,
  },
  summaryItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  summaryItemHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  summaryIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  summaryLabel: {
    fontSize: 14,
    fontWeight: "500",
  },
  sectionContainer: {
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
  },
  collapseIndicator: {
    fontSize: 18,
    fontWeight: "300",
  },
  itemsContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    gap: 12,
  },
  itemIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    overflow: "hidden",
  },
  foodImage: {
    width: 32,
    height: 32,
  },
  itemContent: {
    flex: 1,
  },
  itemName: {
    fontSize: 14,
    fontWeight: "500",
  },
  itemDetails: {
    fontSize: 12,
    marginTop: 2,
  },
  itemIndicator: {
    alignItems: "center",
  },
  moreItemsIndicator: {
    alignItems: "center",
    paddingVertical: 8,
  },
  moreItemsText: {
    fontSize: 12,
    fontStyle: "italic",
  },
  insightsContent: {
    padding: 16,
    gap: 8,
  },
  insightItem: {
    paddingVertical: 4,
  },
  insightLabel: {
    fontSize: 14,
    fontWeight: "400",
  },
});

// =============================================================================
// EXPORT
// =============================================================================

OptimizedInformationPanel.displayName = "OptimizedInformationPanel";

export default OptimizedInformationPanel;
