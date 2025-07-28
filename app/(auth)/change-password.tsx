import SafeAreaWrapper from "@/components/SafeAreaWrapper";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

/**
 * Change Password Screen
 * Allows users to securely change their account password
 */
export default function ChangePasswordScreen() {
  const { user, signOut } = useAuth();

  // Fixed light theme - no system detection
  const isDark = false;

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Fixed light theme colors
  const backgroundColor = "#F9FAFB";
  const cardBackgroundColor = "#FFFFFF";
  const cardBorderColor = "#F3F4F6";
  const textColor = "#000000";
  const placeholderColor = "#9CA3AF";
  const inputBackgroundColor = "#F9FAFB";
  const inputBorderColor = "#E5E7EB";

  // Validate form inputs
  const validateForm = () => {
    if (!currentPassword) {
      Alert.alert("Error", "Please enter your current password");
      return false;
    }

    if (!newPassword) {
      Alert.alert("Error", "Please enter a new password");
      return false;
    }

    if (newPassword.length < 6) {
      Alert.alert("Error", "New password must be at least 6 characters long");
      return false;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert("Error", "New password and confirmation do not match");
      return false;
    }

    return true;
  };

  // Handle password change
  const handleChangePassword = async () => {
    if (!validateForm() || !user) return;

    setIsLoading(true);
    try {
      // First verify the current password by attempting to sign in
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email!,
        password: currentPassword,
      });

      if (signInError) {
        Alert.alert("Error", "Current password is incorrect");
        setIsLoading(false);
        return;
      }

      // Update the password
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (updateError) {
        throw updateError;
      }

      // Success - show alert and sign out
      Alert.alert(
        "Success",
        "Your password has been changed successfully. Please sign in with your new password.",
        [
          {
            text: "OK",
            onPress: async () => {
              await signOut();
            },
          },
        ]
      );
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to change password");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaWrapper>
      <ThemedView style={[styles.container, { backgroundColor }]}>
        {/* Header with back button */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons
              name="arrow-back"
              size={24}
              color={isDark ? "#FFFFFF" : "#000000"}
            />
          </TouchableOpacity>
          <ThemedText style={styles.headerTitle}>Change Password</ThemedText>
          <View style={styles.headerRight} />
        </View>

        {/* Form Card */}
        <View
          style={[
            styles.formCard,
            {
              backgroundColor: cardBackgroundColor,
              borderColor: cardBorderColor,
            },
          ]}
        >
          {/* Current Password */}
          <View style={styles.inputGroup}>
            <ThemedText style={styles.inputLabel}>Current Password</ThemedText>
            <View
              style={[
                styles.inputContainer,
                {
                  backgroundColor: inputBackgroundColor,
                  borderColor: inputBorderColor,
                },
              ]}
            >
              <TextInput
                style={[styles.input, { color: textColor }]}
                value={currentPassword}
                onChangeText={setCurrentPassword}
                secureTextEntry={!showCurrentPassword}
                placeholder="Enter your current password"
                placeholderTextColor={placeholderColor}
                autoCapitalize="none"
              />
              <TouchableOpacity
                style={styles.eyeIcon}
                onPress={() => setShowCurrentPassword(!showCurrentPassword)}
              >
                <Ionicons
                  name={showCurrentPassword ? "eye-off" : "eye"}
                  size={20}
                  color={placeholderColor}
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* New Password */}
          <View style={styles.inputGroup}>
            <ThemedText style={styles.inputLabel}>New Password</ThemedText>
            <View
              style={[
                styles.inputContainer,
                {
                  backgroundColor: inputBackgroundColor,
                  borderColor: inputBorderColor,
                },
              ]}
            >
              <TextInput
                style={[styles.input, { color: textColor }]}
                value={newPassword}
                onChangeText={setNewPassword}
                secureTextEntry={!showNewPassword}
                placeholder="Enter your new password"
                placeholderTextColor={placeholderColor}
                autoCapitalize="none"
              />
              <TouchableOpacity
                style={styles.eyeIcon}
                onPress={() => setShowNewPassword(!showNewPassword)}
              >
                <Ionicons
                  name={showNewPassword ? "eye-off" : "eye"}
                  size={20}
                  color={placeholderColor}
                />
              </TouchableOpacity>
            </View>
            <ThemedText style={styles.passwordHint}>
              Password must be at least 6 characters long
            </ThemedText>
          </View>

          {/* Confirm New Password */}
          <View style={styles.inputGroup}>
            <ThemedText style={styles.inputLabel}>
              Confirm New Password
            </ThemedText>
            <View
              style={[
                styles.inputContainer,
                {
                  backgroundColor: inputBackgroundColor,
                  borderColor: inputBorderColor,
                },
              ]}
            >
              <TextInput
                style={[styles.input, { color: textColor }]}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={!showConfirmPassword}
                placeholder="Confirm your new password"
                placeholderTextColor={placeholderColor}
                autoCapitalize="none"
              />
              <TouchableOpacity
                style={styles.eyeIcon}
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                <Ionicons
                  name={showConfirmPassword ? "eye-off" : "eye"}
                  size={20}
                  color={placeholderColor}
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            style={[
              styles.submitButton,
              isLoading && styles.submitButtonDisabled,
            ]}
            onPress={handleChangePassword}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <ThemedText style={styles.submitButtonText}>
                Change Password
              </ThemedText>
            )}
          </TouchableOpacity>
        </View>

        {/* Security Note */}
        <View style={styles.securityNoteContainer}>
          <Ionicons
            name="shield-checkmark-outline"
            size={20}
            color={isDark ? "#8E8E93" : "#6B7280"}
          />
          <ThemedText
            style={[
              styles.securityNoteText,
              { color: isDark ? "#8E8E93" : "#6B7280" },
            ]}
          >
            For security, you will be signed out after changing your password.
          </ThemedText>
        </View>
      </ThemedView>
    </SafeAreaWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 24,
    paddingVertical: 8,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
  },
  headerRight: {
    width: 40, // To balance the header layout
  },
  formCard: {
    borderRadius: 16,
    padding: 24,
    marginBottom: 24,
    borderWidth: 1,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 8,
    height: 50,
    paddingHorizontal: 12,
  },
  input: {
    flex: 1,
    height: "100%",
    fontSize: 16,
  },
  eyeIcon: {
    padding: 8,
  },
  passwordHint: {
    fontSize: 12,
    color: "#9CA3AF",
    marginTop: 4,
  },
  submitButton: {
    backgroundColor: "#22C55E",
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 16,
  },
  submitButtonDisabled: {
    backgroundColor: "#86EFAC",
  },
  submitButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  securityNoteContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    marginTop: 16,
  },
  securityNoteText: {
    fontSize: 14,
    marginLeft: 8,
  },
});
