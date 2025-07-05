import SafeAreaWrapper from "@/components/SafeAreaWrapper";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { useAuth } from "@/contexts/AuthContext";
import { useColorScheme } from "@/hooks/useColorScheme";
import { foodItemsService } from "@/services/foodItems";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function MenuScreen() {
  const { signOut, user } = useAuth();
  const [loading, setLoading] = useState(false);
  const theme = useColorScheme();
  const isDark = theme === "dark";
  const cardBackgroundColor = isDark ? "#1C1C1E" : "#FFFFFF";
  const cardBorderColor = isDark ? "#2C2C2E" : "#F3F4F6";
  const subTextColor = isDark ? "#8E8E93" : "#666666";
  const primaryColor = "#22C55E"; // App's primary green color

  // Handle sign out
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
          }
        },
      },
    ]);
  };

  // Generate reports
  const generateWasteReport = async () => {
    setLoading(true);
    try {
      // Get the current date
      const today = new Date();

      // Get the date from 30 days ago
      const lastMonth = new Date();
      lastMonth.setDate(today.getDate() - 30);

      // Get usage stats
      const stats = await foodItemsService.getUsageStats(lastMonth, today);

      Alert.alert(
        "Waste Report (Last 30 Days)",
        `Total Used: ${stats.totalUsed} items\nExpired: ${
          stats.totalExpired
        } items\nWasted: ${
          stats.totalWasted
        } items\n\nWaste Percentage: ${stats.wastePercentage.toFixed(1)}%`,
        [{ text: "OK" }]
      );
    } catch (error) {
      console.error("Error generating waste report:", error);
      Alert.alert("Error", "Failed to generate waste report");
    } finally {
      setLoading(false);
    }
  };

  const generateConsumptionReport = async () => {
    setLoading(true);
    try {
      // In a real app, this would fetch actual consumption data
      // For now, we'll show a placeholder
      Alert.alert(
        "Consumption Report",
        "Your most consumed items in the last 30 days:\n\n1. Milk (8 units)\n2. Eggs (6 units)\n3. Bread (5 units)\n4. Cheese (4 units)\n5. Yogurt (3 units)",
        [{ text: "OK" }]
      );
    } catch (error) {
      console.error("Error generating consumption report:", error);
      Alert.alert("Error", "Failed to generate consumption report");
    } finally {
      setLoading(false);
    }
  };

  // Generate shopping list
  const generateShoppingList = async () => {
    setLoading(true);
    try {
      // In a real implementation, this would generate a shopping list based on low stock items
      // For now, we'll show a placeholder
      Alert.alert(
        "Shopping List Generated",
        "Your shopping list has been created based on low stock items:\n\n1. Milk\n2. Eggs\n3. Bread\n4. Apples\n5. Chicken",
        [{ text: "OK" }]
      );
    } catch (error) {
      console.error("Error generating shopping list:", error);
      Alert.alert("Error", "Failed to generate shopping list");
    } finally {
      setLoading(false);
    }
  };

  // Export data
  const exportData = () => {
    Alert.alert("Export Data", "Choose export format:", [
      { text: "Cancel", style: "cancel" },
      {
        text: "CSV",
        onPress: () => {
          Alert.alert(
            "Export CSV",
            "Your data would be exported as CSV in a real implementation.",
            [{ text: "OK" }]
          );
        },
      },
      {
        text: "PDF",
        onPress: () => {
          Alert.alert(
            "Export PDF",
            "Your data would be exported as PDF in a real implementation.",
            [{ text: "OK" }]
          );
        },
      },
    ]);
  };

  // Menu sections
  const reportMenuItems = [
    {
      title: "Waste Report",
      icon: "bar-chart",
      iconType: "material",
      description: "View your food waste statistics",
      onPress: generateWasteReport,
    },
    {
      title: "Consumption Report",
      icon: "pie-chart",
      iconType: "material",
      description: "See what items you use most",
      onPress: generateConsumptionReport,
    },
  ];

  const toolsMenuItems = [
    {
      title: "Generate Shopping List",
      icon: "cart-outline",
      iconType: "ionicon",
      description: "Create a list from low stock items",
      onPress: generateShoppingList,
    },
    {
      title: "Export Data",
      icon: "download-outline",
      iconType: "ionicon",
      description: "Export your inventory data",
      onPress: exportData,
    },
  ];

  const supportMenuItems = [
    {
      title: "Help Center",
      icon: "help-circle-outline",
      iconType: "ionicon",
      description: "Find answers to common questions",
      onPress: () => {
        Alert.alert(
          "Help Center",
          "This would open a help center with FAQs and guides in a real implementation.",
          [{ text: "OK" }]
        );
      },
    },
    {
      title: "Send Feedback",
      icon: "chatbox-outline",
      iconType: "ionicon",
      description: "Help us improve FridgeWise",
      onPress: () => {
        Alert.alert(
          "Send Feedback",
          "This would open a feedback form in a real implementation.",
          [{ text: "OK" }]
        );
      },
    },
    {
      title: "About FridgeWise",
      icon: "information-circle-outline",
      iconType: "ionicon",
      description: "App version and information",
      onPress: () => {
        Alert.alert(
          "About FridgeWise",
          "FridgeWise v1.0.0\n\nFridgeWise helps you manage your food inventory and reduce waste by tracking expiration dates and quantities.",
          [{ text: "OK" }]
        );
      },
    },
  ];

  const renderMenuItem = (item: any, index: number) => (
    <TouchableOpacity
      key={index}
      style={styles.menuItem}
      onPress={item.onPress}
      disabled={loading}
    >
      <View style={styles.menuItemIconContainer}>
        {item.iconType === "material" ? (
          <MaterialIcons name={item.icon} size={24} color="#FFFFFF" />
        ) : (
          <Ionicons name={item.icon} size={24} color="#FFFFFF" />
        )}
      </View>
      <View style={styles.menuItemContent}>
        <ThemedText style={styles.menuItemTitle}>{item.title}</ThemedText>
        <Text style={[styles.menuItemDescription, { color: subTextColor }]}>
          {item.description}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color="#BBBBBB" />
    </TouchableOpacity>
  );

  return (
    <SafeAreaWrapper usePadding edges={["top"]}>
      <ThemedView style={styles.container}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <ThemedText style={styles.title}>Menu</ThemedText>
            {user && (
              <Text style={[styles.userEmail, { color: subTextColor }]}>
                Signed in as {user.email}
              </Text>
            )}
          </View>

          {/* Reports & Analytics Section */}
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
              <MaterialIcons
                name="insights"
                size={18}
                color={subTextColor}
                style={styles.sectionIcon}
              />
              <ThemedText style={styles.sectionTitle}>
                Reports & Analytics
              </ThemedText>
            </View>
            <View>
              {reportMenuItems.map((item, index) =>
                renderMenuItem(item, index)
              )}
            </View>
          </View>

          {/* Tools Section */}
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
                name="build-outline"
                size={18}
                color={subTextColor}
                style={styles.sectionIcon}
              />
              <ThemedText style={styles.sectionTitle}>Tools</ThemedText>
            </View>
            <View>
              {toolsMenuItems.map((item, index) => renderMenuItem(item, index))}
            </View>
          </View>

          {/* Support & Info Section */}
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
                name="help-buoy-outline"
                size={18}
                color={subTextColor}
                style={styles.sectionIcon}
              />
              <ThemedText style={styles.sectionTitle}>
                Support & Info
              </ThemedText>
            </View>
            <View>
              {supportMenuItems.map((item, index) =>
                renderMenuItem(item, index)
              )}
            </View>
          </View>

          <View style={styles.signOutSection}>
            <TouchableOpacity
              style={styles.signOutButton}
              onPress={handleSignOut}
            >
              <Ionicons name="log-out-outline" size={24} color="#FF3B30" />
              <Text style={styles.signOutText}>Sign Out</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.footer}>
            <Text style={[styles.versionText, { color: subTextColor }]}>
              FridgeWise v1.0.0
            </Text>
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
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    marginBottom: 8,
  },
  userEmail: {
    fontSize: 16,
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
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  menuItemIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#22C55E",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  menuItemContent: {
    flex: 1,
  },
  menuItemTitle: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 2,
  },
  menuItemDescription: {
    fontSize: 13,
  },
  signOutSection: {
    marginTop: 8,
    marginBottom: 24,
  },
  signOutButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 20,
    backgroundColor: "#FEF2F2",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#FECACA",
  },
  signOutText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#FF3B30",
    marginLeft: 16,
  },
  footer: {
    alignItems: "center",
  },
  versionText: {
    fontSize: 14,
  },
});
