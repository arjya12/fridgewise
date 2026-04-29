import SafeAreaWrapper from "@/components/SafeAreaWrapper";
import { ThemedView } from "@/components/ThemedView";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React from "react";
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

type LegalPageProps = {
  title: string;
  children: React.ReactNode;
};

export default function LegalPage({ title, children }: LegalPageProps) {
  return (
    <SafeAreaWrapper style={styles.safeArea}>
      <ThemedView style={styles.container}>
        <View style={styles.stickyHeader}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => (router.canGoBack() ? router.back() : router.replace("/(tabs)/more"))}
            activeOpacity={0.75}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <Ionicons name="arrow-back" size={21} color={THEME_GREEN} />
          </TouchableOpacity>

          <View style={styles.brandWrap}>
            <Image
              source={require("../assets/images/launchpng.png")}
              style={styles.brandLogo}
              resizeMode="contain"
              accessible
              accessibilityLabel="FridgeWise logo"
            />
          </View>
          <View style={styles.brandDivider} />
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <View style={styles.card}>
            <Text style={styles.title}>{title}</Text>
            <View style={styles.body}>{children}</View>
          </View>
        </ScrollView>
      </ThemedView>
    </SafeAreaWrapper>
  );
}

const THEME_GREEN = "#197C47";

const styles = StyleSheet.create({
  safeArea: { backgroundColor: "#FFFFFF" },
  container: { flex: 1, backgroundColor: "#FFFFFF" },
  stickyHeader: {
    backgroundColor: "#FFFFFF",
    height: 90,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  backButton: {
    position: "absolute",
    top: "50%",
    marginTop: -22,
    left: 18,
    zIndex: 20,
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  scrollContent: {
    paddingHorizontal: 0,
    paddingBottom: 24,
    paddingTop: 0,
  },
  brandWrap: {
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 0,
    marginTop: -22,
    marginBottom: -8,
  },
  brandLogo: {
    width: 220,
    height: 120,
  },
  brandDivider: {
    height: 1,
    backgroundColor: "#E5E7EB",
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 26,
    marginHorizontal: 16,
    marginTop: 12,
    paddingVertical: 24,
    paddingHorizontal: 22,
  },
  title: {
    fontSize: 32,
    lineHeight: 38,
    letterSpacing: -0.5,
    color: THEME_GREEN,
    fontFamily: "PlusJakartaSans_700Bold",
    fontWeight: "800",
  },
  body: {
    marginTop: 16,
    gap: 24,
  },
});

