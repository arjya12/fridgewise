import { render } from "@testing-library/react-native";
import React from "react";
import { Text } from "react-native";
import { ThemedView } from "../ThemedView";

// Mock useThemeColor hook
jest.mock("@/hooks/useThemeColor", () => ({
  useThemeColor: jest.fn().mockImplementation(({ light, dark }, theme) => {
    return light || "#FFFFFF";
  }),
}));

// Mock SafeAreaView
jest.mock("react-native-safe-area-context", () => ({
  SafeAreaView: "SafeAreaView", // Mock as string component
}));

describe("ThemedView", () => {
  it("renders correctly with default props", () => {
    const { getByText } = render(
      <ThemedView>
        <Text>Test Content</Text>
      </ThemedView>
    );

    expect(getByText("Test Content")).toBeTruthy();
  });

  it("renders with custom light and dark colors", () => {
    const { getByText } = render(
      <ThemedView lightColor="#F0F0F0" darkColor="#222222">
        <Text>Test Content</Text>
      </ThemedView>
    );

    expect(getByText("Test Content")).toBeTruthy();
  });

  it("passes additional props to the underlying component", () => {
    const { getByTestId } = render(
      <ThemedView testID="test-view" accessibilityLabel="Test view">
        <Text>Test Content</Text>
      </ThemedView>
    );

    expect(getByTestId("test-view")).toBeTruthy();
  });
});
