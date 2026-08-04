const baseConfig = require("../../jest.config.base.js");

module.exports = {
  ...baseConfig,
  roots: ["<rootDir>/src"],
  // nova's suites live in __tests__/<area>/index.ts (integration, graphql,
  // relational-filtering, units) plus .test.ts files. The barrel
  // src/__tests__/index.ts is the integration entry point: it imports every
  // area suite. Matching every */index.ts would run each suite twice (once via
  // the barrel, once directly), so the barrel is matched explicitly (via
  // **/src/__tests__/index.ts, which the area barrels do not match) and the
  // area barrels are NOT matched.
  testMatch: ["**/__tests__/**/*.test.{ts,tsx}", "**/src/__tests__/index.ts"],
};
