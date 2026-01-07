// export default {
//   testEnvironment: "node",
//   // Remove transform: {} unless you need it for TS or Babel
//   // transform: {},
//   moduleFileExtensions: ["js", "json"],
//   testMatch: ["**/tests/**/*.test.js"],
//   setupFilesAfterEnv: ["<rootDir>/tests/setup.js"],
//   collectCoverageFrom: [
//     "controllers/**/*.js",
//     "routes/**/*.js",
//     "!**/node_modules/**",
//     "!**/tests/**",
//   ],
//   testTimeout: 30000,
//   verbose: true,
//   clearMocks: true,
//   detectOpenHandles: true,
// };

export default {
  testEnvironment: "node",
  moduleFileExtensions: ["js", "json"],
  testMatch: ["**/tests/**/*.test.js"],
  setupFilesAfterEnv: ["<rootDir>/tests/setup.js"],
  collectCoverageFrom: [
    "controllers/**/*.js",
    "routes/**/*.js",
    "!**/node_modules/**",
    "!**/tests/**",
  ],
  testTimeout: 30000,
  verbose: true,
  clearMocks: true,
  detectOpenHandles: true,
  maxWorkers: 1, // Run tests sequentially to avoid DB conflicts
  forceExit: true, // Force exit after tests
};
