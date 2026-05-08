/**
 * Component tests for LoginScreen — story 5.1 acceptance criteria.
 *
 * Covers:
 *   1. Render with default state — screen root, title, both fields, login
 *      button, and Register link are all present in the tree.
 *   2. Register link `onPress` calls `navigation.navigate(AUTH_ROUTES.REGISTER)`.
 *
 * ThemeProvider is always provided because LoginScreen calls useTheme().
 * useNavigation is mocked so navigation.navigate can be asserted without
 * needing a NavigationContainer in the test tree.
 */

import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import { ThemeProvider } from '@/theme/ThemeProvider';
import LoginScreen from '@/screens/LoginScreen';
import labels from '@/labels/labels.json';
import { AUTH_ROUTES } from '@/navigation/AuthRoutes';

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
// Test helpers
// ---------------------------------------------------------------------------

/**
 * Renders LoginScreen wrapped in ThemeProvider.
 *
 * @returns The RNTL render result with all query helpers available.
 */
function renderScreen() {
  return render(
    <ThemeProvider>
      <LoginScreen />
    </ThemeProvider>,
  );
}

/** Reset mocks between tests so state does not leak. */
beforeEach(() => {
  jest.clearAllMocks();
  mockNavigate.mockClear();
});

// ---------------------------------------------------------------------------
// AC: render with default state
// ---------------------------------------------------------------------------

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
// AC: Register link navigates to the Register screen
// ---------------------------------------------------------------------------

describe('given LoginScreen is rendered, when the Register link is pressed', () => {
  it('then navigation.navigate is called with AUTH_ROUTES.REGISTER', () => {
    const { getByTestId } = renderScreen();

    fireEvent.press(getByTestId('login-register-link'));

    expect(mockNavigate).toHaveBeenCalledTimes(1);
    expect(mockNavigate).toHaveBeenCalledWith(AUTH_ROUTES.REGISTER);
  });
});
