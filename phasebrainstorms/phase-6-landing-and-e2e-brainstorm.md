# Phase 6 brainstorm — Landing screen and end-to-end glue

## 2026-05-10 brainstorm

Critique pass against `implementationplan/phase-6-landing-and-e2e.md` (rewritten in PR #30, last_updated 2026-05-09). Cross-referenced against `architecture.md`, `babel.config.js`, `tsconfig.json`, `src/theme/theme.ts`, `src/labels/labels.json`, `src/screens/LandingScreen.tsx` (current stub), `src/navigation/AppRoutes.tsx`, and the screenshots in `.claude/screenshots/`.

The PRD lists 7 unresolved tensions in story 6.1 notes. The findings below either (a) sharpen those tensions with concrete evidence, (b) surface gaps the PRD did not anticipate, or (c) flag PRD-internal contradictions.

---

### MUST resolve before dispatch (concrete bugs / contradictions in the PRD)

**B1. Asset path / module-resolver mismatch — code will not bundle as written.**
- `babel.config.js` and `tsconfig.json` both alias `@` to `./src`. So `require('@/assets/images/sample.jpg')` resolves to `./src/assets/images/sample.jpg`.
- Story 6.1 AC `[asset]` says copy `sample.jpg` to **`assets/images/`** (project root, alongside the existing `assets/` folder that holds icons/splash).
- Story 6.1 AC `[dummy data]` says reference it via `require('@/assets/images/sample.jpg')`.
- These two ACs are inconsistent. Fix: either (i) copy to `src/assets/images/sample.jpg` and keep the `@` alias, or (ii) keep `assets/images/` at the project root and use a relative require (`require('../../assets/images/sample.jpg')`). Option (ii) matches the existing `assets/` convention used by Expo for icons; option (i) keeps everything under `src` and matches the alias strategy. Pick one before dispatch.

**B2. Test AC `[component tests]` (h) targets the wrong element.**
- The AC asserts `StyleSheet.flatten(landing-bottom-banner.props.style).backgroundColor === lightColors.text.premium`.
- But AC `[bottom banner content]` describes the bottom banner as **two stacked rows**: a gold strip (using `text.premium`) and an inner card (using `bg.premium`). The outer container has no single backgroundColor.
- Fix: add a `testID="landing-banner-gold-strip"` to the top row and target that, or rewrite the assertion against a child element.

**B3. PRD-internal contradiction on the tab-bar question (tension #7).**
- Story 6.1 notes say tension #7 is unresolved and lists three options, including (a) hide the tab bar via `tabBarStyle: { display: 'none' }` and (b) keep it visible.
- But AC `[AppRoutes integration test]` asserts "the tab labelled `landing_tab_home_label` is still rendered; the bottom tab navigator from phase 3 story 3.4 remains visible (testID continuity)" — that pre-decides option (b) in the test.
- The screenshots show NO tab bar at the bottom, so the visual match is option (a).
- Fix: resolve the tension here, then either (i) keep the AC if option (b) wins, or (ii) rewrite the AC to assert the navigator is mounted but the tab-bar UI is hidden (`tabBarStyle.display === 'none'`) if option (a) wins. The phase-3 contract that mattered was "navigator stays mounted so phase-3 wiring is preserved" — that survives both options.

**B4. Label/data redundancy on `Match!`.**
- AC `[labels.json policy]` adds `landing_match_label: "Match!"`.
- AC `[dummy data]` specifies `marriageIntentions.matchLabel: 'Match!'` in the dataset.
- The PRD's own rule ("per-chip labels live in dataset, screen copy lives in labels.json") implies `Match!` is generic UI copy, not data — should come from labels.json. Drop `marriageIntentions.matchLabel` from the dataset (or vice versa). Pick one source.

**B5. architecture.md amendments are both scope AND back-button.**
- Tension #1 in the PRD frames the divergence as a scope question (empty placeholder vs. full profile card). Confirmed via `architecture.md` lines 30, 36, 202 — all explicitly state v1 landing is empty.
- But there is a SECOND, separate amendment: line 109 says "LandingScreen (post-auth root) — Default exit-app behavior. Back-button is **not** wired to log out for v1; logout is out of scope." This DIRECTLY conflicts with story 6.1 AC `[header content]` (X tap calls `signOut()`) and story 6.2 check 9q.
- The PRD's tension #2 frames X→signOut as a UX preference, but it is also an architecture.md amendment. If X→signOut wins, architecture.md line 109 must be updated in the same PR.

---

### SHOULD decide before dispatch (judgment calls that shape the work)

**S1. Story 6.1 size — split into 6.1a / 6.1b / 6.1c?**
- 14 ACs total, with `[scroll body sections]` alone bundling 13 ordered sub-sections. Reasonable estimate ≥ 8h of focused work.
- Risks of single-story: a mid-PR failure leaves the screen in a half-rendered state; the test file (`LandingScreen.test.tsx`) becomes large enough to be hard to review; rollback is all-or-nothing.
- Risks of splitting: three PRs instead of one; intermediate states (6.1a after merge: hero + banner, no scroll body) are visually incomplete on the emulator; story 6.2/6.3 dispatch must wait for 6.1c.
- Recommendation: split into the suggested 6.1a/6.1b/6.1c. The screen is only fully functional after 6.1c, but each intermediate is independently testable and reviewable.

**S2. SafeAreaProvider mounting — undeclared dependency.**
- AC `[header content]` says "use `react-native-safe-area-context` hooks if not already imported." For `useSafeAreaInsets()` to return non-zero, `App.tsx` must wrap the tree in `<SafeAreaProvider>`. Phase 1–5 do NOT mount one (verified via stub LandingScreen never importing it; AppNavigator/App not visible in stack).
- Subagent options: (a) add `SafeAreaProvider` to `App.tsx` as part of this story (scope creep but small); (b) use a hardcoded top inset (e.g., `paddingTop: theme.spacing.xxxl`) and skip safe-area entirely; (c) defer safe-area to a follow-up.
- Recommendation: pre-decide. (a) is correct for any non-trivial app and the cost is one wrap + one import.

**S3. Dark mode parity asserted but not designed.**
- AC `[theme + tokens]` says "screen MUST work in both light and dark mode." All 6 reference screenshots are light mode.
- Concrete risk: in dark mode, `bg.premium` = `#2A2418` (near-black warm) and the AC says the Like pill uses `bg.surface` (= `#181B22`, near-black). Contrast ≈ 0; Like button effectively invisible.
- Options: (a) accept "dark mode is best-effort, 6.3 manual E2E only validates light mode" caveat; (b) commission a dark-mode pass and add a 9th-screenshot reference; (c) light-mode-only for v1, drop the dark-mode AC.
- Recommendation: (a). The dark-mode tokens already exist; "looks reasonable in dark mode" without a reference visual is a fair v1 bar.

**S4. Hardcoded name in `landing_section_marriage_intentions_title`.**
- AC `[labels.json policy]` defines `landing_section_marriage_intentions_title: "Jasmin's marriage intentions"`. Other labels use `{{name}}` templating (e.g., `landing_compliment_title: "Don't wait, chat with {{name}} now."`).
- Inconsistent. Either change to `"{{name}}'s marriage intentions"` (consistent) or accept the hardcode (justifiable: v1 has exactly one profile so templating buys nothing).
- Recommendation: template it. Consistency now is cheaper than refactoring later.

---

### NOTE only (acceptable; flagging for awareness)

**N1. Story 6.3 `depends_on` is correct.** 6.3 depends on 6.1 (the screen exists) and 6.2 (the script exists). 6.2 has `depends_on: []` even though it documents 6.1's behavior — defensible because 6.2 is a markdown file written from the PRD spec, not from running code.

**N2. Manual E2E checks 9a–9r have no programmatic testIDs for sub-elements** (e.g., the darkening overlay, the gold strip, the chip rows). This is acceptable for a manual checklist but means failures of those elements will only be caught by human eye, not by the component test suite. Already implicit in the "manual E2E" framing.

**N3. AC `[scroll body sections]` (3) gives implementer choice on the marriage-intentions dark pill background** ("`bg.surface` OR `text.primary` with inverse text — implementer choice as long as it reads as a 'dark chip'"). Untestable beyond presence assertion; that's fine for a visual contract delegated to manual E2E.

**N4. AC `[theme + tokens]` "at most one new token" escape hatch.** Allowing a single ad-hoc token addition risks scope drift. Suggest tightening: NO new tokens in this story; visual mismatches go in the PR description as follow-up items.

**N5. Android emulator readiness for story 6.3 not validated.** We have not confirmed the AVD is configured, that `npx expo start` succeeds against the current package.json, or that prior phases' app installs and runs end-to-end on a real emulator. Latent bootstrap issues (Node 24 on Expo SDK 55 — see context.md design decision 2026-05-01) may surface here for the first time.

**N6. Verification gate "test count strictly greater than at branch-creation time"** is testable but requires the subagent to capture the baseline. Standard pattern for this project; calling out for completeness.

---

### Dispatch readiness checklist

If the user picks `proceed`, the implementing subagent for 6.1 must resolve B1–B5 and S1–S4 inline (or have the user pre-resolve them in the PRD). The minimum set of pre-resolutions before dispatch:

- B1: pick `src/assets/images/sample.jpg` + `@/...` OR `assets/images/sample.jpg` + relative require
- B3: pick option (a) hide tab bar / option (b) keep tab bar / option (c) escalate
- B5: confirm X→signOut wins, queue architecture.md amendment of lines 30/36/109/202 in the same PR
- S1: split into 6.1a/b/c or accept the single-story risk
- S2: SafeAreaProvider in App.tsx or hardcoded top padding
