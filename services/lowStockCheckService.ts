import AsyncStorage from "@react-native-async-storage/async-storage";
import { supabase } from "@/lib/supabase";
import * as BackgroundTask from "expo-background-task";
import * as TaskManager from "expo-task-manager";
import { LOW_STOCK_CHECK_TASK } from "./notificationService";
import { syncGroceryListReminder } from "./groceryListReminderService";

/** Same key as `SettingsContext` — grocery reminders toggle is stored locally, not only in Supabase. */
const LOW_STOCK_ALERTS_STORAGE_KEY = "settings.lowStockAlerts";

/**
 * Sync grocery list weekday reminders (in-app Groceries list only — not inventory / calendar items).
 * @param settings The user's settings object
 * @param userId The user's ID (reminders run only when signed in)
 */
export async function checkLowStockItems(
  settings: { lowStockAlerts: boolean },
  userId: string | undefined
) {
  if (!settings.lowStockAlerts || !userId) {
    console.log("Grocery reminders disabled or no user ID");
    await syncGroceryListReminder(false);
    return false;
  }

  try {
    const scheduled = await syncGroceryListReminder(true);
    if (scheduled) {
      console.log("Grocery list reminder scheduled");
    } else {
      console.log("No grocery list reminder (toggle off, empty list, or scheduling skipped)");
    }
    return scheduled;
  } catch (error) {
    console.error("Error in checkLowStockItems / grocery reminder sync:", error);
    return false;
  }
}

/**
 * Register the background task for grocery list reminders
 */
export function registerLowStockCheckTask() {
  if (!TaskManager.isTaskDefined(LOW_STOCK_CHECK_TASK)) {
    TaskManager.defineTask(LOW_STOCK_CHECK_TASK, async ({ data, error }) => {
      if (error) {
        console.error("Error in grocery reminder task:", error);
        return BackgroundTask.BackgroundTaskResult.Failed;
      }

      try {
        const session = await supabase.auth.getSession();
        const userId = session.data.session?.user?.id;

        const raw = await AsyncStorage.getItem(LOW_STOCK_ALERTS_STORAGE_KEY);
        const groceryRemindersOn = raw === null ? true : raw === "true";

        await checkLowStockItems(
          { lowStockAlerts: groceryRemindersOn },
          userId
        );

        return BackgroundTask.BackgroundTaskResult.Success;
      } catch (err) {
        console.error("Error in grocery reminder task:", err);
        return BackgroundTask.BackgroundTaskResult.Failed;
      }
    });
  }
}
