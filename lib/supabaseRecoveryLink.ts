function parseKeyValueParams(paramString: string): Record<string, string> {
  const params: Record<string, string> = {};
  if (!paramString) return params;

  paramString.split("&").forEach((pair) => {
    const eqIndex = pair.indexOf("=");
    const rawKey = eqIndex === -1 ? pair : pair.slice(0, eqIndex);
    const rawValue = eqIndex === -1 ? "" : pair.slice(eqIndex + 1);
    if (!rawKey) return;
    const key = decodeURIComponent(rawKey);
    const value = rawValue ? decodeURIComponent(rawValue) : "";
    params[key] = value;
  });

  return params;
}

function parseUrlParams(url: string): Record<string, string> {
  const hashIndex = url.indexOf("#");
  const queryIndex = url.indexOf("?");

  const params: Record<string, string> = {};

  if (hashIndex !== -1) {
    Object.assign(params, parseKeyValueParams(url.slice(hashIndex + 1)));
  }

  if (queryIndex !== -1) {
    Object.assign(params, parseKeyValueParams(url.slice(queryIndex + 1)));
  }

  return params;
}

/**
 * Supabase password recovery links usually carry tokens in the URL fragment (`#...`).
 * Some Android/Expo flows strip fragments, so we also check query params (`?...`).
 */
export function isSupabaseRecoveryLink(url: string | null): boolean {
  if (!url) return false;
  const params = parseUrlParams(url);

  // Recovery links must be "actionable" (contain something we can exchange/verify)
  // otherwise we can route too early and incorrectly show "expired".
  const hasTokens = Boolean(params.access_token && params.refresh_token);
  const hasCode = Boolean(params.code);
  const hasOtpToken = Boolean(params.token_hash || params.token);

  // Canonical recovery: `type=recovery` plus code/tokens.
  if (params.type === "recovery" && (hasTokens || hasCode || hasOtpToken)) return true;

  // Fallback for links that omit `type`.
  if (hasTokens) return true;

  return false;
}

