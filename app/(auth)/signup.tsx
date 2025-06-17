// app/(auth)/signup.tsx
import { useAuth } from "@/contexts/AuthContext";
import { useColorScheme } from "@/hooks/useColorScheme";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
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

const THEME_GREEN = '#197C47';
const THEME_LIGHT = '#fff';
const THEME_BORDER = '#E0E0E0';
const THEME_INPUT_BG = 'rgba(255,255,255,0.92)';

// Password strength helper
function getPasswordStrength(password: string): { label: string; color: string } {
  if (!password) return { label: "", color: "#b0bfc7" };
  if (password.length < 6) return { label: "Weak", color: "#e57373" };
  if (/^(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*]).{8,}$/.test(password))
    return { label: "Strong", color: "#388e3c" };
  if (password.length >= 6) return { label: "Medium", color: "#fbc02d" };
  return { label: "Weak", color: "#e57373" };
}

export default function SignUpScreen() {
  const [fullName, setFullName] = useState("");
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
  const [fullNameFocused, setFullNameFocused] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [confirmPasswordFocused, setConfirmPasswordFocused] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [formAnim] = useState(new Animated.Value(0));
  const scrollRef = useRef<ScrollView>(null);
  const [keyboardOffset] = useState(new Animated.Value(0));

  useEffect(() => {
    Animated.timing(formAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, []);

  useEffect(() => {
    const keyboardWillShow = (e: any) => {
      Animated.timing(keyboardOffset, {
        toValue: -120,
        duration: 300,
        useNativeDriver: true,
      }).start();
    };
    const keyboardWillHide = () => {
      Animated.timing(keyboardOffset, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    };
    const showSub = Keyboard.addListener('keyboardWillShow', keyboardWillShow);
    const hideSub = Keyboard.addListener('keyboardWillHide', keyboardWillHide);
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, [keyboardOffset]);

  function validate() {
    const newErrors: { [key: string]: string } = {};
    if (!fullName.trim()) newErrors.fullName = "Please enter your name.";
    if (!email.match(/^\S+@\S+\.\S+$/)) newErrors.email = "Please enter a valid email.";
    if (password.length < 6) newErrors.password = "Password must be at least 6 characters.";
    if (password !== confirmPassword) newErrors.confirmPassword = "Passwords do not match.";
    if (!agreedToTerms) newErrors.terms = "You must agree to the terms.";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  const handleSignUp = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      await signUp(email, password, fullName);
      Alert.alert(
        "Sign up successful! Please check your email to verify your account."
      );
      router.replace("/(auth)/login");
    } catch (error) {
      // Error is already handled in AuthContext
    } finally {
      setLoading(false);
    }
  };

  const passwordStrength = getPasswordStrength(password);

  return (
    <View style={{ flex: 1, backgroundColor: '#fff' }}>
      {/* Signup Card with Glassmorphism, slides with keyboard */}
      <KeyboardAvoidingView
        style={{ flex: 1, width: '100%' }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 60 : 0}
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, justifyContent: 'flex-start', alignItems: 'center', marginTop: 40 }}
          keyboardShouldPersistTaps="handled"
          ref={scrollRef}
        >
          <View style={{ width: '100%', alignItems: 'center' }}>
            <View style={{ width: 340, maxWidth: '92%', alignItems: 'center', marginTop: 48, marginBottom: 24 }}>
              <Animated.Image
                source={require('../../assets/images/launchpng.png')}
                style={{ width: 150, height: 150, borderRadius: 16, marginBottom: 4 }}
                resizeMode="contain"
                accessible
                accessibilityLabel="FridgeWise logo"
              />
              <Text style={[styles.heading, { fontSize: 18, marginBottom: 18, marginTop: 0, alignSelf: 'center', width: '100%', textAlign: 'center', backgroundColor: 'transparent' }]}>Create your FridgeWise account</Text>
              <View style={styles.form}>
                {/* Full Name Field */}
                <View style={[styles.inputGroup, fullNameFocused && styles.inputGroupFocused, errors.fullName && styles.inputGroupError]}>
                  <Ionicons name="person-outline" size={20} color={THEME_GREEN} style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Name"
                    placeholderTextColor="#737373"
                    value={fullName}
                    onChangeText={setFullName}
                    autoCapitalize="words"
                    editable={!loading}
                    accessibilityLabel="Full name input"
                    onFocus={() => setFullNameFocused(true)}
                    onBlur={() => setFullNameFocused(false)}
                    returnKeyType="next"
                  />
                </View>
                {errors.fullName && <Text style={styles.errorText}>{errors.fullName}</Text>}
                {/* Email Field */}
                <View style={[styles.inputGroup, emailFocused && styles.inputGroupFocused, errors.email && styles.inputGroupError]}>
                  <Ionicons name="mail-outline" size={20} color={THEME_GREEN} style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Email address"
                    placeholderTextColor="#737373"
                    value={email}
                    onChangeText={setEmail}
                    autoCapitalize="none"
                    keyboardType="email-address"
                    editable={!loading}
                    accessibilityLabel="Email input"
                    onFocus={() => setEmailFocused(true)}
                    onBlur={() => setEmailFocused(false)}
                    returnKeyType="next"
                  />
                </View>
                {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
                {/* Password Field */}
                <View style={[styles.inputGroup, passwordFocused && styles.inputGroupFocused, errors.password && styles.inputGroupError]}>
                  <Ionicons name="lock-closed-outline" size={20} color={THEME_GREEN} style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Password"
                    placeholderTextColor="#737373"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                    editable={!loading}
                    accessibilityLabel="Password input"
                    onFocus={() => setPasswordFocused(true)}
                    onBlur={() => setPasswordFocused(false)}
                    returnKeyType="next"
                  />
                  <TouchableOpacity
                    onPress={() => setShowPassword(!showPassword)}
                    style={styles.eyeIcon}
                    accessibilityLabel={showPassword ? "Hide password" : "Show password"}
                  >
                    <Ionicons name={showPassword ? "eye-outline" : "eye-off-outline"} size={20} color={THEME_GREEN} />
                  </TouchableOpacity>
                </View>
                {/* Password Strength Indicator */}
                {!!passwordStrength.label && (
                  <View style={styles.passwordStrengthContainer}>
                    <View style={[styles.passwordStrengthBar, { backgroundColor: passwordStrength.color }]} />
                    <Text style={[styles.passwordStrengthText, { color: passwordStrength.color }]}>{passwordStrength.label}</Text>
                  </View>
                )}
                {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}
                {/* Confirm Password Field */}
                <View style={[styles.inputGroup, confirmPasswordFocused && styles.inputGroupFocused, errors.confirmPassword && styles.inputGroupError]}>
                  <Ionicons name="checkmark-circle-outline" size={20} color={THEME_GREEN} style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Confirm password"
                    placeholderTextColor="#737373"
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    secureTextEntry={!showConfirmPassword}
                    editable={!loading}
                    accessibilityLabel="Confirm password input"
                    onFocus={() => setConfirmPasswordFocused(true)}
                    onBlur={() => setConfirmPasswordFocused(false)}
                    returnKeyType="done"
                  />
                  <TouchableOpacity
                    onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                    style={styles.eyeIcon}
                    accessibilityLabel={showConfirmPassword ? "Hide password" : "Show password"}
                  >
                    <Ionicons name={showConfirmPassword ? "eye-outline" : "eye-off-outline"} size={20} color={THEME_GREEN} />
                  </TouchableOpacity>
                </View>
                {errors.confirmPassword && <Text style={styles.errorText}>{errors.confirmPassword}</Text>}
                {/* Terms Checkbox */}
                <View style={styles.termsContainer}>
                  <TouchableOpacity
                    style={styles.checkboxTouchable}
                    onPress={() => setAgreedToTerms(!agreedToTerms)}
                    testID="terms-checkbox"
                    accessibilityRole="checkbox"
                    accessibilityState={{ checked: agreedToTerms }}
                    accessibilityLabel="Agree to terms"
                    activeOpacity={0.7}
                  >
                    <View style={[styles.checkbox, agreedToTerms
                      ? { backgroundColor: '#197C47', borderColor: '#197C47' }
                      : { backgroundColor: '#fff', borderColor: '#E0E0E0' }
                    ]}>
                      {agreedToTerms && (
                        <Animated.View style={{ transform: [{ scale: agreedToTerms ? 1 : 0.7 }], opacity: agreedToTerms ? 1 : 0 }}>
                          <Ionicons name="checkmark" size={14} color="#fff" />
                        </Animated.View>
                      )}
                    </View>
                  </TouchableOpacity>
                  <View style={styles.termsTextContainer}>
                    <Text style={styles.termsText}>I agree to the </Text>
                    <TouchableOpacity><Text style={styles.termsLink}>Terms of Service</Text></TouchableOpacity>
                    <Text style={styles.termsText}> and </Text>
                    <TouchableOpacity><Text style={styles.termsLink}>Privacy Policy</Text></TouchableOpacity>
                  </View>
                </View>
                {errors.terms && <Text style={styles.errorText}>{errors.terms}</Text>}
                {/* Create Account Button */}
                <TouchableOpacity
                  style={[styles.button, loading && styles.buttonDisabled]}
                  onPress={handleSignUp}
                  disabled={loading}
                  testID="signup-button"
                  accessibilityRole="button"
                  accessibilityLabel="Create account"
                  activeOpacity={0.85}
                  onPressIn={() => formAnim.setValue(0.97)}
                  onPressOut={() => formAnim.setValue(1)}
                >
                  {loading ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <Text style={styles.buttonText}>Create Account</Text>
                  )}
                </TouchableOpacity>
                {/* Login Link */}
                <View style={{ width: '100%', alignItems: 'center', marginTop: 5 }}>
                  <Text style={[styles.toggleText, { textAlign: 'center', marginBottom: 2 }]}>Already have an account?</Text>
                  <TouchableOpacity
                    onPress={() => router.replace({ pathname: '/(auth)/welcome', params: { login: '1' } })}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.toggleLink, { textAlign: 'center', fontSize: 16, fontWeight: '700', marginTop: 0 }]} accessibilityRole="link">Login</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  bgLight: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: THEME_LIGHT,
  },
  card: {
    width: '90%',
    maxWidth: 400,
    backgroundColor: THEME_LIGHT,
    borderRadius: 24,
    padding: 28,
    shadowColor: '#197C47',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.10,
    shadowRadius: 24,
    elevation: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  heading: {
    fontSize: 24,
    fontWeight: '700',
    color: THEME_GREEN,
    marginBottom: 24,
    textAlign: 'center',
    fontFamily: 'System',
  },
  form: {
    width: "100%",
    marginBottom: 12,
  },
  inputGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: THEME_BORDER,
    borderRadius: 12,
    backgroundColor: THEME_INPUT_BG,
    marginBottom: 16,
    paddingHorizontal: 12,
    height: 48,
    position: 'relative',
  },
  inputGroupFocused: {
    borderColor: THEME_GREEN,
    backgroundColor: THEME_INPUT_BG,
  },
  inputGroupError: {
    borderColor: '#e57373',
    shadowColor: '#e57373',
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
    fontFamily: 'System',
    backgroundColor: 'transparent',
  },
  eyeIcon: {
    padding: 4,
  },
  button: {
    backgroundColor: THEME_GREEN,
    borderRadius: 32,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
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
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  termsContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  checkbox: {
    width: 16,
    height: 16,
    borderWidth: 1.5,
    borderColor: "#197C47",
    borderRadius: 4,
    marginRight: 8,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#101825",
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
    lineHeight: 22,
  },
  termsLink: {
    fontSize: 14,
    color: THEME_GREEN,
    lineHeight: 22,
    fontWeight: '700',
    textDecorationLine: 'underline',
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
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
  errorText: {
    color: '#e57373',
    fontSize: 13,
    marginBottom: 8,
    marginLeft: 4,
  },
  passwordStrengthContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    marginLeft: 4,
  },
  passwordStrengthBar: {
    width: 36,
    height: 6,
    borderRadius: 3,
    marginRight: 8,
  },
  passwordStrengthText: {
    fontSize: 13,
    fontWeight: '600',
  },
  checkboxTouchable: {
    padding: 8,
    marginRight: 0,
    borderRadius: 8,
  },
});
