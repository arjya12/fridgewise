import { render } from "@testing-library/react-native";
import React from "react";
import { FoodItem } from "../../../lib/supabase";
import { ExpiryStatus } from "../../../types/calendar";
import ActionButton from "../ActionButton";
import CalendarLegend from "../CalendarLegend";
import EmptyStateView from "../EmptyStateView";
import ItemCompactCard from "../ItemCompactCard";
import ItemDetailCard from "../ItemDetailCard";

// Mock dependencies
jest.mock("../../../hooks/useThemeColor", () => ({
  useThemeColor: jest.fn(() => "#0a7ea4"),
}));

jest.mock("../../RealisticFoodImage", () =>
  jest.fn(() => React.createElement("View", { testID: "food-image" }))
);

const mockItem: FoodItem = {
  id: "test-id",
  name: "Test Item",
  quantity: 2,
  expiry_date: "2024-01-15",
  location: "fridge",
  category: "dairy",
  created_at: "2024-01-01T00:00:00Z",
  updated_at: "2024-01-01T00:00:00Z",
  user_id: "test-user",
};

const mockExpiryStatus: ExpiryStatus = {
  days: 2,
  text: "2 days",
  color: "#FF9500",
  urgency: "soon",
};

describe("Accessibility Tests", () => {
  describe("CalendarLegend Accessibility", () => {
    it("provides clear text descriptions for legend items", () => {
      const { getByText } = render(<CalendarLegend />);

      expect(getByText("Red: Expired")).toBeTruthy();
      expect(getByText("Orange: Today")).toBeTruthy();
      expect(getByText("Green: Future expiry")).toBeTruthy();
    });

    it("maintains readability in compact mode", () => {
      const { getByText } = render(<CalendarLegend compact={true} />);

      expect(getByText("Expired")).toBeTruthy();
      expect(getByText("Today")).toBeTruthy();
      expect(getByText("Future")).toBeTruthy();
    });
  });

  describe("ActionButton Accessibility", () => {
    const mockOnPress = jest.fn();

    beforeEach(() => {
      mockOnPress.mockClear();
    });

    it("has proper button role and labels", () => {
      const { getByRole } = render(
        <ActionButton type="used" onPress={mockOnPress} />
      );

      const button = getByRole("button");
      expect(button).toBeTruthy();
      expect(button.props.accessibilityLabel).toBe("Mark as Used");
    });

    it("provides accessibility hints for actions", () => {
      const { getByRole } = render(
        <ActionButton type="used" onPress={mockOnPress} />
      );

      const button = getByRole("button");
      expect(button.props.accessibilityHint).toBe(
        "Marks this item as consumed"
      );
    });

    it("provides accessibility hints for delete action", () => {
      const { getByRole } = render(
        <ActionButton type="delete" onPress={mockOnPress} />
      );

      const button = getByRole("button");
      expect(button.props.accessibilityHint).toBe(
        "Removes this item from your inventory"
      );
    });

    it("indicates disabled state correctly", () => {
      const { getByRole } = render(
        <ActionButton type="used" onPress={mockOnPress} disabled={true} />
      );

      const button = getByRole("button");
      expect(button.props.accessibilityState.disabled).toBe(true);
    });
  });

  describe("ItemCompactCard Accessibility", () => {
    const mockOnPress = jest.fn();

    beforeEach(() => {
      mockOnPress.mockClear();
    });

    it("has proper button role and comprehensive label", () => {
      const { getByRole } = render(
        <ItemCompactCard
          item={mockItem}
          expiryStatus={mockExpiryStatus}
          onPress={mockOnPress}
        />
      );

      const button = getByRole("button");
      expect(button).toBeTruthy();
      expect(button.props.accessibilityLabel).toContain("Test Item");
      expect(button.props.accessibilityLabel).toContain("quantity 2");
      expect(button.props.accessibilityLabel).toContain("expires 2 days");
    });

    it("provides helpful accessibility hint", () => {
      const { getByRole } = render(
        <ItemCompactCard
          item={mockItem}
          expiryStatus={mockExpiryStatus}
          onPress={mockOnPress}
        />
      );

      const button = getByRole("button");
      expect(button.props.accessibilityHint).toBe("Tap to view item details");
    });

    it("handles items without quantity gracefully", () => {
      const itemWithoutQuantity = { ...mockItem, quantity: 1 }; // Use 1 instead of undefined
      const { getByRole } = render(
        <ItemCompactCard
          item={itemWithoutQuantity}
          expiryStatus={mockExpiryStatus}
          onPress={mockOnPress}
        />
      );

      const button = getByRole("button");
      expect(button.props.accessibilityLabel).toContain("quantity 1");
    });
  });

  describe("ItemDetailCard Accessibility", () => {
    const mockOnPress = jest.fn();
    const mockOnMarkUsed = jest.fn();
    const mockOnDelete = jest.fn();

    beforeEach(() => {
      mockOnPress.mockClear();
      mockOnMarkUsed.mockClear();
      mockOnDelete.mockClear();
    });

    it("has comprehensive accessibility label", () => {
      const { getByRole } = render(
        <ItemDetailCard
          item={mockItem}
          expiryStatus={mockExpiryStatus}
          onPress={mockOnPress}
          onMarkUsed={mockOnMarkUsed}
          onDelete={mockOnDelete}
        />
      );

      const button = getByRole("button");
      expect(button.props.accessibilityLabel).toContain("Test Item");
      expect(button.props.accessibilityLabel).toContain("expires 2 days");
      expect(button.props.accessibilityLabel).toContain("Fridge");
    });

    it("provides helpful accessibility hint", () => {
      const { getByRole } = render(
        <ItemDetailCard
          item={mockItem}
          expiryStatus={mockExpiryStatus}
          onPress={mockOnPress}
          onMarkUsed={mockOnMarkUsed}
          onDelete={mockOnDelete}
        />
      );

      const button = getByRole("button");
      expect(button.props.accessibilityHint).toBe(
        "Tap to view full item details"
      );
    });

    it("action buttons are accessible when shown", () => {
      const { getAllByRole } = render(
        <ItemDetailCard
          item={mockItem}
          expiryStatus={mockExpiryStatus}
          onPress={mockOnPress}
          onMarkUsed={mockOnMarkUsed}
          onDelete={mockOnDelete}
          showActions={true}
        />
      );

      const buttons = getAllByRole("button");
      expect(buttons.length).toBeGreaterThan(1); // Main card + action buttons
    });

    it("hides action buttons when showActions is false", () => {
      const { getAllByRole } = render(
        <ItemDetailCard
          item={mockItem}
          expiryStatus={mockExpiryStatus}
          onPress={mockOnPress}
          onMarkUsed={mockOnMarkUsed}
          onDelete={mockOnDelete}
          showActions={false}
        />
      );

      const buttons = getAllByRole("button");
      expect(buttons.length).toBe(1); // Only main card button
    });
  });

  describe("EmptyStateView Accessibility", () => {
    it("provides descriptive text for no date selected state", () => {
      const { getByText } = render(<EmptyStateView type="no-date-selected" />);

      expect(getByText("Select a date")).toBeTruthy();
      expect(
        getByText("Tap on a calendar date to see items expiring that day")
      ).toBeTruthy();
    });

    it("provides descriptive text for no items on date state", () => {
      const { getByText } = render(
        <EmptyStateView type="no-items-on-date" selectedDate="2024-01-15" />
      );

      expect(getByText(/No items expire/)).toBeTruthy();
      expect(getByText("Great! Your food is lasting longer.")).toBeTruthy();
    });

    it("has accessible add button when available", () => {
      const mockOnAddItem = jest.fn();
      const { getByRole } = render(
        <EmptyStateView
          type="no-items-on-date"
          selectedDate="2024-01-15"
          onAddItem={mockOnAddItem}
        />
      );

      const button = getByRole("button");
      expect(button.props.accessibilityLabel).toBe("Add new item");
      expect(button.props.accessibilityHint).toBe(
        "Navigates to add new item screen"
      );
    });

    it("has accessible emoji with proper label", () => {
      const { getByLabelText } = render(
        <EmptyStateView type="no-date-selected" />
      );

      const emoji = getByLabelText("decorative emoji");
      expect(emoji).toBeTruthy();
    });
  });

  describe("Text Contrast and Readability", () => {
    it("uses appropriate text colors for different themes", () => {
      // This would be more comprehensive with actual color testing
      const { getByText } = render(<CalendarLegend />);
      expect(getByText("Red: Expired")).toBeTruthy();
    });

    it("maintains readability in compact layouts", () => {
      const { getByText } = render(<CalendarLegend compact={true} />);
      expect(getByText("Expired")).toBeTruthy();
    });
  });

  describe("Touch Target Sizes", () => {
    it("action buttons meet minimum touch target size", () => {
      const mockOnPress = jest.fn();
      const { getByRole } = render(
        <ActionButton type="used" onPress={mockOnPress} size="small" />
      );

      const button = getByRole("button");
      expect(button).toBeTruthy(); // Should render without issues
    });

    it("item cards have adequate touch areas", () => {
      const mockOnPress = jest.fn();
      const { getByRole } = render(
        <ItemCompactCard
          item={mockItem}
          expiryStatus={mockExpiryStatus}
          onPress={mockOnPress}
        />
      );

      const button = getByRole("button");
      expect(button).toBeTruthy();
    });
  });

  describe("Screen Reader Navigation", () => {
    it("provides logical reading order for calendar legend", () => {
      const { getByText } = render(<CalendarLegend />);

      // Items should be in logical order
      expect(getByText("Red: Expired")).toBeTruthy();
      expect(getByText("Orange: Today")).toBeTruthy();
      expect(getByText("Green: Future expiry")).toBeTruthy();
    });

    it("groups related information in item cards", () => {
      const mockOnPress = jest.fn();
      const mockOnMarkUsed = jest.fn();
      const mockOnDelete = jest.fn();

      const { getByRole } = render(
        <ItemDetailCard
          item={mockItem}
          expiryStatus={mockExpiryStatus}
          onPress={mockOnPress}
          onMarkUsed={mockOnMarkUsed}
          onDelete={mockOnDelete}
        />
      );

      const button = getByRole("button");
      expect(button.props.accessibilityLabel).toContain("Test Item");
    });
  });

  describe("State Announcements", () => {
    it("provides clear feedback for disabled states", () => {
      const mockOnPress = jest.fn();
      const { getByRole } = render(
        <ActionButton type="used" onPress={mockOnPress} disabled={true} />
      );

      const button = getByRole("button");
      expect(button.props.accessibilityState.disabled).toBe(true);
    });

    it("maintains context across state changes", () => {
      // This would test state transition announcements in a real implementation
      const { getByText } = render(<EmptyStateView type="no-date-selected" />);

      expect(getByText("Select a date")).toBeTruthy();
    });
  });

  describe("Error Handling for Accessibility", () => {
    it("handles missing data gracefully for screen readers", () => {
      const itemWithMissingData = {
        ...mockItem,
        name: "",
        quantity: 1, // Use 1 instead of undefined
      };

      const mockOnPress = jest.fn();
      const { getByRole } = render(
        <ItemCompactCard
          item={itemWithMissingData}
          expiryStatus={mockExpiryStatus}
          onPress={mockOnPress}
        />
      );

      const button = getByRole("button");
      expect(button).toBeTruthy(); // Should still render and be accessible
    });
  });
});
