import { DefaultTheme, ThemeProvider } from "@react-navigation/native";
import { useFonts } from "expo-font";
import { Stack, useRouter } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect, useLayoutEffect } from "react";
import { InteractionManager, LogBox, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import "react-native-reanimated";
import { SafeAreaProvider } from "react-native-safe-area-context";
import * as Linking from "expo-linking";

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
import { isSupabaseRecoveryLink } from "@/lib/supabaseRecoveryLink";

void SplashScreen.preventAutoHideAsync().catch(() => {});

/** Matches `components/SplashScreen` so we never flash black while fonts load. */
const FONT_LOADING_BG = "rgb(204, 245, 201)";

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

  // Hide native splash only after this commit + two frames so the first RN paint
  // is not a black native-stack scene behind an empty navigator.
  useLayoutEffect(() => {
    if (!loaded) return;
    let innerRaf: number | undefined;
    const outerRaf = requestAnimationFrame(() => {
      innerRaf = requestAnimationFrame(() => {
        void SplashScreen.hideAsync().catch(() => {});
      });
    });
    return () => {
      cancelAnimationFrame(outerRaf);
      if (innerRaf !== undefined) cancelAnimationFrame(innerRaf);
    };
  }, [loaded]);

  // Defer expo-notifications (large native module) until after fonts + first interactions.
  useEffect(() => {
    if (!loaded) return;
    const task = InteractionManager.runAfterInteractions(() => {
      void (async () => {
        try {
          // Warm per-item expiry notification module in the same idle window as
          // notificationService so consume/delete does not pay a separate Metro fetch.
          const [notifMod] = await Promise.all([
            import("@/services/notificationService"),
            import("@/services/itemExpiryNotificationService"),
          ]);
          const {
            requestNotificationPermissions,
            registerBackgroundTasks,
            scheduleBackgroundTasks,
          } = notifMod;
          await requestNotificationPermissions();
          await registerBackgroundTasks();
          await scheduleBackgroundTasks();
        } catch (error) {
          console.error("Error initializing notifications:", error);
        }
      })();
    });
    return () => task.cancel();
  }, [loaded]);

  // Supabase auth-js logs a WebCrypto PKCE warning on React Native.
  // It is harmless for our reset flow (we use the relay + token query params).
  useEffect(() => {
    LogBox.ignoreLogs([
      "WebCrypto API is not supported. Code challenge method will default to use plain instead of sha256.",
    ]);
  }, []);

  // Handle reset-password deep links even if the app is already running.
  // Note: this hook must be registered on every render (cannot be after the `if (!loaded)` early return).
  useEffect(() => {
    const handleUrl = (url: string | null) => {
      if (!url) return;

      if (!loaded) {
        return;
      }

      const isRecoveryLink = isSupabaseRecoveryLink(url);

      // Supabase may deliver recovery tokens on routes other than `/reset-password`
      // (often in the URL fragment: `#access_token=...&refresh_token=...&type=recovery`).
      if (isRecoveryLink) {
        setPendingResetPasswordUrl(url);
        router.replace("/(auth)/reset-password");
        return;
      }
    };

    void Promise.race([
      Linking.getInitialURL(),
      new Promise<string | null>((resolve) =>
        setTimeout(() => resolve(null), 5000)
      ),
    ])
      .then((initialUrl) => {
        handleUrl(initialUrl);
      })
      .catch((error) => {
        console.error("Error reading initial URL:", error);
      });

    const sub = Linking.addEventListener("url", ({ url }) => {
      handleUrl(url);
    });

    return () => {
      sub.remove();
    };
  }, [router, loaded]);

  if (!loaded) {
    return (
      <View style={{ flex: 1, backgroundColor: FONT_LOADING_BG }} />
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: "#FFFFFF" }}>
      <SafeAreaProvider>
        <AuthProvider>
          <SettingsProvider>
            <TipsProvider>
              <CalendarProvider foodItemsService={foodItemsService}>
                <ThemeProvider value={CustomLightTheme}>
                  <Stack
                    screenOptions={{
                      headerShown: false,
                      contentStyle: {
                        flex: 1,
                        backgroundColor: "#FFFFFF",
                      },
                      animation: "fade",
                    }}
                  >
                    <Stack.Screen name="index" />
                    <Stack.Screen name="(auth)" />
                    <Stack.Screen name="(tabs)" />
                    <Stack.Screen name="(legal)" />
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
