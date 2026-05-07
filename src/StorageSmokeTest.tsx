import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { readUsers, writeUsers } from '@/Helper/storageHelper';
import type { StoredUser } from '@/Helper/storageHelper';

/** Fixture record written to AsyncStorage on mount. */
const SMOKE_FIXTURE: StoredUser = {
  username: 'smoketest',
  email: 'smoke@test.local',
  password: 'smoke',
  createdAt: new Date().toISOString(),
};

/** Discriminated state union for the smoke-test lifecycle. */
type SmokeState =
  | { status: 'loading' }
  | { status: 'ready'; username: string }
  | { status: 'error'; message: string };

/**
 * Throwaway AVD smoke-test harness for story 2.7.
 *
 * On mount, calls `writeUsers` with a single {@link StoredUser} fixture, then
 * calls `readUsers` and renders the round-tripped `username` to the screen.
 * This proves that `@react-native-async-storage/async-storage` is correctly
 * wired at the native-module level on the target AVD.
 *
 * Import path exercises the `@/` runtime alias (story 2.0) so a successful
 * render also confirms metro alias resolution on-device.
 *
 * @remarks
 * **THROWAWAY** — this component is deleted in story 2.7 Leg B after the user
 * confirms the AVD render. Do not add it to the navigation or any other screen.
 */
export default function StorageSmokeTest(): React.JSX.Element {
  const [state, setState] = useState<SmokeState>({ status: 'loading' });

  useEffect(() => {
    let cancelled = false;

    const run = async (): Promise<void> => {
      try {
        await writeUsers([SMOKE_FIXTURE]);
        const users = await readUsers();
        const roundTripped = users[0];

        if (!cancelled) {
          if (roundTripped !== undefined) {
            setState({ status: 'ready', username: roundTripped.username });
          } else {
            setState({ status: 'error', message: 'readUsers returned empty array after write' });
          }
        }
      } catch (err) {
        if (!cancelled) {
          const message = err instanceof Error ? err.message : String(err);
          setState({ status: 'error', message });
        }
      }
    };

    void run();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <View style={styles.container}>
      {state.status === 'loading' && <Text style={styles.text}>loading...</Text>}
      {state.status === 'ready' && (
        <Text style={styles.text} testID="smoke-username">
          {state.username}
        </Text>
      )}
      {state.status === 'error' && (
        <Text style={styles.errorText} testID="smoke-error">
          {`error: ${state.message}`}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  text: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111',
  },
  errorText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#c00',
  },
});
