import SafeAreaWrapper from "@/components/SafeAreaWrapper";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { useAuth } from "@/contexts/AuthContext";
import { useSettings } from "@/contexts/SettingsContext";
import { Ionicons } from "@expo/vector-icons";
import React, { useRef, useState } from "react";
import {
  Alert,
  Animated,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  TouchableOpacity,
  View,
} from "react-native";

// Dropdown component with proper TypeScript types and styling
interface DropdownProps {
  options: string[];
  selectedValue: string;
  onSelect: (value: string) => void;
  isOpen: boolean;
  onToggle: () => void;
  placeholder?: string;
}

const Dropdown = ({
  options,
  selectedValue,
  onSelect,
  isOpen,
  onToggle,
  placeholder = "Select...",
}: DropdownProps) => {
  const { effectiveTheme: theme } = useSettings();
  const isDark = theme === "dark";

  // Animation values
  const scaleAnim = useRef(new Animated.Value(0.95)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  // Run animation when dropdown is opened
  React.useEffect(() => {
    if (isOpen) {
      Animated.parallel([
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      // Reset animation values when dropdown is closed
      scaleAnim.setValue(0.95);
      opacityAnim.setValue(0);
    }
  }, [isOpen, scaleAnim, opacityAnim]);

  return (
    <View style={styles.dropdownWrapper}>
      <TouchableOpacity
        style={[
          styles.selector,
          isDark && { backgroundColor: "#1C1C1E", borderColor: "#2C2C2E" },
        ]}
        onPress={onToggle}
        activeOpacity={0.7}
      >
        <ThemedText style={styles.selectorText}>
          {selectedValue || placeholder}
        </ThemedText>
        <Ionicons
          name="chevron-down"
          size={16}
          color={isDark ? "#9BA1A6" : "#71717A"}
        />
      </TouchableOpacity>

      {isOpen && (
        <Modal
          transparent={true}
          animationType="none"
          visible={isOpen}
          onRequestClose={onToggle}
          statusBarTranslucent={true}
        >
          <View style={styles.backdropOverlay}>
            <Pressable style={styles.modalCentering} onPress={onToggle}>
              <Animated.View
                style={[
                  styles.dropdownContainer,
                  isDark && {
                    backgroundColor: "#1C1C1E",
                    borderColor: "#2C2C2E",
                  },
                  {
                    opacity: opacityAnim,
                    transform: [{ scale: scaleAnim }],
                  },
                ]}
              >
                <View
                  style={[
                    styles.dropdownContent,
                    isDark && { borderColor: "#2C2C2E" },
                  ]}
                >
                  {options.map((item) => (
                    <TouchableOpacity
                      key={item}
                      style={[
                        styles.dropdownItem,
                        selectedValue === item &&
                          (isDark
                            ? { backgroundColor: "#2C2C2E" }
                            : styles.dropdownItemSelected),
                      ]}
                      onPress={() => {
                        onSelect(item);
                        onToggle();
                      }}
                    >
                      {selectedValue === item && (
                        <Ionicons
                          name="checkmark"
                          size={16}
                          color={isDark ? "#22C55E" : "#0284C7"}
                          style={styles.checkmarkIcon}
                        />
                      )}
                      <ThemedText
                        style={[
                          styles.dropdownItemText,
                          selectedValue === item &&
                            styles.dropdownItemTextSelected,
                        ]}
                      >
                        {item}
                      </ThemedText>
                    </TouchableOpacity>
                  ))}
                </View>
              </Animated.View>
            </Pressable>
          </View>
        </Modal>
      )}
    </View>
  );
};

// Settings Screen component
export default function SettingsScreen() {
  const { effectiveTheme: theme } = useSettings();
  const isDark = theme === "dark";
  const cardBackgroundColor = isDark ? "#1C1C1E" : "#FFFFFF";
  const cardBorderColor = isDark ? "#2C2C2E" : "#F3F4F6";
  const subTextColor = isDark ? "#8E8E93" : "#666666";
  const primaryColor = "#22C55E"; // App's primary green color

  // Track which dropdown is currently open
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  // Use the settings context
  const {
    language,
    setLanguage,
    expiryAlerts,
    setExpiryAlerts,
    lowStockAlerts,
    setLowStockAlerts,
    helpfulTips,
    setHelpfulTips,
    appUpdates,
    setAppUpdates,
    analytics,
    setAnalytics,
    crashReports,
    setCrashReports,
  } = useSettings();

  const { user, userProfile } = useAuth();

  // Theme options and language options
  const themeOptions = ["Light", "Dark", "System"];
  const languageOptions = ["English", "Spanish", "French", "German"];

  // Display theme with capitalized first letter
  const displayTheme = theme.charAt(0).toUpperCase() + theme.slice(1);

  const handleToggleDropdown = (dropdownName: string) => {
    setOpenDropdown(openDropdown === dropdownName ? null : dropdownName);
  };

  return (
    <SafeAreaWrapper usePadding edges={["top"]}>
      <ThemedView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <ThemedText style={styles.headerTitle}>Settings</ThemedText>
          <ThemedText style={[styles.headerSubtitle, { color: subTextColor }]}>
            Configure app preferences
          </ThemedText>
        </View>

        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Account Section */}
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
                name="person-outline"
                size={18}
                color={subTextColor}
                style={styles.sectionIcon}
              />
              <ThemedText style={styles.sectionTitle}>Account</ThemedText>
            </View>

            {/* User Profile */}
            <TouchableOpacity
              style={styles.settingItem}
              onPress={() =>
                Alert.alert(
                  "Profile",
                  "Profile editing will be available in a future update."
                )
              }
            >
              <View style={styles.settingIconContainer}>
                <Ionicons
                  name="person-circle-outline"
                  size={20}
                  color="#FFFFFF"
                />
              </View>
              <View style={styles.settingContent}>
                <ThemedText style={styles.settingTitle}>
                  User Profile
                </ThemedText>
                <ThemedText
                  style={[styles.settingDescription, { color: subTextColor }]}
                >
                  {userProfile?.full_name ||
                    user?.email ||
                    "Edit your profile information"}
                </ThemedText>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#BBBBBB" />
            </TouchableOpacity>

            {/* Change Password */}
            <TouchableOpacity
              style={styles.settingItem}
              onPress={() =>
                Alert.alert(
                  "Change Password",
                  "Password change will be available in a future update."
                )
              }
            >
              <View style={styles.settingIconContainer}>
                <Ionicons name="key-outline" size={20} color="#FFFFFF" />
              </View>
              <View style={styles.settingContent}>
                <ThemedText style={styles.settingTitle}>
                  Change Password
                </ThemedText>
                <ThemedText
                  style={[styles.settingDescription, { color: subTextColor }]}
                >
                  Update your account password
                </ThemedText>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#BBBBBB" />
            </TouchableOpacity>
          </View>

          {/* App Preferences Section */}
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
                name="settings-outline"
                size={18}
                color={subTextColor}
                style={styles.sectionIcon}
              />
              <ThemedText style={styles.sectionTitle}>
                App Preferences
              </ThemedText>
            </View>

            {/* Theme Setting */}
            <View style={[styles.settingItem, styles.themeSettingItem]}>
              <View style={styles.settingIconContainer}>
                <Ionicons name="sunny-outline" size={20} color="#FFFFFF" />
              </View>
              <View style={styles.settingContent}>
                <ThemedText style={styles.settingTitle}>Theme</ThemedText>
                <ThemedText
                  style={[styles.settingDescription, { color: subTextColor }]}
                >
                  Choose your preferred theme
                </ThemedText>
              </View>
              <View style={styles.themeDropdownPosition}>
                <Dropdown
                  options={themeOptions}
                  selectedValue={displayTheme}
                  onSelect={(value: string) => {
                    const lowerValue = value.toLowerCase();
                    if (
                      lowerValue === "light" ||
                      lowerValue === "dark" ||
                      lowerValue === "system"
                    ) {
                      // setTheme(lowerValue); // This line was removed from useSettings
                    }
                  }}
                  isOpen={openDropdown === "theme"}
                  onToggle={() => handleToggleDropdown("theme")}
                />
              </View>
            </View>

            {/* Language Setting */}
            <View style={styles.settingItem}>
              <View style={styles.settingIconContainer}>
                <Ionicons name="globe-outline" size={20} color="#FFFFFF" />
              </View>
              <View style={styles.settingContent}>
                <ThemedText style={styles.settingTitle}>Language</ThemedText>
                <ThemedText
                  style={[styles.settingDescription, { color: subTextColor }]}
                >
                  Select your language
                </ThemedText>
              </View>
              <View style={styles.themeDropdownPosition}>
                <Dropdown
                  options={languageOptions}
                  selectedValue={language}
                  onSelect={setLanguage}
                  isOpen={openDropdown === "language"}
                  onToggle={() => handleToggleDropdown("language")}
                />
              </View>
            </View>

            {/* Helpful Tips Setting */}
            <View style={styles.settingItem}>
              <View style={styles.settingIconContainer}>
                <Ionicons name="bulb-outline" size={20} color="#FFFFFF" />
              </View>
              <View style={styles.settingContent}>
                <ThemedText style={styles.settingTitle}>
                  Helpful Tips
                </ThemedText>
                <ThemedText
                  style={[styles.settingDescription, { color: subTextColor }]}
                >
                  Show tips on the dashboard
                </ThemedText>
              </View>
              <Switch
                value={helpfulTips}
                onValueChange={setHelpfulTips}
                trackColor={{ false: "#D1D5DB", true: primaryColor }}
                thumbColor="#FFFFFF"
                ios_backgroundColor="#D1D5DB"
              />
            </View>
          </View>

          {/* Notifications Section */}
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
                name="notifications-outline"
                size={18}
                color={subTextColor}
                style={styles.sectionIcon}
              />
              <ThemedText style={styles.sectionTitle}>Notifications</ThemedText>
            </View>

            {/* Expiry Alerts */}
            <View style={styles.settingItem}>
              <View style={styles.settingIconContainer}>
                <Ionicons
                  name="alert-circle-outline"
                  size={20}
                  color="#FFFFFF"
                />
              </View>
              <View style={styles.settingContent}>
                <ThemedText style={styles.settingTitle}>
                  Expiry Alerts
                </ThemedText>
                <ThemedText
                  style={[styles.settingDescription, { color: subTextColor }]}
                >
                  Notify when items are about to expire
                </ThemedText>
              </View>
              <Switch
                value={expiryAlerts}
                onValueChange={setExpiryAlerts}
                trackColor={{ false: "#D1D5DB", true: primaryColor }}
                thumbColor="#FFFFFF"
                ios_backgroundColor="#D1D5DB"
              />
            </View>

            {/* Low Stock Alerts */}
            <View style={styles.settingItem}>
              <View style={styles.settingIconContainer}>
                <Ionicons name="warning-outline" size={20} color="#FFFFFF" />
              </View>
              <View style={styles.settingContent}>
                <ThemedText style={styles.settingTitle}>
                  Low Stock Alerts
                </ThemedText>
                <ThemedText
                  style={[styles.settingDescription, { color: subTextColor }]}
                >
                  Notify when items are running low
                </ThemedText>
              </View>
              <Switch
                value={lowStockAlerts}
                onValueChange={setLowStockAlerts}
                trackColor={{ false: "#D1D5DB", true: primaryColor }}
                thumbColor="#FFFFFF"
                ios_backgroundColor="#D1D5DB"
              />
            </View>

            {/* App Updates */}
            <View style={styles.settingItem}>
              <View style={styles.settingIconContainer}>
                <Ionicons name="download-outline" size={20} color="#FFFFFF" />
              </View>
              <View style={styles.settingContent}>
                <ThemedText style={styles.settingTitle}>App Updates</ThemedText>
                <ThemedText
                  style={[styles.settingDescription, { color: subTextColor }]}
                >
                  Notify about new app versions
                </ThemedText>
              </View>
              <Switch
                value={appUpdates}
                onValueChange={setAppUpdates}
                trackColor={{ false: "#D1D5DB", true: primaryColor }}
                thumbColor="#FFFFFF"
                ios_backgroundColor="#D1D5DB"
              />
            </View>
          </View>

          {/* Data & Privacy Section */}
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
                name="shield-outline"
                size={18}
                color={subTextColor}
                style={styles.sectionIcon}
              />
              <ThemedText style={styles.sectionTitle}>
                Data & Privacy
              </ThemedText>
            </View>

            {/* Data Backup & Restore */}
            <TouchableOpacity
              style={styles.settingItem}
              onPress={() =>
                Alert.alert(
                  "Data Backup",
                  "Backup and restore functionality will be available in a future update."
                )
              }
            >
              <View style={styles.settingIconContainer}>
                <Ionicons name="save-outline" size={20} color="#FFFFFF" />
              </View>
              <View style={styles.settingContent}>
                <ThemedText style={styles.settingTitle}>
                  Data Backup & Restore
                </ThemedText>
                <ThemedText
                  style={[styles.settingDescription, { color: subTextColor }]}
                >
                  Back up or restore your data
                </ThemedText>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#BBBBBB" />
            </TouchableOpacity>

            {/* Analytics */}
            <View style={styles.settingItem}>
              <View style={styles.settingIconContainer}>
                <Ionicons name="analytics-outline" size={20} color="#FFFFFF" />
              </View>
              <View style={styles.settingContent}>
                <ThemedText style={styles.settingTitle}>Analytics</ThemedText>
                <ThemedText
                  style={[styles.settingDescription, { color: subTextColor }]}
                >
                  Allow anonymous usage data
                </ThemedText>
              </View>
              <Switch
                value={analytics}
                onValueChange={setAnalytics}
                trackColor={{ false: "#D1D5DB", true: primaryColor }}
                thumbColor="#FFFFFF"
                ios_backgroundColor="#D1D5DB"
              />
            </View>

            {/* Crash Reports */}
            <View style={styles.settingItem}>
              <View style={styles.settingIconContainer}>
                <Ionicons name="bug-outline" size={20} color="#FFFFFF" />
              </View>
              <View style={styles.settingContent}>
                <ThemedText style={styles.settingTitle}>
                  Crash Reports
                </ThemedText>
                <ThemedText
                  style={[styles.settingDescription, { color: subTextColor }]}
                >
                  Send anonymous crash reports
                </ThemedText>
              </View>
              <Switch
                value={crashReports}
                onValueChange={setCrashReports}
                trackColor={{ false: "#D1D5DB", true: primaryColor }}
                thumbColor="#FFFFFF"
                ios_backgroundColor="#D1D5DB"
              />
            </View>

            {/* Privacy Policy */}
            <TouchableOpacity
              style={styles.settingItem}
              onPress={() =>
                Alert.alert(
                  "Privacy Policy",
                  "Our privacy policy details how we collect, use, and protect your data. The full policy will be available in a future update."
                )
              }
            >
              <View style={styles.settingIconContainer}>
                <Ionicons
                  name="document-text-outline"
                  size={20}
                  color="#FFFFFF"
                />
              </View>
              <View style={styles.settingContent}>
                <ThemedText style={styles.settingTitle}>
                  Privacy Policy
                </ThemedText>
                <ThemedText
                  style={[styles.settingDescription, { color: subTextColor }]}
                >
                  Read our privacy policy
                </ThemedText>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#BBBBBB" />
            </TouchableOpacity>
          </View>
        </ScrollView>
      </ThemedView>
    </SafeAreaWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 16,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "700",
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    fontWeight: "400",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
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
  settingItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  themeSettingItem: {
    position: "relative",
  },
  settingIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20, // Make it circular
    backgroundColor: "#22C55E", // Use app's primary green color
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 2,
  },
  settingDescription: {
    fontSize: 13,
  },
  settingsSeparator: {
    height: 1,
    marginHorizontal: 16,
    backgroundColor: "rgba(150, 150, 150, 0.1)",
  },
  themeDropdownPosition: {
    minWidth: 100,
  },
  dropdownWrapper: {
    position: "relative",
    zIndex: 10,
  },
  selector: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: "#E4E4E7",
    borderRadius: 8,
    backgroundColor: "#FFFFFF",
  },
  selectorText: {
    fontSize: 14,
    fontWeight: "500",
    marginRight: 8,
  },
  backdropOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  modalCentering: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  dropdownContainer: {
    width: 180,
    backgroundColor: "white",
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 8,
  },
  dropdownContent: {
    borderRadius: 12,
    overflow: "hidden",
  },
  dropdownItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  dropdownItemSelected: {
    backgroundColor: "#F0F9FF",
  },
  dropdownItemText: {
    fontSize: 14,
    fontWeight: "400",
  },
  dropdownItemTextSelected: {
    fontWeight: "500",
    color: "#0284C7",
  },
  checkmarkIcon: {
    marginRight: 8,
  },
});
