const baseConfig = require("../../jest.config.base.js");

module.exports = {
  ...baseConfig,
  roots: ["<rootDir>/src"],
  testMatch: ["**/__tests__/**/*.test.{ts,tsx}"],
};
