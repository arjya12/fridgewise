import SafeAreaWrapper from "@/components/SafeAreaWrapper";
import { useAuth } from "@/contexts/AuthContext";
import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
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
import Svg, { Path } from "react-native-svg";

const { width, height: screenHeight } = Dimensions.get("window");

export default function WelcomeScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { signIn } = useAuth();
  const [showLogin, setShowLogin] = useState(false);
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
  const [hasLoginError, setHasLoginError] = useState(false);

  // Open login modal if ?login=1 is present in params
  useEffect(() => {
    if (params?.login === "1" && !showLogin) {
      handleLogin();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params?.login]);

  function handleCreateAccount() {
    router.replace("/(auth)/signup");
  }
  function handleLogin() {
    Animated.timing(loginButtonAnim, {
      toValue: 0,
      duration: 400,
      easing: Easing.inOut(Easing.cubic),
      useNativeDriver: true,
    }).start(() => {
      setShowLogin(true);
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
    });
  }
  function handleCloseLogin() {
    Animated.parallel([
      Animated.timing(welcomeAnim, {
        toValue: 1,
        duration: 400,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(waveAnim, {
        toValue: 0,
        duration: 400,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(logoAnim, {
        toValue: 1,
        duration: 400,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 2,
        duration: 400,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start(() => {
      setShowLogin(false);
      slideAnim.setValue(0);
      Animated.timing(loginButtonAnim, {
        toValue: 1,
        duration: 225,
        easing: Easing.inOut(Easing.cubic),
        useNativeDriver: true,
      }).start();
    });
    setHasLoginError(false);
  }
  async function handleSignIn() {
    if (!email || !password) {
      setHasLoginError(true);
      return;
    }
    setLoading(true);
    try {
      await signIn(email, password);
      router.replace("/(tabs)");
    } catch (error) {
      setHasLoginError(true);
    } finally {
      setLoading(false);
    }
  }

  // Slide the modal down from the login button (approx 350px from top)
  const { width: screenWidth } = Dimensions.get("window");
  const modalWidth = 340;
  const slideDown = {
    top: screenHeight * 0.5 - 20,
    left: screenWidth * 0.5,
    width: modalWidth,
    transform: [
      { translateX: -modalWidth / 2 },
      {
        translateY: slideAnim.interpolate({
          inputRange: [0, 1, 2],
          outputRange: [350, -180, 350],
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
  const waveTranslate = {
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
  const logoAnimatedStyle = {
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

  // Auto-dismiss error after 3 seconds
  useEffect(() => {
    if (hasLoginError) {
      const timer = setTimeout(() => setHasLoginError(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [hasLoginError]);

  return (
    <SafeAreaWrapper usePadding edges={["top"]}>
      <View style={styles.container}>
        {/* Modern Wave Header - smooth, high wave, no gaps */}
        <View style={styles.headerContainer}>
          <LinearGradient
            colors={["#C8FACC", "#3CBA8D"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.gradient}
          >
            <Animated.Image
              source={require("../../assets/images/launchpng.png")}
              style={[styles.logo, logoAnimatedStyle]}
              resizeMode="contain"
              accessible
              accessibilityLabel="FridgeWise logo"
            />
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
        {/* Content */}
        <Animated.View style={[styles.content, welcomeScale]}>
          <Text style={styles.heading}>Welcome!</Text>
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
          {/* Divider */}
          <View style={styles.dividerContainer}>
            <View style={styles.divider} />
            <Text style={styles.dividerText}>or</Text>
            <View style={styles.divider} />
          </View>
          {!showLogin && (
            <Animated.View
              style={{
                opacity: loginButtonAnim,
                transform: [
                  {
                    translateY: loginButtonAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [30, 0],
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
          )}
        </Animated.View>
        {/* Slide-down Login Modal */}
        {showLogin && (
          <Animated.View style={[styles.loginModal, slideDown]}>
            <BlurView
              intensity={80}
              tint="light"
              style={StyleSheet.absoluteFill}
            />
            <KeyboardAvoidingView
              behavior={Platform.OS === "ios" ? "padding" : "height"}
              style={styles.loginModalInner}
            >
              <TouchableOpacity
                style={styles.closeButton}
                onPress={handleCloseLogin}
                accessibilityLabel="Close login"
              >
                <Ionicons name="close" size={22} color="#197C47" />
              </TouchableOpacity>
              <Text style={styles.loginHeading}>Sign in to FridgeWise</Text>
              <View style={styles.form}>
                <View
                  style={[
                    styles.inputGroup,
                    emailFocused && styles.inputGroupFocused,
                    hasLoginError && styles.inputGroupError,
                  ]}
                >
                  <Ionicons
                    name="mail-outline"
                    size={20}
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
                      if (hasLoginError) setHasLoginError(false);
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
                  />
                </View>
                <View
                  style={[
                    styles.inputGroup,
                    passwordFocused && styles.inputGroupFocused,
                    hasLoginError && styles.inputGroupError,
                  ]}
                >
                  <Ionicons
                    name="lock-closed-outline"
                    size={20}
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
                      if (hasLoginError) setHasLoginError(false);
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
                      size={20}
                      color="#9CA3AF"
                    />
                  </TouchableOpacity>
                </View>
                {hasLoginError && (
                  <Text
                    style={{
                      color: "#D32F2F",
                      fontSize: 14,
                      marginTop: 2,
                      marginBottom: 8,
                      fontWeight: "600",
                    }}
                  >
                    Invalid email or password
                  </Text>
                )}
                <TouchableOpacity
                  style={styles.forgotPassword}
                  accessibilityRole="button"
                >
                  <Text style={styles.forgotPasswordText}>
                    Forgot password?
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.button, loading && styles.buttonDisabled]}
                  onPress={handleSignIn}
                  disabled={loading}
                  accessibilityRole="button"
                  accessibilityLabel="Sign in"
                >
                  {loading ? (
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Text style={styles.buttonText}>Signing in</Text>
                      <SigningInDots />
                    </View>
                  ) : (
                    <Text style={styles.buttonText}>Sign in</Text>
                  )}
                </TouchableOpacity>
              </View>
            </KeyboardAvoidingView>
          </Animated.View>
        )}
      </View>
    </SafeAreaWrapper>
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
    marginBottom: 18,
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
    width: "80%",
    marginVertical: 8,
  },
  divider: {
    flex: 1,
    height: 1.5,
    backgroundColor: "#C8FACC",
    borderRadius: 1,
  },
  dividerText: {
    marginHorizontal: 12,
    color: "#197C47",
    fontSize: 15,
    fontWeight: "600",
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
    backgroundColor: "rgba(255,255,255,0.92)",
    borderRadius: 28,
    padding: 18,
    zIndex: 20,
    shadowColor: "#197C47",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 24,
    elevation: 12,
    overflow: "hidden",
  },
  loginModalInner: {
    flex: 1,
    justifyContent: "flex-start",
  },
  closeButton: {
    position: "absolute",
    top: 6,
    right: 6,
    zIndex: 10,
    backgroundColor: "#f3f3f3",
    borderRadius: 16,
    padding: 2,
    width: 28,
    height: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  loginHeading: {
    fontSize: 22,
    fontWeight: "700",
    color: "#197C47",
    marginBottom: 18,
    textAlign: "center",
    marginTop: 12,
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
    padding: 12,
    marginBottom: 12,
    backgroundColor: "rgba(255,255,255,0.92)",
  },
  inputGroupFocused: {
    borderColor: "#197C47",
    backgroundColor: "rgba(255,255,255,0.92)",
  },
  inputGroupError: {
    borderColor: "#D32F2F",
    backgroundColor: "rgba(211,47,47,0.06)",
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    color: "#197C47",
    fontSize: 16,
    backgroundColor: "rgba(255,255,255,0.92)",
    borderWidth: 0,
  },
  eyeIcon: {
    padding: 4,
  },
  forgotPassword: {
    alignItems: "center",
    marginBottom: 12,
  },
  forgotPasswordText: {
    color: "#197C47",
    fontSize: 15,
    fontWeight: "600",
  },
  button: {
    width: "80%",
    alignSelf: "center",
    borderRadius: 32,
    paddingVertical: 14,
    alignItems: "center",
    backgroundColor: "#197C47",
  },
  buttonDisabled: {
    backgroundColor: "#3CBA8D",
  },
  buttonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
  },
});
