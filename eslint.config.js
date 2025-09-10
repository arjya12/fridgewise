// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require("eslint/config");
const expoConfig = require("eslint-config-expo/flat");

module.exports = defineConfig([
  // Ignored file patterns (applies repo-wide in flat config)
  {
    ignores: [
      "dist/**",
      "node_modules/**",
      "android/**",
      "ios/**",
      "web-build/**",
      ".expo/**",
      "**/__tests__/**",
      "components/calendar/__tests__/**",
      "docs/**",
      "scripts/**",
      "utils/performanceUtils.ts",
    ],
  },
  // Expo recommended config
  expoConfig,
  // Project overrides
  {
    rules: {
      "@typescript-eslint/no-unused-vars": "off",
      "react-hooks/exhaustive-deps": "off",
      "react/display-name": "off",
      "@typescript-eslint/no-require-imports": "off",
      "import/no-named-as-default": "off",
      "import/no-unresolved": "off",
      "@typescript-eslint/array-type": "off",
    },
  },
]);
