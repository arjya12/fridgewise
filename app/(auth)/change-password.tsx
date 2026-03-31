import SafeAreaWrapper from "@/components/SafeAreaWrapper";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { useAuth } from "@/contexts/AuthContext";
import { clearRememberMePreference } from "@/lib/authPreferences";
import { supabase } from "@/lib/supabase";
import { MAX_PASSWORD_LENGTH } from "@/utils/authFieldLimits";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  LayoutAnimation,
  Pressable,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

export default function ChangePasswordScreen() {
  const { user, signOut } = useAuth();
  const params = useLocalSearchParams();
  const resetParam = params.reset;
  const isResetMode =
    resetParam === "1" ||
    resetParam === "true" ||
    (Array.isArray(resetParam) && (resetParam[0] === "1" || resetParam[0] === "true"));

  const [currentPassword, setCurrentPassword] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [currentFocused, setCurrentFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [confirmFocused, setConfirmFocused] = useState(false);
  const [errorText, setErrorText] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [successText, setSuccessText] = useState<string | null>(null);
  const [logoutCountdown, setLogoutCountdown] = useState<number | null>(null);
  const [logoutCancelled, setLogoutCancelled] = useState(false);
  const logoutTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const bannerTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const meetsPasswordRule = password.length >= 7 && /\d/.test(password);

  useEffect(() => {
    return () => {
      if (logoutTimerRef.current) clearInterval(logoutTimerRef.current);
      if (bannerTimerRef.current) clearTimeout(bannerTimerRef.current);
    };
  }, []);

  useEffect(() => {
    if (!successText) return;
    if (!logoutCancelled) return;
    if (bannerTimerRef.current) clearTimeout(bannerTimerRef.current);
    bannerTimerRef.current = setTimeout(() => {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setSuccessText(null);
      setLogoutCancelled(false);
    }, 3500);
    return () => {
      if (bannerTimerRef.current) clearTimeout(bannerTimerRef.current);
    };
  }, [successText, logoutCancelled]);

  const stopLogoutCountdown = () => {
    if (logoutTimerRef.current) {
      clearInterval(logoutTimerRef.current);
      logoutTimerRef.current = null;
    }
    setLogoutCountdown(null);
  };

  const performLogout = async () => {
    try {
      await signOut();
    } catch {
      try {
        await supabase.auth.signOut();
        await clearRememberMePreference();
      } catch {
        // no-op fallback
      }
    } finally {
      router.replace("/(auth)/welcome");
    }
  };

  const validate = (): boolean => {
    if (!isResetMode && !currentPassword) {
      setErrorText("Please enter your current password.");
      return false;
    }
    if (!password) {
      setErrorText("Please enter a new password.");
      return false;
    }
    if (!meetsPasswordRule) {
      setErrorText("Use at least 7 characters and include a number.");
      return false;
    }
    if (!confirmPassword) {
      setErrorText("Please confirm your new password.");
      return false;
    }
    if (password !== confirmPassword) {
      setErrorText("Passwords do not match.");
      return false;
    }
    if (!isResetMode && currentPassword === password) {
      setErrorText("New password must be different from current password.");
      return false;
    }
    setErrorText(null);
    return true;
  };

  const handleChangePassword = async () => {
    if (!validate() || !user) return;
    try {
      setLoading(true);
      if (isResetMode) {
        // Reset flow: user is already authenticated via the recovery link token.
        const { error } = await supabase.auth.updateUser({ password });
        if (error) throw error;

        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setSuccessText("Password updated.");
        setLogoutCancelled(false);
        setLogoutCountdown(null);

        setTimeout(() => router.replace("/(auth)/welcome"), 1200);
      } else {
        const { error: verifyErr } = await supabase.auth.signInWithPassword({
          email: user.email!,
          password: currentPassword,
        });
        if (verifyErr) {
          setErrorText("Current password is incorrect.");
          return;
        }

        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setSuccessText("Password will be updated.");
        setLogoutCancelled(false);
        setLogoutCountdown(5);

        if (logoutTimerRef.current) clearInterval(logoutTimerRef.current);
        logoutTimerRef.current = setInterval(() => {
          setLogoutCountdown((prev) => {
            if (prev == null) return null;
            if (prev <= 1) {
              if (logoutTimerRef.current) {
                clearInterval(logoutTimerRef.current);
                logoutTimerRef.current = null;
              }
              void (async () => {
                try {
                  const { error } = await supabase.auth.updateUser({ password });
                  if (error) throw error;
                  await performLogout();
                } catch (e: any) {
                  setSuccessText(null);
                  setErrorText(e?.message || "Failed to update password.");
                  setLogoutCountdown(null);
                }
              })();
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      }
    } catch (e: any) {
      setErrorText(e?.message || "Failed to update password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaWrapper usePadding edges={["top"]}>
      <ThemedView style={styles.container}>
        <View style={styles.header}>
          <Pressable
            style={styles.backButton}
            onPress={() =>
              router.replace(isResetMode ? "/(auth)/welcome" : "/(tabs)/settings")
            }
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="arrow-back" size={21} color="#15803D" />
          </Pressable>
          <ThemedText style={styles.headerTitle}>Change Password</ThemedText>
        </View>

        <View style={styles.content}>
        <View style={styles.formCard}>
          <View style={styles.passwordHelperRow}>
            <Ionicons
              name={meetsPasswordRule ? "checkmark-circle" : "information-circle"}
              size={14}
              color={meetsPasswordRule ? "#15803D" : "#9CA3AF"}
              style={styles.passwordHelperIcon}
            />
            <ThemedText
              style={[
                styles.passwordHelperText,
                meetsPasswordRule && styles.passwordHelperTextSuccess,
              ]}
            >
              Use at least 7 characters and include a number.
            </ThemedText>
          </View>

          {!isResetMode ? (
            <View
              style={[
                styles.inputGroup,
                currentFocused && styles.inputGroupFocused,
                errorText === "Please enter your current password." ||
                errorText === "Current password is incorrect."
                  ? styles.inputGroupError
                  : null,
              ]}
            >
              <TextInput
                style={styles.input}
                placeholder="Current Password"
                placeholderTextColor="#737373"
                value={currentPassword}
                onChangeText={(v) => {
                  setCurrentPassword(v);
                  if (errorText) setErrorText(null);
                }}
                secureTextEntry={!showCurrentPassword}
                autoCapitalize="none"
                autoCorrect={false}
                editable={!loading}
                maxLength={MAX_PASSWORD_LENGTH}
                onFocus={() => setCurrentFocused(true)}
                onBlur={() => setCurrentFocused(false)}
              />
              <View
                style={styles.eyeIcon}
                onTouchEnd={() => setShowCurrentPassword((prev) => !prev)}
              >
                <Ionicons
                  name={showCurrentPassword ? "eye-outline" : "eye-off-outline"}
                  size={20}
                  color="#15803D"
                />
              </View>
            </View>
          ) : null}

          <View
            style={[
              styles.inputGroup,
              passwordFocused && styles.inputGroupFocused,
              errorText && !password ? styles.inputGroupError : null,
            ]}
          >
            <TextInput
              style={styles.input}
              placeholder="Password"
              placeholderTextColor="#737373"
              value={password}
              onChangeText={(v) => {
                setPassword(v);
                if (errorText) setErrorText(null);
              }}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              autoCorrect={false}
              editable={!loading}
              maxLength={MAX_PASSWORD_LENGTH}
              onFocus={() => setPasswordFocused(true)}
              onBlur={() => setPasswordFocused(false)}
            />
            <View
              style={styles.eyeIcon}
              onTouchEnd={() => setShowPassword((prev) => !prev)}
            >
              <Ionicons
                name={showPassword ? "eye-outline" : "eye-off-outline"}
                size={20}
                color="#15803D"
              />
            </View>
          </View>

          <View
            style={[
              styles.inputGroup,
              confirmFocused && styles.inputGroupFocused,
              errorText === "Passwords do not match." && styles.inputGroupError,
            ]}
          >
            <TextInput
              style={styles.input}
              placeholder="Confirm Password"
              placeholderTextColor="#737373"
              value={confirmPassword}
              onChangeText={(v) => {
                setConfirmPassword(v);
                if (errorText) setErrorText(null);
              }}
              secureTextEntry={!showConfirmPassword}
              autoCapitalize="none"
              autoCorrect={false}
              editable={!loading}
              maxLength={MAX_PASSWORD_LENGTH}
              onFocus={() => setConfirmFocused(true)}
              onBlur={() => setConfirmFocused(false)}
            />
            <View
              style={styles.eyeIcon}
              onTouchEnd={() => setShowConfirmPassword((prev) => !prev)}
            >
              <Ionicons
                name={showConfirmPassword ? "eye-outline" : "eye-off-outline"}
                size={20}
                color="#15803D"
              />
            </View>
          </View>

          {errorText ? <ThemedText style={styles.errorText}>{errorText}</ThemedText> : null}

          {!successText ? (
            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handleChangePassword}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <ThemedText style={styles.buttonText}>Update Password</ThemedText>
              )}
            </TouchableOpacity>
          ) : null}

          {successText ? (
            <View
              style={[
                styles.successBanner,
                logoutCancelled ? styles.cancelBanner : null,
              ]}
            >
              <View style={styles.successRow}>
                <Ionicons
                  name={logoutCancelled ? "close-circle" : "checkmark-circle"}
                  size={16}
                  color={logoutCancelled ? "#B91C1C" : "#15803D"}
                  style={styles.successIcon}
                />
                <View style={styles.successTextWrap}>
                  <ThemedText
                    style={[
                      styles.successTextMain,
                      logoutCancelled ? styles.cancelTextMain : null,
                    ]}
                  >
                    {isResetMode
                      ? successText ?? "Password updated."
                      : logoutCancelled
                        ? "Password update cancelled."
                        : "Password update pending."}
                  </ThemedText>
                  {!isResetMode &&
                  !logoutCancelled &&
                  logoutCountdown != null &&
                  logoutCountdown > 0 ? (
                    <ThemedText style={styles.successTextSub}>
                      Updating and signing out in {logoutCountdown}s.
                    </ThemedText>
                  ) : null}
                </View>
              </View>
              {!isResetMode &&
              !logoutCancelled &&
              logoutCountdown != null &&
              logoutCountdown > 0 ? (
                <Pressable
                  style={styles.cancelCountdownBtn}
                  onPress={() => {
                    stopLogoutCountdown();
                    setLogoutCancelled(true);
                  }}
                >
                  <ThemedText style={styles.cancelCountdownText}>
                    Cancel password update
                  </ThemedText>
                </Pressable>
              ) : null}
            </View>
          ) : null}
        </View>
        </View>
      </ThemedView>
    </SafeAreaWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 18,
  },
  content: {
    flex: 1,
    justifyContent: "flex-start",
    paddingTop: 40,
    paddingBottom: 8,
  },
  header: {
    position: "relative",
    paddingTop: 13,
    paddingBottom: 16,
    paddingHorizontal: 2,
  },
  backButton: {
    position: "absolute",
    left: 0,
    top: 12,
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 2,
    elevation: 2,
  },
  headerTitle: {
    textAlign: "center",
    fontSize: 24,
    lineHeight: 32,
    color: "#15803D",
    fontFamily: "PlusJakartaSans_700Bold",
    fontWeight: "700",
    marginTop: 0,
  },
  formCard: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 16,
    backgroundColor: "#FFFFFF",
  },
  successBanner: {
    backgroundColor: "#ECFDF3",
    borderColor: "#A7F3D0",
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 9,
    marginTop: 10,
    alignItems: "center",
  },
  cancelBanner: {
    backgroundColor: "#FEF2F2",
    borderColor: "#FECACA",
  },
  successRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "center",
    width: "100%",
  },
  successIcon: {
    marginTop: 3,
  },
  successTextWrap: {
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 6,
  },
  successTextMain: {
    color: "#166534",
    fontSize: 13,
    fontWeight: "700",
    textAlign: "center",
  },
  successTextSub: {
    color: "#166534",
    fontSize: 12,
    fontWeight: "500",
    marginTop: 1,
    textAlign: "center",
  },
  cancelTextMain: {
    color: "#B91C1C",
  },
  cancelCountdownBtn: {
    alignSelf: "center",
    marginTop: 8,
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#BBF7D0",
  },
  cancelCountdownText: {
    color: "#166534",
    fontSize: 12,
    fontWeight: "600",
  },
  passwordHelperRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    marginLeft: 2,
  },
  passwordHelperIcon: {
    marginRight: 4,
  },
  passwordHelperText: {
    fontSize: 11,
    color: "#9CA3AF",
  },
  passwordHelperTextSuccess: {
    color: "#15803D",
  },
  inputGroup: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.92)",
    marginBottom: 10,
    paddingHorizontal: 12,
    height: 47,
  },
  inputGroupFocused: {
    borderColor: "#197C47",
  },
  inputGroupError: {
    borderColor: "#E57373",
  },
  input: {
    flex: 1,
    fontSize: 18,
    color: "#197C47",
    backgroundColor: "transparent",
  },
  eyeIcon: {
    padding: 4,
  },
  errorText: {
    color: "#B91C1C",
    fontSize: 12,
    marginTop: -2,
    marginBottom: 8,
    textAlign: "center",
  },
  button: {
    height: 48,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#197C47",
    marginTop: 4,
    shadowColor: "#197C47",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 4,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "700",
  },
});
