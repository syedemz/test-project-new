/**
 * Pure synchronous form-validation helpers.
 *
 * Each function returns a discriminated union:
 * `{ ok: true }` when the value passes all rules, or
 * `{ ok: false; reason: string }` when it fails.
 *
 * The `reason` values are **stable identifiers** — not user-facing copy.
 * Screens map them to label keys from `src/labels/labels.json`.
 *
 * Complete set of reason strings this module can return:
 *
 * **validateUsername** — `"username_required"` | `"username_too_short"` |
 * `"username_too_long"` | `"username_invalid_chars"`
 *
 * **validateEmail** — `"email_required"` | `"email_invalid"`
 *
 * **validatePassword** — `"password_required"` | `"password_too_short"` |
 * `"password_too_long"` | `"password_no_letter"` | `"password_no_digit"`
 *
 * **validateConfirmPassword** — `"password_mismatch"`
 */

/** Discriminated-union result returned by every validator in this module. */
export type ValidationResult = { ok: true } | { ok: false; reason: string };

/** Minimum allowed username length (inclusive). */
const USERNAME_MIN_LENGTH = 3;

/** Maximum allowed username length (inclusive). */
const USERNAME_MAX_LENGTH = 20;

/** Regex that the trimmed username must satisfy. */
const USERNAME_PATTERN = /^[A-Za-z0-9_]+$/;

/** Minimum allowed password length (inclusive). */
const PASSWORD_MIN_LENGTH = 8;

/** Maximum allowed password length (inclusive). */
const PASSWORD_MAX_LENGTH = 64;

/** Pragmatic email pattern — one at-sign, domain has a dot, no whitespace. */
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Validates a username according to the rules in architecture.md "Form validation rules".
 *
 * Leading and trailing whitespace is trimmed before every check.
 * Uniqueness is **not** verified here — that belongs to the registration flow.
 *
 * @param value - The raw username string entered by the user.
 * @returns `{ ok: true }` when all rules pass, or `{ ok: false; reason }` with a
 *   stable reason identifier. Possible reasons: `"username_required"`,
 *   `"username_too_short"`, `"username_too_long"`, `"username_invalid_chars"`.
 *
 * @example
 * ```ts
 * validateUsername('alice')   // { ok: true }
 * validateUsername('')        // { ok: false, reason: 'username_required' }
 * validateUsername('ab')      // { ok: false, reason: 'username_too_short' }
 * ```
 */
export function validateUsername(value: string): ValidationResult {
  const trimmed = value.trim();

  if (trimmed.length === 0) {
    return { ok: false, reason: 'username_required' };
  }

  if (trimmed.length < USERNAME_MIN_LENGTH) {
    return { ok: false, reason: 'username_too_short' };
  }

  if (trimmed.length > USERNAME_MAX_LENGTH) {
    return { ok: false, reason: 'username_too_long' };
  }

  if (!USERNAME_PATTERN.test(trimmed)) {
    return { ok: false, reason: 'username_invalid_chars' };
  }

  return { ok: true };
}

/**
 * Validates an email address using a pragmatic (non-RFC) regex.
 *
 * Leading and trailing whitespace is trimmed before the check.
 * Uniqueness is **not** verified here — that belongs to the registration flow.
 *
 * @param value - The raw email string entered by the user.
 * @returns `{ ok: true }` when the value is non-empty and matches the pattern, or
 *   `{ ok: false; reason }` with a stable reason identifier. Possible reasons:
 *   `"email_required"`, `"email_invalid"`.
 *
 * @example
 * ```ts
 * validateEmail('user@example.com')  // { ok: true }
 * validateEmail('')                  // { ok: false, reason: 'email_required' }
 * validateEmail('not-an-email')      // { ok: false, reason: 'email_invalid' }
 * ```
 */
export function validateEmail(value: string): ValidationResult {
  const trimmed = value.trim();

  if (trimmed.length === 0) {
    return { ok: false, reason: 'email_required' };
  }

  if (!EMAIL_PATTERN.test(trimmed)) {
    return { ok: false, reason: 'email_invalid' };
  }

  return { ok: true };
}

/**
 * Validates a password according to the rules in architecture.md "Form validation rules".
 *
 * No trimming is applied — passwords are validated as-is to preserve intentional
 * leading/trailing spaces (which count toward the length requirement).
 *
 * @param value - The raw password string entered by the user.
 * @returns `{ ok: true }` when all rules pass, or `{ ok: false; reason }` with a
 *   stable reason identifier. Possible reasons: `"password_required"`,
 *   `"password_too_short"`, `"password_too_long"`, `"password_no_letter"`,
 *   `"password_no_digit"`.
 *
 * @example
 * ```ts
 * validatePassword('Secret1!')  // { ok: true }
 * validatePassword('short1')    // { ok: false, reason: 'password_too_short' }
 * validatePassword('noodigits') // { ok: false, reason: 'password_no_digit' }
 * ```
 */
export function validatePassword(value: string): ValidationResult {
  if (value.length === 0) {
    return { ok: false, reason: 'password_required' };
  }

  if (value.length < PASSWORD_MIN_LENGTH) {
    return { ok: false, reason: 'password_too_short' };
  }

  if (value.length > PASSWORD_MAX_LENGTH) {
    return { ok: false, reason: 'password_too_long' };
  }

  if (!/[A-Za-z]/.test(value)) {
    return { ok: false, reason: 'password_no_letter' };
  }

  if (!/[0-9]/.test(value)) {
    return { ok: false, reason: 'password_no_digit' };
  }

  return { ok: true };
}

/**
 * Validates that `confirm` matches `password` exactly.
 *
 * No trimming is applied to either argument — the comparison is exact.
 * A leading-space difference (e.g., `" Test1234"` vs `"Test1234"`) is a mismatch.
 *
 * @param password - The original password value.
 * @param confirm  - The confirmation re-entry provided by the user.
 * @returns `{ ok: true }` when the two strings are identical, or
 *   `{ ok: false; reason: 'password_mismatch' }`.
 *
 * @example
 * ```ts
 * validateConfirmPassword('Test1234', 'Test1234')   // { ok: true }
 * validateConfirmPassword('Test1234', ' Test1234')  // { ok: false, reason: 'password_mismatch' }
 * ```
 */
export function validateConfirmPassword(password: string, confirm: string): ValidationResult {
  if (password !== confirm) {
    return { ok: false, reason: 'password_mismatch' };
  }

  return { ok: true };
}
