phase: 5
title: Login screen
last_updated: 2026-05-09

context_summary: |
  Replace the LoginScreen stub with the real login flow: form layout, credential
  lookup against registered users + seed (precedence per credentialHelper),
  auth-state transition on success, and the inline-error contract on failure.
  After this phase, the full register-then-login round-trip works against the
  pre-auth stack; the post-auth stack is reachable only via successful sign-in.
  Phase 6 builds the real landing screen and runs the manual end-to-end test.

stories:
  - id: 5.1
    title: Build LoginScreen layout with username and password fields
    agent: frontenddeveloper
    done: false
    depends_on: []
    acceptance_criteria:
      - "`screens/LoginScreen.tsx` renders a screen titled via `login_screen_title`. It contains two `<TextInput>` controls for `username` and `password`, each with a label and `placeholder` populated from the corresponding `login_username_label`/`login_username_placeholder`/`login_password_label`/`login_password_placeholder` label keys."
      - "Password input has `secureTextEntry={true}`. Username input has `autoCapitalize=\"none\"`."
      - "A login button is rendered with label `login_button`."
      - "A link to the Register screen is rendered with label `login_link_to_register` that calls `navigation.navigate(AUTH_ROUTES.REGISTER)` on press. A test asserts the navigation call fires when the link is pressed."
      - "All copy is sourced from `@/labels/labels.json` — no raw English strings. All colors and spacing come from `@/theme/ThemeProvider` via `useTheme()`; typography uses `textStyles` from `@/theme/typography.ts`. No inline literals. Build the `StyleSheet` via a `createStyles(theme)` factory mirroring the pattern in `screens/RegisterScreen.tsx`. (Note: `styles/styles.ts` was removed in phase 2 story 2.0; the theme path is canonical.)"
      - "The screen replaces the body of the phase-3 stub; file path and default export stay stable. The `testID=\"login-screen-stub\"` is removed; a new stable testID `login-screen` is added to the screen root. As part of this story, every existing test that references `testID=\"login-screen-stub\"` is updated to the new `login-screen` testID — known suites: `__tests__/AppNavigator.test.tsx`, `__tests__/AuthGate.test.tsx`, `__tests__/AuthRoutes.test.tsx`, `__tests__/AuthRoutes.backbutton.test.tsx`, `__tests__/screens.stubs.test.tsx` (grep for `login-screen-stub` to confirm none are missed). Mirrors the `register-screen-stub` rename done in phase 4."
      - "Submit handling, credential lookup, auth-state transitions, and the inline error are NOT in this story — they are stories 5.2 and 5.3."
      - "Component test covers: render with default state, navigation link triggers the Register navigation."
    notes: ""

  - id: 5.2
    title: Wire login submit with credential lookup and auth-state transition
    agent: frontenddeveloper
    done: false
    depends_on:
      - 5.1
    acceptance_criteria:
      - "Tapping the login button calls `credentialHelper.lookupCredential(username, password)` with the trimmed username and the password as-typed (no trim)."
      - "On `{ ok: true }`, the screen calls `useAuth().signIn()` — the auth context flips to authenticated, and `AppNavigator` swaps to the post-auth stack on the next render. The LoginScreen does NOT call `navigation.navigate` on the post-auth route directly; the stack swap is the gate."
      - "Architecture's \"empty registered list on first run\" anchor: a test seeds AsyncStorage to empty (use the global AsyncStorage mock from `jest.setup.ts` — call `AsyncStorage.clear()` or `AsyncStorage.getItem.mockResolvedValueOnce(null)` for the per-test override; do NOT import the real `@react-native-async-storage/async-storage`), attempts login with `(\"testuser\", \"Test@123\")`, asserts `signIn()` was called and the post-auth stack is now mounted (assert `landing-screen-stub` or the real LandingScreen testID present in the tree). Use the full-render harness `<ThemeProvider><AuthProvider><NavigationContainer><AppNavigator/></NavigationContainer></AuthProvider></ThemeProvider>` — reuse the harness already established in `__tests__/AppNavigator.test.tsx` (including the `SignInTrigger` sibling pattern from phase 3 story 3.7) rather than reinventing it."
      - "Architecture's \"registered users take precedence over seed\" anchor: a test pre-populates AsyncStorage with `{ username: \"abc\", password: \"Right1!\" }`, attempts login with `(\"abc\", \"Test@123\")`, asserts `signIn()` was NOT called and login resolved to a failure (the inline error rendering is in story 5.3 — this story asserts the failure path via `signIn` not being called, NOT via the error UI)."
      - "Username comparison is case-insensitive and whitespace-tolerant — verified by tests that log in with `\"  TestUser  \"` against the seed and assert success."
      - "Component tests cover: success against seed on empty list, success against a registered user, failure against unknown username, failure against wrong password, case-insensitive match, whitespace-trimmed match, registered-precedence-over-seed."
      - "Storage failure handling: the submit handler wraps the `lookupCredential` call in try/catch. On rejection (e.g. `storage_read_failed` surfaced from `storageHelper`), the handler MUST NOT call `signIn()`, MUST NOT crash, and MUST set an internal storage-error flag (a separate state field, e.g. `storageErrorVisible: boolean`, distinct from any credential-error state). The storage-error UI itself is wired in story 5.3 against this same state. A test mocks `lookupCredential` to reject and asserts `signIn()` is NOT called and no unhandled promise rejection escapes."
      - "The inline credential error and storage-error UI are NOT rendered in this story — story 5.3 wires both."
    notes: ""

  - id: 5.3
    title: Implement inline login-error per the architecture contract
    agent: frontenddeveloper
    done: false
    depends_on:
      - 5.2
    acceptance_criteria:
      - "On a failed login (per story 5.2), an inline error `<Text>` is rendered directly below the login button with the copy from `login_invalid_credentials`. Position: a single line directly below the button — NOT above the fields, NOT next to a specific field. A test asserts the rendered position by querying the tree order (or by an explicit testID like `login-inline-error` whose layout is asserted against the button's testID)."
      - "Color is `theme.colors.status.error` from `@/theme/theme.ts`, accessed via `useTheme()` in a `createStyles(theme)` factory (mirroring `screens/RegisterScreen.tsx`). A test asserts the rendered color matches `theme.colors.status.error`."
      - "The error text is generic — does not distinguish \"no such user\" from \"wrong password\". Both failure modes render the same `login_invalid_credentials` copy. A test verifies this by attempting both failure modes and asserting identical rendered text."
      - "The error is automatically cleared on the next change to either field. Specifically: after the error is visible, firing `onChangeText` on the username input clears the error from the tree; same for the password input. Two separate tests cover both fields."
      - "On a successful login (per story 5.2), the inline error is NOT rendered."
      - "A separate storage-error `<Text>` is rendered with the copy from `login_storage_error`, bound to the `storageErrorVisible` state set in story 5.2. It uses its own stable testID `login-storage-error`, distinct from `login-inline-error` — so credential-error tests do not have to disambiguate two label keys. The credential error and the storage error are independent surfaces (mirrors the phase-4 `RegisterScreen` pattern of a separate `storageError` state with its own `<Text>`). A test mocks `credentialHelper.lookupCredential` to reject, asserts the `login-storage-error` text renders with the `login_storage_error` copy, asserts the `login-inline-error` is NOT rendered, and asserts `signIn()` was NOT called."
    notes: ""
