// Responsive Utilities - Phase 2 Implementation
// Comprehensive responsive design system for mobile, tablet, and desktop breakpoints

import { useCallback, useEffect, useState } from "react";
import { Dimensions, Platform, ScaledSize } from "react-native";

// =============================================================================
// BREAKPOINT SYSTEM (PHASE 2 SPECIFICATIONS)
// =============================================================================

export const BREAKPOINTS = {
  // Mobile breakpoints
  mobile: {
    small: 320, // Small phones
    medium: 375, // iPhone standard
    large: 414, // Large phones
  },
  // Tablet breakpoints
  tablet: {
    small: 768, // iPad mini
    medium: 834, // iPad Air
    large: 1024, // iPad Pro 11"
  },
  // Desktop breakpoints (for future expansion)
  desktop: {
    small: 1280, // Small desktop
    medium: 1440, // Standard desktop
    large: 1920, // Large desktop
  },
} as const;

export type DeviceType = "mobile" | "tablet" | "desktop";
export type DeviceSize = "small" | "medium" | "large";

// =============================================================================
// DEVICE DETECTION
// =============================================================================

export interface DeviceInfo {
  type: DeviceType;
  size: DeviceSize;
  width: number;
  height: number;
  isLandscape: boolean;
  isPortrait: boolean;
  aspectRatio: number;
  pixelRatio: number;
  isIOS: boolean;
  isAndroid: boolean;
}

export function getDeviceInfo(dimensions?: ScaledSize): DeviceInfo {
  const screen = dimensions || Dimensions.get("window");
  const { width, height } = screen;
  const aspectRatio = width / height;
  const isLandscape = width > height;
  const isPortrait = !isLandscape;
  const pixelRatio = Dimensions.get("screen").scale;

  // Determine device type and size
  let type: DeviceType = "mobile";
  let size: DeviceSize = "medium";

  if (width >= BREAKPOINTS.desktop.small) {
    type = "desktop";
    if (width >= BREAKPOINTS.desktop.large) size = "large";
    else if (width >= BREAKPOINTS.desktop.medium) size = "medium";
    else size = "small";
  } else if (width >= BREAKPOINTS.tablet.small) {
    type = "tablet";
    if (width >= BREAKPOINTS.tablet.large) size = "large";
    else if (width >= BREAKPOINTS.tablet.medium) size = "medium";
    else size = "small";
  } else {
    type = "mobile";
    if (width >= BREAKPOINTS.mobile.large) size = "large";
    else if (width >= BREAKPOINTS.mobile.medium) size = "medium";
    else size = "small";
  }

  return {
    type,
    size,
    width,
    height,
    isLandscape,
    isPortrait,
    aspectRatio,
    pixelRatio,
    isIOS: Platform.OS === "ios",
    isAndroid: Platform.OS === "android",
  };
}

// =============================================================================
// RESPONSIVE HOOKS
// =============================================================================

export function useDeviceInfo(): DeviceInfo {
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo>(() =>
    getDeviceInfo()
  );

  useEffect(() => {
    const subscription = Dimensions.addEventListener("change", ({ window }) => {
      setDeviceInfo(getDeviceInfo(window));
    });

    return () => subscription?.remove();
  }, []);

  return deviceInfo;
}

export function useBreakpoint() {
  const deviceInfo = useDeviceInfo();

  return {
    isMobile: deviceInfo.type === "mobile",
    isTablet: deviceInfo.type === "tablet",
    isDesktop: deviceInfo.type === "desktop",
    isSmall: deviceInfo.size === "small",
    isMedium: deviceInfo.size === "medium",
    isLarge: deviceInfo.size === "large",
    width: deviceInfo.width,
    height: deviceInfo.height,
    device: `${deviceInfo.type}.${deviceInfo.size}` as const,
  };
}

export function useOrientation() {
  const deviceInfo = useDeviceInfo();

  return {
    isLandscape: deviceInfo.isLandscape,
    isPortrait: deviceInfo.isPortrait,
    aspectRatio: deviceInfo.aspectRatio,
  };
}

// =============================================================================
// RESPONSIVE STYLE HELPERS
// =============================================================================

export interface ResponsiveValue<T> {
  mobile?: {
    small?: T;
    medium?: T;
    large?: T;
  };
  tablet?: {
    small?: T;
    medium?: T;
    large?: T;
  };
  desktop?: {
    small?: T;
    medium?: T;
    large?: T;
  };
  default?: T;
}

export function getResponsiveValue<T>(
  responsiveValue: ResponsiveValue<T>,
  deviceInfo: DeviceInfo
): T | undefined {
  const deviceSpecific = responsiveValue[deviceInfo.type]?.[deviceInfo.size];
  if (deviceSpecific !== undefined) return deviceSpecific;

  // Fallback to device type default
  const deviceDefault = responsiveValue[deviceInfo.type];
  if (deviceDefault && typeof deviceDefault === "object") {
    const fallbackOrder: DeviceSize[] = ["medium", "large", "small"];
    for (const fallbackSize of fallbackOrder) {
      const fallback = deviceDefault[fallbackSize];
      if (fallback !== undefined) return fallback;
    }
  }

  // Final fallback
  return responsiveValue.default;
}

