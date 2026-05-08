/**
 * Unit tests for stub screen components — story 3.1 acceptance criteria.
 *
 * Asserts: each stub renders its stable testID and the corresponding label
 * text sourced from labels.json, so the navigator's route tree tests in
 * later stories can rely on these identifiers.
 *
 * Note: RegisterScreen was replaced in story 4.1 with the real form
 * implementation. Its testID changed from `register-screen-stub` to
 * `register-screen`. The two assertions below reflect the new testID.
 *
 * Note (story 4.3): RegisterScreen now calls useNavigation(). We mock it here
 * so this suite renders RegisterScreen without needing a NavigationContainer.
 */

import React from 'react';
import { render } from '@testing-library/react-native';
import labels from '@/labels/labels.json';
import LoginScreen from '@/screens/LoginScreen';
import RegisterScreen from '@/screens/RegisterScreen';
import LandingScreen from '@/screens/LandingScreen';
import { ThemeProvider } from '@/theme/ThemeProvider';

// Mock useNavigation so RegisterScreen renders without a NavigationContainer.
jest.mock('@react-navigation/native', () => {
  const actual = jest.requireActual<typeof import('@react-navigation/native')>(
    '@react-navigation/native',
  );
  return {
    ...actual,
    useNavigation: () => ({ navigate: jest.fn() }),
  };
});

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

describe('given RegisterScreen is rendered, when the tree is queried', () => {
  it('then the register-screen testID is in the tree', () => {
    const { getByTestId } = render(
      <ThemeProvider>
        <RegisterScreen />
      </ThemeProvider>,
    );
    expect(getByTestId('register-screen')).toBeTruthy();
  });

  it('then the register_screen_title label value is rendered', () => {
    const { getByTestId } = render(
      <ThemeProvider>
        <RegisterScreen />
      </ThemeProvider>,
    );
    expect(getByTestId('register-screen-title').props.children).toBe(
      labels.register_screen_title.en,
    );
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
