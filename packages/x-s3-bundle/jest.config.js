const baseConfig = require("../../jest.config.base.js");

module.exports = {
  ...baseConfig,
  roots: ["<rootDir>/src"],
  testMatch: ["**/__tests__/index.ts", "**/__tests__/**/*.test.ts"],
  // The stub test boots a heavy integration kernel (Apollo + Mongo + AWS SDK v3).
  // These leave keep-alive handles open, so we force-exit to keep CI from hanging.
  forceExit: true,
};
