/**
 * Stores the initial URL when app is opened via reset-password deep link.
 * The index/splash screen saves it here before navigating; reset-password reads it.
 */
let pendingResetPasswordUrl: string | null = null;

export function setPendingResetPasswordUrl(url: string | null): void {
  pendingResetPasswordUrl = url;
}

export function getAndClearPendingResetPasswordUrl(): string | null {
  const url = pendingResetPasswordUrl;
  pendingResetPasswordUrl = null;
  return url;
}

// Used by the splash screen to decide navigation without clearing the pending URL.
export function peekPendingResetPasswordUrl(): string | null {
  return pendingResetPasswordUrl;
}

export function clearPendingResetPasswordUrl(): void {
  pendingResetPasswordUrl = null;
}
