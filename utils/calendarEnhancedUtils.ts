// Enhanced Calendar Utility Functions
// Based on design specifications from Phase 2

import { FoodItem } from "../lib/supabase";
import {
  CalendarData,
  ExpiryCalculation,
  ExpiryStatistics,
  ExpiryStatus,
  MarkedDatesType,
  MonthRange,
} from "../types/calendar";

// Color constants from design specification
export const EXPIRY_COLORS = {
  expired: "#FF3B30",
  today: "#FF9500",
  tomorrow: "#FFCC00",
  soon: "#34C759",
  fresh: "#6B7280",
} as const;

// Time constants
const MILLISECONDS_PER_DAY = 24 * 60 * 60 * 1000;

/**
 * Calculate expiry status for a food item
 */
export function calculateExpiryStatus(expiryDate: string): ExpiryCalculation {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const expiry = new Date(expiryDate);
  expiry.setHours(0, 0, 0, 0);

  const daysUntilExpiry = Math.ceil(
    (expiry.getTime() - today.getTime()) / MILLISECONDS_PER_DAY
  );

  let urgency: ExpiryStatus["urgency"];
  let text: string;
  let color: string;

  if (daysUntilExpiry < 0) {
    urgency = "expired";
    text =
      Math.abs(daysUntilExpiry) === 1
        ? "1 day ago"
        : `${Math.abs(daysUntilExpiry)} days ago`;
    color = EXPIRY_COLORS.expired;
  } else if (daysUntilExpiry === 0) {
    urgency = "today";
    text = "Today";
    color = EXPIRY_COLORS.today;
  } else if (daysUntilExpiry === 1) {
    urgency = "tomorrow";
    text = "Tomorrow";
    color = EXPIRY_COLORS.tomorrow;
  } else if (daysUntilExpiry <= 7) {
    urgency = "soon";
    text = `${daysUntilExpiry} days`;
    color = EXPIRY_COLORS.soon;
  } else {
    urgency = "fresh";
    if (daysUntilExpiry <= 14) {
      text = `${daysUntilExpiry} days`;
    } else if (daysUntilExpiry <= 30) {
      const weeks = Math.floor(daysUntilExpiry / 7);
      text = weeks === 1 ? "1 week" : `${weeks} weeks`;
    } else {
      const months = Math.floor(daysUntilExpiry / 30);
      text = months === 1 ? "1 month" : `${months} months`;
    }
    color = EXPIRY_COLORS.fresh;
  }

  const status: ExpiryStatus = {
    days: daysUntilExpiry,
    text,
    color,
    urgency,
  };

  return {
    daysUntilExpiry,
    status,
    isUrgent:
      urgency === "expired" || urgency === "today" || urgency === "tomorrow",
  };
}

/**
 * Format date for display in headers
 */
export function formatDateForDisplay(dateString: string): string {
  const date = new Date(dateString);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const targetDate = new Date(date);
  targetDate.setHours(0, 0, 0, 0);

  const diffTime = targetDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / MILLISECONDS_PER_DAY);

  if (diffDays === 0) {
    return "Today";
  } else if (diffDays === 1) {
    return "Tomorrow";
  } else if (diffDays === -1) {
    return "Yesterday";
  } else {
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }
}

/**
 * Get items expiring within specified days
 */
export function getExpiringSoonItems(
  items: FoodItem[],
  daysAhead: number = 7
): FoodItem[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const futureDate = new Date(today);
  futureDate.setDate(futureDate.getDate() + daysAhead);

  return items
    .filter((item) => {
      if (!item.expiry_date) return false;

      const expiryDate = new Date(item.expiry_date);
      expiryDate.setHours(0, 0, 0, 0);

      return expiryDate >= today && expiryDate <= futureDate;
    })
    .sort((a, b) => {
      const dateA = new Date(a.expiry_date!).getTime();
      const dateB = new Date(b.expiry_date!).getTime();
      return dateA - dateB;
    });
}

/**
 * Group items by expiry date
 */
export function groupItemsByExpiryDate(
  items: FoodItem[]
): Record<string, FoodItem[]> {
  const grouped: Record<string, FoodItem[]> = {};

  items.forEach((item) => {
    if (item.expiry_date) {
      const dateKey = item.expiry_date.split("T")[0]; // Get YYYY-MM-DD format
      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      grouped[dateKey].push(item);
    }
  });

  // Sort items within each date by urgency
  Object.keys(grouped).forEach((date) => {
    grouped[date].sort((a, b) => {
      const statusA = calculateExpiryStatus(a.expiry_date!);
      const statusB = calculateExpiryStatus(b.expiry_date!);
      return statusA.daysUntilExpiry - statusB.daysUntilExpiry;
    });
  });

  return grouped;
}

/**
 * Create marked dates for calendar display
 */
export function createMarkedDates(
  itemsByDate: Record<string, FoodItem[]>
): MarkedDatesType {
  const marked: MarkedDatesType = {};

  Object.entries(itemsByDate).forEach(([date, items]) => {
    if (items.length === 0) return;

    // Get unique urgency levels for this date
    const urgencyLevels = new Set(
      items.map(
        (item) => calculateExpiryStatus(item.expiry_date!).status.urgency
      )
    );

    // Create dots for each urgency level
    const dots = Array.from(urgencyLevels).map((urgency) => ({
      key: urgency,
      color: EXPIRY_COLORS[urgency],
      selectedDotColor: "#FFFFFF",
    }));

    // Sort dots by priority (expired first, then today, etc.)
    const urgencyPriority = {
      expired: 0,
      today: 1,
      tomorrow: 2,
      soon: 3,
      fresh: 4,
    };
    dots.sort(
      (a, b) =>
        urgencyPriority[a.key as keyof typeof urgencyPriority] -
        urgencyPriority[b.key as keyof typeof urgencyPriority]
    );

    marked[date] = {
      marked: true,
      dots: dots.slice(0, 3), // Limit to 3 dots for visual clarity
    };
  });

  return marked;
}

