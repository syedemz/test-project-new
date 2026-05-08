# Phase 3 brainstorm — Auth state and navigation skeleton

## 2026-05-08 09:56 brainstorm

PRD audit against the five dimensions in /implement-phase Step 0. Source of truth:
`implementationplan/phase-3-auth-navigation.md`, `architecture.md`, current `src/`
tree (post phase-2 merge), `package.json`.

### F1 — External dependency not installed (blocker for 3.3, 3.4, 3.5)

`package.json` does NOT list any `@react-navigation/*` packages, nor
`react-native-screens` / `react-native-safe-area-context`. Stories 3.3
(`AuthRoutes` native-stack), 3.4 (`AppRoutes` bottom-tabs), and 3.5
(`AppNavigator` with `<NavigationContainer>`) all depend on these.

architecture.md Open Questions §254 says: *"React Navigation major version. …
targets 7.x, defers to whatever Expo SDK 55's docs recommend at bootstrap.
Phase 1 records the result."* — phase 1 did NOT record a result, and phase 2
did not install. Install is owed by phase 3.

**Recommendation:** the *first* navigation-using story (3.3) installs the four
packages via `npx expo install` and adds them to its own AC. Specifically:

- `@react-navigation/native`
- `@react-navigation/native-stack`
- `@react-navigation/bottom-tabs`
- `react-native-screens`
- `react-native-safe-area-context`

Plus `enableScreens()` per react-native-screens docs (or rely on the default
in v3+). The 3.3 brief should explicitly state "this is the install story for
react-navigation" so the user reviews the install diff in PR #1 of the phase
rather than buried in 3.5.

### F2 — Path ambiguity (`src/` vs repo-root) on every story

The PRD writes paths like `screens/LoginScreen.tsx`, `auth/AuthContext.tsx`,
`navigation/AuthRoutes.tsx` — bare, repo-relative. But phase 2 placed every
new module under `src/` (`src/Helper/`, `src/theme/`, `src/labels/`) and the
TS path alias `@/* → src/*` is wired in `tsconfig.json` and `babel.config.js`.

Phase 4's PRD has the same ambiguity (`screens/RegisterScreen.tsx`,
`styles/styles.ts`). Architecture.md uses the bare form too. Without a
ruling, story 3.1's "file paths stay stable so the navigator does not change"
contract risks landing files where phase-4 doesn't expect them.

**Recommendation:** rule that all phase-3 source lives under `src/`:
`src/screens/`, `src/auth/`, `src/navigation/`. Imports use the `@/` alias.
This matches the phase-2 convention that every test, helper, and theme file
already follows. If approved, every story's AC paths should be re-read with
`src/` prepended at dispatch time — no PRD edit strictly required, but
recording the decision in the brainstorm file makes it durable.

### F3 — `auth/` vs `context/` choice still open in 3.2

Story 3.2 AC1: *"`auth/AuthContext.tsx` (or `context/AuthContext.tsx`) …"* —
slash leaves the choice live. Pick one before dispatch so 3.5's import path
is determined.

**Recommendation:** `src/auth/AuthContext.tsx`. The slug also names the
phase ("Auth state and navigation skeleton") and groups the auth concept in
one folder. `context/` is generic and tends to accrete unrelated providers.

### F4 — 3.6 has non-testable acceptance criteria

3.6 AC1 ("On `LoginScreen` … no custom handler is registered") and AC3
("On `LandingScreen` … no custom handler is registered") are stated as
negative facts about absence of code. RTL/Jest cannot directly assert "no
`BackHandler.addEventListener` was ever called" without spying on the module
at the screen level — and even then, you're proving absence, which is
brittle.

AC2 (Register screen pops back to Login on hardware back) IS testable: mount
`<AuthRoutes />`, navigate to Register, fire `BackHandler` event, assert
Login is shown.

