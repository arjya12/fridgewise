import * as BackgroundFetch from "expo-background-fetch";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import { registerExpiryCheckTask } from "./expiryCheckService";
import { registerLowStockCheckTask } from "./lowStockCheckService";

// Define task names for background fetch operations
export const EXPIRY_CHECK_TASK = "EXPIRY_CHECK_TASK";
export const LOW_STOCK_CHECK_TASK = "LOW_STOCK_CHECK_TASK";

// Configure how notifications appear when the app is in the foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
    priority: Notifications.AndroidNotificationPriority.HIGH,
  }),
});

/**
 * Request notification permissions from the user
 * @returns A promise that resolves to the permission status
 */
export async function requestNotificationPermissions() {
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  // If we don't have permission yet, ask for it
  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  // On Android, we need to set the notification channel for notifications to appear
  if (Platform.OS === "android") {
    await setupNotificationChannels();
  }

  return finalStatus;
}

/**
 * Set up notification channels for Android
 */
async function setupNotificationChannels() {
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("expiry-alerts", {
      name: "Expiry Alerts",
      description: "Notifications for items that are about to expire",
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#22C55E",
    });

    await Notifications.setNotificationChannelAsync("low-stock-alerts", {
      name: "Low Stock Alerts",
      description: "Notifications for items that are running low",
      importance: Notifications.AndroidImportance.DEFAULT,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#0284C7",
    });

    await Notifications.setNotificationChannelAsync("app-updates", {
      name: "App Updates",
      description: "Notifications about app updates and new features",
      importance: Notifications.AndroidImportance.LOW,
    });
  }
}

/**
 * Schedule a local notification
 * @param title The title of the notification
 * @param body The body text of the notification
 * @param data Any additional data to include with the notification
 * @param channelId The Android notification channel ID
 * @param trigger When the notification should be triggered
 * @returns A promise that resolves to the notification identifier
 */
export async function scheduleNotification(
  title: string,
  body: string,
  data: Record<string, unknown> = {},
  channelId = "default",
  trigger: Notifications.NotificationTriggerInput = null
) {
  return await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      data,
      ...(Platform.OS === "android" ? { channelId } : {}),
    },
    trigger,
  });
}

/**
 * Register background tasks for checking expiry and low stock
 */
export async function registerBackgroundTasks() {
  // Register the expiry check task
  registerExpiryCheckTask();

  // Register the low stock check task
  registerLowStockCheckTask();

  console.log("Background tasks registered");
}

/**
 * Schedule the background tasks to run periodically
 */
export async function scheduleBackgroundTasks() {
  try {
    // Schedule the expiry check task to run daily
    await BackgroundFetch.registerTaskAsync(EXPIRY_CHECK_TASK, {
      minimumInterval: 24 * 60 * 60, // 24 hours in seconds
      stopOnTerminate: false,
      startOnBoot: true,
    });

    // Schedule the low stock check task to run daily
    await BackgroundFetch.registerTaskAsync(LOW_STOCK_CHECK_TASK, {
      minimumInterval: 24 * 60 * 60, // 24 hours in seconds
      stopOnTerminate: false,
      startOnBoot: true,
    });

    console.log("Background tasks scheduled successfully");
  } catch (error) {
    console.error("Error scheduling background tasks:", error);
  }
}
