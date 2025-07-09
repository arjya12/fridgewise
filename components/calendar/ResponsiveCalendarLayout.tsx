// Responsive Calendar Layout - Phase 2 Implementation
// Adaptive calendar interface with breakpoint-aware layouts and optimized UX

import { useThemeColor } from "@/hooks/useThemeColor";
import type { FoodItem } from "@/lib/supabase";
import {
  useBreakpoint,
  useDeviceInfo,
  useOrientation,
  useResponsiveSpacing,
} from "@/utils/responsiveUtils";
import React, { useMemo } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import CompactLegend from "./CompactLegend";
import EnhancedCalendarWithIndicators from "./EnhancedCalendarWithIndicators";
// import { InformationPanel } from "./InformationPanel";

// =============================================================================
// INTERFACES
// =============================================================================

interface ResponsiveCalendarLayoutProps {
  items: FoodItem[];
  selectedDate?: string | null;
  onDateSelect: (date: string) => void;
  onItemPress?: (item: FoodItem) => void;
  onMarkUsed?: (itemId: string) => void;
  onExtendExpiry?: (itemId: string) => void;
  compactMode?: boolean;
  showLegend?: boolean;
  showInformationPanel?: boolean;
}

interface LayoutConfiguration {
  calendarDirection: "row" | "column";
  legendPosition: "top" | "bottom" | "side" | "inline";
  panelPosition: "bottom" | "side" | "overlay";
  useScrollView: boolean;
  enableSticky: boolean;
  columnRatio: number; // For side-by-side layouts
}

// =============================================================================
// LAYOUT CONFIGURATIONS BY BREAKPOINT
// =============================================================================

