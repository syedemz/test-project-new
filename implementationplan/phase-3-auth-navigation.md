phase: 3
title: Auth state and navigation skeleton
last_updated: 2026-05-08 (story 3.5)

context_summary: |
  Build the in-memory auth provider, the AppNavigator that swaps stacks based on
  auth state, and the pre-auth and post-auth route trees, plus the bottom tab
  navigator that hosts the post-auth landing route. To satisfy the auth-gate
  render-tree tests, this phase ships stub screen components for Login, Register,
  and Landing — phases 4, 5, and 6 replace those stubs with real screens.

  Path convention: all phase-3 source lives under `src/` (settled by the
  2026-05-08 brainstorm — F2). Specifically: `src/screens/`, `src/auth/`,
  `src/navigation/`. Imports use the `@/` alias (`@/screens/...`, `@/auth/...`,
  `@/navigation/...`). This matches the phase-2 convention that placed
  `src/Helper/`, `src/theme/`, `src/labels/` under `src/`. Architecture.md and
  the PRD use bare paths (`screens/`, `navigation/`) as a folder *naming*
  convention, not a repo-root location.

  External dependency: react-navigation is NOT yet installed. Story 3.3 owns
  the `npx expo install` of `@react-navigation/native`,
  `@react-navigation/native-stack`, `@react-navigation/bottom-tabs`,
  `react-native-screens`, `react-native-safe-area-context`, and resolves
  architecture.md Open Question §254 (the actual react-navigation major).

