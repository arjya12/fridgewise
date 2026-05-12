type RouterWithPush = { push: (href: string) => void };

function ymdTodayLocal(): string {
  const n = new Date();
  const y = n.getFullYear();
  const m = String(n.getMonth() + 1).padStart(2, "0");
  const d = String(n.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function normalizeExpiryYmd(raw: unknown): string | null {
  if (typeof raw !== "string" || !/^\d{4}-\d{2}-\d{2}/.test(raw)) return null;
  return raw.includes("T") ? raw.split("T")[0]! : raw;
}

export function shouldOpenExpiredTimelineSection(expiryYmd: string | null): boolean {
  if (!expiryYmd) return false;
  return expiryYmd < ymdTodayLocal();
}

/**
 * Resolves item id + expiry from local notification `content.data` for FridgeWise expiry flows.
 * Grouped `item_expiry` payloads store `itemIds` in soonest-expiry-first order.
 */
export function extractExpiryNotificationNavigation(
  data: Record<string, unknown> | undefined | null
): { itemId: string; expiryYmd: string | null } | null {
  if (!data || typeof data !== "object") return null;
  const type = data.type;
  if (type === "item_expiry") {
    if (data.group === true && Array.isArray(data.itemIds) && data.itemIds.length > 0) {
      return {
        itemId: String(data.itemIds[0]),
        expiryYmd: normalizeExpiryYmd(data.expiryYmd),
      };
    }
    if (typeof data.itemId === "string" && data.itemId.length > 0) {
      return {
        itemId: data.itemId,
        expiryYmd: normalizeExpiryYmd(data.expiryYmd),
      };
    }
    return null;
  }
  if (type === "expiry") {
    if (Array.isArray(data.items) && data.items.length > 0) {
      return {
        itemId: String(data.items[0]),
        expiryYmd: normalizeExpiryYmd(data.expiryYmd),
      };
    }
    if (typeof data.itemId === "string" && data.itemId.length > 0) {
      return {
        itemId: data.itemId,
        expiryYmd: normalizeExpiryYmd(data.expiryYmd),
      };
    }
    return null;
  }
  return null;
}

export function navigateToExpiryNotificationItem(
  router: RouterWithPush,
  data: Record<string, unknown> | undefined | null
): boolean {
  const parsed = extractExpiryNotificationNavigation(data);
  if (!parsed) return false;

  const nonce = `${Date.now()}-${Math.random()}`;
  const openExpired = shouldOpenExpiredTimelineSection(parsed.expiryYmd);
  const q = new URLSearchParams({
    view: "timeline",
    itemId: parsed.itemId,
    nonce,
  });
  if (openExpired) q.set("openExpired", "true");
  router.push(`/(tabs)/calendar?${q.toString()}` as never);
  return true;
}
