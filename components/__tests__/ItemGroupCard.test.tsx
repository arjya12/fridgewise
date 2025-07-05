import { fireEvent, render } from "@testing-library/react-native";
import React from "react";
import ItemGroupCard from "../ItemGroupCard";

// Mock the components
jest.mock("../RealisticFoodImage", () => "RealisticFoodImage");
jest.mock("../ItemEntryCard", () => "ItemEntryCard");

describe("ItemGroupCard", () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const mockEntries = [
    {
      id: "1",
      quantity: 1,
      expiryDate: today.toISOString(), // Today
      addedDate: today.toISOString(),
      isUseFirst: false,
    },
    {
      id: "2",
      quantity: 2,
      expiryDate: new Date(
        today.getTime() + 3 * 24 * 60 * 60 * 1000
      ).toISOString(), // 3 days from now
      addedDate: today.toISOString(),
      isUseFirst: true,
    },
  ];

  const mockExpiredEntries = [
    {
      id: "1",
      quantity: 1,
      expiryDate: new Date(
        today.getTime() - 2 * 24 * 60 * 60 * 1000
      ).toISOString(), // 2 days ago
      addedDate: today.toISOString(),
      isUseFirst: false,
    },
  ];

  const mockHandlers = {
    onDecrement: jest.fn(),
    onIncrement: jest.fn(),
    onUseAll: jest.fn(),
    onAddMore: jest.fn(),
    onEntryOptions: jest.fn(),
    onEditEntry: jest.fn(),
    onDeleteEntry: jest.fn(),
  };

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("renders correctly with entries", () => {
    const { getByText } = render(
      <ItemGroupCard
        itemName="Test Item"
        entries={mockEntries}
        {...mockHandlers}
      />
    );

    // Check if the item name is rendered
    expect(getByText("Test Item")).toBeTruthy();
    // Check if the quantity is rendered
    expect(getByText("3 total • 2 entries")).toBeTruthy();
    // Check if the expiry status is rendered (should be "Today")
    expect(getByText("Today")).toBeTruthy();
    // Check if the Add More button is rendered
    expect(getByText("Add More")).toBeTruthy();
  });

  it("renders correctly with expired entries", () => {
    const { getByText } = render(
      <ItemGroupCard
        itemName="Expired Item"
        entries={mockExpiredEntries}
        {...mockHandlers}
      />
    );

    // Check if the item name is rendered
    expect(getByText("Expired Item")).toBeTruthy();
    // Check if the quantity is rendered
    expect(getByText("1 total • 1 entry")).toBeTruthy();
    // Check if the expiry status is rendered
    expect(getByText("Expired")).toBeTruthy();
  });

  it("calls onAddMore when Add More button is pressed", () => {
    const { getByText } = render(
      <ItemGroupCard
        itemName="Test Item"
        entries={mockEntries}
        {...mockHandlers}
      />
    );

    // Press the Add More button
    fireEvent.press(getByText("Add More"));

    // Check if the onAddMore handler was called
    expect(mockHandlers.onAddMore).toHaveBeenCalledTimes(1);
  });
});
