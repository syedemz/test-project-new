# Phase 5 brainstorm — Login screen

## 2026-05-09 brainstorm

Audit of `implementationplan/phase-5-login-screen.md` against the current code on `development`, the credential/storage/validation helpers shipped in phase 2, the auth + navigation skeleton from phase 3, and the patterns established in phase 4 (`RegisterScreen.tsx`, `jest.setup.ts`).

---

### HIGH — Drift since plan was written

**H1. `styles/styles.ts` does not exist.** Stories 5.1 (AC4 colour/spacing/typography) and 5.3 (AC2 "color is `styles.error`") reference `styles/styles.ts`. That folder was deleted in phase 2 story 2.0 (2026-05-05); design tokens live in `src/theme/theme.ts` + `src/theme/typography.ts` and are consumed via `useTheme()` from `@/theme/ThemeProvider`. `RegisterScreen.tsx` (the canonical reference) builds its `StyleSheet` from a `createStyles(theme)` factory and reads error colour via `theme.colors.status.error`. **Same drift the phase-4 brainstorm flagged for that PRD** — the PRDs were authored before phase 2 finalised the theme path.

**Concrete substitutions to apply when implementing:**
- AC 5.1.4 "`styles/styles.ts`" → "`@/theme/ThemeProvider` (`useTheme()`) for colours/spacing and `@/theme/typography.ts` for `textStyles`."
- AC 5.3.2 "`styles.error`" → "`theme.colors.status.error`."
- Anywhere a "raw English string" or "inline literal" rule appears, the alias is `@/labels/labels.json` and the token source is `@/theme/theme.ts` via `useTheme()`.

**H2. Existing tests reference `login-screen-stub`.** Story 5.1 AC6 says "the `testID="login-screen-stub"` is removed; a new stable testID `login-screen` is added." Six existing test files currently key off `login-screen-stub`:

- `__tests__/AppNavigator.test.tsx`
- `__tests__/AuthGate.test.tsx`
- `__tests__/AuthRoutes.test.tsx`
- `__tests__/AuthRoutes.backbutton.test.tsx`
- `__tests__/screens.stubs.test.tsx`

Phase 4 hit the identical problem with `register-screen-stub` and the subagent updated all references in-place (recorded in `context.md` under stories 4.1 and 4.2). Story 5.1 must do the same. **This is implicit work not enumerated in the AC list** — the subagent should be told to update every `login-screen-stub` reference in the test suite to `login-screen` as part of 5.1, otherwise the existing suite will go red the moment the stub is replaced.

**H3. Storage-error wiring is split awkwardly across 5.2 and 5.3.** Story 5.2 calls `credentialHelper.lookupCredential`, which can reject when `readUsers` throws (`storage_read_failed`). Story 5.2's ACs don't mention catching that rejection — they only describe the `{ ok: true }` / `{ ok: false }` branches. Story 5.3 then says "`login_storage_error` is rendered if `lookupCredential` rejects." If 5.2 lands without a try/catch around the await, the unhandled promise rejection will surface as a red test (or worse, a runtime crash on a real device). 5.3 then bolts the UI onto a try/catch that should already be there.

**Recommended fix:** in 5.2, require the submit handler to wrap the `lookupCredential` call in try/catch and **set internal state to a "lookup failed" condition without rendering UI** (mirroring the storyline in 4.2/4.3 where `storageError` was state in 4.2 and the modal UI was 4.3). The 5.2 acceptance test can spy on `signIn` not being called on rejection. Story 5.3 then wires the `login_storage_error` text to the existing state. This avoids a regression window between 5.2 and 5.3.

---

### MEDIUM — Test-harness pattern needs to be specified

**M1. Story 5.2's stack-swap assertion needs the AppNavigator harness.** AC 5.2.3 / 5.2.4 require asserting "the post-auth stack is now mounted (assert `landing-screen-stub` or the real LandingScreen testID present in the tree)." That assertion is only true for the full render tree `<ThemeProvider><AuthProvider><NavigationContainer><AppNavigator/></NavigationContainer></AuthProvider></ThemeProvider>`. Phase 3 story 3.5 established this exact harness and `__tests__/AppNavigator.test.tsx` ships it (with the `SignInTrigger` sibling pattern from story 3.7). The subagent should reuse that harness rather than reinventing it. **Brief should reference `__tests__/AppNavigator.test.tsx` as the harness reference.**