**Recommendation:** keep AC2 as the only test-backed AC. Treat AC1 and AC3
as code-review-only assertions ("no `BackHandler.addEventListener` import in
LoginScreen.tsx or LandingScreen.tsx") and let the dispatch brief say so
explicitly so the subagent doesn't write fragile spy tests.

### F5 — 3.4 tab label has no test coverage

3.4 AC1: tab labelled via `landing_tab_home_label`. 3.4 AC4: test asserts
`landing-screen-stub` testID is in the tree. The tab *label* (the bottom
tab's visible "Home" text) is never asserted. If a future change wires the
wrong label key, no test catches it.

**Recommendation:** add a one-line test assertion: `getByText(labels.landing_tab_home_label)`
exists. Trivial to add inside the existing 3.4 unit test.

### F6 — Stub testID stability across phases (informational)

Story 3.1 AC3 says paths and export names stay stable for phases 4–6. The
stubs use testIDs `login-screen-stub`, etc. Phase 4's PRD (story 4.1 AC7)
already commits to *removing* `register-screen-stub` and adding
`register-screen`. So the stub testIDs are deliberately temporary, only used
by phase-3 tests. No drift — just confirming the contract is internally
consistent.

### F7 — 3.5 AC4 prerequisite is satisfied

3.5 AC4: *"App.tsx is updated to render `<AuthProvider><AppNavigator /></AuthProvider>`
… (the phase 2 throwaway smoke-test harness has already been removed by
story 2.7)."* — confirmed via context.md 2026-05-07: "story 2.7 Leg B
complete — App.tsx reverted to phase-1 baseline". No drift.

### F8 — `depends_on` graph is correct

Topological order of phase-3 stories:

- Tier 0 (no deps): 3.1, 3.2
- Tier 1 (deps on 3.1): 3.3, 3.4
- Tier 2 (deps on 3.2 + 3.3 + 3.4): 3.5
- Tier 3: 3.6 (deps on 3.3, 3.5), 3.7 (deps on 3.5)

3.7 transitively depends on 3.2 via 3.5; explicit edge would be redundant.
3.6 transitively depends on 3.4 via 3.5; same. Graph is minimal and correct.

Serial dispatch order chosen for this run: **3.1 → 3.2 → 3.3 → 3.4 → 3.5 →
3.6 → 3.7**.

### F9 — `useAuth()` outside provider — error message convention (3.2)

3.2 AC4 says throw "an Error whose message names the missing provider". No
exact wording specified. Suggest: `"useAuth must be used within an AuthProvider"`
to match React Context idiom and make assertions stable. Subagent can pick;
worth flagging so the message isn't bikeshedded later.

### F10 — Architecture-defined Open Question still unresolved

Open Question §254 (React Navigation major version) needs to be closed by
this phase. After 3.3 installs, the actual major version (7.x or whatever
Expo SDK 55 resolves) should be recorded in architecture.md's pinned-version
table and the Open Questions section trimmed.

**Recommendation:** add this bookkeeping to story 3.5's `notes` (or as a
separate post-phase chore), or have the 3.3 subagent update architecture.md
as part of its install diff. Latter is cleaner.

---

### Summary of recommended actions before dispatch

1. **F1** — story 3.3 owns the `expo install` of react-navigation packages; brief makes this explicit.
2. **F2** — all phase-3 source under `src/screens/`, `src/auth/`, `src/navigation/`. Recorded here; no PRD edit required.
3. **F3** — pick `src/auth/AuthContext.tsx`.
4. **F4** — 3.6 AC1, AC3 are code-review-only; only AC2 has a test.
5. **F5** — add tab-label assertion to 3.4's unit test.
6. **F9** — pin the "outside provider" error message to `"useAuth must be used within an AuthProvider"`.
7. **F10** — story 3.3 records the resolved react-navigation major in architecture.md's pinned-version table and removes the corresponding Open Question entry.

No findings are blockers. Items 1, 2, 3, 4, 5, 9, 10 can be threaded into
dispatch briefs without editing the PRD. The PRD's stories themselves are
sound.

## 2026-05-08 10:04 brainstorm (re-run after PRD edits)

PRD was edited and committed in `65e08ad` to address the prior session's
findings F1–F5, F9, F10. Re-audit of the updated PRD against the same five
dimensions:

### Prior findings — verification

- **F1 (react-navigation install).** Story 3.3 AC1 now explicitly owns the
  `npx expo install @react-navigation/native @react-navigation/native-stack
  @react-navigation/bottom-tabs react-native-screens
  react-native-safe-area-context` step and pins package-lock as a
  deliverable. ✅ resolved.
- **F2 (path convention).** `context_summary` now states all phase-3
  source lives under `src/`. Every story AC that names a file path now
  uses `src/screens/`, `src/auth/`, or `src/navigation/`. ✅ resolved.
- **F3 (auth/ vs context/).** Story 3.2 AC1 pins `src/auth/AuthContext.tsx`
  (the `or context/` fork is gone). ✅ resolved.
- **F4 (3.6 non-testable ACs).** Story 3.6 now has three ACs explicitly
  tagged `(code-review only — F4)` for the absence-of-handler facts on
  Login and Landing, and `(test-backed)` for the Register-pop assertion.
  ✅ resolved.
- **F5 (3.4 tab-label coverage).** Story 3.4 AC5 added a tab-label text
  assertion to the existing unit test. ✅ resolved.
- **F9 (error message wording).** Story 3.2 AC4 pins the exact string
  `'useAuth must be used within an AuthProvider'`. ✅ resolved.
- **F10 (open question §254).** Story 3.3 AC2 owns updating
  architecture.md's pinned-version table and removing Open Question §254.
  ✅ resolved.

### New findings from the re-audit

- **N1 (cosmetic — story 3.3 title).** The title still reads "Implement
  navigation/AuthRoutes.tsx (pre-auth stack)" but the story now also
  installs five npm packages and edits architecture.md. The title
  understates the scope. **Verdict:** non-blocking; the AC list is the
  source of truth. Skip.
- **N2 (jest-expo transform-ignore-patterns).** Phase-2's `jest.config.js`
  uses the `jest-expo` preset, which by default does NOT transform
  `node_modules` except for an Expo-aware allowlist. Once
  `@react-navigation/*` is installed, the test runner may fail with
  `SyntaxError: Cannot use import statement outside a module` when 3.3's
  unit test mounts `<NavigationContainer>`. The `jest-expo` preset's
  `transformIgnorePatterns` already includes `@react-navigation`, so this
  *should* be a non-issue — but if it isn't, story 3.3 is the place to
  notice and patch. **Verdict:** flag in 3.3's brief as a known
  potential-friction point; let the subagent diagnose if it bites.
- **N3 (`enableScreens` for react-native-screens).** react-native-screens
  v3+ enables screens by default; no manual `enableScreens()` call is
  required. The `<NavigationContainer>` will work out of the box.
  **Verdict:** informational; the subagent can call it out in the PR
  description if it explicitly verifies the package version is ≥ v3.
- **N4 (story 3.7 `landing-screen-stub` rendering through tabs).** Story
  3.7 AC2 forces `isAuthenticated: true` and asserts
  `landing-screen-stub` IS in the tree. The post-auth stack renders
  `<AppRoutes />`, which is a bottom-tab navigator that mounts its
  initial-route screen by default — so `<LandingScreen />` (the stub)
  will be in the tree. **Verdict:** sanity-checked, no concern. The
  test should also tolerate `getAllByTestId` because if any future tab
  also stamps the stub, multiple matches will surface — but with v1's
  one-tab navigator, single-match is fine.
- **N5 (App.tsx unmodified by phase 2 — still true).** Verified clean
  via `git log` — App.tsx is at the phase-1 baseline `b6ce83d` per
  context.md 2026-05-07. Story 3.5 AC4 is therefore safe.

### Conclusion

All blockers resolved. Findings N1–N5 are either cosmetic, informational,
or sanity checks that warrant a note in the dispatch brief but no PRD
edit. Dispatch order unchanged: **3.1 → 3.2 → 3.3 → 3.4 → 3.5 → 3.6 →
3.7**.
