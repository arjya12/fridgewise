import React, { useEffect, useMemo, useState } from "react";
import { Platform, StyleSheet, Text, View } from "react-native";
import * as Linking from "expo-linking";

function parseKeyValueParams(paramString: string): Record<string, string> {
  const params: Record<string, string> = {};
  if (!paramString) return params;

  paramString.split("&").forEach((pair) => {
    const eqIndex = pair.indexOf("=");
    const rawKey = eqIndex === -1 ? pair : pair.slice(0, eqIndex);
    const rawValue = eqIndex === -1 ? "" : pair.slice(eqIndex + 1);
    if (!rawKey) return;
    params[decodeURIComponent(rawKey)] = decodeURIComponent(rawValue);
  });

  return params;
}

export default function ResetPasswordRelayScreen() {
  const [status, setStatus] = useState<
    "loading" | "missing-tokens" | "redirecting" | "done"
  >("loading");

  const deepLink = useMemo(() => {
    // For web-only: we read the Supabase recovery tokens from the URL fragment (#...).
    if (Platform.OS !== "web") return null;
    if (typeof window === "undefined") return null;

    const hash = window.location.hash.startsWith("#")
      ? window.location.hash.slice(1)
      : "";

    const params = parseKeyValueParams(hash);
    const accessToken = params.access_token;
    const refreshToken = params.refresh_token;
    const type = params.type ?? "recovery";

    if (!accessToken || !refreshToken) return null;

    // Send tokens to the native app as query parameters (Android delivers query reliably).
    const query = `access_token=${encodeURIComponent(
      accessToken
    )}&refresh_token=${encodeURIComponent(
      refreshToken
    )}&type=${encodeURIComponent(type)}`;

    return `fridgewise://reset-password?${query}`;
  }, []);

  useEffect(() => {
    if (Platform.OS !== "web") {
      setStatus("missing-tokens");
      return;
    }

    if (!deepLink) {
      setStatus("missing-tokens");
      return;
    }

    setStatus("redirecting");
    // Let the UI paint before redirecting.
    const t = setTimeout(() => {
      try {
        if (typeof window !== "undefined") {
          // Use location navigation (most reliable on mobile browsers).
          window.location.href = deepLink;
        } else {
          void Linking.openURL(deepLink);
        }
        setStatus("done");
      } catch {
        setStatus("missing-tokens");
      }
    }, 250);

    return () => clearTimeout(t);
  }, [deepLink]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        {status === "loading" && "Preparing reset…"}
        {status === "redirecting" && "Opening the app…"}
        {status === "done" && "If the app didn’t open, try again."}
        {status === "missing-tokens" && "Reset link tokens missing."}
      </Text>
      {status === "missing-tokens" ? (
        <Text style={styles.subtitle}>
          This usually means the reset link was opened in a way that removed the
          URL fragment.
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24 },
  title: { fontSize: 16, fontWeight: "600", color: "#111827", textAlign: "center" },
  subtitle: { marginTop: 12, fontSize: 13, color: "#6B7280", textAlign: "center" },
});

