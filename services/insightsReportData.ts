/**
 * All-time aggregates for Waste & Consumption report screens (usage_logs + food_items).
 */

import { categoryLabelForInsights } from "@/lib/foodCategories";
import { supabase } from "@/lib/supabase";
import { normalizeFoodNameForGrouping } from "@/utils/normalizeFoodName";

type FoodJoin = {
  name?: string | null;
  category?: string | null;
  normalized_name?: string | null;
  created_at?: string | null;
  expiry_date?: string | null;
};

type LogRow = {
  id: string;
  status: string;
  quantity: number | null;
  logged_at: string;
  food_items?: FoodJoin | null;
};

const PAGE = 800;

async function fetchAllLogs(
  userId: string,
  statuses: ("used" | "wasted" | "expired")[]
): Promise<LogRow[]> {
  const out: LogRow[] = [];
  let from = 0;
  for (;;) {
    const { data, error } = await supabase
      .from("usage_logs")
      .select(
        `
        id,
        status,
        quantity,
        logged_at,
        food_items!usage_logs_item_id_fkey (
          name,
          category,
          normalized_name,
          created_at,
          expiry_date
        )
      `
      )
      .eq("user_id", userId)
      .in("status", statuses)
      .order("logged_at", { ascending: false })
      .range(from, from + PAGE - 1);

    if (error) throw error;
    const batch = (data as LogRow[]) ?? [];
    out.push(...batch);
    if (batch.length < PAGE) break;
    from += PAGE;
  }
  return out;
}

function itemKey(f: FoodJoin | null | undefined): string {
  const raw = f?.normalized_name?.trim() || f?.name || "item";
  return normalizeFoodNameForGrouping(raw);
}

function displayItemName(f: FoodJoin | null | undefined, key: string): string {
  const n = (f?.name || "").trim();
  if (n) return n;
  if (key && key !== "item") {
    return key.replace(/\b\w/g, (c) => c.toUpperCase());
  }
  return "Item";
}

function categoryLabel(raw: string): string {
  return categoryLabelForInsights(raw);
}

/**
 * Calendar days from expiry date to the day the log was recorded (how long it sat
 * past expiry before removal). Returns null if missing dates or log was before expiry day.
 */
function daysPastExpiryUntilLogged(
  loggedIso: string | null | undefined,
  expiryYmd: string | null | undefined
): number | null {
  if (!loggedIso?.trim() || !expiryYmd?.trim()) return null;
  const m = expiryYmd.trim().match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!m) return null;
  const expDay = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  if (Number.isNaN(expDay.getTime())) return null;
  const log = new Date(loggedIso);
  if (Number.isNaN(log.getTime())) return null;
  const logDay = new Date(log.getFullYear(), log.getMonth(), log.getDate());
  const ms = logDay.getTime() - expDay.getTime();
  const days = Math.round(ms / 86400000);
  return days >= 0 ? days : null;
}

/** Whether a log happened strictly before the expiry calendar day, on/after it, or we can’t tell (missing dates). */
function logTimingVsExpiry(
  loggedIso: string | null | undefined,
  expiryYmd: string | null | undefined
): "before" | "onOrAfter" | "unknown" {
  if (!loggedIso?.trim() || !expiryYmd?.trim()) return "unknown";
  const m = expiryYmd.trim().match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!m) return "unknown";
  const expDay = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  if (Number.isNaN(expDay.getTime())) return "unknown";
  const log = new Date(loggedIso);
  if (Number.isNaN(log.getTime())) return "unknown";
  const logDay = new Date(log.getFullYear(), log.getMonth(), log.getDate());
  const ms = logDay.getTime() - expDay.getTime();
  if (ms < 0) return "before";
  return "onOrAfter";
}

export type CategoryRow = {
  key: string;
  displayLabel: string;
  qty: number;
  barPct: number;
};

export type RankedItemRow = {
  rank: number;
  name: string;
  categoryLabel: string;
  times: number;
};

/** Discard vs consumed after expiry only; percents split across those two logged outcomes (sum to 100). */
export type ExpiredOutcomeRates = {
  thrownAwayPct: number;
  consumedPct: number;
  thrownAwayQty: number;
  consumedQty: number;
};

