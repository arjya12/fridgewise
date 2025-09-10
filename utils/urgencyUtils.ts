// utils/urgencyUtils.ts
import { FoodItem } from "@/lib/supabase";

export type UrgencyLevel = "critical" | "warning" | "soon" | "safe";

export interface UrgencyInfo {
  level: UrgencyLevel;
  daysUntilExpiry: number;
  color: string;
  dotColor: string;
  backgroundColor: string;
  borderColor: string;
  description: string;
}

/**
 * Calculate the urgency level and associated styling for a food item
 * @param item FoodItem with expiry_date
 * @returns UrgencyInfo object with level, colors, and metadata
 */
export function calculateUrgency(item: FoodItem): UrgencyInfo {
  if (!item.expiry_date) {
    return {
      level: "safe",
      daysUntilExpiry: Infinity,
      color: "#6B7280", // Gray
      dotColor: "#9CA3AF",
      backgroundColor: "#F9FAFB",
      borderColor: "#E5E7EB",
      description: "No expiry date set",
    };
  }

  const now = new Date();
  const toUtcMidnight = (d: Date) =>
    Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
  const todayUtc = toUtcMidnight(now);
  const expiry = new Date(item.expiry_date);
  const expiryUtc = toUtcMidnight(expiry);
  const msPerDay = 24 * 60 * 60 * 1000;
  const daysUntilExpiry = Math.round((expiryUtc - todayUtc) / msPerDay);

  // Define urgency tiers
  if (daysUntilExpiry < 0) {
    // Expired
    return {
      level: "critical",
      daysUntilExpiry,
      color: "#DC2626", // Red-600
      dotColor: "#EF4444", // Red-500
      backgroundColor: "#FEF2F2", // Red-50
      borderColor: "#FCA5A5", // Red-300
      description: `Expired ${Math.abs(daysUntilExpiry)} day${
        Math.abs(daysUntilExpiry) !== 1 ? "s" : ""
      } ago`,
    };
  }

  if (daysUntilExpiry === 0) {
    // Expires today
    return {
      level: "critical",
      daysUntilExpiry,
      color: "#DC2626", // Red-600
      dotColor: "#EF4444", // Red-500
      backgroundColor: "#FEF2F2", // Red-50
      borderColor: "#FCA5A5", // Red-300
      description: "Expires today",
    };
  }

  if (daysUntilExpiry <= 2) {
    // Expires in 1-2 days
    return {
      level: "warning",
      daysUntilExpiry,
      color: "#EA580C", // Orange-600
      dotColor: "#F97316", // Orange-500
      backgroundColor: "#FFF7ED", // Orange-50
      borderColor: "#FED7AA", // Orange-200
      description: `Expires in ${daysUntilExpiry} day${
        daysUntilExpiry !== 1 ? "s" : ""
      }`,
    };
  }

  if (daysUntilExpiry <= 7) {
    // Expires in 3-7 days
    return {
      level: "soon",
      daysUntilExpiry,
      color: "#FACC15", // Yellow-400
      dotColor: "#EAB308", // Yellow-500
      backgroundColor: "#FEFCE8", // Yellow-50
      borderColor: "#FEF08A", // Yellow-200
      description: `Expires in ${daysUntilExpiry} days`,
    };
  }

  // Expires in more than 7 days
  return {
    level: "safe",
    daysUntilExpiry,
    color: "#16A34A", // Green-600
    dotColor: "#22C55E", // Green-500
    backgroundColor: "#F0FDF4", // Green-50
    borderColor: "#BBF7D0", // Green-200
    description:
      daysUntilExpiry <= 30 ? `Expires in ${daysUntilExpiry} days` : "Fresh",
  };
}

/**
 * Add urgency information to a food item
 * @param item FoodItem
 * @returns FoodItem with urgency field added
 */
export function addUrgencyToItem(
  item: FoodItem
): FoodItem & { urgency: UrgencyInfo } {
  return {
    ...item,
    urgency: calculateUrgency(item),
  };
}

/**
 * Add urgency information to multiple food items
 * @param items Array of FoodItems
 * @returns Array of FoodItems with urgency field added
 */
export function addUrgencyToItems(
  items: FoodItem[]
): (FoodItem & { urgency: UrgencyInfo })[] {
  return items.map(addUrgencyToItem);
}

/**
 * Enhanced calendar dot colors based on Phase 2 design specifications
 * Implements urgency-based prioritization with single dominant dot per date
 */
export function getCalendarDotColors(items: FoodItem[]): Array<{
  key: string;
  color: string;
  selectedDotColor?: string;
}> {
  if (!items || items.length === 0) {
    return [];
  }

  // Calculate urgency for all items
  const urgencyLevels = items.map((item) => calculateUrgency(item));

  // Group by urgency priority (Phase 2 specification)
  const urgencyGroups = {
    critical: urgencyLevels.filter((u) => u.level === "critical"),
    warning: urgencyLevels.filter((u) => u.level === "warning"),
    soon: urgencyLevels.filter((u) => u.level === "soon"),
    safe: urgencyLevels.filter((u) => u.level === "safe"),
  };

  // Priority-based dot selection (highest urgency wins)
  const dots: Array<{ key: string; color: string }> = [];

  // Phase 2 Design: Single dominant dot per date
  if (urgencyGroups.critical.length > 0) {
    dots.push({ key: "critical", color: "#EF4444" });
  } else if (urgencyGroups.warning.length > 0) {
    dots.push({ key: "warning", color: "#F97316" });
  } else if (urgencyGroups.soon.length > 0) {
    dots.push({ key: "soon", color: "#EAB308" });
  } else if (urgencyGroups.safe.length > 0) {
    dots.push({ key: "safe", color: "#22C55E" });
  }

  return dots;
}

