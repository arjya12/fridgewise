const INVARIANT_UNITS = new Set([
  "l",
  "ml",
  "cl",
  "kg",
  "g",
  "lb",
  "oz",
  "tsp",
  "tbsp",
  "dozen",
  "dozens",
]);

const SINGULAR_BY_PLURAL: Record<string, string> = {
  pcs: "pc",
  pieces: "piece",
  servings: "serving",
  cans: "can",
  jars: "jar",
  bottles: "bottle",
  boxes: "box",
  bags: "bag",
  packs: "pack",
  portions: "portion",
  slices: "slice",
  bunches: "bunch",
  cartons: "carton",
  trays: "tray",
};

const PLURAL_BY_SINGULAR: Record<string, string> = {
  pc: "pcs",
  piece: "pieces",
  serving: "servings",
  can: "cans",
  jar: "jars",
  bottle: "bottles",
  box: "boxes",
  bag: "bags",
  pack: "packs",
  portion: "portions",
  slice: "slices",
  bunch: "bunches",
  carton: "cartons",
  tray: "trays",
};

function normalizeUnit(unit?: string): string {
  const raw = (unit || "").trim();
  return raw || "pcs";
}

function toSingular(unit: string): string {
  const lower = unit.toLowerCase();
  if (INVARIANT_UNITS.has(lower)) return unit;
  if (SINGULAR_BY_PLURAL[lower]) {
    const s = SINGULAR_BY_PLURAL[lower];
    return unit === lower ? s : s;
  }
  if (lower.endsWith("s") && lower.length > 1) return unit.slice(0, -1);
  return unit;
}

function toPlural(unit: string): string {
  const lower = unit.toLowerCase();
  if (INVARIANT_UNITS.has(lower)) return unit;
  if (PLURAL_BY_SINGULAR[lower]) {
    const p = PLURAL_BY_SINGULAR[lower];
    return unit === lower ? p : p;
  }
  if (lower.endsWith("s")) return unit;
  return `${unit}s`;
}

export function formatQuantityWithUnit(
  quantity: number | string,
  unit?: string,
  options?: { fallbackUnit?: string }
): string {
  const qtyNum =
    typeof quantity === "number"
      ? quantity
      : Number.parseFloat(String(quantity).trim());
  const safeQty = Number.isFinite(qtyNum) ? qtyNum : quantity;
  const fallbackUnit = options?.fallbackUnit ?? "pcs";
  const normalized = normalizeUnit(unit || fallbackUnit);
  const isSingular = typeof safeQty === "number" ? Math.abs(safeQty) === 1 : String(safeQty) === "1";
  const displayUnit = isSingular ? toSingular(normalized) : toPlural(normalized);
  return `${safeQty} ${displayUnit}`;
}

