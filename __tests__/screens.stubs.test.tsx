/**
 * Unit tests for stub screen components — story 3.1 acceptance criteria.
 *
 * Asserts: each stub renders its stable testID and the corresponding label
 * text sourced from labels.json, so the navigator's route tree tests in
 * later stories can rely on these identifiers.
 */

import React from 'react';
import { render } from '@testing-library/react-native';
import labels from '@/labels/labels.json';
import LoginScreen from '@/screens/LoginScreen';
import RegisterScreen from '@/screens/RegisterScreen';
import LandingScreen from '@/screens/LandingScreen';

describe('given LoginScreen stub is rendered, when the tree is queried', () => {
  it('then the login-screen-stub testID is in the tree', () => {
    const { getByTestId } = render(<LoginScreen />);
    expect(getByTestId('login-screen-stub')).toBeTruthy();
  });

  it('then the login_screen_title label value is rendered', () => {
    const { getByText } = render(<LoginScreen />);
    expect(getByText(labels.login_screen_title.en)).toBeTruthy();
  });
});

describe('given RegisterScreen stub is rendered, when the tree is queried', () => {
  it('then the register-screen-stub testID is in the tree', () => {
    const { getByTestId } = render(<RegisterScreen />);
    expect(getByTestId('register-screen-stub')).toBeTruthy();
  });

  it('then the register_screen_title label value is rendered', () => {
    const { getByText } = render(<RegisterScreen />);
    expect(getByText(labels.register_screen_title.en)).toBeTruthy();
  });
});

describe('given LandingScreen stub is rendered, when the tree is queried', () => {
  it('then the landing-screen-stub testID is in the tree', () => {
    const { getByTestId } = render(<LandingScreen />);
    expect(getByTestId('landing-screen-stub')).toBeTruthy();
  });

  it('then the landing_screen_title label value is rendered', () => {
    const { getByText } = render(<LandingScreen />);
    expect(getByText(labels.landing_screen_title.en)).toBeTruthy();
  });
});
