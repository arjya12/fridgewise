// app/(auth)/login.tsx
import SafeAreaWrapper from "@/components/SafeAreaWrapper";
import { useAuth } from "@/contexts/AuthContext";
import { useColorScheme } from "@/hooks/useColorScheme";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const { width: screenWidth, height: screenHeight } = Dimensions.get("window");

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { signIn } = useAuth();
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Please fill in all fields");
      return;
    }

    setLoading(true);
    try {
      await signIn(email, password);
      router.replace("/(tabs)");
    } catch (error) {
      // Error is already handled in AuthContext
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaWrapper usePadding edges={["top"]}>
      <View style={styles.modalContainer}>
        <TouchableOpacity
          style={styles.closeButton}
          onPress={() => router.replace("/(auth)/welcome")}
          accessibilityLabel="Close login"
        >
          <Ionicons name="close" size={28} color="#197C47" />
        </TouchableOpacity>
        <View style={styles.card}>
          <Text style={styles.heading}>Sign in to FridgeWise</Text>
          <View style={styles.form}>
            {/* Email Field */}
            <View
              style={[
                styles.inputGroup,
                emailFocused && styles.inputGroupFocused,
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
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                editable={!loading}
                accessibilityLabel="Email input"
                onFocus={() => setEmailFocused(true)}
                onBlur={() => setEmailFocused(false)}
              />
            </View>
            {/* Password Field */}
            <View
              style={[
                styles.inputGroup,
                passwordFocused && styles.inputGroupFocused,
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
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                editable={!loading}
                accessibilityLabel="Password input"
                onFocus={() => setPasswordFocused(true)}
                onBlur={() => setPasswordFocused(false)}
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
            {/* Forgot Password */}
            <TouchableOpacity
              style={styles.forgotPassword}
              accessibilityRole="button"
            >
              <Text style={styles.forgotPasswordText}>Forgot password?</Text>
            </TouchableOpacity>
            {/* Sign In Button */}
            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handleLogin}
              disabled={loading}
              accessibilityRole="button"
              accessibilityLabel="Sign in"
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.buttonText}>Sign in</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </SafeAreaWrapper>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(16, 24, 37, 0.85)",
  },
  closeButton: {
    position: "absolute",
    top: 40,
    right: 24,
    zIndex: 10,
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 4,
    shadowColor: "#197C47",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
  card: {
    width: "100%",
    maxWidth: 400,
    backgroundColor: "rgba(30,40,50,0.85)",
    borderRadius: 16,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 24,
    elevation: 8,
    alignItems: "center",
    marginTop: 8,
  },
  heading: {
    fontSize: 22,
    fontWeight: "700",
    color: "#fff",
    marginBottom: 18,
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
    borderWidth: 1.5,
    borderColor: "#2e3d3a",
    borderRadius: 10,
    backgroundColor: "rgba(20,30,30,0.7)",
    marginBottom: 16,
    paddingHorizontal: 12,
    height: 48,
    position: "relative",
    shadowColor: "#197C47",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
  },
  inputGroupFocused: {
    borderColor: "#197C47",
    shadowColor: "#197C47",
    shadowOpacity: 0.25,
    backgroundColor: "rgba(25,124,71,0.08)",
  },
  inputIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: "#fff",
    fontFamily: "System",
  },
  eyeIcon: {
    padding: 4,
  },
  forgotPassword: {
    alignSelf: "flex-end",
    marginBottom: 18,
  },
  forgotPasswordText: {
    fontSize: 14,
    color: "#197C47",
    fontWeight: "600",
    textDecorationLine: "underline",
  },
  button: {
    backgroundColor: "#197C47",
    borderRadius: 10,
    height: 48,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
    shadowColor: "#197C47",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 6,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
});
