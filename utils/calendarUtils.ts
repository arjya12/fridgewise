// utils/calendarUtils.ts
import { FoodItem } from "@/lib/supabase";
import { MarkedDates } from "react-native-calendars/src/types";

/**
 * Formats food items into the format required by react-native-calendars
 * @param itemsByDate Record of food items grouped by expiry date
 * @returns MarkedDates object for the calendar
 */
export function formatItemsForCalendar(
  itemsByDate: Record<string, FoodItem[]>
): MarkedDates {
  const markedDates: MarkedDates = {};

  // Get today's date for comparison
  const today = new Date().toISOString().split("T")[0];

  Object.entries(itemsByDate).forEach(([date, items]) => {
    // Count items by category
    const expiredItems = date < today ? items.length : 0;
    const expiringToday = date === today ? items.length : 0;
    const expiringItems = date > today ? items.length : 0;

    // Determine dot colors based on expiry status
    const dots = [];

    if (expiredItems > 0) {
      dots.push({ key: "expired", color: "red" });
    }

    if (expiringToday > 0) {
      dots.push({ key: "today", color: "orange" });
    }

    if (expiringItems > 0) {
      dots.push({ key: "expiring", color: "green" });
    }

    // Set marked date properties
    markedDates[date] = {
      marked: true,
      dots,
      selected: false,
    };
  });

  return markedDates;
}

/**
 * Gets the month range (first and last day) for a given month
 * @param year Year
 * @param month Month (1-12)
 * @returns Object with startDate and endDate strings in YYYY-MM-DD format
 */
export function getMonthRange(year: number, month: number) {
  // First day of the month
  const startDate = new Date(year, month - 1, 1);

  // Last day of the month
  const endDate = new Date(year, month, 0);

  // Format dates as YYYY-MM-DD
  const formatDate = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  return {
    startDate: formatDate(startDate),
    endDate: formatDate(endDate),
  };
}

/**
 * Formats a date string for display
 * @param dateString Date string in YYYY-MM-DD format
 * @returns Formatted date string (e.g., "January 1, 2023")
 */
export function formatDateForDisplay(dateString: string): string {
  // Create a new date and adjust for timezone to ensure correct day
  const date = new Date(dateString);
  date.setMinutes(date.getMinutes() + date.getTimezoneOffset());

  return date.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}
