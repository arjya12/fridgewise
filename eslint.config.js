// https://docs.expo.dev/guides/using-eslint/
const { defineConfig, globalIgnores } = require('eslint/config');
const expoConfig = require("eslint-config-expo/flat");

module.exports = defineConfig([
  globalIgnores([
    "dist/**",
    "build/**",
    "web-build/**",
    "coverage/**",
    "node_modules/**",
    "android/**/build/**",
    "android/app/.cxx/**",
    "supabase/functions/**",
    "**/__tests__/**",
  ]),
  expoConfig,
  {
    linterOptions: {
      reportUnusedDisableDirectives: "off",
    },
    rules: {
      "@typescript-eslint/no-unused-vars": "off",
      "@typescript-eslint/array-type": "off",
      "@typescript-eslint/no-require-imports": "off",
      "react-hooks/exhaustive-deps": "off",
      "import/no-named-as-default": "off",
      "import/no-duplicates": "off",
    },
  }
]);
