module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  transform: {
    "^.+\\.mjs$": "babel-jest"
  },
  moduleFileExtensions: [
    "js",
    "ts",
    "tsx",
    "jsx",
    "mjs"
  ],
};
