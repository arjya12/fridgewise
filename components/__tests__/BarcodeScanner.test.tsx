import { fireEvent, render, waitFor } from "@testing-library/react-native";
import React from "react";
import BarcodeScanner from "../BarcodeScanner";

// Mock the expo-camera module
jest.mock("expo-camera", () => {
  const React = require("react");
  const { View } = require("react-native");
  return {
    CameraView: jest.fn().mockImplementation(({ children }) => {
      return React.createElement(View, { testID: "camera-view" }, children);
    }),
    useCameraPermissions: jest.fn(() => [
      { granted: true, status: "granted" },
      jest.fn().mockResolvedValue({ granted: true }),
    ]),
  };
});

// Mock expo-haptics
jest.mock("expo-haptics", () => ({
  notificationAsync: jest.fn(),
  NotificationFeedbackType: {
    Success: "success",
  },
}));

// Mock ThemedText and ThemedView
jest.mock("../ThemedText", () => {
  const { Text } = require("react-native");
  return {
    ThemedText: Text,
  };
});

jest.mock("../ThemedView", () => {
  const { View } = require("react-native");
  return {
    ThemedView: View,
  };
});

describe("BarcodeScanner", () => {
  const mockOnScan = jest.fn();
  const mockOnClose = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("renders correctly with camera permissions", async () => {
    render(<BarcodeScanner onScan={mockOnScan} onClose={mockOnClose} />);

    await waitFor(() => {
      expect(mockOnScan).toHaveBeenCalledTimes(0);
    });
  });

  it("shows permission request when permissions are denied", async () => {
    // Mock permission denied
    jest
      .spyOn(require("expo-camera"), "useCameraPermissions")
      .mockReturnValue([
        { granted: false, status: "denied" },
        jest.fn().mockResolvedValue({ granted: false }),
      ]);

    const { getByText } = render(
      <BarcodeScanner onScan={mockOnScan} onClose={mockOnClose} />
    );

    await waitFor(() => {
      expect(getByText("Camera Permission Needed")).toBeTruthy();
    });
  });

  it("shows manual entry when toggled", async () => {
    const { getByText } = render(
      <BarcodeScanner onScan={mockOnScan} onClose={mockOnClose} />
    );

    await waitFor(() => {
      const manualButton = getByText("Manual Entry");
      fireEvent.press(manualButton);
    });

    await waitFor(() => {
      expect(getByText("Enter Barcode")).toBeTruthy();
    });
  });

  it("calls onClose when close button is pressed", async () => {
    const { getByTestId } = render(
      <BarcodeScanner onScan={mockOnScan} onClose={mockOnClose} />
    );

    await waitFor(() => {
      const closeButton = getByTestId("close-button");
      fireEvent.press(closeButton);
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });
  });
});
