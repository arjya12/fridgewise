// test-utils.tsx
import { render, RenderOptions } from "@testing-library/react-native";
import React, { ReactElement } from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";

// Mock SafeAreaProvider for tests
jest.mock("react-native-safe-area-context", () => {
  const inset = { top: 0, right: 0, bottom: 0, left: 0 };
  return {
    SafeAreaProvider: ({ children }: { children: React.ReactNode }) => children,
    SafeAreaConsumer: ({
      children,
    }: {
      children: (insets: any) => React.ReactNode;
    }) => children(inset),
    SafeAreaView: ({ children }: { children: React.ReactNode }) => children,
    useSafeAreaInsets: () => inset,
  };
});

// Mock AuthContext to avoid circular dependencies in tests
jest.mock("@/contexts/AuthContext", () => ({
  AuthProvider: ({ children }: { children: React.ReactNode }) => children,
  useAuth: jest.fn(),
}));

// Mock ColorSchemeProvider for calendar tests with proper interface
const MockColorSchemeProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const mockColorScheme = {
    expired: {
      primary: "#DC2626",
      secondary: "#FEF2F2",
      pattern: "solid" as const,
    },
    today: {
      primary: "#EA580C",
      secondary: "#FFF7ED",
      pattern: "solid" as const,
    },
    future: {
      primary: "#16A34A",
      secondary: "#F0FDF4",
      pattern: "solid" as const,
    },
    accessibility: {
      highContrast: false,
      patterns: false,
      textAlternatives: true,
    },
  };

  const mockPatterns = [
    {
      name: "expired-striped",
      type: "striped" as const,
      density: 0.7,
      angle: 45,
      spacing: 3,
    },
    {
      name: "today-dotted",
      type: "dotted" as const,
      density: 0.5,
      spacing: 2,
    },
    {
      name: "future-solid",
      type: "solid" as const,
      density: 1.0,
    },
  ];

  const mockContextValue = {
    colorScheme: mockColorScheme,
    isHighContrast: false,
    patterns: mockPatterns,
    updateColorScheme: jest.fn(),
    toggleHighContrast: jest.fn(),
    togglePatterns: jest.fn(),
  };

  const MockContext = React.createContext(mockContextValue);

  return React.createElement(
    MockContext.Provider,
    { value: mockContextValue },
    children
  );
};

interface AllTheProvidersProps {
  children: React.ReactNode;
}

// Add all providers that your app needs
const AllTheProviders = ({ children }: AllTheProvidersProps) => {
  return (
    <SafeAreaProvider>
      <MockColorSchemeProvider>{children}</MockColorSchemeProvider>
    </SafeAreaProvider>
  );
};

const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, "wrapper">
) => render(ui, { wrapper: AllTheProviders, ...options });

// re-export everything
export * from "@testing-library/react-native";

// override render method
export { customRender as render };

// Test data generation utilities
export interface MockFoodItem {
  id: string;
  name: string;
  expiry_date: string;
  quantity: number;
  category: string;
  location: "fridge" | "freezer" | "pantry";
  user_id: string;
  created_at: string;
  updated_at: string;
}

export function createMockFoodItem(
  overrides: Partial<MockFoodItem> = {}
): MockFoodItem {
  const baseDate = new Date();
  const expiryDate = new Date(
    baseDate.getTime() + Math.random() * 30 * 24 * 60 * 60 * 1000
  ); // Random expiry within 30 days

  return {
    id: `item-${Math.random().toString(36).substr(2, 9)}`,
    name: `Test Item ${Math.floor(Math.random() * 1000)}`,
    expiry_date: expiryDate.toISOString().split("T")[0],
    quantity: Math.floor(Math.random() * 5) + 1,
    category: ["fruits", "vegetables", "dairy", "meat", "grains"][
      Math.floor(Math.random() * 5)
    ],
    location: ["fridge", "freezer", "pantry"][Math.floor(Math.random() * 3)] as
      | "fridge"
      | "freezer"
      | "pantry",
    user_id: "test-user-id",
    created_at: baseDate.toISOString(),
    updated_at: baseDate.toISOString(),
    ...overrides,
  };
}

export function generateTestData(count: number): MockFoodItem[] {
  return Array.from({ length: count }, () => createMockFoodItem());
}
