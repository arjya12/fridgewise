import EnhancedTabBar from "@/components/EnhancedTabBar";
import SafeText from "@/components/SafeText";
import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

/**
 * Enhanced Tab Layout - 4 Core Tabs + FAB
 * Professional navigation structure following UI/UX best practices
 */
export default function TabLayout() {
  // Wrapper for tab labels to ensure proper text rendering
  const TabLabel = ({ label }: { label: string }) => (
    <SafeText>{label}</SafeText>
  );

  return (
    <SafeAreaView style={{ flex: 1 }} edges={["right", "left"]}>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarShowLabel: true,
        }}
        tabBar={(props) => <EnhancedTabBar {...props} />}
      >
        {/* PRIMARY NAVIGATION - Core 4 Tabs */}

        {/* 1. Home Tab - Main inventory overview */}
        <Tabs.Screen
          name="index"
          options={{
            title: "Home",
            tabBarIcon: ({ color }) => (
              <Ionicons name="home-outline" color={color} size={24} />
            ),
            tabBarLabel: ({ children }) => <TabLabel label={children} />,
          }}
        />

        {/* 2. Calendar Tab - Time-based expiry tracking */}
        <Tabs.Screen
          name="calendar"
          options={{
            title: "Calendar",
            tabBarIcon: ({ color }) => (
              <Ionicons name="calendar-outline" color={color} size={24} />
            ),
            tabBarLabel: ({ children }) => <TabLabel label={children} />,
          }}
        />

        {/* 3. Shopping List Tab - Planning and replenishing */}
        <Tabs.Screen
          name="shopping-list"
          options={{
            title: "Shopping",
            tabBarIcon: ({ color }) => (
              <Ionicons name="basket-outline" color={color} size={24} />
            ),
            tabBarLabel: ({ children }) => <TabLabel label={children} />,
          }}
        />

        {/* 4. More Tab - Secondary features */}
        <Tabs.Screen
          name="more"
          options={{
            title: "More",
            tabBarIcon: ({ color }) => (
              <Ionicons name="ellipsis-horizontal" color={color} size={24} />
            ),
            tabBarLabel: ({ children }) => <TabLabel label={children} />,
          }}
        />

        {/* SECONDARY NAVIGATION - Hidden from main tab bar but accessible via FAB/More */}

        {/* Add Item - Accessible via FAB Speed Dial */}
        <Tabs.Screen
          name="add"
          options={{
            title: "Add Item",
            href: null, // Hide from tab bar - accessible via FAB
            tabBarIcon: ({ color }) => (
              <Ionicons name="add-outline" color={color} size={24} />
            ),
          }}
        />

        {/* Barcode Scanner - Accessible via FAB Speed Dial */}
        <Tabs.Screen
          name="barcode-test"
          options={{
            title: "Barcode Scanner",
            href: null, // Hide from tab bar - accessible via FAB
            tabBarIcon: ({ color }) => (
              <Ionicons name="barcode-outline" color={color} size={24} />
            ),
          }}
        />

        {/* ADMINISTRATIVE ROUTES - Accessible via More screen */}

        {/* Settings - Accessible via More menu */}
        <Tabs.Screen
          name="settings"
          options={{
            title: "Settings",
            href: null, // Hide from tab bar - accessible via More
            tabBarIcon: ({ color }) => (
              <Ionicons name="settings-outline" color={color} size={24} />
            ),
          }}
        />

        {/* Profile - Accessible via More menu */}
        <Tabs.Screen
          name="profile"
          options={{
            title: "Profile",
            href: null, // Hide from tab bar - accessible via More
            tabBarIcon: ({ color }) => (
              <Ionicons name="person-outline" color={color} size={24} />
            ),
          }}
        />

        {/* UTILITY ROUTES - Keep existing functionality */}

        {/* Item Details - Modal/overlay screen */}
        <Tabs.Screen
          name="item-details"
          options={{
            title: "Item Details",
            href: null, // Hide from tab bar
            tabBarIcon: ({ color }) => (
              <Ionicons
                name="information-circle-outline"
                color={color}
                size={24}
              />
            ),
          }}
        />

        {/* Legacy Menu - Keep for backward compatibility */}
        <Tabs.Screen
          name="menu"
          options={{
            title: "Menu",
            href: null, // Hide from tab bar - functionality moved to More
            tabBarIcon: ({ color }) => (
              <Ionicons name="menu-outline" color={color} size={24} />
            ),
          }}
        />
      </Tabs>
    </SafeAreaView>
  );
}
