module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/backend/src', '<rootDir>/backend/tests'],
  testMatch: ['**/*.test.ts'],
  collectCoverageFrom: [
    'backend/src/services/**/*.ts',
    'backend/src/routes/**/*.ts',
    '!backend/src/**/*.test.ts',
  ],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 80,
      lines: 80,
      statements: 80,
    },
    './backend/src/services/inventoryService.ts': {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
    './backend/src/services/yearEndCountService.ts': {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
  setupFilesAfterEnv: ['<rootDir>/backend/tests/setup.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/backend/src/$1',
  },
  globals: {
    'ts-jest': {
      tsconfig: {
        esModuleInterop: true,
        allowSyntheticDefaultImports: true,
      },
    },
  },
  testTimeout: 10000,
  // Run tests sequentially to avoid database race conditions with in-memory SQLite
  maxWorkers: 1,
};
