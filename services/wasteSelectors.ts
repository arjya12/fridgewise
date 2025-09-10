// Pure selectors and helpers for Waste Report

export interface InventoryItem {
  id: string;
  name: string;
  category?: string;
  location: "Fridge" | "Freezer" | "Shelf";
  qty: number;
  expiry: string; // ISO date string
  archived?: boolean;
  consumed?: boolean;
}

export interface Filters {
  location?: "Fridge" | "Freezer" | "Shelf" | "All";
  search?: string;
  categories?: string[]; // optional whitelist of categories
}

export type Granularity = "week" | "month" | "year";

export interface DateRange {
  start: Date; // inclusive
  end: Date; // exclusive
}

export interface Bucket {
  bucketLabel: string;
  start: Date;
  end: Date;
  count: number;
}

export function startOfDayLocal(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

export function getPeriodRange(granularity: Granularity, now: Date): DateRange {
  const todayStart = startOfDayLocal(now);

  if (granularity === "week") {
    // ISO week: Monday as start
    const day = todayStart.getDay(); // 0..6 (Sun..Sat)
    const deltaToMonday = (day + 6) % 7; // Sun->6, Mon->0, ...
    const weekStart = addDays(todayStart, -deltaToMonday);
    const weekEnd = addDays(weekStart, 7);
    return { start: weekStart, end: weekEnd };
  }

  if (granularity === "month") {
    const monthStart = new Date(
      todayStart.getFullYear(),
      todayStart.getMonth(),
      1
    );
    const monthEnd = new Date(
      todayStart.getFullYear(),
      todayStart.getMonth() + 1,
      1
    );
    return { start: monthStart, end: monthEnd };
  }

  // year
  const yearStart = new Date(todayStart.getFullYear(), 0, 1);
  const yearEnd = new Date(todayStart.getFullYear() + 1, 0, 1);
  return { start: yearStart, end: yearEnd };
}

export function getPreviousRange(
  range: DateRange,
  granularity: Granularity
): DateRange {
  if (granularity === "week") {
    const start = addDays(range.start, -7);
    const end = addDays(range.end, -7);
    return { start, end };
  }
  if (granularity === "month") {
    const start = new Date(
      range.start.getFullYear(),
      range.start.getMonth() - 1,
      1
    );
    const end = new Date(range.start.getFullYear(), range.start.getMonth(), 1);
    return { start, end };
  }
  const start = new Date(range.start.getFullYear() - 1, 0, 1);
  const end = new Date(range.start.getFullYear(), 0, 1);
  return { start, end };
}

export function isWithinRange(date: Date, range: DateRange): boolean {
  return date >= range.start && date < range.end;
}

export function normalizeFilters(filters?: Filters): Filters {
  return {
    location: filters?.location ?? "All",
    search: (filters?.search ?? "").trim().toLowerCase(),
    categories:
      filters?.categories && filters.categories.length
        ? filters.categories
        : undefined,
  };
}

export function applyFilters(
  items: InventoryItem[],
  filters?: Filters
): InventoryItem[] {
  const f = normalizeFilters(filters);
  return items.filter((it) => {
    if (f.location && f.location !== "All" && it.location !== f.location)
      return false;
    if (f.search && !it.name.toLowerCase().includes(f.search)) return false;
    if (f.categories && f.categories.length) {
      const cat = (it.category || "").trim();
      if (!f.categories.includes(cat)) return false;
    }
    return true;
  });
}

export function isWasted(item: InventoryItem, today: Date): boolean {
  const expiryDate = startOfDayLocal(new Date(item.expiry));
  return (
    expiryDate < startOfDayLocal(today) &&
    item.archived !== true &&
    item.consumed !== true
  );
}

export function getBuckets(granularity: Granularity, now: Date): Bucket[] {
  const range = getPeriodRange(granularity, now);
  const buckets: Bucket[] = [];

  if (granularity === "week" || granularity === "month") {
    const stepDays = 1;
    for (
      let d = new Date(range.start);
      d < range.end;
      d = addDays(d, stepDays)
    ) {
      const start = new Date(d);
      const end = addDays(start, 1);
      const label = start.toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
      });
      buckets.push({ bucketLabel: label, start, end, count: 0 });
    }
    return buckets;
  }

  // year -> months
  for (
    let m = new Date(range.start.getFullYear(), 0, 1);
    m < range.end;
    m = new Date(m.getFullYear(), m.getMonth() + 1, 1)
  ) {
    const start = new Date(m.getFullYear(), m.getMonth(), 1);
    const end = new Date(m.getFullYear(), m.getMonth() + 1, 1);
    const label = start.toLocaleDateString(undefined, { month: "short" });
    buckets.push({ bucketLabel: label, start, end, count: 0 });
  }
  return buckets;
}

export function bucketizeWaste(
  items: InventoryItem[],
  granularity: Granularity,
  filters?: Filters,
  now: Date = new Date()
): Bucket[] {
  const fItems = applyFilters(items, filters);
  const today = startOfDayLocal(now);
  const buckets = getBuckets(granularity, today).map((b) => ({ ...b }));
  const overallRange = getPeriodRange(granularity, today);

  fItems.forEach((item) => {
    if (!isWasted(item, today)) return;
    const exp = startOfDayLocal(new Date(item.expiry));
    if (!isWithinRange(exp, overallRange)) return;
    for (const b of buckets) {
      if (isWithinRange(exp, { start: b.start, end: b.end })) {
        b.count += 1;
        break;
      }
    }
  });

  return buckets;
}

export function groupWastedItemsByName(
  items: InventoryItem[],
  range: DateRange,
  filters?: Filters,
  now: Date = new Date()
): Array<{
  name: string;
  totalQty: number;
  occurrences: number;
  instanceIds: string[];
}> {
  const today = startOfDayLocal(now);
  const fItems = applyFilters(items, filters);
  const map = new Map<
    string,
    { totalQty: number; occurrences: number; instanceIds: string[] }
  >();

  fItems.forEach((item) => {
    const exp = startOfDayLocal(new Date(item.expiry));
    if (!isWasted(item, today)) return;
    if (!isWithinRange(exp, range)) return;
    const key = item.name.trim();
    const entry = map.get(key) || {
      totalQty: 0,
      occurrences: 0,
      instanceIds: [],
    };
    entry.totalQty += Math.max(0, item.qty || 0);
    entry.occurrences += 1;
    entry.instanceIds.push(item.id);
    map.set(key, entry);
  });

  return Array.from(map.entries())
    .map(([name, v]) => ({ name, ...v }))
    .sort(
      (a, b) =>
        b.totalQty - a.totalQty ||
        b.occurrences - a.occurrences ||
        a.name.localeCompare(b.name)
    );
}

export function changePercent(currentCount: number, prevCount: number): number {
  const denom = Math.max(prevCount, 1);
  return Math.round(((currentCount - prevCount) / denom) * 100);
}
