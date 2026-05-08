/**
 * Unit tests for AppNavigator — story 3.5 and 5.2 acceptance criteria.
 *
 * Auth-state control technique: a small `SignInTrigger` component rendered
 * inside `<AuthProvider>` calls `signIn()` from `useAuth()` on press. The
 * test fires the press inside `act()` to flush the state update before
 * asserting the tree. This avoids any modification to AuthContext and matches
 * the pattern used in AuthContext.test.tsx.
 *
 * Story 3.5 covers:
 *   1. When unauthenticated: login-screen is in the tree;
 *      landing-screen-stub is NOT.
 *   2. When authenticated: landing-screen-stub is in the tree;
 *      login-screen is NOT.
 *
 * Story 5.2 (AC3 architecture anchor) covers:
 *   3. Full-harness login: empty AsyncStorage, seed credentials submitted via
 *      the real LoginScreen form → post-auth stack mounts (landing-screen-stub).
 *   4. Full-harness login: registered-precedence — abc/Right1! registered,
 *      login with abc/Test\@123 fails → pre-auth stack remains.
 *
 * This file uses real \@react-navigation/native (no useNavigation mock) so the
 * NavigationContainer can function normally, enabling end-to-end auth-gate
 * verification via the login form.
 *
 * Note (story 5.1): LoginScreen testID renamed from `login-screen-stub` to
 * `login-screen`. All assertions updated accordingly.
 */

import React from 'react';
import { act, fireEvent, render, waitFor } from '@testing-library/react-native';
import { Text, TouchableOpacity } from 'react-native';
import { AuthProvider, useAuth } from '@/auth/AuthContext';
import AppNavigator from '@/navigation/AppNavigator';
import { ThemeProvider } from '@/theme/ThemeProvider';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ---------------------------------------------------------------------------
// Test harness
// ---------------------------------------------------------------------------

/**
 * A minimal component that exposes a pressable button to call signIn() inside
 * the current AuthProvider so tests can transition from unauthenticated to
 * authenticated without touching AuthContext internals.
 */
function SignInTrigger(): React.JSX.Element {
  const { signIn } = useAuth();
  return (
    <TouchableOpacity testID="sign-in-trigger" onPress={signIn}>
      <Text>Sign In</Text>
    </TouchableOpacity>
  );
}

/**
 * Renders `<ThemeProvider><AuthProvider><AppNavigator /></AuthProvider></ThemeProvider>`
 * with an additional `<SignInTrigger>` sibling placed outside AppNavigator but
 * inside the same AuthProvider, so tests can mutate auth state.
 *
 * ThemeProvider is required because RegisterScreen (part of the pre-auth stack)
 * calls useTheme(). SignInTrigger is a sibling of AppNavigator, not a child,
 * because AppNavigator renders a NavigationContainer and we must not nest
 * NavigationContainers.
 */
function TestRoot(): React.JSX.Element {
  return (
    <ThemeProvider>
      <AuthProvider>
        <SignInTrigger />
        <AppNavigator />
      </AuthProvider>
    </ThemeProvider>
  );
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('given AppNavigator is mounted with an unauthenticated AuthProvider, when the tree first renders', () => {
  it('then login-screen is in the tree and landing-screen-stub is NOT', () => {
    const { getByTestId, queryByTestId } = render(<TestRoot />);

    expect(getByTestId('login-screen')).toBeTruthy();
    expect(queryByTestId('landing-screen-stub')).toBeNull();
  });
});

describe('given AppNavigator is mounted and signIn is called, when the auth state transitions to authenticated', () => {
  it('then landing-screen-stub is in the tree and login-screen is NOT', () => {
    const { getByTestId, queryByTestId } = render(<TestRoot />);

    act(() => {
      fireEvent.press(getByTestId('sign-in-trigger'));
    });

    expect(getByTestId('landing-screen-stub')).toBeTruthy();
    expect(queryByTestId('login-screen')).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// Story 5.2 — AC3 architecture anchor: login via the real form triggers stack swap
//
// These tests submit the LoginScreen form with real credentialHelper backed by
// the global AsyncStorage mock (jest.setup.ts). They verify that a successful
// credential lookup → signIn() → AppNavigator stack swap chain works end-to-end.
// ---------------------------------------------------------------------------

describe('given the full AppNavigator harness with empty AsyncStorage, when the login form is submitted with seed credentials', () => {
  it('then the post-auth stack mounts (landing-screen-stub is in the tree) — architecture anchor', async () => {
    // Clear AsyncStorage so the registered list is empty; seed is the only credential.
    await AsyncStorage.clear();

    const queries = render(<TestRoot />);

    // Pre-auth stack is visible before login.
    expect(queries.getByTestId('login-screen')).toBeTruthy();
    expect(queries.queryByTestId('landing-screen-stub')).toBeNull();

    // Fill and submit the login form with seed credentials.
    fireEvent.changeText(queries.getByTestId('login-username-input'), 'testuser');
    fireEvent.changeText(queries.getByTestId('login-password-input'), 'Test@123');
    await act(async () => {
      fireEvent.press(queries.getByTestId('login-submit-button'));
    });

    // After successful login signIn() is called; AppNavigator swaps to post-auth stack.
    await waitFor(() => {
      expect(queries.getByTestId('landing-screen-stub')).toBeTruthy();
    });

    // Pre-auth stack is fully unmounted.
    expect(queries.queryByTestId('login-screen')).toBeNull();
  });
});

describe('given the full AppNavigator harness with registered user abc/Right1!, when login is submitted with abc/Test@123', () => {
  it('then the pre-auth stack remains — registered user takes precedence over seed (password mismatch)', async () => {
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

    const queries = render(<TestRoot />);

    // Submit with abc/Test@123 — registered user found (username=abc) but
    // password Test@123 != Right1!, so lookupCredential returns { ok: false }.
    fireEvent.changeText(queries.getByTestId('login-username-input'), 'abc');
    fireEvent.changeText(queries.getByTestId('login-password-input'), 'Test@123');
    await act(async () => {
      fireEvent.press(queries.getByTestId('login-submit-button'));
    });

    // Give async handler time to resolve; pre-auth stack must still be visible.
    await waitFor(() => {
      expect(queries.getByTestId('login-screen')).toBeTruthy();
    });

    // Post-auth stack was never mounted.
    expect(queries.queryByTestId('landing-screen-stub')).toBeNull();
  });
});
