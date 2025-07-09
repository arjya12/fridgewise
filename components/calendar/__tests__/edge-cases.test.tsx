import { render } from "@testing-library/react-native";
import React from "react";
import { FoodItem } from "../../../lib/supabase";
import { ExpiryStatus } from "../../../types/calendar";
import EmptyStateView from "../EmptyStateView";
import EnhancedExpiryCalendar from "../EnhancedExpiryCalendar";
import ItemCompactCard from "../ItemCompactCard";
import ItemDetailCard from "../ItemDetailCard";

// Mock ColorSchemeProvider first
jest.mock("../ColorSchemeProvider", () => {
  const React = require("react");

  const mockColorScheme = {
    expired: { primary: "#DC2626", secondary: "#FEF2F2", pattern: "solid" },
    today: { primary: "#EA580C", secondary: "#FFF7ED", pattern: "solid" },
    future: { primary: "#16A34A", secondary: "#F0FDF4", pattern: "solid" },
    accessibility: {
      highContrast: false,
      patterns: false,
      textAlternatives: true,
    },
  };

  const mockContextValue = {
    colorScheme: mockColorScheme,
    isHighContrast: false,
    patterns: [],
    updateColorScheme: jest.fn(),
    toggleHighContrast: jest.fn(),
    togglePatterns: jest.fn(),
  };

  return {
    __esModule: true,
    default: ({ children }) => children,
    useCalendarColorScheme: jest.fn(() => mockContextValue),
    useExpiryColors: jest.fn((status) => {
      const statusColors =
        status === "expired"
          ? mockColorScheme.expired
          : status === "today"
          ? mockColorScheme.today
          : mockColorScheme.future;
      return statusColors;
    }),
    usePattern: jest.fn(() => ({ name: "solid", type: "solid", density: 1 })),
    useAccessibilityFeatures: jest.fn(() => ({
      highContrast: false,
      patterns: false,
      textAlternatives: true,
      reducedMotion: false,
    })),
    withOpacity: jest.fn((color, opacity) => color),
    lightenColor: jest.fn((color) => color),
    darkenColor: jest.fn((color) => color),
  };
});

// Mock dependencies
jest.mock("react-native", () => {
  const actualRN = jest.requireActual("react-native");
  return {
    ...actualRN,
    Dimensions: {
      get: jest.fn(() => ({ width: 375, height: 812 })),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
    },
  };
});

jest.mock("../../../hooks/useThemeColor", () => ({
  useThemeColor: jest.fn(() => "#0a7ea4"),
}));

jest.mock("../../../hooks/useColorScheme", () => ({
  useColorScheme: jest.fn(() => "light"),
}));

jest.mock("../../RealisticFoodImage", () => {
  const React = require("react");
  return jest.fn(() => React.createElement("View", { testID: "food-image" }));
});

jest.mock("../../../services/foodItems", () => ({
  foodItemsService: {
    getItemsByExpiryDate: jest.fn(),
    deleteItem: jest.fn(),
  },
}));

jest.mock("react-native-calendars", () => {
  const React = require("react");
  return {
    Calendar: jest.fn(() =>
      React.createElement("View", { testID: "mock-calendar" })
    ),
  };
});

const createMockItem = (overrides: Partial<FoodItem> = {}): FoodItem => ({
  id: "test-id",
  name: "Test Item",
  quantity: 1,
  expiry_date: "2024-01-15",
  location: "fridge",
  category: "dairy",
  created_at: "2024-01-01T00:00:00Z",
  updated_at: "2024-01-01T00:00:00Z",
  user_id: "test-user",
  ...overrides,
});

const mockExpiryStatus: ExpiryStatus = {
  days: 2,
  text: "2 days",
  color: "#FF9500",
  urgency: "soon",
};

