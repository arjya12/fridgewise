import { useRouter } from 'expo-router';
import React, { useEffect } from 'react';
import { Dimensions, Image, StyleSheet, View } from 'react-native';

const { width, height } = Dimensions.get('window');

const BACKGROUND_COLOR = 'rgb(204, 245, 201)'; // Updated light green

export default function SplashScreen() {
  const router = useRouter();

  useEffect(() => {
    // Navigate to welcome page after 2 seconds
    const timer = setTimeout(() => {
      router.replace('/(auth)/welcome');
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={styles.container}>
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