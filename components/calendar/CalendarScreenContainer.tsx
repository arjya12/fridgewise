// CalendarScreenContainer - Optimized layout container for calendar screen
// Provides space-efficient layout with proper safe area handling and FAB positioning

import React, { useCallback, useMemo, useState } from "react";
import { Dimensions, LayoutChangeEvent, View, ViewStyle } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useThemeColor } from "../../hooks/useThemeColor";
import {
  CalendarScreenContainerProps,
  SafeAreaConfig,
  SpaceOptimizationConfig,
} from "../../types/calendar-enhanced";

// =============================================================================
// CONSTANTS
// =============================================================================

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

const DEFAULT_SAFE_AREA_CONFIG: SafeAreaConfig = {
  respectNotch: true,
  respectTabBar: true,
  respectKeyboard: true,
  customInsets: {
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
  },
};

const DEFAULT_SPACE_OPTIMIZATION: SpaceOptimizationConfig = {
  compactMode: false,
  minimizeWhitespace: true,
  adaptiveLayout: true,
  responsiveBreakpoints: {
    compact: 320,
    regular: 768,
    large: 1024,
  },
};

// =============================================================================
// MAIN COMPONENT
// =============================================================================

const CalendarScreenContainer: React.FC<CalendarScreenContainerProps> = ({
  children,
  header,
  footer,
  fab,
  safeAreaConfig = DEFAULT_SAFE_AREA_CONFIG,
  spaceOptimization = DEFAULT_SPACE_OPTIMIZATION,
  onLayout,
  style,
  testID = "calendar-screen-container",
}) => {
  const insets = useSafeAreaInsets();
  const [containerDimensions, setContainerDimensions] = useState({
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
  });

  // Theme colors
  const backgroundColor = useThemeColor(
    { light: "#F8F9FA", dark: "#000000" },
    "background"
  );

  // Calculate effective safe area insets
  const effectiveInsets = useMemo(() => {
    const base = {
      top: safeAreaConfig.respectNotch ? insets.top : 0,
      bottom: safeAreaConfig.respectTabBar ? insets.bottom : 0,
      left: insets.left,
      right: insets.right,
    };

    // Apply custom insets
    if (safeAreaConfig.customInsets) {
      return {
        top: base.top + safeAreaConfig.customInsets.top,
        bottom: base.bottom + safeAreaConfig.customInsets.bottom,
        left: base.left + safeAreaConfig.customInsets.left,
        right: base.right + safeAreaConfig.customInsets.right,
      };
    }

    return base;
  }, [insets, safeAreaConfig]);

  // Determine layout mode based on screen size and configuration
  const layoutMode = useMemo(() => {
    const { width } = containerDimensions;
    const { responsiveBreakpoints, compactMode, adaptiveLayout } =
      spaceOptimization;

    if (compactMode) return "compact";
    if (!adaptiveLayout) return "regular";

    if (width <= responsiveBreakpoints.compact) return "compact";
    if (width <= responsiveBreakpoints.regular) return "regular";
    return "large";
  }, [containerDimensions, spaceOptimization]);

  // Calculate layout dimensions
  const layoutDimensions = useMemo(() => {
    const { width, height } = containerDimensions;
    const availableHeight =
      height - effectiveInsets.top - effectiveInsets.bottom;
    const availableWidth = width - effectiveInsets.left - effectiveInsets.right;

    // Reserve space for header and footer
    const headerHeight = header ? (layoutMode === "compact" ? 44 : 56) : 0;
    const footerHeight = footer ? 60 : 0;
    const fabSpace = fab ? 80 : 0; // Space to avoid FAB overlap

    const contentHeight = availableHeight - headerHeight - footerHeight;
    const calendarHeight =
      contentHeight - (spaceOptimization.minimizeWhitespace ? 0 : 20);

    return {
      container: { width, height },
      available: { width: availableWidth, height: availableHeight },
      content: { width: availableWidth, height: contentHeight },
      calendar: { width: availableWidth, height: calendarHeight },
      header: { width: availableWidth, height: headerHeight },
      footer: { width: availableWidth, height: footerHeight },
      fabSafeArea: fabSpace,
    };
  }, [
    containerDimensions,
    effectiveInsets,
    layoutMode,
    header,
    footer,
    fab,
    spaceOptimization,
  ]);

  // Handle layout changes
  const handleLayout = useCallback(
    (event: LayoutChangeEvent) => {
      const { width, height } = event.nativeEvent.layout;
      setContainerDimensions({ width, height });
      onLayout?.(event);
    },
    [onLayout]
  );

  // Container styles
  const containerStyle = useMemo((): ViewStyle => {
    return {
      flex: 1,
      backgroundColor,
      paddingTop: effectiveInsets.top,
      paddingBottom: effectiveInsets.bottom,
      paddingLeft: effectiveInsets.left,
      paddingRight: effectiveInsets.right,
      ...style,
    };
  }, [backgroundColor, effectiveInsets, style]);

  // Content wrapper styles
  const contentWrapperStyle = useMemo((): ViewStyle => {
    const baseStyle: ViewStyle = {
      flex: 1,
    };

    // Apply space optimization
    if (spaceOptimization.minimizeWhitespace) {
      baseStyle.paddingHorizontal = layoutMode === "compact" ? 8 : 16;
      baseStyle.paddingVertical = layoutMode === "compact" ? 4 : 8;
    } else {
      baseStyle.paddingHorizontal = 16;
      baseStyle.paddingVertical = 16;
    }

    return baseStyle;
  }, [spaceOptimization, layoutMode]);

  // Header container styles
  const headerContainerStyle = useMemo((): ViewStyle => {
    if (!header) return { height: 0 };

    return {
      height: layoutDimensions.header.height,
      width: layoutDimensions.header.width,
      zIndex: 10,
    };
  }, [header, layoutDimensions]);

  // Footer container styles
  const footerContainerStyle = useMemo((): ViewStyle => {
    if (!footer) return { height: 0 };

    return {
      height: layoutDimensions.footer.height,
      width: layoutDimensions.footer.width,
      zIndex: 5,
    };
  }, [footer, layoutDimensions]);

  // FAB container styles
  const fabContainerStyle = useMemo((): ViewStyle => {
    if (!fab) return { display: "none" };

    const bottomOffset = layoutDimensions.footer.height + 16;
    const rightOffset = 16;

    return {
      position: "absolute",
      bottom: bottomOffset,
      right: rightOffset,
      zIndex: 20,
    };
  }, [fab, layoutDimensions]);

  return (
    <View
      style={containerStyle}
      onLayout={handleLayout}
      testID={testID}
      accessible={false}
    >
      {/* Header */}
      {header && <View style={headerContainerStyle}>{header}</View>}

      {/* Main content area */}
      <View style={contentWrapperStyle}>
        <ContentArea
          layoutMode={layoutMode}
          dimensions={layoutDimensions}
          spaceOptimization={spaceOptimization}
        >
          {children}
        </ContentArea>
      </View>

      {/* Footer */}
      {footer && <View style={footerContainerStyle}>{footer}</View>}

      {/* FAB */}
      {fab && <View style={fabContainerStyle}>{fab}</View>}
    </View>
  );
};

