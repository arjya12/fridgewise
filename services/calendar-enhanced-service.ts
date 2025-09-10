// Enhanced Calendar Service
// Extends existing foodItems service with calendar-specific optimizations

import { FoodItem } from "../lib/supabase";
import {
  CalendarData,
  CalendarError,
  CalendarMonth,
  MonthRange,
} from "../types/calendar";
import {
  FilterOptionsEnhanced,
  SortOptionsEnhanced,
} from "../types/calendar-enhanced";
import { foodItemsService } from "./foodItems";

// =============================================================================
// ENHANCED CALENDAR DATA SERVICE
// =============================================================================

export interface CalendarDataService {
  // Core data fetching
  getCalendarData(
    month: CalendarMonth,
    options?: CalendarDataOptions
  ): Promise<CalendarData>;

  // Performance optimized fetching
  getCalendarDataCached(
    month: CalendarMonth,
    options?: CalendarDataOptions
  ): Promise<CalendarData>;

  // Prefetch adjacent months for smooth navigation
  prefetchAdjacentMonths(
    currentMonth: CalendarMonth,
    direction?: "both" | "forward" | "backward"
  ): Promise<void>;

  // Batch operations for multiple months
  getMultipleMonthsData(
    months: CalendarMonth[],
    options?: CalendarDataOptions
  ): Promise<Record<string, CalendarData>>;

  // Real-time updates
  subscribeToCalendarUpdates(
    month: CalendarMonth,
    callback: (data: CalendarData) => void
  ): () => void;

  // Cache management
  clearCache(month?: CalendarMonth): void;
  getCacheSize(): number;
  getCacheStatus(): CacheStatus;
}

export interface CalendarDataOptions {
  includeExpired?: boolean;
  daysAhead?: number;
  filter?: FilterOptionsEnhanced;
  sort?: SortOptionsEnhanced;
  virtualized?: boolean;
  maxItems?: number;
}

export interface CacheStatus {
  totalSize: number;
  itemCount: number;
  lastCleared: string;
  hitRate: number;
  memoryUsage: number;
}

// =============================================================================
// PERFORMANCE OPTIMIZED DATA FETCHING
// =============================================================================

export interface OptimizedFetchConfig {
  enableCaching: boolean;
  cacheTimeout: number; // milliseconds
  maxCacheSize: number; // items
  prefetchStrategy: "aggressive" | "conservative" | "none";
  batchSize: number;
  retryConfig: RetryConfig;
}

export interface RetryConfig {
  maxAttempts: number;
  backoffMultiplier: number;
  initialDelay: number;
  maxDelay: number;
}

export interface DataFetchResult<T> {
  data: T;
  cached: boolean;
  timestamp: string;
  source: "cache" | "network" | "hybrid";
  performance: FetchPerformanceMetrics;
}

export interface FetchPerformanceMetrics {
  fetchTime: number;
  cacheHit: boolean;
  dataSize: number;
  networkLatency?: number;
  processingTime: number;
}

// =============================================================================
// CALENDAR-SPECIFIC DATA TRANSFORMATIONS
// =============================================================================

export interface CalendarDataTransformer {
  // Transform raw items to calendar format
  transformToCalendarData(
    items: FoodItem[],
    options?: TransformOptions
  ): CalendarData;

  // Create marked dates for react-native-calendars
  createMarkedDates(
    items: FoodItem[],
    colorScheme?: any,
    options?: MarkedDatesOptions
  ): Record<string, any>;

  // Group items by date efficiently
  groupItemsByDate(
    items: FoodItem[],
    options?: GroupingOptions
  ): Record<string, FoodItem[]>;

  // Calculate expiry statistics
  calculateExpiryStatistics(
    items: FoodItem[]
  ): import("../types/calendar").ExpiryStatistics;

  // Filter and sort optimized for calendar view
  filterAndSort(
    items: FoodItem[],
    filter?: FilterOptionsEnhanced,
    sort?: SortOptionsEnhanced
  ): FoodItem[];
}