stories:
  - id: 3.1
    title: Stub screen components for Login, Register, and Landing
    agent: frontenddeveloper
    done: true
    depends_on: []
    acceptance_criteria:
      - "Three files exist: `src/screens/LoginScreen.tsx`, `src/screens/RegisterScreen.tsx`, `src/screens/LandingScreen.tsx`. Each is a single-line functional component that renders a `<View>` with a stable `testID` (`login-screen-stub`, `register-screen-stub`, `landing-screen-stub` respectively)."
      - "Each stub also renders a `<Text>` whose value is the corresponding label key from `src/labels/labels.json` (`login_screen_title`, `register_screen_title`, `landing_screen_title`) — wired through a direct import, NOT a runtime label resolver."
      - "Phases 4, 5, and 6 will replace the body of these files with real screens; the file paths and the export names stay stable so the navigator does not change."
      - "A unit test renders each stub via React Native Testing Library and asserts the `testID` is in the tree."
    notes: ""

  - id: 3.2
    title: Implement auth context/provider (in-memory)
    agent: frontenddeveloper
    done: true
    depends_on: []
    acceptance_criteria:
      - "`src/auth/AuthContext.tsx` exports a typed React Context plus an `<AuthProvider>` component plus a `useAuth()` hook. Folder is `src/auth/` (settled in the 2026-05-08 brainstorm — F3, chosen over `src/context/`)."
      - "`useAuth()` returns `{ isAuthenticated: boolean; signIn: () => void; signOut: () => void }`."
      - "Initial state is `isAuthenticated: false`. `signIn()` flips it to true; `signOut()` flips it to false. State is in-memory only — no persistence (architecture.md explicitly excludes session persistence from v1)."
      - "Calling `useAuth()` outside an `<AuthProvider>` throws `new Error('useAuth must be used within an AuthProvider')` (exact string, settled in the 2026-05-08 brainstorm — F9). A unit test asserts this exact message."
      - "Unit tests cover: initial state is unauthenticated, `signIn` transitions to authenticated, `signOut` transitions back, throw outside provider with the exact message above."
    notes: ""

  - id: 3.3
    title: Implement navigation/AuthRoutes.tsx (pre-auth stack)
    agent: frontenddeveloper
    done: true
    depends_on:
      - 3.1
    acceptance_criteria:
      - "**Install step (this story owns it).** `npx expo install @react-navigation/native @react-navigation/native-stack @react-navigation/bottom-tabs react-native-screens react-native-safe-area-context` is run; `package.json` records the resolved versions; `package-lock.json` is committed. Ownership is settled in the 2026-05-08 brainstorm — F1 (no other phase-3 story installs these)."
      - "**Architecture.md bookkeeping.** The resolved `@react-navigation/native` major version is added to architecture.md's pinned-version table, and the corresponding entry in the Open Questions section (§254 — \"React Navigation major version\") is removed. Settled in the 2026-05-08 brainstorm — F10."
      - "`src/navigation/AuthRoutes.tsx` exports a single React Navigation native-stack navigator containing two screens: `Login` (renders `<LoginScreen />`) and `Register` (renders `<RegisterScreen />`)."
      - "The initial route is `Login`."
      - "Route names are exported as a typed enum or const (`AUTH_ROUTES.LOGIN = 'Login'`, `AUTH_ROUTES.REGISTER = 'Register'`) so other code references them symbolically, not as raw strings."
      - "A unit test renders `<AuthRoutes />` inside a `<NavigationContainer>` and asserts the `login-screen-stub` testID is in the tree (initial route = Login)."
    notes: ""

  - id: 3.4
    title: Implement navigation/AppRoutes.tsx with bottom tab navigator hosting Landing
    agent: frontenddeveloper
    done: true
    depends_on:
      - 3.1
    acceptance_criteria:
      - "`src/navigation/AppRoutes.tsx` exports a bottom-tab navigator with a single tab labelled via the `landing_tab_home_label` label key. The tab renders `<LandingScreen />`."
      - "Route names are exported as a typed enum/const (`APP_ROUTES.LANDING = 'Landing'`)."
      - "The tab bar is visible in v1 (a deliberate choice — the structure is in place for additional tabs later, and showing the bar with one tab matches what phase 6's manual E2E run will confirm). This decision is recorded in the story PR description."
      - "A unit test renders `<AppRoutes />` inside a `<NavigationContainer>` and asserts the `landing-screen-stub` testID is in the tree."
      - "The same unit test asserts the tab label text is present, sourced from the `landing_tab_home_label` label key (e.g., `getByText(labels.landing_tab_home_label)`). Added in the 2026-05-08 brainstorm — F5: previously the tab *label key wiring* had no test coverage."
    notes: ""

  - id: 3.5
    title: Implement navigation/AppNavigator.tsx (auth-gated stack swap)
    agent: frontenddeveloper
    done: true
    depends_on:
      - 3.2
      - 3.3
      - 3.4
    acceptance_criteria:
      - "`src/navigation/AppNavigator.tsx` reads `isAuthenticated` from `useAuth()` and conditionally renders `<AuthRoutes />` when false or `<AppRoutes />` when true."
      - "The conditional is a top-level branch; the inactive stack is unmounted entirely (NOT hidden via display: none, NOT kept in the tree). Architecture.md's auth-gate guarantee depends on this."
      - "`<AppNavigator />` wraps its output in a single `<NavigationContainer>`; consumers only render `<AppNavigator />` (and an outer `<AuthProvider>`)."
      - "`App.tsx` is updated to render `<AuthProvider><AppNavigator /></AuthProvider>` and nothing else (the phase 2 throwaway smoke-test harness has already been removed by story 2.7)."
    notes: ""

  - id: 3.6
    title: Wire Android hardware back-button behavior at the auth boundary
    agent: frontenddeveloper
    done: false
    depends_on:
      - 3.3
      - 3.5
    acceptance_criteria:
      - "**(code-review only — F4)** `src/screens/LoginScreen.tsx` contains no `BackHandler.addEventListener` call and no `useFocusEffect` wrapping a `BackHandler` subscription — i.e. no custom hardware-back handler is registered on Login. Default OS behavior (exit app) applies. Verified by inspection of the file's imports and body during PR review; not asserted by an automated test (proving absence of a side-effect via spies is fragile)."
      - "**(code-review only — F4)** `src/screens/LandingScreen.tsx` contains no `BackHandler.addEventListener` call and no `useFocusEffect` wrapping a `BackHandler` subscription — i.e. no custom hardware-back handler is registered on Landing. Logout-on-back is explicitly NOT wired (architecture.md excludes logout from v1). Verified by file inspection during PR review."
      - "**(test-backed)** On `RegisterScreen` (pushed from Login), the hardware back button pops back to `LoginScreen` — verified by a test that mounts `<AuthRoutes />`, navigates to Register, fires the `hardwareBackPress` event via `BackHandler`, and asserts the navigator is back on Login (e.g., `login-screen-stub` testID is in the tree, `register-screen-stub` is not)."
      - "The registration-success-modal back-button intercept is NOT in this story — it is wired in phase 4 (story 4.3) where the modal lives."
    notes: ""

  - id: 3.7
    title: Auth-gate render-tree tests
    agent: frontenddeveloper
    done: false
    depends_on:
      - 3.5
    acceptance_criteria:
      - "A test renders `<AuthProvider><AppNavigator /></AuthProvider>` with the auth state forced to unauthenticated, queries the rendered tree, and asserts that `landing-screen-stub` is NOT in the tree (use `queryByTestId` returning null)."
      - "The same test setup with auth state forced to authenticated asserts that `landing-screen-stub` IS in the tree, and that `login-screen-stub` is NOT."
      - "Toggling the auth state from unauthenticated to authenticated within the same render unmounts the pre-auth stack and mounts the post-auth stack — verified by a test that calls `signIn()` and re-asserts the tree contents."
      - "These tests assert at the render-tree level only — no attempted-navigation tests, no routing assertions across the gate (per architecture.md \"Auth-gate test technique\")."
    notes: ""
