import React from "react";
import { StyleSheet } from "react-native";
import AppHeader from "../../components/AppHeader";
import SafeAreaWrapper from "../../components/SafeAreaWrapper";
import TestComponent from "../../components/TestComponent";

export default function TestScreen() {
  return (
    <SafeAreaWrapper>
      <AppHeader title="Test Screen" />
      <TestComponent />
    </SafeAreaWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
