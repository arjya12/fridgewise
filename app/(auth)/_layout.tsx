// app/(auth)/_layout.tsx
// Use the root SafeAreaProvider only (see app/_layout.tsx). Nesting another
// provider here caused inconsistent bottom insets: cold start → (tabs) looked
// different from welcome → (tabs) (tab bar “floating” too high on Android).
import { Stack } from "expo-router";
import React from "react";

export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { flex: 1, backgroundColor: "#FFFFFF" },
        animation: "fade",
      }}
    >
      <Stack.Screen name="welcome" />
      <Stack.Screen name="signup" />
      <Stack.Screen name="reset-password" />
      <Stack.Screen name="change-password" />
      <Stack.Screen name="change-email" />
    </Stack>
  );
}
