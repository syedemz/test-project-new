/**
 * Component tests for RegisterScreen — story 4.1 acceptance criteria.
 *
 * Covers:
 *   1. Render with default state — all four fields and screen title render;
 *      no error text is visible.
 *   2. Blur each field with invalid input → the matching error label renders.
 *   3. Blur each field with valid input → no error renders.
 *   4. confirmPassword mismatch renders only after blur, not on every keystroke.
 *
 * ThemeProvider is always provided because RegisterScreen calls useTheme().
 */

import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import { ThemeProvider } from '@/theme/ThemeProvider';
import RegisterScreen from '@/screens/RegisterScreen';
import labels from '@/labels/labels.json';

// ---------------------------------------------------------------------------
// Test helper
// ---------------------------------------------------------------------------

/**
 * Renders RegisterScreen wrapped in ThemeProvider.
 *
 * @returns The RNTL render result with all query helpers available.
 */
function renderScreen() {
  return render(
    <ThemeProvider>
      <RegisterScreen />
    </ThemeProvider>,
  );
}

// ---------------------------------------------------------------------------
// AC1 — render with default state
// ---------------------------------------------------------------------------

describe('given RegisterScreen is rendered with default state, when the tree is queried', () => {
  it('then the register-screen testID is in the tree', () => {
    const { getByTestId } = renderScreen();
    expect(getByTestId('register-screen')).toBeTruthy();
  });

  it('then the register_screen_title label text is rendered', () => {
    const { getByText } = renderScreen();
    expect(getByText(labels.register_screen_title.en)).toBeTruthy();
  });

  it('then all four field labels are rendered', () => {
    const { getByText } = renderScreen();
    expect(getByText(labels.register_email_label.en)).toBeTruthy();
    expect(getByText(labels.register_username_label.en)).toBeTruthy();
    expect(getByText(labels.register_password_label.en)).toBeTruthy();
    expect(getByText(labels.register_confirm_password_label.en)).toBeTruthy();
  });

  it('then all four TextInput controls are in the tree', () => {
    const { getByTestId } = renderScreen();
    expect(getByTestId('register-email-input')).toBeTruthy();
    expect(getByTestId('register-username-input')).toBeTruthy();
    expect(getByTestId('register-password-input')).toBeTruthy();
    expect(getByTestId('register-confirm-password-input')).toBeTruthy();
  });

  it('then no inline error texts are visible', () => {
    const { queryByTestId } = renderScreen();
    expect(queryByTestId('register-email-error')).toBeNull();
    expect(queryByTestId('register-username-error')).toBeNull();
    expect(queryByTestId('register-password-error')).toBeNull();
    expect(queryByTestId('register-confirm-password-error')).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// AC2 — blur with invalid input renders the matching error label key
// ---------------------------------------------------------------------------

describe('given the email field is blurred with an invalid value, when the error is checked', () => {
  it('then the register_validation_email_invalid copy renders', () => {
    const { getByTestId } = renderScreen();

    fireEvent.changeText(getByTestId('register-email-input'), 'not-an-email');
    fireEvent(getByTestId('register-email-input'), 'blur');

    const errorEl = getByTestId('register-email-error');
    expect(errorEl.props.children).toBe(labels.register_validation_email_invalid.en);
  });

  it('then the register_validation_email_invalid copy renders when email is empty', () => {
    const { getByTestId } = renderScreen();

    // Default value is empty; blur immediately
    fireEvent(getByTestId('register-email-input'), 'blur');

    const errorEl = getByTestId('register-email-error');
    expect(errorEl.props.children).toBe(labels.register_validation_email_invalid.en);
  });
});

describe('given the username field is blurred with an invalid value, when the error is checked', () => {
  it('then the register_validation_username_invalid copy renders for username_required', () => {
    const { getByTestId } = renderScreen();

    fireEvent(getByTestId('register-username-input'), 'blur');

    const errorEl = getByTestId('register-username-error');
    expect(errorEl.props.children).toBe(labels.register_validation_username_invalid.en);
  });

  it('then the register_validation_username_invalid copy renders for username_too_short', () => {
    const { getByTestId } = renderScreen();

    fireEvent.changeText(getByTestId('register-username-input'), 'ab');
    fireEvent(getByTestId('register-username-input'), 'blur');

    const errorEl = getByTestId('register-username-error');
    expect(errorEl.props.children).toBe(labels.register_validation_username_invalid.en);
  });

  it('then the register_validation_username_invalid copy renders for username_invalid_chars', () => {
    const { getByTestId } = renderScreen();

    fireEvent.changeText(getByTestId('register-username-input'), 'bad name!');
    fireEvent(getByTestId('register-username-input'), 'blur');

    const errorEl = getByTestId('register-username-error');
    expect(errorEl.props.children).toBe(labels.register_validation_username_invalid.en);
  });
});

describe('given the password field is blurred with an invalid value, when the error is checked', () => {
  it('then the register_validation_password_weak copy renders for password_required', () => {
    const { getByTestId } = renderScreen();

    fireEvent(getByTestId('register-password-input'), 'blur');

    const errorEl = getByTestId('register-password-error');
    expect(errorEl.props.children).toBe(labels.register_validation_password_weak.en);
  });

  it('then the register_validation_password_weak copy renders for password_too_short', () => {
    const { getByTestId } = renderScreen();

    fireEvent.changeText(getByTestId('register-password-input'), 'Ab1');
    fireEvent(getByTestId('register-password-input'), 'blur');

    const errorEl = getByTestId('register-password-error');
    expect(errorEl.props.children).toBe(labels.register_validation_password_weak.en);
  });

  it('then the register_validation_password_weak copy renders for password_no_digit', () => {
    const { getByTestId } = renderScreen();

    fireEvent.changeText(getByTestId('register-password-input'), 'NoDigitsHere');
    fireEvent(getByTestId('register-password-input'), 'blur');

    const errorEl = getByTestId('register-password-error');
    expect(errorEl.props.children).toBe(labels.register_validation_password_weak.en);
  });

  it('then the register_validation_password_weak copy renders for password_no_letter', () => {
    const { getByTestId } = renderScreen();

    fireEvent.changeText(getByTestId('register-password-input'), '12345678');
    fireEvent(getByTestId('register-password-input'), 'blur');

    const errorEl = getByTestId('register-password-error');
    expect(errorEl.props.children).toBe(labels.register_validation_password_weak.en);
  });
});

describe('given the confirmPassword field is blurred with a mismatched value, when the error is checked', () => {
  it('then the register_validation_password_mismatch copy renders', () => {
    const { getByTestId } = renderScreen();

    fireEvent.changeText(getByTestId('register-password-input'), 'Secret1234');
    fireEvent.changeText(getByTestId('register-confirm-password-input'), 'DifferentPass1');
    fireEvent(getByTestId('register-confirm-password-input'), 'blur');

    const errorEl = getByTestId('register-confirm-password-error');
    expect(errorEl.props.children).toBe(labels.register_validation_password_mismatch.en);
  });
});

// ---------------------------------------------------------------------------
// AC3 — blur with valid input does not render an error
// ---------------------------------------------------------------------------

describe('given the email field is blurred with a valid email, when the error is checked', () => {
  it('then no email error is rendered', () => {
    const { getByTestId, queryByTestId } = renderScreen();

    fireEvent.changeText(getByTestId('register-email-input'), 'user@example.com');
    fireEvent(getByTestId('register-email-input'), 'blur');

    expect(queryByTestId('register-email-error')).toBeNull();
  });
});

describe('given the username field is blurred with a valid username, when the error is checked', () => {
  it('then no username error is rendered', () => {
    const { getByTestId, queryByTestId } = renderScreen();

    fireEvent.changeText(getByTestId('register-username-input'), 'valid_user');
    fireEvent(getByTestId('register-username-input'), 'blur');

    expect(queryByTestId('register-username-error')).toBeNull();
  });
});

describe('given the password field is blurred with a valid password, when the error is checked', () => {
  it('then no password error is rendered', () => {
    const { getByTestId, queryByTestId } = renderScreen();

    fireEvent.changeText(getByTestId('register-password-input'), 'Secure1234');
    fireEvent(getByTestId('register-password-input'), 'blur');

    expect(queryByTestId('register-password-error')).toBeNull();
  });
});

describe('given the confirmPassword field is blurred with a matching value, when the error is checked', () => {
  it('then no confirmPassword error is rendered', () => {
    const { getByTestId, queryByTestId } = renderScreen();

    fireEvent.changeText(getByTestId('register-password-input'), 'Secure1234');
    fireEvent.changeText(getByTestId('register-confirm-password-input'), 'Secure1234');
    fireEvent(getByTestId('register-confirm-password-input'), 'blur');

    expect(queryByTestId('register-confirm-password-error')).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// AC4 — confirmPassword mismatch renders only after blur, not on every keystroke
// ---------------------------------------------------------------------------

describe('given the confirmPassword field has a mismatched value typed character by character, when no blur has occurred', () => {
  it('then no confirmPassword error is rendered after typing alone (error is not on-keystroke)', () => {
    const { getByTestId, queryByTestId } = renderScreen();

    fireEvent.changeText(getByTestId('register-password-input'), 'Secret1234');

    // Type character by character without blurring
    fireEvent.changeText(getByTestId('register-confirm-password-input'), 'W');
    fireEvent.changeText(getByTestId('register-confirm-password-input'), 'Wr');
    fireEvent.changeText(getByTestId('register-confirm-password-input'), 'Wro');
    fireEvent.changeText(getByTestId('register-confirm-password-input'), 'Wron');
    fireEvent.changeText(getByTestId('register-confirm-password-input'), 'Wrong');

    // No blur fired — error must NOT appear
    expect(queryByTestId('register-confirm-password-error')).toBeNull();
  });

  it('then the confirmPassword error appears once blur is fired after typing', () => {
    const { getByTestId } = renderScreen();

    fireEvent.changeText(getByTestId('register-password-input'), 'Secret1234');
    fireEvent.changeText(getByTestId('register-confirm-password-input'), 'WrongValue1');

    // Still no error before blur
    // (no assertion needed — the previous test already covers this)

    // Blur fires the validation
    fireEvent(getByTestId('register-confirm-password-input'), 'blur');

    const errorEl = getByTestId('register-confirm-password-error');
    expect(errorEl.props.children).toBe(labels.register_validation_password_mismatch.en);
  });
});
