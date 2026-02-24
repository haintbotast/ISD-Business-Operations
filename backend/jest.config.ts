import type { Config } from 'jest';

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.test.ts', '**/*.test.ts'],
  collectCoverageFrom: ['src/**/*.ts', '!src/index.ts', '!src/types/**'],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov'],
};

export default config;
