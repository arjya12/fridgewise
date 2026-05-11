import { clearRememberMePreference } from "@/lib/authPreferences";
import { supabase } from "@/lib/supabase";
import { SHOPPING_LIST_STORAGE_KEY } from "@/services/groceryListStorage";
import AsyncStorage from "@react-native-async-storage/async-storage";

async function clearFridgewiseAsyncStorage(): Promise<void> {
  const all = await AsyncStorage.getAllKeys();
  const drop = all.filter((k) => {
    if (k.includes("-auth-token") || k.startsWith("sb-")) return false;
    // Keep app Settings toggles (settings.*) — user preferences survive Clear / Delete account.
    if (k.startsWith("settings.")) return false;
    return (
      k.startsWith("fridgewise_") ||
      k.startsWith("fw_") ||
      k.startsWith("offline_") ||
      k.startsWith("notification_preferences_") ||
      k.startsWith("user_achievements_") ||
      k.startsWith("waste_streak_") ||
      k === "notification.preferences.v1" ||
      k === SHOPPING_LIST_STORAGE_KEY ||
      k === "offline_cache" ||
      k === "pending_actions" ||
      k === "sync_status" ||
      k === "offline_config" ||
      k === "conflict_log"
    );
  });
  if (drop.length > 0) {
    await AsyncStorage.multiRemove(drop);
  }
}

function isMissingTableOrRelationError(error: {
  message?: string;
  code?: string;
}): boolean {
  const msg = (error.message ?? "").toLowerCase();
  const code = error.code ?? "";
  return (
    code === "42P01" ||
    code === "PGRST205" ||
    msg.includes("does not exist") ||
    msg.includes("could not find the table") ||
    msg.includes("schema cache") ||
    msg.includes("relation") && msg.includes("does not exist")
  );
}

/** Remove this user’s rows from app tables (inventory, logs, optional extras). */
export async function purgeUserRemoteData(userId: string): Promise<void> {
  // Only tables that exist in this project’s Supabase schema. Optional tables are skipped on error.
  const tablesInOrder = [
    { name: "usage_logs", column: "user_id" as const },
    { name: "food_items", column: "user_id" as const },
    { name: "user_settings", column: "user_id" as const },
  ];

  for (const { name, column } of tablesInOrder) {
    const { error } = await supabase.from(name).delete().eq(column, userId);
    if (error) {
      if (!isMissingTableOrRelationError(error)) {
        throw new Error(error.message || `Failed to clear ${name}`);
      }
    }
  }
}

/**
 * Clear cloud inventory/history, on-device FridgeWise storage (not session), and scheduled reminders.
 * Keeps the user signed in.
 */
export async function clearAllAppData(userId: string): Promise<void> {
  await purgeUserRemoteData(userId);
  const { cancelAllScheduledLocalNotifications } = await import(
    "@/services/notificationService"
  );
  await cancelAllScheduledLocalNotifications();
  await clearFridgewiseAsyncStorage();
}

/**
 * Full account teardown: remote data, local app storage, profile row, sign out.
 * Auth provider may still hold the email until removed in Supabase Dashboard / Edge Function.
 */
export async function deleteUserAccount(userId: string): Promise<void> {
  await purgeUserRemoteData(userId);
  const { error: profileErr } = await supabase
    .from("user_profiles")
    .delete()
    .eq("id", userId);
  if (profileErr) {
    throw new Error(profileErr.message || "Failed to delete profile");
  }
  const { cancelAllScheduledLocalNotifications } = await import(
    "@/services/notificationService"
  );
  await cancelAllScheduledLocalNotifications();
  await clearFridgewiseAsyncStorage();
  const { error: signErr } = await supabase.auth.signOut();
  if (signErr) {
    throw new Error(signErr.message || "Sign out failed");
  }
  await clearRememberMePreference();
}
