import { FoodItem } from "../../lib/supabase";
import {
  addDaysToDate,
  calculateExpiryStatus,
  createCalendarData,
  createMarkedDates,
  EXPIRY_COLORS,
  formatDateForDisplay,
  getCurrentDateString,
  getExpiringSoonItems,
  getItemMetaText,
  groupItemsByExpiryDate,
  isPastDate,
  isToday,
} from "../calendarEnhancedUtils";

// Mock FoodItem for testing
const createMockItem = (overrides: Partial<FoodItem> = {}): FoodItem => ({
  id: "test-id",
  name: "Test Item",
  quantity: 1,
  expiry_date: "2024-01-15",
  location: "fridge",
  category: "dairy",
  created_at: "2024-01-01T00:00:00Z",
  updated_at: "2024-01-01T00:00:00Z",
  user_id: "test-user",
  ...overrides,
});

describe("calculateExpiryStatus", () => {
  // Mock current date to ensure consistent testing
  const mockCurrentDate = new Date("2024-01-10T12:00:00Z");

  beforeAll(() => {
    jest.useFakeTimers();
    jest.setSystemTime(mockCurrentDate);
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  it("should classify expired items correctly", () => {
    const result = calculateExpiryStatus("2024-01-08"); // 2 days ago
    expect(result.status.urgency).toBe("expired");
    expect(result.status.text).toBe("2 days ago");
    expect(result.status.color).toBe(EXPIRY_COLORS.expired);
    expect(result.isUrgent).toBe(true);
  });

  it("should classify items expiring today correctly", () => {
    const result = calculateExpiryStatus("2024-01-10"); // today
    expect(result.status.urgency).toBe("today");
    expect(result.status.text).toBe("Today");
    expect(result.status.color).toBe(EXPIRY_COLORS.today);
    expect(result.isUrgent).toBe(true);
  });

  it("should classify items expiring tomorrow correctly", () => {
    const result = calculateExpiryStatus("2024-01-11"); // tomorrow
    expect(result.status.urgency).toBe("tomorrow");
    expect(result.status.text).toBe("Tomorrow");
    expect(result.status.color).toBe(EXPIRY_COLORS.tomorrow);
    expect(result.isUrgent).toBe(true);
  });

  it("should classify items expiring soon correctly", () => {
    const result = calculateExpiryStatus("2024-01-15"); // 5 days
    expect(result.status.urgency).toBe("soon");
    expect(result.status.text).toBe("5 days");
    expect(result.status.color).toBe(EXPIRY_COLORS.soon);
    expect(result.isUrgent).toBe(false);
  });

  it("should classify fresh items correctly", () => {
    const result = calculateExpiryStatus("2024-01-25"); // 15 days
    expect(result.status.urgency).toBe("fresh");
    expect(result.status.text).toBe("15 days");
    expect(result.status.color).toBe(EXPIRY_COLORS.fresh);
    expect(result.isUrgent).toBe(false);
  });

  it("should handle week formatting for fresh items", () => {
    const result = calculateExpiryStatus("2024-01-24"); // 14 days / 2 weeks
    expect(result.status.text).toBe("2 weeks");
  });

  it("should handle month formatting for fresh items", () => {
    const result = calculateExpiryStatus("2024-02-10"); // ~31 days / 1 month
    expect(result.status.text).toBe("1 month");
  });
});

describe("formatDateForDisplay", () => {
  const mockCurrentDate = new Date("2024-01-10T12:00:00Z");

  beforeAll(() => {
    jest.useFakeTimers();
    jest.setSystemTime(mockCurrentDate);
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  it("should format today correctly", () => {
    expect(formatDateForDisplay("2024-01-10")).toBe("Today");
  });

  it("should format tomorrow correctly", () => {
    expect(formatDateForDisplay("2024-01-11")).toBe("Tomorrow");
  });

  it("should format yesterday correctly", () => {
    expect(formatDateForDisplay("2024-01-09")).toBe("Yesterday");
  });

  it("should format other dates with full format", () => {
    const result = formatDateForDisplay("2024-01-15");
    expect(result).toMatch(/Monday, January 15, 2024/);
  });
});

describe("getExpiringSoonItems", () => {
  const mockCurrentDate = new Date("2024-01-10T12:00:00Z");

  beforeAll(() => {
    jest.useFakeTimers();
    jest.setSystemTime(mockCurrentDate);
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  const items: FoodItem[] = [
    createMockItem({ id: "1", name: "Item 1", expiry_date: "2024-01-12" }), // 2 days
    createMockItem({ id: "2", name: "Item 2", expiry_date: "2024-01-15" }), // 5 days
    createMockItem({ id: "3", name: "Item 3", expiry_date: "2024-01-20" }), // 10 days
    createMockItem({ id: "4", name: "Item 4", expiry_date: "2024-01-08" }), // expired
    createMockItem({ id: "5", name: "Item 5", expiry_date: undefined }), // no expiry
  ];

  it("should return items expiring within default 7 days", () => {
    const result = getExpiringSoonItems(items);
    expect(result).toHaveLength(2);
    expect(result.map((item) => item.id)).toEqual(["1", "2"]);
  });

  it("should return items expiring within custom days", () => {
    const result = getExpiringSoonItems(items, 3);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("1");
  });

  it("should sort items by expiry date ascending", () => {
    const result = getExpiringSoonItems(items);
    expect(result[0].expiry_date).toBe("2024-01-12");
    expect(result[1].expiry_date).toBe("2024-01-15");
  });

  it("should handle empty array", () => {
    const result = getExpiringSoonItems([]);
    expect(result).toHaveLength(0);
  });
});

describe("groupItemsByExpiryDate", () => {
  const items: FoodItem[] = [
    createMockItem({ id: "1", name: "Item 1", expiry_date: "2024-01-15" }),
    createMockItem({ id: "2", name: "Item 2", expiry_date: "2024-01-15" }),
    createMockItem({ id: "3", name: "Item 3", expiry_date: "2024-01-16" }),
    createMockItem({ id: "4", name: "Item 4", expiry_date: undefined }),
  ];

  it("should group items by expiry date", () => {
    const result = groupItemsByExpiryDate(items);
    expect(result["2024-01-15"]).toHaveLength(2);
    expect(result["2024-01-16"]).toHaveLength(1);
    expect(result["2024-01-15"][0].id).toBe("1");
    expect(result["2024-01-15"][1].id).toBe("2");
  });

  it("should ignore items without expiry date", () => {
    const result = groupItemsByExpiryDate(items);
    expect(Object.keys(result)).not.toContain("null");
    expect(Object.keys(result)).not.toContain("undefined");
  });

  it("should handle empty array", () => {
    const result = groupItemsByExpiryDate([]);
    expect(result).toEqual({});
  });
});

describe("createMarkedDates", () => {
  const itemsByDate = {
    "2024-01-15": [
      createMockItem({ id: "1", expiry_date: "2024-01-15" }),
      createMockItem({ id: "2", expiry_date: "2024-01-15" }),
    ],
    "2024-01-16": [createMockItem({ id: "3", expiry_date: "2024-01-16" })],
  };

  it("should create marked dates with dots", () => {
    const result = createMarkedDates(itemsByDate);
    expect(result["2024-01-15"]).toBeDefined();
    expect(result["2024-01-15"].marked).toBe(true);
    expect(result["2024-01-15"].dots).toBeDefined();
    expect(result["2024-01-16"]).toBeDefined();
  });

  it("should limit dots to 3 for visual clarity", () => {
    const manyItemsDate = {
      "2024-01-15": [
        createMockItem({ id: "1", expiry_date: "2024-01-15" }),
        createMockItem({ id: "2", expiry_date: "2024-01-15" }),
        createMockItem({ id: "3", expiry_date: "2024-01-15" }),
        createMockItem({ id: "4", expiry_date: "2024-01-15" }),
      ],
    };
    const result = createMarkedDates(manyItemsDate);
    expect(result["2024-01-15"].dots?.length).toBeLessThanOrEqual(3);
  });

  it("should handle empty itemsByDate", () => {
    const result = createMarkedDates({});
    expect(result).toEqual({});
  });
});

describe("createCalendarData", () => {
  const mockCurrentDate = new Date("2024-01-10T12:00:00Z");

  beforeAll(() => {
    jest.useFakeTimers();
    jest.setSystemTime(mockCurrentDate);
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  const items: FoodItem[] = [
    createMockItem({ id: "1", name: "Item 1", expiry_date: "2024-01-12" }),
    createMockItem({ id: "2", name: "Item 2", expiry_date: "2024-01-15" }),
    createMockItem({ id: "3", name: "Item 3", expiry_date: "2024-01-20" }),
  ];

  it("should create complete calendar data structure", () => {
    const result = createCalendarData(items, 7);
    expect(result.markedDates).toBeDefined();
    expect(result.itemsByDate).toBeDefined();
    expect(result.expiringSoonItems).toBeDefined();
  });

  it("should include expiring soon items", () => {
    const result = createCalendarData(items, 7);
    expect(result.expiringSoonItems).toHaveLength(2); // Items 1 and 2
  });
});

describe("utility date functions", () => {
  const mockCurrentDate = new Date("2024-01-10T12:00:00Z");

  beforeAll(() => {
    jest.useFakeTimers();
    jest.setSystemTime(mockCurrentDate);
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  describe("isToday", () => {
    it("should return true for today", () => {
      expect(isToday("2024-01-10")).toBe(true);
    });

    it("should return false for other dates", () => {
      expect(isToday("2024-01-11")).toBe(false);
      expect(isToday("2024-01-09")).toBe(false);
    });
  });

  describe("isPastDate", () => {
    it("should return true for past dates", () => {
      expect(isPastDate("2024-01-09")).toBe(true);
    });

    it("should return false for today and future dates", () => {
      expect(isPastDate("2024-01-10")).toBe(false);
      expect(isPastDate("2024-01-11")).toBe(false);
    });
  });

  describe("getCurrentDateString", () => {
    it("should return current date in YYYY-MM-DD format", () => {
      const result = getCurrentDateString();
      expect(result).toBe("2024-01-10");
    });
  });

  describe("addDaysToDate", () => {
    it("should add days correctly", () => {
      expect(addDaysToDate("2024-01-10", 5)).toBe("2024-01-15");
    });

    it("should subtract days with negative numbers", () => {
      expect(addDaysToDate("2024-01-10", -3)).toBe("2024-01-07");
    });

    it("should handle month boundaries", () => {
      expect(addDaysToDate("2024-01-30", 5)).toBe("2024-02-04");
    });
  });
});

describe("getItemMetaText", () => {
  const mockCurrentDate = new Date("2024-01-10T12:00:00Z");

  beforeAll(() => {
    jest.useFakeTimers();
    jest.setSystemTime(mockCurrentDate);
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  it("should include location in meta text", () => {
    const item = createMockItem({ location: "fridge" });
    const result = getItemMetaText(item);
    expect(result).toContain("Fridge");
  });

  it("should include created date for recent items", () => {
    const item = createMockItem({ created_at: "2024-01-09T12:00:00Z" }); // yesterday
    const result = getItemMetaText(item);
    expect(result).toContain("Added yesterday");
  });

  it("should handle items added today", () => {
    const item = createMockItem({ created_at: "2024-01-10T12:00:00Z" }); // today
    const result = getItemMetaText(item);
    expect(result).toContain("Added today");
  });

  it("should combine location and date info", () => {
    const item = createMockItem({
      location: "shelf",
      created_at: "2024-01-08T12:00:00Z", // 2 days ago
    });
    const result = getItemMetaText(item);
    expect(result).toContain("Shelf");
    expect(result).toContain("Added 2 days ago");
    expect(result).toContain("•"); // separator
  });

  it("should handle missing data gracefully", () => {
    const item = createMockItem({ location: undefined, created_at: undefined });
    const result = getItemMetaText(item);
    expect(result).toBe("");
  });
});

describe("error handling and edge cases", () => {
  it("should handle invalid date strings gracefully", () => {
    expect(() => calculateExpiryStatus("invalid-date")).not.toThrow();
  });

  it("should handle empty strings", () => {
    expect(() => formatDateForDisplay("")).not.toThrow();
  });

  it("should handle null and undefined values", () => {
    expect(() => getExpiringSoonItems([])).not.toThrow();
    expect(() => groupItemsByExpiryDate([])).not.toThrow();
  });
});
