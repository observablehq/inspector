import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";

export default [
  {ignores: ["build/", "dist/"]},
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node
      },
      parserOptions: {
        tsconfigRootDir: import.meta.dirname
      }
    },
    rules: {
      semi: 2,
      "no-process-env": 2,

      "no-redeclare": 0,
      "@typescript-eslint/consistent-type-imports": 2
    }
  }
];