// =============================================================================
// CONTENT AREA COMPONENT
// =============================================================================

interface ContentAreaProps {
  children: React.ReactNode;
  layoutMode: "compact" | "regular" | "large";
  dimensions: any;
  spaceOptimization: SpaceOptimizationConfig;
}

const ContentArea: React.FC<ContentAreaProps> = ({
  children,
  layoutMode,
  dimensions,
  spaceOptimization,
}) => {
  const contentStyle = useMemo((): ViewStyle => {
    const baseStyle: ViewStyle = {
      flex: 1,
      width: dimensions.content.width,
      height: dimensions.content.height,
    };

    // Layout-specific adjustments
    switch (layoutMode) {
      case "compact":
        baseStyle.paddingHorizontal = spaceOptimization.minimizeWhitespace
          ? 4
          : 8;
        baseStyle.paddingVertical = spaceOptimization.minimizeWhitespace
          ? 2
          : 4;
        break;
      case "large":
        baseStyle.maxWidth = 1200;
        baseStyle.alignSelf = "center";
        baseStyle.paddingHorizontal = 24;
        break;
      case "regular":
      default:
        baseStyle.paddingHorizontal = spaceOptimization.minimizeWhitespace
          ? 8
          : 16;
        baseStyle.paddingVertical = spaceOptimization.minimizeWhitespace
          ? 4
          : 8;
        break;
    }

    return baseStyle;
  }, [layoutMode, dimensions, spaceOptimization]);

  return <View style={contentStyle}>{children}</View>;
};

// =============================================================================
// UTILITY COMPONENTS
// =============================================================================

/**
 * Responsive grid container for calendar layout
 */
interface ResponsiveGridProps {
  children: React.ReactNode;
  columns?: number;
  spacing?: number;
  layoutMode: "compact" | "regular" | "large";
}