export interface TransformOptions {
  includePatterns?: boolean;
  generateAccessibilityLabels?: boolean;
  optimizeForPerformance?: boolean;
  maxItemsPerDate?: number;
}

export interface MarkedDatesOptions {
  showItemCounts?: boolean;
  usePatterns?: boolean;
  maxDotsPerDate?: number;
  colorScheme?: any;
}

export interface GroupingOptions {
  sortWithinGroups?: boolean;
  includeEmptyDates?: boolean;
  dateRange?: {
    start: string;
    end: string;
  };
}

// Note: use ExpiryStatistics from types/calendar for consistency

// =============================================================================
// ERROR HANDLING & RESILIENCE
// =============================================================================

export interface ErrorHandlingService {
  handleCalendarError(error: any, context: ErrorContext): CalendarError;
  retryFailedRequest<T>(
    operation: () => Promise<T>,
    config: RetryConfig
  ): Promise<T>;
  reportError(error: CalendarError): void;
  getErrorRecoveryStrategy(error: CalendarError): RecoveryStrategy;
}

export interface ErrorContext {
  operation: string;
  month?: CalendarMonth;
  itemId?: string;
  userId?: string;
  timestamp: string;
  additionalData?: any;
}

export interface RecoveryStrategy {
  type: "retry" | "fallback" | "cache" | "manual";
  action: string;
  autoExecute: boolean;
  userMessage?: string;
}

// =============================================================================
// OFFLINE SUPPORT
// =============================================================================

export interface OfflineCalendarService {
  // Store data for offline access
  storeOfflineData(month: CalendarMonth, data: CalendarData): Promise<void>;

  // Retrieve offline data
  getOfflineData(month: CalendarMonth): Promise<CalendarData | null>;

  // Sync when back online
  syncOfflineChanges(): Promise<SyncResult>;

  // Check offline status
  isOffline(): boolean;

  // Queue operations for later sync
  queueOperation(operation: OfflineOperation): void;

  // Get queued operations
  getQueuedOperations(): OfflineOperation[];
}

export interface OfflineOperation {
  id: string;
  type: "create" | "update" | "delete";
  data: any;
  timestamp: string;
  retryCount: number;
}

export interface SyncResult {
  successful: number;
  failed: number;
  conflicts: number;
  errors: CalendarError[];
}

// =============================================================================
// ANALYTICS & MONITORING
// =============================================================================

export interface CalendarAnalyticsService {
  // Track user interactions
  trackCalendarInteraction(event: AnalyticsEvent): void;

  // Monitor performance
  trackPerformanceMetric(metric: FetchPerformanceMetrics): void;

  // Track errors
  trackError(error: CalendarError): void;

  // Get usage statistics
  getUsageStatistics(timeRange: TimeRange): Promise<UsageStatistics>;
}

export interface AnalyticsEvent {
  type:
    | "date_select"
    | "month_change"
    | "item_press"
    | "filter_apply"
    | "sort_change";
  data: any;
  timestamp: string;
  userId?: string;
  sessionId: string;
}

export interface TimeRange {
  start: string;
  end: string;
}

export interface UsageStatistics {
  totalInteractions: number;
  averageSessionDuration: number;
  mostUsedFeatures: string[];
  errorRate: number;
  performanceMetrics: FetchPerformanceMetrics;
}

// =============================================================================
// MAIN ENHANCED CALENDAR SERVICE IMPLEMENTATION
// =============================================================================

class EnhancedCalendarService implements CalendarDataService {
  private cache = new Map<string, { data: CalendarData; timestamp: number }>();
  private subscribers = new Map<string, ((data: CalendarData) => void)[]>();
  private config: OptimizedFetchConfig;
  private transformer: CalendarDataTransformer;
  private errorHandler: ErrorHandlingService;
  private offlineService: OfflineCalendarService;
  private analytics: CalendarAnalyticsService;

