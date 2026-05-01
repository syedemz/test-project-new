# test-project-new — Architecture

## Project overview

A basic React Native + Expo mobile application with no backend. Its purpose is to evaluate the end-to-end agentic AI software development lifecycle on a small, fully-defined scope. The app provides a registration flow, a login flow with hardcoded credential validation, and a placeholder landing page reachable only after successful authentication. Audience: a single user (self).

The app is intentionally minimal. It exists to exercise the workspace's `/create-plan` and `/implement-phase` slash commands against a realistic, multi-screen mobile target.

## Components

The app is a single client-side mobile application. There is no backend, no server, no database, and no remote infrastructure.

- **Mobile app (React Native + Expo)** — the only component. Contains:
  - **Screens layer** — `LoginScreen`, `RegisterScreen`, `LandingScreen`.
  - **Navigation layer** — central navigator file plus separate route files for pre-auth and post-auth routes (see Navigation below).
  - **Auth state** — in-memory authentication flag held by a top-level provider (React Context). Determines which navigator stack is rendered.
  - **Local credential store** — hardcoded credentials and any registered-user records persisted via `AsyncStorage`. No network calls.
  - **Theme / styles** — single shared `styles/styles.ts` per `codingprinciples.md`, with named color, spacing, and typography constants for a consistent visual theme.
  - **Labels** — single `labels/labels.json` with English defaults per `codingprinciples.md`.
  - **Helpers** — `Helper/` folder for credential validation, storage access, and form validation logic.

### Navigation

- All navigation files live under a single folder: **`navigation/`**.
- One central navigator file (`navigation/AppNavigator.tsx`) decides at the top level whether to render the pre-auth stack or the post-auth stack, based on the auth state.
- Routes are split into two separate files:
  - `navigation/AuthRoutes.tsx` — pre-authentication routes (`Login`, `Register`).
  - `navigation/AppRoutes.tsx` — post-authentication routes (`Landing` and any future tabs reachable from the bottom navigation bar).
- Without an authenticated session, the post-auth stack is not mounted, so the landing page is unreachable by any navigation action, deep link, or back-button traversal.
- The landing page hosts a **bottom tab navigator**. For v1 it has a single tab (the empty landing page); the structure is in place so additional tabs can be added later without restructuring navigation.

### Screens (v1)

- **RegisterScreen** — fields: `email`, `username`, `password`, `confirmPassword`, each with a label and placeholder. Submit button. On success, shows a modal with "Registration successful". Registered users are written to `AsyncStorage` under a known key so they can log in afterward.
- **LoginScreen** — fields: `username`, `password`, each with a label and placeholder. Login button. Validates against (a) any user records stored in `AsyncStorage` from a prior registration, then (b) a hardcoded seed credential pair (precedence rules below). On success, sets the auth state to authenticated; the navigator swaps to the post-auth stack. On failure, shows an inline error message.
- **LandingScreen** — placeholder empty screen rendered inside the bottom tab navigator. No content for v1 beyond the tab bar itself.

### Form validation rules

Validation lives in a helper (`Helper/validationHelper.ts`) and returns a typed result `{ ok: true } | { ok: false; reason: ValidationReason }`. All rules below are enforced on the **register** screen unless noted.

- **Username**
  - Required, non-empty after trim.
  - Length: 3 – 20 characters inclusive.
  - Allowed characters: ASCII letters, digits, underscore (`^[A-Za-z0-9_]+$`).
  - Comparison everywhere is **case-insensitive** (stored in original case, compared lowercased).
  - Leading/trailing whitespace is trimmed at both register and login before validation and storage.
  - **Uniqueness:** rejected at register if the lowercased username collides with any existing registered user OR the seed username (see Seed vs registered precedence).
- **Email**
  - Required, non-empty after trim.
  - Pattern: pragmatic regex `^[^\s@]+@[^\s@]+\.[^\s@]+$` (one `@`, at least one dot in the domain part, no whitespace). Not RFC 5322 — deliberately simple.
  - Comparison case-insensitive; stored lowercased.
  - **Uniqueness across registered users** is enforced at register.
- **Password**
  - Required, length 8 – 64 characters.
  - Must contain at least one letter and at least one digit. No special-character requirement for v1.
  - Stored as-is in `AsyncStorage` (plaintext — flagged in Open questions).
