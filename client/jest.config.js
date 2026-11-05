export default {
  testEnvironment: "jsdom",
  testMatch: ["<rootDir>/src/**/*.test.js"],
  transform: {
    "^.+\\.[jt]sx?$": "babel-jest",
  },
  clearMocks: true,
};
