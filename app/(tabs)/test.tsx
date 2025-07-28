import TestNewCards from "@/components/TestNewCards";
import React from "react";
import { StyleSheet, View } from "react-native";

export default function TabTwoScreen() {
  return (
    <View style={styles.container}>
      <TestNewCards />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
