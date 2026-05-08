/**
 * Unit tests for AuthRoutes — story 3.3 acceptance criteria.
 *
 * Asserts: mounting AuthRoutes inside a NavigationContainer renders the Login
 * screen as the initial route, identified by its stable testID.
 */

import React from 'react';
import { render } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import AuthRoutes from '@/navigation/AuthRoutes';

describe('given AuthRoutes is mounted inside a NavigationContainer, when the initial route is rendered', () => {
  it('then the login-screen-stub testID is in the tree (Login is the initial route)', async () => {
    const { getByTestId } = render(
      <NavigationContainer>
        <AuthRoutes />
      </NavigationContainer>,
    );
    // The NavigationContainer renders asynchronously; findByTestId resolves
    // once the element appears in the tree.
    expect(getByTestId('login-screen-stub')).toBeTruthy();
  });
});
