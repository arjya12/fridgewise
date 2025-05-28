import { useAuth } from "@/contexts/AuthContext";
import { fireEvent, render, waitFor } from "@/test-utils";
import { router } from "expo-router";
import React from "react";
import { Alert } from "react-native";
import LoginScreen from "../login";

// Mock the auth hook
jest.mock("@/contexts/AuthContext", () => ({
  useAuth: jest.fn(),
}));

// Mock expo-router
jest.mock("expo-router", () => ({
  router: {
    replace: jest.fn(),
  },
  Link: ({ children }: { children: React.ReactNode }) => children,
}));

// Mock expo-linear-gradient
jest.mock("expo-linear-gradient", () => ({
  LinearGradient: ({ children }: { children: React.ReactNode }) => children,
}));

// Mock @expo/vector-icons
jest.mock("@expo/vector-icons", () => ({
  Ionicons: "Ionicons",
}));

// Mock React Native Alert
jest.spyOn(Alert, "alert");

describe("LoginScreen", () => {
  const mockSignIn = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useAuth as jest.Mock).mockReturnValue({
      signIn: mockSignIn,
      user: null,
      session: null,
      loading: false,
    });
  });

  it("should render login form", () => {
    const { getByPlaceholderText, getByText } = render(<LoginScreen />);

    expect(getByText("Shelf & Fridge Tracker")).toBeTruthy();
    expect(getByText("Start your journey to zero food waste")).toBeTruthy();
    expect(getByText("Welcome back")).toBeTruthy();
    expect(getByText("Sign in to continue")).toBeTruthy();
    expect(getByPlaceholderText("your@email.com")).toBeTruthy();
    expect(getByPlaceholderText("Enter your password")).toBeTruthy();
    expect(getByText("Sign in")).toBeTruthy();
    expect(getByText("New here?")).toBeTruthy();
    expect(getByText("Create account")).toBeTruthy();
  });

  it("should handle login with valid credentials", async () => {
    mockSignIn.mockResolvedValueOnce(undefined);
    const { getByPlaceholderText, getByText } = render(<LoginScreen />);

    const emailInput = getByPlaceholderText("your@email.com");
    const passwordInput = getByPlaceholderText("Enter your password");
    const loginButton = getByText("Sign in");

    fireEvent.changeText(emailInput, "test@example.com");
    fireEvent.changeText(passwordInput, "password123");
    fireEvent.press(loginButton);

    await waitFor(() => {
      expect(mockSignIn).toHaveBeenCalledWith(
        "test@example.com",
        "password123"
      );
      expect(router.replace).toHaveBeenCalledWith("/(tabs)");
    });
  });

  it("should show alert when fields are empty", async () => {
    const { getByText } = render(<LoginScreen />);
    const loginButton = getByText("Sign in");

    fireEvent.press(loginButton);

    expect(Alert.alert).toHaveBeenCalledWith("Please fill in all fields");
    expect(mockSignIn).not.toHaveBeenCalled();
  });

  it("should handle login error", async () => {
    const error = new Error("Invalid credentials");
    mockSignIn.mockRejectedValueOnce(error);

    const { getByPlaceholderText, getByText } = render(<LoginScreen />);

    const emailInput = getByPlaceholderText("your@email.com");
    const passwordInput = getByPlaceholderText("Enter your password");
    const loginButton = getByText("Sign in");

    fireEvent.changeText(emailInput, "test@example.com");
    fireEvent.changeText(passwordInput, "wrongpassword");
    fireEvent.press(loginButton);

    await waitFor(() => {
      expect(mockSignIn).toHaveBeenCalledWith(
        "test@example.com",
        "wrongpassword"
      );
      expect(router.replace).not.toHaveBeenCalled();
    });
  });
});
