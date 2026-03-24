import { setPendingResetPasswordUrl } from '@/lib/pendingResetUrl';
import { StatusBar } from "expo-status-bar";
import { useRouter } from 'expo-router';
import * as Linking from 'expo-linking';
import React, { useEffect } from 'react';
import { Dimensions, Image, StyleSheet, View } from 'react-native';

const { width, height } = Dimensions.get('window');
const BACKGROUND_COLOR = 'rgb(204, 245, 201)';

export default function SplashScreen() {
  const router = useRouter();

  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | null = null;

    const go = (path: string) => {
      if (!cancelled) router.replace(path as any);
    };

    Linking.getInitialURL().then((url) => {
      if (cancelled) return;
      if (url && url.includes('reset-password') && url.includes('#')) {
        setPendingResetPasswordUrl(url);
        go('/(auth)/reset-password');
        return;
      }
      timer = setTimeout(() => go('/(auth)/welcome'), 2000);
    });

    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, []);

  return (
    <View style={styles.container}>
      <StatusBar style="dark" backgroundColor={BACKGROUND_COLOR} translucent={false} />
      <Image
        source={require('../assets/images/launchpng.png')}
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
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: width * 0.7,
    height: height * 0.35,
  },
}); 