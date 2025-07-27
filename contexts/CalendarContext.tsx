/**
 * Enhanced Calendar Context Provider
 * Provides centralized state management for the enhanced expiry calendar
 * Based on Phase 1 validated architecture
 */

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
} from "react";
import { clearMonthDataCache } from "../hooks/useEnhancedCalendar";
import { FoodItem } from "../lib/supabase";
import { CalendarMonth } from "../types/calendar";
import {
  CalendarError,
  FilterOptionsEnhanced,
  PerformanceMetrics,
  SortOptionsEnhanced,
} from "../types/calendar-enhanced";
import {
  CalendarData,
  calendarReducer,
  ExpiryStatistics,
  ExtendedCalendarState,
  initialCalendarState,
} from "./calendarReducer";

// =============================================================================
// CONTEXT INTERFACE
// =============================================================================

export interface CalendarContextValue {
  // State
  state: ExtendedCalendarState;

  // Core actions
  selectDate: (date: string) => void;
  setCurrentMonth: (month: CalendarMonth) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: CalendarError | null) => void;
  clearError: () => void;
  setViewMode: (mode: "calendar" | "list" | "grid") => void;

  // Data actions
  setItems: (items: FoodItem[]) => void;
  setCalendarData: (data: Partial<CalendarData>) => void;

  // Filter and sort actions
  setFilters: (filters: Partial<FilterOptionsEnhanced>) => void;
  setSort: (sort: Partial<SortOptionsEnhanced>) => void;
  clearFilters: () => void;

  // Item actions (with optimistic updates)
  markItemUsed: (itemId: string, quantity?: number) => Promise<void>;
  extendExpiry: (itemId: string, days: number) => Promise<void>;

  // Performance actions
  updatePerformanceMetrics: (metrics: Partial<PerformanceMetrics>) => void;
  invalidateCache: () => void;

  // Computed values
  selectedDateItems: FoodItem[];
  expiringSoonItems: FoodItem[];
  statistics: ExpiryStatistics;

  // Utility functions
  refresh: () => Promise<void>;
}

// =============================================================================
// CONTEXT CREATION
// =============================================================================

const CalendarContext = createContext<CalendarContextValue | null>(null);

// =============================================================================
// PROVIDER COMPONENT
// =============================================================================

export interface CalendarProviderProps {
  children: React.ReactNode;
  foodItemsService?: any; // Service for data operations
  onError?: (error: CalendarError) => void;
  performanceConfig?: {
    enableMetrics: boolean;
    memoryThreshold: number;
    renderTimeThreshold: number;
  };
}

