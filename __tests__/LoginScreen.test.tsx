/**
 * Component tests for LoginScreen — story 5.1 and 5.2 acceptance criteria.
 *
 * Story 5.1 covers:
 *   1. Render with default state — screen root, title, both fields, login
 *      button, and Register link are all present in the tree.
 *   2. Register link `onPress` calls `navigation.navigate(AUTH_ROUTES.REGISTER)`.
 *
 * Story 5.2 covers:
 *   3. Architecture anchor (full harness): login with seed credentials on
 *      empty AsyncStorage → post-auth stack mounts. This test lives in
 *      AppNavigator.test.tsx because the useNavigation module-level mock in
 *      this file conflicts with NavigationContainer's internal addListener
 *      calls. AppNavigator.test.tsx uses real navigation and is the canonical
 *      location for stack-swap integration tests.
 *   4. Success against a registered user (signIn called).
 *   5. Failure against unknown username (signIn NOT called).
 *   6. Failure against wrong password (signIn NOT called).
 *   7. Case-insensitive + whitespace-tolerant match (signIn called).
 *   8. Whitespace-trimmed match (signIn called).
 *   9. Registered-precedence-over-seed: abc/Right1! registered;
 *      login with abc/Test\@123 fails (signIn NOT called).
 *  10. Storage rejection: lookupCredential rejects; signIn NOT called; no crash.
 *
 * ThemeProvider + AuthProvider are always provided. useNavigation is mocked
 * globally so navigation.navigate can be asserted without a NavigationContainer.
 * For tests that need to spy on signIn, useAuth is overridden per-test via
 * jest.spyOn on the AuthContext module.
 * credentialHelper is kept as real via jest.requireActual; individual tests
 * spy on lookupCredential only when they need controlled rejection scenarios.
 * The real lookupCredential reads from the global AsyncStorage mock (jest.setup.ts).
 */

import React from 'react';
import { act, fireEvent, render, waitFor } from '@testing-library/react-native';
import { ThemeProvider } from '@/theme/ThemeProvider';
import { AuthProvider } from '@/auth/AuthContext';
import LoginScreen from '@/screens/LoginScreen';
import labels from '@/labels/labels.json';
import { AUTH_ROUTES } from '@/navigation/AuthRoutes';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as credentialHelper from '@/Helper/credentialHelper';
import * as AuthContextModule from '@/auth/AuthContext';

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
// credentialHelper — real implementation backed by AsyncStorage mock.
// Individual tests spy on lookupCredential when they need rejection control.
// ---------------------------------------------------------------------------

jest.mock('@/Helper/credentialHelper', () => jest.requireActual('@/Helper/credentialHelper'));

// ---------------------------------------------------------------------------
// Test helpers
// ---------------------------------------------------------------------------

/**
 * Renders LoginScreen wrapped in ThemeProvider + AuthProvider.
 *
 * AuthProvider is required because LoginScreen calls useAuth().
 * Tests that need to spy on signIn call
 * jest.spyOn(AuthContextModule, 'useAuth') BEFORE calling renderScreen().
 */
function renderScreen() {
  return render(
    <ThemeProvider>
      <AuthProvider>
        <LoginScreen />
      </AuthProvider>
    </ThemeProvider>,
  );
}

/** Reset mocks between tests so state does not leak. */
beforeEach(() => {
  jest.clearAllMocks();
  mockNavigate.mockClear();
});

// ---------------------------------------------------------------------------
// Helpers for story 5.2 submit interactions
// ---------------------------------------------------------------------------

/**
 * Types into username + password fields and presses the submit button.
 *
 * @param queries - RNTL render result.
 * @param u - Username to type.
 * @param p - Password to type.
 */
async function submitLogin(
  queries: ReturnType<typeof render>,
  u: string,
  p: string,
): Promise<void> {
  fireEvent.changeText(queries.getByTestId('login-username-input'), u);
  fireEvent.changeText(queries.getByTestId('login-password-input'), p);
  await act(async () => {
    fireEvent.press(queries.getByTestId('login-submit-button'));
  });
}

