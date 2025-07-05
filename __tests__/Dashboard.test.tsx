import InventoryScreen from "@/app/(tabs)";
import { useAuth } from "@/contexts/AuthContext";
import { useSettings } from "@/contexts/SettingsContext";
import { useTips } from "@/contexts/TipsContext";
import { foodItemsService } from "@/services/foodItems";
import { render } from "@testing-library/react-native";
import React from "react";
import "react-native-gesture-handler/jestSetup";

// Polyfill setImmediate for React Native animations
global.setImmediate =
  global.setImmediate ||
  ((fn: any, ...args: any[]) => global.setTimeout(fn, 0, ...args));

// Mock external dependencies
jest.mock("@/contexts/AuthContext");
jest.mock("@/services/foodItems");
jest.mock("@/contexts/SettingsContext");
jest.mock("@/contexts/TipsContext");
jest.mock("@/lib/supabase");
jest.mock("expo-router", () => ({
  router: {
    push: jest.fn(),
    replace: jest.fn(),
  },
}));

// Mock vector icons
jest.mock("@expo/vector-icons", () => {
  const { View } = require("react-native");
  return {
    Ionicons: View,
    MaterialIcons: View,
  };
});

// Mock LinearGradient
jest.mock("expo-linear-gradient", () => {
  const { View } = require("react-native");
  return {
    LinearGradient: View,
  };
});

// Mock color scheme
jest.mock("@/hooks/useColorScheme", () => ({
  useColorScheme: () => "light",
}));

// Mock AnimatedCounter component specifically
jest.mock("@/components/AnimatedCounter", () => {
  const { Text } = require("react-native");
  const mockReact = require("react");
  return function MockAnimatedCounter({ value }: { value: number }) {
    return mockReact.createElement(Text, {}, value.toString());
  };
});

// Mock reanimated
jest.mock("react-native-reanimated", () => {
  const Reanimated = require("react-native-reanimated/mock");
  Reanimated.default.call = () => {};
  return Reanimated;
});

// Comprehensive mock for react-native-safe-area-context
jest.mock("react-native-safe-area-context", () => {
  const { View } = require("react-native");
  const mockReact = require("react");

  return {
    SafeAreaProvider: ({ children }: { children: any }) => {
      return mockReact.createElement(
        View,
        { testID: "safe-area-provider" },
        children
      );
    },
    SafeAreaView: ({ children, ...props }: { children: any }) => {
      return mockReact.createElement(
        View,
        { testID: "safe-area-view", ...props },
        children
      );
    },
    useSafeAreaInsets: () => ({
      top: 44,
      bottom: 34,
      left: 0,
      right: 0,
    }),
  };
});

const mockUser = { id: "user-123", email: "test@example.com" };
const mockItems = [
  {
    id: "1",
    name: "Milk",
    quantity: 2,
    expiry_date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
    location: "fridge",
    category: "Dairy",
    user_id: "user-123",
    created_at: new Date().toISOString(),
    notes: "",
    image_url: "",
  },
];

describe("InventoryScreen", () => {
  beforeEach(() => {
    (useAuth as jest.Mock).mockReturnValue({ user: mockUser });
    (foodItemsService.getItems as jest.Mock).mockResolvedValue(mockItems);
    (useSettings as jest.Mock).mockReturnValue({ helpfulTips: true });
    (useTips as jest.Mock).mockReturnValue({
      currentTip: { id: "1", text: "Test tip" },
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("renders correctly and fetches items", async () => {
    try {
      const { findByText } = render(<InventoryScreen />);

      // First check that the basic structure renders
      expect(await findByText("Your Inventory")).toBeTruthy();

      // Then wait for the items to load (the mock should resolve quickly)
      expect(await findByText("Milk", {}, { timeout: 10000 })).toBeTruthy();
    } catch (error) {
      console.error("Dashboard render error:", error);
      throw error;
    }
  }, 15000); // Increase timeout to 15 seconds
});
