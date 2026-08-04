const baseConfig = require("../../jest.config.base.js");

module.exports = {
  ...baseConfig,
  roots: ["<rootDir>/src"],
  testMatch: ["**/__tests__/**/*.test.ts"],
  maxWorkers: 1, // Run tests sequentially to avoid MongoDB conflicts (runInBand is not a valid jest config option)
  testTimeout: 30000, // Increase timeout for MongoDB operations
};