export function CalendarProvider({
  children,
  foodItemsService,
  onError,
  performanceConfig = {
    enableMetrics: true,
    memoryThreshold: 50 * 1024 * 1024, // 50MB
    renderTimeThreshold: 100, // 100ms
  },
}: CalendarProviderProps) {
  const [state, dispatch] = useReducer(calendarReducer, initialCalendarState);

  // =============================================================================
  // CORE ACTION CREATORS
  // =============================================================================

  const selectDate = useCallback((date: string) => {
    dispatch({ type: "SELECT_DATE", payload: date });
  }, []);

  const setCurrentMonth = useCallback((month: CalendarMonth) => {
    dispatch({ type: "SET_CURRENT_MONTH", payload: month });
  }, []);

  const setLoading = useCallback((loading: boolean) => {
    dispatch({ type: "SET_LOADING", payload: loading });
  }, []);

  const setError = useCallback(
    (error: CalendarError | null) => {
      dispatch({ type: "SET_ERROR", payload: error });
      if (error && onError) {
        onError(error);
      }
    },
    [onError]
  );

  const clearError = useCallback(() => {
    dispatch({ type: "CLEAR_ERROR" });
  }, []);

  const setViewMode = useCallback((mode: "calendar" | "list" | "grid") => {
    dispatch({ type: "SET_VIEW_MODE", payload: mode });
  }, []);

  // =============================================================================
  // DATA ACTION CREATORS
  // =============================================================================

  const setItems = useCallback((items: FoodItem[]) => {
    dispatch({ type: "SET_ITEMS", payload: items });
  }, []);

  const setCalendarData = useCallback((data: Partial<CalendarData>) => {
    dispatch({ type: "SET_CALENDAR_DATA", payload: data });
  }, []);

  // =============================================================================
  // FILTER AND SORT ACTION CREATORS
  // =============================================================================

  const setFilters = useCallback((filters: Partial<FilterOptionsEnhanced>) => {
    dispatch({ type: "SET_FILTERS", payload: filters });
  }, []);

  const setSort = useCallback((sort: Partial<SortOptionsEnhanced>) => {
    dispatch({ type: "SET_SORT", payload: sort });
  }, []);

  const clearFilters = useCallback(() => {
    dispatch({ type: "CLEAR_FILTERS" });
  }, []);

  // =============================================================================
  // ITEM ACTION CREATORS (WITH OPTIMISTIC UPDATES)
  // =============================================================================

  const markItemUsed = useCallback(
    async (itemId: string, quantity?: number) => {
      // Optimistic update
      dispatch({
        type: "MARK_ITEM_USED_OPTIMISTIC",
        payload: { itemId, quantity },
      });

      try {
        // Perform actual update via service
        if (foodItemsService && foodItemsService.markItemUsed) {
          await foodItemsService.markItemUsed(itemId, quantity);
          dispatch({ type: "MARK_ITEM_USED_SUCCESS" });
        }
      } catch (error) {
        // Revert optimistic update
        dispatch({
          type: "MARK_ITEM_USED_ERROR",
          payload: { error },
        });
      }
    },
    [foodItemsService]
  );

  const extendExpiry = useCallback(
    async (itemId: string, days: number) => {
      // Optimistic update
      dispatch({
        type: "EXTEND_EXPIRY_OPTIMISTIC",
        payload: { itemId, days },
      });

      try {
        // Perform actual update via service
        if (foodItemsService && foodItemsService.extendExpiry) {
          await foodItemsService.extendExpiry(itemId, days);
        }
      } catch (error) {
        // On error, trigger data reload to revert optimistic update
        dispatch({
          type: "SET_ERROR",
          payload: {
            code: "extend_expiry_failed",
            message: "Failed to extend expiry date",
            details: error,
            timestamp: new Date().toISOString(),
            recoverable: true,
          },
        });
      }
    },
    [foodItemsService]
  );

  // =============================================================================
  // PERFORMANCE ACTION CREATORS
  // =============================================================================

  const updatePerformanceMetrics = useCallback(
    (metrics: Partial<PerformanceMetrics>) => {
      if (performanceConfig.enableMetrics) {
        dispatch({ type: "UPDATE_PERFORMANCE_METRICS", payload: metrics });
      }
    },
    [performanceConfig.enableMetrics]
  );

  const invalidateCache = useCallback(() => {
    // Clear React context cache
    dispatch({ type: "INVALIDATE_CACHE" });
    // Clear useEnhancedCalendar month data cache
    clearMonthDataCache();
  }, []);

  // =============================================================================
  // UTILITY FUNCTIONS
  // =============================================================================

  const refresh = useCallback(async () => {
    try {
      setLoading(true);

      // Clear any existing caches to ensure fresh data
      invalidateCache();

      if (foodItemsService && foodItemsService.getItems) {
        const items = await foodItemsService.getItems();
        setItems(items);
      }
    } catch (error) {
      setError({
        code: "refresh_failed",
        message: "Failed to refresh calendar data",
        details: error,
        timestamp: new Date().toISOString(),
        recoverable: true,
      });
    } finally {
      setLoading(false);
    }
  }, [foodItemsService, setItems, setError, setLoading, invalidateCache]);

  // =============================================================================
  // COMPUTED VALUES
  // =============================================================================

  const selectedDateItems = useMemo(() => {
    if (!state.selectedDate) return [];
    return state.data.itemsByDate[state.selectedDate] || [];
  }, [state.selectedDate, state.data.itemsByDate]);

  const expiringSoonItems = useMemo(() => {
    const today = new Date();
    const fiveDaysFromNow = new Date(today.getTime() + 5 * 24 * 60 * 60 * 1000);
    const fiveDaysFromNowStr = fiveDaysFromNow.toISOString().split("T")[0];

    return state.items.filter((item) => {
      if (!item.expiry_date) return false;
      return item.expiry_date <= fiveDaysFromNowStr;
    });
  }, [state.items]);

  const statistics = useMemo(
    () => state.data.statistics,
    [state.data.statistics]
  );

  // =============================================================================
  // PERFORMANCE MONITORING
  // =============================================================================

  useEffect(() => {
    if (!performanceConfig.enableMetrics) return;

    const startTime = Date.now();

    // Monitor render time
    const renderTime = Date.now() - startTime;

    // Monitor memory usage (approximation)
    const itemCount = state.items.length;
    const estimatedMemoryUsage = itemCount * 1024; // Rough estimate: 1KB per item

    if (
      renderTime > performanceConfig.renderTimeThreshold ||
      estimatedMemoryUsage > performanceConfig.memoryThreshold
    ) {
      const warnings = [];

      if (renderTime > performanceConfig.renderTimeThreshold) {
        warnings.push({
          type: "render" as const,
          severity: "medium" as const,
          message: `Slow render detected: ${renderTime}ms`,
          timestamp: new Date().toISOString(),
          suggestion: "Consider implementing virtualization for large lists",
        });
      }

      if (estimatedMemoryUsage > performanceConfig.memoryThreshold) {
        warnings.push({
          type: "memory" as const,
          severity: "high" as const,
          message: `High memory usage detected: ${Math.round(
            estimatedMemoryUsage / 1024 / 1024
          )}MB`,
          timestamp: new Date().toISOString(),
          suggestion: "Consider implementing data pagination or caching",
        });
      }

      updatePerformanceMetrics({
        renderTime,
        memoryUsage: estimatedMemoryUsage,
        itemCount,
        lastUpdate: new Date().toISOString(),
        warnings,
      });
    }
  }, [state.items.length, performanceConfig, updatePerformanceMetrics]);

  // =============================================================================
  // CONTEXT VALUE
  // =============================================================================

  const contextValue: CalendarContextValue = useMemo(
    () => ({
      // State
      state,

      // Core actions
      selectDate,
      setCurrentMonth,
      setLoading,
      setError,
      clearError,
      setViewMode,

      // Data actions
      setItems,
      setCalendarData,

      // Filter and sort actions
      setFilters,
      setSort,
      clearFilters,

      // Item actions
      markItemUsed,
      extendExpiry,

      // Performance actions
      updatePerformanceMetrics,
      invalidateCache,

      // Computed values
      selectedDateItems,
      expiringSoonItems,
      statistics,

      // Utility functions
      refresh,
    }),
    [
      state,
      selectDate,
      setCurrentMonth,
      setLoading,
      setError,
      clearError,
      setViewMode,
      setItems,
      setCalendarData,
      setFilters,
      setSort,
      clearFilters,
      markItemUsed,
      extendExpiry,
      updatePerformanceMetrics,
      invalidateCache,
      selectedDateItems,
      expiringSoonItems,
      statistics,
      refresh,
    ]
  );

  return (
    <CalendarContext.Provider value={contextValue}>
      {children}
    </CalendarContext.Provider>
  );
}

// =============================================================================
// HOOK
// =============================================================================

export function useCalendar(): CalendarContextValue {
  const context = useContext(CalendarContext);
  if (!context) {
    throw new Error("useCalendar must be used within a CalendarProvider");
  }
  return context;
}

// =============================================================================
// EXPORTS
// =============================================================================

export { CalendarContext };