- **Confirm password**
  - Must equal `password` exactly (no trim).
  - Validation timing: on **blur** of the confirm field, and again on submit. Not on every keystroke.
- **Login fields**
  - Username and password are required. No format checks at login (any string accepted; only the credential check fails or succeeds). Whitespace is trimmed off the username before lookup.

### Seed credential vs. registered users — precedence

- A single seed credential pair lives in `Helper/seedCredentials.ts`: `username: "testuser"`, `password: "Test@123"`. Final values confirmed at implementation time.
- The seed username is **reserved**: an attempt to register with username `testuser` (case-insensitive) is rejected at register time with the same uniqueness-error UX as a duplicate registered user.
- **Login lookup order:** registered users first, then seed. Because the seed username is reserved, this order is observable only when the registered list is empty — both paths still resolve correctly.
- **Empty registered-user list on first run** — a fresh install has no registered users; login falls back cleanly to the seed pair. This is an explicit anchor for testing.

### AsyncStorage schema

- **Single key:** `@test-project-new/registered-users`.
- **Value:** a JSON-serialized array of user records.
  ```ts
  type StoredUser = {
    username: string; // stored in original case; compared lowercased
    email: string; // stored lowercased
    password: string; // plaintext for v1
    createdAt: string; // ISO 8601
  };
  type StoredUsers = StoredUser[];
  ```
- **Write behavior:** read the array, append the new record, write back. No per-user keys; the entire list is rewritten on each registration. Acceptable at the expected single-user, low-volume scale.
- **Duplicate handling:** registration validates uniqueness _before_ writing. If username or email collides, the write does not happen and the form surfaces the relevant uniqueness error.
- **Read/write failure UX:** any thrown error from `AsyncStorage` is caught in the helper, logged with structured context, and surfaced to the screen as a non-blocking inline error ("Could not save registration. Please try again."). The form remains editable; no crash, no silent success.

### Modal contract (registration success)

- The success modal renders **after** the AsyncStorage write resolves successfully.
- Single primary action: an **OK** button. Tap-outside-to-dismiss is **disabled**. There is no auto-timeout.
- Tapping OK dismisses the modal **and** navigates to `LoginScreen`. There is no separate dismiss-vs-navigate distinction.
- Modal text: pulled from `labels/labels.json` (`registration_success_title`, `registration_success_body`, `ok_button`). No raw strings.

### Inline login-error contract

- Position: a single line directly **below the Login button**. Not above the fields, not next to a specific field.
- Text: pulled from `labels/labels.json` (`login_invalid_credentials`). Generic message — does not distinguish "no such user" from "wrong password" (avoids enumeration even though there is no remote attacker; consistency).
- Visibility: appears when login fails; cleared automatically on the **next change to either field** (`onChangeText` of username or password).
- Color: theme `error` color from `styles.ts`.

### Android hardware back button

| Screen / state                       | Behavior                                                                                                                                                       |
| ------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `LoginScreen` (root of auth stack)   | Default exit-app behavior (allowed; this is the unauthenticated entry point).                                                                                  |
| `RegisterScreen` (pushed from Login) | Pops back to `LoginScreen`.                                                                                                                                    |
| Registration success modal open      | **Intercepted** — back press triggers the same OK handler (dismiss + navigate to Login). Prevents leaving the modal in a stuck visual state.                   |
| `LandingScreen` (post-auth root)     | Default exit-app behavior. Back-button is **not** wired to "log out" for v1; logout is out of scope.                                                           |
| Across the auth boundary             | Auth-state transitions unmount the inactive stack entirely. There is no navigation history bridging pre- and post-auth, so the back button cannot traverse it. |

### Labels — schema and v1 key inventory

- **Shape:** flat-key root with language-keyed values. The same shape that already appears in `codingprinciples.md`:
  ```json
  {
    "<label_key>": { "en": "<English default>", "<other_lang>": "<value>" }
  }
  ```
