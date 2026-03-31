import { DefaultTheme, ThemeProvider } from "@react-navigation/native";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { InteractionManager } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import "react-native-reanimated";
import { SafeAreaProvider } from "react-native-safe-area-context";
import * as Linking from "expo-linking";
import { useRouter } from "expo-router";

import {
  Fraunces_400Regular_Italic,
  Fraunces_700Bold_Italic,
} from "@expo-google-fonts/fraunces";
import {
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
} from "@expo-google-fonts/plus-jakarta-sans";
import {
  DMMono_400Regular,
  DMMono_500Medium,
} from "@expo-google-fonts/dm-mono";

import { AuthProvider } from "@/contexts/AuthContext";
import { CalendarProvider } from "@/contexts/CalendarContext";
import { SettingsProvider } from "@/contexts/SettingsContext";
import { TipsProvider } from "@/contexts/TipsContext";
import { foodItemsService } from "@/services/foodItems";
import { setPendingResetPasswordUrl } from "@/lib/pendingResetUrl";

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
  const router = useRouter();
  // Remove colorScheme detection - always use light theme
  const [loaded] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
    Fraunces_400Regular_Italic,
    Fraunces_700Bold_Italic,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
    DMMono_400Regular,
    DMMono_500Medium,
  });

  // Defer expo-notifications (large native module) until after fonts + first interactions.
  useEffect(() => {
    if (!loaded) return;
    const task = InteractionManager.runAfterInteractions(() => {
      void (async () => {
        try {
          const {
            requestNotificationPermissions,
            registerBackgroundTasks,
            scheduleBackgroundTasks,
          } = await import("@/services/notificationService");
          const status = await requestNotificationPermissions();
          console.log("Notification permission status:", status);
          await registerBackgroundTasks();
          await scheduleBackgroundTasks();
        } catch (error) {
          console.error("Error initializing notifications:", error);
        }
      })();
    });
    return () => task.cancel();
  }, [loaded]);

  // Handle reset-password deep links even if the app is already running.
  // Note: this hook must be registered on every render (cannot be after `if (!loaded) return null`).
  useEffect(() => {
    const handleUrl = (url: string | null) => {
      if (!url) return;
      if (!loaded) return;
      if (url.includes("reset-password")) {
        setPendingResetPasswordUrl(url);
        router.replace("/(auth)/reset-password");
      }
    };

    void Linking.getInitialURL().then(handleUrl);
    const sub = Linking.addEventListener("url", ({ url }) => handleUrl(url));
    return () => sub.remove();
  }, [router, loaded]);

  if (!loaded) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AuthProvider>
          <SettingsProvider>
            <TipsProvider>
              <CalendarProvider foodItemsService={foodItemsService}>
                <ThemeProvider value={CustomLightTheme}>
                  <Stack screenOptions={{ headerShown: false }}>
                    <Stack.Screen name="index" />
                    <Stack.Screen name="(auth)" />
                    <Stack.Screen name="(tabs)" />
                    <Stack.Screen name="+not-found" />
                  </Stack>
                  <StatusBar
                    style="dark"
                    translucent
                    backgroundColor="transparent"
                  />
                </ThemeProvider>
              </CalendarProvider>
            </TipsProvider>
          </SettingsProvider>
        </AuthProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