export const ResponsiveGrid: React.FC<ResponsiveGridProps> = ({
  children,
  columns,
  spacing = 8,
  layoutMode,
}) => {
  const gridColumns =
    columns || (layoutMode === "compact" ? 1 : layoutMode === "large" ? 3 : 2);

  const gridStyle = useMemo((): ViewStyle => {
    return {
      flexDirection: "row",
      flexWrap: "wrap",
      marginHorizontal: -spacing / 2,
    };
  }, [spacing]);

  const itemStyle = useMemo((): ViewStyle => {
    const itemWidth = `${100 / gridColumns}%` as any;
    return {
      width: itemWidth,
      paddingHorizontal: spacing / 2,
      marginBottom: spacing,
    };
  }, [gridColumns, spacing]);

  return (
    <View style={gridStyle}>
      {React.Children.map(children, (child, index) => (
        <View key={index} style={itemStyle}>
          {child}
        </View>
      ))}
    </View>
  );
};

/**
 * Adaptive spacing component
 */
interface AdaptiveSpacingProps {
  size?: "small" | "medium" | "large";
  layoutMode: "compact" | "regular" | "large";
  horizontal?: boolean;
  vertical?: boolean;
}

export const AdaptiveSpacing: React.FC<AdaptiveSpacingProps> = ({
  size = "medium",
  layoutMode,
  horizontal = false,
  vertical = true,
}) => {
  const spacingValue = useMemo(() => {
    const baseSpacing = {
      small: { compact: 4, regular: 8, large: 12 },
      medium: { compact: 8, regular: 16, large: 24 },
      large: { compact: 12, regular: 24, large: 32 },
    };

    return baseSpacing[size][layoutMode];
  }, [size, layoutMode]);

  const spacingStyle = useMemo((): ViewStyle => {
    return {
      ...(horizontal && { width: spacingValue }),
      ...(vertical && { height: spacingValue }),
    };
  }, [spacingValue, horizontal, vertical]);

  return <View style={spacingStyle} />;
};

/**
 * Safe area aware scrollable container
 */
interface SafeScrollContainerProps {
  children: React.ReactNode;
  fabOffset?: number;
  headerHeight?: number;
}

export const SafeScrollContainer: React.FC<SafeScrollContainerProps> = ({
  children,
  fabOffset = 80,
  headerHeight = 0,
}) => {
  const insets = useSafeAreaInsets();

  const containerStyle = useMemo((): ViewStyle => {
    return {
      flex: 1,
      paddingBottom: Math.max(insets.bottom, fabOffset),
      paddingTop: headerHeight,
    };
  }, [insets.bottom, fabOffset, headerHeight]);

  return <View style={containerStyle}>{children}</View>;
};

// =============================================================================
// HOOKS
// =============================================================================

/**
 * Hook to get current layout information
 */
export function useLayoutInfo() {
  const insets = useSafeAreaInsets();
  const [dimensions, setDimensions] = useState({
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
  });

  const layoutMode = useMemo(() => {
    if (dimensions.width <= 320) return "compact";
    if (dimensions.width <= 768) return "regular";
    return "large";
  }, [dimensions.width]);

  const isCompact = layoutMode === "compact";
  const isLarge = layoutMode === "large";

  return {
    dimensions,
    insets,
    layoutMode,
    isCompact,
    isLarge,
    setDimensions,
  };
}

/**
 * Hook for responsive spacing values
 */
export function useResponsiveSpacing() {
  const { layoutMode } = useLayoutInfo();

  return useMemo(() => {
    const spacing = {
      xs: layoutMode === "compact" ? 2 : layoutMode === "large" ? 6 : 4,
      sm: layoutMode === "compact" ? 4 : layoutMode === "large" ? 12 : 8,
      md: layoutMode === "compact" ? 8 : layoutMode === "large" ? 24 : 16,
      lg: layoutMode === "compact" ? 12 : layoutMode === "large" ? 32 : 24,
      xl: layoutMode === "compact" ? 16 : layoutMode === "large" ? 48 : 32,
    };

    return spacing;
  }, [layoutMode]);
}

// =============================================================================
// STYLES
// =============================================================================

// No additional styles needed

// =============================================================================
// EXPORT
// =============================================================================

CalendarScreenContainer.displayName = "CalendarScreenContainer";
ResponsiveGrid.displayName = "ResponsiveGrid";
AdaptiveSpacing.displayName = "AdaptiveSpacing";
SafeScrollContainer.displayName = "SafeScrollContainer";

export default CalendarScreenContainer;
