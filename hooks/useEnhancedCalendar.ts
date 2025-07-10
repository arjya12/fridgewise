/**
 * Enhanced Calendar Hooks
 * Provides specialized hooks for enhanced calendar functionality
 * Based on Phase 1 validated architecture
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import { useCalendar } from "../contexts/CalendarContext";
import { useColorScheme } from "../hooks/useColorScheme";
import { FoodItem } from "../lib/supabase";
import { CalendarMonth } from "../types/calendar";
import {
  FilterOptionsEnhanced,
  SortOptionsEnhanced,
} from "../types/calendar-enhanced";
import { createEnhancedMarkedDates } from "../utils/calendarEnhancedDataUtils";
import { getMonthRange } from "../utils/calendarUtils";

// =============================================================================
// PERFORMANCE OPTIMIZATIONS
// =============================================================================

// Cache for month data to prevent redundant API calls
const monthDataCache = new Map<
  string,
  {
    data: Record<string, FoodItem[]>;
    timestamp: number;
    expiry: number;
  }
>();

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
const MAX_CACHE_SIZE = 12; // Store up to 12 months

// Batch prefetch adjacent months
const prefetchAdjacentMonths = async (
  currentMonth: CalendarMonth,
  foodItemsService: any
) => {
  const adjacentMonths = [
    { year: currentMonth.year, month: currentMonth.month - 1 },
    { year: currentMonth.year, month: currentMonth.month + 1 },
  ];

  // Fix month boundaries
  adjacentMonths.forEach((month) => {
    if (month.month < 1) {
      month.month = 12;
      month.year -= 1;
    } else if (month.month > 12) {
      month.month = 1;
      month.year += 1;
    }
  });

  // Prefetch in background
  Promise.all(
    adjacentMonths.map(async (month) => {
      const cacheKey = `${month.year}-${month.month}`;
      if (!monthDataCache.has(cacheKey)) {
        try {
          const { startDate, endDate } = getMonthRange(month.year, month.month);
          const items = await foodItemsService.getItemsByExpiryDate(
            startDate,
            endDate
          );

          // Cache the prefetched data
          monthDataCache.set(cacheKey, {
            data: items,
            timestamp: Date.now(),
            expiry: Date.now() + CACHE_DURATION,
          });

          // Limit cache size
          if (monthDataCache.size > MAX_CACHE_SIZE) {
            const oldestKey = Array.from(monthDataCache.keys())[0];
            monthDataCache.delete(oldestKey);
          }
        } catch (error) {
          console.warn("Prefetch failed for month:", month, error);
        }
      }
    })
  );
};

// Optimized data fetching with cache
const fetchMonthDataOptimized = async (
  month: CalendarMonth,
  foodItemsService: any
): Promise<Record<string, FoodItem[]>> => {
  const cacheKey = `${month.year}-${month.month}`;
  const cached = monthDataCache.get(cacheKey);

  // Return cached data if valid
  if (cached && Date.now() < cached.expiry) {
    // Prefetch adjacent months in background
    prefetchAdjacentMonths(month, foodItemsService);
    return cached.data;
  }

  // Fetch fresh data
  const { startDate, endDate } = getMonthRange(month.year, month.month);
  const items = await foodItemsService.getItemsByExpiryDate(startDate, endDate);

  // Cache the result
  monthDataCache.set(cacheKey, {
    data: items,
    timestamp: Date.now(),
    expiry: Date.now() + CACHE_DURATION,
  });

  // Prefetch adjacent months
  prefetchAdjacentMonths(month, foodItemsService);

  return items;
};

// =============================================================================
// ENHANCED CALENDAR HOOK
// =============================================================================

export interface UseEnhancedCalendarOptions {
  enablePerformanceMonitoring?: boolean;
  enableOptimisticUpdates?: boolean;
  cacheSize?: number;
  prefetchMonths?: number;
}

export interface UseEnhancedCalendarReturn {
  // State
  selectedDate: string | null;
  currentMonth: CalendarMonth;
  items: FoodItem[];
  loading: boolean;
  error: any;
  viewMode: "calendar" | "list" | "grid";

  // Data
  selectedDateItems: FoodItem[];
  expiringSoonItems: FoodItem[];
  markedDates: any;
  statistics: any;

  // Actions
  selectDate: (date: string) => void;
  setCurrentMonth: (month: CalendarMonth) => void;
  setViewMode: (mode: "calendar" | "list" | "grid") => void;
  markItemUsed: (itemId: string, quantity?: number) => Promise<void>;
  extendExpiry: (itemId: string, days: number) => Promise<void>;
  refresh: () => Promise<void>;

  // Filters
  filters: FilterOptionsEnhanced;
  setFilters: (filters: Partial<FilterOptionsEnhanced>) => void;
  clearFilters: () => void;

  // Sort
  sort: SortOptionsEnhanced;
  setSort: (sort: Partial<SortOptionsEnhanced>) => void;

  // Utility
  isDateSelected: (date: string) => boolean;
  getDateItems: (date: string) => FoodItem[];
  hasItemsOnDate: (date: string) => boolean;
  getDateIndicators: (date: string) => DateIndicators;
}

export interface DateIndicators {
  count: number;
  urgencyLevel: "low" | "medium" | "high" | "critical";
  types: ("expired" | "today" | "soon" | "safe")[];
  hasExpired: boolean;
  hasExpiring: boolean;
}

export function useEnhancedCalendar(
  options: UseEnhancedCalendarOptions = {}
): UseEnhancedCalendarReturn & { enhancedMarkedDates: any } {
  const {
    enablePerformanceMonitoring = true,
    enableOptimisticUpdates = true,
    cacheSize = 100,
    prefetchMonths = 2,
  } = options;

  const context = useCalendar();

  // =============================================================================
  // DERIVED STATE
  // =============================================================================

  const {
    state,
    selectDate,
    setCurrentMonth,
    setViewMode,
    markItemUsed,
    extendExpiry,
    refresh,
    setFilters,
    clearFilters,
    setSort,
    selectedDateItems,
    expiringSoonItems,
    statistics,
  } = context;

  const {
    selectedDate,
    currentMonth,
    items,
    loading,
    error,
    viewMode,
    filters,
    sort,
    data,
  } = state;

  const colorScheme = useColorScheme();

  // Memoized enhanced marked dates (precomputed for UI)
  const enhancedMarkedDates = useMemo(() => {
    return createEnhancedMarkedDates(
      data.itemsByDate,
      undefined, // use default color scheme for now, or pass colorScheme if needed
      { maxDotsPerDate: 4 }
    );
  }, [data.itemsByDate]);

  // Fetch new data when currentMonth changes
  useEffect(() => {
    if (context && context.refresh) {
      context.refresh();
    }
  }, [currentMonth]);

  // Profile marked dates calculation
  useEffect(() => {
    const start = performance.now();
    createEnhancedMarkedDates(data.itemsByDate, undefined, {
      maxDotsPerDate: 4,
    });
    const end = performance.now();
    console.log(
      "[Calendar Performance] Marked dates calculation took",
      (end - start).toFixed(0),
      "ms"
    );
  }, [data.itemsByDate]);

  // =============================================================================
  // UTILITY FUNCTIONS
  // =============================================================================

  const isDateSelected = useCallback(
    (date: string) => {
      return selectedDate === date;
    },
    [selectedDate]
  );

  const getDateItems = useCallback(
    (date: string) => {
      return data.itemsByDate[date] || [];
    },
    [data.itemsByDate]
  );

  const hasItemsOnDate = useCallback(
    (date: string) => {
      return (data.itemsByDate[date]?.length || 0) > 0;
    },
    [data.itemsByDate]
  );

  const getDateIndicators = useCallback(
    (date: string): DateIndicators => {
      const dateItems = getDateItems(date);
      const count = dateItems.length;

      if (count === 0) {
        return {
          count: 0,
          urgencyLevel: "low",
          types: [],
          hasExpired: false,
          hasExpiring: false,
        };
      }

      const today = new Date().toISOString().split("T")[0];
      const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0];
      const threeDaysFromNow = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0];

      const types: ("expired" | "today" | "soon" | "safe")[] = [];
      let hasExpired = false;
      let hasExpiring = false;
      let urgencyLevel: "low" | "medium" | "high" | "critical" = "low";

      dateItems.forEach((item) => {
        if (!item.expiry_date) return;

        if (item.expiry_date < today) {
          types.push("expired");
          hasExpired = true;
          urgencyLevel = "critical";
        } else if (item.expiry_date === today) {
          types.push("today");
          hasExpiring = true;
          if (urgencyLevel !== "critical") urgencyLevel = "high";
        } else if (item.expiry_date <= threeDaysFromNow) {
          types.push("soon");
          hasExpiring = true;
          if (urgencyLevel === "low") urgencyLevel = "medium";
        } else {
          types.push("safe");
        }
      });

      return {
        count,
        urgencyLevel,
        types: [...new Set(types)], // Remove duplicates
        hasExpired,
        hasExpiring,
      };
    },
    [getDateItems]
  );

  // =============================================================================
  // DATA MANAGEMENT
  // =============================================================================

  // Memoized derived data to prevent expensive recalculations
  const markedDates = useMemo(() => {
    if (!data.itemsByDate || Object.keys(data.itemsByDate).length === 0) {
      return {};
    }

    const marked: Record<string, any> = {};

    Object.entries(data.itemsByDate).forEach(([date, items]) => {
      if (items.length > 0) {
        const urgencyCounts = { critical: 0, warning: 0, soon: 0, safe: 0 };

        items.forEach((item) => {
          if (item.expiry_date) {
            const daysUntilExpiry = Math.ceil(
              (new Date(item.expiry_date).getTime() - new Date().getTime()) /
                (1000 * 60 * 60 * 24)
            );

            if (daysUntilExpiry < 0) urgencyCounts.critical++;
            else if (daysUntilExpiry === 0) urgencyCounts.warning++;
            else if (daysUntilExpiry <= 3) urgencyCounts.soon++;
            else urgencyCounts.safe++;
          }
        });

        // Create dots based on urgency
        const dots = [];
        if (urgencyCounts.critical > 0) dots.push({ color: "#DC2626" });
        if (urgencyCounts.warning > 0) dots.push({ color: "#EA580C" });
        if (urgencyCounts.soon > 0) dots.push({ color: "#D97706" });
        if (urgencyCounts.safe > 0) dots.push({ color: "#16A34A" });

        marked[date] = {
          marked: true,
          dots: dots.slice(0, 3), // Limit to 3 dots for performance
        };
      }
    });

    return marked;
  }, [data.itemsByDate]);

  // Memoized statistics calculation
  const optimizedStatistics = useMemo(() => {
    const allItems = Object.values(data.itemsByDate).flat();

    if (allItems.length === 0) {
      return {
        total: 0,
        expired: 0,
        expiresToday: 0,
        expiresThisWeek: 0,
        byUrgency: { critical: 0, warning: 0, soon: 0, safe: 0 },
      };
    }

    const today = new Date().toISOString().split("T")[0];
    const oneWeekFromNow = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0];

    let expired = 0,
      expiresToday = 0,
      expiresThisWeek = 0;
    const byUrgency = { critical: 0, warning: 0, soon: 0, safe: 0 };

    allItems.forEach((item) => {
      if (item.expiry_date) {
        if (item.expiry_date < today) {
          expired++;
          byUrgency.critical++;
        } else if (item.expiry_date === today) {
          expiresToday++;
          byUrgency.warning++;
        } else if (item.expiry_date <= oneWeekFromNow) {
          expiresThisWeek++;
          byUrgency.soon++;
        } else {
          byUrgency.safe++;
        }
      }
    });

    return {
      total: allItems.length,
      expired,
      expiresToday,
      expiresThisWeek,
      byUrgency,
    };
  }, [data.itemsByDate]);

  // =============================================================================
  // PERFORMANCE MONITORING
  // =============================================================================

  useEffect(() => {
    if (!enablePerformanceMonitoring) return;

    const itemCount = items.length;
    const cacheSize = data.cache.size;

    // Monitor for performance issues
    if (itemCount > 1000) {
      console.warn(
        "[Calendar Performance] Large item count detected:",
        itemCount
      );
    }

    if (cacheSize > 100) {
      console.warn(
        "[Calendar Performance] Large cache size detected:",
        cacheSize
      );
    }
  }, [items.length, data.cache.size, enablePerformanceMonitoring]);

  // =============================================================================
  // RETURN VALUE
  // =============================================================================

  return {
    // State
    selectedDate,
    currentMonth,
    items,
    loading,
    error,
    viewMode,

    // Data - Use optimized values
    selectedDateItems,
    expiringSoonItems,
    markedDates, // Use the memoized markedDates from above
    statistics: optimizedStatistics, // Use the memoized statistics from above
    enhancedMarkedDates,

    // Actions
    selectDate,
    setCurrentMonth,
    setViewMode,
    markItemUsed,
    extendExpiry,
    refresh,

    // Filters
    filters,
    setFilters,
    clearFilters,

    // Sort
    sort,
    setSort,

    // Utility
    isDateSelected,
    getDateItems,
    hasItemsOnDate,
    getDateIndicators,
  };
}

// =============================================================================
// CALENDAR PERFORMANCE HOOK
// =============================================================================

export interface UseCalendarPerformanceOptions {
  enableMetrics?: boolean;
  memoryThreshold?: number;
  renderTimeThreshold?: number;
  onWarning?: (warning: PerformanceWarning) => void;
}

export interface PerformanceWarning {
  type: "memory" | "render" | "data";
  severity: "low" | "medium" | "high";
  message: string;
  timestamp: string;
  suggestion?: string;
}

export interface UseCalendarPerformanceReturn {
  metrics: {
    renderTime: number;
    memoryUsage: number;
    itemCount: number;
    lastUpdate: string;
    warnings: PerformanceWarning[];
  };
  startMeasurement: () => void;
  endMeasurement: (operation: string) => void;
  trackMemoryUsage: () => void;
  clearWarnings: () => void;
}

export function useCalendarPerformance(
  options: UseCalendarPerformanceOptions = {}
): UseCalendarPerformanceReturn {
  const {
    enableMetrics = true,
    memoryThreshold = 50 * 1024 * 1024, // 50MB
    renderTimeThreshold = 100, // 100ms
    onWarning,
  } = options;

  const { state, updatePerformanceMetrics } = useCalendar();
  const [measurementStart, setMeasurementStart] = useState<number | null>(null);

  const startMeasurement = useCallback(() => {
    if (enableMetrics) {
      setMeasurementStart(Date.now());
    }
  }, [enableMetrics]);

  const endMeasurement = useCallback(
    (operation: string) => {
      if (!enableMetrics || !measurementStart) return;

      const renderTime = Date.now() - measurementStart;
      setMeasurementStart(null);

      if (renderTime > renderTimeThreshold) {
        const warning: PerformanceWarning = {
          type: "render",
          severity: renderTime > renderTimeThreshold * 2 ? "high" : "medium",
          message: `Slow ${operation} detected: ${renderTime}ms`,
          timestamp: new Date().toISOString(),
          suggestion:
            "Consider optimizing component rendering or implementing virtualization",
        };

        if (onWarning) onWarning(warning);

        updatePerformanceMetrics({
          renderTime,
          lastUpdate: new Date().toISOString(),
          warnings: [...state.performance.warnings, warning],
        });
      }
    },
    [
      enableMetrics,
      measurementStart,
      renderTimeThreshold,
      onWarning,
      updatePerformanceMetrics,
      state.performance.warnings,
    ]
  );

  const trackMemoryUsage = useCallback(() => {
    if (!enableMetrics) return;

    const itemCount = state.items.length;
    const estimatedMemoryUsage = itemCount * 1024 + state.data.cache.size * 512; // Rough estimate

    if (estimatedMemoryUsage > memoryThreshold) {
      const warning: PerformanceWarning = {
        type: "memory",
        severity: "high",
        message: `High memory usage detected: ${Math.round(
          estimatedMemoryUsage / 1024 / 1024
        )}MB`,
        timestamp: new Date().toISOString(),
        suggestion: "Consider implementing data pagination or cache cleanup",
      };

      if (onWarning) onWarning(warning);

      updatePerformanceMetrics({
        memoryUsage: estimatedMemoryUsage,
        itemCount,
        lastUpdate: new Date().toISOString(),
        warnings: [...state.performance.warnings, warning],
      });
    }
  }, [
    enableMetrics,
    state.items.length,
    state.data.cache.size,
    memoryThreshold,
    onWarning,
    updatePerformanceMetrics,
    state.performance.warnings,
  ]);

  const clearWarnings = useCallback(() => {
    updatePerformanceMetrics({
      warnings: [],
      lastUpdate: new Date().toISOString(),
    });
  }, [updatePerformanceMetrics]);

  // Auto-track memory usage on item changes
  useEffect(() => {
    trackMemoryUsage();
  }, [trackMemoryUsage]);

  return {
    metrics: state.performance,
    startMeasurement,
    endMeasurement,
    trackMemoryUsage,
    clearWarnings,
  };
}

// =============================================================================
// CALENDAR FILTERS HOOK
// =============================================================================

export interface UseCalendarFiltersReturn {
  filters: FilterOptionsEnhanced;
  setFilters: (filters: Partial<FilterOptionsEnhanced>) => void;
  clearFilters: () => void;
  toggleCategory: (category: string) => void;
  toggleLocation: (location: "fridge" | "shelf") => void;
  toggleUrgency: (urgency: "expired" | "today" | "soon" | "fresh") => void;
  setSearch: (search: string) => void;
  hasActiveFilters: boolean;
  filteredItemCount: number;
}

export function useCalendarFilters(): UseCalendarFiltersReturn {
  const { state, setFilters: setContextFilters, clearFilters } = useCalendar();
  const { filters, items } = state;

  const setFilters = useCallback(
    (newFilters: Partial<FilterOptionsEnhanced>) => {
      setContextFilters(newFilters);
    },
    [setContextFilters]
  );

  const toggleCategory = useCallback(
    (category: string) => {
      const currentCategories = filters.category || [];
      const newCategories = currentCategories.includes(category)
        ? currentCategories.filter((c) => c !== category)
        : [...currentCategories, category];

      setFilters({ category: newCategories });
    },
    [filters.category, setFilters]
  );

  const toggleLocation = useCallback(
    (location: "fridge" | "shelf") => {
      const currentLocations = filters.location || [];
      const newLocations = currentLocations.includes(location)
        ? currentLocations.filter((l) => l !== location)
        : [...currentLocations, location];

      setFilters({ location: newLocations });
    },
    [filters.location, setFilters]
  );

  const toggleUrgency = useCallback(
    (urgency: "expired" | "today" | "soon" | "fresh") => {
      const currentUrgencies = filters.urgency || [];
      const newUrgencies = currentUrgencies.includes(urgency)
        ? currentUrgencies.filter((u) => u !== urgency)
        : [...currentUrgencies, urgency];

      setFilters({ urgency: newUrgencies });
    },
    [filters.urgency, setFilters]
  );

  const setSearch = useCallback(
    (search: string) => {
      setFilters({ search });
    },
    [setFilters]
  );

  const hasActiveFilters = useMemo(() => {
    return !!(
      (filters.category && filters.category.length > 0) ||
      (filters.location && filters.location.length > 0) ||
      (filters.urgency && filters.urgency.length > 0) ||
      (filters.search && filters.search.trim() !== "") ||
      (filters.dateRange && (filters.dateRange.start || filters.dateRange.end))
    );
  }, [filters]);

  const filteredItemCount = useMemo(() => {
    return items.length;
  }, [items.length]);

  return {
    filters,
    setFilters,
    clearFilters,
    toggleCategory,
    toggleLocation,
    toggleUrgency,
    setSearch,
    hasActiveFilters,
    filteredItemCount,
  };
}
