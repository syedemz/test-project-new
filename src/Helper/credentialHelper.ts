import { SEED_CREDENTIAL } from '@/Helper/seedCredentials';
import { readUsers } from '@/Helper/storageHelper';

/**
 * The result type returned by {@link lookupCredential}.
 *
 * A discriminated union so callers can narrow on `ok` without additional
 * type guards:
 * - `{ ok: true }` — credentials matched a registered user or the seed.
 * - `{ ok: false }` — no match; login should be denied.
 */
export type CredentialResult = { ok: true } | { ok: false };

/**
 * Looks up a username/password pair against the registered-user store and,
 * if no registered user matches, against the hardcoded seed credential.
 *
 * **Lookup order** (per architecture.md "Login lookup order"):
 * 1. Read registered users via {@link readUsers}. If a registered user whose
 *    lowercased, trimmed username equals the normalised input username is found,
 *    the password is compared **exactly** (no trim, no case folding). If both
 *    match the function resolves immediately with `{ ok: true }` — the seed is
 *    NOT consulted.
 * 2. If the registered list is empty, or no registered username matches, the
 *    seed credential from {@link SEED_CREDENTIAL} is checked using the same
 *    normalisation rules.
 * 3. If neither step produces a match, the function resolves with `{ ok: false }`.
 *
 * **Normalisation rules:**
 * - Username is trimmed (`String.prototype.trim`) before any comparison.
 * - Username comparison is case-insensitive (both sides lowercased).
 * - Password comparison is exact — no trimming, no case folding.
 *
 * **Precedence invariant (critical):** when a registered user's username
 * matches the input, the seed is never reached — even if the password is wrong.
 * This makes it possible to observe the lookup order in tests:
 * register `abc / Wrong1!`, then assert that `lookupCredential("abc", "Test@123")`
 * resolves to `{ ok: false }`.
 *
 * @param username - The username entered by the user. May include surrounding
 *   whitespace (trimmed before lookup) and may be in any letter casing.
 * @param password - The password entered by the user. Compared exactly.
 * @returns A promise that resolves to `{ ok: true }` on a successful match,
 *   or `{ ok: false }` when no match is found.
 * @throws Any error propagated from {@link readUsers} (e.g. an AsyncStorage
 *   failure). Callers are responsible for catching storage errors and
 *   surfacing them appropriately.
 *
 * @example
 * ```ts
 * const result = await lookupCredential('testuser', 'Test@123');
 * if (result.ok) {
 *   // proceed to authenticated state
 * } else {
 *   // show inline login-error
 * }
 * ```
 */
export async function lookupCredential(
  username: string,
  password: string,
): Promise<CredentialResult> {
  const normalisedUsername = username.trim().toLowerCase();

  const registeredUsers = await readUsers();

  // Step 1 — search registered users first.
  for (const user of registeredUsers) {
    if (user.username.toLowerCase() === normalisedUsername) {
      // Username matched a registered record. The seed is NOT consulted from
      // this point, regardless of whether the password is correct.
      return user.password === password ? { ok: true } : { ok: false };
    }
  }

  // Step 2 — no registered username matched; fall back to the seed credential.
  if (
    SEED_CREDENTIAL.username.toLowerCase() === normalisedUsername &&
    SEED_CREDENTIAL.password === password
  ) {
    return { ok: true };
  }

  // Step 3 — no match at all.
  return { ok: false };
}
