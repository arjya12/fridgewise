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
