import { expoConfig } from "@dkg/eslint-config/expo";

/** @type {import("eslint").Linter.Config} */
export default [
  ...expoConfig,
  {
    files: ["tests/**/*.js"],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "commonjs",
    },
    rules: {
      // Disable TypeScript-specific rules for test files
      "@typescript-eslint/no-var-requires": "off",
      "import/no-unresolved": "off",
      "import/no-commonjs": "off",
    },
  },
];
