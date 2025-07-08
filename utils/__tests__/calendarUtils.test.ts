import { FoodItem } from "@/lib/supabase";
import {
  formatDateForDisplay,
  formatItemsForCalendar,
  getMonthRange,
} from "../calendarUtils";

describe("calendarUtils", () => {
  // Mock date for consistent testing
  const originalDate = global.Date;
  const mockDate = new Date("2023-01-15T12:00:00Z");

  beforeAll(() => {
    global.Date = class extends Date {
      constructor(date: any) {
        if (date) {
          super(date);
          return;
        }
        super(mockDate);
        return;
      }
      static now() {
        return mockDate.getTime();
      }
    } as any;
  });

  afterAll(() => {
    global.Date = originalDate;
  });

  describe("formatItemsForCalendar", () => {
    it("formats items for calendar with correct dot colors", () => {
      // Mock data
      const mockItems: Record<string, FoodItem[]> = {
        // Past date (expired)
        "2023-01-10": [
          {
            id: "1",
            name: "Expired Milk",
            quantity: 1,
            expiry_date: "2023-01-10",
          } as FoodItem,
        ],
        // Current date (today)
        "2023-01-15": [
          {
            id: "2",
            name: "Today Eggs",
            quantity: 12,
            expiry_date: "2023-01-15",
          } as FoodItem,
        ],
        // Future date
        "2023-01-20": [
          {
            id: "3",
            name: "Future Cheese",
            quantity: 1,
            expiry_date: "2023-01-20",
          } as FoodItem,
        ],
      };

      const result = formatItemsForCalendar(mockItems);

      // Check expired items (red dot)
      expect(result["2023-01-10"]).toBeDefined();
      expect(result["2023-01-10"].dots).toContainEqual({
        key: "expired",
        color: "red",
      });

      // Check today's items (orange dot)
      expect(result["2023-01-15"]).toBeDefined();
      expect(result["2023-01-15"].dots).toContainEqual({
        key: "today",
        color: "orange",
      });

      // Check future items (green dot)
      expect(result["2023-01-20"]).toBeDefined();
      expect(result["2023-01-20"].dots).toContainEqual({
        key: "expiring",
        color: "green",
      });
    });

    it("handles empty input", () => {
      const result = formatItemsForCalendar({});
      expect(result).toEqual({});
    });
  });

  describe("getMonthRange", () => {
    it("returns correct date range for January 2023", () => {
      const result = getMonthRange(2023, 1);
      expect(result.startDate).toBe("2023-01-01");
      expect(result.endDate).toBe("2023-01-31");
    });

    it("returns correct date range for February 2023", () => {
      const result = getMonthRange(2023, 2);
      expect(result.startDate).toBe("2023-02-01");
      expect(result.endDate).toBe("2023-02-28");
    });

    it("returns correct date range for February 2024 (leap year)", () => {
      const result = getMonthRange(2024, 2);
      expect(result.startDate).toBe("2024-02-01");
      expect(result.endDate).toBe("2024-02-29");
    });
  });

  describe("formatDateForDisplay", () => {
    it("formats date string correctly", () => {
      const result = formatDateForDisplay("2023-01-15");
      expect(result).toBe("January 15, 2023");
    });

    it("handles different date formats", () => {
      const result = formatDateForDisplay("2023-12-31");
      expect(result).toBe("December 31, 2023");
    });
  });
});