  constructor(
    config: OptimizedFetchConfig,
    transformer: CalendarDataTransformer,
    errorHandler: ErrorHandlingService,
    offlineService: OfflineCalendarService,
    analytics: CalendarAnalyticsService
  ) {
    this.config = config;
    this.transformer = transformer;
    this.errorHandler = errorHandler;
    this.offlineService = offlineService;
    this.analytics = analytics;
  }

  async getCalendarData(
    month: CalendarMonth,
    options: CalendarDataOptions = {}
  ): Promise<CalendarData> {
    const startTime = Date.now();
    const cacheKey = this.generateCacheKey(month, options);

    try {
      // Check cache first if enabled
      if (this.config.enableCaching) {
        const cached = this.getCachedData(cacheKey);
        if (cached) {
          this.analytics.trackPerformanceMetric({
            fetchTime: Date.now() - startTime,
            cacheHit: true,
            dataSize: JSON.stringify(cached).length,
            processingTime: 0,
          });
          return cached;
        }
      }

      // Check offline data if network unavailable
      if (this.offlineService.isOffline()) {
        const offlineData = await this.offlineService.getOfflineData(month);
        if (offlineData) {
          return offlineData;
        }
      }

      // Fetch fresh data
      const { startDate, endDate } = this.getMonthRange(month);
      const rawItems = await foodItemsService.getItemsByExpiryDate(
        startDate,
        endDate
      );

      // Transform to calendar format
      const flatItems = Object.values(rawItems).flat();
      const filteredItems = this.transformer.filterAndSort(
        flatItems,
        options.filter,
        options.sort
      );

      const calendarData = this.transformer.transformToCalendarData(
        filteredItems,
        {
          includePatterns: true,
          generateAccessibilityLabels: true,
          optimizeForPerformance: options.virtualized,
          maxItemsPerDate: options.maxItems,
        }
      );

      // Cache the result
      if (this.config.enableCaching) {
        this.setCachedData(cacheKey, calendarData);
      }

      // Store offline backup
      await this.offlineService.storeOfflineData(month, calendarData);

      // Track performance
      this.analytics.trackPerformanceMetric({
        fetchTime: Date.now() - startTime,
        cacheHit: false,
        dataSize: JSON.stringify(calendarData).length,
        processingTime: 0,
      });

      return calendarData;
    } catch (error) {
      const calendarError = this.errorHandler.handleCalendarError(error, {
        operation: "getCalendarData",
        month,
        timestamp: new Date().toISOString(),
      });

      this.analytics.trackError(calendarError);

      // Try recovery strategy
      const strategy =
        this.errorHandler.getErrorRecoveryStrategy(calendarError);
      if (strategy.type === "cache" || strategy.type === "fallback") {
        const fallbackData = await this.offlineService.getOfflineData(month);
        if (fallbackData) {
          return fallbackData;
        }
      }

      throw calendarError;
    }
  }

  async getCalendarDataCached(
    month: CalendarMonth,
    options: CalendarDataOptions = {}
  ): Promise<CalendarData> {
    const cacheKey = this.generateCacheKey(month, options);
    const cached = this.getCachedData(cacheKey);

    if (cached) {
      return cached;
    }

    return this.getCalendarData(month, options);
  }

  async prefetchAdjacentMonths(
    currentMonth: CalendarMonth,
    direction: "both" | "forward" | "backward" = "both"
  ): Promise<void> {
    const monthsToFetch: CalendarMonth[] = [];

    if (direction === "both" || direction === "forward") {
      monthsToFetch.push(this.getNextMonth(currentMonth));
    }

    if (direction === "both" || direction === "backward") {
      monthsToFetch.push(this.getPreviousMonth(currentMonth));
    }

    // Prefetch in background without blocking
    Promise.all(
      monthsToFetch.map((month) =>
        this.getCalendarData(month).catch(() => {
          // Silently fail for prefetch operations
        })
      )
    );
  }

