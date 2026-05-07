/**
 * Unit tests for src/Helper/storageHelper.ts — story 2.4 acceptance criteria.
 *
 * Four behaviours under test:
 *  1. Fresh storage (no key present) → readUsers() resolves to [].
 *  2. After writeUsers([record]), readUsers() resolves to an array deep-equal to [record].
 *  3. AsyncStorage.getItem throws → readUsers() rejects with message containing
 *     "storage_read_failed" and cause === original error.
 *  4. AsyncStorage.setItem throws → writeUsers() rejects with message containing
 *     "storage_write_failed" and cause === original error.
 *
 * The official AsyncStorage jest mock is registered via jest.mock() below so
 * that every test in this file uses it automatically.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { readUsers, writeUsers } from '@/Helper/storageHelper';
import type { StoredUser } from '@/Helper/storageHelper';

/* eslint-disable @typescript-eslint/no-require-imports */
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);
/* eslint-enable @typescript-eslint/no-require-imports */

/** A representative StoredUser fixture used across multiple tests. */
const FIXTURE: StoredUser = {
  username: 'alice',
  email: 'alice@example.com',
  password: 'Password1',
  createdAt: '2026-05-05T00:00:00.000Z',
};

beforeEach(async () => {
  // Reset the mock store between every test so state does not leak.
  await AsyncStorage.clear();
});

// ---------------------------------------------------------------------------
// Behaviour 1 — fresh storage resolves to []
// ---------------------------------------------------------------------------

describe('given fresh AsyncStorage (no registered-users key present)', () => {
  describe('when readUsers() is called', () => {
    it('then it resolves to an empty array', async () => {
      const result = await readUsers();
      expect(result).toEqual([]);
    });
  });
});

// ---------------------------------------------------------------------------
// Behaviour 2 — round-trip write then read
// ---------------------------------------------------------------------------

describe('given writeUsers has been called with a single record', () => {
  describe('when readUsers() is called immediately afterward', () => {
    it('then it resolves to an array deep-equal to the written record', async () => {
      await writeUsers([FIXTURE]);
      const result = await readUsers();
      expect(result).toEqual([FIXTURE]);
    });
  });
});

describe('given writeUsers has been called with multiple records', () => {
  describe('when readUsers() is called immediately afterward', () => {
    it('then it resolves to an array deep-equal to the written records', async () => {
      const second: StoredUser = {
        username: 'bob',
        email: 'bob@example.com',
        password: 'Secret42',
        createdAt: '2026-05-05T01:00:00.000Z',
      };
      await writeUsers([FIXTURE, second]);
      const result = await readUsers();
      expect(result).toEqual([FIXTURE, second]);
    });
  });
});

// ---------------------------------------------------------------------------
// Behaviour 3 — AsyncStorage.getItem throws → readUsers rejects with wrapped error
// ---------------------------------------------------------------------------

describe('given AsyncStorage.getItem is configured to throw', () => {
  describe('when readUsers() is called', () => {
    it('then it rejects with an Error whose message contains "storage_read_failed"', async () => {
      const originalError = new Error('disk failure');
      jest.spyOn(AsyncStorage, 'getItem').mockRejectedValueOnce(originalError);

      await expect(readUsers()).rejects.toThrow(/storage_read_failed/);
    });

    it('then the rejected Error has cause set to the original error', async () => {
      const originalError = new Error('disk failure');
      jest.spyOn(AsyncStorage, 'getItem').mockRejectedValueOnce(originalError);

      let caughtError: unknown;
      try {
        await readUsers();
      } catch (err) {
        caughtError = err;
      }

      expect(caughtError).toBeInstanceOf(Error);
      expect((caughtError as Error & { cause: unknown }).cause).toBe(originalError);
    });
  });
});

// ---------------------------------------------------------------------------
// Behaviour 4 — AsyncStorage.setItem throws → writeUsers rejects with wrapped error
// ---------------------------------------------------------------------------

describe('given AsyncStorage.setItem is configured to throw', () => {
  describe('when writeUsers() is called', () => {
    it('then it rejects with an Error whose message contains "storage_write_failed"', async () => {
      const originalError = new Error('quota exceeded');
      jest.spyOn(AsyncStorage, 'setItem').mockRejectedValueOnce(originalError);

      await expect(writeUsers([FIXTURE])).rejects.toThrow(/storage_write_failed/);
    });

    it('then the rejected Error has cause set to the original error', async () => {
      const originalError = new Error('quota exceeded');
      jest.spyOn(AsyncStorage, 'setItem').mockRejectedValueOnce(originalError);

      let caughtError: unknown;
      try {
        await writeUsers([FIXTURE]);
      } catch (err) {
        caughtError = err;
      }

      expect(caughtError).toBeInstanceOf(Error);
      expect((caughtError as Error & { cause: unknown }).cause).toBe(originalError);
    });
  });
});
