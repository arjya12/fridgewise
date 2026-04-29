import SafeAreaWrapper from "@/components/SafeAreaWrapper";
import ScreenLayout from "@/components/ScreenLayout";
import {
  clearPendingResetPasswordUrl,
  peekPendingResetPasswordUrl,
} from "@/lib/pendingResetUrl";
import { supabase } from "@/lib/supabase";
import { summarizeRecoveryLinkForLog } from "@/lib/supabaseRecoveryLink";
import { MAX_PASSWORD_LENGTH } from "@/utils/authFieldLimits";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as Linking from "expo-linking";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

type ResetState = "loading" | "missing" | "expired" | "ready" | "success";

const headerGradient = (
  <LinearGradient
    colors={["#C8FACC", "#3CBA8D"]}
    start={{ x: 0, y: 0 }}
    end={{ x: 1, y: 0 }}
    style={{ flex: 1 }}
  />
);

function cleanParamString(paramString: string): string {
  let clean = paramString;
  const hashIndex = clean.indexOf("#");
  if (hashIndex !== -1) clean = clean.slice(0, hashIndex);
  if (clean.startsWith("?")) clean = clean.slice(1);
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

function parseUrlParams(url: string | null): Record<string, string> {
  if (!url) return {};

  // Supabase tokens are usually returned in the URL fragment (after '#'),
  // but on some Android/Expo deep-link flows the fragment may be stripped.
  // This helper parses both the query string and fragment and merges them.
  const hashIndex = url.indexOf("#");
  const queryIndex = url.indexOf("?");

  const params: Record<string, string> = {};

  if (hashIndex !== -1) {
    const hash = url.slice(hashIndex + 1);
    Object.assign(params, parseKeyValueParams(hash));
  }

  if (queryIndex !== -1) {
    const queryEnd = hashIndex !== -1 && hashIndex > queryIndex ? hashIndex : undefined;
    const query = url.slice(queryIndex + 1, queryEnd);
    Object.assign(params, parseKeyValueParams(query));
  }

  return params;
}

// Prevent concurrent reset processing across component remounts.
// Without this, the screen can mount twice (Android deep-link + routing),
// clear the pending URL, and then get stuck with missing tokens.
let globalResetInFlightUrl: string | null = null;

function sanitizeUrlForLog(url: string | null): string | null {
  if (!url) return url;
  const qIndex = url.indexOf("?");
  const hIndex = url.indexOf("#");
  const endIndex =
    qIndex === -1 ? hIndex : hIndex === -1 ? qIndex : Math.min(qIndex, hIndex);
  if (endIndex === -1) return url;

  const base = url.slice(0, endIndex);
  const suffix = url.slice(endIndex + 1);
  const keys = suffix
    .split("&")
    .map((pair) => pair.split("=")[0])
    .filter(Boolean);
  return `${base}?${keys.join("&")}`;
}

export default function ResetPasswordScreen() {
  const router = useRouter();
  const [state, setState] = useState<ResetState>("loading");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const missingParamsTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null
  );
  const noUrlTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastProcessedUrlRef = useRef<string | null>(null);
  const inFlightUrlRef = useRef<string | null>(null);
  const processingWatchdogRef = useRef<ReturnType<typeof setTimeout> | null>(
    null
  );

  const debugLog = useCallback((...args: any[]) => {
    if (!__DEV__) return;
    console.log(...args);
  }, []);

  const handleUrl = useCallback(async (url: string | null): Promise<boolean> => {
    const normalizedUrl = url ?? "";
    if (normalizedUrl && globalResetInFlightUrl) {
      if (globalResetInFlightUrl === normalizedUrl) {
        debugLog("[Reset] Global in-flight URL; ignoring duplicate processing");
        return true;
      }
      debugLog(
        "[Reset] Another reset URL is already in-flight; ignoring:",
        sanitizeUrlForLog(url)
      );
      return true;
    }

    const params = parseUrlParams(url);
    const accessToken = (params.access_token ?? "").trim();
    const refreshToken = (params.refresh_token ?? "").trim();
    const tokenHash = ((params.token_hash ?? params.token) ?? "").trim();
    const code = (params.code ?? "").trim();
    const accessTokenPresent = accessToken.length > 0;
    const refreshTokenPresent = refreshToken.length > 0;
    const tokenHashPresent = Boolean(params.token_hash);
    const tokenPresent = Boolean(params.token);
    const codePresent = code.length > 0;
    const type = params.type;

    const isResetPath = Boolean(url?.includes("reset-password"));
    const hasResetParams =
      accessTokenPresent ||
      refreshTokenPresent ||
      tokenHashPresent ||
      tokenPresent ||
      codePresent ||
      type === "recovery";

    // Ignore unrelated URLs (ex: expo-development-client startup URL), so they
    // don't incorrectly trigger expired state.
    if (!isResetPath && !hasResetParams) {
      debugLog("[Reset] Ignoring non-reset URL:", sanitizeUrlForLog(url));
      return false;
    }

    // Avoid logging sensitive token values; only log presence & key names (dev only).
    debugLog("[Reset] Received URL:", sanitizeUrlForLog(url));
    debugLog("[Reset] Link summary:", summarizeRecoveryLinkForLog(url));
    const errPresent = Boolean(params.error || params.error_code);
    debugLog("[Reset] Params keys:", Object.keys(params));
    debugLog("[Reset] access_token exists:", accessTokenPresent);
    debugLog("[Reset] refresh_token exists:", refreshTokenPresent);
    debugLog("[Reset] access_token length:", accessToken.length);
    debugLog("[Reset] refresh_token length:", refreshToken.length);
    debugLog("[Reset] token_hash exists:", tokenHashPresent);
    debugLog("[Reset] token exists:", tokenPresent);
    debugLog("[Reset] type:", params.type);
    debugLog("[Reset] has error:", errPresent);
    const err = params.error || params.error_code;

    // Ignore non-recovery auth links (e.g. stale signup confirmation links).
    if (type && type !== "recovery") {
      debugLog("[Reset] Ignoring non-recovery auth link type:", type);
      clearPendingResetPasswordUrl();
      return false;
    }

    if (normalizedUrl && inFlightUrlRef.current === normalizedUrl) {
      debugLog("[Reset] URL already processing");
      return true;
    }
    if (normalizedUrl && lastProcessedUrlRef.current === normalizedUrl) {
      debugLog("[Reset] Duplicate URL ignored");
      return true;
    }
    if (normalizedUrl) {
      lastProcessedUrlRef.current = normalizedUrl;
      inFlightUrlRef.current = normalizedUrl;
      globalResetInFlightUrl = normalizedUrl;
    }

    if (missingParamsTimeoutRef.current) {
      clearTimeout(missingParamsTimeoutRef.current);
      missingParamsTimeoutRef.current = null;
    }
    if (processingWatchdogRef.current) {
      clearTimeout(processingWatchdogRef.current);
      processingWatchdogRef.current = null;
    }
    if (noUrlTimeoutRef.current) {
      clearTimeout(noUrlTimeoutRef.current);
      noUrlTimeoutRef.current = null;
    }
    setState("loading");
    // Safety: never leave the user stuck forever on "Verifying".
    processingWatchdogRef.current = setTimeout(() => {
      if (globalResetInFlightUrl) {
        debugLog("[Reset] Processing watchdog fired; showing expired");
        setState("expired");
      }
    }, 30000);

    // Only show "expired" when we *actually* can't process the link.
    if (err) {
      debugLog("[Reset] Showing expired state");
      setState("expired");
      return;
    }

    try {
      const withTimeout = async <T,>(
        promise: Promise<T>,
        label: string
      ): Promise<T> => {
        const TIMEOUT_MS = 20000;
        return await Promise.race([
          promise,
          new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error(`${label}-timeout`)), TIMEOUT_MS)
          ),
        ]);
      };

      // 1) Implicit flow: tokens directly in the URL (fragment or query).
      if (accessToken && refreshToken && (!type || type === "recovery")) {
        debugLog("[Reset] Attempting setSession");
        const sessionResult = await withTimeout(
          supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          }),
          "setSession"
        );
        const { error: sessionError } = sessionResult as any;
        if (sessionError) {
          debugLog("[Reset] setSession FAILED:", sessionError);
          throw sessionError;
        }
        debugLog("[Reset] setSession SUCCESS");
      } else if (code && (!type || type === "recovery")) {
        // 2) PKCE flow: exchange `code` for a session.
        debugLog("[Reset] Attempting exchangeCodeForSession");
        const { error: exchangeError } = await withTimeout(
          supabase.auth.exchangeCodeForSession(code),
          "exchangeCodeForSession"
        );
        if (exchangeError) {
          debugLog("[Reset] exchangeCodeForSession FAILED:", exchangeError);
          throw exchangeError;
        }
        debugLog("[Reset] exchangeCodeForSession SUCCESS");
      } else if (tokenHash && (!type || type === "recovery")) {
        // 3) OTP/verify style links: verify token hash for recovery.
        debugLog("[Reset] Attempting verifyOtp recovery");
        const { error: verifyError } = await withTimeout(
          supabase.auth.verifyOtp({
            type: "recovery",
            token_hash: tokenHash,
          }),
          "verifyOtp"
        );
        if (verifyError) {
          debugLog("[Reset] verifyOtp FAILED:", verifyError);
          throw verifyError;
        }
        debugLog("[Reset] verifyOtp SUCCESS");
      } else {
        // Not a usable recovery link (common when Android drops URL fragments).
        // Give the runtime link event a brief chance to arrive before showing expired.
        debugLog("[Reset] Missing usable recovery credentials; waiting briefly");
        missingParamsTimeoutRef.current = setTimeout(() => {
          debugLog("[Reset] Showing expired state");
          setState("expired");
        }, 2000);
        return true;
      }

      // Session is now set for this recovery link; show the reset form.
      debugLog("[Reset] Recovery session established; showing reset form");
      setState("ready");
      return true;
    } catch (e: any) {
      if (accessToken && refreshToken) {
        debugLog("[Reset] setSession FAILED:", e?.message || e);
      }
      debugLog("[Reset] Showing expired state");
      setState("expired");
      return true;
    } finally {
      if (processingWatchdogRef.current) {
        clearTimeout(processingWatchdogRef.current);
        processingWatchdogRef.current = null;
      }
      inFlightUrlRef.current = null;
      // Clear after we processed this link so the splash/router won't briefly
      // route you back to login.
      clearPendingResetPasswordUrl();
      if (globalResetInFlightUrl && normalizedUrl === globalResetInFlightUrl) {
        globalResetInFlightUrl = null;
      }
    }
  }, [debugLog]);

  useEffect(() => {
    debugLog("[Reset] Screen mounted");
    debugLog("[Reset] Watchdog enabled (30s)");
    const pending = peekPendingResetPasswordUrl();
    debugLog("[Reset] Pending URL:", sanitizeUrlForLog(pending));
    let initialResolved = false;

    // Always attach a listener. On Android, an initial bare deep link can be
    // delivered first, and the full URL with tokens can arrive shortly after.
    if (pending) {
      void handleUrl(pending);
    }
    Linking.getInitialURL().then(async (initialUrl) => {
      initialResolved = true;
      debugLog("[Reset] Initial URL:", sanitizeUrlForLog(initialUrl));
      if (initialUrl && initialUrl !== pending) {
        const handledInitialUrl = await handleUrl(initialUrl);
        if (!pending && !handledInitialUrl) {
          noUrlTimeoutRef.current = setTimeout(() => {
            if (globalResetInFlightUrl) return;
            debugLog(
              "[Reset] Initial URL was not a reset link, showing missing state"
            );
            setState("missing");
          }, 2500);
        }
      } else if (!pending && !initialUrl) {
        // Prevent infinite loading when screen remounts with no URL source.
        noUrlTimeoutRef.current = setTimeout(() => {
          if (globalResetInFlightUrl) return;
          debugLog("[Reset] No reset URL received, showing missing state");
          setState("missing");
        }, 2500);
      }
    });

    const sub = Linking.addEventListener("url", (event) => {
      if (noUrlTimeoutRef.current) {
        clearTimeout(noUrlTimeoutRef.current);
        noUrlTimeoutRef.current = null;
      }
      debugLog("[Reset] Linking event URL:", sanitizeUrlForLog(event.url));
      void handleUrl(event.url);
    });
    return () => {
      sub.remove();
      if (noUrlTimeoutRef.current) {
        clearTimeout(noUrlTimeoutRef.current);
        noUrlTimeoutRef.current = null;
      }
      if (!initialResolved) {
        debugLog("[Reset] Initial URL promise unresolved on unmount");
      }
    };
  }, [debugLog, handleUrl]);

  const handleSubmit = async () => {
    setError(null);
    if (!newPassword || newPassword.length < 7) {
      setError("Password must be at least 7 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (!/\d/.test(newPassword)) {
      setError("Password must include at least one number.");
      return;
    }

    setIsSubmitting(true);
    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });
      if (updateError) throw updateError;
      setState("success");
      setTimeout(() => router.replace("/(auth)/welcome"), 1500);
    } catch (e: any) {
      setError(e?.message || "Failed to update password.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (state === "loading") {
    return (
      <ScreenLayout
        topInsetColor="#FFFFFF"
        backgroundColor="#FFFFFF"
      >
        <SafeAreaWrapper edges={["bottom", "left", "right"]} style={styles.flex1}>
          <StatusBar style="dark" backgroundColor="#FFFFFF" translucent={false} />
          <View style={styles.bgWash}>
            <View style={styles.center}>
              <View style={styles.loadingCard}>
                <View style={styles.loadingSpinnerWrap}>
                  <ActivityIndicator size="large" color="#197C47" />
                </View>
                <Text style={styles.feedbackTitle}>Verifying your request</Text>
                <Text style={styles.feedbackSubtitle}>
                  Please wait while we confirm your reset link.
                </Text>
              </View>
            </View>
          </View>
        </SafeAreaWrapper>
      </ScreenLayout>
    );
  }

  if (state === "expired" || state === "missing") {
    const isMissing = state === "missing";

    return (
      <ScreenLayout topInsetColor="#FFFFFF" backgroundColor="#FFFFFF">
        <SafeAreaWrapper edges={["bottom", "left", "right"]} style={styles.flex1}>
          <StatusBar style="dark" backgroundColor="#FFFFFF" />
          <View style={styles.expiredScreenBg}>
            <View style={styles.center}>
              <View style={styles.feedbackCard}>
                <Ionicons
                  name="time-outline"
                  size={40}
                  color="#197C47"
                  style={styles.expiredIcon}
                />
                <Text style={styles.feedbackTitle}>
                  {isMissing ? "Reset link missing" : "Link expired"}
                </Text>
                <Text style={styles.feedbackSubtitle}>
                  {isMissing
                    ? "The app opened without reset credentials. Return to the latest password reset email and tap the link again."
                    : "Reset links only work for a short time. Request a new one from the login screen and check your inbox."}
                </Text>
                <TouchableOpacity
                  activeOpacity={0.9}
                  onPress={() => router.replace("/(auth)/welcome")}
                  style={styles.primaryButtonWrap}
                >
                  <LinearGradient
                    colors={["#197C47", "#3CBA8D"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.primaryButtonGradient}
                  >
                    <Text style={styles.primaryButtonText}>Back to login</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </SafeAreaWrapper>
      </ScreenLayout>
    );
  }

  if (state === "success") {
    return (
      <ScreenLayout
        topInsetColor="#C8FACC"
        topInsetContent={headerGradient}
        backgroundColor="#FAFEFB"
      >
        <SafeAreaWrapper edges={["bottom", "left", "right"]} style={styles.flex1}>
          <View style={styles.bgWash}>
            <LinearGradient
              colors={["#E8FDF3", "#FAFEFB", "#FFFFFF"]}
              locations={[0, 0.45, 1]}
              start={{ x: 0.5, y: 0 }}
              end={{ x: 0.5, y: 1 }}
              style={StyleSheet.absoluteFill}
            />
            <View style={styles.center}>
              <View style={styles.feedbackCard}>
                <View style={[styles.feedbackIconRing, styles.feedbackIconRingSuccess]}>
                  <Ionicons name="checkmark-circle" size={44} color="#197C47" />
                </View>
                <Text style={styles.feedbackTitle}>Password updated</Text>
                <Text style={styles.feedbackSubtitle}>
                  You can sign in with your new password now.
                </Text>
              </View>
            </View>
          </View>
        </SafeAreaWrapper>
      </ScreenLayout>
    );
  }

  return (
    <SafeAreaWrapper>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <TouchableOpacity
          style={styles.back}
          onPress={() => router.replace("/(auth)/welcome")}
        >
          <Ionicons name="arrow-back" size={24} color="#197C47" />
        </TouchableOpacity>
        <Text style={styles.title}>Set new password</Text>
        <Text style={styles.subtitle}>
          Enter your new password below.
        </Text>

        <TextInput
          style={styles.input}
          placeholder="New password"
          placeholderTextColor="#9CA3AF"
          value={newPassword}
          onChangeText={setNewPassword}
          secureTextEntry={!showPassword}
          autoCapitalize="none"
          autoCorrect={false}
          maxLength={MAX_PASSWORD_LENGTH}
        />
        <TextInput
          style={styles.input}
          placeholder="Confirm password"
          placeholderTextColor="#9CA3AF"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry={!showPassword}
          autoCapitalize="none"
          autoCorrect={false}
          maxLength={MAX_PASSWORD_LENGTH}
        />
        <TouchableOpacity
          style={styles.eyeToggle}
          onPress={() => setShowPassword(!showPassword)}
        >
          <Ionicons
            name={showPassword ? "eye-outline" : "eye-off-outline"}
            size={20}
            color="#9CA3AF"
          />
          <Text style={styles.eyeText}>
            {showPassword ? "Hide" : "Show"} password
          </Text>
        </TouchableOpacity>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <TouchableOpacity
          style={[styles.button, isSubmitting && styles.buttonDisabled]}
          onPress={handleSubmit}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Update password</Text>
          )}
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </SafeAreaWrapper>
  );
}

