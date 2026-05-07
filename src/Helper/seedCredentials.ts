/**
 * Hardcoded seed credential used as the fallback login when the registered-user
 * list is empty (e.g. on first run). The seed username is reserved — registration
 * rejects any attempt to register with the same username (case-insensitive).
 *
 * @see architecture.md — "Seed credential vs. registered users — precedence"
 */

/** The shape of a seed credential pair. */
export interface SeedCredential {
  readonly username: string;
  readonly password: string;
}

/**
 * The single seed credential for this application.
 *
 * Values are fixed at implementation time per architecture.md §Seed credential:
 * - `username`: `"testuser"`
 * - `password`: `"Test@123"`
 *
 * This module has no side effects on import — no I/O, no logging, no network.
 */
export const SEED_CREDENTIAL: SeedCredential = {
  username: 'testuser',
  password: 'Test@123',
};
