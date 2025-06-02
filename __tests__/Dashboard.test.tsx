import InventoryScreen from "@/app/(tabs)";
import { useAuth } from "@/contexts/AuthContext";
import { foodItemsService } from "@/services/foodItems";
import {
  fireEvent,
  render,
  RenderOptions,
  waitFor,
} from "@testing-library/react-native";
import React, { ReactNode } from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";

// Mock dependencies
jest.mock("@/contexts/AuthContext", () => ({
  useAuth: jest.fn(),
}));

jest.mock("@/services/foodItems", () => ({
  foodItemsService: {
    getItems: jest.fn(),
    updateItem: jest.fn(),
    deleteItem: jest.fn(),
    logUsage: jest.fn(),
  },
}));

jest.mock("expo-router", () => ({
  router: {
    replace: jest.fn(),
    push: jest.fn(),
  },
  useLocalSearchParams: jest.fn().mockReturnValue({}),
}));

// Mock components that might cause issues in tests
jest.mock("@/components/AppHeader", () => "AppHeader");
jest.mock("expo-linear-gradient", () => ({
  LinearGradient: "LinearGradient",
}));

// Mock SafeAreaContext
jest.mock("react-native-safe-area-context", () => {
  const insets = { top: 0, right: 0, bottom: 0, left: 0 };
  return {
    SafeAreaProvider: ({ children }: { children: ReactNode }) => children,
    SafeAreaView: ({ children }: { children: ReactNode }) => children,
    useSafeAreaInsets: () => insets,
  };
});

// Mock useColorScheme
jest.mock("@/hooks/useColorScheme", () => ({
  useColorScheme: () => "light",
}));

interface ProvidersProps {
  children: ReactNode;
}

const AllTheProviders = ({ children }: ProvidersProps) => {
  return <SafeAreaProvider>{children}</SafeAreaProvider>;
};

describe("Dashboard", () => {
  // Setup mock data
  const mockItems = [
    {
      id: "1",
      name: "Milk",
      quantity: 2,
      expiry_date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days from now
      location: "fridge",
    },
    {
      id: "2",
      name: "Milk",
      quantity: 1,
      expiry_date: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000).toISOString(), // 6 days from now
      location: "fridge",
    },
    {
      id: "3",
      name: "Bread",
      quantity: 3,
      expiry_date: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 day from now
      location: "shelf",
    },
  ];

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Mock auth context
    (useAuth as jest.Mock).mockReturnValue({
      user: { id: "test-user" },
    });

    // Mock foodItemsService
    (foodItemsService.getItems as jest.Mock).mockResolvedValue(mockItems);
  });

  const customRender = (
    ui: React.ReactElement,
    options?: Omit<RenderOptions, "wrapper">
  ) => render(ui, { wrapper: AllTheProviders, ...options });

  it("loads and displays items grouped by name", async () => {
    const { findByText, findAllByText } = customRender(<InventoryScreen />, {});

    // Wait for items to load
    await findByText("Your Inventory");

    // Should show item groups
    await findByText("Milk");
    await findByText("Bread");

    // Check for correct entry counts
    await findByText("3 total • 2 entries"); // Milk group
    await findByText("3 total • 1 entry"); // Bread group
  });

  it('displays "Use First" tag on earliest expiring item', async () => {
    const { findAllByText } = customRender(<InventoryScreen />, {});

    // Wait for the Use First tags to appear
    const useFirstTags = await findAllByText("Use First");

    // There should be exactly 2 "Use First" tags (one for each group)
    expect(useFirstTags.length).toBe(2);
  });

  it("displays expiry status correctly", async () => {
    const { findByText } = customRender(<InventoryScreen />, {});

    // Check for various expiry statuses
    await findByText("2 days");
    await findByText("6 days");
    await findByText("Tomorrow");
  });

  it("increments quantity when + button is pressed", async () => {
    (foodItemsService.updateItem as jest.Mock).mockResolvedValue({
      success: true,
    });

    const { findAllByLabelText } = customRender(<InventoryScreen />, {});

    // Wait for the + buttons to appear
    const incrementButtons = await findAllByLabelText("Increase quantity");

    // Press the first + button
    fireEvent.press(incrementButtons[0]);

    // Check if updateItem was called correctly
    await waitFor(() => {
      expect(foodItemsService.updateItem).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          quantity: 3, // Incremented from 2
        })
      );
    });
  });

  it("decrements quantity when - button is pressed", async () => {
    (foodItemsService.updateItem as jest.Mock).mockResolvedValue({
      success: true,
    });

    const { findAllByLabelText } = customRender(<InventoryScreen />, {});

    // Wait for the - buttons to appear
    const decrementButtons = await findAllByLabelText("Decrease quantity");

    // Press the first - button
    fireEvent.press(decrementButtons[0]);

    // Check if updateItem was called correctly
    await waitFor(() => {
      expect(foodItemsService.updateItem).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          quantity: 1, // Decremented from 2
        })
      );
    });
  });

  it('uses all items when "Use All" button is pressed', async () => {
    (foodItemsService.logUsage as jest.Mock).mockResolvedValue({
      success: true,
    });

    const { findAllByLabelText } = customRender(<InventoryScreen />, {});

    // Wait for the Use All buttons to appear
    const useAllButtons = await findAllByLabelText("Use all");

    // Press the first Use All button
    fireEvent.press(useAllButtons[0]);

    // Check if logUsage was called correctly
    await waitFor(() => {
      expect(foodItemsService.logUsage).toHaveBeenCalledWith(
        expect.any(String),
        "used",
        expect.any(Number)
      );
    });
  });
});
