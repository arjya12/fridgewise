import type { FoodItem } from "@/lib/supabase";
import {
  calculateItemReminderOccurrences,
  expiryCalendarDaysAway,
  normalizeItemNotificationRepeat,
} from "../itemExpiryReminderSchedule";

describe("itemExpiryReminderSchedule", () => {
  const baseItem = (overrides: Partial<FoodItem> = {}): FoodItem => ({
    id: "item-1",
    user_id: "user-1",
    name: "Milk",
    quantity: 1,
    location: "fridge",
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
    expiry_date: "2026-05-15",
    notifications_enabled: true,
    notification_reminder_days: 7,
    notification_time: "13:00",
    notification_repeat: "none",
    ...overrides,
  });

  describe("expiryCalendarDaysAway", () => {
    beforeEach(() => {
      jest.useFakeTimers();
      jest.setSystemTime(new Date(2026, 4, 9, 12, 0, 0));
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it("returns 0 when expiry is today (calendar)", () => {
      expect(expiryCalendarDaysAway("2026-05-09")).toBe(0);
    });

    it("returns negative days when expiry is in the past", () => {
      expect(expiryCalendarDaysAway("2026-05-08")).toBe(-1);
    });

    it("counts calendar days until expiry (tomorrow => 1)", () => {
      expect(expiryCalendarDaysAway("2026-05-10")).toBe(1);
    });

    it("handles a date farther out", () => {
      expect(expiryCalendarDaysAway("2026-05-20")).toBe(11);
    });
  });

  describe("normalizeItemNotificationRepeat", () => {
    beforeEach(() => {
      jest.useFakeTimers();
      jest.setSystemTime(new Date(2026, 4, 9, 12, 0, 0));
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it("returns none when expiryYmd is missing", () => {
      expect(normalizeItemNotificationRepeat("daily", null)).toBe("none");
      expect(normalizeItemNotificationRepeat("daily", undefined)).toBe("none");
    });

    it("returns none for unknown repeat strings", () => {
      expect(normalizeItemNotificationRepeat("hourly", "2026-06-01")).toBe("none");
      expect(normalizeItemNotificationRepeat("", "2026-06-01")).toBe("none");
    });

    it("accepts mixed-case repeat values", () => {
      expect(normalizeItemNotificationRepeat("Daily", "2026-06-01")).toBe("daily");
      expect(normalizeItemNotificationRepeat("WEEKLY", "2026-06-01")).toBe("weekly");
    });

    it("downgrades weekly to none when expiry is fewer than 7 calendar days away", () => {
      expect(normalizeItemNotificationRepeat("weekly", "2026-05-14")).toBe("none");
    });

    it("allows weekly when expiry is exactly 7 calendar days away", () => {
      expect(normalizeItemNotificationRepeat("weekly", "2026-05-16")).toBe("weekly");
    });

    it("downgrades monthly to none when expiry is fewer than 30 calendar days away", () => {
      expect(normalizeItemNotificationRepeat("monthly", "2026-06-07")).toBe("none");
    });

    it("allows monthly when expiry is exactly 30 calendar days away", () => {
      expect(normalizeItemNotificationRepeat("monthly", "2026-06-08")).toBe("monthly");
    });
  });

  describe("calculateItemReminderOccurrences", () => {
    afterEach(() => {
      jest.useRealTimers();
    });

    it("returns empty when notifications_enabled is false", () => {
      jest.useFakeTimers();
      jest.setSystemTime(new Date(2026, 4, 1, 12, 0, 0));
      const item = baseItem({ notifications_enabled: false });
      expect(calculateItemReminderOccurrences(item, new Date(2026, 4, 1, 12, 0, 0))).toEqual([]);
    });

    it("returns empty when expiry_date is missing", () => {
      jest.useFakeTimers();
      jest.setSystemTime(new Date(2026, 4, 1, 12, 0, 0));
      const item = baseItem({ expiry_date: undefined });
      expect(calculateItemReminderOccurrences(item, new Date(2026, 4, 1, 12, 0, 0))).toEqual([]);
    });

    it("treats missing notifications_enabled as off (no occurrences)", () => {
      jest.useFakeTimers();
      jest.setSystemTime(new Date(2026, 4, 1, 12, 0, 0));
      const item = baseItem({ notifications_enabled: undefined });
      expect(calculateItemReminderOccurrences(item, new Date(2026, 4, 1, 12, 0, 0))).toEqual([]);
    });

    it("with repeat none schedules one fire at expiry minus reminder days at notification_time", () => {
      jest.useFakeTimers();
      jest.setSystemTime(new Date(2026, 4, 1, 12, 0, 0));
      const item = baseItem({
        expiry_date: "2026-05-15",
        notification_reminder_days: 7,
        notification_time: "13:00",
        notification_repeat: "none",
      });

      const now = new Date(2026, 4, 1, 12, 0, 0);
      const dates = calculateItemReminderOccurrences(item, now);

      expect(dates).toHaveLength(1);
      expect(dates[0].getFullYear()).toBe(2026);
      expect(dates[0].getMonth()).toBe(4);
      expect(dates[0].getDate()).toBe(8);
      expect(dates[0].getHours()).toBe(13);
      expect(dates[0].getMinutes()).toBe(0);
    });

    it("clamps notification_reminder_days below 1 to 1", () => {
      jest.useFakeTimers();
      jest.setSystemTime(new Date(2026, 4, 1, 12, 0, 0));
      const item = baseItem({
        expiry_date: "2026-05-15",
        notification_reminder_days: 0,
        notification_repeat: "none",
      });
      const dates = calculateItemReminderOccurrences(item, new Date(2026, 4, 1, 12, 0, 0));
      expect(dates).toHaveLength(1);
      expect(dates[0].getDate()).toBe(14);
    });

    it("returns empty when every occurrence would fire before now (expiry already passed)", () => {
      jest.useFakeTimers();
      jest.setSystemTime(new Date(2026, 4, 15, 12, 0, 0));
      const item = baseItem({
        expiry_date: "2026-05-10",
        notification_reminder_days: 1,
        notification_time: "13:00",
        notification_repeat: "none",
      });
      expect(calculateItemReminderOccurrences(item, new Date(2026, 4, 15, 12, 0, 0))).toEqual([]);
    });

    it("filters out fires at or before now", () => {
      jest.useFakeTimers();
      jest.setSystemTime(new Date(2026, 4, 1, 12, 0, 0));
      const item = baseItem({
        expiry_date: "2026-05-15",
        notification_reminder_days: 7,
        notification_time: "13:00",
        notification_repeat: "none",
      });
      const now = new Date(2026, 4, 8, 14, 0, 0);
      expect(calculateItemReminderOccurrences(item, now)).toEqual([]);
    });

    it("defaults invalid notification_time to 13:00", () => {
      jest.useFakeTimers();
      jest.setSystemTime(new Date(2026, 4, 1, 12, 0, 0));
      const item = baseItem({
        expiry_date: "2026-05-15",
        notification_reminder_days: 7,
        notification_time: "not-a-time",
        notification_repeat: "none",
      });
      const dates = calculateItemReminderOccurrences(item, new Date(2026, 4, 1, 12, 0, 0));
      expect(dates).toHaveLength(1);
      expect(dates[0].getHours()).toBe(13);
      expect(dates[0].getMinutes()).toBe(0);
    });

    it("parses single-digit hour in HH:mm", () => {
      jest.useFakeTimers();
      jest.setSystemTime(new Date(2026, 4, 1, 12, 0, 0));
      const item = baseItem({
        expiry_date: "2026-05-15",
        notification_reminder_days: 7,
        notification_time: "9:05",
        notification_repeat: "none",
      });
      const dates = calculateItemReminderOccurrences(item, new Date(2026, 4, 1, 12, 0, 0));
      expect(dates[0].getHours()).toBe(9);
      expect(dates[0].getMinutes()).toBe(5);
    });

    it("daily repeat lists each calendar day from first reminder through expiry at notification_time", () => {
      jest.useFakeTimers();
      jest.setSystemTime(new Date(2026, 4, 1, 12, 0, 0));
      const item = baseItem({
        expiry_date: "2026-05-05",
        notification_reminder_days: 3,
        notification_time: "09:00",
        notification_repeat: "daily",
      });
      const dates = calculateItemReminderOccurrences(item, new Date(2026, 4, 1, 12, 0, 0));
      expect(dates.map((d) => d.getDate())).toEqual([2, 3, 4, 5]);
      dates.forEach((d) => {
        expect(d.getHours()).toBe(9);
        expect(d.getMinutes()).toBe(0);
      });
    });

    it("weekly repeat adds 7-day steps until expiry", () => {
      jest.useFakeTimers();
      jest.setSystemTime(new Date(2026, 4, 1, 12, 0, 0));
      const item = baseItem({
        expiry_date: "2026-05-22",
        notification_reminder_days: 14,
        notification_time: "13:00",
        notification_repeat: "weekly",
      });
      const dates = calculateItemReminderOccurrences(item, new Date(2026, 4, 1, 12, 0, 0));
      expect(dates.map((d) => `${d.getMonth() + 1}-${d.getDate()}`)).toEqual([
        "5-8",
        "5-15",
        "5-22",
      ]);
    });

    it("treats weekly as none when expiry window is too short but still schedules one none-equivalent fire", () => {
      jest.useFakeTimers();
      jest.setSystemTime(new Date(2026, 4, 9, 12, 0, 0));
      const item = baseItem({
        expiry_date: "2026-05-14",
        notification_reminder_days: 3,
        notification_time: "13:00",
        notification_repeat: "weekly",
      });
      const dates = calculateItemReminderOccurrences(item, new Date(2026, 4, 9, 12, 0, 0));
      expect(dates).toHaveLength(1);
      expect(dates[0].getDate()).toBe(11);
    });

    it("monthly repeat steps calendar months until past expiry end", () => {
      jest.useFakeTimers();
      jest.setSystemTime(new Date(2026, 4, 1, 12, 0, 0));
      const item = baseItem({
        expiry_date: "2027-08-31",
        notification_reminder_days: 60,
        notification_time: "13:00",
        notification_repeat: "monthly",
      });
      const dates = calculateItemReminderOccurrences(item, new Date(2026, 4, 1, 12, 0, 0));
      expect(dates.map((d) => `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`)).toEqual([
        "2027-7-2",
        "2027-8-2",
      ]);
    });

    it("caps daily occurrences at MAX_SCHEDULED_PER_ITEM (64)", () => {
      jest.useFakeTimers();
      jest.setSystemTime(new Date(2026, 0, 1, 12, 0, 0));
      const item = baseItem({
        expiry_date: "2026-12-31",
        notification_reminder_days: 120,
        notification_time: "08:00",
        notification_repeat: "daily",
      });
      const dates = calculateItemReminderOccurrences(item, new Date(2026, 0, 1, 12, 0, 0));
      expect(dates.length).toBe(64);
      expect(dates[0].getTime()).toBeLessThan(dates[63].getTime());
    });
  });
});
