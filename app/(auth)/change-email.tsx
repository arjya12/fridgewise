import SafeAreaWrapper from "@/components/SafeAreaWrapper";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { MAX_EMAIL_LENGTH } from "@/utils/authFieldLimits";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
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

export default function ChangeEmailScreen() {
  const { user } = useAuth();
  const [currentEmail, setCurrentEmail] = useState("");
  const [email, setEmail] = useState("");
  const [currentFocused, setCurrentFocused] = useState(false);
  const [focused, setFocused] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorText, setErrorText] = useState<string | null>(null);
  const [successText, setSuccessText] = useState<string | null>(null);
  const [updateCountdown, setUpdateCountdown] = useState<number | null>(null);
  const [updateCancelled, setUpdateCancelled] = useState(false);
  const [updateCompleted, setUpdateCompleted] = useState(false);
  const updateTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const bannerTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (updateTimerRef.current) clearInterval(updateTimerRef.current);
      if (bannerTimerRef.current) clearTimeout(bannerTimerRef.current);
    };
  }, []);

  useEffect(() => {
    if (!successText) return;
    if (!updateCancelled && !updateCompleted) return;
    if (bannerTimerRef.current) clearTimeout(bannerTimerRef.current);
    bannerTimerRef.current = setTimeout(() => {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setSuccessText(null);
      setUpdateCancelled(false);
      setUpdateCompleted(false);
    }, 3500);
    return () => {
      if (bannerTimerRef.current) clearTimeout(bannerTimerRef.current);
    };
  }, [successText, updateCancelled, updateCompleted]);

  const stopUpdateCountdown = () => {
    if (updateTimerRef.current) {
      clearInterval(updateTimerRef.current);
      updateTimerRef.current = null;
    }
    setUpdateCountdown(null);
  };

  const validate = (): boolean => {
    const currentValue = currentEmail.trim().toLowerCase();
    const value = email.trim();
    const signedInEmail = (user?.email ?? "").trim().toLowerCase();
    if (!currentValue) {
      setErrorText("Please confirm your current email.");
      return false;
    }
    if (!signedInEmail || currentValue !== signedInEmail) {
      setErrorText("Current email does not match your account.");
      return false;
    }
    if (!value) {
      setErrorText("Please enter a new email.");
      return false;
    }
    if (!/^\S+@\S+\.\S+$/.test(value)) {
      setErrorText("Please enter a valid email.");
      return false;
    }
    if (value.toLowerCase() === signedInEmail) {
      setErrorText("New email must be different from current email.");
      return false;
    }
    setErrorText(null);
    return true;
  };

  const handleChangeEmail = async () => {
    if (!validate()) return;
    try {
      setLoading(true);
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setSuccessText("Email update pending.");
      setUpdateCancelled(false);
      setUpdateCompleted(false);
      setUpdateCountdown(5);
      setErrorText(null);

      if (updateTimerRef.current) clearInterval(updateTimerRef.current);
      updateTimerRef.current = setInterval(() => {
        setUpdateCountdown((prev) => {
          if (prev == null) return null;
          if (prev <= 1) {
            if (updateTimerRef.current) {
              clearInterval(updateTimerRef.current);
              updateTimerRef.current = null;
            }
            void (async () => {
              try {
                const { error } = await supabase.auth.updateUser({ email: email.trim() });
                if (error) throw error;
                setSuccessText("Email update requested. Check your inbox to confirm.");
                setUpdateCompleted(true);
                setUpdateCountdown(null);
              } catch (e: any) {
                setSuccessText(null);
                setErrorText(e?.message || "Failed to update email.");
                setUpdateCountdown(null);
              }
            })();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (e: any) {
      setErrorText(e?.message || "Failed to update email.");
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
            onPress={() => router.replace("/(tabs)/settings")}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="arrow-back" size={21} color="#15803D" />
          </Pressable>
          <ThemedText style={styles.headerTitle}>Change Email</ThemedText>
        </View>

        <View style={styles.content}>
        <View style={styles.formCard}>
          <View style={styles.helperRow}>
            <Ionicons
              name={/^\S+@\S+\.\S+$/.test(email.trim()) ? "checkmark-circle" : "information-circle"}
              size={14}
              color={/^\S+@\S+\.\S+$/.test(email.trim()) ? "#15803D" : "#9CA3AF"}
              style={styles.helperIcon}
            />
            <ThemedText
              style={[
                styles.helperText,
                /^\S+@\S+\.\S+$/.test(email.trim()) && styles.helperTextSuccess,
              ]}
            >
              Enter a valid email address.
            </ThemedText>
          </View>

          <View
            style={[
              styles.inputGroup,
              currentFocused && styles.inputGroupFocused,
              errorText === "Please confirm your current email." ||
              errorText === "Current email does not match your account."
                ? styles.inputGroupError
                : null,
            ]}
          >
            <TextInput
              style={styles.input}
              placeholder="Current Email"
              placeholderTextColor="#737373"
              value={currentEmail}
              onChangeText={(v) => {
                setCurrentEmail(v);
                if (errorText) setErrorText(null);
              }}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              editable={!loading}
              maxLength={MAX_EMAIL_LENGTH}
              onFocus={() => setCurrentFocused(true)}
              onBlur={() => setCurrentFocused(false)}
            />
          </View>

          <View style={[styles.inputGroup, focused && styles.inputGroupFocused]}>
            <TextInput
              style={styles.input}
              placeholder="New Email"
              placeholderTextColor="#737373"
              value={email}
              onChangeText={(v) => {
                setEmail(v);
                if (errorText) setErrorText(null);
              }}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              editable={!loading}
              maxLength={MAX_EMAIL_LENGTH}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
            />
          </View>

          {errorText ? <ThemedText style={styles.errorText}>{errorText}</ThemedText> : null}

          {!successText ? (
            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handleChangeEmail}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <ThemedText style={styles.buttonText}>Update Email</ThemedText>
              )}
            </TouchableOpacity>
          ) : null}

          {successText ? (
            <View style={[styles.successBanner, updateCancelled ? styles.cancelBanner : null]}>
              <View style={styles.successRow}>
                <Ionicons
                  name={
                    updateCancelled
                      ? "close-circle"
                      : updateCompleted
                        ? "checkmark-circle"
                        : "time-outline"
                  }
                  size={16}
                  color={updateCancelled ? "#B91C1C" : "#15803D"}
                  style={styles.successIcon}
                />
                <View style={styles.successTextWrap}>
                  <ThemedText style={[styles.successTextMain, updateCancelled ? styles.cancelTextMain : null]}>
                    {updateCancelled
                      ? "Email update cancelled."
                      : updateCompleted
                        ? "Email update requested."
                        : "Email update pending."}
                  </ThemedText>
                  {!updateCancelled && !updateCompleted && updateCountdown != null && updateCountdown > 0 ? (
                    <ThemedText style={styles.successTextSub}>
                      Updating in {updateCountdown}s.
                    </ThemedText>
                  ) : updateCompleted ? (
                    <ThemedText style={styles.successTextSub}>
                      Check your inbox to confirm.
                    </ThemedText>
                  ) : null}
                </View>
              </View>

              {!updateCancelled && !updateCompleted && updateCountdown != null && updateCountdown > 0 ? (
                <Pressable
                  style={styles.cancelCountdownBtn}
                  onPress={() => {
                    stopUpdateCountdown();
                    setUpdateCancelled(true);
                  }}
                >
                  <ThemedText style={styles.cancelCountdownText}>
                    Cancel email update
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
  helperRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    marginLeft: 2,
  },
  helperIcon: {
    marginRight: 4,
  },
  helperText: {
    fontSize: 11,
    color: "#9CA3AF",
  },
  helperTextSuccess: {
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
  errorText: {
    color: "#B91C1C",
    fontSize: 12,
    marginTop: -2,
    marginBottom: 8,
    marginLeft: 2,
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
