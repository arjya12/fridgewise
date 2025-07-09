// utils/calendarUtils.ts
import { FoodItem } from "@/lib/supabase";
import { MarkedDates } from "react-native-calendars/src/types";
import {
  calculateEnhancedUrgency,
  getCalendarDateAccessibilityLabel,
  getCalendarDotColors,
} from "./urgencyUtils";

/**
 * Enhanced calendar formatting with Phase 2 specifications
 * Implements single dominant dot per date with urgency prioritization
 * @param itemsByDate Record of food items grouped by expiry date
 * @returns MarkedDates object for the calendar with enhanced features
 */
export function formatItemsForCalendar(
  itemsByDate: Record<string, FoodItem[]>
): MarkedDates {
  const markedDates: MarkedDates = {};

  Object.entries(itemsByDate).forEach(([date, items]) => {
    if (!items || items.length === 0) return;

    // Phase 2: Enhanced dots with single dominant dot logic
    const dots = getCalendarDotColors(items);

    // Phase 2: Enhanced accessibility support
    const accessibilityLabel = getCalendarDateAccessibilityLabel(date, items);

    // Calculate urgency statistics for this date
    const urgencyStats = items.reduce((acc, item) => {
      const urgency = calculateEnhancedUrgency(item.expiry_date!);
      acc[urgency.level] = (acc[urgency.level] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Determine dominant urgency level for date styling
    const dominantUrgency = getDominantUrgencyLevel(urgencyStats);

    // Set marked date properties with Phase 2 enhancements
    markedDates[date] = {
      marked: true,
      dots,
      selected: false,
    };
  });

  return markedDates;
}

/**
 * Determine the dominant urgency level for a date
 * Used for date-level styling and prioritization
 */
function getDominantUrgencyLevel(urgencyStats: Record<string, number>): string {
  if (urgencyStats.critical > 0) return "critical";
  if (urgencyStats.warning > 0) return "warning";
  if (urgencyStats.soon > 0) return "soon";
  if (urgencyStats.safe > 0) return "safe";
  return "safe";
}

/**
 * Enhanced month range calculation
 * Includes buffer days for better data loading
 */
export function getMonthRange(
  year: number,
  month: number
): {
  startDate: string;
  endDate: string;
} {
  // Add buffer days at start and end of month for better UX
  const startOfMonth = new Date(year, month - 1, 1);
  const endOfMonth = new Date(year, month, 0);

  // Add 7 days buffer on each side for week view in calendar
  const startDate = new Date(startOfMonth);
  startDate.setDate(startDate.getDate() - 7);

  const endDate = new Date(endOfMonth);
  endDate.setDate(endDate.getDate() + 7);

  return {
    startDate: startDate.toISOString().split("T")[0],
    endDate: endDate.toISOString().split("T")[0],
  };
}

/**
 * Enhanced date formatting with relative time support
 * Phase 2 specification: User-friendly date display
 */
export function formatDateForDisplay(dateString: string): string {
  const date = new Date(dateString);
  const today = new Date();
  const tomorrow = new Date(today);
  const yesterday = new Date(today);

  tomorrow.setDate(today.getDate() + 1);
  yesterday.setDate(today.getDate() - 1);

  // Normalize dates for comparison (remove time)
  const normalizeDate = (d: Date) =>
    new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const normalizedDate = normalizeDate(date);
  const normalizedToday = normalizeDate(today);
  const normalizedTomorrow = normalizeDate(tomorrow);
  const normalizedYesterday = normalizeDate(yesterday);

  if (normalizedDate.getTime() === normalizedToday.getTime()) {
    return "Today";
  }

  if (normalizedDate.getTime() === normalizedTomorrow.getTime()) {
    return "Tomorrow";
  }

  if (normalizedDate.getTime() === normalizedYesterday.getTime()) {
    return "Yesterday";
  }

  // For dates within this week, show day name
  const daysDiff = Math.abs(
    (normalizedDate.getTime() - normalizedToday.getTime()) /
      (1000 * 60 * 60 * 24)
  );
  if (daysDiff <= 7) {
    const dayName = date.toLocaleDateString("en-US", { weekday: "long" });
    if (normalizedDate.getTime() < normalizedToday.getTime()) {
      return `Last ${dayName}`;
    } else {
      return dayName;
    }
  }

  // For other dates, show month and day
  return date.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: date.getFullYear() !== today.getFullYear() ? "numeric" : undefined,
  });
}

/**
 * Get current date string in calendar format
 * Used for default date selection
 */
export function getCurrentDateString(): string {
  return new Date().toISOString().split("T")[0];
}

/**
 * Calculate days difference between two dates
 * Useful for urgency calculations and date comparisons
 */
export function getDaysDifference(date1: string, date2: string): number {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  const diffTime = d1.getTime() - d2.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Check if a date is today
 * Used for highlighting and special styling
 */
export function isToday(dateString: string): boolean {
  const date = new Date(dateString);
  const today = new Date();
  return date.toDateString() === today.toDateString();
}

/**
 * Check if a date is in the past
 * Used for expired item detection
 */
export function isPastDate(dateString: string): boolean {
  const date = new Date(dateString);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return date.getTime() < today.getTime();
}

/**
 * Get urgency statistics for a collection of items
 * Used for summary displays and analytics
 */
export function getUrgencyStatistics(items: FoodItem[]): {
  total: number;
  critical: number;
  warning: number;
  soon: number;
  safe: number;
  criticalPercentage: number;
  warningPercentage: number;
} {
  const stats = items.reduce(
    (acc, item) => {
      if (!item.expiry_date) return acc;

      const urgency = calculateEnhancedUrgency(item.expiry_date);
      acc[urgency.level]++;
      return acc;
    },
    {
      critical: 0,
      warning: 0,
      soon: 0,
      safe: 0,
    }
  );

  const total = items.length;
  const criticalPercentage = total > 0 ? (stats.critical / total) * 100 : 0;
  const warningPercentage = total > 0 ? (stats.warning / total) * 100 : 0;

  return {
    total,
    ...stats,
    criticalPercentage,
    warningPercentage,
  };
}