- Components import `labels.<label_key>.en` for v1. A future runtime resolver helper (`Helper/labelHelper.ts`) will look up the active language, falling back to `en`.
- **v1 label keys** (English defaults are placeholders, finalised at implementation time):
  - **Common:** `app_title`, `ok_button`, `cancel_button`.
  - **Login screen:** `login_screen_title`, `login_username_label`, `login_username_placeholder`, `login_password_label`, `login_password_placeholder`, `login_button`, `login_link_to_register`, `login_invalid_credentials`, `login_storage_error`.
  - **Register screen:** `register_screen_title`, `register_email_label`, `register_email_placeholder`, `register_username_label`, `register_username_placeholder`, `register_password_label`, `register_password_placeholder`, `register_confirm_password_label`, `register_confirm_password_placeholder`, `register_button`, `register_link_to_login`, `register_validation_email_invalid`, `register_validation_email_in_use`, `register_validation_username_invalid`, `register_validation_username_in_use`, `register_validation_password_weak`, `register_validation_password_mismatch`, `register_storage_error`.
  - **Registration success modal:** `registration_success_title`, `registration_success_body`.
  - **Landing screen:** `landing_screen_title`, `landing_tab_home_label`.

### Theme

- A single source of truth for visual identity in `styles/styles.ts`:
  - **Color palette** — primary, secondary, background, surface, text-primary, text-secondary, error.
  - **Spacing scale** — `xs`, `sm`, `md`, `lg`, `xl`.
  - **Typography scale** — `heading`, `subheading`, `body`, `caption`.
- All screens import from this file. No inline color or spacing literals anywhere.

## Programming languages / frameworks

| Component              | Language / framework                        | Pinned version                                        |
| ---------------------- | ------------------------------------------- | ----------------------------------------------------- |
| Mobile app             | TypeScript (strict mode)                    | `5.4.x`                                               |
| Mobile app             | React Native                                | **defer to Expo SDK 55's pinned RN; target `0.85.x`** |
| Mobile app             | Expo SDK                                    | `55`                                                  |
| Navigation             | React Navigation                            | latest stable major at bootstrap (target `7.x`)       |
| Local persistence      | `@react-native-async-storage/async-storage` | latest compatible with Expo SDK 55                    |
| Testing                | Jest + React Native Testing Library         | latest compatible with RN actually pinned by Expo 55  |
| Lint / format          | ESLint, `eslint-plugin-tsdoc`, Prettier     | latest                                                |
| Node (dev environment) | Node.js                                     | `24.x` (verified `v24.14.1` on host)                  |
| JDK (Android build)    | Java (bundled with Android Studio)          | whatever ships with the installed Android Studio      |

**Version-pin policy:** Expo SDK 55 pins a specific RN minor version. If that pin is not 0.85.x, **defer to Expo's pin** rather than forcing 0.85.x — fighting Expo's pinned RN creates toolchain breakage. Same logic for React Navigation: target 7.x but accept whatever stable major Expo SDK 55's docs recommend at bootstrap. Phase 1 contains an explicit verify-and-record step (see below) that captures the actual versions installed.

Language and styling discipline is governed by `codingprinciples.md`.

## Cloud platforms

None. The app runs locally only.

## Infrastructure as code

None. There is no cloud or server infrastructure to provision.

## Project plan / phases (high-level)

The detailed phase/story breakdown is generated by `/create-plan` into `implementationplan.md`. The intended high-level phasing is:

1. **Project bootstrap (includes prerequisite verification).**
   - **Verify host prerequisites first**, before any project init. Each check is a concrete command; if any fails or returns empty, halt the phase and report — do not proceed:
     - **Node 24.x** — `node -v` must report a `v24.x` version. The host is `v24.14.1`; the pin was raised from 20.x LTS to 24.x on 2026-05-01 to match the host. Note: Expo SDK 55 was originally evaluated against Node 20; if `npx expo` misbehaves at install or bundler time, Node version mismatch is the first suspect. See "Open questions" below.
     - **Android Studio + Android SDK** — run `sdkmanager --list_installed` (from `$ANDROID_HOME/cmdline-tools/latest/bin/` or equivalent). Output must include at least one installed `platforms;android-*` package and one `build-tools;*` package. Failure of this check also implies Android Studio is not installed or `$ANDROID_HOME` is not set — report both possibilities.
     - **At least one AVD configured** — `emulator -list-avds` (from `$ANDROID_HOME/emulator/`) must print at least one AVD name on stdout. An empty list halts the phase.
     - **JDK** — Android Studio ships its own bundled JDK; the prerequisite check does NOT require a system-wide Java install. Phase 1 does not run `java -version` against the system PATH. Expo's Gradle build will use Android Studio's bundled JDK; if that breaks at build time, surface the error and let the user resolve it.
   - Initialize the Expo + TypeScript project against Expo SDK 55.
   - **Record the actual pinned versions** of React Native and React Navigation that ship with Expo SDK 55 in `implementationplan.md` notes; if RN is not 0.85.x, accept Expo's pin and update the architecture's pinned-version table to match.
   - Configure `tsconfig.json` strict mode, ESLint with `eslint-plugin-tsdoc`, Prettier, Jest + RNTL.
   - Scaffold the `styles/`, `labels/`, `Helper/`, and `navigation/` folders with placeholder files.