// ===========================================================================
// Story 5.1 — AC: render with default state
// ===========================================================================

describe('given LoginScreen is rendered with default state, when the tree is queried', () => {
  it('then the login-screen testID is in the tree', () => {
    const { getByTestId } = renderScreen();
    expect(getByTestId('login-screen')).toBeTruthy();
  });

  it('then the login_screen_title label text is rendered', () => {
    const { getByTestId } = renderScreen();
    expect(getByTestId('login-screen-title').props.children).toBe(labels.login_screen_title.en);
  });

  it('then the username label is rendered', () => {
    const { getByText } = renderScreen();
    expect(getByText(labels.login_username_label.en)).toBeTruthy();
  });

  it('then the username TextInput is in the tree with the correct placeholder', () => {
    const { getByTestId } = renderScreen();
    const input = getByTestId('login-username-input');
    expect(input).toBeTruthy();
    expect(input.props.placeholder).toBe(labels.login_username_placeholder.en);
  });

  it('then the password label is rendered', () => {
    const { getByText } = renderScreen();
    expect(getByText(labels.login_password_label.en)).toBeTruthy();
  });

  it('then the password TextInput is in the tree with secureTextEntry and correct placeholder', () => {
    const { getByTestId } = renderScreen();
    const input = getByTestId('login-password-input');
    expect(input).toBeTruthy();
    expect(input.props.secureTextEntry).toBe(true);
    expect(input.props.placeholder).toBe(labels.login_password_placeholder.en);
  });

  it('then the login button is rendered with the login_button label', () => {
    const { getByTestId, getAllByText } = renderScreen();
    expect(getByTestId('login-submit-button')).toBeTruthy();
    // login_button.en ("Sign In") matches the screen title as well; use
    // getAllByText and assert at least one element carries the label copy.
    expect(getAllByText(labels.login_button.en).length).toBeGreaterThan(0);
  });

  it('then the Register link is rendered with the login_link_to_register label', () => {
    const { getByTestId, getByText } = renderScreen();
    expect(getByTestId('login-register-link')).toBeTruthy();
    expect(getByText(labels.login_link_to_register.en)).toBeTruthy();
  });
});

// ---------------------------------------------------------------------------
// Story 5.1 — AC: Register link navigates to the Register screen
// ---------------------------------------------------------------------------

describe('given LoginScreen is rendered, when the Register link is pressed', () => {
  it('then navigation.navigate is called with AUTH_ROUTES.REGISTER', () => {
    const { getByTestId } = renderScreen();

    fireEvent.press(getByTestId('login-register-link'));

    expect(mockNavigate).toHaveBeenCalledTimes(1);
    expect(mockNavigate).toHaveBeenCalledWith(AUTH_ROUTES.REGISTER);
  });
});

// ===========================================================================
// Story 5.2 — submit handler wired, credential lookup, auth-state transition
// ===========================================================================

// ---------------------------------------------------------------------------
// AC: success against a registered user
//
// Pre-populate AsyncStorage with alice/AlicePass1. Login with alice/AlicePass1.
// The real credentialHelper reads the real AsyncStorage mock. signIn is spied
// via jest.spyOn on the AuthContext module.
// ---------------------------------------------------------------------------

describe('given AsyncStorage has a registered user alice/AlicePass1, when login is submitted with alice/AlicePass1', () => {
  let mockSignIn: jest.Mock;
  let useAuthSpy: jest.SpyInstance;

  beforeEach(async () => {
    const STORAGE_KEY = '@test-project-new/registered-users';
    await AsyncStorage.clear();
    await AsyncStorage.setItem(
      STORAGE_KEY,
      JSON.stringify([
        {
          username: 'alice',
          email: 'alice@example.com',
          password: 'AlicePass1',
          createdAt: new Date().toISOString(),
        },
      ]),
    );
    mockSignIn = jest.fn();
    useAuthSpy = jest.spyOn(AuthContextModule, 'useAuth').mockReturnValue({
      isAuthenticated: false,
      signIn: mockSignIn,
      signOut: jest.fn(),
    });
  });

  afterEach(() => {
    useAuthSpy.mockRestore();
  });

  it('then signIn is called (success against a registered user)', async () => {
    const queries = renderScreen();

    await submitLogin(queries, 'alice', 'AlicePass1');

    await waitFor(() => {
      expect(mockSignIn).toHaveBeenCalledTimes(1);
    });
  });
});