  async getMultipleMonthsData(
    months: CalendarMonth[],
    options: CalendarDataOptions = {}
  ): Promise<Record<string, CalendarData>> {
    const results: Record<string, CalendarData> = {};

    // Batch fetch for better performance
    const promises = months.map(async (month) => {
      const key = `${month.year}-${month.month}`;
      try {
        results[key] = await this.getCalendarData(month, options);
      } catch (error) {
        // Continue with other months even if one fails
        console.error(`Failed to fetch data for ${key}:`, error);
      }
    });

    await Promise.all(promises);
    return results;
  }

  subscribeToCalendarUpdates(
    month: CalendarMonth,
    callback: (data: CalendarData) => void
  ): () => void {
    const key = `${month.year}-${month.month}`;

    if (!this.subscribers.has(key)) {
      this.subscribers.set(key, []);
    }

    this.subscribers.get(key)!.push(callback);

    // Return unsubscribe function
    return () => {
      const callbacks = this.subscribers.get(key);
      if (callbacks) {
        const index = callbacks.indexOf(callback);
        if (index > -1) {
          callbacks.splice(index, 1);
        }
      }
    };
  }

  clearCache(month?: CalendarMonth): void {
    if (month) {
      const key = `${month.year}-${month.month}`;
      this.cache.delete(key);
    } else {
      this.cache.clear();
    }
  }

  getCacheSize(): number {
    return this.cache.size;
  }

  getCacheStatus(): CacheStatus {
    const totalSize = this.cache.size;
    let totalItems = 0;
    let totalMemory = 0;

    for (const [, value] of this.cache) {
      totalItems += value.data.expiringSoonItems.length;
      totalMemory += JSON.stringify(value.data).length;
    }

    return {
      totalSize,
      itemCount: totalItems,
      lastCleared: new Date().toISOString(),
      hitRate: 0, // Would need to track hits/misses
      memoryUsage: totalMemory,
    };
  }

  // Private helper methods
  private generateCacheKey(
    month: CalendarMonth,
    options: CalendarDataOptions
  ): string {
    return `${month.year}-${month.month}-${JSON.stringify(options)}`;
  }

  private getCachedData(key: string): CalendarData | null {
    const cached = this.cache.get(key);
    if (!cached) return null;

    const isExpired = Date.now() - cached.timestamp > this.config.cacheTimeout;
    if (isExpired) {
      this.cache.delete(key);
      return null;
    }

    return cached.data;
  }

  private setCachedData(key: string, data: CalendarData): void {
    // Implement LRU cache behavior
    if (this.cache.size >= this.config.maxCacheSize) {
      const first = this.cache.keys().next();
      const firstKey =
        first && typeof first.value === "string" ? first.value : undefined;
      if (firstKey) this.cache.delete(firstKey);
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
    });
  }

  private getMonthRange(month: CalendarMonth): MonthRange {
    const startDate = new Date(month.year, month.month - 1, 1);
    const endDate = new Date(month.year, month.month, 0);

    return {
      startDate: startDate.toISOString().split("T")[0],
      endDate: endDate.toISOString().split("T")[0],
    };
  }

  private getNextMonth(month: CalendarMonth): CalendarMonth {
    if (month.month === 12) {
      return { year: month.year + 1, month: 1 };
    }
    return { year: month.year, month: month.month + 1 };
  }

  private getPreviousMonth(month: CalendarMonth): CalendarMonth {
    if (month.month === 1) {
      return { year: month.year - 1, month: 12 };
    }
    return { year: month.year, month: month.month - 1 };
  }
}

// =============================================================================
// SERVICE FACTORY & CONFIGURATION
// =============================================================================

export interface CalendarServiceConfig {
  caching: OptimizedFetchConfig;
  offline: boolean;
  analytics: boolean;
  errorReporting: boolean;
}

