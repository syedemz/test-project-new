const config = {
  preset: 'jest-expo',

  // Global setup that runs after the test framework is installed.
  // Provides the official AsyncStorage mock so any test suite that imports
  // modules depending on AsyncStorage does not fail with "NativeModule: null".
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],

  // Resolve @/* path alias to src/* so Jest can process imports that use the
  // same alias configured in tsconfig.json and babel.config.js.
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },

  // Collect coverage from the entire source tree
  collectCoverageFrom: [
    '**/*.{ts,tsx}',

    // Standard tooling excludes
    '!**/node_modules/**',
    '!**/.expo/**',
    '!**/__tests__/**',
    '!**/coverage/**',
    '!*.config.{js,ts}',
    '!**/*.config.{js,ts}',

    // Phase-1-only template-exclude block (DEFERRED — do NOT remove in phase 2)
    // These are the Expo SDK 55 template files shipped at project bootstrap time.
    // They have no tests yet because phase 1 only proves the tooling harness runs.
    // CONTRACT: phase 3 (app shell) MUST remove these excludes when ThemeProvider
    // and font loading are wired into App.tsx.
    '!App.tsx',
    '!index.ts',
  ],

  coverageThreshold: {
    global: {
      lines: 80,
      branches: 75,
      functions: 80,
      statements: 80,
    },
  },
};

module.exports = config;
