import expoFlatConfig from "eslint-config-expo/flat.js";
import eslintConfigPrettier from "eslint-config-prettier";
// import { config as baseConfig } from "./base.js";

/**
 * A custom ESLint configuration for libraries that use Next.js.
 *
 * @type {import("eslint").Linter.Config[]}
 * */
export const expoConfig = [
  //  ...baseConfig,
  ...expoFlatConfig,
  eslintConfigPrettier,
];
