/** Max whole-number quantity users can enter in inventory, modals, and add/edit. */
export const MAX_INVENTORY_QUANTITY = 999;

export function clampIntegerQuantity(
  n: number,
  min: number,
  max: number = MAX_INVENTORY_QUANTITY
): number {
  if (!Number.isFinite(n)) return min;
  const floor = Math.floor(n);
  return Math.min(max, Math.max(min, floor));
}

/**
 * Digits only; clamps to [min, max]. Typing "1555" becomes max (e.g. 999).
 */
export function parseDigitsToClampedQuantity(
  raw: string,
  min: number,
  max: number
): number {
  const digits = raw.replace(/\D/g, "");
  if (digits === "") return min;
  const n = parseInt(digits, 10);
  if (Number.isNaN(n)) return min;
  return clampIntegerQuantity(n, min, max);
}

/**
 * Add/edit screen: sanitize free typing; integers only, clamped to 1..MAX.
 * Allows empty string while editing (caller may normalize on blur).
 */
export function sanitizeQuantityInputString(
  raw: string,
  options?: { allowEmpty?: boolean }
): string {
  const digits = raw.replace(/\D/g, "");
  if (digits === "") {
    return options?.allowEmpty ? "" : "1";
  }
  const n = parseInt(digits, 10);
  if (Number.isNaN(n)) return "1";
  return String(clampIntegerQuantity(n, 1, MAX_INVENTORY_QUANTITY));
}

function isWholeNumber(n: number): boolean {
  return Number.isFinite(n) && Math.floor(n) === n;
}

/** `food_items.quantity`: 0 (depleted) or 1..MAX — use in updates. */
export function assertStoredQuantity(q: number): void {
  if (!isWholeNumber(q)) {
    throw new Error("Quantity must be a whole number");
  }
  if (q < 0 || q > MAX_INVENTORY_QUANTITY) {
    throw new Error(`Quantity must be between 0 and ${MAX_INVENTORY_QUANTITY}`);
  }
}

/** New inventory row: 1..MAX */
export function assertNewItemQuantity(q: number): void {
  if (!isWholeNumber(q)) {
    throw new Error("Quantity must be a whole number");
  }
  if (q < 1 || q > MAX_INVENTORY_QUANTITY) {
    throw new Error(`Quantity must be between 1 and ${MAX_INVENTORY_QUANTITY}`);
  }
}

/**
 * Single `usage_logs` row: 1..min(MAX, available stock).
 * Keeps service layer aligned with app UI caps.
 */
export function assertUsageQuantity(quantity: number, availableStock: number): void {
  if (!isWholeNumber(quantity)) {
    throw new Error("Quantity must be a whole number");
  }
  if (quantity < 1) {
    throw new Error("Quantity must be at least 1");
  }
  const cap = Math.min(MAX_INVENTORY_QUANTITY, Math.max(0, availableStock));
  if (quantity > cap) {
    throw new Error(`Quantity cannot exceed ${cap}`);
  }
}
