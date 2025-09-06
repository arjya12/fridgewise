import { fireEvent, render, waitFor } from "@testing-library/react-native";
import React from "react";
import { EnhancedCalendarScreen } from "../EnhancedCalendarScreen";

// Minimal mock for gesture handler root view if needed
jest.mock("react-native-gesture-handler", () => {
  const React = require("react");
  return {
    GestureDetector: ({ children }: any) => children,
    Gesture: { Pan: () => ({ onEnd: () => ({}) }) },
  };
});

// Mock Dimensions used inside card component to avoid undefined
jest.mock("react-native/Libraries/Utilities/Dimensions", () => ({
  get: jest.fn(() => ({ width: 375, height: 812 })),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
}));

describe("EnhancedCalendarScreen segmented tabs", () => {
  const items = [
    // Fixed today in jest.setup is 2024-01-10
    {
      id: "1",
      name: "Milk",
      emoji: "🥛",
      location: "Refrigerator",
      quantity: 1,
      expiry_date: "2024-01-12", // expiring soon (2 days)
    },
    {
      id: "2",
      name: "Bread",
      emoji: "🍞",
      location: "Shelf",
      quantity: 1,
      expiry_date: "2024-01-05", // expired
    },
    {
      id: "3",
      name: "Apples",
      emoji: "🍎",
      location: "Refrigerator",
      quantity: 3,
      expiry_date: "2024-01-20", // not soon
    },
  ] as any[];

  const foodItemsService = {
    getItems: jest.fn().mockResolvedValue(items),
    getItemsByExpiryDate: jest.fn().mockResolvedValue({}),
    markItemUsed: jest.fn(),
    extendExpiry: jest.fn(),
  };

  it("shows counts per tab and switches between Expiring and Expired", async () => {
    const { getByText, queryByText } = render(
      <EnhancedCalendarScreen foodItemsService={foodItemsService} />
    );

    await waitFor(() => {
      // Expiring Soon should include only item 1 (not expired and within 5 days)
      expect(getByText("Expiring Soon")).toBeTruthy();
      expect(getByText("1 item")).toBeTruthy();
    });

    // Switch to Expired
    fireEvent.press(getByText("Expired"));

    await waitFor(() => {
      // Should show 1 expired item
      expect(getByText("Expired")).toBeTruthy();
      expect(getByText("1 item")).toBeTruthy();
      // The previous expiring count label should not be duplicated beyond one instance
      expect(queryByText("2 items")).toBeNull();
    });
  });
});