/**
 * Enhanced urgency calculation with Phase 2 design system
 * Returns detailed urgency information for visual hierarchy
 */
export function calculateEnhancedUrgency(expiryDate: string): {
  level: "critical" | "warning" | "soon" | "safe";
  color: string;
  backgroundColor: string;
  borderColor: string;
  description: string;
  dotSize: number; // Phase 2 responsive dot sizes
  visualWeight: number; // For animation and hierarchy
} {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const expiry = new Date(expiryDate);
  expiry.setHours(0, 0, 0, 0);

  const diffTime = expiry.getTime() - today.getTime();
  const daysUntilExpiry = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (daysUntilExpiry < 0) {
    return {
      level: "critical",
      color: "#EF4444",
      backgroundColor: "rgba(239, 68, 68, 0.05)",
      borderColor: "#EF4444",
      description: "Expired",
      dotSize: 8, // Largest dot for critical items
      visualWeight: 100,
    };
  }

  if (daysUntilExpiry === 0) {
    return {
      level: "critical",
      color: "#EF4444",
      backgroundColor: "rgba(239, 68, 68, 0.05)",
      borderColor: "#EF4444",
      description: "Expires today",
      dotSize: 8,
      visualWeight: 100,
    };
  }

  if (daysUntilExpiry <= 2) {
    return {
      level: "warning",
      color: "#F97316",
      backgroundColor: "rgba(249, 115, 22, 0.05)",
      borderColor: "#F97316",
      description: `Expires in ${daysUntilExpiry} day${
        daysUntilExpiry === 1 ? "" : "s"
      }`,
      dotSize: 7,
      visualWeight: 75,
    };
  }

  if (daysUntilExpiry <= 7) {
    return {
      level: "soon",
      color: "#EAB308",
      backgroundColor: "rgba(234, 179, 8, 0.05)",
      borderColor: "#EAB308",
      description: `Expires in ${daysUntilExpiry} days`,
      dotSize: 6,
      visualWeight: 50,
    };
  }

  return {
    level: "safe",
    color: "#22C55E",
    backgroundColor: "rgba(34, 197, 94, 0.03)",
    borderColor: "#22C55E",
    description:
      daysUntilExpiry <= 30 ? `Expires in ${daysUntilExpiry} days` : "Fresh",
    dotSize: 5, // Smallest dot for safe items
    visualWeight: 25,
  };
}

/**
 * Generate accessibility label for calendar dates with items
 * Phase 2 specification: Complete item summary for screen readers
 */
export function getCalendarDateAccessibilityLabel(
  date: string,
  items: FoodItem[]
): string {
  if (!items || items.length === 0) {
    return `${formatDateForDisplay(date)} - No items`;
  }

  const urgencyCounts = items.reduce((acc, item) => {
    const urgency = calculateEnhancedUrgency(item.expiry_date!);
    acc[urgency.level] = (acc[urgency.level] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const urgencySummary = Object.entries(urgencyCounts)
    .filter(([_, count]) => count > 0)
    .map(([level, count]) => `${count} ${level}`)
    .join(", ");

  return `${formatDateForDisplay(date)} - ${
    items.length
  } items: ${urgencySummary}`;
}

/**
 * Helper function to format date for display
 */
function formatDateForDisplay(dateString: string): string {
  const date = new Date(dateString);
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  if (date.toDateString() === today.toDateString()) {
    return "Today";
  }

  if (date.toDateString() === tomorrow.toDateString()) {
    return "Tomorrow";
  }

  return date.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
  });
}

/**
 * Filter items by urgency level
 * @param items Array of FoodItems
 * @param level UrgencyLevel to filter by
 * @returns Filtered array of FoodItems
 */
export function filterItemsByUrgency(
  items: FoodItem[],
  level: UrgencyLevel
): FoodItem[] {
  return items.filter((item) => calculateUrgency(item).level === level);
}

/**
 * Sort items by urgency (most urgent first)
 * @param items Array of FoodItems
 * @returns Sorted array of FoodItems
 */
export function sortItemsByUrgency(items: FoodItem[]): FoodItem[] {
  const urgencyOrder: Record<UrgencyLevel, number> = {
    critical: 0,
    warning: 1,
    soon: 2,
    safe: 3,
  };

  return items.sort((a, b) => {
    const urgencyA = calculateUrgency(a);
    const urgencyB = calculateUrgency(b);

    // First sort by urgency level
    const levelDiff =
      urgencyOrder[urgencyA.level] - urgencyOrder[urgencyB.level];
    if (levelDiff !== 0) return levelDiff;

    // Then sort by days until expiry (ascending)
    return urgencyA.daysUntilExpiry - urgencyB.daysUntilExpiry;
  });
}
