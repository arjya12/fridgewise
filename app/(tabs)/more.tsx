/**
 * More Screen
 * Consolidates secondary features and administrative functions
 * Provides access to Settings, Reports, Help, and other features
 */

import SafeAreaWrapper from "@/components/SafeAreaWrapper";
import { ThemedView } from "@/components/ThemedView";
import { useAuth } from "@/contexts/AuthContext";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import React from "react";
import {
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

// =============================================================================
// INTERFACES
// =============================================================================

interface MenuSection {
  title: string;
  items: MenuItem[];
}

interface MenuItem {
  id: string;
  title: string;
  description: string;
  icon: string;
  iconType: "ionicons" | "material";
  action: () => void;
  showChevron?: boolean;
  destructive?: boolean;
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export default function MoreScreen() {
  const { user, signOut } = useAuth();

  // Updated color scheme - minimalist grey/greyscale
  const backgroundColor = "#FAFAFA";
  const cardBackgroundColor = "#FFFFFF";
  const cardBorderColor = "#E5E7EB";
  const textColor = "#111827";
  const subTextColor = "#6B7280";
  const dividerColor = "#E5E7EB";
  const profileBorderColor = "#D1D5DB";

  // =============================================================================
  // NAVIGATION ACTIONS
  // =============================================================================

  const navigateToSettings = () => {
    router.push("/(tabs)/settings");
  };

  const navigateToProfile = () => {
    router.push("/(tabs)/profile");
  };

  const generateWasteReport = () => {
    router.push("/(tabs)/waste-report");
  };

  const generateConsumptionReport = () => {
    router.push("/(tabs)/consumption-report");
  };

  const showHelpCenter = () => {
    Alert.alert(
      "Help Center",
      "The help center would provide:\n\n• Getting started guides\n• Frequently asked questions\n• Video tutorials\n• Troubleshooting tips\n• Feature explanations",
      [{ text: "OK" }]
    );
  };

  const sendFeedback = () => {
    Alert.alert(
      "Send Feedback",
      "Your feedback helps us improve FridgeWise! This would open a feedback form where you can:\n\n• Report bugs\n• Suggest new features\n• Share your experience\n• Rate the app",
      [{ text: "OK" }]
    );
  };

  const showAbout = () => {
    Alert.alert(
      "About FridgeWise",
      "FridgeWise v1.0.0\n\nA smart food expiry tracking app that helps you:\n• Reduce food waste\n• Save money\n• Plan meals efficiently\n• Manage your kitchen inventory\n\nDeveloped with ❤️ for better food management.",
      [{ text: "OK" }]
    );
  };

  const handleSignOut = () => {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign Out",
        style: "destructive",
        onPress: async () => {
          try {
            await signOut();
            router.replace("/(auth)/welcome");
          } catch (error: any) {
            console.error("Sign out error:", error);
            Alert.alert("Error", "Failed to sign out. Please try again.");
          }
        },
      },
    ]);
  };

  // =============================================================================
  // MENU CONFIGURATION
  // =============================================================================

  const menuSections: MenuSection[] = [
    {
      title: "Account",
      items: [
        {
          id: "settings",
          title: "Settings",
          description: "App preferences and configuration",
          icon: "settings-outline",
          iconType: "ionicons",
          action: navigateToSettings,
          showChevron: true,
        },
      ],
    },
    {
      title: "Reports & Analytics",
      items: [
        {
          id: "waste-report",
          title: "Waste Report",
          description: "View your food waste statistics",
          icon: "bar-chart",
          iconType: "material",
          action: generateWasteReport,
          showChevron: true,
        },
        {
          id: "consumption-report",
          title: "Consumption Report",
          description: "See what items you use most",
          icon: "pie-chart",
          iconType: "material",
          action: generateConsumptionReport,
          showChevron: true,
        },
      ],
    },
    {
      title: "Support & Info",
      items: [
        {
          id: "help",
          title: "Help Center",
          description: "Find answers to common questions",
          icon: "help-circle-outline",
          iconType: "ionicons",
          action: showHelpCenter,
          showChevron: true,
        },
        {
          id: "feedback",
          title: "Send Feedback",
          description: "Help us improve FridgeWise",
          icon: "chatbubble-outline",
          iconType: "ionicons",
          action: sendFeedback,
          showChevron: true,
        },
        {
          id: "about",
          title: "About FridgeWise",
          description: "App version and information",
          icon: "information-circle-outline",
          iconType: "ionicons",
          action: showAbout,
          showChevron: true,
        },
      ],
    },
  ];

  // =============================================================================
  // RENDER HELPERS
  // =============================================================================

  const renderMenuItem = (item: MenuItem) => (
    <TouchableOpacity
      key={item.id}
      style={[
        styles.menuCard,
        {
          backgroundColor: cardBackgroundColor,
          borderColor: cardBorderColor,
        },
      ]}
      onPress={item.action}
      activeOpacity={0.7}
    >
      <View style={styles.menuItemContent}>
        {/* Icon */}
        <View style={[styles.iconContainer, { backgroundColor: "#F9FAFB" }]}>
          {item.iconType === "ionicons" ? (
            <Ionicons name={item.icon as any} size={22} color={subTextColor} />
          ) : (
            <MaterialIcons
              name={item.icon as any}
              size={22}
              color={subTextColor}
            />
          )}
        </View>

        {/* Content */}
        <View style={styles.menuItemInfo}>
          <Text style={[styles.menuItemTitle, { color: textColor }]}>
            {item.title}
          </Text>
          <Text style={[styles.menuItemDescription, { color: subTextColor }]}>
            {item.description}
          </Text>
        </View>

        {/* Chevron */}
        {item.showChevron && (
          <Ionicons name="chevron-forward" size={18} color={subTextColor} />
        )}
      </View>
    </TouchableOpacity>
  );

  const renderSection = (section: MenuSection) => (
    <View key={section.title} style={styles.section}>
      {section.title && (
        <Text style={[styles.sectionTitle, { color: subTextColor }]}>
          {section.title.toUpperCase()}
        </Text>
      )}
      <View style={styles.sectionCards}>
        {section.items.map((item) => renderMenuItem(item))}
      </View>
    </View>
  );

  const renderSignOutCard = () => (
    <TouchableOpacity
      style={[
        styles.signOutCard,
        {
          backgroundColor: cardBackgroundColor,
          borderColor: cardBorderColor,
        },
      ]}
      onPress={handleSignOut}
      activeOpacity={0.7}
    >
      <View style={styles.menuItemContent}>
        {/* Icon */}
        <View style={[styles.iconContainer, { backgroundColor: "#FEF2F2" }]}>
          <Ionicons name="log-out-outline" size={22} color="#EF4444" />
        </View>

        {/* Content */}
        <View style={styles.menuItemInfo}>
          <Text style={[styles.menuItemTitle, { color: "#EF4444" }]}>
            Sign Out
          </Text>
          <Text style={[styles.menuItemDescription, { color: subTextColor }]}>
            Sign out of your account
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaWrapper usePadding edges={["top"]}>
      <ThemedView style={[styles.container, { backgroundColor }]}>
        {/* Profile Header */}
        <View style={styles.profileHeader}>
          {/* Large circular profile picture placeholder */}
          <TouchableOpacity
            style={[styles.profilePicture, { borderColor: profileBorderColor }]}
            onPress={navigateToProfile}
            activeOpacity={0.7}
          >
            <Ionicons name="person-outline" size={40} color={subTextColor} />
          </TouchableOpacity>

          {/* User email */}
          <Text style={[styles.userEmail, { color: textColor }]}>
            {user?.email || "user@example.com"}
          </Text>

          {/* Horizontal divider */}
          <View style={[styles.divider, { backgroundColor: dividerColor }]} />
        </View>

        {/* Menu Sections */}
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {menuSections.map(renderSection)}

          {/* Sign Out Card - Visually separated destructive action */}
          <View style={styles.signOutSection}>{renderSignOutCard()}</View>
        </ScrollView>
      </ThemedView>
    </SafeAreaWrapper>
  );
}

// =============================================================================
// STYLES
// =============================================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  profileHeader: {
    alignItems: "center",
    paddingTop: 20,
    paddingBottom: 24,
    paddingHorizontal: 20,
  },
  profilePicture: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 2,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    marginBottom: 16,
  },
  userEmail: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 24,
  },
  divider: {
    height: 1,
    width: "100%",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 130,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "600",
    letterSpacing: 0.8,
    marginBottom: 16,
    marginLeft: 4,
  },
  sectionCards: {
    gap: 12,
  },
  menuCard: {
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  signOutSection: {
    marginTop: 12,
  },
  signOutCard: {
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  menuItemContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  menuItemInfo: {
    flex: 1,
  },
  menuItemTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 2,
  },
  menuItemDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
});
