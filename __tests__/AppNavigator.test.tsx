/**
 * Unit tests for AppNavigator — story 3.5 acceptance criteria.
 *
 * Auth-state control technique: a small `SignInTrigger` component rendered
 * inside `<AuthProvider>` calls `signIn()` from `useAuth()` on press. The
 * test fires the press inside `act()` to flush the state update before
 * asserting the tree. This avoids any modification to AuthContext and matches
 * the pattern used in AuthContext.test.tsx.
 *
 * Covers:
 *   1. When unauthenticated: login-screen is in the tree;
 *      landing-screen-stub is NOT.
 *   2. When authenticated: landing-screen-stub is in the tree;
 *      login-screen is NOT.
 *
 * Note (story 5.1): LoginScreen testID renamed from `login-screen-stub` to
 * `login-screen`. All assertions updated accordingly.
 */

import React from 'react';
import { act, fireEvent, render } from '@testing-library/react-native';
import { Text, TouchableOpacity } from 'react-native';
import { AuthProvider, useAuth } from '@/auth/AuthContext';
import AppNavigator from '@/navigation/AppNavigator';
import { ThemeProvider } from '@/theme/ThemeProvider';

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
