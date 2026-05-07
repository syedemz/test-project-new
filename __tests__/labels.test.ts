/**
 * Unit tests for src/labels/labels.json — story 2.2 acceptance criteria.
 *
 * Asserts that every required key from the architecture.md v1 label inventory
 * is present in labels.json and that each key's `en` value is a non-empty string.
 */

import labels from '@/labels/labels.json';

/**
 * The complete v1 key inventory enumerated from architecture.md,
 * section "Labels — schema and v1 key inventory".
 *
 * Groups:
 *   Common          : app_title, ok_button, cancel_button
 *   Login screen    : login_screen_title, login_username_label, login_username_placeholder,
 *                     login_password_label, login_password_placeholder, login_button,
 *                     login_link_to_register, login_invalid_credentials, login_storage_error
 *   Register screen : register_screen_title, register_email_label, register_email_placeholder,
 *                     register_username_label, register_username_placeholder,
 *                     register_password_label, register_password_placeholder,
 *                     register_confirm_password_label, register_confirm_password_placeholder,
 *                     register_button, register_link_to_login,
 *                     register_validation_email_invalid, register_validation_email_in_use,
 *                     register_validation_username_invalid, register_validation_username_in_use,
 *                     register_validation_password_weak, register_validation_password_mismatch,
 *                     register_storage_error
 *   Success modal   : registration_success_title, registration_success_body
 *   Landing screen  : landing_screen_title, landing_tab_home_label
 */
const REQUIRED_KEYS: readonly string[] = [
  // Common
  'app_title',
  'ok_button',
  'cancel_button',

  // Login screen
  'login_screen_title',
  'login_username_label',
  'login_username_placeholder',
  'login_password_label',
  'login_password_placeholder',
  'login_button',
  'login_link_to_register',
  'login_invalid_credentials',
  'login_storage_error',

  // Register screen
  'register_screen_title',
  'register_email_label',
  'register_email_placeholder',
  'register_username_label',
  'register_username_placeholder',
  'register_password_label',
  'register_password_placeholder',
  'register_confirm_password_label',
  'register_confirm_password_placeholder',
  'register_button',
  'register_link_to_login',
  'register_validation_email_invalid',
  'register_validation_email_in_use',
  'register_validation_username_invalid',
  'register_validation_username_in_use',
  'register_validation_password_weak',
  'register_validation_password_mismatch',
  'register_storage_error',

  // Registration success modal
  'registration_success_title',
  'registration_success_body',

  // Landing screen
  'landing_screen_title',
  'landing_tab_home_label',
] as const;

// Cast to a keyed record so TypeScript allows dynamic key lookups.
const labelsRecord = labels as Record<string, { en: string }>;

describe('given labels.json is loaded, when checking the v1 key inventory', () => {
  it('then every required key is present in the file', () => {
    for (const key of REQUIRED_KEYS) {
      expect(Object.prototype.hasOwnProperty.call(labelsRecord, key)).toBe(true);
    }
  });

  it('then every required key has a non-empty "en" string value', () => {
    for (const key of REQUIRED_KEYS) {
      const entry = labelsRecord[key];
      expect(typeof entry).toBe('object');
      expect(typeof entry.en).toBe('string');
      expect(entry.en.trim().length).toBeGreaterThan(0);
    }
  });
});
