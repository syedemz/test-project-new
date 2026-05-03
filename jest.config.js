const config = {
  preset: 'jest-expo',

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

    // Phase-1-only template-exclude block (TEMPORARY)
    // These are the Expo SDK 55 template files shipped at project bootstrap time.
    // They have no tests yet because phase 1 only proves the tooling harness runs.
    // CONTRACT: phase 2's first story MUST remove these excludes and either delete
    // the template files or replace them with tested source code.
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
