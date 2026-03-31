// app/(auth)/signup.tsx
import SafeAreaWrapper from "@/components/SafeAreaWrapper";
import { SimpleInfoModal } from "@/components/SimpleInfoModal";
import { useAuth } from "@/contexts/AuthContext";
import { useColorScheme } from "@/hooks/useColorScheme";
import {
  MAX_EMAIL_LENGTH,
  MAX_NAME_LENGTH,
  MAX_PASSWORD_LENGTH,
} from "@/utils/authFieldLimits";
import {
  isValidPersonName,
  sanitizePersonNameInput,
} from "@/utils/personNameInput";
import { Ionicons } from "@expo/vector-icons";
import * as Linking from "expo-linking";
import { router } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Easing,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const { width: screenWidth, height: screenHeight } = Dimensions.get("window");

const THEME_GREEN = "#197C47";
const THEME_LIGHT = "#fff";
const THEME_BORDER = "#E0E0E0";
const THEME_INPUT_BG = "rgba(255,255,255,0.92)";

function normalizeSignUpErrorMessage(message: string): string {
  const t = message.trim();
  const lower = t.toLowerCase();
  if (
    lower.includes("email rate limit") ||
    (lower.includes("rate limit") && lower.includes("email"))
  ) {
    return "Email rate limit exceeded. Try again later.";
  }
  if (lower.includes("rate limit")) {
    return "Too many attempts. Try again later.";
  }
  return t;
}

const ELLIPSIS_INACTIVE_OPACITY = 0.35;
const ELLIPSIS_ACTIVE_SCALE = 1;
const ELLIPSIS_INACTIVE_SCALE = 0.85;

function AnimatedThreeDots({ dotTextStyle }: { dotTextStyle: any }) {
  const opacity0 = useRef(new Animated.Value(ELLIPSIS_INACTIVE_OPACITY)).current;
  const opacity1 = useRef(new Animated.Value(ELLIPSIS_INACTIVE_OPACITY)).current;
  const opacity2 = useRef(new Animated.Value(ELLIPSIS_INACTIVE_OPACITY)).current;

  const scale0 = opacity0.interpolate({
    inputRange: [ELLIPSIS_INACTIVE_OPACITY, 1],
    outputRange: [ELLIPSIS_INACTIVE_SCALE, ELLIPSIS_ACTIVE_SCALE],
    extrapolate: "clamp",
  });
  const scale1 = opacity1.interpolate({
    inputRange: [ELLIPSIS_INACTIVE_OPACITY, 1],
    outputRange: [ELLIPSIS_INACTIVE_SCALE, ELLIPSIS_ACTIVE_SCALE],
    extrapolate: "clamp",
  });
  const scale2 = opacity2.interpolate({
    inputRange: [ELLIPSIS_INACTIVE_OPACITY, 1],
    outputRange: [ELLIPSIS_INACTIVE_SCALE, ELLIPSIS_ACTIVE_SCALE],
    extrapolate: "clamp",
  });

  useEffect(() => {
    const stepDurationMs = 180;
    const pauseMs = 70;

    const cycle = Animated.sequence([
      Animated.parallel([
        Animated.timing(opacity0, {
          toValue: 1,
          duration: stepDurationMs,
          easing: Easing.linear,
          useNativeDriver: false,
        }),
        Animated.timing(opacity1, {
          toValue: ELLIPSIS_INACTIVE_OPACITY,
          duration: stepDurationMs,
          easing: Easing.linear,
          useNativeDriver: false,
        }),
        Animated.timing(opacity2, {
          toValue: ELLIPSIS_INACTIVE_OPACITY,
          duration: stepDurationMs,
          easing: Easing.linear,
          useNativeDriver: false,
        }),
      ]),
      Animated.delay(pauseMs),
      Animated.parallel([
        Animated.timing(opacity0, {
          toValue: ELLIPSIS_INACTIVE_OPACITY,
          duration: stepDurationMs,
          easing: Easing.linear,
          useNativeDriver: false,
        }),
        Animated.timing(opacity1, {
          toValue: 1,
          duration: stepDurationMs,
          easing: Easing.linear,
          useNativeDriver: false,
        }),
        Animated.timing(opacity2, {
          toValue: ELLIPSIS_INACTIVE_OPACITY,
          duration: stepDurationMs,
          easing: Easing.linear,
          useNativeDriver: false,
        }),
      ]),
      Animated.delay(pauseMs),
      Animated.parallel([
        Animated.timing(opacity0, {
          toValue: ELLIPSIS_INACTIVE_OPACITY,
          duration: stepDurationMs,
          easing: Easing.linear,
          useNativeDriver: false,
        }),
        Animated.timing(opacity1, {
          toValue: ELLIPSIS_INACTIVE_OPACITY,
          duration: stepDurationMs,
          easing: Easing.linear,
          useNativeDriver: false,
        }),
        Animated.timing(opacity2, {
          toValue: 1,
          duration: stepDurationMs,
          easing: Easing.linear,
          useNativeDriver: false,
        }),
      ]),
      Animated.delay(pauseMs),
    ]);

    const loop = Animated.loop(cycle);
    loop.start();
    return () => loop.stop();
  }, [opacity0, opacity1, opacity2]);

  return (
    <View style={styles.loadingDotsContainer} accessibilityLabel="Loading">
      <Animated.Text
        style={[
          dotTextStyle,
          {
            marginHorizontal: 1,
            opacity: opacity0,
            transform: [{ scale: scale0 }],
          },
        ]}
      >
        .
      </Animated.Text>
      <Animated.Text
        style={[
          dotTextStyle,
          {
            marginHorizontal: 1,
            opacity: opacity1,
            transform: [{ scale: scale1 }],
          },
        ]}
      >
        .
      </Animated.Text>
      <Animated.Text
        style={[
          dotTextStyle,
          {
            marginHorizontal: 1,
            opacity: opacity2,
            transform: [{ scale: scale2 }],
          },
        ]}
      >
        .
      </Animated.Text>
    </View>
  );
}

