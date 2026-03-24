import AsyncStorage from "@react-native-async-storage/async-storage";

const KEY_PREFIX = "fridgewise_home_pins_v1";

export const MAX_PINNED_ITEMS = 2;

export function pinnedItemsStorageKey(userId: string) {
  return `${KEY_PREFIX}:${userId}`;
}

export async function loadPinnedItemIds(userId: string): Promise<string[]> {
  try {
    const raw = await AsyncStorage.getItem(pinnedItemsStorageKey(userId));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((x: unknown): x is string => typeof x === "string" && x.length > 0)
      .slice(0, MAX_PINNED_ITEMS);
  } catch {
    return [];
  }
}

export async function savePinnedItemIds(
  userId: string,
  ids: string[]
): Promise<void> {
  const next = ids
    .filter((id) => typeof id === "string" && id.length > 0)
    .slice(0, MAX_PINNED_ITEMS);
  await AsyncStorage.setItem(
    pinnedItemsStorageKey(userId),
    JSON.stringify(next)
  );
}
