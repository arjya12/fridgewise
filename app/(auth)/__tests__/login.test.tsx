import WelcomeScreen from "@/app/(auth)/welcome";
import { useAuth } from "@/contexts/AuthContext";
import { NavigationContainer } from "@react-navigation/native";
import { fireEvent, render, waitFor } from "@testing-library/react-native";
import { router } from "expo-router";
import React from "react";
import { Alert } from "react-native";

jest.mock("@expo/vector-icons", () => {
  const { View } = require("react-native");
  return {
    Ionicons: View,
  };
});

jest.mock("expo-router", () => ({
  router: {
    replace: jest.fn(),
  },
}));

jest.mock("@/contexts/AuthContext", () => ({
  useAuth: jest.fn(),
}));

jest.mock("@/hooks/useColorScheme", () => ({
  useColorScheme: () => "light",
}));

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

describe("WelcomeScreen (login flow)", () => {
  let mockSignIn: jest.Mock;

  beforeEach(() => {
    mockSignIn = jest.fn();
    (useAuth as jest.Mock).mockReturnValue({
      signIn: mockSignIn,
    });
    jest.clearAllMocks();
    jest.spyOn(Alert, "alert");
  });

  it("should handle login with valid credentials", async () => {
    mockSignIn.mockResolvedValueOnce(undefined);

    const { getByPlaceholderText, getByText } = render(
      <NavigationContainer>
        <WelcomeScreen />
      </NavigationContainer>
    );

    const emailInput = getByPlaceholderText("Email address");
    const passwordInput = getByPlaceholderText("Password");
    const loginButton = getByText("Sign in");

    fireEvent.changeText(emailInput, "test@example.com");
    fireEvent.changeText(passwordInput, "password123");
    fireEvent.press(loginButton);

    // Wait a bit for the async operation to complete
    await new Promise((resolve) => setTimeout(resolve, 100));

    expect(mockSignIn).toHaveBeenCalledWith("test@example.com", "password123");
    expect(router.replace).toHaveBeenCalledWith("/(tabs)");
  }, 10000); // Add 10 second timeout

  it("should handle login error", async () => {
    mockSignIn.mockRejectedValueOnce(new Error("Invalid credentials"));

    const { getByPlaceholderText, getByText } = render(
      <NavigationContainer>
        <WelcomeScreen />
      </NavigationContainer>
    );

    const emailInput = getByPlaceholderText("Email address");
    const passwordInput = getByPlaceholderText("Password");
    const loginButton = getByText("Sign in");

    fireEvent.changeText(emailInput, "test@example.com");
    fireEvent.changeText(passwordInput, "password123");
    fireEvent.press(loginButton);

    await waitFor(() => {
      expect(mockSignIn).toHaveBeenCalledWith(
        "test@example.com",
        "password123"
      );
    });
  });
});