const styles = StyleSheet.create({
  flex1: {
    flex: 1,
  },
  expiredScreenBg: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  expiredIcon: {
    marginBottom: 20,
  },
  bgWash: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 20,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  feedbackCard: {
    width: "100%",
    maxWidth: 360,
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    paddingHorizontal: 28,
    paddingTop: 32,
    paddingBottom: 28,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E3F6EA",
    shadowColor: "#197C47",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 6,
  },
  loadingCard: {
    width: "100%",
    maxWidth: 360,
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    paddingVertical: 40,
    paddingHorizontal: 28,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E3F6EA",
    shadowColor: "#197C47",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
  },
  loadingSpinnerWrap: {
    marginBottom: 8,
  },
  feedbackIconRing: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: "#D8FAE5",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  feedbackIconRingSuccess: {
    backgroundColor: "#D8FAE5",
  },
  feedbackTitle: {
    fontFamily: "PlusJakartaSans_700Bold",
    fontSize: 22,
    fontWeight: "700",
    color: "#197C47",
    textAlign: "center",
    marginBottom: 12,
    letterSpacing: -0.2,
  },
  feedbackSubtitle: {
    fontFamily: "PlusJakartaSans_600SemiBold",
    fontSize: 15,
    lineHeight: 22,
    color: "#5C6D64",
    textAlign: "center",
    marginBottom: 8,
  },
  primaryButtonWrap: {
    alignSelf: "stretch",
    marginTop: 24,
    borderRadius: 32,
    overflow: "hidden",
    shadowColor: "#197C47",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 6,
  },
  primaryButtonGradient: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 54,
  },
  primaryButtonText: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "700",
    fontFamily: "PlusJakartaSans_700Bold",
  },
  back: {
    position: "absolute",
    top: 12,
    left: 24,
    zIndex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: "#6B7280",
    marginBottom: 24,
  },
  input: {
    backgroundColor: "#F9FAFB",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: "#111827",
    marginBottom: 12,
  },
  eyeToggle: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 16,
  },
  eyeText: {
    fontSize: 14,
    color: "#6B7280",
  },
  error: {
    color: "#DC2626",
    fontSize: 14,
    marginBottom: 12,
  },
  button: {
    backgroundColor: "#197C47",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