/**
 * Get month range for data loading
 */
export function getMonthRange(year: number, month: number): MonthRange {
  // Start from beginning of month
  const startDate = new Date(year, month - 1, 1);

  // End at beginning of next month
  const endDate = new Date(year, month, 1);

  return {
    startDate: startDate.toISOString().split("T")[0],
    endDate: endDate.toISOString().split("T")[0],
  };
}

/**
 * Calculate expiry statistics for dashboard integration
 */
export function calculateExpiryStatistics(items: FoodItem[]): ExpiryStatistics {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const oneWeekFromNow = new Date(today);
  oneWeekFromNow.setDate(oneWeekFromNow.getDate() + 7);

  let expiredItems = 0;
  let expiringToday = 0;
  let expiringThisWeek = 0;

  items.forEach((item) => {
    if (!item.expiry_date) return;

    const expiryDate = new Date(item.expiry_date);
    expiryDate.setHours(0, 0, 0, 0);

    if (expiryDate < today) {
      expiredItems++;
    } else if (expiryDate.getTime() === today.getTime()) {
      expiringToday++;
    } else if (expiryDate <= oneWeekFromNow) {
      expiringThisWeek++;
    }
  });

  return {
    totalItems: items.length,
    expiredItems,
    expiringToday,
    expiringThisWeek,
    urgentActionRequired: expiredItems > 0 || expiringToday > 0,
  };
}

/**
 * Filter items by urgency level
 */
export function filterItemsByUrgency(
  items: FoodItem[],
  urgencyLevels: ExpiryStatus["urgency"][]
): FoodItem[] {
  return items.filter((item) => {
    if (!item.expiry_date) return false;

    const calculation = calculateExpiryStatus(item.expiry_date);
    return urgencyLevels.includes(calculation.status.urgency);
  });
}

/**
 * Sort items by expiry date and urgency
 */
export function sortItemsByExpiry(
  items: FoodItem[],
  direction: "asc" | "desc" = "asc"
): FoodItem[] {
  return [...items].sort((a, b) => {
    if (!a.expiry_date && !b.expiry_date) return 0;
    if (!a.expiry_date) return direction === "asc" ? 1 : -1;
    if (!b.expiry_date) return direction === "asc" ? -1 : 1;

    const calcA = calculateExpiryStatus(a.expiry_date);
    const calcB = calculateExpiryStatus(b.expiry_date);

    const multiplier = direction === "asc" ? 1 : -1;
    return (calcA.daysUntilExpiry - calcB.daysUntilExpiry) * multiplier;
  });
}

/**
 * Create calendar data structure for component consumption
 */
export function createCalendarData(
  items: FoodItem[],
  daysAhead: number = 7
): CalendarData {
  const itemsByDate = groupItemsByExpiryDate(items);
  const markedDates = createMarkedDates(itemsByDate);
  const expiringSoonItems = getExpiringSoonItems(items, daysAhead);

  return {
    markedDates,
    itemsByDate,
    expiringSoonItems,
  };
}

/**
 * Check if date is today
 */
export function isToday(dateString: string): boolean {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const date = new Date(dateString);
  date.setHours(0, 0, 0, 0);

  return date.getTime() === today.getTime();
}

/**
 * Check if date is in the past
 */
export function isPastDate(dateString: string): boolean {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const date = new Date(dateString);
  date.setHours(0, 0, 0, 0);

  return date.getTime() < today.getTime();
}

/**
 * Get relative time description
 */
export function getRelativeTimeDescription(dateString: string): string {
  const calculation = calculateExpiryStatus(dateString);
  return calculation.status.text;
}

/**
 * Validate date string format
 */
export function isValidDateString(dateString: string): boolean {
  if (!dateString) return false;

  const date = new Date(dateString);
  return !isNaN(date.getTime()) && dateString.includes("-");
}

/**
 * Get current date in YYYY-MM-DD format
 */
export function getCurrentDateString(): string {
  const today = new Date();
  return today.toISOString().split("T")[0];
}

/**
 * Add days to a date string
 */
export function addDaysToDate(dateString: string, days: number): string {
  const date = new Date(dateString);
  date.setDate(date.getDate() + days);
  return date.toISOString().split("T")[0];
}

/**
 * Get formatted meta text for item cards
 */
export function getItemMetaText(item: FoodItem): string {
  const parts: string[] = [];

  if (item.location) {
    parts.push(item.location === "fridge" ? "Fridge" : "Shelf");
  }

  if (item.created_at) {
    const createdDate = new Date(item.created_at);
    const today = new Date();
    const diffTime = today.getTime() - createdDate.getTime();
    const diffDays = Math.floor(diffTime / MILLISECONDS_PER_DAY);

    if (diffDays === 0) {
      parts.push("Added today");
    } else if (diffDays === 1) {
      parts.push("Added yesterday");
    } else if (diffDays < 30) {
      parts.push(`Added ${diffDays} days ago`);
    } else if (diffDays < 365) {
      const weeks = Math.floor(diffDays / 7);
      parts.push(`Added ${weeks} week${weeks > 1 ? "s" : ""} ago`);
    }
  }

  return parts.join(" • ");
}

/**
 * Debounce function for performance optimization
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout>;

  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

/**
 * Throttle function for scroll performance
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;

  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}
