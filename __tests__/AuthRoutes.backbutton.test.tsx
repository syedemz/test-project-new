/**
 * Unit test for story 3.6 — AC3 (test-backed):
 *
 * "On RegisterScreen (pushed from Login), the hardware back button pops back
 * to LoginScreen — verified by a test that mounts <AuthRoutes /> inside a
 * <NavigationContainer>, navigates to Register, fires the hardwareBackPress
 * event via BackHandler, and asserts the navigator is back on Login."
 *
 * Platform note: jest-expo's default platform is 'ios'. The iOS BackHandler
 * implementation is a no-op — its addEventListener() registers nothing and
 * returns a stub. React Navigation's useBackButton hook (NavigationContainer.js
 * line 32) still *calls* BackHandler.addEventListener('hardwareBackPress', …)
 * on mount. We spy on that call, capture the handler, and invoke it manually
 * inside act() to simulate the OS dispatching a hardware back press.
 *
 * Technique used: A (NavigationContainerRef) + spy-capture of the handler.
 */

import React from 'react';
import { act, render } from '@testing-library/react-native';
import { BackHandler } from 'react-native';
import { NavigationContainer, createNavigationContainerRef } from '@react-navigation/native';
import AuthRoutes, { AUTH_ROUTES, AuthStackParamList } from '@/navigation/AuthRoutes';
import { ThemeProvider } from '@/theme/ThemeProvider';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Returns the BackHandler handler registered for 'hardwareBackPress' by
 * spying on BackHandler.addEventListener before component mount, and restores
 * the original after mount.
 *
 * The spy is set up before render() so it captures the handler that
 * React Navigation's NavigationContainer registers via useBackButton on mount.
 *
 * @returns The captured handler and a restore function.
 */
function spyOnBackHandler(): {
  getHandler: () => (() => boolean | null | undefined) | null;
  restore: () => void;
} {
  let capturedHandler: (() => boolean | null | undefined) | null = null;

  const spy = jest
    .spyOn(BackHandler, 'addEventListener')
    .mockImplementation((eventName, handler) => {
      if (eventName === 'hardwareBackPress') {
        capturedHandler = handler;
      }
      // Return the same stub the iOS BackHandler would return — a {remove}
      // object. We match the real signature so TypeScript is satisfied.
      return { remove: () => {} };
    });

  return {
    getHandler: () => capturedHandler,
    restore: () => spy.mockRestore(),
  };
}

// ---------------------------------------------------------------------------
// Test
// ---------------------------------------------------------------------------

describe('given navigated to Register from Login in AuthRoutes, when hardware back is pressed', () => {
  it('then Login is restored: login-screen-stub is in the tree, register-screen is not', async () => {
    // Set up the spy BEFORE render so React Navigation's useBackButton
    // registers via our interceptor during the component mount effect.
    const { getHandler, restore } = spyOnBackHandler();

    const navRef = createNavigationContainerRef<AuthStackParamList>();

    const { getByTestId, queryByTestId } = render(
      <ThemeProvider>
        <NavigationContainer ref={navRef}>
          <AuthRoutes />
        </NavigationContainer>
      </ThemeProvider>,
    );

    // Step 1: verify initial route is Login.
    expect(getByTestId('login-screen-stub')).toBeTruthy();
    expect(queryByTestId('register-screen')).toBeNull();

    // Step 2: navigate to Register inside act() so React flushes state.
    await act(async () => {
      navRef.navigate(AUTH_ROUTES.REGISTER);
    });

    // Confirm Register is now visible.
    expect(getByTestId('register-screen')).toBeTruthy();
    expect(queryByTestId('login-screen-stub')).toBeNull();

    // Step 3: retrieve the captured backPress handler.
    // React Navigation registers the handler in a useEffect on mount, so it
    // should be available at this point.
    const backPressHandler = getHandler();

    if (backPressHandler === null) {
      // The spy did not capture a handler — this means the useBackButton hook
      // did not call BackHandler.addEventListener in this environment.
      // Per story 3.6 instructions: report the failure honestly; do NOT flip
      // done:true. We throw so the test fails with a descriptive message.
      restore();
      throw new Error(
        'Story 3.6 AC3: BackHandler.addEventListener was not called by React Navigation. ' +
          'The hardware-back-press handler could not be captured. ' +
          'Triage: check whether useBackButton.native.js is loaded in this jest-expo environment.',
      );
    }

    // Step 4: fire the hardware back press by calling the captured handler
    // inside act() so React flushes all resulting state updates.
    await act(async () => {
      backPressHandler();
    });

    // Step 5: assert we are back on Login.
    expect(queryByTestId('register-screen')).toBeNull();
    expect(getByTestId('login-screen-stub')).toBeTruthy();

    restore();
  });
});
