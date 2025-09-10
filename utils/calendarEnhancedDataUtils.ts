// Enhanced Calendar Data Processing Utilities
// Extends existing calendar utilities with performance optimizations and new features

import { FoodItem } from "../lib/supabase";
import { ExpiryStatistics, MarkedDatesType } from "../types/calendar";
import {
  CalendarColorScheme,
  DateIndicators,
  FilterOptionsEnhanced,
  LegendItemCounts,
  PatternIndicator,
  SortOptionsEnhanced,
} from "../types/calendar-enhanced";

// =============================================================================
// COLOR SCHEME UTILITIES
// =============================================================================

/**
 * Default color scheme for calendar
 */
export const DEFAULT_COLOR_SCHEME: CalendarColorScheme = {
  expired: {
    primary: "#DC2626", // Red
    secondary: "#FEF2F2", // Light red
    pattern: "solid",
  },
  today: {
    primary: "#EA580C", // Orange
    secondary: "#FFF7ED", // Light orange
    pattern: "solid",
  },
  future: {
    primary: "#16A34A", // Green
    secondary: "#F0FDF4", // Light green
    pattern: "solid",
  },
  accessibility: {
    highContrast: false,
    patterns: false,
    textAlternatives: true,
  },
};

/**
 * High contrast color scheme for accessibility
 */
export const HIGH_CONTRAST_COLOR_SCHEME: CalendarColorScheme = {
  expired: {
    primary: "#B91C1C", // Darker red
    secondary: "#FEE2E2", // Lighter red background
    pattern: "striped",
  },
  today: {
    primary: "#C2410C", // Darker orange
    secondary: "#FED7AA", // Lighter orange background
    pattern: "dotted",
  },
  future: {
    primary: "#15803D", // Darker green
    secondary: "#DCFCE7", // Lighter green background
    pattern: "solid",
  },
  accessibility: {
    highContrast: true,
    patterns: true,
    textAlternatives: true,
  },
};

/**
 * Get appropriate color scheme based on accessibility settings
 */
export function getColorScheme(
  accessibilityMode: boolean = false,
  customScheme?: Partial<CalendarColorScheme>
): CalendarColorScheme {
  const baseScheme = accessibilityMode
    ? HIGH_CONTRAST_COLOR_SCHEME
    : DEFAULT_COLOR_SCHEME;

  if (customScheme) {
    return {
      ...baseScheme,
      ...customScheme,
      accessibility: {
        ...baseScheme.accessibility,
        ...customScheme.accessibility,
      },
    };
  }

  return baseScheme;
}

// =============================================================================
// EXPIRY STATUS CALCULATION
// =============================================================================

export interface ExpiryStatusResult {
  status: "expired" | "today" | "tomorrow" | "soon" | "fresh";
  daysUntilExpiry: number;
  urgencyLevel: "critical" | "high" | "medium" | "low";
  color: string;
  displayText: string;
}

/**
 * Calculate expiry status for a food item
 */
export function calculateExpiryStatus(
  expiryDate: string,
  colorScheme: CalendarColorScheme = DEFAULT_COLOR_SCHEME
): ExpiryStatusResult {
  const toUtcMidnight = (d: Date) =>
    Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
  const todayUtc = toUtcMidnight(new Date());
  const expiryUtc = toUtcMidnight(new Date(expiryDate));
  const daysUntilExpiry = Math.round(
    (expiryUtc - todayUtc) / (24 * 60 * 60 * 1000)
  );

  if (daysUntilExpiry < 0) {
    return {
      status: "expired",
      daysUntilExpiry,
      urgencyLevel: "critical",
      color: colorScheme.expired.primary,
      displayText:
        Math.abs(daysUntilExpiry) === 1
          ? "Expired yesterday"
          : `Expired ${Math.abs(daysUntilExpiry)} days ago`,
    };
  }

  if (daysUntilExpiry === 0) {
    return {
      status: "today",
      daysUntilExpiry,
      urgencyLevel: "critical",
      color: colorScheme.today.primary,
      displayText: "Expires today",
    };
  }

  if (daysUntilExpiry === 1) {
    return {
      status: "tomorrow",
      daysUntilExpiry,
      urgencyLevel: "high",
      color: colorScheme.today.primary,
      displayText: "Expires tomorrow",
    };
  }

  if (daysUntilExpiry <= 7) {
    return {
      status: "soon",
      daysUntilExpiry,
      urgencyLevel: "medium",
      color: colorScheme.future.primary,
      displayText: `Expires in ${daysUntilExpiry} days`,
    };
  }

  return {
    status: "fresh",
    daysUntilExpiry,
    urgencyLevel: "low",
    color: colorScheme.future.primary,
    displayText:
      daysUntilExpiry <= 30 ? `Expires in ${daysUntilExpiry} days` : "Fresh",
  };
}

