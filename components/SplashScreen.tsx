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
import React, { useEffect, useRef, useState } from "react";
import { Dimensions, Image, StyleSheet, View } from "react-native";

const { width, height } = Dimensions.get("window");
const BACKGROUND_COLOR = "rgb(204, 245, 201)";
const MIN_SPLASH_MS = 2000;
const INITIAL_URL_TIMEOUT_MS = 5000;
/** Last resort if navigation never runs (should not happen after auth timeout + URL race fixes). */
const SPLASH_FAILSAFE_MS = 25_000;

function withTimeout<T>(promise: Promise<T>, ms: number, fallback: T): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((resolve) => {
      setTimeout(() => resolve(fallback), ms);
    }),
  ]);
}

export default function SplashScreen() {
  const router = useRouter();
  const { loading, session } = useAuth();
  const [minSplashElapsed, setMinSplashElapsed] = useState(false);
  /** Do not put `session` in the navigation effect deps: auth listener updates would cancel in-flight work and skip `replace`. */
  const sessionRef = useRef(session);
  const navigatedRef = useRef(false);

  useEffect(() => {
    sessionRef.current = session;
  }, [session]);

  useEffect(() => {
    const t = setTimeout(() => setMinSplashElapsed(true), MIN_SPLASH_MS);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    const failSafe = setTimeout(() => {
      if (navigatedRef.current) return;
      navigatedRef.current = true;
      const pending = peekPendingResetPasswordUrl();
      if (pending && isSupabaseRecoveryLink(pending)) {
        setPendingResetPasswordUrl(pending);
        router.replace("/(auth)/reset-password" as never);
        return;
      }
      const s = sessionRef.current;
      router.replace((s?.user ? "/(tabs)" : "/(auth)/welcome") as never);
    }, SPLASH_FAILSAFE_MS);
    return () => clearTimeout(failSafe);
  }, [router]);

  useEffect(() => {
    if (loading || !minSplashElapsed) return;

    let cancelled = false;

    const go = (path: string) => {
      if (cancelled || navigatedRef.current) return;
      navigatedRef.current = true;
      router.replace(path as never);
    };

    // Avoid InteractionManager.runAfterInteractions here: on some cold starts the queue
    // never drains before first paint, so navigation never runs until the process restarts.
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        void withTimeout(Linking.getInitialURL(), INITIAL_URL_TIMEOUT_MS, null).then(
          (url) => {
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
            const s = sessionRef.current;
            if (s?.user) {
              go("/(tabs)");
            } else {
              go("/(auth)/welcome");
            }
          }
        );
      });
    });

    return () => {
      cancelled = true;
    };
  }, [loading, minSplashElapsed, router]);

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