2. **Theme and shared infrastructure.**
   - Populate `styles/styles.ts` with the palette/spacing/typography constants.
   - Populate `labels/labels.json` with the v1 key inventory listed above.
   - Implement `Helper/storageHelper.ts` (typed AsyncStorage read/write for the registered-users list, with error wrapping per the storage-failure UX rule), `Helper/validationHelper.ts`, `Helper/seedCredentials.ts`, `Helper/credentialHelper.ts`.
   - **AsyncStorage smoke test on the AVD** — round-trip a record to confirm AsyncStorage works under the Expo SDK 55 managed workflow without ejecting.
   - Unit tests for every helper.
3. **Authentication state and navigation skeleton.**
   - Implement the auth context/provider.
   - Build `AppNavigator.tsx`, `AuthRoutes.tsx`, `AppRoutes.tsx`, and the bottom tab navigator.
   - Implement the back-button behavior contract for the auth boundary.
   - **Auth-gate tests** (technique made explicit — see Testing strategy below).
4. **Register screen.** Build `RegisterScreen`, full validation per the rules above, success modal per the modal contract, AsyncStorage write, OK→Login navigation. Component test suite covering: render, each validation reason, modal appearance on success, modal back-button intercept, navigation on OK, storage-failure UX.
5. **Login screen.** Build `LoginScreen`, validation against registered users + seed (lookup order per Precedence), auth state transition on success, inline error contract on failure (text, position, clear-on-next-input). Component test suite.
6. **Landing screen and end-to-end glue.** Build the empty landing screen with the bottom tab navigator. Wire the full flow (register → modal → login → landing). **Manual end-to-end run on the Android emulator** confirms consistent theming and the full happy path. (Detox / Maestro are out of scope for v1 — see Testing strategy.)

The user flips each phase's `ready` flag in `implementationplan.md` between phases, per workspace rules.

## Comprehensive feature list

- Register flow with `email`, `username`, `password`, `confirmPassword` fields, labels, placeholders, and a register button.
- Client-side form validation per the rules in **Form validation rules** above.
- "Registration successful" modal per the **Modal contract**, followed by navigation to login.
- Login flow with `username` and `password` fields, labels, placeholders, and a login button.
- Credential validation against registered users (AsyncStorage) and a hardcoded seed pair, per the **Precedence** rules.
- Inline login-error per the **Inline login-error contract**.
- Auth-gated navigation: the landing page and bottom tab navigator are unreachable without an authenticated session.
- Bottom tab navigator hosting the landing screen (single tab in v1, structure ready for additional tabs).
- Consistent theme: shared color palette, spacing scale, and typography scale used by all screens.
- Centralized labels in `labels/labels.json` with `en` defaults and the v1 key inventory above.
- Test coverage per component and per helper, per `codingprinciples.md` and the Testing strategy below.

## MVP definition

Everything in the feature list above is in-scope for v1. The app is the MVP — there is no further feature reduction.

Explicitly **out of scope** for v1:

- Logout flow.
- Password reset / forgot password.
- Password hashing or any real security treatment of stored credentials.
- Real backend or remote API.
- Persistence of login session across app restarts (auth state is in-memory only).
- Internationalization runtime switch (only `en` defaults are wired up; the JSON structure supports more languages).
- Additional tabs in the bottom tab navigator.
- Light/dark theme toggle (a single consistent theme for v1).
- Scripted end-to-end testing (Detox / Maestro). v1 verifies E2E manually on the AVD.

