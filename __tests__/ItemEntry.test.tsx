import ItemEntryCard from "@/components/ItemEntryCard";
import ItemGroupCard from "@/components/ItemGroupCard";
import { fireEvent, render } from "@testing-library/react-native";
import React from "react";

describe("ItemEntryCard", () => {
  const mockProps = {
    quantity: 2,
    isUseFirst: true,
    expiryStatus: "2 days",
    onDecrement: jest.fn(),
    onIncrement: jest.fn(),
    onUseAll: jest.fn(),
    onEditPress: jest.fn(),
    onDeletePress: jest.fn(),
  };

  it("renders correctly with all elements", () => {
    const { getByText, getByLabelText } = render(
      <ItemEntryCard {...mockProps} />
    );

    // Check quantity display
    expect(getByText("2")).toBeTruthy();

    // Check "Use First" tag
    expect(getByText("Use First")).toBeTruthy();

    // Check expiry badge
    expect(getByText("2 days")).toBeTruthy();

    // Check buttons
    expect(getByLabelText("Decrease quantity")).toBeTruthy();
    expect(getByLabelText("Increase quantity")).toBeTruthy();
    expect(getByLabelText("Use all")).toBeTruthy();
    expect(getByLabelText("More options")).toBeTruthy();
  });

  it("calls the correct functions when buttons are pressed", () => {
    const { getByLabelText } = render(<ItemEntryCard {...mockProps} />);

    // Press decrement button
    fireEvent.press(getByLabelText("Decrease quantity"));
    expect(mockProps.onDecrement).toHaveBeenCalledTimes(1);

    // Press increment button
    fireEvent.press(getByLabelText("Increase quantity"));
    expect(mockProps.onIncrement).toHaveBeenCalledTimes(1);

    // Press "Use All" button
    fireEvent.press(getByLabelText("Use all"));
    expect(mockProps.onUseAll).toHaveBeenCalledTimes(1);
  });

  it('renders without "Use First" tag when isUseFirst is false', () => {
    const { queryByText } = render(
      <ItemEntryCard {...mockProps} isUseFirst={false} />
    );

    expect(queryByText("Use First")).toBeNull();
  });

  it("renders without expiry badge when expiryStatus is not provided", () => {
    const { queryByText } = render(
      <ItemEntryCard {...mockProps} expiryStatus={undefined} />
    );

    expect(queryByText("2 days")).toBeNull();
  });
});

describe("ItemGroupCard", () => {
  const mockEntries = [
    {
      id: "1",
      quantity: 2,
      expiryDate: "2023-06-01",
      isUseFirst: true,
      expiryStatus: "2 days",
    },
    {
      id: "2",
      quantity: 1,
      expiryDate: "2023-06-05",
      isUseFirst: false,
      expiryStatus: "6 days",
    },
  ];

  const mockProps = {
    itemName: "Milk",
    entries: mockEntries,
    onAddMore: jest.fn(),
    onDecrement: jest.fn(),
    onIncrement: jest.fn(),
    onUseAll: jest.fn(),
    onEditEntry: jest.fn(),
    onDeleteEntry: jest.fn(),
    initialExpanded: true,
  };

  it("renders with correct item name and entry count", () => {
    const { getByText } = render(<ItemGroupCard {...mockProps} />);

    expect(getByText("Milk")).toBeTruthy();
    expect(getByText("3 total • 2 entries")).toBeTruthy();
  });

  it("renders all entries when expanded", () => {
    const { getAllByText } = render(<ItemGroupCard {...mockProps} />);

    // Should find all quantities
    expect(getAllByText("2")).toBeTruthy();
    expect(getAllByText("1")).toBeTruthy();

    // Should find all expiry statuses
    expect(getAllByText("2 days")).toBeTruthy();
    expect(getAllByText("6 days")).toBeTruthy();
  });

  it("calls onAddMore when Add More button is pressed", () => {
    const { getByText } = render(<ItemGroupCard {...mockProps} />);

    fireEvent.press(getByText("Add More"));
    expect(mockProps.onAddMore).toHaveBeenCalledTimes(1);
  });
});
