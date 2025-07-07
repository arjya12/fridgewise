import { supabase } from "@/lib/supabase";
import * as BackgroundFetch from "expo-background-fetch";
import * as TaskManager from "expo-task-manager";
import {
  LOW_STOCK_CHECK_TASK,
  scheduleNotification,
} from "./notificationService";

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

// Define the threshold for low stock (can be customized in the future)
const LOW_STOCK_THRESHOLD = 2;

/**
 * Check for items that are running low on stock and schedule notifications if needed
 * @param settings The user's settings object
 * @param userId The user's ID
 * @returns A promise that resolves to true if notifications were scheduled, false otherwise
 */
export async function checkLowStockItems(
  settings: { lowStockAlerts: boolean },
  userId: string | undefined
) {
  // If low stock alerts are disabled or there's no user ID, don't check
  if (!settings.lowStockAlerts || !userId) {
    console.log("Low stock alerts disabled or no user ID");
    return false;
  }

  try {
    // Query Supabase for items with low stock
    const { data: lowStockItems, error } = await supabase
      .from("food_items")
      .select("*")
      .eq("user_id", userId)
      .lte("quantity", LOW_STOCK_THRESHOLD)
      .order("name", { ascending: true });

    if (error) {
      console.error("Error fetching low stock items:", error);
      return false;
    }

    // If there are no low stock items, return
    if (!lowStockItems || lowStockItems.length === 0) {
      console.log("No low stock items found");
      return false;
    }

    // Group items by category for better notification organization
    const itemsByCategory = lowStockItems.reduce<Record<string, FoodItem[]>>(
      (acc, item: FoodItem) => {
        const category = item.category || "Other";
        if (!acc[category]) {
          acc[category] = [];
        }
        acc[category].push(item);
        return acc;
      },
      {}
    );

    // Schedule notifications for each category
    for (const [category, items] of Object.entries(itemsByCategory)) {
      // Create a notification message based on the number of items
      let notificationTitle = "";
      let notificationBody = "";

      if (items.length === 1) {
        const item = items[0];
        notificationTitle = `Running low on ${item.name}`;
        notificationBody = `You only have ${item.quantity} ${
          item.quantity === 1 ? "unit" : "units"
        } of ${item.name} left.`;
      } else {
        notificationTitle = `Running low on ${items.length} ${category} items`;
        const itemDetails = items
          .map((item: FoodItem) => `${item.name} (${item.quantity})`)
          .join(", ");
        notificationBody = `You're running low on: ${itemDetails}`;
      }

      // Schedule the notification
      await scheduleNotification(
        notificationTitle,
        notificationBody,
        { type: "low_stock", items: items.map((item: FoodItem) => item.id) },
        "low-stock-alerts"
      );
    }

    console.log(
      `Scheduled notifications for ${lowStockItems.length} low stock items`
    );
    return true;
  } catch (error) {
    console.error("Error in checkLowStockItems:", error);
    return false;
  }
}

/**
 * Register the background task for checking low stock items
 */
export function registerLowStockCheckTask() {
  if (!TaskManager.isTaskDefined(LOW_STOCK_CHECK_TASK)) {
    TaskManager.defineTask(LOW_STOCK_CHECK_TASK, async ({ data, error }) => {
      if (error) {
        console.error("Error in low stock check task:", error);
        return BackgroundFetch.BackgroundFetchResult.Failed;
      }

      try {
        // Get the user's settings and ID
        const session = await supabase.auth.getSession();
        const userId = session.data.session?.user?.id;

        // Get the user's settings
        const { data: userSettings, error: settingsError } = await supabase
          .from("user_settings")
          .select("low_stock_alerts")
          .eq("user_id", userId)
          .single();

        if (settingsError) {
          console.error("Error fetching user settings:", settingsError);
          return BackgroundFetch.BackgroundFetchResult.Failed;
        }

        // Check for low stock items
        const result = await checkLowStockItems(
          { lowStockAlerts: userSettings?.low_stock_alerts ?? true },
          userId
        );

        return result
          ? BackgroundFetch.BackgroundFetchResult.NewData
          : BackgroundFetch.BackgroundFetchResult.NoData;
      } catch (error) {
        console.error("Error in low stock check task:", error);
        return BackgroundFetch.BackgroundFetchResult.Failed;
      }
    });
  }
}
