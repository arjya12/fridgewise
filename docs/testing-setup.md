# Testing Setup Documentation

## Overview

The FridgeWise project uses Jest and React Native Testing Library for testing React Native components and logic.

## Installed Packages

- `jest` - JavaScript testing framework
- `jest-expo` - Jest preset configured for Expo projects
- `@testing-library/react-native` - Testing utilities for React Native
- `@testing-library/jest-native` - Custom Jest matchers for React Native
- `@types/jest` - TypeScript types for Jest

## Configuration Files

### jest.config.js

- Uses `jest-expo` preset for Expo compatibility
- Configures module resolution and transform ignore patterns
- Sets up coverage collection and thresholds (70% for all metrics)
- Maps `@/` imports to the project root

### jest.setup.js

- Extends Jest with React Native Testing Library matchers
- Mocks Expo modules (expo-font, expo-splash-screen, expo-linking)
- Mocks AsyncStorage for testing
- Mocks react-native-reanimated to avoid animation issues in tests

### test-utils.tsx

- Provides a custom render function with common providers
- Mocks SafeAreaProvider and AuthContext to avoid circular dependencies
- Re-exports all React Native Testing Library utilities

## Test Scripts

Run tests using npm scripts defined in package.json:

- `npm test` - Run all tests
- `npm run test:watch` - Run tests in watch mode
- `npm run test:coverage` - Run tests with coverage report

## Writing Tests

### Unit Tests

Example: `contexts/__tests__/AuthContext.test.tsx`

```typescript
import { renderHook, act, waitFor } from "@testing-library/react-native";
import { AuthProvider, useAuth } from "../AuthContext";

describe("AuthContext", () => {
  it("should provide auth context", async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    expect(result.current.user).toBeNull();
  });
});
```

### Component Tests

Example: `app/(auth)/__tests__/login.test.tsx`

```typescript
import { render, fireEvent, waitFor } from "@/test-utils";
import LoginScreen from "../login";

describe("LoginScreen", () => {
  it("should render login form", () => {
    const { getByPlaceholderText, getByText } = render(<LoginScreen />);
    expect(getByText("🧊 FridgeWise")).toBeTruthy();
  });
});
```

## Best Practices

1. Use the custom render function from `test-utils.tsx` for component tests
2. Mock external dependencies (Supabase, expo-router, etc.)
3. Use `waitFor` for async operations to avoid act() warnings
4. Clear mocks between tests using `beforeEach`
5. Test both success and error scenarios
6. Use descriptive test names that explain what is being tested

## Common Mocks

### Mocking Supabase

```typescript
jest.mock("@/lib/supabase", () => ({
  supabase: {
    auth: {
      signInWithPassword: jest.fn(),
      signUp: jest.fn(),
      signOut: jest.fn(),
    },
  },
}));
```

### Mocking Expo Router

```typescript
jest.mock("expo-router", () => ({
  router: {
    replace: jest.fn(),
    push: jest.fn(),
  },
  Link: ({ children }) => children,
}));
```

## Troubleshooting

- If you see "Cannot find module" errors, check the module resolution in jest.config.js
- For act() warnings, ensure async operations are wrapped in waitFor
- Mock React Native modules that cause issues in the test environment
