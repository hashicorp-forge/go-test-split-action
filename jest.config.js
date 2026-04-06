/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  moduleNameMapper: {
    '^@actions/core$': '<rootDir>/test-fixtures/jest/actions-core.ts',
    '^@actions/io$': '<rootDir>/test-fixtures/jest/actions-io.ts',
  },
};
