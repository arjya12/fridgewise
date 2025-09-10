// Responsive Container - Phase 2 Implementation
// Adaptive container component with breakpoint-aware layouts and spacing

import {
  ResponsiveValue,
  SpacingSize,
  useDeviceInfo,
  useResponsiveSpacing,
  useResponsiveValue,
} from "@/utils/responsiveUtils";
import React, { ReactNode, useMemo } from "react";
import { StyleSheet, Text, View, ViewStyle } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// =============================================================================
// INTERFACES
// =============================================================================

interface ResponsiveContainerProps {
  children: ReactNode;
  padding?: ResponsiveValue<SpacingSize>;
  margin?: ResponsiveValue<SpacingSize>;
  maxWidth?: ResponsiveValue<number>;
  centerContent?: boolean;
  safeArea?: boolean;
  style?: ViewStyle;
  contentContainerStyle?: ViewStyle;
}

interface ResponsiveGridProps {
  children: ReactNode;
  columns?: ResponsiveValue<number>;
  gap?: ResponsiveValue<SpacingSize>;
  itemAspectRatio?: number;
  style?: ViewStyle;
}

interface ResponsiveStackProps {
  children: ReactNode;
  direction?: ResponsiveValue<"row" | "column">;
  gap?: ResponsiveValue<SpacingSize>;
  align?: ResponsiveValue<"flex-start" | "center" | "flex-end" | "stretch">;
  justify?: ResponsiveValue<
    | "flex-start"
    | "center"
    | "flex-end"
    | "space-between"
    | "space-around"
    | "space-evenly"
  >;
  wrap?: boolean;
  style?: ViewStyle;
}

// =============================================================================
// RESPONSIVE CONTAINER
// =============================================================================

const ResponsiveContainer: React.FC<ResponsiveContainerProps> = ({
  children,
  padding,
  margin,
  maxWidth,
  centerContent = false,
  safeArea = false,
  style,
  contentContainerStyle,
}) => {
  const deviceInfo = useDeviceInfo();
  const getSpacing = useResponsiveSpacing();

  // Get responsive values
  const responsivePadding = useResponsiveValue(padding || { default: "md" });
  const responsiveMargin = useResponsiveValue(margin || { default: "none" });
  const responsiveMaxWidth = useResponsiveValue(
    maxWidth || { default: undefined as unknown as number }
  );

  const containerStyle = useMemo((): ViewStyle => {
    const styles: ViewStyle = {
      flex: 1,
      width: "100%",
    };

    // Apply padding
    if (responsivePadding && responsivePadding !== "none") {
      const paddingValue = getSpacing(responsivePadding as SpacingSize);
      styles.paddingHorizontal = paddingValue;
      styles.paddingVertical = paddingValue;
    }

    // Apply margin
    if (responsiveMargin && responsiveMargin !== "none") {
      const marginValue = getSpacing(responsiveMargin as SpacingSize);
      styles.marginHorizontal = marginValue;
      styles.marginVertical = marginValue;
    }

    // Apply max width and centering
    if (responsiveMaxWidth) {
      styles.maxWidth = responsiveMaxWidth;
      if (centerContent) {
        styles.alignSelf = "center";
      }
    }

    return styles;
  }, [
    responsivePadding,
    responsiveMargin,
    responsiveMaxWidth,
    centerContent,
    getSpacing,
  ]);

  const Wrapper = safeArea ? SafeAreaView : View;

  return (
    <Wrapper style={[containerStyle, style]}>
      <View style={[{ flex: 1 }, contentContainerStyle]}>{children}</View>
    </Wrapper>
  );
};

// =============================================================================
// RESPONSIVE GRID
// =============================================================================

const ResponsiveGrid: React.FC<ResponsiveGridProps> = ({
  children,
  columns,
  gap,
  itemAspectRatio,
  style,
}) => {
  const deviceInfo = useDeviceInfo();
  const getSpacing = useResponsiveSpacing();

  // Default column configuration
  const defaultColumns: ResponsiveValue<number> = {
    mobile: { small: 1, medium: 2, large: 2 },
    tablet: { small: 2, medium: 3, large: 4 },
    desktop: { small: 3, medium: 4, large: 5 },
    default: 2,
  };

  const defaultGap: ResponsiveValue<SpacingSize> = {
    mobile: { small: "sm", medium: "md", large: "md" },
    tablet: { small: "md", medium: "lg", large: "lg" },
    desktop: { small: "lg", medium: "xl", large: "xl" },
    default: "md",
  };

  const responsiveColumns = useResponsiveValue(columns || defaultColumns) || 2;
  const responsiveGap = useResponsiveValue(gap || defaultGap) || "md";
  const gapValue = getSpacing(responsiveGap as SpacingSize);

  const gridStyle = useMemo(
    (): ViewStyle => ({
      flexDirection: "row",
      flexWrap: "wrap",
      marginHorizontal: -gapValue / 2,
    }),
    [gapValue]
  );

  const childrenArray = React.Children.toArray(children);

  return (
    <View style={[gridStyle, style]}>
      {childrenArray.map((child, index) => {
        const itemWidth =
          100 / responsiveColumns - gapValue / responsiveColumns;
        const itemStyle: ViewStyle = {
          width: `${itemWidth}%`,
          marginHorizontal: gapValue / 2,
          marginBottom: gapValue,
        };

        if (itemAspectRatio) {
          itemStyle.aspectRatio = itemAspectRatio;
        }

        return (
          <View key={index} style={itemStyle}>
            {child}
          </View>
        );
      })}
    </View>
  );
};

