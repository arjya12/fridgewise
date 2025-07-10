/**
 * Enhanced Calendar State Reducer
 * Implements predictable state management for the Enhanced Expiry Calendar
 * Based on Phase 1 architecture validation
 */

import { FoodItem } from "../lib/supabase";
import { MarkedDatesType } from "../types/calendar";
import {
  CalendarStateEnhanced,
  FilterOptionsEnhanced,
  SortOptionsEnhanced,
} from "../types/calendar-enhanced";

// =============================================================================
// ADDITIONAL TYPES
// =============================================================================

export interface ExpiryStatistics {
  total: number;
  expired: number;
  expiresToday: number;
  expiresThisWeek: number;
  byUrgency: {
    critical: number;
    warning: number;
    soon: number;
    safe: number;
  };
}

export interface CalendarData {
  itemsByDate: Record<string, FoodItem[]>;
  markedDates: MarkedDatesType;
  statistics: ExpiryStatistics;
  cache: Map<string, any>;
}

export interface CalendarActionType {
  type:
    | "SELECT_DATE"
    | "SET_CURRENT_MONTH"
    | "SET_LOADING"
    | "SET_ERROR"
    | "CLEAR_ERROR"
    | "SET_VIEW_MODE"
    | "SET_ITEMS"
    | "SET_CALENDAR_DATA"
    | "SET_FILTERS"
    | "SET_SORT"
    | "CLEAR_FILTERS"
    | "MARK_ITEM_USED_OPTIMISTIC"
    | "MARK_ITEM_USED_SUCCESS"
    | "MARK_ITEM_USED_ERROR"
    | "EXTEND_EXPIRY_OPTIMISTIC"
    | "UPDATE_PERFORMANCE_METRICS"
    | "INVALIDATE_CACHE";
  payload?: any;
}

// Extended state interface with data property
export interface ExtendedCalendarState extends CalendarStateEnhanced {
  data: CalendarData;
}

// =============================================================================
// INITIAL STATE
// =============================================================================

export const initialCalendarState: ExtendedCalendarState = {
  // Core state
  selectedDate: null,
  currentMonth: {
    year: new Date().getFullYear(),
    month: new Date().getMonth() + 1,
  },
  items: [],
  loading: false,
  error: null,
  viewMode: "calendar",

  // Filters and sorting - matching actual interface
  filters: {
    category: [],
    location: [],
    urgency: [],
    search: "",
    showEmpty: true,
  },
  sort: {
    field: "expiry_date",
    direction: "asc",
  },

  // Performance metrics
  performance: {
    renderTime: 0,
    memoryUsage: 0,
    itemCount: 0,
    lastUpdate: new Date().toISOString(),
    warnings: [],
  },

  // Data cache - extended property
  data: {
    itemsByDate: {},
    markedDates: {},
    statistics: {
      total: 0,
      expired: 0,
      expiresToday: 0,
      expiresThisWeek: 0,
      byUrgency: {
        critical: 0,
        warning: 0,
        soon: 0,
        safe: 0,
      },
    },
    cache: new Map(),
  },
};

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Calculate expiry statistics from items
 */
function calculateStatistics(items: FoodItem[]): ExpiryStatistics {
  const now = new Date();
  const today = now.toISOString().split("T")[0];
  const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split("T")[0];

  const stats: ExpiryStatistics = {
    total: items.length,
    expired: 0,
    expiresToday: 0,
    expiresThisWeek: 0,
    byUrgency: {
      critical: 0,
      warning: 0,
      soon: 0,
      safe: 0,
    },
  };

  items.forEach((item) => {
    if (!item.expiry_date) return;

    // Count expired items
    if (item.expiry_date < today) {
      stats.expired++;
    } else if (item.expiry_date === today) {
      stats.expiresToday++;
    } else if (item.expiry_date <= weekFromNow) {
      stats.expiresThisWeek++;
    }

    // Count by urgency (simplified urgency calculation)
    const daysUntilExpiry = Math.ceil(
      (new Date(item.expiry_date).getTime() - now.getTime()) /
        (1000 * 60 * 60 * 24)
    );

    if (daysUntilExpiry < 0) {
      stats.byUrgency.critical++;
    } else if (daysUntilExpiry === 0) {
      stats.byUrgency.warning++;
    } else if (daysUntilExpiry <= 3) {
      stats.byUrgency.soon++;
    } else {
      stats.byUrgency.safe++;
    }
  });

  return stats;
}

