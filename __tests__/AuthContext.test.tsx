/**
 * Unit tests for AuthContext — story 3.2 acceptance criteria.
 *
 * Covers:
 *   1. Initial state is unauthenticated.
 *   2. signIn() transitions to authenticated.
 *   3. signOut() transitions back to unauthenticated.
 *   4. useAuth() called outside <AuthProvider> throws the exact pinned error
 *      string ('useAuth must be used within an AuthProvider').
 */

import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { Text, TouchableOpacity, View } from 'react-native';
import { AuthProvider, useAuth } from '@/auth/AuthContext';

// ---------------------------------------------------------------------------
// Test harness component
// ---------------------------------------------------------------------------

/**
 * A minimal component that calls useAuth() and exposes the state and actions
 * via testID-tagged views and pressable buttons so the tests can assert
 * rendered state and trigger actions without importing the hook directly.
 */
function AuthHarness(): React.JSX.Element {
  const { isAuthenticated, signIn, signOut } = useAuth();

  return (
    <View>
      <Text testID="auth-status">{isAuthenticated ? 'authenticated' : 'unauthenticated'}</Text>
      <TouchableOpacity testID="sign-in-button" onPress={signIn}>
        <Text>Sign In</Text>
      </TouchableOpacity>
      <TouchableOpacity testID="sign-out-button" onPress={signOut}>
        <Text>Sign Out</Text>
      </TouchableOpacity>
    </View>
  );
}

/**
 * A component that calls useAuth() outside of any AuthProvider, used only to
 * verify the missing-provider guard.
 */
function UnwrappedConsumer(): React.JSX.Element {
  useAuth();
  return <View />;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('given AuthProvider wraps the tree, when the tree first renders', () => {
  it('then initial isAuthenticated state is false (unauthenticated)', () => {
    render(
      <AuthProvider>
        <AuthHarness />
      </AuthProvider>,
    );

    expect(screen.getByTestId('auth-status').props.children).toBe('unauthenticated');
  });
});

describe('given AuthProvider wraps the tree and state is unauthenticated, when signIn is pressed', () => {
  it('then isAuthenticated transitions to true (authenticated)', () => {
    render(
      <AuthProvider>
        <AuthHarness />
      </AuthProvider>,
    );

    act(() => {
      fireEvent.press(screen.getByTestId('sign-in-button'));
    });

    expect(screen.getByTestId('auth-status').props.children).toBe('authenticated');
  });
});

describe('given AuthProvider wraps the tree and state is authenticated, when signOut is pressed', () => {
  it('then isAuthenticated transitions back to false (unauthenticated)', () => {
    render(
      <AuthProvider>
        <AuthHarness />
      </AuthProvider>,
    );

    act(() => {
      fireEvent.press(screen.getByTestId('sign-in-button'));
    });

    act(() => {
      fireEvent.press(screen.getByTestId('sign-out-button'));
    });

    expect(screen.getByTestId('auth-status').props.children).toBe('unauthenticated');
  });
});

describe('given useAuth is called outside an AuthProvider, when the component renders', () => {
  it("then it throws 'useAuth must be used within an AuthProvider'", () => {
    // Suppress the React error boundary console output that Jest would otherwise
    // print — the throw is the expected behavior here, not an unhandled error.
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined);

    expect(() => render(<UnwrappedConsumer />)).toThrow(
      'useAuth must be used within an AuthProvider',
    );

    consoleSpy.mockRestore();
  });
});
