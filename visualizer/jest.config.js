/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: "ts-jest",
  testEnvironment: "jest-environment-jsdom",
  testMatch: ["**/__tests__/**/*.ts?(x)", "**/?(*.)+(test).ts?(x)"],
  transform: {
    "^.+\\.tsx$": [
      "ts-jest",
      {
        babel: true,
        tsconfig: "tsconfig.test.json",
      },
    ],
  },
  moduleNameMapper: {
    "~/(.*)$": "<rootDir>/$1",
  },
};
