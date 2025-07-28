import SafeAreaWrapper from "@/components/SafeAreaWrapper";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Platform,
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
  const [avatarUrl, setAvatarUrl] = useState<string | null>(
    userProfile?.avatar_url || null
  );
  const [uploadingImage, setUploadingImage] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Fixed light theme colors
  const backgroundColor = "#F9FAFB";
  const cardBackgroundColor = "#FFFFFF";
  const cardBorderColor = "#F3F4F6";
  const textColor = "#000000";
  const subTextColor = "#666666";
  const inputBackgroundColor = "#F9FAFB";
  const inputBorderColor = "#E5E7EB";

  // Request permission for image picker
  useEffect(() => {
    (async () => {
      if (Platform.OS !== "web") {
        const { status } =
          await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== "granted") {
          Alert.alert(
            "Permission Required",
            "Sorry, we need camera roll permissions to upload images!"
          );
        }
      }
    })();
  }, []);

  // Handle image picking
  const pickImage = async () => {
    if (!isEditing) return;

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const selectedAsset = result.assets[0];
        await uploadImage(selectedAsset.uri);
      }
    } catch (error) {
      console.error("Error picking image:", error);
      Alert.alert("Error", "Failed to pick image");
    }
  };

  // Upload image to Supabase Storage
  const uploadImage = async (uri: string) => {
    if (!user) return;

    setUploadingImage(true);
    try {
      // Convert image to blob
      const response = await fetch(uri);
      const blob = await response.blob();

      // Generate a unique file name
      const fileExt = uri.split(".").pop();
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from("profiles")
        .upload(filePath, blob);

      if (uploadError) {
        throw uploadError;
      }

      // Get the public URL
      const { data } = supabase.storage.from("profiles").getPublicUrl(filePath);

      if (data) {
        // Update avatar URL in state
        setAvatarUrl(data.publicUrl);
      }
    } catch (error: any) {
      console.error("Error uploading image:", error);
      Alert.alert("Error", error.message || "Failed to upload image");
    } finally {
      setUploadingImage(false);
    }
  };

  // Handle save profile changes
  const handleSaveProfile = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      // Update the user profile using the AuthContext method
      const updatedProfile = await updateUserProfile({
        full_name: fullName,
        avatar_url: avatarUrl,
      });

      if (!updatedProfile) {
        throw new Error("Failed to update profile");
      }

      // Exit edit mode
      setIsEditing(false);
      Alert.alert("Success", "Profile updated successfully");
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
    setAvatarUrl(userProfile?.avatar_url || null);
    setIsEditing(false);
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
          <ThemedText style={styles.headerTitle}>Profile</ThemedText>
          <TouchableOpacity
            style={styles.editButton}
            onPress={() =>
              isEditing ? handleCancelEdit() : setIsEditing(true)
            }
            disabled={isLoading || uploadingImage}
          >
            <ThemedText style={styles.editButtonText}>
              {isEditing ? "Cancel" : "Edit"}
            </ThemedText>
          </TouchableOpacity>
        </View>

        {/* Profile content */}
        <View
          style={[
            styles.profileCard,
            {
              backgroundColor: cardBackgroundColor,
              borderColor: cardBorderColor,
            },
          ]}
        >
          {/* Profile avatar */}
          <TouchableOpacity
            style={styles.avatarContainer}
            onPress={pickImage}
            disabled={!isEditing || uploadingImage}
          >
            {uploadingImage ? (
              <View
                style={[
                  styles.avatar,
                  { backgroundColor: isDark ? "#2C2C2E" : "#E5E7EB" },
                ]}
              >
                <ActivityIndicator size="large" color="#22C55E" />
              </View>
            ) : avatarUrl ? (
              <Image
                source={{ uri: avatarUrl }}
                style={styles.avatar}
                resizeMode="cover"
              />
            ) : (
              <View
                style={[
                  styles.avatar,
                  { backgroundColor: isDark ? "#2C2C2E" : "#E5E7EB" },
                ]}
              >
                <Ionicons
                  name="person"
                  size={60}
                  color={isDark ? "#8E8E93" : "#9CA3AF"}
                />
              </View>
            )}

            {isEditing && (
              <View style={styles.editAvatarBadge}>
                <Ionicons name="camera" size={18} color="#FFFFFF" />
              </View>
            )}
          </TouchableOpacity>

          {/* Profile information */}
          <View style={styles.profileInfo}>
            {isEditing ? (
              <TextInput
                style={[
                  styles.nameInput,
                  {
                    backgroundColor: inputBackgroundColor,
                    borderColor: inputBorderColor,
                    color: textColor,
                  },
                ]}
                value={fullName}
                onChangeText={setFullName}
                placeholder="Enter your full name"
                placeholderTextColor={subTextColor}
              />
            ) : (
              <ThemedText style={styles.nameText}>
                {userProfile?.full_name || "Add your name"}
              </ThemedText>
            )}

            <ThemedText style={[styles.emailText, { color: subTextColor }]}>
              {user?.email || ""}
            </ThemedText>
          </View>

          {/* Save button (only visible in edit mode) */}
          {isEditing && (
            <TouchableOpacity
              style={[
                styles.saveButton,
                (isLoading || uploadingImage) && styles.saveButtonDisabled,
              ]}
              onPress={handleSaveProfile}
              disabled={isLoading || uploadingImage}
            >
              {isLoading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <ThemedText style={styles.saveButtonText}>
                  Save Changes
                </ThemedText>
              )}
            </TouchableOpacity>
          )}
        </View>

        {/* Account information section */}
        <View
          style={[
            styles.section,
            {
              backgroundColor: cardBackgroundColor,
              borderColor: cardBorderColor,
            },
          ]}
        >
          <View style={styles.sectionHeader}>
            <Ionicons
              name="information-circle-outline"
              size={18}
              color={subTextColor}
              style={styles.sectionIcon}
            />
            <ThemedText style={styles.sectionTitle}>
              Account Information
            </ThemedText>
          </View>

          <View style={styles.sectionContent}>
            <View style={styles.infoRow}>
              <ThemedText style={[styles.infoLabel, { color: subTextColor }]}>
                Email
              </ThemedText>
              <ThemedText style={styles.infoValue}>
                {user?.email || ""}
              </ThemedText>
            </View>

            <View style={styles.infoRow}>
              <ThemedText style={[styles.infoLabel, { color: subTextColor }]}>
                Member Since
              </ThemedText>
              <ThemedText style={styles.infoValue}>
                {user?.created_at
                  ? new Date(user.created_at).toLocaleDateString()
                  : ""}
              </ThemedText>
            </View>
          </View>
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
  editButton: {
    padding: 8,
  },
  editButtonText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#22C55E", // App's primary green color
  },
  profileCard: {
    borderRadius: 16,
    padding: 24,
    marginBottom: 24,
    alignItems: "center",
    borderWidth: 1,
  },
  avatarContainer: {
    marginBottom: 16,
    position: "relative",
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: "center",
    alignItems: "center",
  },
  editAvatarBadge: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: "#22C55E",
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: "#FFFFFF",
  },
  profileInfo: {
    alignItems: "center",
    width: "100%",
  },
  nameText: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 8,
  },
  nameInput: {
    fontSize: 20,
    fontWeight: "500",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 8,
    width: "100%",
    textAlign: "center",
  },
  emailText: {
    fontSize: 16,
    marginBottom: 16,
  },
  saveButton: {
    backgroundColor: "#22C55E",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    marginTop: 16,
    width: "100%",
    alignItems: "center",
  },
  saveButtonDisabled: {
    backgroundColor: "#86EFAC",
  },
  saveButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  section: {
    borderRadius: 16,
    marginBottom: 16,
    overflow: "hidden",
    borderWidth: 1,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(150, 150, 150, 0.1)",
  },
  sectionIcon: {
    marginRight: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
  },
  sectionContent: {
    padding: 16,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
  },
  infoLabel: {
    fontSize: 14,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: "500",
  },
});
