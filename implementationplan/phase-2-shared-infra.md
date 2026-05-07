phase: 2
title: Theme and shared infrastructure
last_updated: 2026-05-07

phase_notes: |
  2026-05-07 chore: `.prettierrc` `endOfLine: "auto"` added to fix Windows CRLF regression — pre-2.4 cleanup.

context_summary: |
  Populate the shared theme (per theme.md), label inventory, and helper modules that
  every screen built in phases 4–6 will depend on. AsyncStorage is exercised end-to-end
  on the AVD via a throwaway harness so storage failures cannot ambush a later phase.

  All phase 2 source code lives under `src/` — the convention established by `theme.md`.
  Story 2.0 retires the empty placeholder folders that phase 1 story 1.7 left at the
  project root (`Helper/`, `labels/`, `styles/`, `navigation/`) and re-creates them
  under `src/` as each subsequent story needs them.

  ThemeProvider mounting and font loading (`expo-font` + `expo-splash-screen` + the
  PlusJakartaSans `.ttf` files) are explicitly **deferred to phase 3** when the app
  shell is built. Phase 2 establishes the theme modules as source-of-truth definitions
  only — App.tsx is not modified by the theme work, which keeps story 2.7's "revert
  App.tsx to the phase 1 template" criterion unambiguous.

  No screens, no navigation, no auth state, no ThemeProvider mounting in App.tsx.

