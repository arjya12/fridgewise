import { useAuth } from "@/contexts/AuthContext";
import { fireEvent, render, waitFor } from "@/test-utils";
import { router } from "expo-router";
import React from "react";
import { Alert } from "react-native";
import SignUpScreen from "../signup";

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

describe("SignUpScreen", () => {
  const mockSignUp = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useAuth as jest.Mock).mockReturnValue({
      signUp: mockSignUp,
      user: null,
      session: null,
      loading: false,
    });
  });

  it("should render signup form", () => {
    const { getByPlaceholderText, getByText, getAllByText } = render(
      <SignUpScreen />
    );

    expect(getByText("Shelf & Fridge Tracker")).toBeTruthy();
    expect(getByText("Start your journey to zero food waste")).toBeTruthy();

    // There are two "Create Account" texts - header and button
    const createAccountTexts = getAllByText("Create Account");
    expect(createAccountTexts).toHaveLength(2);

    expect(getByText("Join thousands reducing food waste")).toBeTruthy();
    expect(getByPlaceholderText("Enter your full name")).toBeTruthy();
    expect(getByPlaceholderText("your@email.com")).toBeTruthy();
    expect(getByPlaceholderText("Create a strong password")).toBeTruthy();
    expect(getByPlaceholderText("Confirm your password")).toBeTruthy();
    expect(getByText("Already have an account?")).toBeTruthy();
  });

  it("should handle signup with valid credentials", async () => {
    mockSignUp.mockResolvedValueOnce(undefined);
    const { getByPlaceholderText, getByTestId } = render(<SignUpScreen />);

    const fullNameInput = getByPlaceholderText("Enter your full name");
    const emailInput = getByPlaceholderText("your@email.com");
    const passwordInput = getByPlaceholderText("Create a strong password");
    const confirmPasswordInput = getByPlaceholderText("Confirm your password");
    const termsCheckbox = getByTestId("terms-checkbox");
    const signupButton = getByTestId("signup-button");

    fireEvent.changeText(fullNameInput, "John Doe");
    fireEvent.changeText(emailInput, "test@example.com");
    fireEvent.changeText(passwordInput, "password123");
    fireEvent.changeText(confirmPasswordInput, "password123");
    fireEvent.press(termsCheckbox);
    fireEvent.press(signupButton);

    await waitFor(() => {
      expect(mockSignUp).toHaveBeenCalledWith(
        "test@example.com",
        "password123",
        "John Doe"
      );
      expect(Alert.alert).toHaveBeenCalledWith(
        "Sign up successful! Please check your email to verify your account."
      );
      expect(router.replace).toHaveBeenCalledWith("/(auth)/login");
    });
  });

  it("should show alert when fields are empty", async () => {
    const { getByTestId } = render(<SignUpScreen />);
    const signupButton = getByTestId("signup-button");

    fireEvent.press(signupButton);

    expect(Alert.alert).toHaveBeenCalledWith("Please fill in all fields");
    expect(mockSignUp).not.toHaveBeenCalled();
  });

  it("should show alert when passwords do not match", async () => {
    const { getByPlaceholderText, getByTestId } = render(<SignUpScreen />);

    const fullNameInput = getByPlaceholderText("Enter your full name");
    const emailInput = getByPlaceholderText("your@email.com");
    const passwordInput = getByPlaceholderText("Create a strong password");
    const confirmPasswordInput = getByPlaceholderText("Confirm your password");
    const termsCheckbox = getByTestId("terms-checkbox");
    const signupButton = getByTestId("signup-button");

    fireEvent.changeText(fullNameInput, "John Doe");
    fireEvent.changeText(emailInput, "test@example.com");
    fireEvent.changeText(passwordInput, "password123");
    fireEvent.changeText(confirmPasswordInput, "password456");
    fireEvent.press(termsCheckbox);
    fireEvent.press(signupButton);

    expect(Alert.alert).toHaveBeenCalledWith("Passwords do not match");
    expect(mockSignUp).not.toHaveBeenCalled();
  });

  it("should show alert when password is too short", async () => {
    const { getByPlaceholderText, getByTestId } = render(<SignUpScreen />);

    const fullNameInput = getByPlaceholderText("Enter your full name");
    const emailInput = getByPlaceholderText("your@email.com");
    const passwordInput = getByPlaceholderText("Create a strong password");
    const confirmPasswordInput = getByPlaceholderText("Confirm your password");
    const termsCheckbox = getByTestId("terms-checkbox");
    const signupButton = getByTestId("signup-button");

    fireEvent.changeText(fullNameInput, "John Doe");
    fireEvent.changeText(emailInput, "test@example.com");
    fireEvent.changeText(passwordInput, "pass");
    fireEvent.changeText(confirmPasswordInput, "pass");
    fireEvent.press(termsCheckbox);
    fireEvent.press(signupButton);

    expect(Alert.alert).toHaveBeenCalledWith(
      "Password must be at least 6 characters long"
    );
    expect(mockSignUp).not.toHaveBeenCalled();
  });

  it("should show alert when terms are not agreed", async () => {
    const { getByPlaceholderText, getByTestId } = render(<SignUpScreen />);

    const fullNameInput = getByPlaceholderText("Enter your full name");
    const emailInput = getByPlaceholderText("your@email.com");
    const passwordInput = getByPlaceholderText("Create a strong password");
    const confirmPasswordInput = getByPlaceholderText("Confirm your password");
    const signupButton = getByTestId("signup-button");

    fireEvent.changeText(fullNameInput, "John Doe");
    fireEvent.changeText(emailInput, "test@example.com");
    fireEvent.changeText(passwordInput, "password123");
    fireEvent.changeText(confirmPasswordInput, "password123");
    // Don't check the terms checkbox
    fireEvent.press(signupButton);

    expect(Alert.alert).toHaveBeenCalledWith(
      "Please agree to the Terms of Service and Privacy Policy"
    );
    expect(mockSignUp).not.toHaveBeenCalled();
  });

  it("should handle signup error", async () => {
    const error = new Error("Email already in use");
    mockSignUp.mockRejectedValueOnce(error);

    const { getByPlaceholderText, getByTestId } = render(<SignUpScreen />);

    const fullNameInput = getByPlaceholderText("Enter your full name");
    const emailInput = getByPlaceholderText("your@email.com");
    const passwordInput = getByPlaceholderText("Create a strong password");
    const confirmPasswordInput = getByPlaceholderText("Confirm your password");
    const termsCheckbox = getByTestId("terms-checkbox");
    const signupButton = getByTestId("signup-button");

    fireEvent.changeText(fullNameInput, "John Doe");
    fireEvent.changeText(emailInput, "test@example.com");
    fireEvent.changeText(passwordInput, "password123");
    fireEvent.changeText(confirmPasswordInput, "password123");
    fireEvent.press(termsCheckbox);
    fireEvent.press(signupButton);

    await waitFor(() => {
      expect(mockSignUp).toHaveBeenCalledWith(
        "test@example.com",
        "password123",
        "John Doe"
      );
      expect(router.replace).not.toHaveBeenCalled();
    });
  });
});
