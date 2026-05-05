# Phase 2 brainstorm — Theme and shared infrastructure

## 2026-05-05 21:09 brainstorm

Reviewed `implementationplan/phase-2-shared-infra.md` (7 stories, all `frontenddeveloper`) against `architecture.md`, the uncommitted `theme.md` (45KB), the modified `codingprinciples.md`, and the current `package.json`.

### Critical drift — PRD vs. new theme.md (HIGH)

The user added `theme.md` (untracked) and rewrote `codingprinciples.md` to point to it as the **single source of truth** for the design system. The contents of `theme.md` materially conflict with story 2.1 as currently written:

| Aspect | PRD story 2.1 | theme.md (now authoritative per codingprinciples.md) |
|---|---|---|
| Location | `styles/styles.ts` (one file) | `src/theme/theme.ts`, `src/theme/typography.ts`, `src/theme/ThemeProvider.tsx`, `src/theme/index.ts` (four files) |
| Color tokens | Flat: `primary`, `secondary`, `background`, `surface`, `textPrimary`, `textSecondary`, `error` | Nested semantic roles: `bg.primary`, `bg.surface`, `text.primary`, `text.brand`, `accent.primary`, `accent.secondary`, `status.error`, `notification.dot`, etc. (~30 roles) |
| Spacing | `xs, sm, md, lg, xl` (5 keys) | `xxs, xs, sm, md, lg, xl, xxl, xxxl, huge, giant` (10 keys) |
| Typography | `heading, subheading, body, caption` (4 styles) | `display.lg/md`, `heading.xl/lg/md/sm`, `body.lg/md/sm`, `label.lg/md/sm`, `caption` (13 styles) — plus mandatory PlusJakartaSans loaded via `expo-font` + `expo-splash-screen` |
| Light/dark | Not mentioned | Both required; consumed via `useTheme()` hook |
| Wiring | "No other file imports from `styles/styles.ts` yet" | `ThemeProvider` MUST wrap the app at root (`App.tsx`) for `useTheme()` to work — i.e., it's load-bearing immediately |

If we follow the PRD literally, we will produce a `styles/styles.ts` that violates the new theme.md and gets discarded the moment phase 4 begins. If we follow theme.md, story 2.1 needs to be substantially rewritten.

### Scope smuggling triggered by theme.md (MEDIUM)

Following theme.md fully in phase 2 pulls in scope the PRD doesn't authorize:

- **Font loading.** `expo-font` + `expo-splash-screen` install, the 5 PlusJakartaSans `.ttf` files in `src/assets/fonts/`, and `App.tsx` font-loading wiring. Story 2.7 explicitly requires `App.tsx` to be reverted to "the bare Expo template" at story close — fundamentally incompatible with permanently wiring `ThemeProvider` + font loading into `App.tsx`.
- **Library installs.** theme.md §1.1 lists `expo-font`, `expo-splash-screen`, `lucide-react-native`, `react-native-svg`, `@react-navigation/*` (3 packages), `react-native-screens`, `react-native-safe-area-context`, `react-native-reanimated`, `react-native-gesture-handler` as REQUIRED. Phase 2 PRD authorizes none of these. Phase 3 (auth/navigation) presumably owns the navigation libs. Phase 2 only legitimately needs `@react-native-async-storage/async-storage` (story 2.4).
- **App content.** theme.md §3 reframes the app as a "Muslim singles dating & social app" with brand pink, mint, gold, etc. The phase 2 PRD doesn't mention this, and the labels inventory (story 2.2) is a generic auth flow. No conflict yet, but worth confirming the brand context belongs in phase 2 vs later.

### Missing dependency (HIGH)

`@react-native-async-storage/async-storage` is **not** in `package.json`. Stories 2.4 (storage helper), 2.6 (credential lookup), and 2.7 (AVD smoke test) all require it. The PRD doesn't list "install this package" as a step. Need to either add it explicitly or accept the subagent will install it as part of story 2.4.

### Story 2.7 — manual on-device step

Story 2.7 acceptance criteria say "the user runs `npx expo start`, launches on the Android emulator, and observes the round-tripped username text". A frontenddeveloper subagent cannot drive an AVD. The brief must make clear: subagent prepares the harness, hands control back to the user, who runs the device step and reports back. Then the subagent (re-dispatched, or you) reverts `App.tsx` and closes the story.

This makes story 2.7 a two-leg story split by a manual checkpoint. Worth flagging up front.

### Acceptance criteria — generally testable

Stories 2.1–2.6 have concrete, testable criteria (specific exports, specific error messages, specific behaviors). No vague "looks good" anywhere. Story 2.5's reason-string set is left to TSDoc rather than being enumerated in the PRD; mild risk of inconsistent strings between modules later, but acceptable.

### Dependency graph — clean

- 2.1, 2.2, 2.3, 2.4, 2.5: independent (depends_on: [])
- 2.6: depends on 2.3 + 2.4 ✓
- 2.7: depends on 2.4 ✓

Topological order is unambiguous. No story smuggles a dependency on a future phase.

### Uncommitted-changes housekeeping

`codingprinciples.md` (modified) and `theme.md` (untracked) sit on `development`. These are spec edits, not phase 2 implementation. Two reasonable options:

1. Commit them directly to `development` before the phase 2 feature branch is cut (treats them as plan/spec changes, not feature work). Risks colliding with the gitbranching rule that all changes flow through PRs.
2. Let them follow the subagent into `feat/phase-2-shared-infra` as the first commit. Cleaner from a branching perspective, but mixes spec and implementation in one PR.

Pick before dispatch.

### Recommended actions before proceeding

1. **Reconcile story 2.1 with theme.md.** Either:
   - (a) Rewrite story 2.1 to produce `src/theme/theme.ts` + `typography.ts` + `ThemeProvider.tsx` + `index.ts` per theme.md §14, with the full semantic palette, full spacing scale, and full type scale; OR
   - (b) Explicitly defer the rich theme to phase 3+, and keep story 2.1 narrow as written (knowing it will be replaced).
2. **Decide on font loading + ThemeProvider wiring.** If (a) above, story 2.1 (or a new story 2.1b) must wire `ThemeProvider` and `useFonts` into `App.tsx` — and story 2.7's "revert App.tsx to bare template" criterion needs to change to "preserve the ThemeProvider/font wiring; only remove the smoke-test view".
3. **Decide on library installs.** If (a) above, add `expo-font` + `expo-splash-screen` to story 2.1 acceptance criteria. Navigation libs stay in phase 3.
4. **Add explicit AsyncStorage install.** Either as a separate story (2.0) or as the first acceptance criterion of story 2.4.
5. **Resolve 2.7 manual step.** Add a checkpoint note: "story 2.7 executes in two legs separated by user-driven AVD verification."
6. **Decide what to do with the uncommitted spec edits** (option 1 vs 2 above).

Net: this is a `address` situation, not `proceed`. Dispatching as-is would force the subagent to either ignore theme.md (and produce code the user will throw away) or invent its own reconciliation (and over-deliver beyond the PRD).