export type WasteReportData = {
  totalWastedQty: number;
  /** Logs with status `expired` (hit expiry before use). */
  totalExpiredQty: number;
  /** Logs with status `wasted` (thrown away manually). */
  totalThrownAwayQty: number;
  /** Manual `wasted` logs with known expiry, logged before that date. */
  wastedBeforeExpiryQty: number;
  /** Manual `wasted` logs on or after the expiry day (or same day). */
  wastedAfterExpiryQty: number;
  /** Manual `wasted` logs with no usable expiry on the record. */
  wastedTimingUnknownQty: number;
  /** Category with the most `expired` logs (not `wasted`). */
  mostExpiredCategory: { displayLabel: string; qty: number } | null;
  /** Discard vs consumed after expiry (two-way split when both counts exist). */
  expiredOutcomeRates: ExpiredOutcomeRates | null;
  /** Rows in inventory with expiry before today (quantity greater than 0). Same as “still in fridge” in outcome rates when present. */
  expiredItemsInInventoryNow: number;
  /** Share of manual throw-away logs logged on or after the item’s expiry day (0–100). */
  expiredWhenThrownOutPct: number | null;
  /**
   * Mean days after `expiry_date` until `logged_at` for waste + used logs when the action
   * was on or after expiry (consumed, thrown away, or logged expired).
   */
  avgDaysPastExpiryWhenRemoved: number | null;
  mostWasted: { name: string; times: number } | null;
  wasteRatePct: number | null;
  rateFootnote: string;
  categoriesTop5: CategoryRow[];
  itemsTop5: RankedItemRow[];
};

export type ConsumptionReportData = {
  totalConsumedQty: number;
  mostConsumed: { name: string; times: number } | null;
  consumeRatePct: number | null;
  rateFootnote: string;
  categoriesTop5: CategoryRow[];
  itemsTop5: RankedItemRow[];
};

async function countFoodItemRows(userId: string): Promise<number> {
  const { count, error } = await supabase
    .from("food_items")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId);
  if (error) {
    console.warn("food_items count failed", error);
    return 0;
  }
  return count ?? 0;
}

/** Rows still in inventory with expiry date before today (local calendar day). */
async function countExpiredItemsStillInFridge(userId: string): Promise<number> {
  const today = new Date().toISOString().split("T")[0]!;
  const { count, error } = await supabase
    .from("food_items")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .gt("quantity", 0)
    .not("expiry_date", "is", null)
    .lt("expiry_date", today);
  if (error) {
    console.warn("food_items expired-in-fridge count failed", error);
    return 0;
  }
  return count ?? 0;
}

