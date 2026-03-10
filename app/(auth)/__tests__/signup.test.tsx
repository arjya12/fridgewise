import SignUpScreen from "@/app/(auth)/signup";
import { useAuth } from "@/contexts/AuthContext";
import { NavigationContainer } from "@react-navigation/native";
import { act, fireEvent, render } from "@testing-library/react-native";
import React from "react";

jest.mock("@expo/vector-icons", () => {
  const { View } = require("react-native");
  return {
    Ionicons: View,
  };
});

jest.mock("expo-router", () => ({
  router: {
    replace: jest.fn(),
    push: jest.fn(),
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
  const signUpMock = jest.fn();

  beforeEach(() => {
    (useAuth as jest.Mock).mockReturnValue({
      signUp: signUpMock.mockResolvedValue({ error: null }),
    });
    jest.clearAllMocks();
  });

  it("should render all fields and the signup button", async () => {
    const { getByPlaceholderText, getByTestId } = render(
      <NavigationContainer>
        <SignUpScreen />
      </NavigationContainer>
    );

    const firstNameInput = getByPlaceholderText("First Name");
    const lastNameInput = getByPlaceholderText("Last Name");
    const emailInput = getByPlaceholderText("Email");
    const passwordInput = getByPlaceholderText("Password");
    const confirmPasswordInput = getByPlaceholderText("Confirm Password");
    const signupButton = getByTestId("signup-button");
    const termsSwitch = getByTestId("terms-switch");

    expect(firstNameInput).toBeTruthy();
    expect(lastNameInput).toBeTruthy();
    expect(emailInput).toBeTruthy();
    expect(passwordInput).toBeTruthy();
    expect(confirmPasswordInput).toBeTruthy();
    expect(signupButton).toBeTruthy();
    expect(termsSwitch).toBeTruthy();
  });

  it("should show inline errors when fields are empty", async () => {
    const { getByTestId, getByText } = render(
      <NavigationContainer>
        <SignUpScreen />
      </NavigationContainer>
    );
    const signupButton = getByTestId("signup-button");

    fireEvent.press(signupButton);

    expect(getByText("Fix the highlighted fields to continue.")).toBeTruthy();
  });

  it("should show inline error when passwords do not match", async () => {
    const { getByPlaceholderText, getByTestId, getByText } = render(
      <NavigationContainer>
        <SignUpScreen />
      </NavigationContainer>
    );

    const firstNameInput = getByPlaceholderText("First Name");
    const lastNameInput = getByPlaceholderText("Last Name");
    const emailInput = getByPlaceholderText("Email");
    const passwordInput = getByPlaceholderText("Password");
    const confirmPasswordInput = getByPlaceholderText("Confirm Password");
    const signupButton = getByTestId("signup-button");
    const termsSwitch = getByTestId("terms-switch");

    fireEvent.changeText(firstNameInput, "Test");
    fireEvent.changeText(lastNameInput, "User");
    fireEvent.changeText(emailInput, "test@example.com");
    fireEvent.changeText(passwordInput, "password123");
    fireEvent.changeText(confirmPasswordInput, "password456");
    fireEvent.press(termsSwitch);
    fireEvent.press(signupButton);

    expect(getByText("Passwords do not match.")).toBeTruthy();
  });

  it("should show inline error when password is too short", async () => {
    const { getByPlaceholderText, getByTestId, getByText } = render(
      <NavigationContainer>
        <SignUpScreen />
      </NavigationContainer>
    );

    const firstNameInput = getByPlaceholderText("First Name");
    const lastNameInput = getByPlaceholderText("Last Name");
    const emailInput = getByPlaceholderText("Email");
    const passwordInput = getByPlaceholderText("Password");
    const confirmPasswordInput = getByPlaceholderText("Confirm Password");
    const signupButton = getByTestId("signup-button");
    const termsSwitch = getByTestId("terms-switch");

    fireEvent.changeText(firstNameInput, "Test");
    fireEvent.changeText(lastNameInput, "User");
    fireEvent.changeText(emailInput, "test@example.com");
    fireEvent.changeText(passwordInput, "123");
    fireEvent.changeText(confirmPasswordInput, "123");
    fireEvent.press(termsSwitch);
    fireEvent.press(signupButton);

    expect(
      getByText("Update your password to meet the requirements.")
    ).toBeTruthy();
  });

  it("should show inline error when terms are not agreed", async () => {
    const { getByPlaceholderText, getByTestId, getByText } = render(
      <NavigationContainer>
        <SignUpScreen />
      </NavigationContainer>
    );

    const firstNameInput = getByPlaceholderText("First Name");
    const lastNameInput = getByPlaceholderText("Last Name");
    const emailInput = getByPlaceholderText("Email");
    const passwordInput = getByPlaceholderText("Password");
    const confirmPasswordInput = getByPlaceholderText("Confirm Password");
    const signupButton = getByTestId("signup-button");

    fireEvent.changeText(firstNameInput, "Test");
    fireEvent.changeText(lastNameInput, "User");
    fireEvent.changeText(emailInput, "test@example.com");
    fireEvent.changeText(passwordInput, "password123");
    fireEvent.changeText(confirmPasswordInput, "password123");
    fireEvent.press(signupButton);

    expect(
      getByText("You must agree to the terms and privacy policy.")
    ).toBeTruthy();
  });

  it("should call signup on valid input", async () => {
    const { getByPlaceholderText, getByTestId } = render(
      <NavigationContainer>
        <SignUpScreen />
      </NavigationContainer>
    );

    jest.useFakeTimers();

    const firstNameInput = getByPlaceholderText("First Name");
    const lastNameInput = getByPlaceholderText("Last Name");
    const emailInput = getByPlaceholderText("Email");
    const passwordInput = getByPlaceholderText("Password");
    const confirmPasswordInput = getByPlaceholderText("Confirm Password");
    const signupButton = getByTestId("signup-button");
    const termsSwitch = getByTestId("terms-switch");

    fireEvent.changeText(firstNameInput, "Test");
    fireEvent.changeText(lastNameInput, "User");
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

    act(() => {
      jest.advanceTimersByTime(900);
    });

    const { router } = require("expo-router");
    expect(router.push).toHaveBeenCalledWith("/(auth)/welcome?login=1");

    jest.useRealTimers();
  });

  it("should handle signup error", async () => {
    (useAuth().signUp as jest.Mock).mockRejectedValueOnce(
      new Error("Failed to sign up")
    );

    const { getByPlaceholderText, getByTestId, getByText } = render(
      <NavigationContainer>
        <SignUpScreen />
      </NavigationContainer>
    );

    const firstNameInput = getByPlaceholderText("First Name");
    const lastNameInput = getByPlaceholderText("Last Name");
    const emailInput = getByPlaceholderText("Email");
    const passwordInput = getByPlaceholderText("Password");
    const confirmPasswordInput = getByPlaceholderText("Confirm Password");
    const signupButton = getByTestId("signup-button");
    const termsSwitch = getByTestId("terms-switch");

    fireEvent.changeText(firstNameInput, "Test");
    fireEvent.changeText(lastNameInput, "User");
    fireEvent.changeText(emailInput, "test@example.com");
    fireEvent.changeText(passwordInput, "password123");
    fireEvent.changeText(confirmPasswordInput, "password123");
    fireEvent.press(termsSwitch);

    await act(async () => {
      fireEvent.press(signupButton);
    });

    expect(getByText("Failed to sign up")).toBeTruthy();
  });
});