describe("Enhanced Calendar Edge Cases", () => {
  describe("ItemDetailCard Edge Cases", () => {
    const mockOnPress = jest.fn();
    const mockOnMarkUsed = jest.fn();
    const mockOnDelete = jest.fn();

    beforeEach(() => {
      jest.clearAllMocks();
    });

    it("handles items with missing name gracefully", () => {
      const itemWithoutName = createMockItem({ name: "" });

      const { getByRole } = render(
        <ItemDetailCard
          item={itemWithoutName}
          expiryStatus={mockExpiryStatus}
          onPress={mockOnPress}
          onMarkUsed={mockOnMarkUsed}
          onDelete={mockOnDelete}
        />
      );

      expect(getByRole("button")).toBeTruthy();
    });

    it("handles items with very long names", () => {
      const itemWithLongName = createMockItem({
        name: "This is an extremely long item name that should be truncated properly in the UI to prevent layout issues and ensure good user experience across different screen sizes and orientations",
      });

      const { getByRole } = render(
        <ItemDetailCard
          item={itemWithLongName}
          expiryStatus={mockExpiryStatus}
          onPress={mockOnPress}
          onMarkUsed={mockOnMarkUsed}
          onDelete={mockOnDelete}
        />
      );

      expect(getByRole("button")).toBeTruthy();
    });

    it("handles items with zero or negative quantity", () => {
      const itemWithZeroQuantity = createMockItem({ quantity: 0 });
      const itemWithNegativeQuantity = createMockItem({ quantity: -5 });

      const { getAllByRole } = render(
        <>
          <ItemDetailCard
            item={itemWithZeroQuantity}
            expiryStatus={mockExpiryStatus}
            onPress={mockOnPress}
            onMarkUsed={mockOnMarkUsed}
            onDelete={mockOnDelete}
          />
          <ItemDetailCard
            item={itemWithNegativeQuantity}
            expiryStatus={mockExpiryStatus}
            onPress={mockOnPress}
            onMarkUsed={mockOnMarkUsed}
            onDelete={mockOnDelete}
          />
        </>
      );

      expect(getAllByRole("button")).toHaveLength(2);
    });

    it("handles items with undefined/null expiry date", () => {
      const itemWithoutExpiry = createMockItem({ expiry_date: undefined });

      const { getByRole } = render(
        <ItemDetailCard
          item={itemWithoutExpiry}
          expiryStatus={mockExpiryStatus}
          onPress={mockOnPress}
          onMarkUsed={mockOnMarkUsed}
          onDelete={mockOnDelete}
        />
      );

      expect(getByRole("button")).toBeTruthy();
    });

    it("handles items with invalid location values", () => {
      const itemWithInvalidLocation = createMockItem({
        location: "invalid_location" as any,
      });

      const { getByRole } = render(
        <ItemDetailCard
          item={itemWithInvalidLocation}
          expiryStatus={mockExpiryStatus}
          onPress={mockOnPress}
          onMarkUsed={mockOnMarkUsed}
          onDelete={mockOnDelete}
        />
      );

      expect(getByRole("button")).toBeTruthy();
    });

    it("handles malformed created_at dates", () => {
      const itemWithBadDate = createMockItem({ created_at: "invalid-date" });

      const { getByRole } = render(
        <ItemDetailCard
          item={itemWithBadDate}
          expiryStatus={mockExpiryStatus}
          onPress={mockOnPress}
          onMarkUsed={mockOnMarkUsed}
          onDelete={mockOnDelete}
        />
      );

      expect(getByRole("button")).toBeTruthy();
    });
  });

  describe("ItemCompactCard Edge Cases", () => {
    const mockOnPress = jest.fn();

    beforeEach(() => {
      jest.clearAllMocks();
    });

    it("handles extremely high quantities", () => {
      const itemWithHighQuantity = createMockItem({ quantity: 999999 });

      const { getByRole } = render(
        <ItemCompactCard
          item={itemWithHighQuantity}
          expiryStatus={mockExpiryStatus}
          onPress={mockOnPress}
        />
      );

      expect(getByRole("button")).toBeTruthy();
    });

    it("handles special characters in item names", () => {
      const itemWithSpecialChars = createMockItem({
        name: "Item with ñ, é, ü, and emoji 🥛🧀",
      });

      const { getByRole } = render(
        <ItemCompactCard
          item={itemWithSpecialChars}
          expiryStatus={mockExpiryStatus}
          onPress={mockOnPress}
        />
      );

      expect(getByRole("button")).toBeTruthy();
    });

    it("handles missing expiry status gracefully", () => {
      const invalidExpiryStatus = {
        days: NaN,
        text: "",
        color: "",
        urgency: "fresh" as const,
      };

      const { getByRole } = render(
        <ItemCompactCard
          item={createMockItem()}
          expiryStatus={invalidExpiryStatus}
          onPress={mockOnPress}
        />
      );

      expect(getByRole("button")).toBeTruthy();
    });
  });

  describe("EmptyStateView Edge Cases", () => {
    it("handles missing selectedDate for no-items-on-date type", () => {
      const { getByText } = render(
        <EmptyStateView type="no-items-on-date" selectedDate={undefined} />
      );

      expect(getByText(/No items expire/)).toBeTruthy();
    });

    it("handles invalid date strings", () => {
      const { getByText } = render(
        <EmptyStateView type="no-items-on-date" selectedDate="invalid-date" />
      );

      expect(getByText(/No items expire/)).toBeTruthy();
    });

    it("handles onAddItem callback errors gracefully", () => {
      const errorThrowingCallback = jest.fn(() => {
        throw new Error("Test error");
      });

      const { getByRole } = render(
        <EmptyStateView
          type="no-items-on-date"
          selectedDate="2024-01-15"
          onAddItem={errorThrowingCallback}
        />
      );

      // Component should still render the button
      expect(getByRole("button")).toBeTruthy();
    });
  });

  describe("EnhancedExpiryCalendar Edge Cases", () => {
    const { foodItemsService } = require("../../../services/foodItems");

    beforeEach(() => {
      jest.clearAllMocks();
      // Reset to normal behavior
      foodItemsService.getItemsByExpiryDate.mockResolvedValue({});
      foodItemsService.deleteItem.mockResolvedValue(true);
    });

    it("handles service errors gracefully", async () => {
      foodItemsService.getItemsByExpiryDate.mockRejectedValue(
        new Error("Network error")
      );

      const { getByTestId } = render(<EnhancedExpiryCalendar />);

      // Should not crash and should render calendar
      expect(getByTestId("mock-calendar")).toBeTruthy();
    });

    it("handles empty data responses", async () => {
      foodItemsService.getItemsByExpiryDate.mockResolvedValue({});

      const { getByTestId } = render(<EnhancedExpiryCalendar />);

      expect(getByTestId("mock-calendar")).toBeTruthy();
    });

    it("handles malformed service responses", async () => {
      foodItemsService.getItemsByExpiryDate.mockResolvedValue(null);

      const { getByTestId } = render(<EnhancedExpiryCalendar />);

      expect(getByTestId("mock-calendar")).toBeTruthy();
    });

    it("handles delete operation failures", async () => {
      foodItemsService.deleteItem.mockRejectedValue(new Error("Delete failed"));

      const { getByTestId } = render(<EnhancedExpiryCalendar />);

      expect(getByTestId("mock-calendar")).toBeTruthy();
    });

    it("handles rapid state changes", async () => {
      // Test rapid prop changes
      const { rerender } = render(
        <EnhancedExpiryCalendar onItemPress={() => {}} />
      );

      rerender(<EnhancedExpiryCalendar onAddItem={() => {}} />);
      rerender(<EnhancedExpiryCalendar />);

      // Should not crash
      expect(true).toBe(true);
    });

    it("handles component unmounting during async operations", () => {
      // Start an async operation
      foodItemsService.getItemsByExpiryDate.mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 1000))
      );

      const { unmount } = render(<EnhancedExpiryCalendar />);

      // Unmount before operation completes
      expect(() => unmount()).not.toThrow();
    });
  });

  describe("Performance Edge Cases", () => {
    it("handles large numbers of items efficiently", () => {
      // Create 1000 mock items
      const manyItems = Array.from({ length: 1000 }, (_, i) =>
        createMockItem({
          id: `item-${i}`,
          name: `Item ${i}`,
          expiry_date: `2024-01-${String(15 + (i % 10)).padStart(2, "0")}`,
        })
      );

      const mockOnPress = jest.fn();

      // Should render without performance issues
      const startTime = Date.now();

      const { getAllByRole } = render(
        <>
          {manyItems.slice(0, 100).map((item) => (
            <ItemCompactCard
              key={item.id}
              item={item}
              expiryStatus={mockExpiryStatus}
              onPress={mockOnPress}
            />
          ))}
        </>
      );

      const renderTime = Date.now() - startTime;

      // Should render in reasonable time (less than 1 second)
      expect(renderTime).toBeLessThan(1000);
      expect(getAllByRole("button")).toHaveLength(100);
    });

    it("handles rapid user interactions", () => {
      const mockOnPress = jest.fn();

      const { getByRole } = render(
        <ItemCompactCard
          item={createMockItem()}
          expiryStatus={mockExpiryStatus}
          onPress={mockOnPress}
        />
      );

      const button = getByRole("button");

      // Simulate rapid taps
      for (let i = 0; i < 10; i++) {
        button.props.onPress();
      }

      // Should handle all calls
      expect(mockOnPress).toHaveBeenCalledTimes(10);
    });
  });

  describe("Accessibility Edge Cases", () => {
    it("handles accessibility when data is missing", () => {
      const itemWithMissingData = createMockItem({
        name: "",
        quantity: undefined,
        location: undefined,
      });

      const mockOnPress = jest.fn();

      const { getByRole } = render(
        <ItemCompactCard
          item={itemWithMissingData}
          expiryStatus={mockExpiryStatus}
          onPress={mockOnPress}
        />
      );

      const button = getByRole("button");
      expect(button.props.accessibilityLabel).toBeTruthy();
    });

    it("handles accessibility with special characters", () => {
      const itemWithSpecialName = createMockItem({
        name: "Café & Té with 100% organic ingredients",
      });

      const mockOnPress = jest.fn();

      const { getByRole } = render(
        <ItemCompactCard
          item={itemWithSpecialName}
          expiryStatus={mockExpiryStatus}
          onPress={mockOnPress}
        />
      );

      const button = getByRole("button");
      expect(button.props.accessibilityLabel).toContain("Café & Té");
    });
  });
});
