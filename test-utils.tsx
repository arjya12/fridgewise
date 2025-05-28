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

interface AllTheProvidersProps {
  children: React.ReactNode;
}

// Add all providers that your app needs
const AllTheProviders = ({ children }: AllTheProvidersProps) => {
  return <SafeAreaProvider>{children}</SafeAreaProvider>;
};

const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, "wrapper">
) => render(ui, { wrapper: AllTheProviders, ...options });

// re-export everything
export * from "@testing-library/react-native";

// override render method
export { customRender as render };
