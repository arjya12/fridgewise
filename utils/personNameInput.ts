/**
 * Strip to Unicode letters, spaces, ASCII hyphen, and ASCII / typographic apostrophe (’).
 * Collapses runs of spaces.
 */
export function sanitizePersonNameInput(value: string): string {
  return value
    .replace(/[^\p{L}\s'\-\u2019]/gu, "")
    .replace(/\s+/g, " ");
}

/**
 * Words: letter runs with optional internal hyphens/apostrophes (Jean-Luc, O'Brien).
 * Multiple words separated by spaces.
 */
export function isValidPersonName(value: string): boolean {
  const t = value.trim();
  if (!t) return false;
  return /^(?:[\p{L}]+(?:[-'\u2019][\p{L}]+)*)(?:\s+(?:[\p{L}]+(?:[-'\u2019][\p{L}]+)*))*$/u.test(
    t
  );
}

const GREETING_DELIM_SPLIT = /([-'\u2019])/;

/**
 * Title-case each segment between hyphens/apostrophes for display (jean-luc → Jean-Luc).
 */
export function formatNameForGreeting(value: string): string {
  const lower = value.trim().toLowerCase();
  if (!lower) return "";
  return lower
    .split(GREETING_DELIM_SPLIT)
    .map((part) => {
      if (part === "-" || part === "'" || part === "\u2019") return part;
      if (!part) return part;
      const first = part.charAt(0);
      const rest = part.slice(1);
      return first.toLocaleUpperCase() + rest;
    })
    .join("");
}

/**
 * First name for UI greetings: first whitespace-separated word from full name, or email local part.
 * Keeps hyphens and apostrophes (e.g. Jean-Luc, O'Brien).
 */
export function firstNameForGreeting(fullName?: string, email?: string): string | undefined {
  const token = fullName?.trim().split(/\s+/).filter(Boolean)[0];
  if (token) {
    const formatted = formatNameForGreeting(token);
    return formatted || undefined;
  }
  const local = email?.split("@")[0]?.trim();
  if (!local) return undefined;
  const segment = local.split(/[._]/)[0] || local;
  const formatted = formatNameForGreeting(segment);
  return formatted || undefined;
}