// ---------------------------------------------------------------------------
// AC: failure against unknown username (signIn NOT called)
// ---------------------------------------------------------------------------

describe('given empty AsyncStorage, when login is submitted with an unknown username', () => {
  let mockSignIn: jest.Mock;
  let useAuthSpy: jest.SpyInstance;

  beforeEach(async () => {
    await AsyncStorage.clear();
    mockSignIn = jest.fn();
    useAuthSpy = jest.spyOn(AuthContextModule, 'useAuth').mockReturnValue({
      isAuthenticated: false,
      signIn: mockSignIn,
      signOut: jest.fn(),
    });
  });

  afterEach(() => {
    useAuthSpy.mockRestore();
  });

  it('then signIn is NOT called (unknown username resolves to failure)', async () => {
    const queries = renderScreen();

    await submitLogin(queries, 'unknownuser', 'Test@123');

    // Allow the async handler to resolve before asserting.
    await waitFor(() => {
      expect(mockSignIn).not.toHaveBeenCalled();
    });
  });
});

// ---------------------------------------------------------------------------
// AC: failure against wrong password (signIn NOT called)
// ---------------------------------------------------------------------------

describe('given empty AsyncStorage, when login is submitted with seed username but wrong password', () => {
  let mockSignIn: jest.Mock;
  let useAuthSpy: jest.SpyInstance;

  beforeEach(async () => {
    await AsyncStorage.clear();
    mockSignIn = jest.fn();
    useAuthSpy = jest.spyOn(AuthContextModule, 'useAuth').mockReturnValue({
      isAuthenticated: false,
      signIn: mockSignIn,
      signOut: jest.fn(),
    });
  });

  afterEach(() => {
    useAuthSpy.mockRestore();
  });

  it('then signIn is NOT called (correct username, wrong password)', async () => {
    const queries = renderScreen();

    await submitLogin(queries, 'testuser', 'WrongPassword1');

    await waitFor(() => {
      expect(mockSignIn).not.toHaveBeenCalled();
    });
  });
});

// ---------------------------------------------------------------------------
// AC: case-insensitive + whitespace-tolerant match
//
// "  TestUser  " trimmed to "testuser" (lowercased) matches the seed username.
// The real credentialHelper normalises the username before comparison.
// ---------------------------------------------------------------------------

describe('given empty AsyncStorage, when login is submitted with "  TestUser  " (padded, mixed case)', () => {
  let mockSignIn: jest.Mock;
  let useAuthSpy: jest.SpyInstance;

  beforeEach(async () => {
    await AsyncStorage.clear();
    mockSignIn = jest.fn();
    useAuthSpy = jest.spyOn(AuthContextModule, 'useAuth').mockReturnValue({
      isAuthenticated: false,
      signIn: mockSignIn,
      signOut: jest.fn(),
    });
  });

  afterEach(() => {
    useAuthSpy.mockRestore();
  });

  it('then signIn is called (case-insensitive match succeeds)', async () => {
    const queries = renderScreen();

    await submitLogin(queries, '  TestUser  ', 'Test@123');

    await waitFor(() => {
      expect(mockSignIn).toHaveBeenCalledTimes(1);
    });
  });
});

// ---------------------------------------------------------------------------
// AC: whitespace-trimmed match (separate test as per dispatch)
// ---------------------------------------------------------------------------

