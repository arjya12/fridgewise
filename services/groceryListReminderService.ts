import {
  loadPendingGroceryListItems,
  type StoredGroceryItem,
} from "@/services/groceryListStorage";
import { cancelScheduledGroceryListReminders, scheduleNotification } from "@/services/notificationService";

/** Next Mon–Fri at this local time (end of weekday / after work). */
const REMINDER_HOUR = 18;
const REMINDER_MINUTE = 0;

/**
 * Next occurrence of Mon–Fri at REMINDER_HOUR:REMINDER_MINUTE local time, strictly after `now`.
 */
export function getNextWeekdayReminderDate(now: Date = new Date()): Date {
  const candidate = new Date(now);
  candidate.setSeconds(0, 0);

  for (let delta = 0; delta < 14; delta++) {
    const d = new Date(now);
    d.setDate(now.getDate() + delta);
    const dow = d.getDay();
    if (dow === 0 || dow === 6) continue;
    d.setHours(REMINDER_HOUR, REMINDER_MINUTE, 0, 0);
    if (d.getTime() > now.getTime()) return d;
  }

  const fallback = new Date(now);
  fallback.setDate(fallback.getDate() + 7);
  fallback.setHours(REMINDER_HOUR, REMINDER_MINUTE, 0, 0);
  return fallback;
}

function buildGroceryReminderCopy(pending: StoredGroceryItem[]): {
  title: string;
  body: string;
} {
  if (pending.length === 0) {
    return { title: "Grocery list", body: "" };
  }
  if (pending.length === 1) {
    const n = pending[0].name;
    return {
      title: "Grocery list reminder",
      body: `You still have “${n}” on your list — want to grab it on the way home?`,
    };
  }
  const preview = pending
    .slice(0, 4)
    .map((i) => i.name)
    .join(", ");
  const more =
    pending.length > 4 ? ` and ${pending.length - 4} more` : "";
  return {
    title: `Grocery list · ${pending.length} items`,
    body: `${preview}${more}. Open FridgeWise when you’re ready to shop.`,
  };
}

/**
 * Cancels prior grocery-list schedules, then either schedules the next weekday reminder
 * or clears everything if the toggle is off or the list has nothing left to buy.
 */
export async function syncGroceryListReminder(
  groceryRemindersEnabled: boolean
): Promise<boolean> {
  await cancelScheduledGroceryListReminders();

  if (!groceryRemindersEnabled) {
    return false;
  }

  const pending = await loadPendingGroceryListItems();
  if (pending.length === 0) {
    return false;
  }

  const { title, body } = buildGroceryReminderCopy(pending);

  const when = getNextWeekdayReminderDate();
  await scheduleNotification(
    title,
    body,
    { type: "grocery_list", itemCount: pending.length },
    "low-stock-alerts",
    { type: "date", date: when }
  );

  return true;
}
