export const OFFLINE_NOTICE_TITLE = "You're offline";

export const OFFLINE_NOTICE_MESSAGE =
  "Check your internet connection and try again.";

export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === "string") {
    return error;
  }

  if (
    error &&
    typeof error === "object" &&
    "message" in error &&
    typeof error.message === "string"
  ) {
    return error.message;
  }

  return "";
}

export function isNetworkRequestFailed(error: unknown): boolean {
  return /network request failed/i.test(getErrorMessage(error));
}

export function isOfflineLikeError(
  error: unknown,
  options?: { hasAuthenticatedUser?: boolean }
): boolean {
  const message = getErrorMessage(error);

  if (/network request failed/i.test(message)) {
    return true;
  }

  return (
    options?.hasAuthenticatedUser === true &&
    /user not authenticated/i.test(message)
  );
}
