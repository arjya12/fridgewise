import { supabase } from "@/lib/supabase";
import { formatExpiry } from "@/utils/formatExpiry";
import * as BackgroundTask from "expo-background-task";
import * as TaskManager from "expo-task-manager";
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
    console.log("Expiry alerts disabled or no user ID");
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
      console.log("No expiring items found");
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

    console.log(
      `Scheduled notifications for ${expiringItems.length} expiring items`
    );
    return true;
  } catch (error) {
    console.error("Error in checkExpiringItems:", error);
    return false;
  }
}

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
        // Get the user's settings and ID
        const session = await supabase.auth.getSession();
        const userId = session.data.session?.user?.id;

        // Get the user's settings
        const { data: userSettings, error: settingsError } = await supabase
          .from("user_settings")
          .select("expiry_alerts")
          .eq("user_id", userId)
          .single();

        if (settingsError) {
          console.error("Error fetching user settings:", settingsError);
          return BackgroundTask.BackgroundTaskResult.Failed;
        }

        // Check for expiring items
        const result = await checkExpiringItems(
          { expiryAlerts: userSettings?.expiry_alerts ?? true },
          userId
        );

        return result
          ? BackgroundTask.BackgroundTaskResult.Success
          : BackgroundTask.BackgroundTaskResult.Success;
      } catch (error) {
        console.error("Error in expiry check task:", error);
        return BackgroundTask.BackgroundTaskResult.Failed;
      }
    });
  }
}
