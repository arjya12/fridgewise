import CustomTabBar from "@/components/CustomTabBar";
import SafeText from "@/components/SafeText";
import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

/**
 * Tab layout for the main application screens
 */
export default function TabLayout() {
  // Wrapper for tab labels to ensure proper text rendering
  const TabLabel = ({ label }: { label: string }) => (
    <SafeText>{label}</SafeText>
  );

  return (
    <SafeAreaView style={{ flex: 1 }} edges={["right", "left", "bottom"]}>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarShowLabel: true,
        }}
        tabBar={(props) => <CustomTabBar {...props} />}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: "Home",
            tabBarIcon: ({ color }) => (
              <Ionicons name="home-outline" color={color} size={24} />
            ),
          }}
        />

        <Tabs.Screen
          name="add"
          options={{
            title: "Add",
            tabBarIcon: ({ color }) => (
              <Ionicons name="add-outline" color={color} size={24} />
            ),
            href: null, // This makes the tab not navigable directly
          }}
        />

        <Tabs.Screen
          name="settings"
          options={{
            title: "Settings",
            tabBarIcon: ({ color }) => (
              <Ionicons name="settings-outline" color={color} size={24} />
            ),
          }}
        />

        <Tabs.Screen
          name="menu"
          options={{
            title: "Menu",
            tabBarIcon: ({ color }) => (
              <Ionicons name="menu-outline" color={color} size={24} />
            ),
          }}
        />
        <Tabs.Screen
          name="item-details"
          options={{
            href: null, // This makes the tab not show in the tab bar
          }}
        />
      </Tabs>
    </SafeAreaView>
  );
}
