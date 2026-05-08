/**
 * Auth-gate render-tree tests — story 3.7 acceptance criteria.
 *
 * These tests constitute the formal architecture guarantee that the auth gate
 * performs a complete unmount/remount of the navigator stack — not a hide or
 * display-none — when auth state changes.
 *
 * Test technique: render-tree assertions only (queryByTestId / getByTestId).
 * No navigation.navigate() calls; no routing assertions across the gate.
 * This matches the "Auth-gate test technique" described in architecture.md.
 *
 * Auth-state control technique: a `SignInTrigger` component inside the same
 * `<AuthProvider>` calls `signIn()` from `useAuth()` on press. The press is
 * fired inside `act()` to flush the state update before asserting the tree.
 *
 * Covers:
 *   1. Unauthenticated initial render → landing-screen-stub is NOT in the tree;
 *      login-screen-stub IS in the tree.
 *   2. After signIn() → landing-screen-stub IS in the tree;
 *      login-screen-stub is NOT.
 *   3. Toggle within the same render (signIn called post-mount) → pre-auth stack
 *      is unmounted and post-auth stack is mounted, verified by re-asserting
 *      testIDs after the state transition.
 */

import React from 'react';
import { act, fireEvent, render } from '@testing-library/react-native';
import { Text, TouchableOpacity } from 'react-native';
import { AuthProvider, useAuth } from '@/auth/AuthContext';
import AppNavigator from '@/navigation/AppNavigator';

// ---------------------------------------------------------------------------
// Test harness
// ---------------------------------------------------------------------------

/**
 * Pressable trigger component that calls signIn() from the enclosing
 * AuthProvider. Placed as a sibling of AppNavigator (not a child) to avoid
 * nesting NavigationContainers.
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
 * Full render tree used by all three auth-gate tests:
 *   `<AuthProvider> → <SignInTrigger /> + <AppNavigator /></AuthProvider>`
 *
 * Initial auth state is always `isAuthenticated: false` (AuthContext default).
 */
function AuthGateRoot(): React.JSX.Element {
  return (
    <AuthProvider>
      <SignInTrigger />
      <AppNavigator />
    </AuthProvider>
  );
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('given <AuthProvider><AppNavigator /> is mounted with default (unauthenticated) auth state, when the tree first renders', () => {
  it('then landing-screen-stub is NOT in the tree and login-screen-stub IS in the tree', () => {
    const { queryByTestId, getByTestId } = render(<AuthGateRoot />);

    // AC1: queryByTestId returns null when the element is not mounted.
    expect(queryByTestId('landing-screen-stub')).toBeNull();
    // Login stub must be present — the pre-auth stack is the active navigator.
    expect(getByTestId('login-screen-stub')).toBeTruthy();
  });
});

describe('given <AuthProvider><AppNavigator /> is mounted with default (unauthenticated) auth state and signIn is called, when auth state transitions to authenticated', () => {
  it('then landing-screen-stub IS in the tree and login-screen-stub is NOT', () => {
    const { queryByTestId, getByTestId } = render(<AuthGateRoot />);

    act(() => {
      fireEvent.press(getByTestId('sign-in-trigger'));
    });

    // AC2: post-auth stack (AppRoutes) is mounted; pre-auth stack is unmounted.
    expect(getByTestId('landing-screen-stub')).toBeTruthy();
    expect(queryByTestId('login-screen-stub')).toBeNull();
  });
});

describe('given <AuthProvider><AppNavigator /> mounted once with unauthenticated state, when signIn is called within the same render', () => {
  it('then the pre-auth stack is unmounted and the post-auth stack is mounted — verified by re-asserting testIDs after the state transition', () => {
    const { queryByTestId, getByTestId } = render(<AuthGateRoot />);

    // --- Pre-transition: assert pre-auth tree (unauthenticated) ---
    expect(queryByTestId('landing-screen-stub')).toBeNull();
    expect(getByTestId('login-screen-stub')).toBeTruthy();

    // --- Trigger transition within the same render call ---
    act(() => {
      fireEvent.press(getByTestId('sign-in-trigger'));
    });

    // --- Post-transition: assert post-auth tree (authenticated) ---
    // AC3: The unmount/remount of the stacks happened inside the same render();
    // this verifies the "inactive stack is fully unmounted" architecture guarantee.
    expect(getByTestId('landing-screen-stub')).toBeTruthy();
    expect(queryByTestId('login-screen-stub')).toBeNull();
  });
});
