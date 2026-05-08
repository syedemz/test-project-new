/**
 * Unit tests for AuthRoutes — story 3.3 acceptance criteria.
 *
 * Asserts: mounting AuthRoutes inside a NavigationContainer renders the Login
 * screen as the initial route, identified by its stable testID.
 *
 * Note (story 5.1): LoginScreen testID renamed from `login-screen-stub` to
 * `login-screen`. Assertion updated accordingly.
 */

import React from 'react';
import { render } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import AuthRoutes from '@/navigation/AuthRoutes';
import { ThemeProvider } from '@/theme/ThemeProvider';
import { AuthProvider } from '@/auth/AuthContext';

// Note (story 5.2): LoginScreen now calls useAuth(), so AuthProvider is
// required in any test that renders AuthRoutes (which includes LoginScreen).

describe('given AuthRoutes is mounted inside a NavigationContainer, when the initial route is rendered', () => {
  it('then the login-screen testID is in the tree (Login is the initial route)', async () => {
    const { getByTestId } = render(
      <ThemeProvider>
        <AuthProvider>
          <NavigationContainer>
            <AuthRoutes />
          </NavigationContainer>
        </AuthProvider>
      </ThemeProvider>,
    );
    // The NavigationContainer renders asynchronously; findByTestId resolves
    // once the element appears in the tree.
    expect(getByTestId('login-screen')).toBeTruthy();
  });
});
