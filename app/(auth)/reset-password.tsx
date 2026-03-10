import SafeAreaWrapper from "@/components/SafeAreaWrapper";
import { getAndClearPendingResetPasswordUrl } from "@/lib/pendingResetUrl";
import { supabase } from "@/lib/supabase";
import { Ionicons } from "@expo/vector-icons";
import * as Linking from "expo-linking";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
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

function parseHashParams(url: string | null): Record<string, string> {
  if (!url) return {};
  const hashIndex = url.indexOf("#");
  if (hashIndex === -1) return {};
  const hash = url.slice(hashIndex + 1);
  const params: Record<string, string> = {};
  hash.split("&").forEach((pair) => {
    const [key, value] = pair.split("=");
    if (key && value) params[decodeURIComponent(key)] = decodeURIComponent(value);
  });
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

  const handleUrl = useCallback(async (url: string | null) => {
    const params = parseHashParams(url);
    const err = params.error || params.error_code;
    const accessToken = params.access_token;
    const refreshToken = params.refresh_token;
    const type = params.type;

    if (err || !accessToken || type !== "recovery") {
      setState("expired");
      return;
    }

    try {
      const { error: sessionError } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      });
      if (sessionError) throw sessionError;
      setState("ready");
    } catch {
      setState("expired");
    }
  }, []);

  useEffect(() => {
    const pending = getAndClearPendingResetPasswordUrl();
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
      <SafeAreaWrapper>
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#197C47" />
          <Text style={styles.loadingText}>Verifying link…</Text>
        </View>
      </SafeAreaWrapper>
    );
  }

  if (state === "expired") {
    return (
      <SafeAreaWrapper>
        <View style={styles.center}>
          <Ionicons name="time-outline" size={64} color="#9CA3AF" />
          <Text style={styles.title}>Link expired</Text>
          <Text style={styles.subtitle}>
            This reset link has expired. Please request a new one from the app.
          </Text>
          <TouchableOpacity
            style={styles.button}
            onPress={() => router.replace("/(auth)/welcome")}
          >
            <Text style={styles.buttonText}>Back to login</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaWrapper>
    );
  }

  if (state === "success") {
    return (
      <SafeAreaWrapper>
        <View style={styles.center}>
          <Ionicons name="checkmark-circle" size={64} color="#197C47" />
          <Text style={styles.title}>Password updated</Text>
          <Text style={styles.subtitle}>
            Sign in with your new password.
          </Text>
        </View>
      </SafeAreaWrapper>
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
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 20,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
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
  loadingText: {
    fontSize: 16,
    color: "#6B7280",
    marginTop: 12,
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
