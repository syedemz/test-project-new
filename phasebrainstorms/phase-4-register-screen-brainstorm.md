# Phase 4 brainstorm — Register screen

## 2026-05-08 14:30 brainstorm

Audit of `implementationplan/phase-4-register-screen.md` against the current code on `development`, `architecture.md`, the existing label inventory in `src/labels/labels.json`, and the validators in `src/Helper/validationHelper.ts`.

---

### HIGH — Drift since plan was written

**H1. `styles/styles.ts` does not exist.** Stories 4.1 ACs (and the spirit of 4.2/4.3) reference `styles/styles.ts` and `styles.error`. The phase 2 work deleted the empty `styles/` placeholder folder (story 2.0, 2026-05-05) and built a richer theme system instead at `src/theme/` (`theme.ts`, `typography.ts`, `ThemeProvider.tsx`, `index.ts`). Every existing screen pulls colors via `useTheme()` from the provider, not from a flat `styles` module. The PRD is referring to a file that was renamed/replaced two phases ago.

  **Concrete impact on AC wording:**
  - AC1.3 "color is `styles.error`" → should be `useTheme().colors.status.error` (the existing token at `src/theme/theme.ts` line 89 maps `palette.error: '#E63946'` → `lightColors.status.error`).
  - AC1.6 "All colors, spacing, and typography are sourced from `styles/styles.ts`" → should read "sourced from `src/theme/theme.ts` via `useTheme()` (or the typography helpers in `src/theme/typography.ts`). No inline color or spacing literals."
  - The same substitution applies anywhere else in the PRD that names `styles/`.

**H2. Label-import path uses the `@/` alias.** Phase 2 wired the `@/*` → `src/*` alias in `tsconfig.json` and `babel.config.js`. The phase-3 stub already imports `@/labels/labels.json`. AC text that says "`labels/labels.json`" should be read as "`@/labels/labels.json`" (the project convention) — not a regression, but worth stating explicitly so the subagent doesn't introduce a relative-path island.

---

### MEDIUM — Non-testable / under-specified ACs

**M1. Validation-reason → label-key mapping is implicit.** `validationHelper` returns many reason strings per field (4 for username, 2 for email, 5 for password) but `labels.json` ships only one error label per field (`register_validation_username_invalid`, `register_validation_email_invalid`, `register_validation_password_weak`). The PRD never states how reasons collapse onto labels.

  **Recommended fix:** add an explicit mapping line to story 4.1 ACs:
  - any `username_*` reason → `register_validation_username_invalid`
  - any `email_*` reason → `register_validation_email_invalid`
  - any `password_*` reason except `password_mismatch` → `register_validation_password_weak`
  - `password_mismatch` → `register_validation_password_mismatch`
  - in-use collisions (added by 4.2) → `*_in_use` keys
  - storage failure → `register_storage_error`

  Without this, the subagent will guess and tests will codify the guess.

**M2. Story 4.2 AC6 ("expose success state via test-only assertion") is awkward.** The AC asks the test to assert "the modal trigger condition is true (e.g., a state hook returns true, OR the modal component is now in the tree if 4.3 has already merged)." Stories run serially — at the moment 4.2 lands, 4.3 has *not* merged, so the "OR" branch is dead. That leaves two bad options: assert internal React state (anti-pattern), or add a hidden `testID` that exists only to satisfy the test and gets repurposed in 4.3.

  **Recommended fix:** replace AC6 with a behavior-only assertion: "after a valid submit, `storageHelper.writeUsers` is called exactly once with the expected `StoredUser` record (verified via spy). The current absence of a modal in this story is acceptable — modal rendering is asserted by 4.3." This keeps 4.2 testable without leaking implementation details across stories.

**M3. Story 4.3 AC5 tap-outside-to-dismiss test is likely vacuous.** React Native's `<Modal>` does not render a backdrop element you can press unless you build one yourself (Paper / native-modal libraries do; bare RN does not). If the implementation uses bare `<Modal transparent>`, there is no element to fire a press event on, so the test "fires a press event on the modal backdrop and asserts the modal is still rendered" cannot run as written.

  **Recommended fix:** rephrase AC5 to a structural assertion — "the Modal component does not pass any `onBackdropPress`/`onDismiss`/touchable-overlay handler that closes the modal; only the OK button and hardware back close it" — or drop AC5 entirely (the negative property is implied by the absence of dismiss handlers).

