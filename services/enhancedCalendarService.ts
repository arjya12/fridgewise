// Enhanced Calendar Service - Integration with existing data layer
// Provides enhanced functionality for the new calendar components

import { FoodItem } from "../lib/supabase";
import { CalendarMonth, MarkedDatesType } from "../types/calendar";
import {
  FilterOptionsEnhanced,
  SortOptionsEnhanced,
} from "../types/calendar-enhanced";
import {
  calculateExpiryStatistics,
  createEnhancedMarkedDates,
  DEFAULT_COLOR_SCHEME,
  filterItems,
  memoizedGenerateDateIndicators,
  sortItems,
} from "../utils/calendarEnhancedDataUtils";
import { foodItemsService } from "./foodItems";

// =============================================================================
// TYPES
// =============================================================================

export interface EnhancedCalendarServiceOptions {
  colorScheme?: any;
  cacheEnabled?: boolean;
  prefetchNextMonth?: boolean;
}

export interface CalendarDataResponse {
  items: FoodItem[];
  markedDates: MarkedDatesType;
  statistics: import("../types/calendar").ExpiryStatistics;
  itemsByDate: Record<string, FoodItem[]>;
}

export interface FilteredCalendarDataResponse extends CalendarDataResponse {
  totalCount: number;
  filteredCount: number;
  appliedFilters: FilterOptionsEnhanced;
}

// =============================================================================
// CACHE MANAGEMENT
// =============================================================================

interface CacheEntry {
  data: CalendarDataResponse;
  timestamp: number;
  month: CalendarMonth;
}

class CalendarCache {
  private cache = new Map<string, CacheEntry>();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  private getCacheKey(month: CalendarMonth): string {
    return `${month.year}-${month.month.toString().padStart(2, "0")}`;
  }

  get(month: CalendarMonth): CalendarDataResponse | null {
    const key = this.getCacheKey(month);
    const entry = this.cache.get(key);

    if (!entry) return null;

    // Check if cache is still valid
    if (Date.now() - entry.timestamp > this.CACHE_TTL) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  set(month: CalendarMonth, data: CalendarDataResponse): void {
    const key = this.getCacheKey(month);
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      month,
    });
  }

  clear(): void {
    this.cache.clear();
  }

  invalidateMonth(month: CalendarMonth): void {
    const key = this.getCacheKey(month);
    this.cache.delete(key);
  }
}

// =============================================================================
// ENHANCED CALENDAR SERVICE
// =============================================================================

class EnhancedCalendarService {
  private cache = new CalendarCache();
  private options: EnhancedCalendarServiceOptions;

  constructor(options: EnhancedCalendarServiceOptions = {}) {
    this.options = {
      colorScheme: DEFAULT_COLOR_SCHEME,
      cacheEnabled: true,
      prefetchNextMonth: false,
      ...options,
    };
  }

  // -------------------------------------------------------------------------
  // CORE DATA FETCHING
  // -------------------------------------------------------------------------

  /**
   * Get enhanced calendar data for a specific month
   */
  async getCalendarData(month: CalendarMonth): Promise<CalendarDataResponse> {
    // Check cache first
    if (this.options.cacheEnabled) {
      const cached = this.cache.get(month);
      if (cached) {
        return cached;
      }
    }

    try {
      // Get month range
      const { startDate, endDate } = this.getMonthRange(month);

      // Fetch items from existing service
      const itemsGrouped = await foodItemsService.getItemsByExpiryDate(
        startDate,
        endDate
      );

      // Flatten items
      const items = Object.values(itemsGrouped).flat();

      // Process data
      const data = await this.processCalendarData(items);

      // Cache the result
      if (this.options.cacheEnabled) {
        this.cache.set(month, data);
      }

      // Prefetch next month if enabled
      if (this.options.prefetchNextMonth) {
        this.prefetchNextMonth(month);
      }

      return data;
    } catch (error) {
      console.error("Failed to fetch calendar data:", error);
      throw new Error("Failed to load calendar data");
    }
  }

  /**
   * Get filtered calendar data
   */
  async getFilteredCalendarData(
    month: CalendarMonth,
    filters: FilterOptionsEnhanced,
    sort?: SortOptionsEnhanced
  ): Promise<FilteredCalendarDataResponse> {
    // Get base data
    const baseData = await this.getCalendarData(month);

    // Apply filters
    let filteredItems = baseData.items;

    filteredItems = filterItems(filteredItems, filters);

    // Apply sorting
    if (sort) {
      filteredItems = sortItems(filteredItems, sort);
    }

    // Reprocess filtered data
    const filteredData = await this.processCalendarData(filteredItems);

    return {
      ...filteredData,
      totalCount: baseData.items.length,
      filteredCount: filteredItems.length,
      appliedFilters: filters,
    };
  }

  /**
   * Get calendar data for a specific date
   */
  async getDateData(date: string): Promise<{
    items: FoodItem[];
    indicators: any[];
    statistics: import("../types/calendar").ExpiryStatistics;
  }> {
    // Parse date to get month
    const [year, month] = date.split("-").map(Number);
    const calendarMonth: CalendarMonth = { year, month };

    // Get month data
    const monthData = await this.getCalendarData(calendarMonth);

    // Get items for specific date
    const dateItems = monthData.itemsByDate[date] || [];

    // Generate indicators
    const indicators = memoizedGenerateDateIndicators(
      dateItems,
      this.options.colorScheme
    );

    // Calculate statistics for this date
    const statistics = calculateExpiryStatistics(
      dateItems,
      this.options.colorScheme
    );

    return {
      items: dateItems,
      indicators: [] as any[],
      statistics,
    };
  }