## Testing strategy

The workspace TDD rules (`engineeringprinciples.md`) apply in full. Project-specific decisions:

- **Coverage threshold:** Jest's `coverageThreshold` is configured at `global: { lines: 80, branches: 75, functions: 80, statements: 80 }`. This is a floor, not a goal — meaningful assertions are required regardless. Coverage is run in CI-equivalent fashion as part of phase definition-of-done.
- **Auth-gate test technique (phase 3):** the post-auth stack is verified unreachable when unauthenticated by _render-tree assertions_, not by attempting navigation:
  - Render `<AppNavigator />` with auth state set to `unauthenticated` and assert that the post-auth route components do not appear in the tree (e.g., `queryByText('landing_screen_title')` returns null).
  - Render `<AppNavigator />` with auth state set to `authenticated` and assert the same component IS in the tree.
  - This proves the unmount-based gate at the navigator level. No attempted-navigation-and-fail tests, because there's nothing to navigate to.
- **End-to-end testing (phase 6):** manual on the Android emulator for v1. The phase-6 definition-of-done includes a documented manual test script (register → modal → login → landing) that the user executes once on the AVD before signing off the phase. Detox / Maestro are not adopted for v1; revisit if the app grows.
- **Test naming:** "given [context], when [action], then [expected outcome]" per workspace rules. Apply to component tests, helper tests, and navigator tests alike.

## Local Deployment

- **Target:** Android Virtual Device running inside Android Studio.
- **Tooling:** Expo CLI (`npx expo`), Metro bundler, Android emulator launched from Android Studio's AVD Manager.
- **Run command:** `npx expo start`, then launch on the configured AVD via the Expo dev menu / `a` key.
- **Prerequisites (verified in phase 1 before any code is written, via the concrete commands listed under Phase 1 above):** Node 24.x (`node -v`), Android Studio + Android SDK (`sdkmanager --list_installed`), at least one configured AVD (`emulator -list-avds`). JDK comes bundled with Android Studio — no separate system Java install is required.
- **Hot reload:** enabled by default through Metro / Expo Fast Refresh.
- **Emulator must be running before `npx expo start`** for the `a` shortcut to bind to it. If no emulator is detected, Expo prints a clear error; this is treated as a manual prerequisite, not something the app handles.

## Live Deployment

Out of scope for v1. The app is run only on a local Android Virtual Device. No app store publishing, no Expo Application Services build/submit pipelines, no over-the-air updates.

## Open questions / unknowns

The following are **genuine unknowns** at architecture time. Items that were ambiguous in the previous draft (validation rules, modal contract, error contract, schema, label inventory, back-button behavior, precedence, testing technique, prerequisite gating, coverage threshold, E2E approach) have been resolved above and are no longer listed here.

- **Password storage for registered users.** v1 stores plaintext in `AsyncStorage`. Acceptable for a local evaluation app; flagged in `tobedone.md` should the project ever leave the eval scope.
- **Expo SDK 55 ↔ RN pin.** The architecture targets RN 0.85.x but defers to whatever Expo SDK 55 actually pins. Phase 1 records the result; if it differs, the table above is updated to match. Captured here only because the actual pin is not knowable until install.
- **React Navigation major version.** Same — targets 7.x, defers to whatever Expo SDK 55's docs recommend at bootstrap. Phase 1 records the result.
- **Android target API level.** Defaults to whatever Expo SDK 55's managed workflow targets. No specific API level required by the project.
- **Auth context vs. lightweight state library.** v1 uses React Context for the single auth flag. If post-auth state grows, revisit and consider Zustand/Redux Toolkit. Not a v1 decision.
- **Node 24.x compatibility with Expo SDK 55.** The Node pin was raised from 20.x LTS to 24.x on 2026-05-01 to match the host (`v24.14.1`). Expo SDK 55 was originally vetted against Node 20; Node 24 may or may not be officially supported. If `npx expo` install or bundler steps fail at any point in phase 1+, suspect Node mismatch first — fall back to Node 20 LTS via `nvm` and revert this pin. The phase 1 prereq verification will document the actual Node version observed during install.
