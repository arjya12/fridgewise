// jest.setup.js
import "@testing-library/jest-native/extend-expect";

// Mock expo modules that might cause issues in tests
jest.mock("expo-font", () => ({
  loadAsync: jest.fn(),
  isLoaded: jest.fn(() => true),
}));

jest.mock("expo-splash-screen", () => ({
  preventAutoHideAsync: jest.fn(),
  hideAsync: jest.fn(),
}));

jest.mock("expo-linking", () => ({
  createURL: jest.fn(),
  openURL: jest.fn(),
}));

// Mock AsyncStorage
jest.mock("@react-native-async-storage/async-storage", () =>
  require("@react-native-async-storage/async-storage/jest/async-storage-mock")
);

// Mock Reanimated
jest.mock("react-native-reanimated", () => {
  const Reanimated = require("react-native-reanimated/mock");
  Reanimated.default.call = () => {};
  return Reanimated;
});

// Silence the warning: Animated: `useNativeDriver` is not supported because the native animated module is missing
jest.mock(
  "react-native/Libraries/Animated/NativeAnimatedHelper",
  () => ({
    ...jest.requireActual(
      "react-native/Libraries/Animated/NativeAnimatedHelper"
    ),
    shouldUseNativeDriver: jest.fn(() => false),
  }),
  { virtual: true }
);

// Setup global test utilities
global.beforeEach(() => {
  jest.clearAllMocks();
});

// Add custom matchers or global test utilities here if needed
