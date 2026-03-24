import { router } from "expo-router";
import React from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

/**
 * Placeholder Consumption Report screen.
 * This route exists because it's referenced from `app/(tabs)/more.tsx`
 * and registered in `app/(tabs)/_layout.tsx`.
 */
export default function ConsumptionReportScreen() {
  return (
    <SafeAreaView style={styles.safe} edges={["top", "right", "left"]}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Consumption Report</Text>
        <Text style={styles.subtitle}>
          This screen is currently under construction.
        </Text>
        <View style={styles.card}>
          <Text style={styles.body}>
            You can access your waste analytics from the Waste Report screen.
          </Text>
          <Text style={styles.link} onPress={() => router.push("/(tabs)/waste-report")}>
            Open Waste Report
          </Text>
        </View>
        <View style={{ height: 90 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#FFFFFF" },
  content: { padding: 18 },
  title: { fontSize: 22, fontWeight: "800", color: "#111827" },
  subtitle: { marginTop: 6, fontSize: 13, fontWeight: "600", color: "#6B7280" },
  card: {
    marginTop: 14,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 14,
    padding: 12,
    backgroundColor: "#FFFFFF",
  },
  body: { fontSize: 13, fontWeight: "600", color: "#374151" },
  link: { marginTop: 10, fontSize: 13, fontWeight: "800", color: "#22C55E" },
});