// =============================================================================
// PATTERN GENERATION
// =============================================================================

/**
 * Generate pattern indicators for accessibility
 */
export function generatePatternIndicators(
  status: "expired" | "today" | "future",
  colorScheme: CalendarColorScheme
): PatternIndicator[] {
  if (!colorScheme.accessibility.patterns) {
    return [];
  }

  const patterns: PatternIndicator[] = [];

  switch (status) {
    case "expired":
      patterns.push({
        type: "striped",
        color: colorScheme.expired.primary,
        size: 3,
        position: "top",
      });
      break;
    case "today":
      patterns.push({
        type: "dotted",
        color: colorScheme.today.primary,
        size: 2,
        position: "center",
      });
      break;
    case "future":
      patterns.push({
        type: "solid",
        color: colorScheme.future.primary,
        size: 4,
        position: "bottom",
      });
      break;
  }

  return patterns;
}

// =============================================================================
// DATE INDICATORS GENERATION
// =============================================================================

/**
 * Generate date indicators for calendar dates
 */
export function generateDateIndicators(
  items: FoodItem[],
  colorScheme: CalendarColorScheme = DEFAULT_COLOR_SCHEME
): DateIndicators {
  const today = new Date().toISOString().split("T")[0];

  const expiryTypes: ("expired" | "today" | "future")[] = [];
  let urgencyLevel: "low" | "medium" | "high" | "critical" = "low";

  for (const item of items) {
    if (!item.expiry_date) continue;

    const status = calculateExpiryStatus(item.expiry_date, colorScheme);

    if (item.expiry_date < today && !expiryTypes.includes("expired")) {
      expiryTypes.push("expired");
    } else if (item.expiry_date === today && !expiryTypes.includes("today")) {
      expiryTypes.push("today");
    } else if (item.expiry_date > today && !expiryTypes.includes("future")) {
      expiryTypes.push("future");
    }

    // Update urgency level to highest found
    if (status.urgencyLevel === "critical") urgencyLevel = "critical";
    else if (status.urgencyLevel === "high" && urgencyLevel !== "critical")
      urgencyLevel = "high";
    else if (
      status.urgencyLevel === "medium" &&
      !["critical", "high"].includes(urgencyLevel)
    )
      urgencyLevel = "medium";
  }

  const patterns: PatternIndicator[] = [];
  for (const type of expiryTypes) {
    patterns.push(...generatePatternIndicators(type, colorScheme));
  }

  return {
    itemCount: items.length,
    expiryTypes,
    urgencyLevel,
    patterns,
  };
}

// =============================================================================
// MARKED DATES GENERATION
// =============================================================================

/**
 * Enhanced marked dates generation with patterns and accessibility
 */
export function createEnhancedMarkedDates(
  itemsByDate: Record<string, FoodItem[]>,
  colorScheme: CalendarColorScheme = DEFAULT_COLOR_SCHEME,
  options: {
    showItemCounts?: boolean;
    usePatterns?: boolean;
    maxDotsPerDate?: number;
  } = {}
): MarkedDatesType {
  const {
    showItemCounts = true,
    usePatterns = false,
    maxDotsPerDate = 3,
  } = options;
  const markedDates: MarkedDatesType = {};
  const today = new Date().toISOString().split("T")[0];

  Object.entries(itemsByDate).forEach(([date, items]) => {
    if (items.length === 0) return;

    const indicators = generateDateIndicators(items, colorScheme);
    const dots: Array<{
      key: string;
      color: string;
      selectedDotColor?: string;
    }> = [];

    // Add dots based on expiry types
    indicators.expiryTypes.forEach((type, index) => {
      if (index >= maxDotsPerDate) return;

      let color: string;
      switch (type) {
        case "expired":
          color = colorScheme.expired.primary;
          break;
        case "today":
          color = colorScheme.today.primary;
          break;
        case "future":
          color = colorScheme.future.primary;
          break;
        default:
          color = colorScheme.future.primary;
      }

      dots.push({
        key: `${type}-${index}`,
        color,
        selectedDotColor: "#FFFFFF",
      });
    });

    markedDates[date] = {
      marked: true,
      dots,
      // Add custom properties for enhanced functionality
      ...(showItemCounts && { itemCount: items.length }),
      // patterns and urgencyLevel are not part of MarkedDate; keep internal only
    };
  });

  return markedDates;
}

