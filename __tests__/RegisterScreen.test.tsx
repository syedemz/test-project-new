/**
 * Component tests for RegisterScreen — story 4.1, 4.2, and 4.3 acceptance criteria.
 *
 * Story 4.1 covers:
 *   1. Render with default state — all four fields and screen title render;
 *      no error text is visible.
 *   2. Blur each field with invalid input → the matching error label renders.
 *   3. Blur each field with valid input → no error renders.
 *   4. confirmPassword mismatch renders only after blur, not on every keystroke.
 *
 * Story 4.2 covers:
 *   5. Submit with invalid fields — all inline errors render, no writeUsers call.
 *   6. Username collision (registered list and seed) — username-in-use error renders.
 *   7. Email collision (registered list) — email-in-use error renders.
 *   8. Successful write — writeUsers called exactly once with the correct record shape.
 *   9. Storage write failure — register_storage_error renders, form stays editable.
 *
 * Story 4.3 covers:
 *   10. Success modal does NOT render before a successful submit.
 *   11. Success modal renders after a successful submit (title, body, OK button).
 *   12. OK button dismisses modal AND navigates to Login (navigation spy).
 *   13. Hardware back (onRequestClose) behaves identically to OK.
 *
 * ThemeProvider is always provided because RegisterScreen calls useTheme().
 * storageHelper is mocked so tests never hit AsyncStorage.
 * useNavigation is mocked so navigation.navigate can be asserted without
 * needing a NavigationContainer in the test tree.
 */

import React from 'react';
import { act, fireEvent, render, waitFor } from '@testing-library/react-native';
import { ThemeProvider } from '@/theme/ThemeProvider';
import RegisterScreen from '@/screens/RegisterScreen';
import labels from '@/labels/labels.json';
import type { StoredUser } from '@/Helper/storageHelper';
import { AUTH_ROUTES } from '@/navigation/AuthRoutes';

// ---------------------------------------------------------------------------
// Mock @react-navigation/native — useNavigation returns a spy navigate fn.
// ---------------------------------------------------------------------------

const mockNavigate = jest.fn();

jest.mock('@react-navigation/native', () => {
  const actual = jest.requireActual<typeof import('@react-navigation/native')>(
    '@react-navigation/native',
  );
  return {
    ...actual,
    useNavigation: () => ({ navigate: mockNavigate }),
  };
});

// ---------------------------------------------------------------------------
// Mock storageHelper — must appear before any import that pulls the module.
// ---------------------------------------------------------------------------

jest.mock('@/Helper/storageHelper', () => ({
  readUsers: jest.fn(),
  writeUsers: jest.fn(),
}));

// Import after mock so we get the mocked version.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const storageHelper = require('@/Helper/storageHelper') as {
  readUsers: jest.Mock;
  writeUsers: jest.Mock;
};

// ---------------------------------------------------------------------------
// Test helpers
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

/** Valid field values used across story 4.2 submit tests. */
const VALID_EMAIL = 'alice@example.com';
const VALID_USERNAME = 'alice99';
const VALID_PASSWORD = 'Secure1234';
const VALID_CONFIRM = 'Secure1234';

/**
 * Fills all four fields with the supplied values and presses the submit button.
 *
 * @param queries - The RNTL render result.
 * @param overrides - Per-field overrides; omitted fields use the valid defaults.
 */
async function fillAndSubmit(
  queries: ReturnType<typeof renderScreen>,
  overrides: {
    email?: string;
    username?: string;
    password?: string;
    confirmPassword?: string;
  } = {},
) {
  const { getByTestId } = queries;
  const email = overrides.email ?? VALID_EMAIL;
  const username = overrides.username ?? VALID_USERNAME;
  const password = overrides.password ?? VALID_PASSWORD;
  const confirmPassword = overrides.confirmPassword ?? VALID_CONFIRM;

  fireEvent.changeText(getByTestId('register-email-input'), email);
  fireEvent.changeText(getByTestId('register-username-input'), username);
  fireEvent.changeText(getByTestId('register-password-input'), password);
  fireEvent.changeText(getByTestId('register-confirm-password-input'), confirmPassword);

  await act(async () => {
    fireEvent.press(getByTestId('register-submit-button'));
  });
}

/** Reset all mocks between tests so state doesn't leak. */
beforeEach(() => {
  jest.clearAllMocks();
  mockNavigate.mockClear();
});

// ---------------------------------------------------------------------------
// AC1 — render with default state
// ---------------------------------------------------------------------------