**M4. Hardware back interception mechanism is over-specified.** Story 4.3 AC4 prescribes `BackHandler.addEventListener` registered on modal-open and unregistered on modal-close. RN's `<Modal>` already exposes `onRequestClose` for exactly this Android-back case, and is the more idiomatic / less leaky choice (no listener lifecycle bug class). The current AC will be obeyed literally and produce slightly weirder code than necessary.

  **Recommended fix:** rewrite AC4 to be implementation-neutral: "Pressing Android hardware back while the modal is open triggers the same handler as OK (dismiss + navigate to Login). Implementation may use `Modal.onRequestClose` or a `BackHandler` listener; the test fires a `hardwareBackPress` event and asserts navigation occurred." (The phase-3 story 3.6 test established that the jest-expo iOS-platform `BackHandler` no-op + spy-capture pattern works; a `Modal.onRequestClose` test path would be even simpler — just call the prop directly.)

---

### LOW — Smuggled / missing scope

**L1. `register_link_to_login` label exists but no AC references it.** `labels.json` ships `register_link_to_login` ("Already have an account? Sign in"). Architecture.md §123-124 lists it under the "Register screen" label inventory but does not name a hard requirement to render it. Phase 5 will add `login_link_to_register` symmetrically. Decision needed: **render it on RegisterScreen as part of 4.1 (and add an AC + test), or explicitly defer to phase 5/6 glue**. Either is fine — silence is the problem.

**L2. Username storage casing under-specified.** Story 4.2 AC4 says `username` is "stored in original case", but architecture.md §47 also requires trimming at register. The AC should explicitly state "trimmed, original case" so a subagent doesn't conclude the raw input (with leading spaces) is what gets persisted.

**L3. `navigation` prop access in 4.3 is implicit.** Story 4.3 AC3 references `navigation.navigate(AUTH_ROUTES.LOGIN)`. `RegisterScreen` is currently a plain `React.FC` with no params. The subagent will need to either accept `NativeStackScreenProps<AuthStackParamList, typeof AUTH_ROUTES.REGISTER>` or call `useNavigation<NativeStackNavigationProp<AuthStackParamList>>()`. Minor — leave to the subagent — but worth flagging because the test harness will need to wrap with `NavigationContainer`.

**L4. First-render no-error assertion.** AC1.3 says inline errors are "initially hidden". The component-test list at the bottom of 4.1 should include an explicit "on initial render, no validation error labels are in the tree" assertion. Currently implied, not stated.

---

### depends_on review

`4.1 → 4.2 → 4.3` is correct. Each story strictly extends the prior one's surface (layout → submit logic → modal). No missing or unnecessary edges.

---

### External assumptions (validated)

- ✅ `@react-native-async-storage/async-storage@2.2.0` installed (phase 2.0).
- ✅ `storageHelper.readUsers` / `writeUsers` exist with the documented `StoredUser` shape and `storage_*_failed` error contract (phase 2.4).
- ✅ All four validators exist with the documented reason vocabulary (phase 2.5).
- ✅ Theme tokens (`colors.status.error`, spacing scale, typography helpers) exist via `useTheme()` (phase 2.1).
- ✅ All label keys named in this PRD's ACs are present in `src/labels/labels.json`.
- ✅ `AuthRoutes` already wires `RegisterScreen` under `AUTH_ROUTES.REGISTER`; the file path and default export name need only be preserved (AC1.7 is correct on this point).

---

### Recommendation

The PRD is **structurally sound** — three stories, clean dependency chain, behavior testable end-to-end. The issues above are surface-level wording fixes that the subagent could plausibly muddle through, but H1 (the `styles/styles.ts` ghost reference) is the kind of drift that reliably causes a subagent to either invent a file or stall asking. M1 (validation-reason → label mapping) is the second most likely source of test churn.

If you choose **address**, the high-leverage edits are H1, H2, M1, M2, M3, M4, plus a one-line decision on L1 (`register_link_to_login`).

If you choose **proceed**, the dispatch briefs to the subagent will need to inline these substitutions explicitly, because the PRD as written points at things that don't exist.
