import SafeAreaWrapper from "@/components/SafeAreaWrapper";
import ScreenLayout from "@/components/ScreenLayout";
import {
  clearPendingResetPasswordUrl,
  peekPendingResetPasswordUrl,
} from "@/lib/pendingResetUrl";
import { supabase } from "@/lib/supabase";
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

type ResetState = "loading" | "expired" | "ready" | "success";

const headerGradient = (
  <LinearGradient
    colors={["#C8FACC", "#3CBA8D"]}
    start={{ x: 0, y: 0 }}
    end={{ x: 1, y: 0 }}
    style={{ flex: 1 }}
  />
);

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
    const query = url.slice(queryIndex + 1);
    Object.assign(params, parseKeyValueParams(query));
  }

  return params;
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

  const debugLog = useCallback((...args: any[]) => {
    if (!__DEV__) return;
    console.log(...args);
  }, []);

  const handleUrl = useCallback(async (url: string | null) => {
    if (missingParamsTimeoutRef.current) {
      clearTimeout(missingParamsTimeoutRef.current);
      missingParamsTimeoutRef.current = null;
    }
    setState("loading");

    // Avoid logging sensitive token values; only log presence & key names (dev only).
    debugLog("[ResetPassword] url received (prefix):", url?.split("#")[0] ?? url);
    const params = parseUrlParams(url);
    const accessTokenPresent = Boolean(params.access_token);
    const refreshTokenPresent = Boolean(params.refresh_token);
    const errPresent = Boolean(params.error || params.error_code);
    debugLog("[ResetPassword] parsed:", {
      keys: Object.keys(params),
      type: params.type,
      hasAccessToken: accessTokenPresent,
      hasRefreshToken: refreshTokenPresent,
      hasErr: errPresent,
      hasCode: Boolean(params.code),
      hasOtpToken: Boolean(params.token_hash || params.token),
    });
    const err = params.error || params.error_code;
    const accessToken = params.access_token;
    const refreshToken = params.refresh_token;
    const type = params.type;
    const code = params.code;
    const tokenHash = params.token_hash ?? params.token;

    // Only show "expired" when we *actually* can't process the link.
    if (err) {
      setState("expired");
      return;
    }

    try {
      // Prevent "loading forever" if auth calls hang (rare, but it happens on bad deep-link flows).
      const TIMEOUT_MS = 15000;
      const runWithTimeout = async <T,>(label: string, fn: () => Promise<T>) => {
        return await Promise.race([
          fn(),
          new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error(`${label}-timeout`)), TIMEOUT_MS)
          ),
        ]);
      };

      // 1) Implicit flow: tokens directly in the URL (fragment or query).
      if (accessToken && refreshToken && (!type || type === "recovery")) {
        const sessionResult = await runWithTimeout("setSession", () =>
          supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          })
        );
        const { error: sessionError } = sessionResult as any;
        if (sessionError) throw sessionError;
      } else if (code && (!type || type === "recovery")) {
        // 2) PKCE flow: exchange `code` for a session.
        const { error: exchangeError } = await runWithTimeout("exchangeCodeForSession", () =>
          supabase.auth.exchangeCodeForSession(code)
        );
        if (exchangeError) throw exchangeError;
      } else if (tokenHash && (!type || type === "recovery")) {
        // 3) OTP/verify style links: verify token hash for recovery.
        const { error: verifyError } = await runWithTimeout("verifyOtp", () =>
          supabase.auth.verifyOtp({
            type: "recovery",
            token_hash: tokenHash,
          })
        );
        if (verifyError) throw verifyError;
      } else {
        // Not a usable recovery link (common when Android drops URL fragments).
        // Give the runtime link event a brief chance to arrive before showing expired.
        missingParamsTimeoutRef.current = setTimeout(() => {
          setState("expired");
        }, 2000);
        return;
      }

      // Session is now set for this recovery link; show the reset form.
      setState("ready");
    } catch {
      setState("expired");
    } finally {
      // Clear after we processed this link so the splash/router won't briefly
      // route you back to login.
      clearPendingResetPasswordUrl();
    }
  }, [debugLog, router]);

  useEffect(() => {
    const pending = peekPendingResetPasswordUrl();
    if (pending) {
      handleUrl(pending);
      return;
    }
    Linking.getInitialURL().then(handleUrl);
    const sub = Linking.addEventListener("url", ({ url }) => handleUrl(url));
    return () => sub.remove();
  }, [handleUrl]);

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

  if (state === "expired") {
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
                <Text style={styles.feedbackTitle}>Link expired</Text>
                <Text style={styles.feedbackSubtitle}>
                  Reset links only work for a short time. Request a new one from
                  the login screen and check your inbox.
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
