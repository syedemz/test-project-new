import {
  validateUsername,
  validateEmail,
  validatePassword,
  validateConfirmPassword,
} from '@/Helper/validationHelper';

// ---------------------------------------------------------------------------
// validateUsername
// ---------------------------------------------------------------------------

describe('validateUsername', () => {
  describe('given an empty or whitespace-only string', () => {
    it('when value is empty, then returns username_required', () => {
      const result = validateUsername('');
      expect(result).toEqual({ ok: false, reason: 'username_required' });
    });

    it('when value is whitespace-only, then returns username_required', () => {
      const result = validateUsername('   ');
      expect(result).toEqual({ ok: false, reason: 'username_required' });
    });
  });

  describe('given a length below the minimum', () => {
    it('when trimmed length is 1 (just-below-min), then returns username_too_short', () => {
      const result = validateUsername('a');
      expect(result).toEqual({ ok: false, reason: 'username_too_short' });
    });

    it('when trimmed length is 2 (just-below-min), then returns username_too_short', () => {
      const result = validateUsername('ab');
      expect(result).toEqual({ ok: false, reason: 'username_too_short' });
    });
  });

  describe('given a length at exactly the minimum (3)', () => {
    it('when trimmed length is 3, then returns ok', () => {
      const result = validateUsername('abc');
      expect(result).toEqual({ ok: true });
    });

    it('when padded string trims to exactly 3 chars, then returns ok', () => {
      const result = validateUsername('  abc  ');
      expect(result).toEqual({ ok: true });
    });
  });

  describe('given a length at exactly the maximum (20)', () => {
    it('when trimmed length is 20, then returns ok', () => {
      const result = validateUsername('a'.repeat(20));
      expect(result).toEqual({ ok: true });
    });
  });

  describe('given a length above the maximum', () => {
    it('when trimmed length is 21 (just-above-max), then returns username_too_long', () => {
      const result = validateUsername('a'.repeat(21));
      expect(result).toEqual({ ok: false, reason: 'username_too_long' });
    });

    it('when trimmed length is 25, then returns username_too_long', () => {
      const result = validateUsername('a'.repeat(25));
      expect(result).toEqual({ ok: false, reason: 'username_too_long' });
    });
  });

  describe('given a value with invalid characters', () => {
    it('when value contains a hyphen, then returns username_invalid_chars', () => {
      const result = validateUsername('user-name');
      expect(result).toEqual({ ok: false, reason: 'username_invalid_chars' });
    });

    it('when value contains a space, then returns username_invalid_chars', () => {
      // Trim removes leading/trailing spaces; an internal space is invalid
      const result = validateUsername('user name');
      expect(result).toEqual({ ok: false, reason: 'username_invalid_chars' });
    });

    it('when value contains an at-sign, then returns username_invalid_chars', () => {
      const result = validateUsername('user@name');
      expect(result).toEqual({ ok: false, reason: 'username_invalid_chars' });
    });

    it('when value contains a dot, then returns username_invalid_chars', () => {
      const result = validateUsername('user.name');
      expect(result).toEqual({ ok: false, reason: 'username_invalid_chars' });
    });
  });

  describe('given a valid value', () => {
    it('when value is all letters, then returns ok', () => {
      expect(validateUsername('alice')).toEqual({ ok: true });
    });

    it('when value is all digits (min length), then returns ok', () => {
      expect(validateUsername('123')).toEqual({ ok: true });
    });

    it('when value contains letters, digits, and underscores, then returns ok', () => {
      expect(validateUsername('alice_01')).toEqual({ ok: true });
    });

    it('when value mixes uppercase and lowercase letters, then returns ok', () => {
      expect(validateUsername('AliceB')).toEqual({ ok: true });
    });

    it('when value starts with underscore, then returns ok', () => {
      expect(validateUsername('_hidden')).toEqual({ ok: true });
    });
  });
});

// ---------------------------------------------------------------------------
// validateEmail
// ---------------------------------------------------------------------------

describe('validateEmail', () => {
  describe('given an empty or whitespace-only string', () => {
    it('when value is empty, then returns email_required', () => {
      expect(validateEmail('')).toEqual({ ok: false, reason: 'email_required' });
    });

    it('when value is whitespace-only, then returns email_required', () => {
      expect(validateEmail('   ')).toEqual({ ok: false, reason: 'email_required' });
    });
  });

  describe('given an invalid email pattern', () => {
    it('when value has no at-sign, then returns email_invalid', () => {
      expect(validateEmail('nodomain')).toEqual({ ok: false, reason: 'email_invalid' });
    });

    it('when value has no domain dot, then returns email_invalid', () => {
      expect(validateEmail('user@nodot')).toEqual({ ok: false, reason: 'email_invalid' });
    });

    it('when value has whitespace inside, then returns email_invalid', () => {
      expect(validateEmail('user @example.com')).toEqual({ ok: false, reason: 'email_invalid' });
    });

    it('when value has multiple at-signs, then returns email_invalid', () => {
      expect(validateEmail('user@@example.com')).toEqual({ ok: false, reason: 'email_invalid' });
    });

    it('when local-part is empty (starts with @), then returns email_invalid', () => {
      expect(validateEmail('@example.com')).toEqual({ ok: false, reason: 'email_invalid' });
    });
  });

  describe('given a valid email address', () => {
    it('when value is a standard email, then returns ok', () => {
      expect(validateEmail('user@example.com')).toEqual({ ok: true });
    });

    it('when value has leading/trailing whitespace that trims to a valid email, then returns ok', () => {
      expect(validateEmail('  user@example.com  ')).toEqual({ ok: true });
    });

    it('when value has a subdomain, then returns ok', () => {
      expect(validateEmail('user@mail.example.com')).toEqual({ ok: true });
    });

    it('when value has a plus-address local part, then returns ok', () => {
      expect(validateEmail('user+tag@example.co.uk')).toEqual({ ok: true });
    });
  });
});

