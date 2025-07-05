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
        }}
        tabBar={(props) => <CustomTabBar {...props} />}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: "Home",
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="home" size={size} color={color} />
            ),
          }}
        />

        <Tabs.Screen
          name="add"
          options={{
            title: "Add Item",
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="add-circle" size={size} color={color} />
            ),
            tabBarButton: () => null, // Hide this tab button
          }}
        />

        <Tabs.Screen
          name="item-details"
          options={{
            title: "Item Details",
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="information-circle" size={size} color={color} />
            ),
            tabBarButton: () => null, // Hide this tab button
          }}
        />

        <Tabs.Screen
          name="stats"
          options={{
            title: "Settings",
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="settings" size={size} color={color} />
            ),
          }}
        />

        <Tabs.Screen
          name="menu"
          options={{
            title: "Menu",
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="menu" size={size} color={color} />
            ),
          }}
        />
      </Tabs>
    </SafeAreaView>
  );
}
