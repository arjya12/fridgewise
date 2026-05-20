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

/** Removes the Supabase Auth user so the email/password can no longer sign in. */
async function deleteAuthLogin(): Promise<void> {
  const { data, error } = await supabase.functions.invoke("delete-account", {
    method: "POST",
  });

  if (error) {
    const hint =
      " Deploy the delete-account Edge Function in Supabase (see supabase/functions/delete-account).";
    throw new Error(
      (error.message || "Could not remove your login.") +
        (error.message?.includes("Function not found") ? hint : "")
    );
  }

  const body = data as { ok?: boolean; error?: string } | null;
  if (body?.error) {
    throw new Error(body.error);
  }
  if (!body?.ok) {
    throw new Error("Could not remove your login.");
  }
}

/**
 * Full account teardown: app data, profile, auth login, local storage, sign out.
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

  await deleteAuthLogin();

  const { cancelAllScheduledLocalNotifications } = await import(
    "@/services/notificationService"
  );
  await cancelAllScheduledLocalNotifications();
  await clearFridgewiseAsyncStorage();

  try {
    await supabase.auth.signOut();
  } catch {
    // Auth user may already be gone; still clear local session below.
  }
  await clearRememberMePreference();
}
