import js from "@eslint/js";
import globals from "globals";

export default [
  {ignores: ["dist/"]},
  js.configs.recommended,
  {
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node
      }
    },
    rules: {
      semi: 2,
      "no-process-env": 2,
      "no-cond-assign": 0,
      "no-redeclare": 0
    }
  }
];
