const baseConfig = require("../../jest.config.base.js");

module.exports = {
  ...baseConfig,
  roots: ["<rootDir>/src"],
  testMatch: ["**/__tests__/index.ts", "**/__tests__/**/*.test.ts"],
  // The live integration tests open Redis pub/sub clients (RedisMessenger) that are
  // never closed, leaving keep-alive handles open. Force-exit so CI doesn't hang.
  forceExit: true,
};
