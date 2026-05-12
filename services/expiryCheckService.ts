import { supabase } from "@/lib/supabase";
import { formatExpiry } from "@/utils/formatExpiry";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as BackgroundTask from "expo-background-task";
import * as TaskManager from "expo-task-manager";
import { clearLocalExpiryAlertsForCurrentUser } from "./itemExpiryNotificationService";
import { EXPIRY_CHECK_TASK, scheduleNotification } from "./notificationService";

// Define the food item type
interface FoodItem {
  id: string;
  name: string;
  expiry_date: string;
  quantity: number;
  user_id: string;
  category: string;
  location: string;
  created_at: string;
}

/**
 * Check for items that are expiring soon and schedule notifications if needed
 * @param settings The user's settings object
 * @param userId The user's ID
 * @returns A promise that resolves to true if notifications were scheduled, false otherwise
 */
export async function checkExpiringItems(
  settings: { expiryAlerts: boolean },
  userId: string | undefined
) {
  // If expiry alerts are disabled or there's no user ID, don't check
  if (!settings.expiryAlerts || !userId) {
    return false;
  }

  try {
    // Get the current date
    const today = new Date();

    // Set the date for items expiring within 3 days
    const threeDaysFromNow = new Date();
    threeDaysFromNow.setDate(today.getDate() + 3);

    // Query Supabase for items expiring within the next 3 days
    const { data: expiringItems, error } = await supabase
      .from("food_items")
      .select("*")
      .eq("user_id", userId)
      .lte("expiry_date", threeDaysFromNow.toISOString().split("T")[0])
      .gte("expiry_date", today.toISOString().split("T")[0])
      .order("expiry_date", { ascending: true });

    if (error) {
      console.error("Error fetching expiring items:", error);
      return false;
    }

  // If there are no expiring items, return
  if (!expiringItems || expiringItems.length === 0) {
    return false;
  }

    // Group items by expiry date
    const itemsByExpiryDate = expiringItems.reduce<Record<string, FoodItem[]>>(
      (acc, item: FoodItem) => {
        const expiryDate = item.expiry_date;
        if (!acc[expiryDate]) {
          acc[expiryDate] = [];
        }
        acc[expiryDate].push(item);
        return acc;
      },
      {}
    );

    // Schedule notifications for each expiry date group
    for (const [expiryDate, items] of Object.entries(itemsByExpiryDate)) {
      const expiryDateObj = new Date(expiryDate);
      const formattedExpiry = formatExpiry(expiryDateObj.toISOString());

      // Create a notification message based on the number of items
      let notificationTitle = "";
      let notificationBody = "";

      if (items.length === 1) {
        const item = items[0];
        notificationTitle = `${item.name} expires ${formattedExpiry}`;
        notificationBody = `Don't forget to use your ${item.name} before it expires!`;
      } else {
        notificationTitle = `${items.length} items expire ${formattedExpiry}`;
        const itemNames = items.map((item: FoodItem) => item.name).join(", ");
        notificationBody = `Don't forget about: ${itemNames}`;
      }

      // Schedule the notification
      await scheduleNotification(
        notificationTitle,
        notificationBody,
        { type: "expiry", items: items.map((item: FoodItem) => item.id) },
        "expiry-alerts"
      );
    }

    return true;
  } catch (error) {
    console.error("Error in checkExpiringItems:", error);
    return false;
  }
}

const EXPIRY_ALERTS_STORAGE_KEY = "settings.expiryAlerts";

/**
 * Register the background task for checking expiring items
 */
export function registerExpiryCheckTask() {
  if (!TaskManager.isTaskDefined(EXPIRY_CHECK_TASK)) {
    TaskManager.defineTask(EXPIRY_CHECK_TASK, async ({ data, error }) => {
      if (error) {
        console.error("Error in expiry check task:", error);
        return BackgroundTask.BackgroundTaskResult.Failed;
      }

      try {
        const session = await supabase.auth.getSession();
        const userId = session.data.session?.user?.id;
        if (!userId) {
          return BackgroundTask.BackgroundTaskResult.Success;
        }

        // Same key as Settings screen / `SettingsContext` (device-local).
        const raw = await AsyncStorage.getItem(EXPIRY_ALERTS_STORAGE_KEY);
        const expiryAlertsOn = raw === null ? true : raw === "true";
        if (!expiryAlertsOn) {
          await clearLocalExpiryAlertsForCurrentUser();
          return BackgroundTask.BackgroundTaskResult.Success;
        }

        await checkExpiringItems({ expiryAlerts: true }, userId);

        return BackgroundTask.BackgroundTaskResult.Success;
      } catch (error) {
        console.error("Error in expiry check task:", error);
        return BackgroundTask.BackgroundTaskResult.Failed;
      }
    });
  }
}
