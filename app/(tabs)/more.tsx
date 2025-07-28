/**
 * More Screen
 * Consolidates secondary features and administrative functions
 * Provides access to Settings, Profile, Reports, Help, and other features
 */

import SafeAreaWrapper from "@/components/SafeAreaWrapper";
import { ThemedText } from "@/components/ThemedText";
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

  // Fixed light theme colors
  const backgroundColor = "#F9FAFB";
  const cardBackgroundColor = "#FFFFFF";
  const cardBorderColor = "#F3F4F6";
  const textColor = "#1F2937";
  const subTextColor = "#6B7280";
  const primaryColor = "#22C55E";

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
    Alert.alert(
      "Waste Report",
      "Food waste report functionality would be implemented here. This would analyze your usage patterns and provide insights on reducing waste.",
      [{ text: "OK" }]
    );
  };

  const generateConsumptionReport = () => {
    Alert.alert(
      "Consumption Report",
      "Consumption analysis would show your most used items, consumption patterns, and optimization suggestions.",
      [{ text: "OK" }]
    );
  };

  const generateShoppingList = () => {
    router.push("/(tabs)/shopping-list");
  };

  const exportData = () => {
    Alert.alert("Export Data", "Choose export format:", [
      { text: "Cancel", style: "cancel" },
      {
        text: "CSV",
        onPress: () => {
          Alert.alert(
            "Export CSV",
            "Your inventory data would be exported as a CSV file for use in spreadsheet applications.",
            [{ text: "OK" }]
          );
        },
      },
      {
        text: "PDF",
        onPress: () => {
          Alert.alert(
            "Export PDF",
            "Your inventory data would be exported as a formatted PDF report.",
            [{ text: "OK" }]
          );
        },
      },
    ]);
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
          id: "profile",
          title: "Profile",
          description: "Manage your account and preferences",
          icon: "person-outline",
          iconType: "ionicons",
          action: navigateToProfile,
          showChevron: true,
        },
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
      title: "Tools",
      items: [
        {
          id: "shopping-list",
          title: "Generate Shopping List",
          description: "Create a list from low stock items",
          icon: "basket-outline",
          iconType: "ionicons",
          action: generateShoppingList,
          showChevron: true,
        },
        {
          id: "export-data",
          title: "Export Data",
          description: "Export your inventory data",
          icon: "download-outline",
          iconType: "ionicons",
          action: exportData,
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
    {
      title: "",
      items: [
        {
          id: "sign-out",
          title: "Sign Out",
          description: "Sign out of your account",
          icon: "log-out-outline",
          iconType: "ionicons",
          action: handleSignOut,
          destructive: true,
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
        styles.menuItem,
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
        <View
          style={[
            styles.iconContainer,
            { backgroundColor: item.destructive ? "#FEE2E2" : "#F0FDF4" },
          ]}
        >
          {item.iconType === "ionicons" ? (
            <Ionicons
              name={item.icon as any}
              size={24}
              color={item.destructive ? "#DC2626" : primaryColor}
            />
          ) : (
            <MaterialIcons
              name={item.icon as any}
              size={24}
              color={item.destructive ? "#DC2626" : primaryColor}
            />
          )}
        </View>

        {/* Content */}
        <View style={styles.menuItemInfo}>
          <Text
            style={[
              styles.menuItemTitle,
              {
                color: item.destructive ? "#DC2626" : textColor,
              },
            ]}
          >
            {item.title}
          </Text>
          <Text style={[styles.menuItemDescription, { color: subTextColor }]}>
            {item.description}
          </Text>
        </View>

        {/* Chevron */}
        {item.showChevron && (
          <Ionicons name="chevron-forward" size={20} color={subTextColor} />
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
      <View style={styles.sectionContent}>
        {section.items.map((item, index) => (
          <View key={item.id}>
            {renderMenuItem(item)}
            {index < section.items.length - 1 && (
              <View
                style={[styles.separator, { backgroundColor: cardBorderColor }]}
              />
            )}
          </View>
        ))}
      </View>
    </View>
  );

  return (
    <SafeAreaWrapper usePadding edges={["top"]}>
      <ThemedView style={[styles.container, { backgroundColor }]}>
        {/* Header */}
        <View style={styles.header}>
          <ThemedText style={styles.title}>More</ThemedText>
          <Text style={[styles.subtitle, { color: subTextColor }]}>
            {user?.email || "Settings and additional features"}
          </Text>
        </View>

        {/* Menu Sections */}
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {menuSections.map(renderSection)}
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
  header: {
    padding: 20,
    paddingBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "600",
    letterSpacing: 0.4,
    marginBottom: 12,
    marginLeft: 4,
  },
  sectionContent: {
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#F3F4F6",
  },
  menuItem: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  menuItemContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
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
  },
  separator: {
    height: 1,
    marginLeft: 68,
  },
});
