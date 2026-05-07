/**
 * Unit tests for src/StorageSmokeTest.tsx — story 2.7 Leg A acceptance criteria.
 *
 * Verifies:
 *  1. Renders "loading..." initially.
 *  2. After the write+read cycle completes, renders the fixture username.
 *  3. Renders an error message when writeUsers rejects.
 *
 * Uses the official AsyncStorage Jest mock so storage state is isolated per test.
 */

import React from 'react';
import { act, render, screen } from '@testing-library/react-native';

import AsyncStorage from '@react-native-async-storage/async-storage';
import StorageSmokeTest from '@/StorageSmokeTest';

/* eslint-disable @typescript-eslint/no-require-imports */
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);
/* eslint-enable @typescript-eslint/no-require-imports */

beforeEach(async () => {
  await AsyncStorage.clear();
});

// ---------------------------------------------------------------------------
// Behaviour 1 — initial render shows loading state
// ---------------------------------------------------------------------------

describe('given StorageSmokeTest mounts', () => {
  describe('before the write+read cycle resolves', () => {
    it('then it renders "loading..." text', async () => {
      render(<StorageSmokeTest />);
      // Assert the synchronous initial render — "loading..." is present before
      // the async effect resolves.
      expect(screen.getByText('loading...')).toBeTruthy();
      // Flush pending promises so the async effect settles before the test
      // teardown; this prevents the act() warning from leaking into other tests.
      await act(async () => {
        await Promise.resolve();
      });
    });
  });
});

// ---------------------------------------------------------------------------
// Behaviour 2 — successful round-trip renders the fixture username
// ---------------------------------------------------------------------------

describe('given AsyncStorage is available and writable', () => {
  describe('when the write+read cycle completes', () => {
    it('then it renders the fixture username "smoketest"', async () => {
      render(<StorageSmokeTest />);

      // Wait for useEffect async work to settle
      await act(async () => {
        await Promise.resolve();
      });

      expect(screen.getByTestId('smoke-username')).toHaveTextContent('smoketest');
    });
  });
});

// ---------------------------------------------------------------------------
// Behaviour 3 — writeUsers rejection renders an error message
// ---------------------------------------------------------------------------

describe('given AsyncStorage.setItem is configured to throw', () => {
  describe('when StorageSmokeTest mounts', () => {
    it('then it renders an error message prefixed with "error:"', async () => {
      jest.spyOn(AsyncStorage, 'setItem').mockRejectedValueOnce(new Error('quota exceeded'));

      render(<StorageSmokeTest />);

      await act(async () => {
        await Promise.resolve();
      });

      const errorEl = screen.getByTestId('smoke-error');
      expect(errorEl).toHaveTextContent(/^error:/);
    });
  });
});
