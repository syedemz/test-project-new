/**
 * Unit tests for src/Helper/seedCredentials.ts — story 2.3 acceptance criteria.
 *
 * Asserts that SEED_CREDENTIAL carries the exact values specified in
 * architecture.md: username "testuser", password "Test\@123".
 */

import { SEED_CREDENTIAL } from '@/Helper/seedCredentials';

describe('given the SEED_CREDENTIAL constant, when reading username', () => {
  it('then it equals "testuser" exactly', () => {
    expect(SEED_CREDENTIAL.username).toBe('testuser');
  });
});

describe('given the SEED_CREDENTIAL constant, when reading password', () => {
  it('then it equals "Test@123" exactly', () => {
    expect(SEED_CREDENTIAL.password).toBe('Test@123');
  });
});

describe('given the SEED_CREDENTIAL constant, when inspecting the object shape', () => {
  it('then it has exactly two keys: username and password', () => {
    const keys = Object.keys(SEED_CREDENTIAL).sort();
    expect(keys).toEqual(['password', 'username']);
  });
});
