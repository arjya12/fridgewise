import SafeAreaWrapper from "@/components/SafeAreaWrapper";
import { ThemedView } from "@/components/ThemedView";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React from "react";
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const userValueFeatures = [
  "Track items across your fridge and shelf",
  "View upcoming and expired items at a glance",
  "Get notified before food expires",
  "Manage your grocery list in one place",
  "Understand your consumption and waste with reports",
];

export default function AboutScreen() {
  const handleLegalPress = (key: "privacy" | "terms") => {
    router.push(key === "privacy" ? "/(legal)/privacy" : "/(legal)/terms");
  };

  return (
    <SafeAreaWrapper style={styles.safeArea}>
      <ThemedView style={styles.container}>
        <StatusBar style="dark" backgroundColor="#FFFFFF" />
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.push("/(tabs)/more")}
            activeOpacity={1}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="arrow-back" size={21} color="#15803D" />
          </TouchableOpacity>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <View style={styles.hero}>
            <Image
              source={require("../../assets/images/launchpng.png")}
              style={styles.logo}
              resizeMode="contain"
              accessible
              accessibilityLabel="FridgeWise logo"
            />
            <Text style={styles.heroBody}>
              FridgeWise helps you keep track of what you have, what is expiring soon, and what to
              use first. It is a simple way to stay organized and waste less food.
            </Text>
          </View>

          <View style={styles.listSection}>
            <Text style={styles.sectionTitle}>What you can do</Text>
            {userValueFeatures.map((item) => (
              <View key={item} style={styles.listRow}>
                <View style={styles.listDot} />
                <Text style={styles.bullet}>{item}</Text>
              </View>
            ))}
          </View>

          <View style={styles.versionSection}>
            <Text style={styles.versionLabel}>Version</Text>
            <Text style={styles.versionText}>1.0.0</Text>
          </View>

          {[
            { key: "privacy", label: "Privacy Policy" },
            { key: "terms", label: "Terms of Service" },
          ].map((item) => (
            <View key={item.key} style={styles.legalCard}>
              <Pressable
                style={({ pressed }) => [styles.legalRow, pressed && styles.legalRowPressed]}
                onPress={() => handleLegalPress(item.key as "privacy" | "terms")}
              >
                <Text style={styles.legalText}>{item.label}</Text>
                <Ionicons
                  name="chevron-forward"
                  size={16}
                  color="#166534"
                />
              </Pressable>
            </View>
          ))}
        </ScrollView>
      </ThemedView>
    </SafeAreaWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  safeArea: {
    backgroundColor: "#FFFFFF",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
    marginTop: 6,
    marginBottom: 2,
    paddingHorizontal: 8,
    paddingTop: 10,
    paddingBottom: 6,
    zIndex: 20,
    elevation: 20,
  },
  backButton: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "transparent",
    marginLeft: 10,
    marginTop: 8,
    zIndex: 21,
    elevation: 21,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 130,
    paddingTop: 0,
    gap: 12,
  },
  hero: {
    paddingVertical: 0,
    paddingHorizontal: 8,
    alignItems: "center",
    marginTop: -20,
  },
  logo: {
    width: 148,
    height: 148,
    marginBottom: 0,
  },
  heroBody: {
    fontSize: 14,
    lineHeight: 21,
    color: "#4B5563",
    textAlign: "center",
    fontFamily: "PlusJakartaSans_500Medium",
    fontWeight: "500",
    maxWidth: 360,
    marginTop: -10,
    marginBottom: 15,
  },
  listSection: {
    paddingHorizontal: 6,
    paddingTop: 2,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#F3F4F6",
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 14,
  },
  legalCard: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 14,
    paddingVertical: 6,
    paddingHorizontal: 14,
  },
  versionSection: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "flex-start",
    paddingHorizontal: 6,
    marginTop: 2,
    gap: 4,
  },
  versionLabel: {
    fontSize: 14,
    fontFamily: "PlusJakartaSans_600SemiBold",
    fontWeight: "600",
    color: "#4B5563",
  },
  sectionTitle: {
    fontSize: 15,
    fontFamily: "PlusJakartaSans_600SemiBold",
    fontWeight: "600",
    color: "#374151",
    marginBottom: 8,
  },
  listRow: {
    width: "100%",
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 7,
    paddingRight: 6,
  },
  listDot: {
    width: 6,
    height: 6,
    backgroundColor: "#16A34A",
    transform: [{ rotate: "45deg" }],
    marginTop: 6,
    marginRight: 8,
  },
  bullet: {
    fontSize: 12,
    lineHeight: 18,
    color: "#374151",
    fontFamily: "PlusJakartaSans_500Medium",
    fontWeight: "500",
    flex: 1,
    textAlign: "left",
  },
  versionText: {
    fontSize: 12,
    color: "#166534",
    fontFamily: "PlusJakartaSans_600SemiBold",
    fontWeight: "600",
    marginTop: 3,
  },
  legalRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 10,
  },
  legalRowPressed: {
    opacity: 0.75,
  },
  legalDropdown: {
    alignItems: "center",
    paddingHorizontal: 2,
    paddingBottom: 10,
  },
  legalDropdownSeparator: {
    width: "100%",
    height: 1,
    backgroundColor: "#F1F5F9",
    marginBottom: 8,
  },
  comingSoonPill: {
    backgroundColor: "#E5E7EB",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 4,
    marginTop: 3,
  },
  legalDropdownHint: {
    fontSize: 11,
    color: "#475569",
    fontFamily: "PlusJakartaSans_500Medium",
    fontWeight: "500",
  },
  legalText: {
    fontSize: 14,
    color: "#374151",
    fontFamily: "PlusJakartaSans_600SemiBold",
    fontWeight: "600",
  },
});