  // -------------------------------------------------------------------------
  // DATA PROCESSING
  // -------------------------------------------------------------------------

  private async processCalendarData(
    items: FoodItem[]
  ): Promise<CalendarDataResponse> {
    // Group items by date
    const itemsByDate: Record<string, FoodItem[]> = {};
    items.forEach((item) => {
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
      this.options.colorScheme,
      {
        showItemCounts: true,
        usePatterns: false,
        maxDotsPerDate: 3,
      }
    );

    // Calculate statistics
    const statistics = calculateExpiryStatistics(
      items,
      this.options.colorScheme
    );

    return {
      items,
      markedDates,
      statistics,
      itemsByDate,
    };
  }

  // -------------------------------------------------------------------------
  // UTILITY METHODS
  // -------------------------------------------------------------------------

  private getMonthRange(month: CalendarMonth): {
    startDate: string;
    endDate: string;
  } {
    // First day of the month
    const startDate = new Date(month.year, month.month - 1, 1);

    // Last day of the month
    const endDate = new Date(month.year, month.month, 0);

    // Format dates as YYYY-MM-DD
    const formatDate = (date: Date) => {
      const year = date.getFullYear();
      const monthStr = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      return `${year}-${monthStr}-${day}`;
    };

    return {
      startDate: formatDate(startDate),
      endDate: formatDate(endDate),
    };
  }

  private async prefetchNextMonth(currentMonth: CalendarMonth): Promise<void> {
    try {
      const nextMonth: CalendarMonth = {
        year:
          currentMonth.month === 12 ? currentMonth.year + 1 : currentMonth.year,
        month: currentMonth.month === 12 ? 1 : currentMonth.month + 1,
      };

      // Prefetch in background
      setTimeout(() => {
        this.getCalendarData(nextMonth).catch(() => {
          // Ignore prefetch errors
        });
      }, 1000);
    } catch {
      // Ignore prefetch errors
    }
  }

  // -------------------------------------------------------------------------
  // CACHE MANAGEMENT
  // -------------------------------------------------------------------------

  /**
   * Clear all cached data
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Invalidate cache for a specific month
   */
  invalidateMonth(month: CalendarMonth): void {
    this.cache.invalidateMonth(month);
  }

  /**
   * Refresh data for a specific month
   */
  async refreshMonth(month: CalendarMonth): Promise<CalendarDataResponse> {
    this.invalidateMonth(month);
    return this.getCalendarData(month);
  }

  // -------------------------------------------------------------------------
  // CONFIGURATION
  // -------------------------------------------------------------------------

  /**
   * Update service options
   */
  updateOptions(options: Partial<EnhancedCalendarServiceOptions>): void {
    this.options = { ...this.options, ...options };

    // Clear cache if color scheme changed
    if (options.colorScheme) {
      this.clearCache();
    }
  }

  /**
   * Get current options
   */
  getOptions(): EnhancedCalendarServiceOptions {
    return { ...this.options };
  }
}

// =============================================================================
// SINGLETON INSTANCE
// =============================================================================

export const enhancedCalendarService = new EnhancedCalendarService();

// =============================================================================
// CONVENIENCE FUNCTIONS
// =============================================================================

/**
 * Get calendar data for current month
 */
export async function getCurrentMonthData(): Promise<CalendarDataResponse> {
  const now = new Date();
  const currentMonth: CalendarMonth = {
    year: now.getFullYear(),
    month: now.getMonth() + 1,
  };

  return enhancedCalendarService.getCalendarData(currentMonth);
}

/**
 * Get data for today's date
 */
export async function getTodayData(): Promise<{
  items: FoodItem[];
  indicators: any[];
  statistics: import("../types/calendar").ExpiryStatistics;
}> {
  const today = new Date().toISOString().split("T")[0];
  return enhancedCalendarService.getDateData(today);
}

/**
 * Search items across all months
 */
export async function searchItems(
  searchTerm: string,
  months: CalendarMonth[] = []
): Promise<FoodItem[]> {
  if (months.length === 0) {
    // Default to current and next month
    const now = new Date();
    months = [
      { year: now.getFullYear(), month: now.getMonth() + 1 },
      {
        year: now.getMonth() === 11 ? now.getFullYear() + 1 : now.getFullYear(),
        month: now.getMonth() === 11 ? 1 : now.getMonth() + 2,
      },
    ];
  }

  const allItems: FoodItem[] = [];

  for (const month of months) {
    try {
      const data = await enhancedCalendarService.getCalendarData(month);
      const filteredItems = filterItems(data.items, {
        search: searchTerm,
        showEmpty: true,
      });
      allItems.push(...filteredItems);
    } catch (error) {
      console.warn(
        `Failed to search in month ${month.year}-${month.month}:`,
        error
      );
    }
  }

  return allItems;
}

// =============================================================================
// EXPORT
// =============================================================================

export default enhancedCalendarService;
export { CalendarCache, EnhancedCalendarService };
