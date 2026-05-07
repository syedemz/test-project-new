/*
 * Unit tests for src/Helper/credentialHelper.ts — story 2.6 acceptance criteria.
 *
 * Nine behaviours under test:
 *  1. Empty registered list + seed match -> ok: true.
 *  2. Empty registered list + seed username right, password wrong -> ok: false.
 *  3. Empty registered list + unknown username -> ok: false.
 *  4. Registered user matches (correct username + password) -> ok: true.
 *  5. Registered user found but wrong password -> ok: false.
 *  6. Precedence: registered user "abc/Wrong1!" exists; lookup "abc/Test@123" -> ok: false
 *     (seed NOT consulted when a username matches a registered record).
 *  7. Case-insensitive username: registered "abc", lookup "ABC" with right password -> ok: true.
 *  8. Whitespace-trimmed username: registered "abc", lookup "  abc  " with right password -> ok: true.
 *  9. Case-insensitive seed username: lookup "TESTUSER"/"Test@123" against empty list -> ok: true.
 *
 * AsyncStorage is mocked via the official jest mock so that storageHelper
 * behaves as it would in production (JSON round-trip through the mock store).
 *
 * Imports:
 *  - 2.3 dependency: SEED_CREDENTIAL from Helper/seedCredentials (for fixture values)
 *  - 2.4 dependency: writeUsers from Helper/storageHelper (to seed registered-user state)
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { lookupCredential } from '@/Helper/credentialHelper';
import { writeUsers } from '@/Helper/storageHelper';
import { SEED_CREDENTIAL } from '@/Helper/seedCredentials';
import type { StoredUser } from '@/Helper/storageHelper';

/* eslint-disable @typescript-eslint/no-require-imports */
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);
/* eslint-enable @typescript-eslint/no-require-imports */

/** Helper that builds a minimal StoredUser fixture with sensible defaults. */
function makeUser(
  overrides: Partial<StoredUser> & { username: string; password: string },
): StoredUser {
  return {
    email: 'user@example.com',
    createdAt: '2026-05-05T00:00:00.000Z',
    ...overrides,
  };
}

beforeEach(async () => {
  // Reset the AsyncStorage mock store between every test so no state leaks.
  await AsyncStorage.clear();
});

// ---------------------------------------------------------------------------
// Test 1 — empty registered list, seed credential matches
// ---------------------------------------------------------------------------

describe('given an empty registered-user list and seed credentials', () => {
  describe(`when lookupCredential("${SEED_CREDENTIAL.username}", "${SEED_CREDENTIAL.password}") is called`, () => {
    it('then it resolves to { ok: true }', async () => {
      // No writeUsers call — storage is empty.
      const result = await lookupCredential(SEED_CREDENTIAL.username, SEED_CREDENTIAL.password);
      expect(result).toEqual({ ok: true });
    });
  });
});

// ---------------------------------------------------------------------------
// Test 2 — empty registered list, seed username correct but password wrong
// ---------------------------------------------------------------------------

describe('given an empty registered-user list', () => {
  describe(`when lookupCredential("${SEED_CREDENTIAL.username}", "WrongPassword1") is called`, () => {
    it('then it resolves to { ok: false }', async () => {
      const result = await lookupCredential(SEED_CREDENTIAL.username, 'WrongPassword1');
      expect(result).toEqual({ ok: false });
    });
  });
});

// ---------------------------------------------------------------------------
// Test 3 — empty registered list, unknown username
// ---------------------------------------------------------------------------

describe('given an empty registered-user list', () => {
  describe('when lookupCredential with an unknown username is called', () => {
    it('then it resolves to { ok: false }', async () => {
      const result = await lookupCredential('unknownuser', 'SomePassword1');
      expect(result).toEqual({ ok: false });
    });
  });
});

// ---------------------------------------------------------------------------
// Test 4 — registered user matches (correct username and password)
// ---------------------------------------------------------------------------

describe('given a registered user "alice" with password "Secure99"', () => {
  describe('when lookupCredential("alice", "Secure99") is called', () => {
    it('then it resolves to { ok: true }', async () => {
      await writeUsers([makeUser({ username: 'alice', password: 'Secure99' })]);
      const result = await lookupCredential('alice', 'Secure99');
      expect(result).toEqual({ ok: true });
    });
  });
});

// ---------------------------------------------------------------------------
// Test 5 — registered user found but wrong password
// ---------------------------------------------------------------------------

describe('given a registered user "alice" with password "Secure99"', () => {
  describe('when lookupCredential("alice", "WrongPass1") is called', () => {
    it('then it resolves to { ok: false }', async () => {
      await writeUsers([makeUser({ username: 'alice', password: 'Secure99' })]);
      const result = await lookupCredential('alice', 'WrongPass1');
      expect(result).toEqual({ ok: false });
    });
  });
});

// ---------------------------------------------------------------------------
// Test 6 — precedence: registered username match short-circuits seed lookup
// ---------------------------------------------------------------------------

describe('given a registered user "abc" with password "Wrong1!" (not the seed password)', () => {
  describe('when lookupCredential("abc", "Test@123") is called (seed password)', () => {
    it('then it resolves to { ok: false } — seed is NOT consulted when a registered username matches', async () => {
      // Register "abc" with a password that differs from the seed.
      await writeUsers([makeUser({ username: 'abc', password: 'Wrong1!' })]);

      // The seed has password "Test@123" but "abc" is registered, so the
      // lookup must stop at the registered record and return { ok: false }.
      const result = await lookupCredential('abc', 'Test@123');
      expect(result).toEqual({ ok: false });
    });
  });
});

// ---------------------------------------------------------------------------
// Test 7 — case-insensitive username match against registered users
// ---------------------------------------------------------------------------

describe('given a registered user "abc" with password "Secure99"', () => {
  describe('when lookupCredential("ABC", "Secure99") is called (uppercase username)', () => {
    it('then it resolves to { ok: true } — username comparison is case-insensitive', async () => {
      await writeUsers([makeUser({ username: 'abc', password: 'Secure99' })]);
      const result = await lookupCredential('ABC', 'Secure99');
      expect(result).toEqual({ ok: true });
    });
  });
});

// ---------------------------------------------------------------------------
// Test 8 — whitespace-trimmed username match against registered users
// ---------------------------------------------------------------------------

describe('given a registered user "abc" with password "Secure99"', () => {
  describe('when lookupCredential("  abc  ", "Secure99") is called (padded username)', () => {
    it('then it resolves to { ok: true } — username is trimmed before lookup', async () => {
      await writeUsers([makeUser({ username: 'abc', password: 'Secure99' })]);
      const result = await lookupCredential('  abc  ', 'Secure99');
      expect(result).toEqual({ ok: true });
    });
  });
});

// ---------------------------------------------------------------------------
// Test 9 — case-insensitive seed username match on empty registered list
// ---------------------------------------------------------------------------

describe('given an empty registered-user list and seed credentials', () => {
  describe(`when lookupCredential("TESTUSER", "${SEED_CREDENTIAL.password}") is called (uppercase seed username)`, () => {
    it('then it resolves to { ok: true } — seed username comparison is case-insensitive', async () => {
      // No registered users — only the seed is consulted.
      const result = await lookupCredential('TESTUSER', SEED_CREDENTIAL.password);
      expect(result).toEqual({ ok: true });
    });
  });
});
