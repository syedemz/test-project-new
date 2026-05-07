import AsyncStorage from '@react-native-async-storage/async-storage';

/** The AsyncStorage key under which the registered-user list is persisted. */
const STORAGE_KEY = '@test-project-new/registered-users';

/**
 * A single registered-user record as persisted in AsyncStorage.
 *
 * - `username` — stored in original case; compared case-insensitively at login.
 * - `email` — stored lowercased.
 * - `password` — plaintext for v1.
 * - `createdAt` — ISO 8601 timestamp string set at registration time.
 *
 * @see architecture.md — "AsyncStorage schema"
 */
export interface StoredUser {
  username: string;
  email: string;
  password: string;
  createdAt: string;
}

/**
 * Reads the full list of registered users from AsyncStorage.
 *
 * Every call hits AsyncStorage directly — there is no in-memory cache or buffer.
 *
 * @returns An array of `StoredUser` records. Returns an empty array when
 *   no users have been registered yet (key absent from storage).
 * @throws `Error` With `message` containing `storage_read_failed` and `cause`
 *   set to the original error when `AsyncStorage.getItem` throws.
 */
export async function readUsers(): Promise<StoredUser[]> {
  let raw: string | null;
  try {
    raw = await AsyncStorage.getItem(STORAGE_KEY);
  } catch (cause) {
    throw new Error('storage_read_failed: could not read registered-users from AsyncStorage', {
      cause,
    });
  }

  if (raw === null) {
    return [];
  }

  return JSON.parse(raw) as StoredUser[];
}

/**
 * Overwrites the registered-user list in AsyncStorage with the supplied array.
 *
 * Every call hits AsyncStorage directly — there is no in-memory cache or buffer.
 *
 * @param users - The complete list of {@link StoredUser} records to persist.
 *   Pass an empty array to clear the list.
 * @throws `Error` With `message` containing `storage_write_failed` and `cause`
 *   set to the original error when `AsyncStorage.setItem` throws.
 */
export async function writeUsers(users: StoredUser[]): Promise<void> {
  const serialised = JSON.stringify(users);
  try {
    await AsyncStorage.setItem(STORAGE_KEY, serialised);
  } catch (cause) {
    throw new Error('storage_write_failed: could not write registered-users to AsyncStorage', {
      cause,
    });
  }
}
