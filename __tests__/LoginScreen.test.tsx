/**
 * Component tests for LoginScreen — story 5.1, 5.2, and 5.3 acceptance criteria.
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
 * Story 5.3 covers:
 *  11. Credential error renders with login-inline-error testID and
 *      login_invalid_credentials.en text after unknown-username failure.
 *  12. Credential error renders the same text after wrong-password failure
 *      (genericness assertion).
 *  13. Credential error is positioned below the submit button (tree-order).
 *  14. Credential error color matches lightColors.status.error (via StyleSheet.flatten).
 *  15. Auto-clear: changing username field clears the credential error.
 *  16. Auto-clear: changing password field clears the credential error.
 *  17. On successful login, login-inline-error is absent from the tree.
 *  18. Storage error renders with login-storage-error testID and
 *      login_storage_error.en text; login-inline-error is absent; signIn NOT called.
 *  19. Independence: credential failure does NOT render login-storage-error.
 *  20. Independence: storage rejection does NOT render login-inline-error.
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
import { StyleSheet } from 'react-native';
import { act, fireEvent, render, waitFor } from '@testing-library/react-native';
import { ThemeProvider } from '@/theme/ThemeProvider';
import { AuthProvider } from '@/auth/AuthContext';
import LoginScreen from '@/screens/LoginScreen';
import labels from '@/labels/labels.json';
import { AUTH_ROUTES } from '@/navigation/AuthRoutes';
import { lightColors } from '@/theme/theme';
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

// ===========================================================================
// Story 5.3 — inline credential error, storage error, auto-clear, independence
// ===========================================================================

// ---------------------------------------------------------------------------
// AC1 (unknown username) + AC3 (genericness, part 1)
//
// After a failed login with an unknown username, login-inline-error renders
// with the login_invalid_credentials.en copy.
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

  it('then login-inline-error renders with login_invalid_credentials.en text', async () => {
    const queries = renderScreen();

    await submitLogin(queries, 'nosuchuser', 'Test@123');

    await waitFor(() => {
      const errorEl = queries.getByTestId('login-inline-error');
      expect(errorEl.props.children).toBe(labels.login_invalid_credentials.en);
    });
  });
});

// ---------------------------------------------------------------------------
// AC3 (genericness, part 2) — same text for wrong-password failure
// ---------------------------------------------------------------------------

describe('given empty AsyncStorage, when login is submitted with the seed username but wrong password', () => {
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

  it('then login-inline-error renders with the same login_invalid_credentials.en text (generic error)', async () => {
    const queries = renderScreen();

    await submitLogin(queries, 'testuser', 'WrongPassword1');

    await waitFor(() => {
      const errorEl = queries.getByTestId('login-inline-error');
      // Identical text to the unknown-username case — genericness confirmed.
      expect(errorEl.props.children).toBe(labels.login_invalid_credentials.en);
    });
  });
});

// ---------------------------------------------------------------------------
// AC1 — position: login-inline-error is below the submit button
//
// Tree-order assertion: the submit button's testID appears before the error
// testID in the rendered element array returned by getAllByTestId.
// We use UNSAFE_getAllByType(Text) but filter by testID. The more robust
// approach is: after submit, queryAllByTestId returns [button, inline-error]
// in DOM order — but RNTL's queryAllByTestId returns all matches across the
// tree, not in a guaranteed layout order. Instead we check that getByTestId
// for the button does not throw (it exists), and that the error element's
// parent chain is inside the ScrollView that is also the button's parent — i.e.,
// both live in the same container and the error has no layout ancestor that
// would place it above the button.
//
// Practical assertion: render tree is deterministic; we verify by querying the
// button first (must exist), then querying the error (must also exist), and
// that the component renders the button JSX before the error JSX in its return.
// We assert this via UNSAFE_getAllByProps matching testIDs in order.
// ---------------------------------------------------------------------------

describe('given a failed login, when the tree order is checked', () => {
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

  it('then login-inline-error appears after login-submit-button in the rendered tree', async () => {
    const queries = renderScreen();

    // Before submit: button is present, error is absent.
    expect(queries.getByTestId('login-submit-button')).toBeTruthy();
    expect(queries.queryByTestId('login-inline-error')).toBeNull();

    // Submit with unknown user to trigger error.
    await submitLogin(queries, 'nosuchuser', 'Test@123');

    await waitFor(() => {
      expect(queries.getByTestId('login-submit-button')).toBeTruthy();
      expect(queries.getByTestId('login-inline-error')).toBeTruthy();
    });

    // Position assertion using toJSON tree-walk.
    //
    // We traverse the JSON representation of the rendered tree and record the
    // encounter order of nodes by testID. Because toJSON() produces a depth-first
    // pre-order traversal, a node that appears earlier in the source JSX will
    // have a lower index in this traversal.
    //
    // Expected order: login-submit-button → login-inline-error → login-register-link
    type JsonNode = {
      type: string;
      props: Record<string, unknown>;
      children: JsonNode[] | null;
    };

    function collectTestIDs(node: JsonNode, result: string[]): void {
      if (node.props.testID && typeof node.props.testID === 'string') {
        result.push(node.props.testID);
      }
      if (node.children) {
        for (const child of node.children) {
          if (child && typeof child === 'object' && 'props' in child) {
            collectTestIDs(child, result);
          }
        }
      }
    }

    const jsonTree = queries.toJSON() as JsonNode;
    const encounterOrder: string[] = [];
    collectTestIDs(jsonTree, encounterOrder);

    const buttonIdx = encounterOrder.indexOf('login-submit-button');
    const errorIdx = encounterOrder.indexOf('login-inline-error');
    const linkIdx = encounterOrder.indexOf('login-register-link');

    // All three must be present.
    expect(buttonIdx).toBeGreaterThanOrEqual(0);
    expect(errorIdx).toBeGreaterThanOrEqual(0);
    expect(linkIdx).toBeGreaterThanOrEqual(0);

    // Order: button < inline-error < register-link
    expect(buttonIdx).toBeLessThan(errorIdx);
    expect(errorIdx).toBeLessThan(linkIdx);
  });
});

// ---------------------------------------------------------------------------
// AC2 — color: login-inline-error color matches theme.colors.status.error
//
// StyleSheet.flatten resolves the style IDs used in the component back to
// plain style objects so we can assert the color value directly.
// We compare against lightColors.status.error — ThemeProvider defaults to
// light mode, so the rendered component uses lightColors.
// ---------------------------------------------------------------------------

describe('given a failed login, when the inline error color is inspected', () => {
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

  it('then the login-inline-error color equals lightColors.status.error', async () => {
    const queries = renderScreen();

    await submitLogin(queries, 'nosuchuser', 'Test@123');

    await waitFor(async () => {
      const errorEl = queries.getByTestId('login-inline-error');
      const flatStyle = StyleSheet.flatten(errorEl.props.style);
      expect(flatStyle.color).toBe(lightColors.status.error);
    });
  });
});

// ---------------------------------------------------------------------------
// AC4 — auto-clear on username change
// ---------------------------------------------------------------------------

describe('given the credential error is visible, when the username field changes', () => {
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

  it('then the login-inline-error is removed from the tree', async () => {
    const queries = renderScreen();

    // Trigger credential error.
    await submitLogin(queries, 'nosuchuser', 'Test@123');

    await waitFor(() => {
      expect(queries.getByTestId('login-inline-error')).toBeTruthy();
    });

    // Change the username field — error must disappear.
    fireEvent.changeText(queries.getByTestId('login-username-input'), 'newusername');

    await waitFor(() => {
      expect(queries.queryByTestId('login-inline-error')).toBeNull();
    });
  });
});

// ---------------------------------------------------------------------------
// AC4 — auto-clear on password change
// ---------------------------------------------------------------------------

describe('given the credential error is visible, when the password field changes', () => {
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

  it('then the login-inline-error is removed from the tree', async () => {
    const queries = renderScreen();

    // Trigger credential error.
    await submitLogin(queries, 'nosuchuser', 'Test@123');

    await waitFor(() => {
      expect(queries.getByTestId('login-inline-error')).toBeTruthy();
    });

    // Change the password field — error must disappear.
    fireEvent.changeText(queries.getByTestId('login-password-input'), 'NewPassword1');

    await waitFor(() => {
      expect(queries.queryByTestId('login-inline-error')).toBeNull();
    });
  });
});

// ---------------------------------------------------------------------------
// AC5 — on success, login-inline-error is absent
// ---------------------------------------------------------------------------

describe('given empty AsyncStorage, when login succeeds with seed credentials', () => {
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

  it('then login-inline-error is absent (queryByTestId returns null)', async () => {
    const queries = renderScreen();

    await submitLogin(queries, 'testuser', 'Test@123');

    await waitFor(() => {
      expect(mockSignIn).toHaveBeenCalledTimes(1);
      expect(queries.queryByTestId('login-inline-error')).toBeNull();
    });
  });
});

// ---------------------------------------------------------------------------
// AC6 — storage error: login-storage-error renders; login-inline-error absent;
// signIn NOT called.
// ---------------------------------------------------------------------------

describe('given lookupCredential rejects, when the submit button is pressed', () => {
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
      .mockRejectedValueOnce(new Error('storage_read_failed: mock'));
  });

  afterEach(() => {
    useAuthSpy.mockRestore();
    lookupSpy.mockRestore();
  });

  it('then login-storage-error renders with login_storage_error.en text', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    const queries = renderScreen();

    await submitLogin(queries, 'testuser', 'Test@123');

    await waitFor(() => {
      const storageEl = queries.getByTestId('login-storage-error');
      expect(storageEl.props.children).toBe(labels.login_storage_error.en);
    });

    consoleSpy.mockRestore();
  });

  it('then login-inline-error is absent when only a storage rejection occurred', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    const queries = renderScreen();

    await submitLogin(queries, 'testuser', 'Test@123');

    await waitFor(() => {
      expect(queries.getByTestId('login-storage-error')).toBeTruthy();
      expect(queries.queryByTestId('login-inline-error')).toBeNull();
    });

    consoleSpy.mockRestore();
  });

  it('then signIn is NOT called on a storage rejection', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    const queries = renderScreen();

    await submitLogin(queries, 'testuser', 'Test@123');

    await waitFor(() => {
      expect(mockSignIn).not.toHaveBeenCalled();
    });

    consoleSpy.mockRestore();
  });
});

// ---------------------------------------------------------------------------
// Independence: credential failure does NOT render login-storage-error
// ---------------------------------------------------------------------------

describe('given empty AsyncStorage, when login fails with a credential error', () => {
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

  it('then login-storage-error is absent (credential error does not trigger storage error)', async () => {
    const queries = renderScreen();

    await submitLogin(queries, 'nosuchuser', 'Test@123');

    await waitFor(() => {
      expect(queries.getByTestId('login-inline-error')).toBeTruthy();
      expect(queries.queryByTestId('login-storage-error')).toBeNull();
    });
  });
});