**M2. Story 5.2 "empty list" test depends on `jest.setup.ts`'s global AsyncStorage mock.** Story 4.2 (2026-05-09) introduced a global AsyncStorage mock via `jest.setup.ts` (`setupFilesAfterEach`) to stop cascading `NativeModule: null` failures. The 5.2 "empty list" test should use `AsyncStorage.clear()` (or per-test `AsyncStorage.getItem.mockResolvedValueOnce(null)`) on the same mock — not import the real `@react-native-async-storage/async-storage`. Brief should call this out so the subagent doesn't redo storage stubbing.

**M3. Story 5.2 AC6 storage rejection assertion lacks a label assertion.** AC 5.2's last bullet says the storage-error UI is in 5.3, but doesn't tell the implementer how to *flag* a storage failure internally in 5.2. Combined with H3 above, the simplest contract is: 5.2 maintains a boolean/string state (e.g. `storageErrorVisible`) that is true after a `lookupCredential` rejection; 5.3 binds it to the `login_storage_error` `<Text>`. **Brief should propose this minimal state surface so 5.2 and 5.3 are decoupled but consistent.**

---

### LOW — Specification polish

**L1. AC 5.2.4 wording is ambiguous about which password to use.** "Attempts login with `('abc', 'Test@123')`, asserts `signIn()` was NOT called and login resolved to a failure (the inline error rendering is in story 5.3 — this story asserts the failure path via `signIn` not being called, NOT via the error UI)." This is correct (registered username `abc` exists with password `Right1!`, attempting with the seed password `Test@123` should fail because the registered match short-circuits the seed). The wording is fine but worth flagging for the implementer that the test exercises the **precedence invariant**, not a generic password mismatch — `credentialHelper.ts` lines 67-74 are the contract under test.

**L2. AC 5.3.6 "replacing or alongside the credential error per implementer's choice, but consistent."** Pick one. The phase-4 RegisterScreen used a separate `storageError` state rendered in its own `<Text>`; mirroring that pattern is the path of least surprise. **Recommendation: use a separate `storageError` state with its own testID (`login-storage-error`) for the storage failure**, distinct from `login-inline-error`. That way the inline-credential-error tests don't have to disambiguate two label keys.

**L3. PRD `last_updated: 2026-04-30` is stale.** The bookkeeping convention in the project is to bump `last_updated:` on the PRD whenever a story flips `done: true`. This will be self-correcting as stories complete; just noting it so the subagent applies the bump consistently.

**L4. Story 5.1 navigation link copy.** AC 5.1.4 uses label key `login_link_to_register` ("Don't have an account? Register"). Confirmed present in `labels.json:13`. The reverse direction — Register → Login — currently happens via the success modal's OK button (story 4.3) but **not** via a "Already have an account? Sign in" link on the Register screen (`register_link_to_login` exists in labels.json:27 but no story has wired it). Out of scope for phase 5; just noting the asymmetry.

---

### External assumptions / dependencies — all valid

