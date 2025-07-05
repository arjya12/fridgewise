import SignUpScreen from "@/app/(auth)/signup";
import { useAuth } from "@/contexts/AuthContext";
import { NavigationContainer } from "@react-navigation/native";
import { act, fireEvent, render } from "@testing-library/react-native";
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

jest.mock("@/hooks/useColorScheme", () => ({
  useColorScheme: () => "light",
}));

jest.mock("@/contexts/AuthContext", () => ({
  useAuth: jest.fn(),
}));

jest.mock("@/lib/supabase", () => ({
  supabase: {
    auth: {
      signUp: jest.fn(),
    },
  },
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

describe("SignUpScreen", () => {
  beforeEach(() => {
    (useAuth as jest.Mock).mockReturnValue({
      signUp: jest.fn().mockResolvedValue({ error: null }),
    });
    jest.clearAllMocks();
    jest.spyOn(Alert, "alert");
  });

  it("should render all fields and the signup button", async () => {
    const { getByPlaceholderText, getByTestId } = render(
      <NavigationContainer>
        <SignUpScreen />
      </NavigationContainer>
    );

    const fullNameInput = getByPlaceholderText("Name");
    const emailInput = getByPlaceholderText("Email");
    const passwordInput = getByPlaceholderText("Password");
    const confirmPasswordInput = getByPlaceholderText("Confirm Password");
    const signupButton = getByTestId("signup-button");
    const termsSwitch = getByTestId("terms-switch");

    expect(fullNameInput).toBeTruthy();
    expect(emailInput).toBeTruthy();
    expect(passwordInput).toBeTruthy();
    expect(confirmPasswordInput).toBeTruthy();
    expect(signupButton).toBeTruthy();
    expect(termsSwitch).toBeTruthy();
  });

  it("should show alert when fields are empty", async () => {
    const { getByTestId } = render(
      <NavigationContainer>
        <SignUpScreen />
      </NavigationContainer>
    );
    const signupButton = getByTestId("signup-button");

    fireEvent.press(signupButton);

    expect(Alert.alert).toHaveBeenCalledWith(
      "Missing Information",
      "Please fill in all fields."
    );
  });

  it("should show alert when passwords do not match", async () => {
    const { getByPlaceholderText, getByTestId } = render(
      <NavigationContainer>
        <SignUpScreen />
      </NavigationContainer>
    );

    const fullNameInput = getByPlaceholderText("Name");
    const emailInput = getByPlaceholderText("Email");
    const passwordInput = getByPlaceholderText("Password");
    const confirmPasswordInput = getByPlaceholderText("Confirm Password");
    const signupButton = getByTestId("signup-button");
    const termsSwitch = getByTestId("terms-switch");

    fireEvent.changeText(fullNameInput, "Test User");
    fireEvent.changeText(emailInput, "test@example.com");
    fireEvent.changeText(passwordInput, "password123");
    fireEvent.changeText(confirmPasswordInput, "password456");
    fireEvent.press(termsSwitch);
    fireEvent.press(signupButton);

    expect(Alert.alert).toHaveBeenCalledWith(
      "Password Mismatch",
      "The passwords do not match."
    );
  });

  it("should show alert when password is too short", async () => {
    const { getByPlaceholderText, getByTestId } = render(
      <NavigationContainer>
        <SignUpScreen />
      </NavigationContainer>
    );

    const fullNameInput = getByPlaceholderText("Name");
    const emailInput = getByPlaceholderText("Email");
    const passwordInput = getByPlaceholderText("Password");
    const confirmPasswordInput = getByPlaceholderText("Confirm Password");
    const signupButton = getByTestId("signup-button");
    const termsSwitch = getByTestId("terms-switch");

    fireEvent.changeText(fullNameInput, "Test User");
    fireEvent.changeText(emailInput, "test@example.com");
    fireEvent.changeText(passwordInput, "123");
    fireEvent.changeText(confirmPasswordInput, "123");
    fireEvent.press(termsSwitch);
    fireEvent.press(signupButton);

    expect(Alert.alert).toHaveBeenCalledWith(
      "Password Too Short",
      "The password must be at least 6 characters long."
    );
  });

  it("should show alert when terms are not agreed", async () => {
    const { getByPlaceholderText, getByTestId } = render(
      <NavigationContainer>
        <SignUpScreen />
      </NavigationContainer>
    );

    const fullNameInput = getByPlaceholderText("Name");
    const emailInput = getByPlaceholderText("Email");
    const passwordInput = getByPlaceholderText("Password");
    const confirmPasswordInput = getByPlaceholderText("Confirm Password");
    const signupButton = getByTestId("signup-button");

    fireEvent.changeText(fullNameInput, "Test User");
    fireEvent.changeText(emailInput, "test@example.com");
    fireEvent.changeText(passwordInput, "password123");
    fireEvent.changeText(confirmPasswordInput, "password123");
    fireEvent.press(signupButton);

    expect(Alert.alert).toHaveBeenCalledWith(
      "Terms and Conditions",
      "You must agree to the terms and conditions to sign up."
    );
  });

  it("should call signup on valid input", async () => {
    const { getByPlaceholderText, getByTestId } = render(
      <NavigationContainer>
        <SignUpScreen />
      </NavigationContainer>
    );

    const fullNameInput = getByPlaceholderText("Name");
    const emailInput = getByPlaceholderText("Email");
    const passwordInput = getByPlaceholderText("Password");
    const confirmPasswordInput = getByPlaceholderText("Confirm Password");
    const signupButton = getByTestId("signup-button");
    const termsSwitch = getByTestId("terms-switch");

    fireEvent.changeText(fullNameInput, "Test User");
    fireEvent.changeText(emailInput, "test@example.com");
    fireEvent.changeText(passwordInput, "password123");
    fireEvent.changeText(confirmPasswordInput, "password123");
    fireEvent.press(termsSwitch);

    await act(async () => {
      fireEvent.press(signupButton);
    });

    expect(useAuth().signUp).toHaveBeenCalledWith(
      "test@example.com",
      "password123",
      "Test User"
    );
  });

  it("should handle signup error", async () => {
    (useAuth().signUp as jest.Mock).mockRejectedValueOnce(
      new Error("Failed to sign up")
    );

    const { getByPlaceholderText, getByTestId } = render(
      <NavigationContainer>
        <SignUpScreen />
      </NavigationContainer>
    );

    const fullNameInput = getByPlaceholderText("Name");
    const emailInput = getByPlaceholderText("Email");
    const passwordInput = getByPlaceholderText("Password");
    const confirmPasswordInput = getByPlaceholderText("Confirm Password");
    const signupButton = getByTestId("signup-button");
    const termsSwitch = getByTestId("terms-switch");

    fireEvent.changeText(fullNameInput, "Test User");
    fireEvent.changeText(emailInput, "test@example.com");
    fireEvent.changeText(passwordInput, "password123");
    fireEvent.changeText(confirmPasswordInput, "password123");
    fireEvent.press(termsSwitch);

    await act(async () => {
      fireEvent.press(signupButton);
    });

    expect(Alert.alert).toHaveBeenCalledWith(
      "Sign-up failed",
      "Failed to sign up"
    );
  });
});
