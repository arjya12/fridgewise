import { useAuth } from "@/contexts/AuthContext";
import {
  peekPendingResetPasswordUrl,
  setPendingResetPasswordUrl,
} from "@/lib/pendingResetUrl";
import {
  isSupabaseRecoveryLink,
} from "@/lib/supabaseRecoveryLink";
import { StatusBar } from "expo-status-bar";
import { useRouter } from "expo-router";
import * as Linking from "expo-linking";
import React, { useEffect, useState } from "react";
import {
  Dimensions,
  Image,
  InteractionManager,
  StyleSheet,
  View,
} from "react-native";

const { width, height } = Dimensions.get("window");
const BACKGROUND_COLOR = "rgb(204, 245, 201)";
const MIN_SPLASH_MS = 2000;

export default function SplashScreen() {
  const router = useRouter();
  const { loading, session } = useAuth();
  const [minSplashElapsed, setMinSplashElapsed] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setMinSplashElapsed(true), MIN_SPLASH_MS);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (loading || !minSplashElapsed) return;

    let cancelled = false;

    const go = (path: string) => {
      if (!cancelled) router.replace(path as never);
    };

    const task = InteractionManager.runAfterInteractions(() => {
      // Let window insets / safe-area metrics match post–manual-login before navigating.
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          void Linking.getInitialURL().then((url) => {
            if (cancelled) return;

            // If the deep link was already captured elsewhere (ex: _layout listener),
            // prefer the pending reset URL over routing to welcome.
            const pending = peekPendingResetPasswordUrl();
            const pendingIsReset = isSupabaseRecoveryLink(pending);
            const initialIsReset = isSupabaseRecoveryLink(url);

            if (pending && pendingIsReset) {
              setPendingResetPasswordUrl(pending);
              go("/(auth)/reset-password");
              return;
            }

            if (url && initialIsReset) {
              setPendingResetPasswordUrl(url);
              go("/(auth)/reset-password");
              return;
            }
            if (session?.user) {
              go("/(tabs)");
            } else {
              go("/(auth)/welcome");
            }
          });
        });
      });
    });

    return () => {
      cancelled = true;
      task.cancel?.();
    };
  }, [loading, minSplashElapsed, router, session]);

  return (
    <View style={styles.container}>
      <StatusBar style="dark" backgroundColor={BACKGROUND_COLOR} translucent={false} />
      <Image
        source={require("../assets/images/launchpng.png")}
        style={styles.logo}
        resizeMode="contain"
        accessible
        accessibilityLabel="Fridge Wise logo"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BACKGROUND_COLOR,
    alignItems: "center",
    justifyContent: "center",
  },
  logo: {
    width: width * 0.7,
    height: height * 0.35,
  },
});