- `credentialHelper.lookupCredential` exists, signature `(string, string) => Promise<{ok: true} | {ok: false}>` ✓ (`src/Helper/credentialHelper.ts`).
- `useAuth().signIn(): void` ✓ (`src/auth/AuthContext.tsx:26`).
- `AUTH_ROUTES.REGISTER` ✓ (`src/navigation/AuthRoutes.tsx:15`).
- All required label keys present in `labels.json`: `login_screen_title`, `login_username_label/placeholder`, `login_password_label/placeholder`, `login_button`, `login_link_to_register`, `login_invalid_credentials`, `login_storage_error` ✓.
- `theme.colors.status.error` ✓ (`src/theme/theme.ts:89`).
- Global AsyncStorage mock from `jest.setup.ts` ✓.
- `ThemeProvider` is now wired into `App.tsx` root ✓ (PR #25 fix this session).

---

### Story scope check — no smuggling

- 5.1 strictly layout + Register-link navigation. No submit, no auth, no errors beyond field-format errors (and 5.1 doesn't even define field-level errors — those would be a Login UX choice that's not in v1 scope per `labels.json` having no `login_validation_*` keys).
- 5.2 strictly submit handler + lookup + signIn. No inline-error rendering.
- 5.3 strictly inline-error UI + auto-clear + storage-error.
- No phase-6 (LandingScreen, end-to-end glue) work leaks in. ✓

---

### Summary of recommended PRD edits before dispatch

1. **5.1 AC4** rewrite "`styles/styles.ts`" → "`@/theme/ThemeProvider` via `useTheme()`; typography from `@/theme/typography.ts`."
2. **5.1 AC6** add explicit follow-on: "All existing tests that reference `testID="login-screen-stub"` (six suites) are updated to the new `login-screen` testID in this story."
3. **5.2** add an AC for graceful handling of a `lookupCredential` rejection: catch the error and set an internal storage-error flag; do NOT crash, do NOT call `signIn`. Reference `__tests__/AppNavigator.test.tsx` as the harness for the "post-auth stack mounted" assertion.
4. **5.3 AC2** rewrite "`styles.error`" → "`theme.colors.status.error`."
5. **5.3 AC6** pick one path: separate `storageError` state with its own testID (`login-storage-error`).

If these edits are applied to the PRD, the subagent has zero ambiguity and the 5.2/5.3 split is clean. If not applied, the subagent can still proceed using the patterns established by RegisterScreen + AppNavigator, but tests written under the literal AC text will need to be re-interpreted at the moment of writing.

---

## 2026-05-09 brainstorm (re-run, post-PRD edit)

Confirmation pass against the updated `implementationplan/phase-5-login-screen.md` (`last_updated: 2026-05-09`). Re-audited every concern from the earlier section above and looked for new ones.

### Prior concerns — all addressed in PRD

- **H1 styles drift (5.1)** — AC reworded to "`@/theme/ThemeProvider` via `useTheme()`; typography from `@/theme/typography.ts`" with `createStyles(theme)` factory pattern explicit. ✓
- **H1 styles drift (5.3)** — `styles.error` → `theme.colors.status.error` from `@/theme/theme.ts` via `useTheme()`. ✓
- **H2 testID rename across existing suites** — 5.1 AC now enumerates the five known suites (`AppNavigator.test.tsx`, `AuthGate.test.tsx`, `AuthRoutes.test.tsx`, `AuthRoutes.backbutton.test.tsx`, `screens.stubs.test.tsx`) and tells the implementer to grep for `login-screen-stub` to confirm none missed. (Prior section said "six" — recount today shows exactly five test suites; the PRD's enumeration matches reality.) ✓
- **H3 storage-error wiring split** — 5.2 now has an explicit AC: try/catch wraps `lookupCredential`; on rejection sets a `storageErrorVisible` flag and does NOT call `signIn`. 5.3 binds the UI to that same flag. The 5.2/5.3 boundary is clean — no implicit-state regression window. ✓
- **M1 harness reference** — 5.2 AC3 explicitly references `__tests__/AppNavigator.test.tsx` and the `SignInTrigger` sibling pattern from phase 3 story 3.7. ✓
- **M2 AsyncStorage mock** — 5.2 AC3 calls out the global mock from `jest.setup.ts` and forbids importing the real `@react-native-async-storage/async-storage`. ✓
- **M3 minimal state surface** — `storageErrorVisible` named explicitly in 5.2; 5.3 binds to it via testID `login-storage-error`. ✓
- **L2 separate testID** — `login-storage-error` distinct from `login-inline-error` so credential-error tests don't disambiguate two label keys. ✓
- **L3 stale `last_updated`** — bumped to 2026-05-09. ✓

### New concerns — none surfaced

- All ACs remain testable (each has an explicit assertion target — testID, color value, mock spy, or rendered text).
- No scope smuggling: 5.1 = layout + Register-link nav; 5.2 = submit + lookup + signIn + storage-error flag; 5.3 = error-text UI + auto-clear + storage-error UI. Phase 6 work (LandingScreen, e2e glue) does not leak in.
- `depends_on` chain is correct: 5.1 → []; 5.2 → [5.1]; 5.3 → [5.2]. Strict linear order.
- External assumptions still hold:
  - `credentialHelper.lookupCredential` exists and matches the documented signature (`src/Helper/credentialHelper.ts`).
  - `useAuth().signIn(): void` (`src/auth/AuthContext.tsx:26`).
  - `AUTH_ROUTES.REGISTER` exported (`src/navigation/AuthRoutes.tsx:15`).
  - All required label keys present in `src/labels/labels.json`.
  - `theme.colors.status.error` present (`src/theme/theme.ts`).
  - Global AsyncStorage mock active in `jest.setup.ts`.
  - `ThemeProvider` wired into `App.tsx` root (PR #25).

### Note on a sibling artefact (not in scope for phase 5)

The "Already have an account? Sign in" link on the Register screen — `register_link_to_login` in `labels.json:27` — remains unwired. The Register→Login direction is currently handled only by the success-modal OK button (story 4.3). This asymmetry is intentional for v1 and explicitly out of scope for phase 5; phase 6 or a later cleanup can pick it up.

### Verdict

PRD is dispatch-ready. No new concerns. Recommend `proceed`.
