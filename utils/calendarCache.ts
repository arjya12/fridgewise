/**
 * Calendar Cache Utility
 * Manages month data caching to prevent redundant API calls
 * Separated from hooks to avoid circular dependencies
 */

import { FoodItem } from "../lib/supabase";

// =============================================================================
// CACHE CONFIGURATION
// =============================================================================

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
const MAX_CACHE_SIZE = 12; // Store up to 12 months

// =============================================================================
// CACHE STORAGE
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

// =============================================================================
// CACHE FUNCTIONS
// =============================================================================

/**
 * Clear the month data cache
 * Used when data needs to be refreshed
 */
export const clearMonthDataCache = () => {
  monthDataCache.clear();
};

/**
 * Get cached month data if available and valid
 */
export const getCachedMonthData = (
  cacheKey: string
): Record<string, FoodItem[]> | null => {
  const cached = monthDataCache.get(cacheKey);
  if (cached && Date.now() < cached.expiry) {
    return cached.data;
  }
  return null;
};

/**
 * Set month data in cache
 */
export const setCachedMonthData = (
  cacheKey: string,
  data: Record<string, FoodItem[]>
) => {
  monthDataCache.set(cacheKey, {
    data,
    timestamp: Date.now(),
    expiry: Date.now() + CACHE_DURATION,
  });

  // Limit cache size
  if (monthDataCache.size > MAX_CACHE_SIZE) {
    const oldestKey = Array.from(monthDataCache.keys())[0];
    monthDataCache.delete(oldestKey);
  }
};

/**
 * Check if cache key exists and is valid
 */
export const hasValidCache = (cacheKey: string): boolean => {
  const cached = monthDataCache.get(cacheKey);
  return cached !== undefined && Date.now() < cached.expiry;
};


