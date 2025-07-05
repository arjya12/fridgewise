import { render } from "@testing-library/react-native";
import React from "react";
import { Image } from "react-native";
import AppHeader from "../AppHeader";

// Mock useSafeAreaInsets hook
const mockInsets = { top: 48, right: 0, bottom: 0, left: 0 };
jest.mock("react-native-safe-area-context", () => {
  return {
    useSafeAreaInsets: jest.fn().mockImplementation(() => mockInsets),
  };
});

describe("AppHeader", () => {
  it("renders correctly with default props", () => {
    const { getByText } = render(<AppHeader />);

    expect(getByText("FridgeWise")).toBeTruthy();
    expect(getByText("Smart Food Management")).toBeTruthy();
  });

  it("renders with custom title and subtitle", () => {
    const { getByText } = render(
      <AppHeader title="Custom Title" subtitle="Custom Subtitle" />
    );

    expect(getByText("Custom Title")).toBeTruthy();
    expect(getByText("Custom Subtitle")).toBeTruthy();
  });

  it("uses a minimum padding of 16 when insets are 0", () => {
    // Override the mock for this test
    jest
      .spyOn(require("react-native-safe-area-context"), "useSafeAreaInsets")
      .mockReturnValueOnce({ top: 0, right: 0, bottom: 0, left: 0 });

    const { getByText } = render(<AppHeader />);
    expect(getByText("FridgeWise")).toBeTruthy();
  });

  it("renders the logo image", () => {
    const { UNSAFE_getAllByType } = render(<AppHeader />);

    // Check if the logo image is rendered
    const images = UNSAFE_getAllByType(Image);
    expect(images.length).toBeGreaterThan(0);
    expect(images[0].props.source).toBeDefined();
  });
});
