// Feel free to explore the rules here:
// https://github.com/typescript-eslint/typescript-eslint/tree/v2.3.0/packages/eslint-plugin/docs/rules

// Standard eslint rules:
// https://eslint.org/docs/rules/
module.exports = {
  parser: "@typescript-eslint/parser",
  plugins: ["jest"],
  extends: [
    "eslint:recommended",
    "plugin:@typescript-eslint/eslint-recommended",
    "plugin:@typescript-eslint/recommended",
    "prettier",
  ],
  parserOptions: {
    ecmaVersion: 2019,
    sourceType: "module",
  },
  rules: {
    // 0 = disabled, 1 = warning, 2 = error
    "prefer-const": 1,
    "no-console": 1,
    "@typescript-eslint/interface-name-prefix": [0],
    "@typescript-eslint/no-explicit-any": [0],
    "@typescript-eslint/explicit-function-return-type": [0],
    "@typescript-eslint/no-empty-function": [0],
    "@typescript-eslint/no-empty-interface": [0],
  },
};