// ---------------------------------------------------------------------------
// validatePassword
// ---------------------------------------------------------------------------

describe('validatePassword', () => {
  describe('given an empty string', () => {
    it('when value is empty, then returns password_required', () => {
      expect(validatePassword('')).toEqual({ ok: false, reason: 'password_required' });
    });
  });

  describe('given a length below the minimum', () => {
    it('when length is 1 (just-below-min), then returns password_too_short', () => {
      expect(validatePassword('A')).toEqual({ ok: false, reason: 'password_too_short' });
    });

    it('when length is 7 (just-below-min of 8), then returns password_too_short', () => {
      expect(validatePassword('Secret1')).toEqual({ ok: false, reason: 'password_too_short' });
    });
  });

  describe('given a length at exactly the minimum (8)', () => {
    it('when length is 8 with letter and digit, then returns ok', () => {
      expect(validatePassword('Secret1!')).toEqual({ ok: true });
    });

    it('when length is 8 with only letters and digits (no special chars), then returns ok', () => {
      expect(validatePassword('Secret12')).toEqual({ ok: true });
    });
  });

  describe('given a length at exactly the maximum (64)', () => {
    it('when length is 64 with letter and digit, then returns ok', () => {
      const value = 'a'.repeat(63) + '1';
      expect(validatePassword(value)).toEqual({ ok: true });
    });
  });

  describe('given a length above the maximum', () => {
    it('when length is 65 (just-above-max), then returns password_too_long', () => {
      const value = 'a'.repeat(64) + '1';
      expect(validatePassword(value)).toEqual({ ok: false, reason: 'password_too_long' });
    });
  });

  describe('given a valid length but missing a letter', () => {
    it('when value contains only digits, then returns password_no_letter', () => {
      expect(validatePassword('12345678')).toEqual({ ok: false, reason: 'password_no_letter' });
    });

    it('when value contains only special chars and digits, then returns password_no_letter', () => {
      expect(validatePassword('12345!@#')).toEqual({ ok: false, reason: 'password_no_letter' });
    });
  });

  describe('given a valid length but missing a digit', () => {
    it('when value contains only letters, then returns password_no_digit', () => {
      expect(validatePassword('abcdefgh')).toEqual({ ok: false, reason: 'password_no_digit' });
    });

    it('when value contains only letters and special chars, then returns password_no_digit', () => {
      expect(validatePassword('abcde!@#')).toEqual({ ok: false, reason: 'password_no_digit' });
    });
  });

  describe('given a valid password', () => {
    it('when value meets all rules with letter and digit, then returns ok', () => {
      expect(validatePassword('Test@1234')).toEqual({ ok: true });
    });

    it('when value is exactly minimum length with one letter and one digit, then returns ok', () => {
      expect(validatePassword('aaaaaaa1')).toEqual({ ok: true });
    });

    it('when value is a mix of uppercase, lowercase, and digits, then returns ok', () => {
      expect(validatePassword('ABCDabcd1234')).toEqual({ ok: true });
    });

    it('when value has no special chars (only letters and digits), then returns ok', () => {
      // No special-character requirement for v1 per architecture.md
      expect(validatePassword('Password1')).toEqual({ ok: true });
    });
  });
});

// ---------------------------------------------------------------------------
// validateConfirmPassword
// ---------------------------------------------------------------------------

describe('validateConfirmPassword', () => {
  describe('given matching strings', () => {
    it('when password and confirm are identical, then returns ok', () => {
      expect(validateConfirmPassword('Test1234', 'Test1234')).toEqual({ ok: true });
    });

    it('when both are empty strings, then returns ok (exact match)', () => {
      // validatePassword would catch an empty password separately; confirm only checks equality
      expect(validateConfirmPassword('', '')).toEqual({ ok: true });
    });

    it('when both contain special characters and are identical, then returns ok', () => {
      expect(validateConfirmPassword('Test@1234!', 'Test@1234!')).toEqual({ ok: true });
    });
  });

  describe('given non-matching strings', () => {
    it('when confirm differs from password, then returns password_mismatch', () => {
      expect(validateConfirmPassword('Test1234', 'test1234')).toEqual({
        ok: false,
        reason: 'password_mismatch',
      });
    });

    it('when confirm has a leading space (no trim applied), then returns password_mismatch', () => {
      // Exact no-trim contract: " Test1234" !== "Test1234"
      expect(validateConfirmPassword('Test1234', ' Test1234')).toEqual({
        ok: false,
        reason: 'password_mismatch',
      });
    });

    it('when confirm has a trailing space (no trim applied), then returns password_mismatch', () => {
      expect(validateConfirmPassword('Test1234', 'Test1234 ')).toEqual({
        ok: false,
        reason: 'password_mismatch',
      });
    });

    it('when confirm is an empty string and password is not, then returns password_mismatch', () => {
      expect(validateConfirmPassword('Test1234', '')).toEqual({
        ok: false,
        reason: 'password_mismatch',
      });
    });

    it('when password is empty and confirm is not, then returns password_mismatch', () => {
      expect(validateConfirmPassword('', 'Test1234')).toEqual({
        ok: false,
        reason: 'password_mismatch',
      });
    });
  });
});
