import * as BackgroundTask from "expo-background-task";
import Constants from "expo-constants";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

// Define task names for background task operations
export const EXPIRY_CHECK_TASK = "EXPIRY_CHECK_TASK";

// Check if running in Expo Go
const isExpoGo = Constants.appOwnership === "expo";

// Configure how notifications appear when the app is in the foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
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

    await Notifications.setNotificationChannelAsync("app-updates", {
      name: "App Updates",
      description: "Notifications about app updates and new features",
      importance: Notifications.AndroidImportance.LOW,
    });
  }
}

const ACCENT_EXPIRY = "#15803D";

function iosSubtitleForData(data: Record<string, unknown>): string | undefined {
  const t = data.type;
  if (t === "expiry") return "FridgeWise · Expiring soon";
  if (t === "item_expiry") return "FridgeWise · Item reminder";
  return undefined;
}

function androidAccentColor(_channelId: string): string {
  return ACCENT_EXPIRY;
}

/**
 * Schedule a local notification.
 *
 * Design notes (Expo / OS limits):
 * - Title + body (+ iOS subtitle) are yours to phrase; Android also uses `color` for accent.
 * - Custom layout HTML or arbitrary banner art is not supported for basic local notifications.
 * - In Expo Go, the small icon is Expo’s; a dev/production build uses your app icon and
 *   optional `expo.notification.icon` (Android: white-on-transparent silhouette).
 */
export async function scheduleNotification(
  title: string,
  body: string,
  data: Record<string, unknown> = {},
  channelId = "default",
  trigger: Notifications.NotificationTriggerInput = null
) {
  try {
    const subtitle = iosSubtitleForData(data);

    return await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data,
        ...(subtitle && Platform.OS === "ios" ? { subtitle } : {}),
        ...(Platform.OS === "ios"
          ? {}
          : {
              channelId,
              color: androidAccentColor(channelId),
            }),
      },
      trigger,
    });
  } catch (error) {
    console.warn("Failed to schedule notification:", error);
    return null;
  }
}

/** Cancel every scheduled local notification (expiry, tests, etc.). */
export async function cancelAllScheduledLocalNotifications(): Promise<void> {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
  } catch (e) {
    console.warn("Failed to cancel scheduled notifications:", e);
  }
}

/**
 * Register background tasks for checking expiry.
 * This function should be called from the main app after all services are loaded
 */
export async function registerBackgroundTasks() {
  try {
    // Dynamically import the task registration functions to avoid circular dependencies
    const { registerExpiryCheckTask } = await import("./expiryCheckService");

    // Register the expiry check task
    registerExpiryCheckTask();

  } catch (error) {
    console.warn("Failed to register background tasks:", error);
  }
}

/**
 * Schedule the background tasks to run periodically
 */
export async function scheduleBackgroundTasks() {
  try {
    // Skip background task scheduling in Expo Go as it's not fully supported
    if (isExpoGo) {
      return;
    }

    // Schedule the expiry check task to run daily (minimum 15 minutes for testing)
    await BackgroundTask.registerTaskAsync(EXPIRY_CHECK_TASK, {
      minimumInterval: 24 * 60, // 24 hours in minutes
    });

  } catch (error) {
    console.error("Error scheduling background tasks:", error);
  }
}
