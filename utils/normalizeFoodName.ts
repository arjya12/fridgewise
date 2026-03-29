/**
 * Normalizes item names for stable matching (fuzzy grouping).
 */
export function normalizeFoodName(raw: string): string {
  return raw.trim().toLowerCase().replace(/\s+/g, " ");
}

/**
 * Trailing volume / weight / pack tokens that often differ for the same product
 * (e.g. "Whole Milk" vs "Whole Milk 1L") but should share one insights bucket.
 */
const TRAILING_SIZE_TOKEN_RE =
  /\s+\d+(\.\d+)?\s*(ml|cl|dl|l|fl\.?\s*oz|g|kg|oz|lb|pcs|pk|pack|ct|count|servings?)\b\.?$/i;

/** Words where stripping a trailing “s” would break meaning (not food plurals). */
const DO_NOT_STRIP_TRAILING_S = new Set([
  "series",
  "species",
  "caries",
  "diabetes",
  "citrus",
]);

/**
 * English-ish singular form for **grouping only** (strawberry ≈ strawberries,
 * apple ≈ apples). Not linguistically complete — tuned for grocery names.
 */
function singularizeTokenForGrouping(word: string): string {
  const w = word.toLowerCase();
  if (w.length < 3) return w;

  // cherries, strawberries, blueberries → …berry
  if (/ies$/.test(w) && w.length >= 5) {
    return w.replace(/ies$/, "y");
  }

  // tomatoes, potatoes, mangoes, avocados
  if (/(tomato|potato|mango|avocado|hero|taco|patio)es$/.test(w)) {
    return w.replace(/es$/, "");
  }

  // dishes, boxes, peaches (ch/sh/x/z + es)
  if (/(ch|sh|x|z)es$/.test(w) && w.length > 4) {
    return w.replace(/es$/, "");
  }

  // glasses → glass (sses), addresses stays awkward — skip long “ss” stems
  if (/(ss)es$/.test(w) && w.length > 5) {
    return w.replace(/es$/, "");
  }

  if (DO_NOT_STRIP_TRAILING_S.has(w)) return w;

  // eggs, apples, bananas → drop one trailing s (not “glass”, “citrus”)
  if (w.endsWith("s") && !w.endsWith("ss") && !w.endsWith("us")) {
    const stem = w.slice(0, -1);
    if (stem.length >= 3) {
      return stem;
    }
  }

  return w;
}

function singularizePhraseForGrouping(phrase: string): string {
  return phrase
    .split(" ")
    .map((t) => (t ? singularizeTokenForGrouping(t) : t))
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Same storage rules as {@link normalizeFoodName}, then strips common size
 * suffixes so reports can merge "whole milk" and "whole milk 1l", then
 * singularizes tokens so "Strawberry" and "Strawberries" share one bucket.
 */
export function normalizeFoodNameForGrouping(raw: string): string {
  let s = normalizeFoodName(raw);
  let prev = "";
  while (s !== prev) {
    prev = s;
    s = s.replace(TRAILING_SIZE_TOKEN_RE, "").trim();
  }
  s = s.replace(/\s*\(\s*\d+(\.\d+)?\s*(ml|l|g|kg)?\s*\)\s*$/i, "").trim();
  s = s.replace(/\s*[-–]\s*\d+(\.\d+)?\s*(ml|l|cl|g|kg)?\s*$/i, "").trim();
  s = singularizePhraseForGrouping(s);
  return s.replace(/\s+/g, " ");
}