export async function loadWasteReportAllTime(userId: string): Promise<WasteReportData> {
  const [wasteLogs, usedLogs, itemsAdded, stillExpiredInFridge] = await Promise.all([
    fetchAllLogs(userId, ["wasted", "expired"]),
    fetchAllLogs(userId, ["used"]),
    countFoodItemRows(userId),
    countExpiredItemsStillInFridge(userId),
  ]);

  /** One log = one item (grams/units on the log are not summed for totals). */
  const totalWastedQty = wasteLogs.length;
  const expiredLogs = wasteLogs.filter((l) => l.status === "expired");
  const thrownAwayLogs = wasteLogs.filter((l) => l.status === "wasted");
  const totalExpiredQty = expiredLogs.length;
  const totalThrownAwayQty = thrownAwayLogs.length;

  let wastedBeforeExpiryQty = 0;
  let wastedAfterExpiryQty = 0;
  let wastedTimingUnknownQty = 0;
  for (const l of thrownAwayLogs) {
    const t = logTimingVsExpiry(l.logged_at, l.food_items?.expiry_date);
    if (t === "before") wastedBeforeExpiryQty += 1;
    else if (t === "onOrAfter") wastedAfterExpiryQty += 1;
    else wastedTimingUnknownQty += 1;
  }

  let expiredWhenThrownOutPct: number | null = null;
  if (totalThrownAwayQty > 0) {
    expiredWhenThrownOutPct = Math.round((100 * wastedAfterExpiryQty) / totalThrownAwayQty);
  }

  let avgDaysPastExpiryWhenRemoved: number | null = null;
  {
    let sum = 0;
    let n = 0;
    const actedOnPastExpiry = [...wasteLogs, ...usedLogs];
    for (const l of actedOnPastExpiry) {
      const d = daysPastExpiryUntilLogged(l.logged_at, l.food_items?.expiry_date);
      if (d != null) {
        sum += d;
        n += 1;
      }
    }
    if (n > 0) avgDaysPastExpiryWhenRemoved = Math.round((sum / n) * 10) / 10;
  }

  const byExpiredCat = new Map<string, number>();
  for (const l of expiredLogs) {
    const raw = (l.food_items?.category || "").trim() || "other";
    const label = categoryLabel(raw);
    byExpiredCat.set(label, (byExpiredCat.get(label) || 0) + 1);
  }
  const expiredCatSorted = [...byExpiredCat.entries()].sort((a, b) => b[1] - a[1]);
  const mostExpiredCategory =
    expiredCatSorted[0] != null
      ? { displayLabel: expiredCatSorted[0][0], qty: expiredCatSorted[0][1] }
      : null;

  /** Wasted after expiry day + all `expired` logs (removed as expired / discard). */
  let thrownAwayExpiredQty = 0;
  for (const l of wasteLogs) {
    if (l.status === "expired") {
      thrownAwayExpiredQty += 1;
      continue;
    }
    if (l.status === "wasted") {
      const d = daysPastExpiryUntilLogged(l.logged_at, l.food_items?.expiry_date);
      if (d != null) thrownAwayExpiredQty += 1;
    }
  }
  /** Used logs recorded on or after expiry day. */
  let consumedAfterExpiryQty = 0;
  for (const l of usedLogs) {
    const d = daysPastExpiryUntilLogged(l.logged_at, l.food_items?.expiry_date);
    if (d != null) consumedAfterExpiryQty += 1;
  }

  const discardVsConsumeDen = thrownAwayExpiredQty + consumedAfterExpiryQty;
  let expiredOutcomeRates: ExpiredOutcomeRates | null = null;
  if (discardVsConsumeDen > 0) {
    const thrownAwayPct = Math.floor((100 * thrownAwayExpiredQty) / discardVsConsumeDen);
    const consumedPct = 100 - thrownAwayPct;
    expiredOutcomeRates = {
      thrownAwayPct,
      consumedPct,
      thrownAwayQty: thrownAwayExpiredQty,
      consumedQty: consumedAfterExpiryQty,
    };
  }

  const wasteEvents = wasteLogs.length;
  const usedEvents = usedLogs.length;

  let wasteRatePct: number | null = null;
  let rateFootnote = "Compared to used & wasted logs";
  if (itemsAdded > 0) {
    wasteRatePct = Math.min(100, Math.round((100 * wasteEvents) / itemsAdded));
    rateFootnote = "Compared to items you've added";
  } else if (wasteEvents + usedEvents > 0) {
    wasteRatePct = Math.round((100 * wasteEvents) / (wasteEvents + usedEvents));
    rateFootnote = "Compared to used & wasted logs";
  }

  const byItemTimes = new Map<
    string,
    { times: number; sample: FoodJoin | null; display: string }
  >();
  for (const l of wasteLogs) {
    const k = itemKey(l.food_items);
    const cur = byItemTimes.get(k) ?? { times: 0, sample: l.food_items ?? null, display: "" };
    cur.times += 1;
    cur.sample = cur.sample || l.food_items || null;
    if (!cur.display) cur.display = displayItemName(l.food_items, k);
    byItemTimes.set(k, cur);
  }

  let mostWasted: { name: string; times: number } | null = null;
  for (const [, v] of byItemTimes) {
    const name = v.display || displayItemName(v.sample, "");
    if (!mostWasted || v.times > mostWasted.times) {
      mostWasted = { name, times: v.times };
    }
  }

  const byCatQty = new Map<string, number>();
  for (const l of wasteLogs) {
    const raw = (l.food_items?.category || "").trim() || "other";
    const label = categoryLabel(raw);
    byCatQty.set(label, (byCatQty.get(label) || 0) + 1);
  }
  const catSorted = [...byCatQty.entries()].sort((a, b) => b[1] - a[1]);
  const maxCat = catSorted[0]?.[1] ?? 0;
  const categoriesTop5: CategoryRow[] = catSorted.slice(0, 5).map(([displayLabel, q]) => ({
    key: displayLabel,
    displayLabel,
    qty: q,
    barPct: maxCat > 0 ? Math.round((q / maxCat) * 100) : 0,
  }));

  const itemSorted = [...byItemTimes.entries()].sort((a, b) => b[1].times - a[1].times);
  const itemsTop5: RankedItemRow[] = itemSorted.slice(0, 5).map(([k, v], i) => {
    const name = v.display || displayItemName(v.sample, k);
    const catRaw = v.sample?.category || "";
    return {
      rank: i + 1,
      name,
      categoryLabel: categoryLabel(catRaw),
      times: v.times,
    };
  });

  return {
    totalWastedQty,
    totalExpiredQty,
    totalThrownAwayQty,
    wastedBeforeExpiryQty,
    wastedAfterExpiryQty,
    wastedTimingUnknownQty,
    mostExpiredCategory,
    expiredOutcomeRates,
    expiredItemsInInventoryNow: stillExpiredInFridge,
    expiredWhenThrownOutPct,
    avgDaysPastExpiryWhenRemoved,
    mostWasted,
    wasteRatePct,
    rateFootnote,
    categoriesTop5,
    itemsTop5,
  };
}

