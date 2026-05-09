import type { FoodItem } from "@/lib/supabase";
import { supabase } from "@/lib/supabase";
import * as Notifications from "expo-notifications";
import { Alert, Platform } from "react-native";
import { requestNotificationPermissions } from "./notificationService";
import {
  calculateItemReminderOccurrences,
  expiryCalendarDaysAway,
} from "./itemExpiryReminderSchedule";

const MAX_TOTAL_ITEM_REMINDER_NOTIFICATIONS = 64;
const DEFAULT_TIME = "13:00";

export type { ItemNotificationRepeat } from "./itemExpiryReminderSchedule";
export {
  calculateItemReminderOccurrences,
  expiryCalendarDaysAway,
  normalizeItemNotificationRepeat,
} from "./itemExpiryReminderSchedule";

const ACCENT_EXPIRY = "#15803D";

/** iOS secondary line — reminder-focused, not “expiring soon” vagueness. */
function iosSubtitle(): string {
  return "FridgeWise · Item reminder";
}

export function formatTimeForStorage(date: Date): string {
  const h = String(date.getHours()).padStart(2, "0");
  const m = String(date.getMinutes()).padStart(2, "0");
  return `${h}:${m}`;
}

export function parseStoredTimeToDate(value?: string | null): Date {
  const fallback = () => {
    const d = new Date();
    d.setHours(13, 0, 0, 0);
    return d;
  };
  if (!value || typeof value !== "string") return fallback();
  const m = value.match(/^(\d{1,2}):(\d{2})$/);
  if (!m) return fallback();
  const hh = Math.min(23, Math.max(0, parseInt(m[1], 10)));
  const mm = Math.min(59, Math.max(0, parseInt(m[2], 10)));
  const d = new Date();
  d.setHours(hh, mm, 0, 0);
  return d;
}

export function normalizeRepeatForUi(value?: string | null): string {
  const r = (value ?? "none").toLowerCase();
  const map: Record<string, string> = {
    none: "None",
    daily: "Daily",
    weekly: "Weekly",
    monthly: "Monthly",
  };
  return map[r] ?? "None";
}

function parseYmdLocal(ymd: string): Date {
  const m = ymd.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) {
    const d = new Date(ymd);
    return d;
  }
  return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
}

export { parseNotificationIdsFromRow } from "./notificationIdsParse";

export async function cancelNotificationIds(ids: string[]): Promise<void> {
  for (const id of ids) {
    try {
      await Notifications.cancelScheduledNotificationAsync(id);
    } catch {
      // ignore
    }
  }
}

/** All per-item reminders use `data.type === "item_expiry"` (single or grouped). */
export async function cancelAllScheduledItemExpiryNotifications(): Promise<void> {
  try {
    const all = await Notifications.getAllScheduledNotificationsAsync();
    for (const n of all) {
      if (n.content.data?.type === "item_expiry") {
        await Notifications.cancelScheduledNotificationAsync(n.identifier);
      }
    }
  } catch (e) {
    console.warn("cancelAllScheduledItemExpiryNotifications:", e);
  }
}

async function persistNotificationIds(itemId: string, ids: string[]): Promise<void> {
  const { error } = await supabase
    .from("food_items")
    .update({ notification_ids: ids })
    .eq("id", itemId);
  if (error) console.warn("Failed to persist notification_ids:", error.message);
}

async function clearAllNotificationIdsForUser(userId: string): Promise<void> {
  const { error } = await supabase
    .from("food_items")
    .update({ notification_ids: [] })
    .eq("user_id", userId);
  if (error) console.warn("Failed to clear notification_ids:", error.message);
}