stories:
  - id: 2.0
    title: Prep — install AsyncStorage, set up src/ root, retire phase 1.7 placeholder folders
    agent: frontenddeveloper
    done: true
    depends_on: []
    acceptance_criteria:
      - "`@react-native-async-storage/async-storage` installed via `npx expo install @react-native-async-storage/async-storage` (Expo's compatibility-checked install — NOT plain `npm install`). The package appears in `package.json` `dependencies` and is locked in `package-lock.json`."
      - "`src/` directory created at the project root. From phase 2 onward, all source code lives under `src/`."
      - "Stale phase-1.7 placeholder folders removed at project root: `Helper/`, `labels/`, `styles/`, `navigation/`. These were `.gitkeep`-only placeholders; phase 2 re-creates them under `src/` as needed. The `__tests__/` folder is RETAINED at the project root (Jest is configured to discover tests there per phase 1.6)."
      - "`tsconfig.json` configured with a `paths` alias mapping `@/*` → `src/*` and `baseUrl: \".\"` set so `theme.md`'s import pattern (`import { useTheme } from '@/theme'`) compiles. Verified with `npx tsc --noEmit`."
      - "**Runtime alias resolution** wired so the `@/*` alias works at bundle time, not just TS-compile time. Metro (Expo's bundler) does NOT read `tsconfig.json` `paths`. Use `babel-plugin-module-resolver` in `babel.config.js` (preferred — single source for both Metro and Jest) with the same `@/*` → `./src/*` mapping. Install via `npx expo install babel-plugin-module-resolver` if needed. Alternative: add a `resolver.alias` entry to `metro.config.js`. Pick one; document the choice in the story PR description."
      - "`jest.config.js` configured with a matching `moduleNameMapper` (`'^@/(.*)$': '<rootDir>/src/$1'`) so tests can `import` from `@/*` and resolve to `src/*`. (If `babel-plugin-module-resolver` was used, the babel transform alone may suffice in Jest under `jest-expo`; keep `moduleNameMapper` as belt-and-suspenders.)"
      - "**Verification of alias resolution end-to-end:** create a temporary file `src/__aliasProbe.ts` exporting a constant, write a Jest test that imports it via `import { probe } from '@/__aliasProbe'` and asserts the value, run the test successfully, then delete both the probe file and the test. (No probe code lands in the final commit.) This proves alias resolution works across TS, Babel, and Jest before any real source file depends on it."
      - "**Phase-1 jest exclude — defer, do NOT remove.** `jest.config.js` lines 16–23 contain the phase-1 exclude block for `App.tsx` and `index.ts`. Story 2.7 temporarily edits `App.tsx` and reverts it; phase 3 (app shell) is where `App.tsx` actually grows real, testable content (ThemeProvider mount, font loading). Removing the exclude in phase 2 would force a synthetic test for the bare Expo template AND collide with story 2.7's leg A edit. **Update the comment block in `jest.config.js`** so it reads `CONTRACT: phase 3 (app shell) MUST remove these excludes when ThemeProvider and font loading are wired into App.tsx.` Leave the actual exclude entries (`'!App.tsx'`, `'!index.ts'`) in place. This is a deliberate amendment of the phase-1 contract, recorded in the story PR description."
      - "Verification gate (all must pass with no regression vs. phase 1's baseline): `npm run lint`, `npm run format:check`, `npm test`, `npx tsc --noEmit`."
    notes: "This is a prep story — no application code is written here. Its job is to leave the repo in a state where every subsequent phase 2 story can place its file under `src/` without colliding with phase 1's placeholder scaffold. The phase-1 jest exclude is INTENTIONALLY deferred to phase 3, not removed in 2.0; this is a deliberate amendment of the phase-1 contract. Document the amendment in the story PR description."

  - id: 2.1
    title: Implement src/theme/* per theme.md §14 (tokens, typography, provider, index)
    agent: frontenddeveloper
    done: true
    depends_on:
      - 2.0
    acceptance_criteria:
      - "`src/theme/theme.ts` exports the symbols defined in theme.md §14.1: `lightColors`, `darkColors`, `spacing`, `radii`, `shadows`, `lightTheme`, `darkTheme`, and the types `ColorScheme` and `Theme`. The internal `palette` const may remain module-private. Color hex values, spacing magnitudes, radii values, and shadow values MUST match theme.md §14.1 verbatim — this story is faithful transcription, not original design."
      - "`src/theme/typography.ts` exports the symbols defined in theme.md §14.2: `fontFamily`, `fontSize`, `fontWeight`, `textStyles`. PlusJakartaSans family strings are referenced. NO `.ttf` font files are installed in this story; the strings will resolve to system-font fallback at runtime until phase 3 wires `expo-font`."
      - "`src/theme/ThemeProvider.tsx` exports `ThemeProvider`, `useTheme`, and `useThemeControls` per theme.md §14.3. The hooks throw with the exact error messages shown in §14.3 (`'useTheme must be used within ThemeProvider'`, `'useThemeControls must be used within ThemeProvider'`) when used outside the provider."
      - "`src/theme/index.ts` re-exports per theme.md §14.4 (`export * from './theme'; export * from './typography'; export { ThemeProvider, useTheme, useThemeControls } from './ThemeProvider';`)."
      - "Strict TypeScript compiles; all exports are typed; no `any`."
      - "Unit tests assert: `lightTheme.colors.accent.primary === '#E91E63'`; `darkTheme.colors.accent.primary === '#FF4081'`; `spacing.lg === 16`; `radii.pill === 999`; `textStyles.heading.xl.fontSize === 24`; `textStyles.heading.xl.fontFamily === 'PlusJakartaSans-Bold'`; calling `useTheme()` outside a provider throws an `Error` whose `message === 'useTheme must be used within ThemeProvider'`."
      - "**App.tsx is NOT modified in this story.** `<ThemeProvider>` is NOT mounted at the app root. `expo-font`, `expo-splash-screen`, and the PlusJakartaSans `.ttf` files are NOT installed in phase 2. Both wiring tasks are deferred to phase 3 (app shell). The theme modules are source-of-truth definitions only — no other file imports from `src/theme/` at the close of this story."
    notes: "Concrete palette / spacing / typography values are governed by theme.md, not this PRD. The agent's job is faithful transcription of theme.md §14, not original design choices. If a value in theme.md §14 appears wrong, do NOT silently 'fix' it — surface the discrepancy in the story PR and stop."

  - id: 2.2
    title: Implement src/labels/labels.json with the v1 key inventory
    agent: frontenddeveloper
    done: true
    depends_on:
      - 2.0
    acceptance_criteria:
      - "`src/labels/labels.json` exists with the exact v1 keys listed in architecture.md's \"Labels — schema and v1 key inventory\" section: all `app_*`, `ok_button`, `cancel_button`, all `login_*`, all `register_*`, both `registration_success_*`, `landing_screen_title`, `landing_tab_home_label`."
      - "Each key has the shape `{ \"en\": \"<English string>\" }`. Other languages MAY be present; `en` is mandatory on every key."
      - "A unit test loads `src/labels/labels.json` and asserts that every required key from the architecture inventory is present and that each key has a non-empty `en` value."
      - "No screen or component imports from `src/labels/labels.json` yet — this is the source-of-truth content only."
    notes: ""

  - id: 2.3
    title: Implement src/Helper/seedCredentials.ts
    agent: frontenddeveloper
    done: true
    depends_on:
      - 2.0
    acceptance_criteria:
      - "`src/Helper/seedCredentials.ts` exports a single typed constant (e.g., `SEED_CREDENTIAL: { username: string; password: string }`) with the values `username: \"testuser\"` and `password: \"Test@123\"` exactly as architecture.md specifies."
      - "A unit test imports the constant and asserts its `username` and `password` fields equal those values exactly."
      - "The module has no side effects on import (no `console.log`, no I/O)."
    notes: ""

  - id: 2.4
    title: Implement src/Helper/storageHelper.ts (typed AsyncStorage read/write with error wrapping)
    agent: frontenddeveloper
    done: true
    depends_on:
      - 2.0
    acceptance_criteria:
      - "`src/Helper/storageHelper.ts` exports `readUsers(): Promise<StoredUser[]>` and `writeUsers(users: StoredUser[]): Promise<void>`, both keyed under the literal AsyncStorage key `@test-project-new/registered-users` exactly as architecture.md specifies."
      - "`StoredUser` is exported with the exact field shape from architecture.md: `{ username: string; email: string; password: string; createdAt: string }`."
      - "On a fresh AsyncStorage (no key present), `readUsers()` resolves to an empty array (not undefined, not null)."
      - "After `writeUsers([record])`, a subsequent `readUsers()` resolves to an array deep-equal to `[record]`."
      - "If `AsyncStorage.getItem` throws, `readUsers()` rejects with an `Error` whose `message` contains the string `storage_read_failed` and whose `cause` is the original error."
      - "If `AsyncStorage.setItem` throws, `writeUsers()` rejects with an `Error` whose `message` contains `storage_write_failed` and whose `cause` is the original error."
      - "Unit tests cover all four behaviors above using the official AsyncStorage Jest mock (`@react-native-async-storage/async-storage/jest/async-storage-mock`)."
    notes: "AsyncStorage is installed in story 2.0; do NOT install it again here."

  - id: 2.5
    title: Implement src/Helper/validationHelper.ts (username/email/password rules)
    agent: frontenddeveloper
    done: true
    depends_on:
      - 2.0
    acceptance_criteria:
      - "`src/Helper/validationHelper.ts` exports `validateUsername(value: string): { ok: true } | { ok: false; reason: string }` enforcing every username rule in architecture.md: required after trim, length 3–20 inclusive, regex `^[A-Za-z0-9_]+$`, leading/trailing whitespace trimmed before check. Uniqueness is NOT checked here."
      - "Exports `validateEmail(value: string): { ok: true } | { ok: false; reason: string }` enforcing the architecture's pragmatic regex `^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$`, required after trim. Uniqueness NOT checked here."
      - "Exports `validatePassword(value: string): { ok: true } | { ok: false; reason: string }` enforcing length 8–64, at least one letter, at least one digit. No special-character requirement."
      - "Exports `validateConfirmPassword(password: string, confirm: string): { ok: true } | { ok: false; reason: string }` returning ok only when the two strings are equal exactly (no trim)."
      - "The `reason` strings are stable identifiers (not user-facing copy) so screens can map them to label keys (e.g., `\"username_too_short\"`, `\"password_no_digit\"`, `\"password_mismatch\"`). Document the full set of reason strings in the module's TSDoc."
      - "Unit tests cover boundary cases for every rule: empty string, just-below-min, exactly-min, exactly-max, just-above-max, regex match/non-match, password missing letter, password missing digit, mismatched confirm, etc."
    notes: ""

  - id: 2.6
    title: Implement src/Helper/credentialHelper.ts (login lookup with seed precedence)
    agent: frontenddeveloper
    done: true
    depends_on:
      - 2.3
      - 2.4
    acceptance_criteria:
      - "`src/Helper/credentialHelper.ts` exports `lookupCredential(username: string, password: string): Promise<{ ok: true } | { ok: false }>`."
      - "Lookup order is registered users (via `storageHelper.readUsers`) first, then the seed credential — exactly as architecture.md \"Login lookup order\" specifies."
      - "Username comparison is case-insensitive (lowercased on both sides). Password comparison is exact. Username is trimmed before lookup."
      - "When the registered list is empty and credentials match the seed, the result is `{ ok: true }` (covers the explicit \"empty registered list on first run\" anchor in architecture.md)."
      - "When the registered list contains a matching record, the seed is NOT consulted (precedence order is observable via test that registers a user with `username: \"abc\"` and `password: \"Wrong1!\"`, then asserts that login with `(\"abc\", \"Test@123\")` resolves to `{ ok: false }`)."
      - "Unit tests cover: success against seed on empty list, success against registered user, failure on wrong password against registered user, failure on unknown username, case-insensitive username match, whitespace-trimmed username match."
    notes: ""

  - id: 2.7
    title: AsyncStorage smoke test on the AVD via a throwaway harness (TWO-LEG STORY with manual user checkpoint)
    agent: frontenddeveloper
    done: false
    depends_on:
      - 2.4
    acceptance_criteria:
      - "**Leg A (subagent):** A throwaway component at `src/StorageSmokeTest.tsx` is created. `App.tsx` is temporarily modified to render `<StorageSmokeTest />` (and only that). The component calls `writeUsers` with a single fixture `StoredUser` record, then calls `readUsers`, then renders the round-tripped record's `username` to the screen as plain text. Leg A commits these changes on the phase 2 feature branch and returns control to the user with a clear handoff note: \"Leg A complete — please run the AVD verification per the story 2.7 user checkpoint.\""
      - "**User checkpoint (manual):** The user runs `npx expo start`, launches on the Android emulator (AVD), and observes the round-tripped username text rendered on the device. The user reports back with: (a) AVD name and Android API level used, (b) a screenshot or transcript of the rendered text. If the rendered text matches what `writeUsers` wrote, leg B is dispatched. If the text does NOT match (or the app crashes / fails to bundle), the story does NOT close; the failure is diagnosed (most likely a metro/expo native-module wiring issue with `@react-native-async-storage/async-storage`) before phase 2 closes."
      - "**Leg B (subagent re-dispatched after user reports success):** `App.tsx` is reverted to exactly what phase 1 left it as (the bare Expo template — verifiable by `git show <phase-1-merge-commit>:App.tsx`). The `src/StorageSmokeTest.tsx` file is deleted. `git diff <phase-1-merge-commit>..HEAD -- App.tsx` shows zero residual smoke-test code. Note: `<ThemeProvider>` is NOT yet wired in `App.tsx` (that is a phase 3 task), so the revert target is unambiguous."
      - "Story PR description records: AVD name, Android API level, screenshot or transcript of the rendered text, and a short note on the leg A → checkpoint → leg B sequence."
      - "If the on-device round trip fails, the story is NOT closed and `notes:` on this story is updated with the structured failure entry per `engineeringprinciples.md` failure-management rules; phase 2 does NOT close until 2.7 succeeds."
    notes: "This is the only manual on-device step in phase 2. Jest's AsyncStorage mock does not catch native-module wiring problems (mocked tests will pass even if metro fails to resolve the native module on Android), so on-device verification is mandatory before phase 2 closes. Two-leg structure: subagent → user checkpoint → subagent. LEG A complete 2026-05-07: harness at src/StorageSmokeTest.tsx, App.tsx temp-edited, awaiting AVD checkpoint."