describe('given empty AsyncStorage, when login is submitted with "  testuser  " (leading/trailing spaces)', () => {
  let mockSignIn: jest.Mock;
  let useAuthSpy: jest.SpyInstance;

  beforeEach(async () => {
    await AsyncStorage.clear();
    mockSignIn = jest.fn();
    useAuthSpy = jest.spyOn(AuthContextModule, 'useAuth').mockReturnValue({
      isAuthenticated: false,
      signIn: mockSignIn,
      signOut: jest.fn(),
    });
  });

  afterEach(() => {
    useAuthSpy.mockRestore();
  });

  it('then signIn is called (whitespace-trimmed match succeeds)', async () => {
    const queries = renderScreen();

    await submitLogin(queries, '  testuser  ', 'Test@123');

    await waitFor(() => {
      expect(mockSignIn).toHaveBeenCalledTimes(1);
    });
  });
});

// ---------------------------------------------------------------------------
// AC: registered-precedence-over-seed
//
// Registered user abc/Right1! exists. Login with abc/Test@123. The registered
// user's username matches ('abc'), so the seed is NOT consulted. Since
// 'Test@123' != 'Right1!' the login fails. signIn MUST NOT be called.
// ---------------------------------------------------------------------------

describe('given AsyncStorage has a registered user abc/Right1!, when login is submitted with abc/Test@123', () => {
  let mockSignIn: jest.Mock;
  let useAuthSpy: jest.SpyInstance;

  beforeEach(async () => {
    const STORAGE_KEY = '@test-project-new/registered-users';
    await AsyncStorage.clear();
    await AsyncStorage.setItem(
      STORAGE_KEY,
      JSON.stringify([
        {
          username: 'abc',
          email: 'abc@example.com',
          password: 'Right1!',
          createdAt: new Date().toISOString(),
        },
      ]),
    );
    mockSignIn = jest.fn();
    useAuthSpy = jest.spyOn(AuthContextModule, 'useAuth').mockReturnValue({
      isAuthenticated: false,
      signIn: mockSignIn,
      signOut: jest.fn(),
    });
  });

  afterEach(() => {
    useAuthSpy.mockRestore();
  });

  it('then signIn is NOT called (registered user takes precedence over seed; password mismatch)', async () => {
    const queries = renderScreen();

    await submitLogin(queries, 'abc', 'Test@123');

    await waitFor(() => {
      expect(mockSignIn).not.toHaveBeenCalled();
    });
  });
});

// ---------------------------------------------------------------------------
// AC: storage rejection — lookupCredential rejects; signIn NOT called; no crash
// ---------------------------------------------------------------------------

describe('given lookupCredential rejects with a storage error, when the submit button is pressed', () => {
  let mockSignIn: jest.Mock;
  let useAuthSpy: jest.SpyInstance;
  let lookupSpy: jest.SpyInstance;

  beforeEach(() => {
    mockSignIn = jest.fn();
    useAuthSpy = jest.spyOn(AuthContextModule, 'useAuth').mockReturnValue({
      isAuthenticated: false,
      signIn: mockSignIn,
      signOut: jest.fn(),
    });
    lookupSpy = jest
      .spyOn(credentialHelper, 'lookupCredential')
      .mockRejectedValueOnce(new Error('storage_read_failed: mock storage failure'));
  });

  afterEach(() => {
    useAuthSpy.mockRestore();
    lookupSpy.mockRestore();
  });

  it('then signIn is NOT called and no unhandled promise rejection escapes', async () => {
    // Suppress any console.error output during this test to confirm the catch
    // block swallows the error cleanly (sets storageErrorVisible, does not rethrow).
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    const queries = renderScreen();

    await submitLogin(queries, 'testuser', 'Test@123');

    await waitFor(() => {
      expect(mockSignIn).not.toHaveBeenCalled();
    });

    // No storage_read_failed message should have leaked to console.error.
    const rejectionLeaks = consoleSpy.mock.calls.filter((args) =>
      String(args[0]).includes('storage_read_failed'),
    );
    expect(rejectionLeaks).toHaveLength(0);

    consoleSpy.mockRestore();
  });
});
