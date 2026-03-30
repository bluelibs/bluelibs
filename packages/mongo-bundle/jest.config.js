const baseConfig = require("../../jest.config.base.js");

module.exports = {
  ...baseConfig,
  roots: ["<rootDir>/src"],
  testMatch: ["**/__tests__/**/*.test.ts"],
  runInBand: true, // Run tests sequentially to avoid MongoDB conflicts
  testTimeout: 30000, // Increase timeout for MongoDB operations
};
