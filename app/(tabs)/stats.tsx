import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { useAuth } from "@/contexts/AuthContext";
import { useSettings } from "@/contexts/SettingsContext";
import { useColorScheme } from "@/hooks/useColorScheme";
import { Ionicons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import React, { useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  TouchableOpacity,
  View,
} from "react-native";

// Update the Dropdown component with proper TypeScript types and styling to match the second screenshot
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
  return (
    <View style={styles.dropdownWrapper}>
      <TouchableOpacity
        style={styles.selector}
        onPress={onToggle}
        activeOpacity={0.7}
      >
        <ThemedText style={styles.selectorText}>
          {selectedValue || placeholder}
        </ThemedText>
        <Ionicons name="chevron-down" size={16} color="#71717A" />
      </TouchableOpacity>

      {isOpen && (
        <>
          <Pressable style={styles.backdropOverlay} onPress={onToggle} />
          <View style={styles.dropdownContainer}>
            <View style={styles.dropdownContent}>
              {options.map((item) => (
                <TouchableOpacity
                  key={item}
                  style={[
                    styles.dropdownItem,
                    selectedValue === item && styles.dropdownItemSelected,
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
                      color="#0284C7"
                      style={styles.checkmarkIcon}
                    />
                  )}
                  <ThemedText
                    style={[
                      styles.dropdownItemText,
                      selectedValue === item && styles.dropdownItemTextSelected,
                    ]}
                  >
                    {item}
                  </ThemedText>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </>
      )}
    </View>
  );
};

// Settings Screen component
export default function SettingsScreen() {
  const colorScheme = useColorScheme() ?? "light";
  const textColor = colorScheme === "light" ? "#000000" : "#FFFFFF";
  const subTextColor = colorScheme === "light" ? "#71717A" : "#A1A1AA";
  const cardBackgroundColor = colorScheme === "light" ? "#FFFFFF" : "#1E1F21";
  const borderColor = colorScheme === "light" ? "#F5F5F5" : "#27272A";
  const iconContainerBgLight = "#EEF2FF"; // Light blue for theme icon
  const iconContainerBgGreen = "#ECFDF5"; // Light green for language icon
  const { signOut } = useAuth();

  // Track which dropdown is currently open
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  // Use the settings context
  const {
    theme,
    setTheme,
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

  // Theme options and language options
  const themeOptions = ["Light", "Dark", "System"];
  const languageOptions = ["English", "Spanish", "French", "German"];

  // Display theme with capitalized first letter
  const displayTheme = theme.charAt(0).toUpperCase() + theme.slice(1);

  const handleToggleDropdown = (dropdownName: string) => {
    setOpenDropdown(openDropdown === dropdownName ? null : dropdownName);
  };

  return (
    <ThemedView style={styles.container}>
      <StatusBar style={colorScheme === "dark" ? "light" : "dark"} />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.appIconContainer}>
            <Ionicons name="file-tray-full-outline" size={24} color="#22C55E" />
          </View>
          <View style={styles.headerTextContainer}>
            <ThemedText style={styles.headerTitle}>FridgeWise</ThemedText>
            <ThemedText
              style={[styles.headerSubtitle, { color: subTextColor }]}
            >
              Smart Food Management
            </ThemedText>
          </View>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {/* App Settings Section */}
        <View
          style={[styles.section, { backgroundColor: cardBackgroundColor }]}
        >
          <View style={styles.sectionHeader}>
            <Ionicons
              name="settings-outline"
              size={18}
              color="#71717A"
              style={styles.sectionIcon}
            />
            <ThemedText style={styles.sectionTitle}>App Settings</ThemedText>
          </View>

          {/* Theme Setting */}
          <View style={[styles.settingItem, styles.themeSettingItem]}>
            <View
              style={[
                styles.settingIconContainer,
                { backgroundColor: iconContainerBgLight },
              ]}
            >
              <Ionicons name="sunny-outline" size={20} color="#4F46E5" />
            </View>
            <View style={styles.settingContent}>
              <ThemedText style={styles.settingTitle}>Theme</ThemedText>
              <ThemedText
                style={[styles.settingDescription, { color: "#71717A" }]}
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
                    setTheme(lowerValue);
                  }
                }}
                isOpen={openDropdown === "theme"}
                onToggle={() => handleToggleDropdown("theme")}
              />
            </View>
          </View>

          {/* Separator */}
          <View style={styles.settingsSeparator} />

          {/* Language Setting */}
          <View style={styles.settingItem}>
            <View
              style={[
                styles.settingIconContainer,
                { backgroundColor: iconContainerBgGreen },
              ]}
            >
              <Ionicons name="globe-outline" size={20} color="#10B981" />
            </View>
            <View style={styles.settingContent}>
              <ThemedText style={styles.settingTitle}>Language</ThemedText>
              <ThemedText
                style={[styles.settingDescription, { color: "#71717A" }]}
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
        </View>

        {/* Notifications Section */}
        <View
          style={[styles.section, { backgroundColor: cardBackgroundColor }]}
        >
          <View style={styles.sectionHeader}>
            <Ionicons
              name="notifications-outline"
              size={18}
              color="#71717A"
              style={styles.sectionIcon}
            />
            <ThemedText style={styles.sectionTitle}>Notifications</ThemedText>
          </View>

          {/* Expiry Alerts */}
          <View style={styles.settingItem}>
            <View style={styles.settingContent}>
              <ThemedText style={styles.settingTitle}>Expiry Alerts</ThemedText>
              <ThemedText
                style={[styles.settingDescription, { color: "#71717A" }]}
              >
                Get notified when items are expiring
              </ThemedText>
            </View>
            <Switch
              value={expiryAlerts}
              onValueChange={setExpiryAlerts}
              trackColor={{ false: "#D4D4D8", true: "#111827" }}
              thumbColor={expiryAlerts ? "#FFFFFF" : "#FFFFFF"}
              ios_backgroundColor="#D4D4D8"
              style={styles.switch}
            />
          </View>

          {/* Low Stock Alerts */}
          <View style={styles.settingItem}>
            <View style={styles.settingContent}>
              <ThemedText style={styles.settingTitle}>
                Low Stock Alerts
              </ThemedText>
              <ThemedText
                style={[styles.settingDescription, { color: "#71717A" }]}
              >
                Get notified when running low on items
              </ThemedText>
            </View>
            <Switch
              value={lowStockAlerts}
              onValueChange={setLowStockAlerts}
              trackColor={{ false: "#D4D4D8", true: "#111827" }}
              thumbColor={lowStockAlerts ? "#FFFFFF" : "#FFFFFF"}
              ios_backgroundColor="#D4D4D8"
              style={styles.switch}
            />
          </View>

          {/* Helpful Tips */}
          <View style={styles.settingItem}>
            <View style={styles.settingContent}>
              <ThemedText style={styles.settingTitle}>Helpful Tips</ThemedText>
              <ThemedText
                style={[styles.settingDescription, { color: "#71717A" }]}
              >
                Receive food storage tips and suggestions
              </ThemedText>
            </View>
            <Switch
              value={helpfulTips}
              onValueChange={setHelpfulTips}
              trackColor={{ false: "#D4D4D8", true: "#111827" }}
              thumbColor={helpfulTips ? "#FFFFFF" : "#FFFFFF"}
              ios_backgroundColor="#D4D4D8"
              style={styles.switch}
            />
          </View>

          {/* App Updates */}
          <View style={styles.settingItem}>
            <View style={styles.settingContent}>
              <ThemedText style={styles.settingTitle}>App Updates</ThemedText>
              <ThemedText
                style={[styles.settingDescription, { color: "#71717A" }]}
              >
                Get notified about new features
              </ThemedText>
            </View>
            <Switch
              value={appUpdates}
              onValueChange={setAppUpdates}
              trackColor={{ false: "#D4D4D8", true: "#111827" }}
              thumbColor={appUpdates ? "#FFFFFF" : "#FFFFFF"}
              ios_backgroundColor="#D4D4D8"
              style={styles.switch}
            />
          </View>
        </View>

        {/* Privacy & Data Section */}
        <View
          style={[styles.section, { backgroundColor: cardBackgroundColor }]}
        >
          <View style={styles.sectionHeader}>
            <Ionicons
              name="shield-outline"
              size={18}
              color="#71717A"
              style={styles.sectionIcon}
            />
            <ThemedText style={styles.sectionTitle}>Privacy & Data</ThemedText>
          </View>

          {/* Analytics */}
          <View style={styles.settingItem}>
            <View style={styles.settingContent}>
              <ThemedText style={styles.settingTitle}>Analytics</ThemedText>
              <ThemedText
                style={[styles.settingDescription, { color: "#71717A" }]}
              >
                Help improve the app with usage data
              </ThemedText>
            </View>
            <Switch
              value={analytics}
              onValueChange={setAnalytics}
              trackColor={{ false: "#D4D4D8", true: "#111827" }}
              thumbColor={analytics ? "#FFFFFF" : "#FFFFFF"}
              ios_backgroundColor="#D4D4D8"
              style={styles.switch}
            />
          </View>

          {/* Crash Reports */}
          <View style={styles.settingItem}>
            <View style={styles.settingContent}>
              <ThemedText style={styles.settingTitle}>Crash Reports</ThemedText>
              <ThemedText
                style={[styles.settingDescription, { color: "#71717A" }]}
              >
                Send crash reports to help fix issues
              </ThemedText>
            </View>
            <Switch
              value={crashReports}
              onValueChange={setCrashReports}
              trackColor={{ false: "#D4D4D8", true: "#111827" }}
              thumbColor={crashReports ? "#FFFFFF" : "#FFFFFF"}
              ios_backgroundColor="#D4D4D8"
              style={styles.switch}
            />
          </View>
        </View>

        {/* Support & Info Section */}
        <View
          style={[styles.section, { backgroundColor: cardBackgroundColor }]}
        >
          <View style={styles.sectionHeader}>
            <Ionicons
              name="help-buoy-outline"
              size={18}
              color="#71717A"
              style={styles.sectionIcon}
            />
            <ThemedText style={styles.sectionTitle}>Support & Info</ThemedText>
          </View>

          {/* Help Center */}
          <TouchableOpacity style={styles.linkItem} onPress={() => {}}>
            <View style={styles.linkIconContainer}>
              <Ionicons name="help-circle-outline" size={18} color="#71717A" />
            </View>
            <ThemedText style={styles.linkText}>Help Center</ThemedText>
          </TouchableOpacity>

          {/* About FridgeWise */}
          <TouchableOpacity style={styles.linkItem} onPress={() => {}}>
            <View style={styles.linkIconContainer}>
              <Ionicons
                name="information-circle-outline"
                size={18}
                color="#71717A"
              />
            </View>
            <ThemedText style={styles.linkText}>About FridgeWise</ThemedText>
          </TouchableOpacity>

          {/* Contact Support */}
          <TouchableOpacity style={styles.linkItem} onPress={() => {}}>
            <View style={styles.linkIconContainer}>
              <Ionicons name="mail-outline" size={18} color="#71717A" />
            </View>
            <ThemedText style={styles.linkText}>Contact Support</ThemedText>
          </TouchableOpacity>
        </View>

        {/* Sign Out Button */}
        <TouchableOpacity
          style={[styles.signOutButton, { borderColor: "#FF4A4A" }]}
          onPress={signOut}
        >
          <ThemedText style={styles.signOutText}>Sign Out</ThemedText>
        </TouchableOpacity>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F8FA",
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 15,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  appIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#DCFCE7",
  },
  headerTextContainer: {
    marginLeft: 10,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#111827",
  },
  headerSubtitle: {
    fontSize: 12,
    fontWeight: "400",
    color: "#71717A",
  },
  scrollView: {
    flex: 1,
  },
  section: {
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 16,
    borderRadius: 18,
    overflow: "hidden",
    backgroundColor: "#FFFFFF",
    paddingVertical: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: "#F1F5F9",
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 4,
  },
  sectionIcon: {
    marginRight: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
    letterSpacing: 0.2,
  },
  settingItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 4,
  },
  settingIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  settingContent: {
    flex: 1,
    marginRight: 8,
  },
  settingTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#000000",
    marginBottom: 2,
    letterSpacing: 0.1,
  },
  settingDescription: {
    fontSize: 13,
    fontWeight: "400",
    color: "#71717A",
    lineHeight: 18,
  },
  selector: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    width: 120,
    height: 36,
    backgroundColor: "#FFFFFF",
    borderColor: "#E4E4E7",
  },
  selectorText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#000000",
    letterSpacing: 0.1,
  },
  dropdownItemTextSelected: {
    fontWeight: "600",
    color: "#0284C7",
  },
  linkItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  linkIconContainer: {
    width: 24,
    height: 24,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  linkText: {
    fontSize: 14,
    fontWeight: "400",
    color: "#111827",
  },
  signOutButton: {
    marginHorizontal: 16,
    marginVertical: 24,
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  signOutText: {
    color: "#FF4A4A",
    fontWeight: "500",
  },
  switch: {
    transform: [{ scaleX: 0.9 }, { scaleY: 0.9 }],
  },
  dropdownWrapper: {
    position: "relative",
    zIndex: 1000,
    elevation: 1000,
  },
  backdropOverlay: {
    position: "absolute",
    top: -2000,
    left: -2000,
    right: -2000,
    bottom: -2000,
    zIndex: 999,
  },
  dropdownContainer: {
    position: "absolute",
    top: 40,
    left: 0,
    width: 120,
    borderRadius: 10,
    backgroundColor: "#FFFFFF",
    zIndex: 1001,
    elevation: 1001,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
  },
  dropdownContent: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    overflow: "hidden",
  },
  dropdownItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: "#FFFFFF",
  },
  checkmarkIcon: {
    marginRight: 8,
    width: 16,
  },
  dropdownItemSelected: {
    backgroundColor: "#F0F9FF",
  },
  dropdownItemText: {
    fontSize: 14,
    fontWeight: "400",
    color: "#1F2937",
    letterSpacing: 0.1,
  },
  settingsSeparator: {
    height: 1,
    backgroundColor: "#F1F5F9",
    marginHorizontal: 16,
    marginVertical: 8,
  },
  themeSettingItem: {
    paddingBottom: 8,
  },
  themeDropdownPosition: {
    position: "relative",
    zIndex: 1002,
    elevation: 1002,
  },
});
