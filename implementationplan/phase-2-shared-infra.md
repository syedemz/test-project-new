phase: 2
title: Theme and shared infrastructure
last_updated: 2026-04-30

context_summary: |
  Populate the shared theme, label inventory, and helper modules that every screen
  built in phases 4–6 will depend on. AsyncStorage is exercised end-to-end on the
  AVD via a throwaway harness so storage failures cannot ambush a later phase.
  No screens, no navigation, and no auth state are built here.

stories:
  - id: 2.1
    title: Implement styles/styles.ts (palette, spacing, typography)
    agent: frontenddeveloper
    done: false
    depends_on: []
    acceptance_criteria:
      - "`styles/styles.ts` exports a single object (or named constants) covering: a color palette with `primary`, `secondary`, `background`, `surface`, `textPrimary`, `textSecondary`, `error`; a spacing scale with `xs`, `sm`, `md`, `lg`, `xl`; a typography scale with `heading`, `subheading`, `body`, `caption`."
      - "All exported values are typed (no `any`); the module compiles under strict TypeScript."
      - "A unit test imports each named export and asserts its presence and basic shape (e.g., spacing values are positive numbers, color values are non-empty strings)."
      - "No other file in the project (other than the test) imports from `styles/styles.ts` yet — this is the source-of-truth definition only."
    notes: "Concrete color hex values, spacing magnitudes, and font-size numbers are picked at implementation time within the constraints above. Document the picks in the story PR description."

  - id: 2.2
    title: Implement labels/labels.json with the v1 key inventory
    agent: frontenddeveloper
    done: false
    depends_on: []
    acceptance_criteria:
      - "`labels/labels.json` exists with the exact v1 keys listed in architecture.md's \"Labels — schema and v1 key inventory\" section: all `app_*`, `ok_button`, `cancel_button`, all `login_*`, all `register_*`, both `registration_success_*`, `landing_screen_title`, `landing_tab_home_label`."
      - "Each key has the shape `{ \"en\": \"<English string>\" }`. Other languages MAY be present; `en` is mandatory on every key."
      - "A unit test loads `labels/labels.json` and asserts that every required key from the architecture inventory is present and that each key has a non-empty `en` value."
      - "No screen or component imports from `labels/labels.json` yet — this is the source-of-truth content only."
    notes: ""

  - id: 2.3
    title: Implement Helper/seedCredentials.ts
    agent: frontenddeveloper
    done: false
    depends_on: []
    acceptance_criteria:
      - "`Helper/seedCredentials.ts` exports a single typed constant (e.g., `SEED_CREDENTIAL: { username: string; password: string }`) with the values `username: \"testuser\"` and `password: \"Test@123\"` exactly as architecture.md specifies."
      - "A unit test imports the constant and asserts its `username` and `password` fields equal those values exactly."
      - "The module has no side effects on import (no `console.log`, no I/O)."
    notes: ""

  - id: 2.4
    title: Implement Helper/storageHelper.ts (typed AsyncStorage read/write with error wrapping)
    agent: frontenddeveloper
    done: false
    depends_on: []
    acceptance_criteria:
      - "`Helper/storageHelper.ts` exports `readUsers(): Promise<StoredUser[]>` and `writeUsers(users: StoredUser[]): Promise<void>`, both keyed under the literal AsyncStorage key `@test-project-new/registered-users` exactly as architecture.md specifies."
      - "`StoredUser` is exported with the exact field shape from architecture.md: `{ username: string; email: string; password: string; createdAt: string }`."
      - "On a fresh AsyncStorage (no key present), `readUsers()` resolves to an empty array (not undefined, not null)."
      - "After `writeUsers([record])`, a subsequent `readUsers()` resolves to an array deep-equal to `[record]`."
      - "If `AsyncStorage.getItem` throws, `readUsers()` rejects with an `Error` whose `message` contains the string `storage_read_failed` and whose `cause` is the original error."
      - "If `AsyncStorage.setItem` throws, `writeUsers()` rejects with an `Error` whose `message` contains `storage_write_failed` and whose `cause` is the original error."
      - "Unit tests cover all four behaviors above using the official AsyncStorage Jest mock (`@react-native-async-storage/async-storage/jest/async-storage-mock`)."
    notes: ""

  - id: 2.5
    title: Implement Helper/validationHelper.ts (username/email/password rules)
    agent: frontenddeveloper
    done: false
    depends_on: []
    acceptance_criteria:
      - "`Helper/validationHelper.ts` exports `validateUsername(value: string): { ok: true } | { ok: false; reason: string }` enforcing every username rule in architecture.md: required after trim, length 3–20 inclusive, regex `^[A-Za-z0-9_]+$`, leading/trailing whitespace trimmed before check. Uniqueness is NOT checked here."
      - "Exports `validateEmail(value: string): { ok: true } | { ok: false; reason: string }` enforcing the architecture's pragmatic regex `^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$`, required after trim. Uniqueness NOT checked here."
      - "Exports `validatePassword(value: string): { ok: true } | { ok: false; reason: string }` enforcing length 8–64, at least one letter, at least one digit. No special-character requirement."
      - "Exports `validateConfirmPassword(password: string, confirm: string): { ok: true } | { ok: false; reason: string }` returning ok only when the two strings are equal exactly (no trim)."
      - "The `reason` strings are stable identifiers (not user-facing copy) so screens can map them to label keys (e.g., `\"username_too_short\"`, `\"password_no_digit\"`, `\"password_mismatch\"`). Document the full set of reason strings in the module's TSDoc."
      - "Unit tests cover boundary cases for every rule: empty string, just-below-min, exactly-min, exactly-max, just-above-max, regex match/non-match, password missing letter, password missing digit, mismatched confirm, etc."
    notes: ""

  - id: 2.6
    title: Implement Helper/credentialHelper.ts (login lookup with seed precedence)
    agent: frontenddeveloper
    done: false
    depends_on:
      - 2.3
      - 2.4
    acceptance_criteria:
      - "`Helper/credentialHelper.ts` exports `lookupCredential(username: string, password: string): Promise<{ ok: true } | { ok: false }>`."
      - "Lookup order is registered users (via `storageHelper.readUsers`) first, then the seed credential — exactly as architecture.md \"Login lookup order\" specifies."
      - "Username comparison is case-insensitive (lowercased on both sides). Password comparison is exact. Username is trimmed before lookup."
      - "When the registered list is empty and credentials match the seed, the result is `{ ok: true }` (covers the explicit \"empty registered list on first run\" anchor in architecture.md)."
      - "When the registered list contains a matching record, the seed is NOT consulted (precedence order is observable via test that registers a user with `username: \"abc\"` and `password: \"Wrong1!\"`, then asserts that login with `(\"abc\", \"Test@123\")` resolves to `{ ok: false }`)."
      - "Unit tests cover: success against seed on empty list, success against registered user, failure on wrong password against registered user, failure on unknown username, case-insensitive username match, whitespace-trimmed username match."
    notes: ""

  - id: 2.7
    title: AsyncStorage smoke test on the AVD via a throwaway harness
    agent: frontenddeveloper
    done: false
    depends_on:
      - 2.4
    acceptance_criteria:
      - "A throwaway component (e.g., `App.tsx` temporarily renders a `<StorageSmokeTest />` view) calls `writeUsers` with a single fixture record, then calls `readUsers`, then renders the round-tripped record's `username` to the screen as text."
      - "The user runs `npx expo start`, launches on the Android emulator, and observes the round-tripped username text rendered on the device. The story PR description records (a) the AVD name and Android API level used, (b) a screenshot or transcript of the rendered text."
      - "The throwaway harness is removed in the same story before the story is closed: `App.tsx` is reverted to the bare Expo template (or to whatever phase 1 left it as), and the temporary `<StorageSmokeTest />` component file is deleted. `git diff` after this cleanup shows zero residual smoke-test code."
      - "If the round-trip on-device fails (the rendered username does not match what was written), the story is NOT closed. The failure must be diagnosed and resolved (likely a metro/expo config issue with `@react-native-async-storage/async-storage`) before phase 2 closes."
    notes: "This is the only manual on-device step in phase 2. It exists because Jest's AsyncStorage mock does not catch native-module wiring problems."