function getLayoutConfiguration(
  isMobile: boolean,
  isTablet: boolean,
  isDesktop: boolean,
  isLandscape: boolean,
  compactMode: boolean
): LayoutConfiguration {
  // Mobile Portrait (default)
  if (isMobile && !isLandscape) {
    return {
      calendarDirection: "column",
      legendPosition: compactMode ? "inline" : "top",
      panelPosition: "bottom",
      useScrollView: true,
      enableSticky: false,
      columnRatio: 1,
    };
  }

  // Mobile Landscape
  if (isMobile && isLandscape) {
    return {
      calendarDirection: "row",
      legendPosition: "side",
      panelPosition: "side",
      useScrollView: false,
      enableSticky: true,
      columnRatio: 0.6, // Calendar takes 60%, panel takes 40%
    };
  }

  // Tablet Portrait
  if (isTablet && !isLandscape) {
    return {
      calendarDirection: "column",
      legendPosition: "top",
      panelPosition: "bottom",
      useScrollView: true,
      enableSticky: true,
      columnRatio: 1,
    };
  }

  // Tablet Landscape & Desktop
  if ((isTablet && isLandscape) || isDesktop) {
    return {
      calendarDirection: "row",
      legendPosition: "top",
      panelPosition: "side",
      useScrollView: false,
      enableSticky: true,
      columnRatio: 0.65, // Calendar takes 65%, panel takes 35%
    };
  }

  // Fallback
  return {
    calendarDirection: "column",
    legendPosition: "top",
    panelPosition: "bottom",
    useScrollView: true,
    enableSticky: false,
    columnRatio: 1,
  };
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

const ResponsiveCalendarLayout: React.FC<ResponsiveCalendarLayoutProps> = ({
  items,
  selectedDate,
  onDateSelect,
  onItemPress,
  onMarkUsed,
  onExtendExpiry,
  compactMode = false,
  showLegend = true,
  showInformationPanel = true,
}) => {
  const deviceInfo = useDeviceInfo();
  const breakpoint = useBreakpoint();
  const orientation = useOrientation();
  const getSpacing = useResponsiveSpacing();

  // Theme colors
  const backgroundColor = useThemeColor(
    { light: "#FFFFFF", dark: "#1D1D1D" },
    "background"
  );
  const surfaceColor = useThemeColor(
    { light: "#F8F9FA", dark: "#2C2C2E" },
    "background"
  );

  // Get layout configuration
  const layout = useMemo(
    () =>
      getLayoutConfiguration(
        breakpoint.isMobile,
        breakpoint.isTablet,
        breakpoint.isDesktop,
        orientation.isLandscape,
        compactMode
      ),
    [breakpoint, orientation, compactMode]
  );

  // Responsive spacing
  const containerPadding = getSpacing(
    breakpoint.isMobile ? "md" : breakpoint.isTablet ? "lg" : "xl"
  );
  const sectionGap = getSpacing(breakpoint.isMobile ? "md" : "lg");

  // Filter items for selected date
  const selectedDateItems = useMemo(() => {
    if (!selectedDate) return [];
    return items.filter((item) => {
      if (!item.expiry_date) return false;
      const expiryDate = new Date(item.expiry_date).toISOString().split("T")[0];
      return expiryDate === selectedDate;
    });
  }, [items, selectedDate]);

  // Calculate dynamic styles
  const containerStyle = useMemo(
    () => ({
      flex: 1,
      backgroundColor,
      padding: containerPadding,
    }),
    [backgroundColor, containerPadding]
  );

  const mainContentStyle = useMemo(
    () => ({
      flex: 1,
      flexDirection: layout.calendarDirection as "row" | "column",
      gap: sectionGap,
    }),
    [layout.calendarDirection, sectionGap]
  );

  const calendarContainerStyle = useMemo(() => {
    if (layout.calendarDirection === "row") {
      return {
        flex: layout.columnRatio,
        minHeight: breakpoint.isMobile ? 300 : 400,
      };
    }
    return { flex: 1 };
  }, [layout, breakpoint]);

  const panelContainerStyle = useMemo(() => {
    if (layout.calendarDirection === "row") {
      return {
        flex: 1 - layout.columnRatio,
        minHeight: breakpoint.isMobile ? 300 : 400,
      };
    }
    return {
      flexShrink: 0,
      maxHeight: breakpoint.isMobile ? 300 : 400,
    };
  }, [layout, breakpoint]);

  // Render legend based on position
  const renderLegend = () => {
    if (!showLegend) return null;

    const legendMode =
      layout.legendPosition === "side"
        ? "vertical"
        : layout.legendPosition === "inline"
        ? "grid"
        : "horizontal";

    return (
      <CompactLegend
        mode={legendMode}
        style={
          layout.legendPosition === "side"
            ? { width: 120, marginRight: getSpacing("md") }
            : undefined
        }
      />
    );
  };

  // Render information panel
  const renderInformationPanel = () => {
    if (!showInformationPanel) return null;

    return (
      <View style={[styles.panelContainer, panelContainerStyle]}>
        <Text style={{ color: "#666", textAlign: "center", padding: 20 }}>
          Information Panel
          {selectedDateItems.length > 0 &&
            ` (${selectedDateItems.length} items)`}
        </Text>
      </View>
    );
  };

  // Main calendar component
  const renderCalendar = () => (
    <View style={[styles.calendarContainer, calendarContainerStyle]}>
      {layout.legendPosition === "top" && renderLegend()}

      <View style={styles.calendarWrapper}>
        {layout.legendPosition === "side" && (
          <View style={styles.sidebarContent}>{renderLegend()}</View>
        )}

        <View style={styles.calendarContent}>
          <EnhancedCalendarWithIndicators
            onDateSelect={(date, items) => onDateSelect?.(date)}
            compactMode={compactMode}
            accessibilityEnabled={true}
            initialDate={selectedDate || undefined}
            calendarHeight={
              breakpoint.isMobile
                ? orientation.isLandscape
                  ? 280
                  : 320
                : breakpoint.isTablet
                ? 360
                : 400
            }
          />

          {layout.legendPosition === "inline" && (
            <View style={styles.inlineLegend}>{renderLegend()}</View>
          )}
        </View>
      </View>

      {layout.legendPosition === "bottom" && renderLegend()}
    </View>
  );

  // Render content based on layout configuration
  const renderContent = () => {
    if (layout.useScrollView) {
      return (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={mainContentStyle}>
            {renderCalendar()}
            {layout.panelPosition === "bottom" && renderInformationPanel()}
          </View>
        </ScrollView>
      );
    }

    return (
      <View style={mainContentStyle}>
        {renderCalendar()}
        {layout.panelPosition === "side" && renderInformationPanel()}
      </View>
    );
  };

  return (
    <SafeAreaView style={containerStyle} edges={["top", "left", "right"]}>
      {renderContent()}
    </SafeAreaView>
  );
};

// =============================================================================
// STYLES
// =============================================================================

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  calendarContainer: {
    flex: 1,
  },
  calendarWrapper: {
    flex: 1,
    flexDirection: "row",
  },
  sidebarContent: {
    flexShrink: 0,
  },
  calendarContent: {
    flex: 1,
  },
  inlineLegend: {
    marginTop: 12,
    alignItems: "center",
  },
  panelContainer: {
    flex: 1,
  },
});

export default ResponsiveCalendarLayout;
