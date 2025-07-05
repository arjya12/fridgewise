import SafeAreaWrapper from "@/components/SafeAreaWrapper";
import { useAuth } from "@/contexts/AuthContext";
import { Ionicons } from "@expo/vector-icons";
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

export default function MenuScreen() {
  const { signOut, user } = useAuth();

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

  const menuItems = [
    {
      title: "Settings",
      icon: "settings-outline",
      onPress: () => router.push("/(tabs)/stats"),
    },
    {
      title: "About",
      icon: "information-circle-outline",
      onPress: () => {
        Alert.alert(
          "About FridgeWise",
          "FridgeWise helps you manage your food inventory and reduce waste by tracking expiration dates and quantities.",
          [{ text: "OK" }]
        );
      },
    },
    {
      title: "Help & Support",
      icon: "help-circle-outline",
      onPress: () => {
        Alert.alert(
          "Help & Support",
          "For support, please contact us at support@fridgewise.app",
          [{ text: "OK" }]
        );
      },
    },
  ];

  return (
    <SafeAreaWrapper usePadding edges={["top"]}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Menu</Text>
          {user && (
            <Text style={styles.userEmail}>Signed in as {user.email}</Text>
          )}
        </View>

        <View style={styles.menuSection}>
          {menuItems.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={styles.menuItem}
              onPress={item.onPress}
            >
              <Ionicons name={item.icon as any} size={24} color="#333" />
              <Text style={styles.menuItemText}>{item.title}</Text>
              <Ionicons name="chevron-forward" size={20} color="#999" />
            </TouchableOpacity>
          ))}
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
          <Text style={styles.versionText}>FridgeWise v1.0.0</Text>
        </View>
      </ScrollView>
    </SafeAreaWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  content: {
    padding: 20,
  },
  header: {
    marginBottom: 30,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#333",
    marginBottom: 8,
  },
  userEmail: {
    fontSize: 16,
    color: "#666",
  },
  menuSection: {
    marginBottom: 40,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 20,
    backgroundColor: "#F8F9FA",
    borderRadius: 12,
    marginBottom: 12,
  },
  menuItemText: {
    flex: 1,
    fontSize: 16,
    fontWeight: "500",
    color: "#333",
    marginLeft: 16,
  },
  signOutSection: {
    marginBottom: 40,
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
    paddingTop: 20,
  },
  versionText: {
    fontSize: 14,
    color: "#999",
  },
});
