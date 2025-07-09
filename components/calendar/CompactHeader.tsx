// CompactHeader - Space-optimized header for calendar screen
// Reduces white space while maintaining functionality and accessibility

import React, { useMemo } from "react";
import {
  StyleSheet,
  Text,
  TextStyle,
  TouchableOpacity,
  View,
  ViewStyle,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useThemeColor } from "../../hooks/useThemeColor";
import { useCalendarColorScheme } from "./ColorSchemeProvider";

// =============================================================================
// MAIN COMPONENT
// =============================================================================

interface CompactHeaderPropsExtended {
  title: string;
  subtitle?: string;
  showBackButton?: boolean;
  showSettingsButton?: boolean;
  showLegend?: boolean;
  onBackPress?: () => void;
  onSettingsPress?: () => void;
  onLegendToggle?: () => void;
  rightElement?: React.ReactNode;
  style?: any;
  height?: "auto" | "compact" | "standard" | number;
  showShadow?: boolean;
  accessibilityLabel?: string;
}

const CompactHeader: React.FC<CompactHeaderPropsExtended> = ({
  title,
  subtitle,
  showBackButton = false,
  showSettingsButton = false,
  showLegend = true,
  onBackPress,
  onSettingsPress,
  onLegendToggle,
  rightElement,
  style,
  height = "auto",
  showShadow = true,
  accessibilityLabel,
}) => {
  const insets = useSafeAreaInsets();
  const { colorScheme } = useCalendarColorScheme();

  // Theme colors
  const backgroundColor = useThemeColor(
    { light: "#FFFFFF", dark: "#1C1C1E" },
    "background"
  );
  const textColor = useThemeColor(
    { light: "#000000", dark: "#FFFFFF" },
    "text"
  );
  const borderColor = useThemeColor(
    { light: "#E5E5E7", dark: "#38383A" },
    "text"
  );

  // Calculate header height
  const headerHeight = useMemo(() => {
    if (height === "compact") return 44;
    if (height === "standard") return 56;
    if (typeof height === "number") return height;

    // Auto height based on content
    const baseHeight = subtitle ? 56 : 44;
    return baseHeight;
  }, [height, subtitle]);

  // Container styles
  const containerStyle = useMemo((): ViewStyle => {
    return {
      backgroundColor,
      paddingTop: insets.top,
      height: headerHeight + insets.top,
      borderBottomWidth: showShadow ? StyleSheet.hairlineWidth : 0,
      borderBottomColor: borderColor,
      ...style,
    };
  }, [
    backgroundColor,
    insets.top,
    headerHeight,
    showShadow,
    borderColor,
    style,
  ]);

  // Content styles
  const contentStyle = useMemo((): ViewStyle => {
    return {
      height: headerHeight,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 16,
    };
  }, [headerHeight]);

  const titleStyle = useMemo((): TextStyle => {
    return {
      fontSize: subtitle ? 18 : 20,
      fontWeight: "600",
      color: textColor,
      flex: 1,
      textAlign: "center",
      marginHorizontal: 8,
    };
  }, [subtitle, textColor]);

  const subtitleStyle = useMemo((): TextStyle => {
    return {
      fontSize: 14,
      color: textColor,
      opacity: 0.7,
      textAlign: "center",
    };
  }, [textColor]);

  // Generate accessibility label
  const generatedAccessibilityLabel = useMemo(() => {
    if (accessibilityLabel) return accessibilityLabel;

    const parts = [title];
    if (subtitle) parts.push(subtitle);
    if (showLegend) parts.push("Legend available");

    return parts.join(", ");
  }, [accessibilityLabel, title, subtitle, showLegend]);

  return (
    <View
      style={containerStyle}
      accessible={true}
      accessibilityRole="header"
      accessibilityLabel={generatedAccessibilityLabel}
    >
      <View style={contentStyle}>
        {/* Left side - Back button or spacer */}
        <View style={styles.leftSection}>
          {showBackButton && onBackPress ? (
            <TouchableOpacity
              onPress={onBackPress}
              style={styles.iconButton}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel="Go back"
              accessibilityHint="Navigate to previous screen"
            >
              <Text style={[styles.iconText, { color: textColor }]}>‹</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.iconButton} />
          )}
        </View>

        {/* Center - Title and subtitle */}
        <View style={styles.centerSection}>
          <Text style={titleStyle} numberOfLines={1}>
            {title}
          </Text>
          {subtitle && (
            <Text style={subtitleStyle} numberOfLines={1}>
              {subtitle}
            </Text>
          )}
        </View>

        {/* Right side - Settings, Legend, or custom element */}
        <View style={styles.rightSection}>
          {rightElement ? (
            rightElement
          ) : (
            <View style={styles.rightActions}>
              {showLegend && onLegendToggle && (
                <TouchableOpacity
                  onPress={onLegendToggle}
                  style={styles.iconButton}
                  accessible={true}
                  accessibilityRole="button"
                  accessibilityLabel="Toggle legend"
                  accessibilityHint="Show or hide calendar legend"
                >
                  <LegendIcon colorScheme={colorScheme} />
                </TouchableOpacity>
              )}

              {showSettingsButton && onSettingsPress && (
                <TouchableOpacity
                  onPress={onSettingsPress}
                  style={styles.iconButton}
                  accessible={true}
                  accessibilityRole="button"
                  accessibilityLabel="Settings"
                  accessibilityHint="Open calendar settings"
                >
                  <Text style={[styles.iconText, { color: textColor }]}>⚙</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>
      </View>

      {/* Optional integrated legend */}
      {showLegend && <IntegratedLegend colorScheme={colorScheme} />}
    </View>
  );
};

// =============================================================================
// LEGEND ICON COMPONENT
// =============================================================================

interface LegendIconProps {
  colorScheme: any;
}

const LegendIcon: React.FC<LegendIconProps> = ({ colorScheme }) => {
  return (
    <View style={styles.legendIcon}>
      <View
        style={[
          styles.legendDot,
          { backgroundColor: colorScheme.expired.primary },
        ]}
      />
      <View
        style={[
          styles.legendDot,
          { backgroundColor: colorScheme.today.primary },
        ]}
      />
      <View
        style={[
          styles.legendDot,
          { backgroundColor: colorScheme.future.primary },
        ]}
      />
    </View>
  );
};

// =============================================================================
// INTEGRATED LEGEND COMPONENT
// =============================================================================

interface IntegratedLegendProps {
  colorScheme: any;
}

const IntegratedLegend: React.FC<IntegratedLegendProps> = ({ colorScheme }) => {
  const textColor = useThemeColor(
    { light: "#666666", dark: "#999999" },
    "text"
  );

  return (
    <View style={styles.integratedLegend}>
      <LegendItem
        color={colorScheme.expired.primary}
        label="Expired"
        textColor={textColor}
      />
      <LegendItem
        color={colorScheme.today.primary}
        label="Today"
        textColor={textColor}
      />
      <LegendItem
        color={colorScheme.future.primary}
        label="Future"
        textColor={textColor}
      />
    </View>
  );
};

// =============================================================================
// LEGEND ITEM COMPONENT
// =============================================================================

interface LegendItemProps {
  color: string;
  label: string;
  textColor: string;
}

const LegendItem: React.FC<LegendItemProps> = ({ color, label, textColor }) => {
  return (
    <View style={styles.legendItem}>
      <View style={[styles.legendItemDot, { backgroundColor: color }]} />
      <Text style={[styles.legendItemText, { color: textColor }]}>{label}</Text>
    </View>
  );
};

// =============================================================================
// UTILITY COMPONENTS
// =============================================================================

/**
 * Minimal header variant for maximum space efficiency
 */
interface MinimalHeaderProps {
  title: string;
  onMenuPress?: () => void;
  rightElement?: React.ReactNode;
}

export const MinimalHeader: React.FC<MinimalHeaderProps> = ({
  title,
  onMenuPress,
  rightElement,
}) => {
  const insets = useSafeAreaInsets();
  const backgroundColor = useThemeColor(
    { light: "#FFFFFF", dark: "#1C1C1E" },
    "background"
  );
  const textColor = useThemeColor(
    { light: "#000000", dark: "#FFFFFF" },
    "text"
  );

  return (
    <View
      style={[
        styles.minimalContainer,
        { backgroundColor, paddingTop: insets.top + 8 },
      ]}
    >
      <View style={styles.minimalContent}>
        {onMenuPress && (
          <TouchableOpacity
            onPress={onMenuPress}
            style={styles.minimalButton}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel="Menu"
          >
            <Text style={[styles.iconText, { color: textColor }]}>☰</Text>
          </TouchableOpacity>
        )}

        <Text style={[styles.minimalTitle, { color: textColor }]}>{title}</Text>

        {rightElement ? rightElement : <View style={styles.minimalButton} />}
      </View>
    </View>
  );
};

/**
 * Header with integrated quick actions
 */
interface QuickActionHeaderProps {
  title: string;
  actions: {
    icon: string;
    label: string;
    onPress: () => void;
  }[];
}

export const QuickActionHeader: React.FC<QuickActionHeaderProps> = ({
  title,
  actions,
}) => {
  const insets = useSafeAreaInsets();
  const backgroundColor = useThemeColor(
    { light: "#FFFFFF", dark: "#1C1C1E" },
    "background"
  );
  const textColor = useThemeColor(
    { light: "#000000", dark: "#FFFFFF" },
    "text"
  );

  return (
    <View
      style={[
        styles.quickActionContainer,
        { backgroundColor, paddingTop: insets.top },
      ]}
    >
      <View style={styles.quickActionHeader}>
        <Text style={[styles.quickActionTitle, { color: textColor }]}>
          {title}
        </Text>
      </View>

      <View style={styles.quickActions}>
        {actions.map((action, index) => (
          <TouchableOpacity
            key={action.label}
            onPress={action.onPress}
            style={styles.quickAction}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel={action.label}
          >
            <Text style={[styles.iconText, { color: textColor }]}>
              {action.icon}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

// =============================================================================
// STYLES
// =============================================================================

const styles = StyleSheet.create({
  leftSection: {
    width: 44,
    alignItems: "flex-start",
  },
  centerSection: {
    flex: 1,
    alignItems: "center",
  },
  rightSection: {
    width: 44,
    alignItems: "flex-end",
  },
  rightActions: {
    flexDirection: "row",
    alignItems: "center",
  },
  iconButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  iconText: {
    fontSize: 18,
    fontWeight: "600",
  },
  legendIcon: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  legendDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  integratedLegend: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 8,
    gap: 16,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  legendItemDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendItemText: {
    fontSize: 12,
    fontWeight: "500",
  },
  // Minimal header styles
  minimalContainer: {
    paddingBottom: 8,
  },
  minimalContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    height: 32,
  },
  minimalButton: {
    width: 32,
    height: 32,
    justifyContent: "center",
    alignItems: "center",
  },
  minimalTitle: {
    fontSize: 16,
    fontWeight: "600",
    flex: 1,
    textAlign: "center",
  },
  // Quick action header styles
  quickActionContainer: {
    paddingBottom: 8,
  },
  quickActionHeader: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  quickActionTitle: {
    fontSize: 18,
    fontWeight: "600",
    textAlign: "center",
  },
  quickActions: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 24,
    paddingHorizontal: 16,
  },
  quickAction: {
    width: 40,
    height: 32,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 8,
  },
});

// =============================================================================
// EXPORT
// =============================================================================

CompactHeader.displayName = "CompactHeader";
MinimalHeader.displayName = "MinimalHeader";
QuickActionHeader.displayName = "QuickActionHeader";

export default CompactHeader;
