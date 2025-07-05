import ItemEntryCard from "@/components/ItemEntryCard";
import ItemGroupCard from "@/components/ItemGroupCard";
import { fireEvent, render } from "@testing-library/react-native";
import React from "react";
import { Alert } from "react-native";

// Mock the Swipeable component from react-native-gesture-handler
jest.mock("react-native-gesture-handler", () => {
  const RealComponent = jest.requireActual("react-native-gesture-handler");
  const MockSwipeable = ({
    children,
    renderRightActions,
  }: {
    children: React.ReactNode;
    renderRightActions: () => React.ReactNode;
  }) => {
    return (
      <RealComponent.RectButton>
        {children}
        {/* Render the right actions for testing */}
        <div data-testid="swipe-actions">{renderRightActions()}</div>
      </RealComponent.RectButton>
    );
  };

  return {
    ...RealComponent,
    Swipeable: MockSwipeable,
  };
});

// Mock Alert.alert
jest.spyOn(Alert, "alert").mockImplementation(() => {});

describe("ItemEntryCard", () => {
  it("renders correctly with all elements", () => {
    const onDecrement = jest.fn();
    const onIncrement = jest.fn();
    const onUseAll = jest.fn();
    const onEditPress = jest.fn();
    const onDeletePress = jest.fn();

    const { getByText, getByLabelText } = render(
      <ItemEntryCard
        quantity={2}
        isUseFirst={true}
        expiryDate={new Date(
          Date.now() + 2 * 24 * 60 * 60 * 1000
        ).toISOString()}
        onDecrement={onDecrement}
        onIncrement={onIncrement}
        onUseAll={onUseAll}
        onEditPress={onEditPress}
        onDeletePress={onDeletePress}
      />
    );

    // Check quantity
    expect(getByText("2")).toBeTruthy();

    // Check "Use First" tag
    expect(getByText("Use First")).toBeTruthy();

    // Check expiry badge
    expect(getByText("3 days")).toBeTruthy();

    // Check buttons
    expect(getByLabelText("Decrease quantity")).toBeTruthy();
    expect(getByLabelText("Increase quantity")).toBeTruthy();
    expect(getByLabelText("Use all")).toBeTruthy();

    // Check swipe actions are available
    expect(getByLabelText("Edit item")).toBeTruthy();
    expect(getByLabelText("Delete item")).toBeTruthy();
  });

  it("calls the correct functions when buttons are pressed", () => {
    const onDecrement = jest.fn();
    const onIncrement = jest.fn();
    const onUseAll = jest.fn();

    const { getByLabelText } = render(
      <ItemEntryCard
        quantity={2}
        isUseFirst={true}
        expiryDate={new Date(
          Date.now() + 2 * 24 * 60 * 60 * 1000
        ).toISOString()} // 2 days
        onDecrement={onDecrement}
        onIncrement={onIncrement}
        onUseAll={onUseAll}
      />
    );

    // Press decrement button
    fireEvent.press(getByLabelText("Decrease quantity"));
    expect(onDecrement).toHaveBeenCalledTimes(1);

    // Press increment button
    fireEvent.press(getByLabelText("Increase quantity"));
    expect(onIncrement).toHaveBeenCalledTimes(1);

    // Press "Use All" button
    fireEvent.press(getByLabelText("Use all"));
    expect(onUseAll).toHaveBeenCalledTimes(1);
  });

  it("calls the edit function when edit button is pressed", () => {
    const onEditPress = jest.fn();

    const { getByLabelText } = render(
      <ItemEntryCard
        quantity={2}
        onDecrement={jest.fn()}
        onIncrement={jest.fn()}
        onUseAll={jest.fn()}
        onEditPress={onEditPress}
      />
    );

    // Press edit button
    fireEvent.press(getByLabelText("Edit item"));
    expect(onEditPress).toHaveBeenCalledTimes(1);
  });

  it("shows confirmation dialog when delete button is pressed", () => {
    const onDeletePress = jest.fn();

    const { getByLabelText } = render(
      <ItemEntryCard
        quantity={2}
        onDecrement={jest.fn()}
        onIncrement={jest.fn()}
        onUseAll={jest.fn()}
        onDeletePress={onDeletePress}
      />
    );

    // Press delete button
    fireEvent.press(getByLabelText("Delete item"));

    // Verify Alert.alert was called
    expect(Alert.alert).toHaveBeenCalledWith(
      "Delete Item",
      "Are you sure you want to delete this item? This action cannot be undone.",
      expect.arrayContaining([
        expect.objectContaining({ text: "Cancel" }),
        expect.objectContaining({ text: "Delete" }),
      ])
    );
  });

  it('renders without "Use First" tag when isUseFirst is false', () => {
    const onDecrement = jest.fn();
    const onIncrement = jest.fn();
    const onUseAll = jest.fn();

    const { queryByText } = render(
      <ItemEntryCard
        quantity={2}
        isUseFirst={false}
        expiryDate={new Date(
          Date.now() + 2 * 24 * 60 * 60 * 1000
        ).toISOString()} // 2 days
        onDecrement={onDecrement}
        onIncrement={onIncrement}
        onUseAll={onUseAll}
      />
    );

    expect(queryByText("Use First")).toBeNull();
  });

  it("renders without expiry badge when expiryStatus is not provided", () => {
    const onDecrement = jest.fn();
    const onIncrement = jest.fn();
    const onUseAll = jest.fn();

    const { queryByText } = render(
      <ItemEntryCard
        quantity={2}
        isUseFirst={true}
        expiryDate={undefined}
        onDecrement={onDecrement}
        onIncrement={onIncrement}
        onUseAll={onUseAll}
      />
    );

    expect(queryByText("2 days")).toBeNull();
  });
});

describe("ItemGroupCard", () => {
  const mockEntries = [
    {
      id: "1",
      name: "Milk",
      quantity: 2,
      isUseFirst: true,
      expiryDate: new Date(Date.now()).toISOString(),
    },
    {
      id: "2",
      name: "Milk",
      quantity: 1,
      isUseFirst: false,
      expiryDate: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000).toISOString(),
    },
  ];

  it("renders all entries when expanded", () => {
    const { getByText } = render(
      <ItemGroupCard
        itemName="Milk"
        entries={mockEntries}
        onDecrement={jest.fn()}
        onIncrement={jest.fn()}
        onUseAll={jest.fn()}
        onAddMore={jest.fn()}
        initialExpanded={true}
      />
    );

    // Should find all expiry statuses
    expect(getByText("Tomorrow")).toBeTruthy();
    expect(getByText("1 week")).toBeTruthy();
  });

  it("calls onAddMore when Add More button is pressed", () => {
    const onAddMore = jest.fn();
    const { getByText } = render(
      <ItemGroupCard
        itemName="Milk"
        entries={mockEntries}
        onDecrement={jest.fn()}
        onIncrement={jest.fn()}
        onUseAll={jest.fn()}
        onAddMore={onAddMore}
        initialExpanded={true}
      />
    );

    fireEvent.press(getByText("Add More"));
    expect(onAddMore).toHaveBeenCalledTimes(1);
  });
});
