import { DefaultTheme, ThemeProvider } from "@react-navigation/native";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import "react-native-reanimated";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { AuthProvider } from "@/contexts/AuthContext";
import { CalendarProvider } from "@/contexts/CalendarContext";
import { SettingsProvider } from "@/contexts/SettingsContext";
import { TipsProvider } from "@/contexts/TipsContext";
import {
  registerBackgroundTasks,
  requestNotificationPermissions,
  scheduleBackgroundTasks,
} from "@/services/notificationService";

// Custom light theme configuration to override system settings
const CustomLightTheme = {
  ...DefaultTheme,
  dark: false,
  colors: {
    ...DefaultTheme.colors,
    primary: "#22C55E",
    background: "#FFFFFF",
    card: "#FFFFFF",
    text: "#11181C",
    border: "#E5E7EB",
    notification: "#FF6B6B",
  },
};

// Utility function to ensure text props are properly handled
const ensureTextSafety = (text: string | number | undefined): string => {
  if (text === undefined || text === null) {
    return "";
  }
  return String(text);
};

export default function RootLayout() {
  // Remove colorScheme detection - always use light theme
  const [loaded] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
  });

  // Initialize notifications when the app starts
  useEffect(() => {
    const initializeNotifications = async () => {
      try {
        // Request notification permissions
        const status = await requestNotificationPermissions();
        console.log("Notification permission status:", status);

        // Register and schedule background tasks
        await registerBackgroundTasks();
        await scheduleBackgroundTasks();
      } catch (error) {
        console.error("Error initializing notifications:", error);
      }
    };

    initializeNotifications();
  }, []);

  if (!loaded) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AuthProvider>
          <SettingsProvider>
            <TipsProvider>
              <CalendarProvider>
                <ThemeProvider value={CustomLightTheme}>
                  <Stack screenOptions={{ headerShown: false }}>
                    <Stack.Screen name="index" />
                    <Stack.Screen name="(auth)" />
                    <Stack.Screen name="(tabs)" />
                    <Stack.Screen name="+not-found" />
                  </Stack>
                  <StatusBar style="dark" />
                </ThemeProvider>
              </CalendarProvider>
            </TipsProvider>
          </SettingsProvider>
        </AuthProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
