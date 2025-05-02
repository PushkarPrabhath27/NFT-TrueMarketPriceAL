/**
 * Jest Configuration
 * 
 * Configuration for running tests for the NFT TrustScore API.
 */

module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/*.test.ts'],
  transform: {
    '^.+\\.tsx?$': 'ts-jest'
  },
  setupFilesAfterEnv: ['<rootDir>/src/api/tests/jest.setup.ts'],
  collectCoverage: true,
  collectCoverageFrom: [
    'src/api/**/*.ts',
    '!src/api/tests/**/*.ts',
    '!**/node_modules/**'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov'],
  verbose: true,
  testTimeout: 10000
};