export function useResponsiveValue<T>(
  responsiveValue: ResponsiveValue<T>
): T | undefined {
  const deviceInfo = useDeviceInfo();
  return getResponsiveValue(responsiveValue, deviceInfo);
}

// =============================================================================
// LAYOUT HELPERS
// =============================================================================

export interface LayoutConfig {
  columns: number;
  gap: number;
  padding: number;
  maxItemsPerRow?: number;
  minItemWidth?: number;
}

export function calculateLayout(
  containerWidth: number,
  config: ResponsiveValue<LayoutConfig>,
  deviceInfo: DeviceInfo
): LayoutConfig & { itemWidth: number } {
  const layoutConfig = getResponsiveValue(config, deviceInfo) || {
    columns: 1,
    gap: 12,
    padding: 16,
  };

  const availableWidth = containerWidth - layoutConfig.padding * 2;
  const totalGapWidth = (layoutConfig.columns - 1) * layoutConfig.gap;
  const itemWidth = (availableWidth - totalGapWidth) / layoutConfig.columns;

  return {
    ...layoutConfig,
    itemWidth: Math.max(itemWidth, layoutConfig.minItemWidth || 0),
  };
}

export function useResponsiveLayout(config: ResponsiveValue<LayoutConfig>) {
  const deviceInfo = useDeviceInfo();

  return useCallback(
    (containerWidth: number) => {
      return calculateLayout(containerWidth, config, deviceInfo);
    },
    [config, deviceInfo]
  );
}

// =============================================================================
// SPACING & TYPOGRAPHY SCALES
// =============================================================================

export const RESPONSIVE_SPACING = {
  mobile: {
    small: { xs: 4, sm: 8, md: 12, lg: 16, xl: 20 },
    medium: { xs: 4, sm: 8, md: 12, lg: 16, xl: 24 },
    large: { xs: 6, sm: 10, md: 14, lg: 18, xl: 28 },
  },
  tablet: {
    small: { xs: 6, sm: 12, md: 18, lg: 24, xl: 32 },
    medium: { xs: 8, sm: 14, md: 20, lg: 28, xl: 36 },
    large: { xs: 10, sm: 16, md: 24, lg: 32, xl: 40 },
  },
  desktop: {
    small: { xs: 8, sm: 16, md: 24, lg: 32, xl: 48 },
    medium: { xs: 10, sm: 18, md: 28, lg: 36, xl: 56 },
    large: { xs: 12, sm: 20, md: 32, lg: 40, xl: 64 },
  },
} as const;

export const RESPONSIVE_TYPOGRAPHY = {
  mobile: {
    small: {
      xs: 10,
      sm: 12,
      md: 14,
      lg: 16,
      xl: 18,
      xxl: 20,
      heading: { sm: 18, md: 20, lg: 24, xl: 28 },
    },
    medium: {
      xs: 11,
      sm: 13,
      md: 15,
      lg: 17,
      xl: 19,
      xxl: 22,
      heading: { sm: 20, md: 22, lg: 26, xl: 30 },
    },
    large: {
      xs: 12,
      sm: 14,
      md: 16,
      lg: 18,
      xl: 20,
      xxl: 24,
      heading: { sm: 22, md: 24, lg: 28, xl: 32 },
    },
  },
  tablet: {
    small: {
      xs: 13,
      sm: 15,
      md: 17,
      lg: 19,
      xl: 22,
      xxl: 26,
      heading: { sm: 24, md: 28, lg: 32, xl: 36 },
    },
    medium: {
      xs: 14,
      sm: 16,
      md: 18,
      lg: 20,
      xl: 24,
      xxl: 28,
      heading: { sm: 26, md: 30, lg: 34, xl: 38 },
    },
    large: {
      xs: 15,
      sm: 17,
      md: 19,
      lg: 22,
      xl: 26,
      xxl: 30,
      heading: { sm: 28, md: 32, lg: 36, xl: 40 },
    },
  },
  desktop: {
    small: {
      xs: 16,
      sm: 18,
      md: 20,
      lg: 24,
      xl: 28,
      xxl: 32,
      heading: { sm: 30, md: 34, lg: 38, xl: 42 },
    },
    medium: {
      xs: 17,
      sm: 19,
      md: 22,
      lg: 26,
      xl: 30,
      xxl: 34,
      heading: { sm: 32, md: 36, lg: 40, xl: 44 },
    },
    large: {
      xs: 18,
      sm: 20,
      md: 24,
      lg: 28,
      xl: 32,
      xxl: 36,
      heading: { sm: 34, md: 38, lg: 42, xl: 46 },
    },
  },
} as const;

export type SpacingSize = "xs" | "sm" | "md" | "lg" | "xl";
export type TypographySize = "xs" | "sm" | "md" | "lg" | "xl" | "xxl";
export type HeadingSize = "sm" | "md" | "lg" | "xl";

