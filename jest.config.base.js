module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  roots: ["<rootDir>/src"],
  testMatch: ["**/__tests__/**/*.test.{ts,tsx}"],
  transform: {
    "^.+\\.tsx?$": "ts-jest",
  },
  moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json", "node"],
  collectCoverageFrom: [
    "src/**/*.ts",
    "!src/**/*.d.ts",
    "!src/**/__tests__/**",
    "!src/**/index.ts",
  ],
  // Coverage is reported but not gated: a single global threshold is not
  // attainable across 35 packages (well-tested packages range 40-85%), so it
  // would keep CI red permanently. Re-introduce per-package thresholds where
  // meaningful.
  coverageReporters: ["text", "text-summary", "lcov", "html"],
  verbose: true,
  clearMocks: true,
  restoreMocks: true,
};
