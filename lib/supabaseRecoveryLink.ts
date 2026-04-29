function cleanParamString(paramString: string): string {
  let clean = paramString;
  const hashIndex = clean.indexOf("#");
  if (hashIndex !== -1) clean = clean.slice(0, hashIndex);
  const queryIndex = clean.indexOf("?");
  if (queryIndex === 0) clean = clean.slice(1);
  return clean;
}

function safeDecode(value: string): string {
  try {
    return decodeURIComponent(value.replace(/\+/g, "%20"));
  } catch {
    return value;
  }
}

function parseKeyValueParams(paramString: string): Record<string, string> {
  const params: Record<string, string> = {};
  const cleanParamStringValue = cleanParamString(paramString);
  if (!cleanParamStringValue) return params;

  cleanParamStringValue.split("&").forEach((pair) => {
    const eqIndex = pair.indexOf("=");
    const rawKey = eqIndex === -1 ? pair : pair.slice(0, eqIndex);
    const rawValue = eqIndex === -1 ? "" : pair.slice(eqIndex + 1);
    if (!rawKey) return;
    const key = safeDecode(rawKey);
    const value = rawValue ? safeDecode(rawValue) : "";
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
    const queryEnd = hashIndex !== -1 && hashIndex > queryIndex ? hashIndex : undefined;
    Object.assign(params, parseKeyValueParams(url.slice(queryIndex + 1, queryEnd)));
  }

  return params;
}

function redactUrlForLog(url: string | null): string | null {
  if (!url) return url;

  const qIndex = url.indexOf("?");
  const hIndex = url.indexOf("#");
  const firstParamIndex =
    qIndex === -1 ? hIndex : hIndex === -1 ? qIndex : Math.min(qIndex, hIndex);

  if (firstParamIndex === -1) return url;

  const base = url.slice(0, firstParamIndex);
  const paramText = url.slice(firstParamIndex + 1);
  const keys = paramText
    .split("&")
    .map((pair) => pair.split("=")[0])
    .filter(Boolean);

  return `${base}?${keys.join("&")}`;
}

export function summarizeRecoveryLinkForLog(url: string | null) {
  const params = url ? parseUrlParams(url) : {};
  const accessToken = params.access_token ?? "";
  const refreshToken = params.refresh_token ?? "";
  const tokenHash = params.token_hash ?? params.token ?? "";
  const code = params.code ?? "";
  const error = params.error ?? params.error_code ?? "";

  return {
    url: redactUrlForLog(url),
    isRecoveryLink: isSupabaseRecoveryLink(url),
    keys: Object.keys(params),
    type: params.type,
    hasAccessToken: accessToken.length > 0,
    accessTokenLength: accessToken.length,
    hasRefreshToken: refreshToken.length > 0,
    refreshTokenLength: refreshToken.length,
    hasTokenHash: tokenHash.length > 0,
    tokenHashLength: tokenHash.length,
    hasCode: code.length > 0,
    codeLength: code.length,
    hasError: error.length > 0,
  };
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