// =============================================================================
// FILTERING AND SORTING
// =============================================================================

/**
 * Enhanced filtering for food items
 */
export function filterItems(
  items: FoodItem[],
  filter: FilterOptionsEnhanced
): FoodItem[] {
  return items.filter((item) => {
    // Category filter
    if (filter.category && filter.category.length > 0) {
      if (!item.category || !filter.category.includes(item.category)) {
        return false;
      }
    }

    // Location filter
    if (filter.location && filter.location.length > 0) {
      if (!filter.location.includes(item.location)) {
        return false;
      }
    }

    // Urgency filter
    if (filter.urgency && filter.urgency.length > 0 && item.expiry_date) {
      const status = calculateExpiryStatus(item.expiry_date);
      const urgencyMap: Record<string, string[]> = {
        expired: ["expired"],
        today: ["today", "tomorrow"],
        soon: ["soon"],
        fresh: ["fresh"],
      };

      const matchesUrgency = filter.urgency.some((urgency) =>
        urgencyMap[urgency]?.includes(status.status)
      );

      if (!matchesUrgency) {
        return false;
      }
    }

    // Date range filter
    if (filter.dateRange && item.expiry_date) {
      if (
        item.expiry_date < filter.dateRange.start ||
        item.expiry_date > filter.dateRange.end
      ) {
        return false;
      }
    }

    // Search filter
    if (filter.search && filter.search.trim()) {
      const searchTerm = filter.search.toLowerCase();
      const searchableText = [item.name, item.category, item.notes]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      if (!searchableText.includes(searchTerm)) {
        return false;
      }
    }

    return true;
  });
}

/**
 * Enhanced sorting for food items
 */
export function sortItems(
  items: FoodItem[],
  sort: SortOptionsEnhanced
): FoodItem[] {
  const sortedItems = [...items];

  sortedItems.sort((a, b) => {
    let comparison = 0;

    // Primary sort
    switch (sort.field) {
      case "expiry_date":
        const aDate = a.expiry_date
          ? new Date(a.expiry_date).getTime()
          : Infinity;
        const bDate = b.expiry_date
          ? new Date(b.expiry_date).getTime()
          : Infinity;
        comparison = aDate - bDate;
        break;
      case "name":
        comparison = a.name.localeCompare(b.name);
        break;
      case "created_at":
        comparison =
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        break;
      case "quantity":
        comparison = a.quantity - b.quantity;
        break;
      case "urgency":
        if (a.expiry_date && b.expiry_date) {
          const aStatus = calculateExpiryStatus(a.expiry_date);
          const bStatus = calculateExpiryStatus(b.expiry_date);
          const urgencyOrder = { critical: 0, high: 1, medium: 2, low: 3 };
          comparison =
            urgencyOrder[aStatus.urgencyLevel] -
            urgencyOrder[bStatus.urgencyLevel];
        }
        break;
    }

    // Apply direction
    if (sort.direction === "desc") {
      comparison = -comparison;
    }

    // Secondary sort if primary is equal
    if (comparison === 0 && sort.secondary) {
      switch (sort.secondary.field) {
        case "expiry_date":
          const aDate = a.expiry_date
            ? new Date(a.expiry_date).getTime()
            : Infinity;
          const bDate = b.expiry_date
            ? new Date(b.expiry_date).getTime()
            : Infinity;
          comparison = aDate - bDate;
          break;
        case "name":
          comparison = a.name.localeCompare(b.name);
          break;
        case "created_at":
          comparison =
            new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
          break;
        case "quantity":
          comparison = a.quantity - b.quantity;
          break;
      }

      if (sort.secondary.direction === "desc") {
        comparison = -comparison;
      }
    }

    return comparison;
  });

  return sortedItems;
}

// =============================================================================
// STATISTICS CALCULATION
// =============================================================================

/**
 * Calculate comprehensive expiry statistics
 */