// =============================================================================
// RESPONSIVE STACK
// =============================================================================

const ResponsiveStack: React.FC<ResponsiveStackProps> = ({
  children,
  direction,
  gap,
  align,
  justify,
  wrap = false,
  style,
}) => {
  const getSpacing = useResponsiveSpacing();

  // Default configuration
  const defaultDirection: ResponsiveValue<"row" | "column"> = {
    mobile: { small: "column", medium: "column", large: "column" },
    tablet: { small: "row", medium: "row", large: "row" },
    desktop: { small: "row", medium: "row", large: "row" },
    default: "column",
  };

  const defaultGap: ResponsiveValue<SpacingSize> = {
    mobile: { small: "sm", medium: "md", large: "md" },
    tablet: { small: "md", medium: "lg", large: "lg" },
    desktop: { small: "lg", medium: "xl", large: "xl" },
    default: "md",
  };

  const responsiveDirection =
    useResponsiveValue(direction || defaultDirection) || "column";
  const responsiveGap = useResponsiveValue(gap || defaultGap) || "md";
  const responsiveAlign =
    useResponsiveValue(align || { default: "stretch" }) || "stretch";
  const responsiveJustify =
    useResponsiveValue(justify || { default: "flex-start" }) || "flex-start";

  const gapValue = getSpacing(responsiveGap as SpacingSize);

  const stackStyle = useMemo(
    (): ViewStyle => ({
      flexDirection: responsiveDirection,
      alignItems: responsiveAlign as any,
      justifyContent: responsiveJustify as any,
      flexWrap: wrap ? "wrap" : "nowrap",
    }),
    [responsiveDirection, responsiveAlign, responsiveJustify, wrap]
  );

  const childrenArray = React.Children.toArray(children);

  return (
    <View style={[stackStyle, style]}>
      {childrenArray.map((child, index) => {
        const isLast = index === childrenArray.length - 1;
        const itemStyle: ViewStyle = {};

        if (!isLast) {
          if (responsiveDirection === "row") {
            itemStyle.marginRight = gapValue;
          } else {
            itemStyle.marginBottom = gapValue;
          }
        }

        return (
          <View key={index} style={itemStyle}>
            {child}
          </View>
        );
      })}
    </View>
  );
};

// =============================================================================
// RESPONSIVE SECTION
// =============================================================================

interface ResponsiveSectionProps {
  children: ReactNode;
  title?: string;
  subtitle?: string;
  padding?: ResponsiveValue<SpacingSize>;
  titleAlign?: "left" | "center" | "right";
  style?: ViewStyle;
  headerStyle?: ViewStyle;
  contentStyle?: ViewStyle;
}

const ResponsiveSection: React.FC<ResponsiveSectionProps> = ({
  children,
  title,
  subtitle,
  padding,
  titleAlign = "left",
  style,
  headerStyle,
  contentStyle,
}) => {
  const getSpacing = useResponsiveSpacing();
  const responsivePadding = useResponsiveValue(padding || { default: "lg" });
  const paddingValue = getSpacing(responsivePadding as SpacingSize);

  const sectionStyle = useMemo(
    (): ViewStyle => ({
      paddingHorizontal: paddingValue,
      paddingVertical: paddingValue / 2,
    }),
    [paddingValue]
  );

  const headerTextStyle = useMemo(
    (): any => ({
      textAlign: titleAlign,
      marginBottom: subtitle ? getSpacing("sm") : getSpacing("md"),
    }),
    [titleAlign, subtitle, getSpacing]
  );

  const subtitleTextStyle = useMemo(
    (): any => ({
      textAlign: titleAlign,
      marginBottom: getSpacing("md"),
      opacity: 0.7,
    }),
    [titleAlign, getSpacing]
  );

  return (
    <View style={[sectionStyle, style]}>
      {(title || subtitle) && (
        <View style={headerStyle}>
          {title && (
            <Text style={[styles.sectionTitle, headerTextStyle]}>{title}</Text>
          )}
          {subtitle && (
            <Text style={[styles.sectionSubtitle, subtitleTextStyle]}>
              {subtitle}
            </Text>
          )}
        </View>
      )}
      <View style={contentStyle}>{children}</View>
    </View>
  );
};

// =============================================================================
// RESPONSIVE SPACER
// =============================================================================

interface ResponsiveSpacerProps {
  size?: ResponsiveValue<SpacingSize>;
  direction?: "horizontal" | "vertical";
}

const ResponsiveSpacer: React.FC<ResponsiveSpacerProps> = ({
  size,
  direction = "vertical",
}) => {
  const getSpacing = useResponsiveSpacing();
  const responsiveSize = useResponsiveValue(size || { default: "md" });
  const spacingValue = getSpacing(responsiveSize as SpacingSize);

  const spacerStyle = useMemo((): ViewStyle => {
    if (direction === "horizontal") {
      return { width: spacingValue };
    }
    return { height: spacingValue };
  }, [direction, spacingValue]);

  return <View style={spacerStyle} />;
};

// =============================================================================
// STYLES
// =============================================================================

const styles = StyleSheet.create({
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#11181C",
  },
  sectionSubtitle: {
    fontSize: 14,
    fontWeight: "500",
    color: "#11181C",
  },
});

// =============================================================================
// EXPORTS
// =============================================================================

export default ResponsiveContainer;
export { ResponsiveGrid, ResponsiveSection, ResponsiveSpacer, ResponsiveStack };

export type {
  ResponsiveContainerProps,
  ResponsiveGridProps,
  ResponsiveSectionProps,
  ResponsiveSpacerProps,
  ResponsiveStackProps,
};