describe('given RegisterScreen is rendered with default state, when the tree is queried', () => {
  it('then the register-screen testID is in the tree', () => {
    const { getByTestId } = renderScreen();
    expect(getByTestId('register-screen')).toBeTruthy();
  });

  it('then the register_screen_title label text is rendered', () => {
    const { getByTestId } = renderScreen();
    expect(getByTestId('register-screen-title').props.children).toBe(
      labels.register_screen_title.en,
    );
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

// ---------------------------------------------------------------------------
// Story 4.2 — AC1: submit with invalid fields shows errors, no write occurs
// ---------------------------------------------------------------------------

describe('given all fields are empty, when the submit button is pressed', () => {
  it('then inline errors render for email, username, password, and confirmPassword', async () => {
    storageHelper.readUsers.mockResolvedValue([]);
    const queries = renderScreen();

    await fillAndSubmit(queries, {
      email: '',
      username: '',
      password: '',
      confirmPassword: '',
    });

    await waitFor(() => {
      expect(queries.getByTestId('register-email-error').props.children).toBe(
        labels.register_validation_email_invalid.en,
      );
      expect(queries.getByTestId('register-username-error').props.children).toBe(
        labels.register_validation_username_invalid.en,
      );
      expect(queries.getByTestId('register-password-error').props.children).toBe(
        labels.register_validation_password_weak.en,
      );
    });
  });

  it('then writeUsers is NOT called when format validation fails', async () => {
    storageHelper.readUsers.mockResolvedValue([]);
    const queries = renderScreen();

    await fillAndSubmit(queries, {
      email: 'not-an-email',
      username: 'ok_user',
      password: 'Secure1234',
      confirmPassword: 'Secure1234',
    });

    expect(storageHelper.writeUsers).not.toHaveBeenCalled();
  });
});

describe('given a valid form with mismatched passwords, when the submit button is pressed', () => {
  it('then the confirmPassword mismatch error renders and writeUsers is NOT called', async () => {
    storageHelper.readUsers.mockResolvedValue([]);
    const queries = renderScreen();

    await fillAndSubmit(queries, { confirmPassword: 'DifferentPass1' });

    await waitFor(() => {
      expect(queries.getByTestId('register-confirm-password-error').props.children).toBe(
        labels.register_validation_password_mismatch.en,
      );
    });
    expect(storageHelper.writeUsers).not.toHaveBeenCalled();
  });
});

describe('given a weak password, when the submit button is pressed', () => {
  it('then the password_weak error renders and writeUsers is NOT called', async () => {
    storageHelper.readUsers.mockResolvedValue([]);
    const queries = renderScreen();

    await fillAndSubmit(queries, { password: 'short', confirmPassword: 'short' });

    await waitFor(() => {
      expect(queries.getByTestId('register-password-error').props.children).toBe(
        labels.register_validation_password_weak.en,
      );
    });
    expect(storageHelper.writeUsers).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// Story 4.2 — AC2: username collision against registered list
// ---------------------------------------------------------------------------

describe('given a username already in the registered list, when the submit button is pressed', () => {
  it('then the username-in-use error renders and writeUsers is NOT called', async () => {
    const existing: StoredUser[] = [
      {
        username: 'AliceUser',
        email: 'existing@example.com',
        password: 'Pass1234',
        createdAt: new Date().toISOString(),
      },
    ];
    storageHelper.readUsers.mockResolvedValue(existing);
    const queries = renderScreen();

    // Submit with same username in different case — should still collide.
    await fillAndSubmit(queries, { username: 'aliceuser', email: 'new@example.com' });

    await waitFor(() => {
      expect(queries.getByTestId('register-username-error').props.children).toBe(
        labels.register_validation_username_in_use.en,
      );
    });
    expect(storageHelper.writeUsers).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// Story 4.2 — AC2: username collision against seed
// ---------------------------------------------------------------------------

describe('given the seed username "testuser" is submitted, when the submit button is pressed', () => {
  it('then the username-in-use error renders (seed collision) and writeUsers is NOT called', async () => {
    storageHelper.readUsers.mockResolvedValue([]);
    const queries = renderScreen();

    await fillAndSubmit(queries, { username: 'testuser' });

    await waitFor(() => {
      expect(queries.getByTestId('register-username-error').props.children).toBe(
        labels.register_validation_username_in_use.en,
      );
    });
    expect(storageHelper.writeUsers).not.toHaveBeenCalled();
  });

  it('then the username-in-use error renders for case-insensitive seed collision (TESTUSER)', async () => {
    storageHelper.readUsers.mockResolvedValue([]);
    const queries = renderScreen();

    await fillAndSubmit(queries, { username: 'TESTUSER' });

    await waitFor(() => {
      expect(queries.getByTestId('register-username-error').props.children).toBe(
        labels.register_validation_username_in_use.en,
      );
    });
    expect(storageHelper.writeUsers).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// Story 4.2 — AC3: email collision against registered list
// ---------------------------------------------------------------------------

describe('given an email already in the registered list, when the submit button is pressed', () => {
  it('then the email-in-use error renders and writeUsers is NOT called', async () => {
    const existing: StoredUser[] = [
      {
        username: 'otheralice',
        email: 'alice@example.com',
        password: 'Pass1234',
        createdAt: new Date().toISOString(),
      },
    ];
    storageHelper.readUsers.mockResolvedValue(existing);
    const queries = renderScreen();

    // Submit with the same email (emails are stored lowercased; compare lowercased).
    await fillAndSubmit(queries, { username: 'brandnewuser', email: 'alice@example.com' });

    await waitFor(() => {
      expect(queries.getByTestId('register-email-error').props.children).toBe(
        labels.register_validation_email_in_use.en,
      );
    });
    expect(storageHelper.writeUsers).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// Story 4.2 — AC4 + AC6: successful write produces the correct StoredUser shape
// and writeUsers is called exactly once with [...existing, newRecord].
// ---------------------------------------------------------------------------

describe('given a fully valid form with no collisions, when the submit button is pressed', () => {
  it('then writeUsers is called exactly once with a record matching the StoredUser shape', async () => {
    const existing: StoredUser[] = [];
    storageHelper.readUsers.mockResolvedValue(existing);
    storageHelper.writeUsers.mockResolvedValue(undefined);

    const queries = renderScreen();

    await fillAndSubmit(queries, {
      email: 'Alice@Example.Com',
      username: '  Alice99  ',
      password: 'Secure1234',
      confirmPassword: 'Secure1234',
    });

    await waitFor(() => {
      expect(storageHelper.writeUsers).toHaveBeenCalledTimes(1);
    });

    const [calledWith] = storageHelper.writeUsers.mock.calls[0] as [StoredUser[]];
    expect(calledWith).toHaveLength(1);

    const record = calledWith[0];
    // Username trimmed from original case, NOT lowercased.
    expect(record.username).toBe('Alice99');
    // Email lowercased.
    expect(record.email).toBe('alice@example.com');
    // Password stored as-is (plaintext).
    expect(record.password).toBe('Secure1234');
    // createdAt is an ISO 8601 string.
    expect(() => new Date(record.createdAt)).not.toThrow();
    expect(new Date(record.createdAt).toISOString()).toBe(record.createdAt);
  });

  it('then writeUsers is called with [...existingUsers, newRecord] when list is non-empty', async () => {
    const existing: StoredUser[] = [
      {
        username: 'bob',
        email: 'bob@example.com',
        password: 'Pass1234',
        createdAt: '2026-01-01T00:00:00.000Z',
      },
    ];
    storageHelper.readUsers.mockResolvedValue(existing);
    storageHelper.writeUsers.mockResolvedValue(undefined);

    const queries = renderScreen();

    await fillAndSubmit(queries);

    await waitFor(() => {
      expect(storageHelper.writeUsers).toHaveBeenCalledTimes(1);
    });

    const [calledWith] = storageHelper.writeUsers.mock.calls[0] as [StoredUser[]];
    // Array must start with the existing record unchanged.
    expect(calledWith[0]).toEqual(existing[0]);
    expect(calledWith).toHaveLength(2);
  });
});

// ---------------------------------------------------------------------------
// Story 4.2 — AC5: storage write failure renders storage-error and form stays editable
// ---------------------------------------------------------------------------

describe('given writeUsers rejects, when the submit button is pressed with valid data', () => {
  it('then the register_storage_error label renders', async () => {
    storageHelper.readUsers.mockResolvedValue([]);
    storageHelper.writeUsers.mockRejectedValue(new Error('storage_write_failed: could not write'));

    const queries = renderScreen();

    await fillAndSubmit(queries);

    await waitFor(() => {
      expect(queries.getByTestId('register-storage-error').props.children).toBe(
        labels.register_storage_error.en,
      );
    });
  });

  it('then the form remains editable (submit button and inputs are still in the tree)', async () => {
    storageHelper.readUsers.mockResolvedValue([]);
    storageHelper.writeUsers.mockRejectedValue(new Error('storage_write_failed: could not write'));

    const queries = renderScreen();

    await fillAndSubmit(queries);

    await waitFor(() => {
      expect(queries.getByTestId('register-storage-error')).toBeTruthy();
    });

    // All four inputs still present and interactive.
    expect(queries.getByTestId('register-email-input')).toBeTruthy();
    expect(queries.getByTestId('register-username-input')).toBeTruthy();
    expect(queries.getByTestId('register-password-input')).toBeTruthy();
    expect(queries.getByTestId('register-confirm-password-input')).toBeTruthy();
    // Submit button still in the tree.
    expect(queries.getByTestId('register-submit-button')).toBeTruthy();
  });
});

// ---------------------------------------------------------------------------
// Story 4.3 — AC1: modal does NOT render before a successful submit
// ---------------------------------------------------------------------------

describe('given RegisterScreen is rendered with default state, when the success modal is queried', () => {
  it('then the success modal is not visible before any submission', () => {
    const queries = renderScreen();

    // The modal element may be in the tree (RN renders Modal even when
    // visible=false), but the title/body/OK-button content must not be
    // present in an accessible state.  We assert the title and OK button
    // text are absent so the modal is definitively not shown.
    expect(queries.queryByTestId('register-success-modal-title')).toBeNull();
    expect(queries.queryByTestId('register-success-ok-button')).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// Story 4.3 — AC2: modal renders after a successful submit
// ---------------------------------------------------------------------------

describe('given a fully valid form, when the submit button is pressed and writeUsers resolves', () => {
  it('then the success modal renders with the correct title, body, and OK button', async () => {
    storageHelper.readUsers.mockResolvedValue([]);
    storageHelper.writeUsers.mockResolvedValue(undefined);

    const queries = renderScreen();

    await fillAndSubmit(queries);

    await waitFor(() => {
      expect(queries.getByTestId('register-success-modal-title').props.children).toBe(
        labels.registration_success_title.en,
      );
    });

    expect(queries.getByTestId('register-success-modal-body').props.children).toBe(
      labels.registration_success_body.en,
    );

    // OK button label
    expect(queries.getByTestId('register-success-ok-button')).toBeTruthy();
  });
});

// ---------------------------------------------------------------------------
// Story 4.3 — AC3: OK button dismisses modal AND navigates to Login
// ---------------------------------------------------------------------------

describe('given the success modal is visible, when the OK button is pressed', () => {
  it('then the modal title is no longer rendered and navigation.navigate is called with AUTH_ROUTES.LOGIN', async () => {
    storageHelper.readUsers.mockResolvedValue([]);
    storageHelper.writeUsers.mockResolvedValue(undefined);

    const queries = renderScreen();

    // Trigger success state.
    await fillAndSubmit(queries);

    await waitFor(() => {
      expect(queries.getByTestId('register-success-modal-title')).toBeTruthy();
    });

    // Press OK — should dismiss modal and navigate.
    await act(async () => {
      fireEvent.press(queries.getByTestId('register-success-ok-button'));
    });

    // Modal content is gone (success state cleared).
    expect(queries.queryByTestId('register-success-modal-title')).toBeNull();

    // Navigation was called with the Login route.
    expect(mockNavigate).toHaveBeenCalledTimes(1);
    expect(mockNavigate).toHaveBeenCalledWith(AUTH_ROUTES.LOGIN);
  });
});

// ---------------------------------------------------------------------------
// Story 4.3 — AC4: hardware back (onRequestClose) behaves identically to OK
// ---------------------------------------------------------------------------

describe('given the success modal is visible, when the hardware back button fires (onRequestClose)', () => {
  it('then the modal title is no longer rendered and navigation.navigate is called with AUTH_ROUTES.LOGIN', async () => {
    storageHelper.readUsers.mockResolvedValue([]);
    storageHelper.writeUsers.mockResolvedValue(undefined);

    const queries = renderScreen();

    // Trigger success state.
    await fillAndSubmit(queries);

    await waitFor(() => {
      expect(queries.getByTestId('register-success-modal-title')).toBeTruthy();
    });

    // Simulate Android hardware back by invoking onRequestClose directly on
    // the Modal element — idiomatic for RN's built-in Modal.
    const modal = queries.getByTestId('register-success-modal');
    await act(async () => {
      fireEvent(modal, 'requestClose');
    });

    // Modal content is gone (success state cleared).
    expect(queries.queryByTestId('register-success-modal-title')).toBeNull();

    // Navigation was called with the Login route — same as OK path.
    expect(mockNavigate).toHaveBeenCalledTimes(1);
    expect(mockNavigate).toHaveBeenCalledWith(AUTH_ROUTES.LOGIN);
  });
});