function formatExpiryYmdLong(ymd: string): string {
  const d = parseYmdLocal(ymd);
  return d.toLocaleDateString(undefined, {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

/** Readable label — trims and applies locale-aware sentence case to first grapheme. */
function formatItemNotificationTitle(raw: string): string {
  const t = raw.trim() || "Item";
  if (t.length === 0) return "Item";
  return t.charAt(0).toLocaleUpperCase() + t.slice(1);
}

/**
 * Single-item alerts: title = item only (clean glance); body = urgency + date.
 * Avoids awkward noun–verb agreement (“muffins expires”).
 */
function singleItemTitle(item: FoodItem): string {
  return formatItemNotificationTitle(item.name ?? "");
}

function singleItemBody(item: FoodItem): string {
  const ymd = item.expiry_date ?? "";
  const dateStr = formatExpiryYmdLong(ymd);
  const days = expiryCalendarDaysAway(ymd);
  if (days < 0) return `Expired · ${dateStr}`;
  if (days === 0) return `Expires today · ${dateStr}`;
  if (days === 1) return `Expires tomorrow · ${dateStr}`;
  return `Expires in ${days} days · ${dateStr}`;
}

function sortItemsByExpiryUrgency(items: FoodItem[]): FoodItem[] {
  return [...items].sort((a, b) => {
    const da = expiryCalendarDaysAway(a.expiry_date ?? "");
    const db = expiryCalendarDaysAway(b.expiry_date ?? "");
    return da - db;
  });
}

/** Group body: cap names; large sets nudge user to open the app. */
function groupedReminderBody(items: FoodItem[]): string {
  const sorted = sortItemsByExpiryUrgency(items);
  const names = sorted.map((i) => formatItemNotificationTitle(i.name ?? ""));
  const n = names.length;
  if (n >= 6) {
    return "Open FridgeWise to review them.";
  }
  if (n === 2) {
    return `${names[0]} and ${names[1]} need attention.`;
  }
  const a = names[0];
  const b = names[1];
  const more = n - 2;
  return `${a}, ${b}, and ${more} more item${more === 1 ? "" : "s"} need attention.`;
}

function triggerGroupKey(d: Date): string {
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}-${d.getHours()}-${d.getMinutes()}`;
}

type ReminderSlot = {
  fireAt: Date;
  items: FoodItem[];
};

async function scheduleNotificationAt(
  title: string,
  body: string,
  fireDate: Date,
  data: Record<string, unknown>
): Promise<string | null> {
  const subtitle = iosSubtitle();
  try {
    return await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data,
        ...(subtitle ? { subtitle } : {}),
        sound: "default",
        ...(Platform.OS === "ios"
          ? {}
          : {
              channelId: "expiry-alerts",
              color: ACCENT_EXPIRY,
              priority: Notifications.AndroidNotificationPriority.HIGH,
            }),
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: fireDate,
      },
    });
  } catch (e) {
    console.warn("scheduleNotificationAt failed:", e);
    return null;
  }
}

function itemEligibleForReminders(item: FoodItem): boolean {
  if ((item.quantity ?? 0) <= 0) return false;
  if (!item.notifications_enabled) return false;
  if (!item.expiry_date) return false;
  if (expiryCalendarDaysAway(item.expiry_date) <= 0) return false;
  return true;
}

/**
 * Rebuilds every per-item reminder notification for the signed-in user.
 * Groups by exact trigger minute so items that share the same user-chosen fire time become one notification.
 */
export async function rescheduleAllItemReminderNotificationsForUser(
  options?: { showPermissionDeniedAlert?: boolean }
): Promise<void> {
  const { data: userData } = await supabase.auth.getUser();
  const userId = userData.user?.id;
  if (!userId) return;

  await cancelAllScheduledItemExpiryNotifications();
  await clearAllNotificationIdsForUser(userId);

  const { data: rows, error } = await supabase
    .from("food_items")
    .select("*")
    .eq("user_id", userId)
    .gt("quantity", 0);

  if (error) {
    console.warn("rescheduleAllItemReminderNotificationsForUser:", error.message);
    return;
  }

  const items = (rows as FoodItem[]).filter(itemEligibleForReminders);
  const now = new Date();
  const slotMap = new Map<string, ReminderSlot>();

  for (const item of items) {
    for (const fireAt of calculateItemReminderOccurrences(item, now)) {
      const key = triggerGroupKey(fireAt);
      const existing = slotMap.get(key);
      if (!existing) {
        slotMap.set(key, { fireAt, items: [item] });
      } else {
        if (!existing.items.some((i) => i.id === item.id)) {
          existing.items.push(item);
        }
      }
    }
  }

  let slots = Array.from(slotMap.values()).sort(
    (a, b) => a.fireAt.getTime() - b.fireAt.getTime()
  );

  if (slots.length === 0) return;

  if (slots.length > MAX_TOTAL_ITEM_REMINDER_NOTIFICATIONS) {
    console.warn(
      `Capping item reminder notifications at ${MAX_TOTAL_ITEM_REMINDER_NOTIFICATIONS} (had ${slots.length} slots).`
    );
    slots = slots.slice(0, MAX_TOTAL_ITEM_REMINDER_NOTIFICATIONS);
  }

  const status = await requestNotificationPermissions();
  if (status !== "granted") {
    if (options?.showPermissionDeniedAlert) {
      Alert.alert(
        "Notifications disabled",
        "Turn on notifications in system settings to get item reminders."
      );
    }
    return;
  }

  const itemIdToIds = new Map<string, string[]>();

  for (const slot of slots) {
    const list = sortItemsByExpiryUrgency(slot.items);
    let notifId: string | null = null;

    if (list.length === 1) {
      const item = list[0];
      notifId = await scheduleNotificationAt(
        singleItemTitle(item),
        singleItemBody(item),
        slot.fireAt,
        { type: "item_expiry", itemId: item.id, group: false }
      );
    } else {
      const count = list.length;
      notifId = await scheduleNotificationAt(
        `${count} item reminders`,
        groupedReminderBody(list),
        slot.fireAt,
        {
          type: "item_expiry",
          group: true,
          itemIds: list.map((i) => i.id),
        }
      );
    }

    if (!notifId) continue;

    for (const item of list) {
      const cur = itemIdToIds.get(item.id) ?? [];
      cur.push(notifId);
      itemIdToIds.set(item.id, cur);
    }
  }

  await Promise.all(
    items.map((item) => {
      const ids = [...new Set(itemIdToIds.get(item.id) ?? [])];
      return persistNotificationIds(item.id, ids);
    })
  );
}

export async function scheduleItemExpiryNotifications(
  item: FoodItem,
  options?: { showPermissionDeniedAlert?: boolean }
): Promise<void> {
  void item;
  await rescheduleAllItemReminderNotificationsForUser(options);
}

export async function cancelItemExpiryNotifications(item: FoodItem): Promise<void> {
  void item;
  await rescheduleAllItemReminderNotificationsForUser();
}

export async function rescheduleItemExpiryNotifications(
  _oldItem: FoodItem | null,
  newItem: FoodItem,
  options?: { showPermissionDeniedAlert?: boolean }
): Promise<void> {
  void newItem;
  await rescheduleAllItemReminderNotificationsForUser(options);
}

export async function syncItemExpiryNotificationsAfterSave(
  _item: FoodItem,
  options?: { showPermissionDeniedAlert?: boolean }
): Promise<void> {
  await rescheduleAllItemReminderNotificationsForUser(options);
}
