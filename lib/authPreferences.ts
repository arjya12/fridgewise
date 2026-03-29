import AsyncStorage from "@react-native-async-storage/async-storage";

/** Persisted when the user signs in; "false" means do not restore session on next launch. */
export const REMEMBER_ME_STORAGE_KEY = "@fridgewise/remember_me";

export async function setRememberMePreference(remember: boolean): Promise<void> {
  await AsyncStorage.setItem(
    REMEMBER_ME_STORAGE_KEY,
    remember ? "true" : "false"
  );
}

export async function clearRememberMePreference(): Promise<void> {
  await AsyncStorage.removeItem(REMEMBER_ME_STORAGE_KEY);
}
