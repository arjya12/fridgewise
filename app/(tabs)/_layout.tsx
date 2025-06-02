import CustomTabBar from "@/components/CustomTabBar";
import SafeText from "@/components/SafeText";
import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";

/**
 * Tab layout for the main application screens
 */
export default function TabLayout() {
  // Wrapper for tab labels to ensure proper text rendering
  const TabLabel = ({ label }: { label: string }) => (
    <SafeText>{label}</SafeText>
  );

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
      }}
      tabBar={(props) => <CustomTabBar {...props} />}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Dashboard",
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
        name="demo"
        options={{
          title: "Demo",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="cube" size={size} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person" size={size} color={color} />
          ),
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
    </Tabs>
  );
}
