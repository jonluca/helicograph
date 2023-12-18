// eslint-disable-next-line @typescript-eslint/no-var-requires
const path = require("path");

/** @type {import("eslint").Linter.Config} */
const config = {
  overrides: [
    {
      extends: ["plugin:@typescript-eslint/recommended"],
      files: ["*.ts", "*.tsx"],
      parserOptions: {
        project: path.join(__dirname, "tsconfig.json"),
      },
    },
  ],
  parser: "@typescript-eslint/parser",
  parserOptions: {
    project: path.join(__dirname, "tsconfig.json"),
  },
  plugins: ["prettier", "unused-imports", "@typescript-eslint"],
  extends: ["next/core-web-vitals", "prettier", "eslint:recommended", "plugin:@typescript-eslint/recommended"],
  settings: {
    react: { version: "detect" },
  },
  rules: {
    "@typescript-eslint/no-unsafe-call": "off",
    "prefer-const": "error",
    "no-case-declarations": "off",
    "no-async-promise-executor": "off",
    curly: ["error", "all"],
    "@typescript-eslint/no-non-null-assertion": "off",
    "@typescript-eslint/consistent-type-definitions": ["error", "interface"],
    "@typescript-eslint/consistent-type-imports": [
      "error",
      {
        prefer: "type-imports",
      },
    ],
    "@typescript-eslint/ban-ts-comment": "off",
    "@typescript-eslint/no-explicit-any": "off",
    "@typescript-eslint/no-use-before-define": ["warn"],
    "object-shorthand": "error",
    "@typescript-eslint/no-unused-vars": [
      "warn",
      { varsIgnorePattern: "^_", argsIgnorePattern: "^_", ignoreRestSiblings: true },
    ],
    "unused-imports/no-unused-imports-ts": "error",
  },
};

module.exports = config;
