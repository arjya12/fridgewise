// jest.setup.js
require("@testing-library/jest-native/extend-expect");
require("react-native-gesture-handler/jestSetup");

// Force deterministic timezone for all date logic
process.env.TZ = "UTC";

// Pin time to Jan 10, 2024 00:00:00 UTC for deterministic date tests
const __fixedNow = Date.parse("2024-01-10T00:00:00.000Z");
jest.useFakeTimers();
jest.setSystemTime(__fixedNow);
// Provide a stable react-native export with Dimensions available
jest.mock("react-native", () => {
  const actual = jest.requireActual("react-native");
  return {
    ...actual,
    Dimensions: {
      ...actual.Dimensions,
      get: jest.fn(() => ({ width: 375, height: 812 })),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
    },
  };
});

// Mock vector icons to simple text placeholders
jest.mock("@expo/vector-icons", () => {
  const React = require("react");
  const { Text } = require("react-native");
  const Icon = ({ name }) => React.createElement(Text, null, name || "icon");
  return new Proxy(
    {},
    {
      get: () => Icon,
    }
  );
});

// Mock react-native-gesture-handler Gesture API for tests
jest.mock("react-native-gesture-handler", () => {
  const React = require("react");
  const { View } = require("react-native");
  const GH = {
    GestureHandlerRootView: ({ children }) =>
      React.createElement(View, null, children),
    PanGestureHandler: ({ children }) =>
      React.createElement(View, null, children),
    State: {},
    Directions: {},
    Gesture: {
      Pan: () => ({
        activeOffsetX: () => GH.Gesture.Pan(),
        onStart: () => GH.Gesture.Pan(),
        onUpdate: () => GH.Gesture.Pan(),
        onEnd: () => GH.Gesture.Pan(),
      }),
    },
  };
  return GH;
});

// Mock Alert to avoid native module errors
jest.spyOn(require("react-native").Alert, "alert").mockImplementation(() => {});

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
  updateColorScheme: () => {},
  toggleHighContrast: () => {},
  togglePatterns: () => {},
};

// Global mocks will be done at test file level to avoid path resolution issues

// Mock expo-router for calendar tests
jest.mock("expo-router", () => {
  const router = {
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
  };
  return {
    router,
    useRouter: () => router,
    useFocusEffect: jest.fn((callback) => {
      // Call the callback immediately in tests
      callback();
    }),
    useLocalSearchParams: jest.fn(() => ({})),
  };
});

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
    Calendar: jest.fn(({ onDayPress, onMonthChange }) => {
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

// Mock PixelRatio to avoid RN StyleSheet accessing native modules
jest.mock("react-native/Libraries/Utilities/PixelRatio", () => {
  const PixelRatio = {
    get: jest.fn(() => 2),
    getFontScale: jest.fn(() => 1),
    roundToNearestPixel: jest.fn((v) => v),
    getPixelSizeForLayoutSize: jest.fn((v) => v),
  };
  return { __esModule: true, default: PixelRatio, ...PixelRatio };
});

// Basic mock for expo-camera to prevent test-local out-of-scope factory errors
jest.mock("expo-camera", () => {
  const React = require("react");
  const { View } = require("react-native");
  return {
    CameraView: ({ children }) =>
      React.createElement(View, { testID: "camera-view" }, children),
    useCameraPermissions: () => [
      { granted: true, status: "granted" },
      jest.fn(),
    ],
    Camera: { Type: { back: "back" } },
  };
});

// Silence/neutralize TurboModules that are not present in Jest
jest.mock("react-native/Libraries/TurboModule/TurboModuleRegistry", () => ({
  get: jest.fn(() => ({})),
  getEnforcing: jest.fn(() => ({})),
}));

// Mock NativeEventEmitter base to avoid warnings/errors
jest.mock("react-native/Libraries/EventEmitter/NativeEventEmitter", () => {
  const { EventEmitter } = require("events");
  return EventEmitter;
});

// Provide iOS platform constants used by Platform.ios
jest.mock(
  "react-native/Libraries/Utilities/NativePlatformConstantsIOS",
  () => ({
    __esModule: true,
    default: {
      getConstants: () => ({
        interfaceIdiom: "phone",
        isTesting: true,
        osVersion: "17.0",
      }),
    },
  })
);

jest.mock("react-native/Libraries/ReactNative/I18nManager", () => ({
  __esModule: true,
  default: {
    getConstants: () => ({
      isRTL: false,
      doLeftAndRightSwapInRTL: false,
      allowRTL: false,
      forceRTL: false,
    }),
  },
}));

jest.mock("react-native/Libraries/Settings/NativeSettingsManager", () => ({
  __esModule: true,
  default: {
    getConstants: () => ({ settings: {} }),
  },
}));

// Note: Do not override the root "react-native" export here to avoid recursive requires.
// Specific submodules are mocked above (Dimensions, PixelRatio, etc.).
// Instead, patch the already-loaded react-native module's Dimensions methods directly.
try {
  const RN = require("react-native");
  if (RN && RN.Dimensions) {
    RN.Dimensions.get = jest.fn(() => ({ width: 375, height: 812 }));
    RN.Dimensions.addEventListener = jest.fn();
    RN.Dimensions.removeEventListener = jest.fn();
  }
} catch {}
