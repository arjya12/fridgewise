// utils/__tests__/urgencyUtils.test.ts
import { FoodItem } from "@/lib/supabase";
import {
  addUrgencyToItem,
  addUrgencyToItems,
  calculateUrgency,
  filterItemsByUrgency,
  getCalendarDotColors,
  sortItemsByUrgency,
  UrgencyLevel,
} from "../urgencyUtils";

// Mock food items for testing
const createMockItem = (name: string, expiryDate?: string): FoodItem => ({
  id: `test-${name}`,
  user_id: "test-user",
  name,
  quantity: 1,
  unit: "piece",
  location: "fridge" as const,
  expiry_date: expiryDate,
  category: "test",
  created_at: "2024-01-01T00:00:00Z",
  updated_at: "2024-01-01T00:00:00Z",
});

describe("urgencyUtils", () => {
  const today = "2024-01-15";
  const yesterday = "2024-01-14";
  const tomorrow = "2024-01-16";
  const nextWeek = "2024-01-22";
  const nextMonth = "2024-02-15";

  // Mock Date to ensure consistent testing
  beforeAll(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date("2024-01-15T12:00:00Z"));
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  describe("calculateUrgency", () => {
    it("returns safe level for items without expiry date", () => {
      const item = createMockItem("no-expiry");
      const urgency = calculateUrgency(item);

      expect(urgency.level).toBe("safe");
      expect(urgency.daysUntilExpiry).toBe(Infinity);
      expect(urgency.description).toBe("No expiry date set");
      expect(urgency.color).toBe("#6B7280");
    });

    it("returns critical level for expired items", () => {
      const item = createMockItem("expired", yesterday);
      const urgency = calculateUrgency(item);

      expect(urgency.level).toBe("critical");
      expect(urgency.daysUntilExpiry).toBe(-1);
      expect(urgency.description).toBe("Expired 1 day ago");
      expect(urgency.color).toBe("#DC2626");
    });

    it("returns critical level for items expiring today", () => {
      const item = createMockItem("today", today);
      const urgency = calculateUrgency(item);

      expect(urgency.level).toBe("critical");
      expect(urgency.daysUntilExpiry).toBe(0);
      expect(urgency.description).toBe("Expires today");
      expect(urgency.color).toBe("#DC2626");
    });

    it("returns warning level for items expiring tomorrow", () => {
      const item = createMockItem("tomorrow", tomorrow);
      const urgency = calculateUrgency(item);

      expect(urgency.level).toBe("warning");
      expect(urgency.daysUntilExpiry).toBe(1);
      expect(urgency.description).toBe("Expires in 1 day");
      expect(urgency.color).toBe("#EA580C");
    });

    it("returns soon level for items expiring next week", () => {
      const item = createMockItem("next-week", nextWeek);
      const urgency = calculateUrgency(item);

      expect(urgency.level).toBe("soon");
      expect(urgency.daysUntilExpiry).toBe(7);
      expect(urgency.description).toBe("Expires in 7 days");
      expect(urgency.color).toBe("#FACC15");
    });

    it("returns safe level for items expiring next month", () => {
      const item = createMockItem("next-month", nextMonth);
      const urgency = calculateUrgency(item);

      expect(urgency.level).toBe("safe");
      expect(urgency.daysUntilExpiry).toBe(31);
      expect(urgency.description).toBe("Expires in 31 days");
      expect(urgency.color).toBe("#16A34A");
    });
  });

  describe("addUrgencyToItem", () => {
    it("adds urgency information to a single item", () => {
      const item = createMockItem("test", today);
      const itemWithUrgency = addUrgencyToItem(item);

      expect(itemWithUrgency).toHaveProperty("urgency");
      expect(itemWithUrgency.urgency.level).toBe("critical");
      expect(itemWithUrgency.name).toBe("test");
    });
  });

  describe("addUrgencyToItems", () => {
    it("adds urgency information to multiple items", () => {
      const items = [
        createMockItem("item1", today),
        createMockItem("item2", tomorrow),
        createMockItem("item3", nextWeek),
      ];

      const itemsWithUrgency = addUrgencyToItems(items);

      expect(itemsWithUrgency).toHaveLength(3);
      expect(itemsWithUrgency[0].urgency.level).toBe("critical");
      expect(itemsWithUrgency[1].urgency.level).toBe("warning");
      expect(itemsWithUrgency[2].urgency.level).toBe("soon");
    });
  });

  describe("getCalendarDotColors", () => {
    it("returns empty array for no items", () => {
      const dots = getCalendarDotColors([]);
      expect(dots).toEqual([]);
    });

    it("returns critical dot for critical items", () => {
      const items = [createMockItem("critical", today)];
      const dots = getCalendarDotColors(items);

      expect(dots).toEqual([
        { key: "critical", color: "#EF4444", selectedDotColor: "#FFFFFF" },
      ]);
    });

    it("returns multiple dots for mixed urgency levels", () => {
      const items = [
        createMockItem("critical", today),
        createMockItem("warning", tomorrow),
        createMockItem("soon", nextWeek),
      ];
      const dots = getCalendarDotColors(items);

      expect(dots).toContainEqual({ key: "critical", color: "#EF4444" });
      expect(dots).toContainEqual({ key: "warning", color: "#F97316" });
      expect(dots).toContainEqual({ key: "soon", color: "#EAB308" });
    });

    it("only shows safe dot when no other urgency levels present", () => {
      const items = [createMockItem("safe", nextMonth)];
      const dots = getCalendarDotColors(items);

      expect(dots).toEqual([{ key: "safe", color: "#22C55E" }]);
    });

    it("does not show safe dot when other urgency levels are present", () => {
      const items = [
        createMockItem("critical", today),
        createMockItem("safe", nextMonth),
      ];
      const dots = getCalendarDotColors(items);

      expect(dots).toEqual([{ key: "critical", color: "#EF4444" }]);
    });
  });

  describe("filterItemsByUrgency", () => {
    const items = [
      createMockItem("expired", yesterday),
      createMockItem("today", today),
      createMockItem("tomorrow", tomorrow),
      createMockItem("soon", nextWeek),
      createMockItem("safe", nextMonth),
    ];

    it("filters items by critical urgency", () => {
      const criticalItems = filterItemsByUrgency(items, "critical");
      expect(criticalItems).toHaveLength(2);
      expect(criticalItems.map((item) => item.name)).toEqual([
        "expired",
        "today",
      ]);
    });

    it("filters items by warning urgency", () => {
      const warningItems = filterItemsByUrgency(items, "warning");
      expect(warningItems).toHaveLength(1);
      expect(warningItems[0].name).toBe("tomorrow");
    });

    it("filters items by soon urgency", () => {
      const soonItems = filterItemsByUrgency(items, "soon");
      expect(soonItems).toHaveLength(1);
      expect(soonItems[0].name).toBe("soon");
    });

    it("filters items by safe urgency", () => {
      const safeItems = filterItemsByUrgency(items, "safe");
      expect(safeItems).toHaveLength(1);
      expect(safeItems[0].name).toBe("safe");
    });
  });

  describe("sortItemsByUrgency", () => {
    it("sorts items by urgency level", () => {
      const items = [
        createMockItem("safe", nextMonth),
        createMockItem("critical", today),
        createMockItem("soon", nextWeek),
        createMockItem("warning", tomorrow),
      ];

      const sortedItems = sortItemsByUrgency(items);

      expect(sortedItems.map((item) => item.name)).toEqual([
        "critical",
        "warning",
        "soon",
        "safe",
      ]);
    });

    it("sorts items by days until expiry within same urgency level", () => {
      const items = [
        createMockItem("critical2", today),
        createMockItem("critical1", yesterday),
      ];

      const sortedItems = sortItemsByUrgency(items);

      expect(sortedItems.map((item) => item.name)).toEqual([
        "critical1", // -1 days (more urgent)
        "critical2", // 0 days
      ]);
    });
  });

  describe("urgency color consistency", () => {
    it("provides consistent colors across all urgency levels", () => {
      const levels: UrgencyLevel[] = ["critical", "warning", "soon", "safe"];
      const colors = levels.map((level) => {
        const item = createMockItem("test", getDateForLevel(level));
        return calculateUrgency(item);
      });

      // Verify all colors are defined and different
      expect(colors[0].color).toBe("#DC2626"); // critical - red
      expect(colors[1].color).toBe("#EA580C"); // warning - orange
      expect(colors[2].color).toBe("#FACC15"); // soon - yellow
      expect(colors[3].color).toBe("#16A34A"); // safe - green

      // Verify dot colors match
      expect(colors[0].dotColor).toBe("#EF4444");
      expect(colors[1].dotColor).toBe("#F97316");
      expect(colors[2].dotColor).toBe("#EAB308");
      expect(colors[3].dotColor).toBe("#22C55E");
    });
  });
});

// Helper function to get appropriate date for each urgency level
function getDateForLevel(level: UrgencyLevel): string {
  switch (level) {
    case "critical":
      return "2024-01-15"; // today
    case "warning":
      return "2024-01-16"; // tomorrow
    case "soon":
      return "2024-01-22"; // next week
    case "safe":
      return "2024-02-15"; // next month
    default:
      return "2024-02-15";
  }
}
