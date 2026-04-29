import SafeAreaWrapper from "@/components/SafeAreaWrapper";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { useAuth } from "@/contexts/AuthContext";
import { MAX_FULL_NAME_LENGTH } from "@/utils/authFieldLimits";
import {
  isValidPersonName,
  sanitizePersonNameInput,
} from "@/utils/personNameInput";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

/**
 * User Profile Screen
 * Allows users to view and edit their profile information
 */
export default function ProfileScreen() {
  const { user, userProfile, updateUserProfile } = useAuth();

  // Fixed light theme - no system detection
  const isDark = false;

  const [isEditing, setIsEditing] = useState(false);
  const [fullName, setFullName] = useState(userProfile?.full_name || "");
  const [nameError, setNameError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Fixed light theme colors
  const backgroundColor = "#FFFFFF";
  const cardBackgroundColor = "#FFFFFF";
  const cardBorderColor = "#F3F4F6";
  const textColor = "#000000";
  const subTextColor = "#666666";
  const inputBackgroundColor = "#F9FAFB";
  const inputBorderColor = "#E5E7EB";
  /** Same as More screen avatar — mint → emerald diagonal */
  const profileGradientColors = ["#3DBF7A", "#2a9960"] as const;
  const normalizeFullName = (value: string) =>
    sanitizePersonNameInput(value).trim();
  const validateFullName = (value: string): string | null => {
    if (!value) return "Name cannot be blank.";
    if (!isValidPersonName(value)) return "Use only letters.";
    return null;
  };

  const displayName = (
    (isEditing ? fullName : userProfile?.full_name) ||
    user?.email ||
    "Your Name"
  ).trim();
  const initials = (() => {
    const parts = displayName.split(/\s+/).filter(Boolean);
    const first = parts[0]?.[0] ?? "";
    const last = parts.length > 1 ? parts[parts.length - 1]?.[0] ?? "" : "";
    const value = (first + last).toUpperCase();
    return value || "?";
  })();

  // Handle save profile changes
  const handleSaveProfile = async () => {
    if (!user) return;
    const cleanedName = normalizeFullName(fullName);
    const validationError = validateFullName(cleanedName);

    if (validationError) {
      setNameError(validationError);
      return;
    }

    setNameError(null);
    setIsLoading(true);
    try {
      // Update the user profile using the AuthContext method
      const updatedProfile = await updateUserProfile({
        full_name: cleanedName,
      });

      if (!updatedProfile) {
        throw new Error("Failed to update profile");
      }

      // Exit edit mode
      setFullName(cleanedName);
      setIsEditing(false);
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to update profile");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle cancel editing
  const handleCancelEdit = () => {
    // Reset the form fields to the current values
    setFullName(userProfile?.full_name || "");
    setNameError(null);
    setIsEditing(false);
  };

  return (
    <SafeAreaWrapper>
      <ThemedView style={[styles.container, { backgroundColor }]}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.replace("/(tabs)/more")}
            activeOpacity={1}
          >
            <Ionicons name="arrow-back" size={21} color="#15803D" />
          </TouchableOpacity>
          <ThemedText style={styles.headerTitle}>Profile</ThemedText>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
        {/* Account information section — avatar uses same gradient as More */}
        <View
          style={[
            styles.section,
            {
              backgroundColor: cardBackgroundColor,
              borderColor: cardBorderColor,
            },
          ]}
        >
          <View style={styles.sectionContent}>
            <View style={styles.profileInline}>
              <View style={styles.avatarContainer}>
                <View style={styles.avatar}>
                  <LinearGradient
                    colors={[...profileGradientColors]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.avatarGradientFill}
                  >
                    <ThemedText style={styles.avatarText}>{initials}</ThemedText>
                  </LinearGradient>
                </View>
              </View>
              <View style={styles.profileInfo}>
                {isEditing ? (
                  <TextInput
                    style={[
                      styles.nameInput,
                      {
                        backgroundColor: inputBackgroundColor,
                        borderColor: nameError ? "#DC2626" : inputBorderColor,
                        color: textColor,
                      },
                      nameError ? styles.nameInputError : null,
                    ]}
                    value={fullName}
                    onChangeText={(value) => {
                      setFullName(
                        sanitizePersonNameInput(value).slice(
                          0,
                          MAX_FULL_NAME_LENGTH
                        )
                      );
                      if (nameError) setNameError(null);
                    }}
                    onBlur={() =>
                      setFullName((prev) => normalizeFullName(prev))
                    }
                    maxLength={MAX_FULL_NAME_LENGTH}
                    placeholder="Enter your full name"
                    placeholderTextColor={subTextColor}
                    autoCapitalize="words"
                  />
                ) : (
                  <ThemedText style={styles.nameText}>
                    {userProfile?.full_name || "Add your name"}
                  </ThemedText>
                )}
                {isEditing && nameError ? (
                  <ThemedText style={styles.nameErrorText}>{nameError}</ThemedText>
                ) : null}
              </View>

              {!isEditing && (
                <TouchableOpacity
                  style={styles.editIconButton}
                  onPress={() => setIsEditing(true)}
                  disabled={isLoading}
                >
                  <Ionicons
                    name="create-outline"
                    size={18}
                    color="#15803D"
                  />
                </TouchableOpacity>
              )}
            </View>

            {isEditing && (
              <View style={styles.editActionsRow}>
                <TouchableOpacity
                  style={[
                    styles.saveButton,
                    isLoading && styles.saveButtonDisabled,
                  ]}
                  onPress={handleSaveProfile}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <ThemedText style={styles.saveButtonText}>
                      Save
                    </ThemedText>
                  )}
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.cancelEditButton}
                  onPress={handleCancelEdit}
                  disabled={isLoading}
                >
                  <ThemedText style={styles.cancelEditButtonText}>
                    Cancel
                  </ThemedText>
                </TouchableOpacity>
              </View>
            )}

            <View style={styles.sectionDivider} />

            <View style={styles.infoRow}>
              <ThemedText style={[styles.infoLabel, { color: subTextColor }]}>
                Email:
              </ThemedText>
              <ThemedText style={styles.infoValue}>
                {user?.email || ""}
              </ThemedText>
            </View>

            <View style={styles.infoRow}>
              <ThemedText style={[styles.infoLabel, { color: subTextColor }]}>
                Member Since:
              </ThemedText>
              <ThemedText style={styles.infoValue}>
                {user?.created_at
                  ? new Date(user.created_at).toLocaleDateString()
                  : ""}
              </ThemedText>
            </View>
          </View>
        </View>
        </ScrollView>
      </ThemedView>
    </SafeAreaWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F3F4F6",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
    marginBottom: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
    position: "relative",
  },
  backButton: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "transparent",
    position: "absolute",
    left: 18,
    top: 8,
  },
  headerTitle: {
    fontSize: 30,
    lineHeight: 36,
    fontFamily: "PlusJakartaSans_700Bold",
    fontWeight: "800",
    color: "#197C47",
    letterSpacing: -0.5,
  },
  headerSpacer: {
    width: 36,
    height: 36,
    position: "absolute",
    right: 16,
  },
  editButton: {
    minWidth: 56,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 6,
  },
  editButtonText: {
    fontSize: 15,
    fontWeight: "500",
    color: "#166534",
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 120,
    alignItems: "center",
  },
  avatarContainer: {
    marginBottom: 0,
    position: "relative",
  },
  avatar: {
    width: 76,
    height: 76,
    borderRadius: 38,
    overflow: "hidden",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarGradientFill: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: {
    fontSize: 28,
    fontWeight: "700",
    color: "#FFFFFF",
    letterSpacing: 0.2,
  },
  profileInfo: {
    alignItems: "center",
    width: "100%",
    marginTop: 8,
  },
  profileInline: {
    width: "100%",
    flexDirection: "column",
    alignItems: "center",
    marginBottom: 6,
    position: "relative",
    paddingBottom: 2,
  },
  editIconButton: {
    position: "absolute",
    right: 0,
    bottom: 7,
    width: 32,
    height: 32,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "transparent",
  },
  nameText: {
    fontSize: 24,
    lineHeight: 30,
    fontFamily: "PlusJakartaSans_700Bold",
    fontWeight: "700",
    letterSpacing: -0.3,
    marginBottom: 4,
    color: "#111827",
  },
  nameInput: {
    fontSize: 18,
    fontWeight: "500",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1.2,
    borderColor: "#A7F3D0",
    marginBottom: 8,
    width: "100%",
    textAlign: "center",
  },
  nameInputError: {
    borderColor: "#DC2626",
  },
  nameErrorText: {
    width: "100%",
    marginTop: -2,
    marginBottom: 6,
    color: "#DC2626",
    fontSize: 12,
    fontWeight: "500",
    textAlign: "left",
  },
  editActionsRow: {
    width: "100%",
    flexDirection: "row",
    justifyContent: "center",
    gap: 6,
    marginTop: 2,
    marginBottom: 8,
  },
  cancelEditButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#D1D5DB",
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },
  cancelEditButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#475569",
  },
  saveButton: {
    backgroundColor: "#22C55E",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    minWidth: 70,
  },
  saveButtonDisabled: {
    backgroundColor: "#86EFAC",
  },
  saveButtonText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "600",
  },
  section: {
    borderRadius: 16,
    marginBottom: 16,
    overflow: "hidden",
    borderWidth: 1,
    shadowColor: "#000000",
    shadowOpacity: 0.04,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
    width: "100%",
    maxWidth: 420,
  },
  sectionContent: {
    padding: 16,
  },
  sectionDivider: {
    height: 1,
    backgroundColor: "rgba(17, 24, 39, 0.1)",
    marginVertical: 12,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 2,
  },
  infoLabel: {
    fontSize: 12,
    fontFamily: "PlusJakartaSans_600SemiBold",
    fontWeight: "600",
    color: "#4B5563",
    letterSpacing: 0.2,
  },
  infoValue: {
    flex: 1,
    textAlign: "right",
    fontSize: 14,
    fontFamily: "PlusJakartaSans_700Bold",
    fontWeight: "700",
    color: "#111827",
    marginLeft: 10,
  },
});
