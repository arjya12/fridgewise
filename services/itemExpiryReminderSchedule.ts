import type { FoodItem } from "@/lib/supabase";

const MAX_SCHEDULED_PER_ITEM = 64;
const DEFAULT_TIME = "13:00";

export type ItemNotificationRepeat = "none" | "daily" | "weekly" | "monthly";

function parseYmdLocal(ymd: string): Date {
  const m = ymd.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) {
    const d = new Date(ymd);
    return d;
  }
  return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
}

export function expiryCalendarDaysAway(expiryYmd: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const e = parseYmdLocal(expiryYmd);
  e.setHours(0, 0, 0, 0);
  return Math.ceil((e.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

function normalizeTimeString(value?: string | null): string {
  if (!value || typeof value !== "string") return DEFAULT_TIME;
  const m = value.match(/^(\d{1,2}):(\d{2})$/);
  if (!m) return DEFAULT_TIME;
  const hh = String(Math.min(23, Math.max(0, parseInt(m[1], 10)))).padStart(2, "0");
  const mm = String(Math.min(59, Math.max(0, parseInt(m[2], 10)))).padStart(2, "0");
  return `${hh}:${mm}`;
}

export function normalizeItemNotificationRepeat(
  repeat: string | null | undefined,
  expiryYmd?: string | null
): ItemNotificationRepeat {
  const r = (repeat ?? "none").toLowerCase();
  const base = ["none", "daily", "weekly", "monthly"].includes(r)
    ? (r as ItemNotificationRepeat)
    : "none";
  if (!expiryYmd) return "none";
  const away = expiryCalendarDaysAway(expiryYmd);
  if (base === "weekly" && away < 7) return "none";
  if (base === "monthly" && away < 30) return "none";
  return base;
}

function expiryAtTimeOfDay(expiryYmd: string, hour: number, minute: number): Date {
  const e = parseYmdLocal(expiryYmd);
  return new Date(e.getFullYear(), e.getMonth(), e.getDate(), hour, minute, 0, 0);
}

function firstReminderDate(
  expiryYmd: string,
  reminderDays: number,
  hour: number,
  minute: number
): Date {
  const e = parseYmdLocal(expiryYmd);
  return new Date(
    e.getFullYear(),
    e.getMonth(),
    e.getDate() - reminderDays,
    hour,
    minute,
    0,
    0
  );
}

function addDays(d: Date, days: number): Date {
  const n = new Date(d.getTime());
  n.setDate(n.getDate() + days);
  return n;
}

function addCalendarMonth(d: Date): Date {
  const day = d.getDate();
  const n = new Date(d.getTime());
  n.setMonth(n.getMonth() + 1);
  if (n.getDate() !== day) {
    n.setDate(0);
  }
  return n;
}

export function calculateItemReminderOccurrences(item: FoodItem, now = new Date()): Date[] {
  const expiryYmd = item.expiry_date;
  if (!expiryYmd || !item.notifications_enabled) return [];

  const reminderDays = Math.max(1, item.notification_reminder_days ?? 7);
  const t = normalizeTimeString(item.notification_time);
  const [hh, mm] = t.split(":").map((x) => parseInt(x, 10));
  const repeat = normalizeItemNotificationRepeat(item.notification_repeat, expiryYmd);

  const expiryEnd = expiryAtTimeOfDay(expiryYmd, hh, mm);
  let cursor = firstReminderDate(expiryYmd, reminderDays, hh, mm);

  if (cursor.getTime() > expiryEnd.getTime()) return [];

  const dates: Date[] = [];

  const pushForward = () => {
    if (repeat === "none") {
      dates.push(new Date(cursor.getTime()));
      return;
    }
    while (cursor.getTime() <= expiryEnd.getTime() && dates.length < MAX_SCHEDULED_PER_ITEM) {
      dates.push(new Date(cursor.getTime()));
      if (repeat === "daily") cursor = addDays(cursor, 1);
      else if (repeat === "weekly") cursor = addDays(cursor, 7);
      else cursor = addCalendarMonth(cursor);
    }
  };

  pushForward();

  return dates.filter((d) => d.getTime() > now.getTime()).slice(0, MAX_SCHEDULED_PER_ITEM);
}