export function calculateExpiryStatistics(
  items: FoodItem[],
  colorScheme: CalendarColorScheme = DEFAULT_COLOR_SCHEME
): ExpiryStatistics {
  const today = new Date().toISOString().split("T")[0];
  const oneWeekFromNow = new Date();
  oneWeekFromNow.setDate(oneWeekFromNow.getDate() + 7);
  const oneWeekFromNowStr = oneWeekFromNow.toISOString().split("T")[0];

  const oneMonthFromNow = new Date();
  oneMonthFromNow.setMonth(oneMonthFromNow.getMonth() + 1);
  const oneMonthFromNowStr = oneMonthFromNow.toISOString().split("T")[0];

  let expiredItems = 0;
  let expiringToday = 0;
  let expiringThisWeek = 0;
  let expiringThisMonth = 0;
  let totalDays = 0;
  let itemsWithExpiry = 0;

  const categories: Record<string, number> = {};
  const locations: Record<string, number> = {};

  items.forEach((item) => {
    // Count by category
    const category = item.category || "Uncategorized";
    categories[category] = (categories[category] || 0) + 1;

    // Count by location
    locations[item.location] = (locations[item.location] || 0) + 1;

    // Process expiry dates
    if (item.expiry_date) {
      itemsWithExpiry++;
      const status = calculateExpiryStatus(item.expiry_date, colorScheme);
      totalDays += status.daysUntilExpiry;

      if (item.expiry_date < today) {
        expiredItems++;
      } else if (item.expiry_date === today) {
        expiringToday++;
      } else if (item.expiry_date <= oneWeekFromNowStr) {
        expiringThisWeek++;
      } else if (item.expiry_date <= oneMonthFromNowStr) {
        expiringThisMonth++;
      }
    }
  });

  const averageDaysToExpiry =
    itemsWithExpiry > 0 ? totalDays / itemsWithExpiry : 0;
  const urgentActionRequired = expiredItems > 0 || expiringToday > 0;

  return {
    totalItems: items.length,
    expiredItems,
    expiringToday,
    expiringThisWeek,
    urgentActionRequired,
    averageDaysToExpiry: Math.round(averageDaysToExpiry * 10) / 10,
    categories,
    locations,
  } as any;
}

// =============================================================================
// LEGEND UTILITIES
// =============================================================================

/**
 * Calculate legend item counts
 */
export function calculateLegendCounts(
  items: FoodItem[],
  colorScheme: CalendarColorScheme = DEFAULT_COLOR_SCHEME
): LegendItemCounts {
  const today = new Date().toISOString().split("T")[0];

  let expired = 0;
  let todayCount = 0;
  let future = 0;

  items.forEach((item) => {
    if (!item.expiry_date) return;

    if (item.expiry_date < today) {
      expired++;
    } else if (item.expiry_date === today) {
      todayCount++;
    } else {
      future++;
    }
  });

  return {
    expired,
    today: todayCount,
    future,
    total: items.length,
  };
}

// =============================================================================
// PERFORMANCE UTILITIES
// =============================================================================

/**
 * Batch process items for better performance
 */
export function batchProcessItems<T, R>(
  items: T[],
  processor: (batch: T[]) => R[],
  batchSize: number = 100
): R[] {
  const results: R[] = [];

  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    const batchResults = processor(batch);
    results.push(...batchResults);
  }

  return results;
}

/**
 * Memoization utility for expensive calculations
 */
export function memoize<Args extends unknown[], Return>(
  fn: (...args: Args) => Return,
  getKey?: (...args: Args) => string
): (...args: Args) => Return {
  const cache = new Map<string, Return>();

  return (...args: Args) => {
    const key = getKey ? getKey(...args) : JSON.stringify(args);

    if (cache.has(key)) {
      return cache.get(key)!;
    }

    const result = fn(...args);
    cache.set(key, result);
    return result;
  };
}

// Memoized versions of expensive functions
export const memoizedCalculateExpiryStatus = memoize(
  calculateExpiryStatus,
  (expiryDate, colorScheme) => `${expiryDate}-${JSON.stringify(colorScheme)}`
);

export const memoizedGenerateDateIndicators = memoize(
  generateDateIndicators,
  (items, colorScheme) =>
    `${items.map((i) => i.id).join(",")}-${JSON.stringify(colorScheme)}`
);

// =============================================================================
// VALIDATION UTILITIES
// =============================================================================

/**
 * Validate calendar data
 */
export function validateCalendarData(data: {
  items: FoodItem[];
  dateRange?: { start: string; end: string };
}): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Validate items
  if (!Array.isArray(data.items)) {
    errors.push("Items must be an array");
  } else {
    data.items.forEach((item, index) => {
      if (!item.id) errors.push(`Item at index ${index} missing id`);
      if (!item.name) errors.push(`Item at index ${index} missing name`);
      if (typeof item.quantity !== "number")
        errors.push(`Item at index ${index} invalid quantity`);
    });
  }

  // Validate date range
  if (data.dateRange) {
    const { start, end } = data.dateRange;
    if (!start || !end) {
      errors.push("Date range must have both start and end dates");
    } else if (new Date(start) > new Date(end)) {
      errors.push("Start date must be before end date");
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}
