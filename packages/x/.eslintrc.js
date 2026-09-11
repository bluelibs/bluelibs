module.exports = {
  "root": true,
  parser: "@typescript-eslint/parser",
  extends: [
    "plugin:@typescript-eslint/recommended",
    "plugin:prettier/recommended",
  ],
  parserOptions: {
    ecmaVersion: 2018,
    sourceType: "module",
  },
  rules: {
    "@typescript-eslint/no-explicit-any": [0],
    "@typescript-eslint/explicit-function-return-type": [0],
    "@typescript-eslint/no-empty-function": [0],
    "@typescript-eslint/no-unused-vars": 0,
    "@typescript-eslint/no-var-requires": 0,
    "@typescript-eslint/no-this-alias": 0,
    "@typescript-eslint/ban-ts-comment": 0,
  },
};