export default function SignUpScreen() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const { signUp } = useAuth();
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const [firstNameFocused, setFirstNameFocused] = useState(false);
  const [lastNameFocused, setLastNameFocused] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [confirmPasswordFocused, setConfirmPasswordFocused] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [formAnim] = useState(new Animated.Value(0));
  const scrollRef = useRef<ScrollView>(null);
  const scrollYRef = useRef(0);
  const createAccountSectionRef = useRef<View>(null);
  const [keyboardInset, setKeyboardInset] = useState(0);
  const [formError, setFormError] = useState<string | null>(null);
  const [verifyEmailModalVisible, setVerifyEmailModalVisible] = useState(false);
  const formErrorAnim = useRef(new Animated.Value(0)).current;

  const clearError = (key: string) => {
    setErrors((prev) => {
      if (!prev[key] && !prev.form) return prev;
      const next = { ...prev };
      delete next[key];
      delete next.form;
      return next;
    });
    setFormError(null);
  };

  const dismissFormError = React.useCallback(() => {
    if (!formError) return;
    formErrorAnim.stopAnimation();
    Animated.timing(formErrorAnim, {
      toValue: 0,
      duration: 180,
      easing: Easing.in(Easing.cubic),
      useNativeDriver: false,
    }).start(({ finished }) => {
      if (finished) setFormError(null);
    });
  }, [formError, formErrorAnim]);

  useEffect(() => {
    formErrorAnim.stopAnimation();
    if (formError) {
      formErrorAnim.setValue(0);
      Animated.timing(formErrorAnim, {
        toValue: 1,
        duration: 220,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }).start();
      return;
    }
    formErrorAnim.setValue(0);
  }, [formError, formErrorAnim]);

  useEffect(() => {
    Animated.timing(formAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, []);

  useEffect(() => {
    const showEvent =
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvent =
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";
    const onShow = (e: { endCoordinates: { height: number } }) => {
      setKeyboardInset(e.endCoordinates.height);
    };
    const onHide = () => setKeyboardInset(0);
    const showSub = Keyboard.addListener(showEvent, onShow);
    const hideSub = Keyboard.addListener(hideEvent, onHide);
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const scrollLowerFieldsIntoView = useCallback(() => {
    const run = () => {
      const anchor = createAccountSectionRef.current;
      if (!anchor) return;
      const keyboardTop = screenHeight - keyboardInset;
      anchor.measureInWindow((_ax, ay, _aw, ah) => {
        const bottom = ay + ah;
        const clearance = keyboardTop - 20;
        const need = bottom - clearance;
        if (need > 0) {
          const nextY = scrollYRef.current + need;
          scrollRef.current?.scrollTo({
            y: Math.max(0, nextY),
            animated: true,
          });
        }
      });
    };
    requestAnimationFrame(() => {
      setTimeout(run, 60);
      setTimeout(run, 280);
    });
  }, [keyboardInset]);

  function validate(): { ok: boolean; summary: string } {
    const newErrors: { [key: string]: string } = {};
    if (!firstName.trim()) newErrors.firstName = "Please enter your first name.";
    else if (!isValidPersonName(firstName))
      newErrors.firstName = "Use only letters.";

    if (!lastName.trim()) newErrors.lastName = "Please enter your last name.";
    else if (!isValidPersonName(lastName))
      newErrors.lastName = "Use only letters.";

    if (!email.trim()) newErrors.email = "Please enter your email.";
    else if (!email.match(/^\S+@\S+\.\S+$/))
      newErrors.email = "Please enter a valid email.";

    if (!password) newErrors.password = "Please enter a password.";
    else if (password.length < 7 || !/\d/.test(password))
      newErrors.password =
        "Password must be at least 7 characters and include a number.";

    if (!confirmPassword) newErrors.confirmPassword = "Please confirm your password.";
    else if (password !== confirmPassword)
      newErrors.confirmPassword = "Passwords do not match.";

    if (!agreedToTerms) newErrors.terms = "You must agree to the terms.";
    setErrors(newErrors);
    const errorKeys = Object.keys(newErrors);
    const hasErrors = errorKeys.length > 0;

    let summary = "Fix the highlighted fields to continue.";
    if (newErrors.confirmPassword === "Passwords do not match.") {
      summary = "Passwords do not match.";
    } else if (
      (newErrors.firstName === "Use only letters." ||
        newErrors.lastName === "Use only letters.") &&
      errorKeys.length === 1
    ) {
      summary = "Names can only contain letters.";
    } else if (newErrors.email?.includes("valid email") && errorKeys.length === 1) {
      summary = "Enter a valid email address.";
    } else if (newErrors.password && errorKeys.length === 1) {
      summary = "Update your password to meet the requirements.";
    } else if (newErrors.terms && errorKeys.length === 1) {
      summary = "You must agree to the terms and privacy policy.";
    }

    return { ok: !hasErrors, summary };
  }

  const handleSignUp = async () => {
    const result = validate();
    if (!result.ok) {
      setFormError(result.summary);
      scrollRef.current?.scrollTo({ y: 0, animated: true });
      return;
    }

    setLoading(true);
    try {
      const { needsEmailVerification } = await signUp(
        email,
        password,
        `${firstName.trim()} ${lastName.trim()}`
      );

      const goToLogin = () => router.push("/(auth)/welcome?login=1");

      if (needsEmailVerification) {
        setVerifyEmailModalVisible(true);
      } else {
        goToLogin();
      }
    } catch (error: any) {
      const message = (error?.message ?? "").toString();
      const lower = message.toLowerCase();
      if (
        lower.includes("already registered") ||
        lower.includes("already exists") ||
        lower.includes("duplicate key") ||
        lower.includes("user already") ||
        (lower.includes("email") && lower.includes("exists"))
      ) {
        setFormError(
          "An account with this email already exists. Try signing in instead."
        );
      } else if (message) {
        setFormError(normalizeSignUpErrorMessage(message));
      } else {
        setFormError("Sign-up failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaWrapper usePadding edges={["top"]}>
      <View style={{ flex: 1, backgroundColor: "#fff" }}>
        {/* Signup Card with Glassmorphism, slides with keyboard */}
        <KeyboardAvoidingView
          style={{ flex: 1, width: "100%" }}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          keyboardVerticalOffset={
            Platform.OS === "ios" ? insets.top + 48 : 0
          }
        >
          <ScrollView
            contentContainerStyle={{
              flexGrow: 1,
              justifyContent: "flex-start",
              alignItems: "center",
              marginTop: 10,
              paddingBottom: keyboardInset > 0 ? keyboardInset + 28 : 28,
            }}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
            ref={scrollRef}
            scrollEventThrottle={16}
            onScroll={(e) => {
              scrollYRef.current = e.nativeEvent.contentOffset.y;
            }}
          >
            <View style={{ width: "100%", alignItems: "center" }}>
              <View
                style={{
                  width: 340,
                  maxWidth: "92%",
                  alignItems: "center",
                  marginTop: 10,
                  marginBottom: 24,
                }}
              >
                <Animated.Image
                  source={require("../../assets/images/launchpng.png")}
                  style={{
                    width: 150,
                    height: 150,
                    borderRadius: 16,
                    marginBottom: 4,
                  }}
                  resizeMode="contain"
                  accessible
                  accessibilityLabel="FridgeWise logo"
                />
                <Text
                  style={[
                    styles.heading,
                    {
                      fontSize: 18,
                      marginBottom: 18,
                      marginTop: 0,
                      alignSelf: "center",
                      width: "100%",
                      textAlign: "center",
                      backgroundColor: "transparent",
                    },
                  ]}
                >
                  Create your FridgeWise account
                </Text>
                <View style={styles.form}>
                  {/* First Name Field */}
                  <View
                    style={[
                      styles.inputGroup,
                      firstNameFocused && styles.inputGroupFocused,
                      errors.firstName && styles.inputGroupError,
                    ]}
                  >
                    <TextInput
                      style={styles.input}
                      placeholder="First Name"
                      placeholderTextColor="#737373"
                      value={firstName}
                        onChangeText={(t) => {
                          const s = sanitizePersonNameInput(t).slice(
                            0,
                            MAX_NAME_LENGTH
                          );
                          setFirstName(s);
                          clearError("firstName");
                        }}
                      autoCapitalize="words"
                        autoCorrect={false}
                        autoComplete="off"
                      editable={!loading}
                      maxLength={MAX_NAME_LENGTH}
                      accessibilityLabel="First name input"
                      onFocus={() => setFirstNameFocused(true)}
                        onBlur={() => {
                          setFirstNameFocused(false);
                          setFirstName((s) => sanitizePersonNameInput(s).trim());
                        }}
                    />
                  </View>

                  {/* Last Name Field */}
                  <View
                    style={[
                      styles.inputGroup,
                      lastNameFocused && styles.inputGroupFocused,
                      errors.lastName && styles.inputGroupError,
                    ]}
                  >
                    <TextInput
                      style={styles.input}
                      placeholder="Last Name"
                      placeholderTextColor="#737373"
                      value={lastName}
                      onChangeText={(t) => {
                        const s = sanitizePersonNameInput(t).slice(
                          0,
                          MAX_NAME_LENGTH
                        );
                        setLastName(s);
                        clearError("lastName");
                      }}
                      autoCapitalize="words"
                      autoCorrect={false}
                      autoComplete="off"
                      editable={!loading}
                      maxLength={MAX_NAME_LENGTH}
                      accessibilityLabel="Last name input"
                      onFocus={() => setLastNameFocused(true)}
                      onBlur={() => {
                        setLastNameFocused(false);
                        setLastName((s) => sanitizePersonNameInput(s).trim());
                      }}
                    />
                  </View>

                  {/* Email Field */}
                  <View
                    style={[
                      styles.inputGroup,
                      emailFocused && styles.inputGroupFocused,
                      errors.email && styles.inputGroupError,
                    ]}
                  >
                    <TextInput
                      style={styles.input}
                      placeholder="Email"
                      placeholderTextColor="#737373"
                      value={email}
                      onChangeText={(t) => {
                        setEmail(t);
                        clearError("email");
                      }}
                      autoCapitalize="none"
                      keyboardType="email-address"
                      autoCorrect={false}
                      autoComplete="off"
                      editable={!loading}
                      maxLength={MAX_EMAIL_LENGTH}
                      accessibilityLabel="Email input"
                      onFocus={() => setEmailFocused(true)}
                      onBlur={() => setEmailFocused(false)}
                    />
                  </View>

                  {/* Password Field */}
                  <View style={{ marginBottom: 6 }}>
                    <View style={styles.passwordHelperRow}>
                      <Ionicons
                        name={
                          password.length >= 7 && /\d/.test(password)
                            ? "checkmark-circle"
                            : "information-circle"
                        }
                        size={14}
                        color={
                          password.length >= 7 && /\d/.test(password)
                            ? "#15803D"
                            : "#9CA3AF"
                        }
                        style={{ marginRight: 4 }}
                      />
                      <Text
                        style={[
                          styles.passwordHelperText,
                          password.length >= 7 && /\d/.test(password) && {
                            color: "#15803D",
                          },
                        ]}
                      >
                        Use at least 7 characters and include a number.
                      </Text>
                    </View>
                    <View
                      style={[
                        styles.inputGroup,
                        passwordFocused && styles.inputGroupFocused,
                        errors.password && styles.inputGroupError,
                      ]}
                    >
                      <TextInput
                        style={styles.input}
                        placeholder="Password"
                        placeholderTextColor="#737373"
                        value={password}
                        onChangeText={(t) => {
                          setPassword(t);
                          clearError("password");
                        }}
                        secureTextEntry={!showPassword}
                        editable={!loading}
                        maxLength={MAX_PASSWORD_LENGTH}
                        autoCapitalize="none"
                        autoCorrect={false}
                        autoComplete="off"
                        accessibilityLabel="Password input"
                        onFocus={() => {
                          setPasswordFocused(true);
                          scrollLowerFieldsIntoView();
                        }}
                        onBlur={() => setPasswordFocused(false)}
                      />
                      <View
                        style={styles.eyeIcon}
                        onTouchEnd={() => setShowPassword(!showPassword)}
                        accessibilityLabel={
                          showPassword ? "Hide password" : "Show password"
                        }
                      >
                        <Ionicons
                          name={showPassword ? "eye-outline" : "eye-off-outline"}
                          size={20}
                          color={THEME_GREEN}
                        />
                      </View>
                    </View>
                  </View>

                  {/* Confirm Password Field */}
                  <View style={{ marginBottom: errors.confirmPassword ? 6 : 12 }}>
                    <View
                      style={[
                        styles.inputGroup,
                        confirmPasswordFocused && styles.inputGroupFocused,
                        errors.confirmPassword && styles.inputGroupError,
                      ]}
                    >
                      <TextInput
                        style={styles.input}
                        placeholder="Confirm Password"
                        placeholderTextColor="#737373"
                        value={confirmPassword}
                        onChangeText={(t) => {
                          setConfirmPassword(t);
                          clearError("confirmPassword");
                        }}
                        secureTextEntry={!showConfirmPassword}
                        editable={!loading}
                        maxLength={MAX_PASSWORD_LENGTH}
                        autoCapitalize="none"
                        autoCorrect={false}
                        autoComplete="off"
                        accessibilityLabel="Confirm password input"
                        onFocus={() => {
                          setConfirmPasswordFocused(true);
                          scrollLowerFieldsIntoView();
                        }}
                        onBlur={() => setConfirmPasswordFocused(false)}
                      />
                      <View
                        style={styles.eyeIcon}
                        onTouchEnd={() =>
                          setShowConfirmPassword(!showConfirmPassword)
                        }
                        accessibilityLabel={
                          showConfirmPassword
                            ? "Hide confirm password"
                            : "Show confirm password"
                        }
                      >
                        <Ionicons
                          name={
                            showConfirmPassword
                              ? "eye-outline"
                              : "eye-off-outline"
                          }
                          size={20}
                          color={THEME_GREEN}
                        />
                      </View>
                    </View>
                  </View>

                  {/* Terms and Conditions */}
                  <View style={styles.termsContainer}>
                    <TouchableOpacity
                      style={styles.checkboxTouchable}
                      onPress={() => setAgreedToTerms(!agreedToTerms)}
                      testID="terms-switch"
                    >
                      <View
                        style={[
                          styles.checkbox,
                          agreedToTerms && styles.checkboxChecked,
                        ]}
                      >
                        {agreedToTerms && (
                          <Ionicons name="checkmark" size={12} color="#fff" />
                        )}
                      </View>
                    </TouchableOpacity>
                    <View style={styles.termsTextContainer}>
                      <Text style={styles.termsText}>
                        I agree to the{" "}
                        <Text style={styles.termsLink}>
                          Terms and Conditions
                        </Text>{" "}
                        and{" "}
                        <Text style={styles.termsLink}>Privacy Policy</Text>
                      </Text>
                    </View>
                  </View>
                  {!!formError && (
                    <Animated.View
                      style={[
                        styles.formErrorToast,
                        {
                          opacity: formErrorAnim,
                          maxHeight: formErrorAnim.interpolate({
                            inputRange: [0, 1],
                            outputRange: [0, 80],
                          }),
                          marginBottom: formErrorAnim.interpolate({
                            inputRange: [0, 1],
                            outputRange: [0, 10],
                          }),
                          paddingVertical: formErrorAnim.interpolate({
                            inputRange: [0, 1],
                            outputRange: [0, 10],
                          }),
                          paddingHorizontal: formErrorAnim.interpolate({
                            inputRange: [0, 1],
                            outputRange: [0, 12],
                          }),
                          transform: [
                            {
                              translateY: formErrorAnim.interpolate({
                                inputRange: [0, 1],
                                outputRange: [-4, 0],
                              }),
                            },
                          ],
                        },
                      ]}
                      accessibilityRole="alert"
                      accessible
                    >
                      <Ionicons
                        name="alert-circle"
                        size={18}
                        color="#B91C1C"
                        style={{ marginRight: 10, marginTop: 1 }}
                      />
                      <Text style={styles.formErrorToastText}>{formError}</Text>
                      <TouchableOpacity
                        style={styles.formErrorToastClose}
                        onPress={dismissFormError}
                        accessibilityLabel="Dismiss message"
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      >
                        <Ionicons name="close" size={16} color="#7F1D1D" />
                      </TouchableOpacity>
                    </Animated.View>
                  )}

                  {/* Sign Up Button */}
                  <View ref={createAccountSectionRef} collapsable={false}>
                    <TouchableOpacity
                      style={[styles.button, loading && styles.buttonDisabled]}
                      onPress={loading ? undefined : handleSignUp}
                      testID="signup-button"
                      accessibilityRole="button"
                      accessibilityLabel="Sign up"
                      disabled={loading}
                    >
                      {loading ? (
                        <View style={styles.loadingRow}>
                          <Text style={styles.buttonText}>
                            Creating Account
                          </Text>
                          <AnimatedThreeDots dotTextStyle={styles.buttonText} />
                        </View>
                      ) : (
                        <Text style={styles.buttonText}>Create Account</Text>
                      )}
                    </TouchableOpacity>
                  </View>

                  <TouchableOpacity
                    style={styles.contactSupportPill}
                    accessibilityRole="link"
                    accessibilityLabel="Contact support by email"
                    activeOpacity={0.75}
                    onPress={() =>
                      void Linking.openURL("mailto:fridgewise.app@gmail.com")
                    }
                  >
                    <Text style={styles.contactSupportText}>
                      Contact support
                    </Text>
                  </TouchableOpacity>

                  {/* Toggle to Login */}
                  <View style={styles.toggleContainer}>
                    <Text style={styles.toggleText}>
                      Already have an account?{" "}
                    </Text>
                    <Text
                      style={styles.toggleLink}
                      onPress={() => router.replace("/(auth)/welcome?login=1")}
                    >
                      Sign in
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </View>
      <SimpleInfoModal
        visible={verifyEmailModalVisible}
        title="Verify your email"
        message="We sent a confirmation link to your inbox. Please verify your email before signing in."
        onDismiss={() => {
          setVerifyEmailModalVisible(false);
          router.push("/(auth)/welcome?login=1");
        }}
      />
    </SafeAreaWrapper>
  );
}

const styles = StyleSheet.create({
  bgLight: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: THEME_LIGHT,
  },
  card: {
    width: "90%",
    maxWidth: 400,
    backgroundColor: THEME_LIGHT,
    borderRadius: 24,
    padding: 28,
    shadowColor: "#197C47",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 24,
    elevation: 8,
    alignItems: "center",
    marginTop: 8,
  },
  heading: {
    fontSize: 24,
    fontWeight: "700",
    color: THEME_GREEN,
    marginBottom: 24,
    textAlign: "center",
    fontFamily: "System",
  },
  form: {
    width: "100%",
    marginBottom: 12,
  },
  inputGroup: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: THEME_BORDER,
    borderRadius: 12,
    backgroundColor: THEME_INPUT_BG,
    marginBottom: 16,
    paddingHorizontal: 12,
    height: 47,
    position: "relative",
  },
  inputGroupFocused: {
    borderColor: THEME_GREEN,
    backgroundColor: THEME_INPUT_BG,
  },
  inputGroupError: {
    borderColor: "#e57373",
    shadowColor: "#e57373",
    shadowOpacity: 0.12,
    shadowRadius: 8,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: THEME_GREEN,
    fontFamily: "System",
    backgroundColor: "transparent",
  },
  eyeIcon: {
    padding: 4,
  },
  button: {
    backgroundColor: THEME_GREEN,
    borderRadius: 32,
    height: 48,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
    shadowColor: THEME_GREEN,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 6,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
  },
  loadingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  loadingDotsContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginLeft: 6,
  },
  contactSupportPill: {
    alignSelf: "center",
    marginTop: 4,
    marginBottom: 6,
    paddingHorizontal: 18,
    paddingVertical: 9,
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: "rgba(25, 124, 71, 0.45)",
    backgroundColor: "rgba(25, 124, 71, 0.06)",
  },
  contactSupportText: {
    color: THEME_GREEN,
    fontSize: 13,
    fontWeight: "600",
    letterSpacing: 0.2,
  },
  termsContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginTop: 5,
    marginBottom: 20,
  },
  checkbox: {
    width: 16,
    height: 16,
    borderWidth: 1.5,
    borderColor: "#197C47",
    borderRadius: 4,
    marginRight: 10,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
  },
  checkboxChecked: {
    backgroundColor: "#197C47",
    borderColor: "#197C47",
  },
  termsTextContainer: {
    flex: 1,
    flexDirection: "row",
    flexWrap: "wrap",
  },
  termsText: {
    fontSize: 14,
    color: "#b0bfc7",
    lineHeight: 20,
  },
  termsLink: {
    fontSize: 14,
    color: THEME_GREEN,
    lineHeight: 20,
    fontWeight: "700",
    textDecorationLine: "underline",
  },
  toggleContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 10,
  },
  toggleText: {
    fontSize: 14,
    color: "#b0bfc7",
    marginRight: 4,
  },
  toggleLink: {
    fontSize: 14,
    color: THEME_GREEN,
    fontWeight: "700",
    textDecorationLine: "underline",
  },
  passwordHelperRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
    marginLeft: 4,
  },
  passwordHelperText: {
    fontSize: 11,
    color: "#9CA3AF",
  },
  checkboxTouchable: {
    padding: 8,
    marginRight: 0,
    borderRadius: 8,
  },
  formErrorToast: {
    flexDirection: "row",
    alignItems: "flex-start",
    borderRadius: 12,
    backgroundColor: "rgba(185,28,28,0.08)",
    borderWidth: 1,
    borderColor: "rgba(185,28,28,0.22)",
    overflow: "hidden",
  },
  formErrorToastText: {
    flex: 1,
    color: "#7F1D1D",
    fontSize: 13,
    fontWeight: "600",
    lineHeight: 18,
  },
  formErrorToastClose: {
    marginLeft: 10,
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.65)",
    borderWidth: 1,
    borderColor: "rgba(185,28,28,0.18)",
  },
});
