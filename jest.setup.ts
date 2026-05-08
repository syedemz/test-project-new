/**
 * Global Jest setup file.
 *
 * Registers the official AsyncStorage mock for every test suite so that
 * any test that transitively imports `storageHelper` (which imports
 * `@react-native-async-storage/async-storage`) does not fail with
 * "NativeModule: AsyncStorage is null".
 *
 * Individual test suites that need fine-grained control over AsyncStorage
 * behaviour (e.g. storageHelper.test.ts) may override the mock with their
 * own `jest.mock()` call — Jest honours the closest mock.
 */

// eslint-disable-next-line @typescript-eslint/no-require-imports
jest.mock('@react-native-async-storage/async-storage', () =>
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);
