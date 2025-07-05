import { render } from "@testing-library/react-native";
import React from "react";
import { Text } from "react-native";
import SafeAreaWrapper from "../SafeAreaWrapper";

// Mock the safe area context module
const mockInsets = { top: 48, right: 0, bottom: 34, left: 0 };
jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => mockInsets,
  SafeAreaView: "SafeAreaView", // Mock as string component
}));

describe("SafeAreaWrapper", () => {
  it("renders children correctly", () => {
    const { getByText } = render(
      <SafeAreaWrapper>
        <Text>Test Content</Text>
      </SafeAreaWrapper>
    );

    expect(getByText("Test Content")).toBeTruthy();
  });

  it("renders with padding when usePadding is true", () => {
    const { getByText } = render(
      <SafeAreaWrapper usePadding edges={["top", "bottom"]}>
        <Text>Test Content</Text>
      </SafeAreaWrapper>
    );

    expect(getByText("Test Content")).toBeTruthy();
  });
});