export function createEnhancedCalendarService(
  config: CalendarServiceConfig
): EnhancedCalendarService {
  // Create service instances based on configuration
  const transformer = new CalendarDataTransformerImpl();
  const errorHandler = new ErrorHandlingServiceImpl();
  const offlineService = config.offline
    ? new OfflineCalendarServiceImpl()
    : null;
  const analytics = config.analytics
    ? new CalendarAnalyticsServiceImpl()
    : null;

  return new EnhancedCalendarService(
    config.caching,
    transformer,
    errorHandler,
    offlineService!,
    analytics!
  );
}

// Placeholder implementations - would be fully implemented in separate files
class CalendarDataTransformerImpl implements CalendarDataTransformer {
  transformToCalendarData(
    items: FoodItem[],
    options?: TransformOptions
  ): CalendarData {
    throw new Error("Method not implemented.");
  }
  createMarkedDates(
    items: FoodItem[],
    colorScheme?: any,
    options?: MarkedDatesOptions
  ): Record<string, any> {
    return {};
  }
  groupItemsByDate(
    items: FoodItem[],
    options?: GroupingOptions
  ): Record<string, FoodItem[]> {
    throw new Error("Method not implemented.");
  }
  calculateExpiryStatistics(
    items: FoodItem[]
  ): import("../types/calendar").ExpiryStatistics {
    return {
      totalItems: items.length,
      expiredItems: 0,
      expiringToday: 0,
      expiringThisWeek: 0,
      urgentActionRequired: false,
    } as any;
  }
  filterAndSort(
    items: FoodItem[],
    filter?: FilterOptionsEnhanced,
    sort?: SortOptionsEnhanced
  ): FoodItem[] {
    return items;
  }
}

class ErrorHandlingServiceImpl implements ErrorHandlingService {
  handleCalendarError(error: any, context: ErrorContext): CalendarError {
    throw new Error("Method not implemented.");
  }
  retryFailedRequest<T>(
    operation: () => Promise<T>,
    config: RetryConfig
  ): Promise<T> {
    throw new Error("Method not implemented.");
  }
  reportError(error: CalendarError): void {
    throw new Error("Method not implemented.");
  }
  getErrorRecoveryStrategy(error: CalendarError): RecoveryStrategy {
    throw new Error("Method not implemented.");
  }
}

class OfflineCalendarServiceImpl implements OfflineCalendarService {
  storeOfflineData(month: CalendarMonth, data: CalendarData): Promise<void> {
    throw new Error("Method not implemented.");
  }
  getOfflineData(month: CalendarMonth): Promise<CalendarData | null> {
    throw new Error("Method not implemented.");
  }
  syncOfflineChanges(): Promise<SyncResult> {
    throw new Error("Method not implemented.");
  }
  isOffline(): boolean {
    throw new Error("Method not implemented.");
  }
  queueOperation(operation: OfflineOperation): void {
    throw new Error("Method not implemented.");
  }
  getQueuedOperations(): OfflineOperation[] {
    throw new Error("Method not implemented.");
  }
}

class CalendarAnalyticsServiceImpl implements CalendarAnalyticsService {
  trackCalendarInteraction(event: AnalyticsEvent): void {
    throw new Error("Method not implemented.");
  }
  trackPerformanceMetric(metric: FetchPerformanceMetrics): void {
    throw new Error("Method not implemented.");
  }
  trackError(error: CalendarError): void {
    throw new Error("Method not implemented.");
  }
  getUsageStatistics(timeRange: TimeRange): Promise<UsageStatistics> {
    throw new Error("Method not implemented.");
  }
}

// Export default service instance
export const enhancedCalendarService = createEnhancedCalendarService({
  caching: {
    enableCaching: true,
    cacheTimeout: 5 * 60 * 1000, // 5 minutes
    maxCacheSize: 10,
    prefetchStrategy: "conservative",
    batchSize: 100,
    retryConfig: {
      maxAttempts: 3,
      backoffMultiplier: 2,
      initialDelay: 1000,
      maxDelay: 10000,
    },
  },
  offline: true,
  analytics: true,
  errorReporting: true,
});
