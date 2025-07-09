// jest.setup.js
import "@testing-library/jest-native/extend-expect";

// Mock ColorSchemeProvider and related hooks globally
global.__mockColorSchemeContext = {
  colorScheme: {
    expired: {
      primary: "#DC2626",
      secondary: "#FEF2F2",
      pattern: "solid",
    },
    today: {
      primary: "#EA580C",
      secondary: "#FFF7ED",
      pattern: "solid",
    },
    future: {
      primary: "#16A34A",
      secondary: "#F0FDF4",
      pattern: "solid",
    },
    accessibility: {
      highContrast: false,
      patterns: false,
      textAlternatives: true,
    },
  },
  isHighContrast: false,
  patterns: [
    {
      name: "expired-striped",
      type: "striped",
      density: 0.7,
      angle: 45,
      spacing: 3,
    },
  ],
  updateColorScheme: jest.fn(),
  toggleHighContrast: jest.fn(),
  togglePatterns: jest.fn(),
};

// Global mocks will be done at test file level to avoid path resolution issues

// Mock expo-router for calendar tests
jest.mock("expo-router", () => ({
  router: {
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
  },
  useFocusEffect: jest.fn((callback) => {
    // Call the callback immediately in tests
    callback();
  }),
  useLocalSearchParams: jest.fn(() => ({})),
}));

// Mock expo-constants
jest.mock("expo-constants", () => ({
  __esModule: true,
  default: {
    statusBarHeight: 44,
  },
}));

// Mock react-native-calendars
jest.mock("react-native-calendars", () => {
  const React = require("react");
  const { View, Text, TouchableOpacity } = require("react-native");

  return {
    Calendar: jest.fn(({ onDayPress, onMonthChange, markedDates }) => {
      return React.createElement(
        View,
        { testID: "mock-calendar" },
        React.createElement(
          TouchableOpacity,
          {
            testID: "calendar-day-2024-01-15",
            onPress: () =>
              onDayPress && onDayPress({ dateString: "2024-01-15" }),
          },
          React.createElement(Text, null, "15")
        ),
        React.createElement(
          TouchableOpacity,
          {
            testID: "month-change",
            onPress: () =>
              onMonthChange && onMonthChange({ month: 2, year: 2024 }),
          },
          React.createElement(Text, null, "Next Month")
        )
      );
    }),
  };
});

// Don't globally mock the enhanced calendar service since it may not exist in all tests
// Individual test files can mock it if needed

// Console warning suppressions for tests
const originalConsoleWarn = console.warn;
console.warn = (...args) => {
  // Suppress specific React warnings that aren't relevant for tests
  if (
    args[0] &&
    (args[0].includes("Warning: ReactDOM.render is no longer supported") ||
      args[0].includes(
        'Warning: Each child in a list should have a unique "key" prop'
      ) ||
      args[0].includes("Warning: Failed prop type"))
  ) {
    return;
  }
  originalConsoleWarn.apply(console, args);
};

// Mock only essential react-native modules
jest.mock("react-native/Libraries/Utilities/Dimensions", () => ({
  get: jest.fn(() => ({ width: 375, height: 812 })),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
}));