/**
 * Group items by date
 */
function groupItemsByDate(items: FoodItem[]): Record<string, FoodItem[]> {
  const grouped: Record<string, FoodItem[]> = {};

  items.forEach((item) => {
    if (item.expiry_date) {
      if (!grouped[item.expiry_date]) {
        grouped[item.expiry_date] = [];
      }
      grouped[item.expiry_date].push(item);
    }
  });

  return grouped;
}

/**
 * Apply filters to items - using correct property names
 */
function applyFilters(
  items: FoodItem[],
  filters: FilterOptionsEnhanced
): FoodItem[] {
  return items.filter((item) => {
    // Search query filter - using 'search' property
    if (filters.search) {
      const query = filters.search.toLowerCase();
      const matchesName = item.name?.toLowerCase().includes(query);
      const matchesCategory = item.category?.toLowerCase().includes(query);
      const matchesLocation = item.location?.toLowerCase().includes(query);

      if (!matchesName && !matchesCategory && !matchesLocation) {
        return false;
      }
    }

    // Category filter - using 'category' array
    if (filters.category && filters.category.length > 0 && item.category) {
      if (!filters.category.includes(item.category)) {
        return false;
      }
    }

    // Location filter - using 'location' array
    if (filters.location && filters.location.length > 0 && item.location) {
      if (!filters.location.includes(item.location)) {
        return false;
      }
    }

    return true;
  });
}

/**
 * Sort items based on sort options
 */
function sortItems(items: FoodItem[], sort: SortOptionsEnhanced): FoodItem[] {
  return [...items].sort((a, b) => {
    let aValue: any, bValue: any;

    switch (sort.field) {
      case "expiry_date":
        aValue = a.expiry_date || "9999-12-31";
        bValue = b.expiry_date || "9999-12-31";
        break;
      case "name":
        aValue = a.name?.toLowerCase() || "";
        bValue = b.name?.toLowerCase() || "";
        break;
      case "quantity":
        aValue = a.quantity || 0;
        bValue = b.quantity || 0;
        break;
      case "created_at":
        aValue = a.created_at || "";
        bValue = b.created_at || "";
        break;
      default:
        return 0;
    }

    if (aValue < bValue) return sort.direction === "asc" ? -1 : 1;
    if (aValue > bValue) return sort.direction === "asc" ? 1 : -1;
    return 0;
  });
}

/**
 * Optimistically remove/update item from state
 */
function optimisticallyUpdateItem(
  state: ExtendedCalendarState,
  itemId: string,
  action: "remove" | "reduce",
  quantity?: number
): ExtendedCalendarState {
  const newItemsByDate = { ...state.data.itemsByDate };
  let itemWasFound = false;

  Object.keys(newItemsByDate).forEach((date) => {
    newItemsByDate[date] = newItemsByDate[date]
      .filter((item) => {
        if (item.id === itemId) {
          itemWasFound = true;

          if (action === "remove") {
            return false; // Remove the item
          } else if (
            action === "reduce" &&
            quantity &&
            item.quantity > quantity
          ) {
            // Reduce quantity
            return { ...item, quantity: item.quantity - quantity };
          } else {
            return false; // Remove if reducing full quantity
          }
        }
        return true;
      })
      .filter(Boolean) as FoodItem[];
  });

  if (!itemWasFound) {
    return state; // Item not found, no changes
  }

  // Recalculate statistics
  const allItems = Object.values(newItemsByDate).flat();
  const statistics = calculateStatistics(allItems);

  return {
    ...state,
    items: allItems,
    data: {
      ...state.data,
      itemsByDate: newItemsByDate,
      statistics,
    },
  };
}

// =============================================================================
// MAIN REDUCER
// =============================================================================