export async function loadConsumptionReportAllTime(
  userId: string
): Promise<ConsumptionReportData> {
  const [usedLogs, wasteLogs, itemsAdded] = await Promise.all([
    fetchAllLogs(userId, ["used"]),
    fetchAllLogs(userId, ["wasted", "expired"]),
    countFoodItemRows(userId),
  ]);

  /** One "used" log = one consumed item (not sum of quantity field). */
  const totalConsumedQty = usedLogs.length;
  const usedEvents = usedLogs.length;
  const wasteEvents = wasteLogs.length;

  let consumeRatePct: number | null = null;
  let rateFootnote = "Compared to used & wasted logs";
  if (itemsAdded > 0) {
    consumeRatePct = Math.min(100, Math.round((100 * usedEvents) / itemsAdded));
    rateFootnote = "Compared to items you've added";
  } else if (usedEvents + wasteEvents > 0) {
    consumeRatePct = Math.round((100 * usedEvents) / (usedEvents + wasteEvents));
    rateFootnote = "Compared to used & wasted logs";
  }

  const byItemTimes = new Map<
    string,
    { times: number; sample: FoodJoin | null; display: string }
  >();
  for (const l of usedLogs) {
    const k = itemKey(l.food_items);
    const cur = byItemTimes.get(k) ?? { times: 0, sample: l.food_items ?? null, display: "" };
    cur.times += 1;
    cur.sample = cur.sample || l.food_items || null;
    if (!cur.display) cur.display = displayItemName(l.food_items, k);
    byItemTimes.set(k, cur);
  }

  let mostConsumed: { name: string; times: number } | null = null;
  for (const [, v] of byItemTimes) {
    const name = v.display || displayItemName(v.sample, "");
    if (!mostConsumed || v.times > mostConsumed.times) {
      mostConsumed = { name, times: v.times };
    }
  }

  const byCatQty = new Map<string, number>();
  for (const l of usedLogs) {
    const raw = (l.food_items?.category || "").trim() || "other";
    const label = categoryLabel(raw);
    byCatQty.set(label, (byCatQty.get(label) || 0) + 1);
  }
  const catSorted = [...byCatQty.entries()].sort((a, b) => b[1] - a[1]);
  const maxCat = catSorted[0]?.[1] ?? 0;
  const categoriesTop5: CategoryRow[] = catSorted.slice(0, 5).map(([displayLabel, q]) => ({
    key: displayLabel,
    displayLabel,
    qty: q,
    barPct: maxCat > 0 ? Math.round((q / maxCat) * 100) : 0,
  }));

  const itemSorted = [...byItemTimes.entries()].sort((a, b) => b[1].times - a[1].times);
  const itemsTop5: RankedItemRow[] = itemSorted.slice(0, 5).map(([k, v], i) => {
    const name = v.display || displayItemName(v.sample, k);
    const catRaw = v.sample?.category || "";
    return {
      rank: i + 1,
      name,
      categoryLabel: categoryLabel(catRaw),
      times: v.times,
    };
  });

  return {
    totalConsumedQty,
    mostConsumed,
    consumeRatePct,
    rateFootnote,
    categoriesTop5,
    itemsTop5,
  };
}
