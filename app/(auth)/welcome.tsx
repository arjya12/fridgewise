import ScreenLayout from "@/components/ScreenLayout";
import { OfflineNoticeModal } from "@/components/OfflineNoticeModal";
import { SimpleInfoModal } from "@/components/SimpleInfoModal";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { MAX_EMAIL_LENGTH, MAX_PASSWORD_LENGTH } from "@/utils/authFieldLimits";
import { isNetworkRequestFailed } from "@/utils/networkError";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as Linking from "expo-linking";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Easing,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Svg, { Circle, Path } from "react-native-svg";

const { width, height: screenHeight } = Dimensions.get("window");

export default function WelcomeScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { signIn } = useAuth();
  const [showLogin, setShowLogin] = useState(false);
  const [loginSheetVisible, setLoginSheetVisible] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const slideAnim = useRef(new Animated.Value(0)).current;
  const welcomeAnim = useRef(new Animated.Value(1)).current;
  const waveAnim = useRef(new Animated.Value(0)).current;
  const logoAnim = useRef(new Animated.Value(1)).current;
  const loginButtonAnim = useRef(new Animated.Value(1)).current;
  const suppressLoginParamOpen = useRef(false);
  const [loginError, setLoginError] = useState<{
    kind: "validation" | "auth" | "unknown" | "info";
    message: string;
  } | null>(null);
  const loginErrorAnim = useRef(new Animated.Value(0)).current;
  const [isResetMode, setIsResetMode] = useState(false);
  const [resetCooldownSeconds, setResetCooldownSeconds] = useState(0);
  const [resetEmailModalVisible, setResetEmailModalVisible] = useState(false);
  const [offlineNoticeVisible, setOfflineNoticeVisible] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  // 60-second cooldown timer after requesting password reset
  useEffect(() => {
    if (resetCooldownSeconds <= 0) return;
    const id = setInterval(() => {
      setResetCooldownSeconds((s) => Math.max(0, s - 1));
    }, 1000);
    return () => clearInterval(id);
  }, [resetCooldownSeconds]);

  // Open login modal once when ?login=1 (don’t re-open after user dismisses with X)
  useEffect(() => {
    if (params?.login !== "1") {
      suppressLoginParamOpen.current = false;
      return;
    }
    if (suppressLoginParamOpen.current || loginSheetVisible) return;
    handleLogin();
  }, [params?.login, loginSheetVisible]);

  function handleCreateAccount() {
    router.replace("/(auth)/signup");
  }
  function handleLogin() {
    setShowLogin(true);
    setLoginSheetVisible(true);
    loginButtonAnim.setValue(0);
    Animated.parallel([
      Animated.timing(welcomeAnim, {
        toValue: 0.85,
        duration: 500,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 1,
        duration: 500,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(waveAnim, {
        toValue: 1,
        duration: 500,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(logoAnim, {
        toValue: 0.7,
        duration: 500,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }
  function handleCloseLogin() {
    if (params?.login === "1") {
      suppressLoginParamOpen.current = true;
    }

    setShowLogin(false);
    welcomeAnim.setValue(1);
    loginButtonAnim.setValue(1);

    slideAnim.stopAnimation();
    waveAnim.stopAnimation();
    logoAnim.stopAnimation();

    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: 2,
        duration: 280,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(waveAnim, {
        toValue: 0,
        duration: 280,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(logoAnim, {
        toValue: 1,
        duration: 280,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start(({ finished }) => {
      if (!finished) return;
      slideAnim.setValue(0);
      setLoginSheetVisible(false);
    });

    setLoginError(null);
    setEmail("");
    setPassword("");
    setShowPassword(false);
    setEmailFocused(false);
    setPasswordFocused(false);
    setIsResetMode(false);
    setResetCooldownSeconds(0);
  }
  const dismissLoginError = React.useCallback(() => {
    if (!loginError) return;
    loginErrorAnim.stopAnimation();
    Animated.timing(loginErrorAnim, {
      toValue: 0,
      duration: 180,
      easing: Easing.in(Easing.cubic),
      useNativeDriver: false,
    }).start(({ finished }) => {
      if (finished) setLoginError(null);
    });
  }, [loginError, loginErrorAnim]);
  async function handleSignIn() {
    if (isResetMode) {
      setLoading(true);
      try {
        await handleForgotPassword();
      } finally {
        setLoading(false);
      }
      return;
    }

    if (!email || !password) {
      setLoginError({
        kind: "validation",
        message: "Please enter your email and password to sign in.",
      });
      return;
    }
    setLoading(true);
    try {
      await signIn(email, password, { rememberMe });
      router.replace("/(tabs)");
    } catch (error) {
      if (isNetworkRequestFailed(error)) {
        setLoginError(null);
        setOfflineNoticeVisible(true);
        return;
      }
      setLoginError({
        kind: "auth",
        message: "That email or password doesn’t match. Try again.",
      });
    } finally {
      setLoading(false);
    }
  }

  async function handleForgotPassword() {
    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setLoginError({
        kind: "validation",
        message: "Enter your email address to reset your password.",
      });
      return;
    }
    try {
      // Supabase recovery links often return tokens in the URL fragment (`#...`).
      // Android custom-scheme deep links can drop fragments, so prefer the relay page
      // when available (it re-opens the app with tokens in query params).
      const resetRelayUrl = process.env.EXPO_PUBLIC_RESET_WEB_REDIRECT_URL;
      const resetRedirectUrl =
        resetRelayUrl ||
        process.env.EXPO_PUBLIC_RESET_REDIRECT_URL ||
        "fridgewise://reset-password";

      const { error } = await supabase.auth.resetPasswordForEmail(trimmedEmail, {
        redirectTo: resetRedirectUrl,
      });
      if (error) throw error;

      setLoginError(null);
      setResetCooldownSeconds(60);
      // Open after interactions so the loading state clears and the RN Modal stacks above the sheet.
      requestAnimationFrame(() => {
        setResetEmailModalVisible(true);
      });
    } catch (err: any) {
      if (isNetworkRequestFailed(err)) {
        setLoginError(null);
        setOfflineNoticeVisible(true);
        return;
      }

      const msg = err?.message || "";
      const isRateLimit = /rate limit|limit reached|too many requests/i.test(msg);
      const isUserNotFound = /user.*not.*found|email.*not.*registered/i.test(msg);
      const isRedirectNotAllowed =
        /redirect|redirectTo|not.*allowed|url.*not.*allowed|allowed redirect/i.test(msg);
      if (isUserNotFound) {
        setLoginError({
          kind: "auth",
          message: "We couldn’t find an account with that email.",
        });
      } else if (isRateLimit) {
        setLoginError({
          kind: "info",
          message: "Too many reset emails. Please wait a minute before trying again.",
        });
        setResetCooldownSeconds(60);
      } else if (isRedirectNotAllowed) {
        setLoginError({
          kind: "auth",
          message:
            "Reset email couldn’t be sent because the redirect URL isn’t allowed in Supabase. Add your app link to Auth → URL Configuration → Redirect URLs.",
        });
      } else {
        setLoginError({
          kind: "auth",
          message:
            msg ||
            "We couldn’t send a reset email right now. Please try again.",
        });
      }
    }
  }

  // Slide the modal down from the login button (approx 350px from top)
  const { width: screenWidth } = Dimensions.get("window");
  const modalWidth = 300;
  const slideDown: any = {
    top: screenHeight * 0.5 - 20,
    left: screenWidth * 0.5,
    width: modalWidth,
    transform: [
      { translateX: -modalWidth / 2 },
      {
        translateY: slideAnim.interpolate({
          inputRange: [0, 1, 2],
          outputRange: [350, -165, 350],
        }),
      },
    ],
    opacity: slideAnim.interpolate({
      inputRange: [0, 1, 2],
      outputRange: [0, 1, 0],
    }),
  };

  // Shrink and fade out Welcome content
  const welcomeScale = {
    transform: [{ scale: welcomeAnim }],
    opacity: welcomeAnim.interpolate({
      inputRange: [0.85, 1],
      outputRange: [0.5, 1],
    }),
  };

  // Animate wave up (move higher)
  const waveTranslate: any = {
    transform: [
      {
        translateY: waveAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [0, -120],
        }),
      },
    ],
  };

  // Animate logo smaller and much higher
  const logoAnimatedStyle: any = {
    transform: [
      { scale: logoAnim },
      {
        translateY: logoAnim.interpolate({
          inputRange: [0.7, 1],
          outputRange: [-90, 0],
        }),
      },
    ],
  };

  // Animated dots for signing in
  function SigningInDots() {
    const dot1 = React.useRef(new Animated.Value(0)).current;
    const dot2 = React.useRef(new Animated.Value(0)).current;
    const dot3 = React.useRef(new Animated.Value(0)).current;

    useEffect(() => {
      const animate = () => {
        Animated.sequence([
          Animated.timing(dot1, {
            toValue: 1,
            duration: 250,
            useNativeDriver: true,
          }),
          Animated.timing(dot2, {
            toValue: 1,
            duration: 250,
            useNativeDriver: true,
          }),
          Animated.timing(dot3, {
            toValue: 1,
            duration: 250,
            useNativeDriver: true,
          }),
        ]).start(() => {
          dot1.setValue(0);
          dot2.setValue(0);
          dot3.setValue(0);
          animate();
        });
      };
      animate();
      return () => {
        dot1.stopAnimation();
        dot2.stopAnimation();
        dot3.stopAnimation();
      };
    }, [dot1, dot2, dot3]);

    return (
      <View
        style={{ flexDirection: "row", alignItems: "center", marginLeft: 6 }}
      >
        <Animated.View
          style={{
            opacity: dot1,
            transform: [
              {
                scale: dot1.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.7, 1.2],
                }),
              },
            ],
            marginHorizontal: 1.5,
            width: 7,
            height: 7,
            borderRadius: 4,
            backgroundColor: "#fff",
          }}
        />
        <Animated.View
          style={{
            opacity: dot2,
            transform: [
              {
                scale: dot2.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.7, 1.2],
                }),
              },
            ],
            marginHorizontal: 1.5,
            width: 7,
            height: 7,
            borderRadius: 4,
            backgroundColor: "#fff",
          }}
        />
        <Animated.View
          style={{
            opacity: dot3,
            transform: [
              {
                scale: dot3.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.7, 1.2],
                }),
              },
            ],
            marginHorizontal: 1.5,
            width: 7,
            height: 7,
            borderRadius: 4,
            backgroundColor: "#fff",
          }}
        />
      </View>
    );
  }

  useEffect(() => {
    loginErrorAnim.stopAnimation();
    if (loginError) {
      loginErrorAnim.setValue(0);
      Animated.timing(loginErrorAnim, {
        toValue: 1,
        duration: 220,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }).start();
      return;
    }
    loginErrorAnim.setValue(0);
  }, [loginError, loginErrorAnim]);

  // Auto-dismiss error after 4 seconds (animated)
  useEffect(() => {
    if (!loginError) return;
    const timer = setTimeout(() => dismissLoginError(), 4000);
    return () => clearTimeout(timer);
  }, [dismissLoginError, loginError]);

  const showEmailError =
    loginError?.kind === "validation" &&
    (!email || email.trim().length === 0);
  const showPasswordError =
    loginError?.kind === "validation" &&
    (!password || password.trim().length === 0);

  return (
    <>
    <ScreenLayout
      topInsetColor="#C8FACC"
      topInsetContent={
        <LinearGradient
          colors={["#C8FACC", "#3CBA8D"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={{ flex: 1 }}
        />
      }
      backgroundColor="#FFFFFF"
    >
      <View style={styles.container}>
        {/* Preload icons so they don't pop in on first login open */}
        <View style={{ height: 0, width: 0, overflow: "hidden" }}>
          <Ionicons name="close" size={1} color="transparent" />
          <Ionicons name="mail-outline" size={1} color="transparent" />
          <Ionicons name="lock-closed-outline" size={1} color="transparent" />
          <Ionicons name="eye-outline" size={1} color="transparent" />
          <Ionicons name="eye-off-outline" size={1} color="transparent" />
        </View>
        {/* Modern Wave Header - smooth, high wave, no gaps */}
        <View style={styles.headerContainer}>
          <LinearGradient
            colors={["#C8FACC", "#3CBA8D"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.gradient}
          >
            <Animated.Image
              source={require("../../assets/images/launchpng.png")}
              style={[styles.logo, logoAnimatedStyle]}
              resizeMode="contain"
              accessible
              accessibilityLabel="FridgeWise logo"
            />
            {/* Fills the gap when the wave moves up so green doesn’t show beside the modal */}
            <Animated.View style={[styles.waveGapFill, waveTranslate]} />
            <Animated.View style={[styles.wave, waveTranslate]}>
              <Svg width={width} height={260} viewBox={`0 0 ${width} 260`}>
                <Path
                  d={`M0,100 Q${width * 0.25},60 ${width * 0.5},100 Q${
                    width * 0.75
                  },140 ${width},100 L${width},260 L0,260 Z`}
                  fill="#fff"
                />
              </Svg>
            </Animated.View>
          </LinearGradient>
        </View>
        {/* Covers green gradient seam when wave rises — header/wave stay visible above */}
        {showLogin && (
          <View style={styles.loginContentScrim} pointerEvents="none" />
        )}
        {/* Content */}
        <Animated.View style={[styles.content, welcomeScale]}>
          {!showLogin && <Text style={styles.heading}>Welcome!</Text>}

          {!isResetMode && !showLogin && (
            <>
              <TouchableOpacity
                style={styles.createButton}
                onPress={handleCreateAccount}
                accessibilityRole="button"
              >
                <LinearGradient
                  colors={["#197C47", "#3CBA8D"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.createButtonGradient}
                >
                  <Text style={styles.createButtonText}>Create Account</Text>
                </LinearGradient>
              </TouchableOpacity>
              <View style={styles.dividerContainer}>
                <View style={styles.divider} />
                <View style={styles.dividerTextWrap}>
                  <Text style={styles.dividerText}>or</Text>
                </View>
                <View style={styles.divider} />
              </View>
              <Animated.View
                style={{
                  opacity: loginButtonAnim,
                  transform: [
                    {
                      translateY: loginButtonAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [16, 0],
                      }),
                    },
                  ],
                  width: "100%",
                  alignItems: "center",
                }}
              >
                <TouchableOpacity
                  style={styles.loginButton}
                  onPress={handleLogin}
                  accessibilityRole="button"
                >
                  <Text style={styles.loginButtonText}>Login</Text>
                </TouchableOpacity>
              </Animated.View>
            </>
          )}
        </Animated.View>
        {/* Slide-down Login Modal */}
        {loginSheetVisible && (
          <Animated.View style={[styles.loginModal, slideDown]}>
            <KeyboardAvoidingView
              behavior={Platform.OS === "ios" ? "padding" : "height"}
              style={styles.loginModalInner}
            >
              <TouchableOpacity
                style={styles.closeButton}
                onPress={handleCloseLogin}
                accessibilityLabel="Close login"
              >
                <Ionicons name="close" size={20} color="#197C47" />
              </TouchableOpacity>
              <Text style={styles.loginHeading}>
                {isResetMode ? "Reset Password" : "Sign in to FridgeWise"}
              </Text>
              <View style={styles.form}>
                {!!loginError && (
                  <Animated.View
                    style={[
                      styles.inlineAlert,
                      {
                        opacity: loginErrorAnim,
                        maxHeight: loginErrorAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0, 160],
                        }),
                        marginBottom: loginErrorAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0, 12],
                        }),
                        paddingVertical: loginErrorAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0, 10],
                        }),
                        paddingHorizontal: loginErrorAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0, 12],
                        }),
                        transform: [
                          {
                            translateY: loginErrorAnim.interpolate({
                              inputRange: [0, 1],
                              outputRange: [-6, 0],
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
                    <Text style={styles.inlineAlertText}>
                      {loginError.message}
                    </Text>
                    <TouchableOpacity
                      style={styles.inlineAlertClose}
                      onPress={dismissLoginError}
                      accessibilityLabel="Dismiss error"
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <Ionicons name="close" size={16} color="#7F1D1D" />
                    </TouchableOpacity>
                  </Animated.View>
                )}
                <View
                  style={[
                    styles.inputGroup,
                    emailFocused && styles.inputGroupFocused,
                    showEmailError && styles.inputGroupError,
                  ]}
                >
                  <Ionicons
                    name="mail-outline"
                    size={18}
                    color="#9CA3AF"
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="Email address"
                    placeholderTextColor="#737373"
                    value={email}
                    onChangeText={(text) => {
                      setEmail(text);
                      if (loginError) dismissLoginError();
                    }}
                    autoCapitalize="none"
                    keyboardType="email-address"
                    editable={!loading}
                    accessibilityLabel="Email input"
                    onFocus={() => setEmailFocused(true)}
                    onBlur={() => setEmailFocused(false)}
                    underlineColorAndroid="transparent"
                    autoComplete="off"
                    importantForAutofill="no"
                    textContentType="none"
                    maxLength={MAX_EMAIL_LENGTH}
                  />
                </View>
                {!isResetMode && (
                  <View
                    style={[
                      styles.inputGroup,
                      passwordFocused && styles.inputGroupFocused,
                      showPasswordError && styles.inputGroupError,
                    ]}
                  >
                    <Ionicons
                      name="lock-closed-outline"
                      size={18}
                      color="#9CA3AF"
                      style={styles.inputIcon}
                    />
                    <TextInput
                      style={styles.input}
                      placeholder="Password"
                      placeholderTextColor="#737373"
                      value={password}
                      onChangeText={(text) => {
                        setPassword(text);
                        if (loginError) dismissLoginError();
                      }}
                      secureTextEntry={!showPassword}
                      editable={!loading}
                      accessibilityLabel="Password input"
                      onFocus={() => setPasswordFocused(true)}
                      onBlur={() => setPasswordFocused(false)}
                      underlineColorAndroid="transparent"
                    autoComplete="off"
                    importantForAutofill="no"
                    textContentType="none"
                    maxLength={MAX_PASSWORD_LENGTH}
                    />
                    <TouchableOpacity
                      onPress={() => setShowPassword(!showPassword)}
                      style={styles.eyeIcon}
                      accessibilityLabel={
                        showPassword ? "Hide password" : "Show password"
                      }
                    >
                      <Ionicons
                        name={showPassword ? "eye-outline" : "eye-off-outline"}
                        size={18}
                        color="#197C47"
                      />
                    </TouchableOpacity>
                  </View>
                )}
                {!isResetMode && (
                  <View style={styles.rememberRow}>
                    <TouchableOpacity
                      style={styles.rememberCheckboxTouchable}
                      onPress={() => setRememberMe(!rememberMe)}
                      accessibilityRole="checkbox"
                      accessibilityState={{ checked: rememberMe }}
                      accessibilityLabel="Remember me"
                    >
                      <View
                        style={[
                          styles.rememberCheckbox,
                          rememberMe && styles.rememberCheckboxChecked,
                        ]}
                      >
                        {rememberMe && (
                          <Ionicons name="checkmark" size={12} color="#fff" />
                        )}
                      </View>
                    </TouchableOpacity>
                    <Text style={styles.rememberLabel}>Remember me</Text>
                  </View>
                )}
                <TouchableOpacity
                  style={[
                    styles.button,
                    (loading || (isResetMode && resetCooldownSeconds > 0)) &&
                      styles.buttonDisabled,
                  ]}
                  onPress={handleSignIn}
                  disabled={loading || (isResetMode && resetCooldownSeconds > 0)}
                  accessibilityRole="button"
                  accessibilityLabel={
                    isResetMode ? "Send password reset email" : "Sign in"
                  }
                >
                  {loading ? (
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Text style={styles.buttonText}>
                        {isResetMode ? "Sending Email" : "Signing in"}
                      </Text>
                      <SigningInDots />
                    </View>
                  ) : isResetMode && resetCooldownSeconds > 0 ? (
                    <View style={styles.resetCooldownRow}>
                      <Text style={styles.resetCooldownLabel}>
                        Request again in
                      </Text>
                      <View style={styles.resetCooldownCircle}>
                        <Svg width={32} height={32} style={styles.resetCooldownSvg}>
                          <Circle
                            cx={16}
                            cy={16}
                            r={14}
                            stroke="#E5E7EB"
                            strokeWidth={3}
                            fill="transparent"
                          />
                          <Circle
                            cx={16}
                            cy={16}
                            r={14}
                            stroke="#197C47"
                            strokeWidth={3}
                            fill="transparent"
                            strokeDasharray={2 * Math.PI * 14}
                            strokeDashoffset={
                              2 * Math.PI * 14 * resetCooldownSeconds / 60
                            }
                            transform="rotate(-90 16 16)"
                          />
                        </Svg>
                        <Text style={styles.resetCooldownText}>
                          {resetCooldownSeconds}
                        </Text>
                      </View>
                    </View>
                  ) : (
                    <Text style={styles.buttonText}>
                      {isResetMode ? "Reset" : "Sign in"}
                    </Text>
                  )}
                </TouchableOpacity>
                {isResetMode && (
                  <TouchableOpacity
                    style={styles.resetSupportPill}
                    accessibilityRole="link"
                    accessibilityLabel="Contact support by email"
                    activeOpacity={0.75}
                    onPress={() =>
                      void Linking.openURL("mailto:fridgewise.app@gmail.com")
                    }
                  >
                    <Text style={styles.resetSupportText}>Contact support</Text>
                  </TouchableOpacity>
                )}
                {!isResetMode && (
                  <TouchableOpacity
                    style={styles.forgotPassword}
                    accessibilityRole="button"
                    onPress={() => {
                      setIsResetMode(true);
                      setLoginError(null);
                    }}
                  >
                    <Text style={styles.forgotPasswordText}>
                      Forgot password?
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            </KeyboardAvoidingView>
          </Animated.View>
        )}
      </View>
    </ScreenLayout>
    <SimpleInfoModal
      visible={resetEmailModalVisible}
      title="Check your email"
      message="We sent you a link to reset your password. Open it on this device to choose a new password. If you don’t see it, check your spam folder."
      okLabel="OK"
      accentColor="#197C47"
      onDismiss={() => {
        setResetEmailModalVisible(false);
        setIsResetMode(false);
      }}
    />
    <OfflineNoticeModal
      visible={offlineNoticeVisible}
      onDismiss={() => setOfflineNoticeVisible(false)}
    />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  headerContainer: {
    width: "100%",
    height: 320,
    position: "relative",
    padding: 0,
    margin: 0,
  },
  gradient: {
    width: "100%",
    height: 320,
    alignItems: "center",
    justifyContent: "flex-start",
    overflow: "hidden",
    paddingTop: 0,
  },
  logo: {
    width: 210,
    height: 210,
    alignSelf: "center",
    zIndex: 2,
    marginTop: 56,
    marginBottom: 0,
  },
  wave: {
    position: "absolute",
    bottom: -120,
    left: 0,
    zIndex: 1,
  },
  loginContentScrim: {
    position: "absolute",
    top: 320,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "#FFFFFF",
    zIndex: 15,
    elevation: 15,
  },
  waveGapFill: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: -120,
    height: 100,
    backgroundColor: "#FFFFFF",
    zIndex: 0,
  },
  content: {
    flex: 1,
    alignItems: "center",
    marginTop: 24,
  },
  heading: {
    fontSize: 28,
    fontWeight: "700",
    color: "#197C47",
    marginBottom: 40,
    marginTop: 10,
  },
  createButton: {
    width: "80%",
    borderRadius: 32,
    marginBottom: 10,
    shadowColor: "#197C47",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 6,
  },
  createButtonGradient: {
    borderRadius: 32,
    paddingVertical: 16,
    alignItems: "center",
  },
  createButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
  },
  dividerContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    width: "80%",
    minHeight: 26,
    marginTop: 0,
    marginBottom: 10,
  },
  dividerTextWrap: {
    height: 26,
    justifyContent: "center",
    alignItems: "center",
    marginHorizontal: 12,
  },
  divider: {
    flex: 1,
    height: 1.5,
    backgroundColor: "#C8FACC",
    borderRadius: 1,
  },
  dividerText: {
    color: "#197C47",
    fontSize: 15,
    lineHeight: 16,
    fontWeight: "600",
    includeFontPadding: false,
    textAlignVertical: "center",
    transform: [{ translateY: -1 }],
  },
  loginButton: {
    width: "80%",
    borderRadius: 32,
    paddingVertical: 16,
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#197C47",
    backgroundColor: "#fff",
    shadowColor: "#197C47",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 2,
  },
  loginButtonText: {
    color: "#197C47",
    fontSize: 18,
    fontWeight: "700",
  },
  loginModal: {
    position: "absolute",
    backgroundColor: "#FFFFFF",
    borderRadius: 22,
    padding: 14,
    paddingTop: 12,
    zIndex: 20,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 6,
    overflow: "hidden",
  },
  loginModalInner: {
    flex: 1,
    justifyContent: "flex-start",
  },
  closeButton: {
    position: "absolute",
    top: 4,
    right: 4,
    zIndex: 10,
    width: 28,
    height: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  loginHeading: {
    fontSize: 19,
    fontWeight: "700",
    color: "#197C47",
    marginBottom: 14,
    textAlign: "center",
    marginTop: 8,
    paddingHorizontal: 4,
  },
  form: {
    flex: 1,
    justifyContent: "flex-start",
  },
  inputGroup: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 8,
    paddingVertical: 9,
    paddingHorizontal: 10,
    marginBottom: 9,
    backgroundColor: "#FFFFFF",
  },
  inputGroupFocused: {
    borderColor: "#197C47",
    backgroundColor: "#FFFFFF",
  },
  inputGroupError: {
    borderColor: "#D32F2F",
    backgroundColor: "rgba(211,47,47,0.06)",
  },
  inlineAlert: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 0,
    borderRadius: 12,
    backgroundColor: "rgba(185,28,28,0.08)",
    borderWidth: 1,
    borderColor: "rgba(185,28,28,0.22)",
    overflow: "hidden",
  },
  inlineAlertText: {
    flex: 1,
    color: "#7F1D1D",
    fontSize: 13,
    fontWeight: "600",
    lineHeight: 18,
  },
  inlineAlertClose: {
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
  inputIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    color: "#197C47",
    fontSize: 15,
    backgroundColor: "#FFFFFF",
    borderWidth: 0,
  },
  eyeIcon: {
    padding: 2,
  },
  rememberRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
    width: "100%",
    marginBottom: 10,
  },
  rememberCheckboxTouchable: {
    padding: 6,
    marginRight: 4,
  },
  rememberCheckbox: {
    width: 16,
    height: 16,
    borderWidth: 1.5,
    borderColor: "#197C47",
    borderRadius: 4,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
  },
  rememberCheckboxChecked: {
    backgroundColor: "#197C47",
    borderColor: "#197C47",
  },
  rememberLabel: {
    fontSize: 13,
    color: "#6B7280",
    fontWeight: "500",
  },
  forgotPassword: {
    alignItems: "center",
    marginTop: 6,
    marginBottom: 8,
  },
  forgotPasswordText: {
    color: "#197C47",
    fontSize: 14,
    fontWeight: "600",
  },
  resetSupportPill: {
    alignSelf: "center",
    marginTop: 16,
    marginBottom: 8,
    paddingHorizontal: 18,
    paddingVertical: 9,
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: "rgba(25, 124, 71, 0.45)",
    backgroundColor: "rgba(25, 124, 71, 0.06)",
  },
  resetSupportText: {
    color: "#197C47",
    fontSize: 13,
    fontWeight: "600",
    letterSpacing: 0.2,
  },
  resetCooldownRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  resetCooldownCircle: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
  },
  resetCooldownSvg: {
    position: "absolute",
  },
  resetCooldownText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#197C47",
  },
  resetCooldownLabel: {
    fontSize: 14,
    color: "#FFFFFF",
    fontWeight: "600",
  },
  button: {
    width: "88%",
    alignSelf: "center",
    borderRadius: 24,
    paddingVertical: 11,
    alignItems: "center",
    backgroundColor: "#197C47",
  },
  buttonDisabled: {
    backgroundColor: "#197C47",
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
});