export function calendarReducer(
  state: ExtendedCalendarState,
  action: CalendarActionType
): ExtendedCalendarState {
  switch (action.type) {
    case "SELECT_DATE":
      return {
        ...state,
        selectedDate: action.payload,
      };

    case "SET_CURRENT_MONTH":
      return {
        ...state,
        currentMonth: action.payload,
        loading: true, // Trigger data reload
        error: null,
      };

    case "SET_LOADING":
      return {
        ...state,
        loading: action.payload,
      };

    case "SET_ERROR":
      return {
        ...state,
        error: action.payload,
        loading: false,
      };

    case "CLEAR_ERROR":
      return {
        ...state,
        error: null,
      };

    case "SET_VIEW_MODE":
      return {
        ...state,
        viewMode: action.payload,
      };

    case "SET_ITEMS":
      const filteredItems = applyFilters(action.payload, state.filters);
      const sortedItems = sortItems(filteredItems, state.sort);
      const itemsByDate = groupItemsByDate(sortedItems);
      const statistics = calculateStatistics(sortedItems);

      return {
        ...state,
        items: sortedItems,
        loading: false,
        error: null,
        data: {
          ...state.data,
          itemsByDate,
          statistics,
        },
      };

    case "SET_CALENDAR_DATA":
      return {
        ...state,
        loading: false,
        error: null,
        data: {
          ...state.data,
          ...action.payload,
        },
      };

    case "SET_FILTERS":
      const newFilters = { ...state.filters, ...action.payload };
      const reFilteredItems = applyFilters(state.items, newFilters);
      const reSortedItems = sortItems(reFilteredItems, state.sort);
      const reGroupedItems = groupItemsByDate(reSortedItems);
      const reCalculatedStats = calculateStatistics(reSortedItems);

      return {
        ...state,
        filters: newFilters,
        data: {
          ...state.data,
          itemsByDate: reGroupedItems,
          statistics: reCalculatedStats,
        },
      };

    case "SET_SORT":
      const newSort = { ...state.sort, ...action.payload };
      const sortedFilteredItems = sortItems(
        applyFilters(state.items, state.filters),
        newSort
      );
      const reGroupedSortedItems = groupItemsByDate(sortedFilteredItems);

      return {
        ...state,
        sort: newSort,
        data: {
          ...state.data,
          itemsByDate: reGroupedSortedItems,
        },
      };

    case "CLEAR_FILTERS":
      return {
        ...state,
        filters: {
          category: [],
          location: [],
          urgency: [],
          search: "",
          showEmpty: true,
        },
      };

    case "MARK_ITEM_USED_OPTIMISTIC":
      return optimisticallyUpdateItem(
        state,
        action.payload.itemId,
        action.payload.quantity ? "reduce" : "remove",
        action.payload.quantity
      );

    case "MARK_ITEM_USED_SUCCESS":
      // Optimistic update was successful, no changes needed
      return state;

    case "MARK_ITEM_USED_ERROR":
      // Revert optimistic update by triggering data reload
      return {
        ...state,
        loading: true,
        error: {
          code: "action_failed",
          message: "Failed to mark item as used",
          details: action.payload.error,
          timestamp: new Date().toISOString(),
          recoverable: true,
        },
      };

    case "EXTEND_EXPIRY_OPTIMISTIC":
      // Extend expiry optimistically by updating the item's expiry date
      const extendedItemsByDate = { ...state.data.itemsByDate };
      const { itemId, days } = action.payload;

      Object.keys(extendedItemsByDate).forEach((date) => {
        extendedItemsByDate[date] = extendedItemsByDate[date].map((item) => {
          if (item.id === itemId) {
            const currentExpiry = new Date(item.expiry_date || date);
            const newExpiry = new Date(
              currentExpiry.getTime() + days * 24 * 60 * 60 * 1000
            );
            return {
              ...item,
              expiry_date: newExpiry.toISOString().split("T")[0],
            };
          }
          return item;
        });
      });

      return {
        ...state,
        data: {
          ...state.data,
          itemsByDate: extendedItemsByDate,
        },
      };

    case "UPDATE_PERFORMANCE_METRICS":
      return {
        ...state,
        performance: {
          ...state.performance,
          ...action.payload,
        },
      };

    case "INVALIDATE_CACHE":
      return {
        ...state,
        data: {
          ...state.data,
          cache: new Map(),
        },
      };

    default:
      console.warn("Unknown calendar action type:", (action as any).type);
      return state;
  }
}