export function useResponsiveSpacing() {
  const deviceInfo = useDeviceInfo();

  return useCallback(
    (size: SpacingSize): number => {
      return RESPONSIVE_SPACING[deviceInfo.type][deviceInfo.size][size];
    },
    [deviceInfo]
  );
}

export function useResponsiveTypography() {
  const deviceInfo = useDeviceInfo();

  return useCallback(
    (size: TypographySize | HeadingSize, isHeading = false): number => {
      const scale = RESPONSIVE_TYPOGRAPHY[deviceInfo.type][deviceInfo.size];

      if (isHeading && "heading" in scale) {
        return scale.heading[size as HeadingSize] || scale.md;
      }

      return scale[size as TypographySize] || scale.md;
    },
    [deviceInfo]
  );
}

// =============================================================================
// ADAPTIVE COMPONENT HELPERS
// =============================================================================

export interface GridConfig {
  minItemWidth: number;
  maxColumns: number;
  gap: number;
  aspectRatio?: number;
}

export function calculateGridLayout(
  containerWidth: number,
  config: GridConfig
): { columns: number; itemWidth: number; gap: number } {
  const { minItemWidth, maxColumns, gap, aspectRatio } = config;

  // Calculate optimal number of columns
  const availableWidth = containerWidth - gap;
  let columns = Math.floor(availableWidth / (minItemWidth + gap));
  columns = Math.min(columns, maxColumns);
  columns = Math.max(columns, 1);

  // Calculate item width
  const totalGapWidth = (columns - 1) * gap;
  let itemWidth = (containerWidth - totalGapWidth) / columns;

  // Adjust for aspect ratio if provided
  if (aspectRatio) {
    const itemHeight = itemWidth / aspectRatio;
    // Ensure minimum readable height
    if (itemHeight < 80) {
      const newItemHeight = 80;
      itemWidth = newItemHeight * aspectRatio;
      // Recalculate columns with new width
      columns = Math.floor(containerWidth / (itemWidth + gap));
      columns = Math.max(columns, 1);
      itemWidth = (containerWidth - (columns - 1) * gap) / columns;
    }
  }

  return { columns, itemWidth, gap };
}

export function useAdaptiveGrid(config: ResponsiveValue<GridConfig>) {
  const deviceInfo = useDeviceInfo();

  return useCallback(
    (containerWidth: number) => {
      const gridConfig = getResponsiveValue(config, deviceInfo);
      if (!gridConfig) {
        return { columns: 1, itemWidth: containerWidth, gap: 12 };
      }

      return calculateGridLayout(containerWidth, gridConfig);
    },
    [config, deviceInfo]
  );
}

// =============================================================================
// ANIMATION HELPERS
// =============================================================================

export function getResponsiveAnimationDuration(
  baseMs: number,
  deviceInfo: DeviceInfo
): number {
  // Adjust animation duration based on device performance expectations
  const multiplier =
    deviceInfo.type === "mobile"
      ? 1.0
      : deviceInfo.type === "tablet"
      ? 0.9
      : 0.8;

  return Math.round(baseMs * multiplier);
}

export function useResponsiveAnimationDuration() {
  const deviceInfo = useDeviceInfo();

  return useCallback(
    (baseMs: number): number => {
      return getResponsiveAnimationDuration(baseMs, deviceInfo);
    },
    [deviceInfo]
  );
}

// =============================================================================
// ACCESSIBILITY HELPERS
// =============================================================================

export function getResponsiveHitSlop(deviceInfo: DeviceInfo) {
  const base =
    deviceInfo.type === "mobile" ? 10 : deviceInfo.type === "tablet" ? 8 : 6;

  return { top: base, right: base, bottom: base, left: base };
}

export function useResponsiveHitSlop() {
  const deviceInfo = useDeviceInfo();
  return getResponsiveHitSlop(deviceInfo);
}

// =============================================================================
// CONDITIONAL RENDERING HELPERS
// =============================================================================

export function useResponsiveRender() {
  const deviceInfo = useDeviceInfo();

  return {
    mobile: useCallback(
      (component: React.ReactNode) =>
        deviceInfo.type === "mobile" ? component : null,
      [deviceInfo.type]
    ),
    tablet: useCallback(
      (component: React.ReactNode) =>
        deviceInfo.type === "tablet" ? component : null,
      [deviceInfo.type]
    ),
    desktop: useCallback(
      (component: React.ReactNode) =>
        deviceInfo.type === "desktop" ? component : null,
      [deviceInfo.type]
    ),
    mobileOrTablet: useCallback(
      (component: React.ReactNode) =>
        deviceInfo.type !== "desktop" ? component : null,
      [deviceInfo.type]
    ),
    tabletOrDesktop: useCallback(
      (component: React.ReactNode) =>
        deviceInfo.type !== "mobile" ? component : null,
      [deviceInfo.type]
    ),
  };
}
