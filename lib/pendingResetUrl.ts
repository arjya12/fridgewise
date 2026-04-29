/**
 * Stores the initial URL when app is opened via reset-password deep link.
 * The index/splash screen saves it here before navigating; reset-password reads it.
 */
let pendingResetPasswordUrl: string | null = null;

function summarizeUrl(url: string | null): string | null {
  if (!url) return url;
  const qIndex = url.indexOf("?");
  const hIndex = url.indexOf("#");
  const firstParamIndex =
    qIndex === -1 ? hIndex : hIndex === -1 ? qIndex : Math.min(qIndex, hIndex);
  if (firstParamIndex === -1) return url;

  const base = url.slice(0, firstParamIndex);
  const keys = url
    .slice(firstParamIndex + 1)
    .split("&")
    .map((pair) => pair.split("=")[0])
    .filter(Boolean);
  return `${base}?${keys.join("&")}`;
}

function debugLog(message: string, url?: string | null): void {
  if (!__DEV__) return;
  console.log(`[ResetPendingUrl] ${message}`, summarizeUrl(url ?? null));
}

export function setPendingResetPasswordUrl(url: string | null): void {
  debugLog("set", url);
  pendingResetPasswordUrl = url;
}

export function getAndClearPendingResetPasswordUrl(): string | null {
  const url = pendingResetPasswordUrl;
  debugLog("getAndClear", url);
  pendingResetPasswordUrl = null;
  return url;
}

// Used by the splash screen to decide navigation without clearing the pending URL.
export function peekPendingResetPasswordUrl(): string | null {
  debugLog("peek", pendingResetPasswordUrl);
  return pendingResetPasswordUrl;
}

export function clearPendingResetPasswordUrl(): void {
  debugLog("clear", pendingResetPasswordUrl);
  pendingResetPasswordUrl = null;
}
