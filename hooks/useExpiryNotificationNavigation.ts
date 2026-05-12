import { navigateToExpiryNotificationItem } from "@/services/notificationNavigation";
import * as Notifications from "expo-notifications";
import { useRouter } from "expo-router";
import { useEffect } from "react";

/** Only consume `getLastNotificationResponseAsync` once per JS runtime (tabs can remount). */
let hasConsumedInitialNotificationResponse = false;

/**
 * When the user taps a local expiry notification, open Calendar → Timeline on the
 * relevant item. Handles cold start via `getLastNotificationResponseAsync` (listener
 * does not run for the notification that launched the app).
 */
export function useExpiryNotificationNavigation() {
  const router = useRouter();

  useEffect(() => {
    const handleData = (data: unknown) => {
      if (!data || typeof data !== "object") return;
      navigateToExpiryNotificationItem(router, data as Record<string, unknown>);
    };

    const sub = Notifications.addNotificationResponseReceivedListener((response) => {
      handleData(response.notification.request.content.data);
    });

    void (async () => {
      if (hasConsumedInitialNotificationResponse) return;
      hasConsumedInitialNotificationResponse = true;
      try {
        const last = await Notifications.getLastNotificationResponseAsync();
        handleData(last?.notification.request.content.data);
      } catch {
        // ignore
      }
    })();

    return () => sub.remove();
  }, [router]);
}
