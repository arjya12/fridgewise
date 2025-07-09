// PerformanceOptimizedCalendar - Advanced performance optimizations
// Implements memoization, virtualization, and efficient re-rendering strategies

import React, {
  memo,
  startTransition,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Dimensions,
  InteractionManager,
  LayoutAnimation,
  Platform,
  StyleSheet,
  UIManager,
  View,
  ViewStyle,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { FoodItem } from "../../lib/supabase";
import { CalendarMonth } from "../../types/calendar";
import {
  CalendarPerformanceMetrics,
  PerformanceOptimizedCalendarProps,
} from "../../types/calendar-enhanced";
import {
  calculateExpiryStatistics,
  createEnhancedMarkedDates,
} from "../../utils/calendarEnhancedDataUtils";
import CalendarLegendIntegrated from "./CalendarLegendIntegrated";
import { useCalendarColorScheme } from "./ColorSchemeProvider";
import EnhancedCalendarCore from "./EnhancedCalendarCore";
import OptimizedInformationPanel from "./OptimizedInformationPanel";

// Enable LayoutAnimation on Android
if (
  Platform.OS === "android" &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

// =============================================================================
// PERFORMANCE MONITORING
// =============================================================================

class PerformanceMonitor {
  private metrics: CalendarPerformanceMetrics = {
    renderTime: 0,
    dataProcessingTime: 0,
    memoryUsage: 0,
    reRenderCount: 0,
  };

  private startTime: number = 0;

  startRender(): void {
    this.startTime = performance.now();
  }

  endRender(): void {
    this.metrics.renderTime = performance.now() - this.startTime;
    this.metrics.reRenderCount++;
  }

  startDataProcessing(): void {
    this.startTime = performance.now();
  }

  endDataProcessing(): void {
    this.metrics.dataProcessingTime = performance.now() - this.startTime;
  }

  getMetrics(): CalendarPerformanceMetrics {
    return { ...this.metrics };
  }

  reset(): void {
    this.metrics = {
      renderTime: 0,
      dataProcessingTime: 0,
      memoryUsage: 0,
      reRenderCount: 0,
    };
  }
}

// =============================================================================
// MEMOIZED COMPONENTS
// =============================================================================

const MemoizedCalendarCore = memo(
  EnhancedCalendarCore,
  (prevProps, nextProps) => {
    // Custom comparison for better memoization
    return (
      prevProps.selectedDate === nextProps.selectedDate &&
      prevProps.items.length === nextProps.items.length &&
      prevProps.loading === nextProps.loading &&
      JSON.stringify(prevProps.markedDates) ===
        JSON.stringify(nextProps.markedDates)
    );
  }
);

const MemoizedLegend = memo(
  CalendarLegendIntegrated,
  (prevProps, nextProps) => {
    return (
      prevProps.compact === nextProps.compact &&
      prevProps.position === nextProps.position &&
      prevProps.showPatterns === nextProps.showPatterns
    );
  }
);

const MemoizedInformationPanel = memo(
  OptimizedInformationPanel,
  (prevProps, nextProps) => {
    return (
      prevProps.selectedDate === nextProps.selectedDate &&
      prevProps.layout === nextProps.layout &&
      prevProps.maxHeight === nextProps.maxHeight
    );
  }
);

// =============================================================================
// VIRTUALIZATION HELPERS
// =============================================================================

interface VirtualizedItemsConfig {
  windowSize: number;
  renderAhead: number;
  renderBehind: number;
}

const DEFAULT_VIRTUALIZATION_CONFIG: VirtualizedItemsConfig = {
  windowSize: 50,
  renderAhead: 20,
  renderBehind: 10,
};

function useVirtualizedItems(
  items: FoodItem[],
  config: VirtualizedItemsConfig = DEFAULT_VIRTUALIZATION_CONFIG
) {
  const [visibleRange, setVisibleRange] = useState({
    start: 0,
    end: config.windowSize,
  });

  const virtualizedItems = useMemo(() => {
    return items.slice(visibleRange.start, visibleRange.end);
  }, [items, visibleRange]);

  const updateVisibleRange = useCallback((newStart: number, newEnd: number) => {
    startTransition(() => {
      setVisibleRange({ start: newStart, end: newEnd });
    });
  }, []);

  return {
    virtualizedItems,
    updateVisibleRange,
    totalCount: items.length,
    isVirtualized: items.length > config.windowSize,
  };
}

// =============================================================================
// PERFORMANCE HOOKS
// =============================================================================

function usePerformanceOptimization() {
  const performanceMonitor = useRef(new PerformanceMonitor());
  const [metrics, setMetrics] = useState<CalendarPerformanceMetrics>();

  const startRender = useCallback(() => {
    performanceMonitor.current.startRender();
  }, []);

  const endRender = useCallback(() => {
    performanceMonitor.current.endRender();
    setMetrics(performanceMonitor.current.getMetrics());
  }, []);

  const startDataProcessing = useCallback(() => {
    performanceMonitor.current.startDataProcessing();
  }, []);

  const endDataProcessing = useCallback(() => {
    performanceMonitor.current.endDataProcessing();
  }, []);

  return {
    startRender,
    endRender,
    startDataProcessing,
    endDataProcessing,
    metrics,
  };
}

function useDebounced<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

const PerformanceOptimizedCalendar: React.FC<
  PerformanceOptimizedCalendarProps
> = ({
  items = [],
  selectedDate,
  onDatePress,
  onMonthChange,
  colorScheme: propColorScheme,
  virtualization = { enabled: true, itemThreshold: 100 },
  performanceMode = "balanced",
  onPerformanceMetrics,
  enableAnimations = true,
  debounceDelay = 300,
  style,
  testID = "performance-optimized-calendar",
}) => {
  const insets = useSafeAreaInsets();
  const { colorScheme: contextColorScheme } = useCalendarColorScheme();
  const performance = usePerformanceOptimization();

  // Performance mode configuration
  const performanceConfig = useMemo(() => {
    switch (performanceMode) {
      case "high":
        return {
          enableMemoization: true,
          enableVirtualization: true,
          enableDebouncing: true,
          animationDuration: 150,
          updateFrequency: "low",
        };
      case "balanced":
        return {
          enableMemoization: true,
          enableVirtualization: items.length > 50,
          enableDebouncing: true,
          animationDuration: 250,
          updateFrequency: "medium",
        };
      case "quality":
        return {
          enableMemoization: false,
          enableVirtualization: false,
          enableDebouncing: false,
          animationDuration: 350,
          updateFrequency: "high",
        };
      default:
        return {
          enableMemoization: true,
          enableVirtualization: true,
          enableDebouncing: true,
          animationDuration: 250,
          updateFrequency: "medium",
        };
    }
  }, [performanceMode, items.length]);

  // Use prop color scheme or context color scheme
  const activeColorScheme = propColorScheme || contextColorScheme;

  // Debounced values for performance
  const debouncedItems = useDebounced(
    items,
    performanceConfig.enableDebouncing ? debounceDelay : 0
  );
  const debouncedSelectedDate = useDebounced(
    selectedDate,
    performanceConfig.enableDebouncing ? debounceDelay / 2 : 0
  );

  // Virtualization for large datasets
  const { virtualizedItems, updateVisibleRange, totalCount, isVirtualized } =
    useVirtualizedItems(
      debouncedItems,
      virtualization.enabled
        ? {
            windowSize: virtualization.windowSize || 50,
            renderAhead: virtualization.renderAhead || 20,
            renderBehind: virtualization.renderBehind || 10,
          }
        : { windowSize: debouncedItems.length, renderAhead: 0, renderBehind: 0 }
    );

  // Use virtualized items if enabled and threshold met
  const effectiveItems = useMemo(() => {
    if (performanceConfig.enableVirtualization && isVirtualized) {
      return virtualizedItems;
    }
    return debouncedItems;
  }, [
    performanceConfig.enableVirtualization,
    isVirtualized,
    virtualizedItems,
    debouncedItems,
  ]);

  // Memoized data processing
  const processedData = useMemo(() => {
    performance.startDataProcessing();

    // Group items by date
    const itemsByDate: Record<string, FoodItem[]> = {};
    effectiveItems.forEach((item) => {
      if (item.expiry_date) {
        if (!itemsByDate[item.expiry_date]) {
          itemsByDate[item.expiry_date] = [];
        }
        itemsByDate[item.expiry_date].push(item);
      }
    });

    // Create enhanced marked dates
    const markedDates = createEnhancedMarkedDates(
      itemsByDate,
      activeColorScheme,
      {
        showItemCounts: true,
        usePatterns: false,
        maxDotsPerDate: 3,
      }
    );

    // Calculate statistics
    const statistics = calculateExpiryStatistics(
      effectiveItems,
      activeColorScheme
    );

    performance.endDataProcessing();

    return {
      itemsByDate,
      markedDates,
      statistics,
    };
  }, [effectiveItems, activeColorScheme, performance]);

  // Handle date press with performance optimization
  const handleDatePress = useCallback(
    (dateString: string, dateInfo?: any) => {
      if (enableAnimations) {
        LayoutAnimation.configureNext({
          duration: performanceConfig.animationDuration,
          create: { type: "easeInEaseOut", property: "opacity" },
          update: { type: "easeInEaseOut" },
        });
      }

      // Use InteractionManager for smooth animations
      InteractionManager.runAfterInteractions(() => {
        onDatePress?.(dateString, dateInfo);
      });
    },
    [onDatePress, enableAnimations, performanceConfig.animationDuration]
  );

  // Handle month change with debouncing
  const handleMonthChange = useCallback(
    (month: CalendarMonth) => {
      // Reset virtualization when month changes
      if (isVirtualized) {
        updateVisibleRange(0, virtualization.windowSize || 50);
      }

      onMonthChange?.(month);
    },
    [
      onMonthChange,
      isVirtualized,
      updateVisibleRange,
      virtualization.windowSize,
    ]
  );

  // Performance metrics reporting
  useEffect(() => {
    if (performance.metrics && onPerformanceMetrics) {
      onPerformanceMetrics(performance.metrics);
    }
  }, [performance.metrics, onPerformanceMetrics]);

  // Render optimization
  useEffect(() => {
    performance.startRender();
    return () => {
      performance.endRender();
    };
  });

  // Container styles
  const containerStyle = useMemo((): ViewStyle => {
    return {
      flex: 1,
      paddingTop: insets.top,
      ...style,
    };
  }, [insets.top, style]);

  // Component selection based on performance config
  const CalendarComponent = performanceConfig.enableMemoization
    ? MemoizedCalendarCore
    : EnhancedCalendarCore;
  const LegendComponent = performanceConfig.enableMemoization
    ? MemoizedLegend
    : CalendarLegendIntegrated;
  const PanelComponent = performanceConfig.enableMemoization
    ? MemoizedInformationPanel
    : OptimizedInformationPanel;

  return (
    <View style={containerStyle} testID={testID}>
      {/* Performance-optimized Calendar Core */}
      <CalendarComponent
        items={effectiveItems}
        selectedDate={debouncedSelectedDate}
        onDatePress={handleDatePress}
        onMonthChange={handleMonthChange}
        markedDates={processedData.markedDates}
        colorScheme={activeColorScheme}
        accessibilityEnhanced={true}
        itemCountIndicators={true}
        patternIndicators={false}
        dotIndicators={{
          maxDots: 3,
          size: "small",
          spacing: 2,
          showCount: true,
          patterns: false,
        }}
        style={styles.calendar}
      />

      {/* Performance-optimized Legend */}
      <LegendComponent
        position="inline"
        compact={true}
        colorScheme={activeColorScheme}
        accessibility={true}
        showPatterns={false}
        style={styles.legend}
      />

      {/* Performance-optimized Information Panel */}
      <PanelComponent
        selectedDate={debouncedSelectedDate}
        items={effectiveItems}
        layout="adaptive"
        sections={["summary", "items"]}
        collapsible={true}
        maxHeight={Dimensions.get("window").height * 0.4}
        onItemPress={(item: FoodItem) => {
          // Handle item press with performance optimization
          InteractionManager.runAfterInteractions(() => {
            console.log("Item pressed:", item.name);
          });
        }}
        style={styles.panel}
      />

      {/* Performance Metrics Display (Development Only) */}
      {__DEV__ && performance.metrics && (
        <PerformanceMetricsDisplay metrics={performance.metrics} />
      )}

      {/* Virtualization Info (Development Only) */}
      {__DEV__ && isVirtualized && (
        <VirtualizationInfo
          totalItems={totalCount}
          visibleItems={virtualizedItems.length}
          isVirtualized={isVirtualized}
        />
      )}
    </View>
  );
};

// =============================================================================
// DEVELOPMENT COMPONENTS
// =============================================================================

interface PerformanceMetricsDisplayProps {
  metrics: CalendarPerformanceMetrics;
}

const PerformanceMetricsDisplay: React.FC<PerformanceMetricsDisplayProps> = ({
  metrics,
}) => {
  if (!__DEV__) return null;

  return (
    <View style={styles.metricsContainer}>
      <View style={styles.metricItem}>
        <View>Render: {metrics.renderTime.toFixed(2)}ms</View>
      </View>
      <View style={styles.metricItem}>
        <View>Data: {metrics.dataProcessingTime.toFixed(2)}ms</View>
      </View>
      <View style={styles.metricItem}>
        <View>Renders: {metrics.reRenderCount}</View>
      </View>
    </View>
  );
};

interface VirtualizationInfoProps {
  totalItems: number;
  visibleItems: number;
  isVirtualized: boolean;
}

const VirtualizationInfo: React.FC<VirtualizationInfoProps> = ({
  totalItems,
  visibleItems,
  isVirtualized,
}) => {
  if (!__DEV__) return null;

  return (
    <View style={styles.virtualizationContainer}>
      <View>Virtualization: {isVirtualized ? "ON" : "OFF"}</View>
      <View>
        Items: {visibleItems}/{totalItems}
      </View>
    </View>
  );
};

// =============================================================================
// PERFORMANCE UTILITIES
// =============================================================================

/**
 * Higher-order component for performance monitoring
 */
export function withPerformanceMonitoring<T extends object>(
  Component: React.ComponentType<T>
): React.ComponentType<T> {
  return memo((props: T) => {
    const performance = usePerformanceOptimization();

    useEffect(() => {
      performance.startRender();
      return () => {
        performance.endRender();
      };
    });

    return <Component {...props} />;
  });
}

/**
 * Hook for calendar performance optimization
 */
export function useCalendarPerformance(
  items: FoodItem[],
  options?: {
    virtualizationThreshold?: number;
    debounceDelay?: number;
  }
) {
  const shouldVirtualize =
    items.length > (options?.virtualizationThreshold || 100);
  const debouncedItems = useDebounced(items, options?.debounceDelay || 300);

  return {
    shouldVirtualize,
    optimizedItems: shouldVirtualize ? debouncedItems : items,
    itemCount: items.length,
    isOptimized: shouldVirtualize,
  };
}

// =============================================================================
// STYLES
// =============================================================================

const styles = StyleSheet.create({
  calendar: {
    marginHorizontal: 16,
    marginVertical: 8,
  },
  legend: {
    marginHorizontal: 16,
    marginVertical: 4,
  },
  panel: {
    flex: 1,
    marginHorizontal: 16,
    marginVertical: 8,
  },
  metricsContainer: {
    position: "absolute",
    top: 50,
    right: 10,
    backgroundColor: "rgba(0,0,0,0.8)",
    padding: 8,
    borderRadius: 4,
    zIndex: 1000,
  },
  metricItem: {
    marginBottom: 4,
  },
  virtualizationContainer: {
    position: "absolute",
    top: 120,
    right: 10,
    backgroundColor: "rgba(0,100,0,0.8)",
    padding: 8,
    borderRadius: 4,
    zIndex: 1000,
  },
});

// =============================================================================
// EXPORT
// =============================================================================

PerformanceOptimizedCalendar.displayName = "PerformanceOptimizedCalendar";

export default PerformanceOptimizedCalendar;
export {
  PerformanceMonitor,
  useCalendarPerformance,
  useDebounced,
  usePerformanceOptimization,
  useVirtualizedItems,
  withPerformanceMonitoring,
};
