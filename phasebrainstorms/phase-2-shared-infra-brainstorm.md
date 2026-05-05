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

## 2026-05-05 21:25 brainstorm

Re-reviewed the rewritten PRD (now 8 stories, 2.0–2.7) against `theme.md`, the modified `codingprinciples.md` (both committed in `e22a407`), the current `package.json`, `tsconfig.json`, and `jest.config.js`.

### Resolved since prior brainstorm

- ✅ Story 2.1 now produces `src/theme/{theme.ts, typography.ts, ThemeProvider.tsx, index.ts}` per theme.md §14 verbatim — drift between PRD and theme.md is gone.
- ✅ Story 2.0 added: installs `@react-native-async-storage/async-storage`, creates `src/`, retires phase-1.7 placeholder folders, wires `@/*` path alias.
- ✅ Story 2.7 split into Leg A → user checkpoint → Leg B; revert target (`App.tsx`) is unambiguous because 2.1 explicitly does NOT modify it.
- ✅ ThemeProvider mounting and font loading explicitly deferred to phase 3 — no `expo-font` / `.ttf` acquisition headache in phase 2.

### Remaining gaps in the rewritten PRD

#### HIGH — story 2.0 misses the `jest.config.js` phase-1 contract

Phase 1.6 left an EXPLICIT contract baked into `jest.config.js` lines 16–23:

> `// Phase-1-only template-exclude block (TEMPORARY) … CONTRACT: phase 2's first story MUST remove these excludes and either delete the template files or replace them with tested source code.`

Story 2.0 ("phase 2's first story") does not currently mention this. Without removing the `'!App.tsx'` and `'!index.ts'` excludes, phase 2 will silently violate the phase-1 contract. **Add to story 2.0 ACs:** remove the `'!App.tsx'` and `'!index.ts'` excludes from `jest.config.js`, AND ensure the existing `App.tsx` + `index.ts` either (a) get a minimal smoke test that satisfies the 80/75/80/80 coverage threshold, or (b) get deleted (only viable if phase 2 produces a replacement entry point — which it doesn't).

This will collide with story 2.7 Leg A: when Leg A temporarily edits `App.tsx` to render the smoke-test view, coverage on the in-flight `App.tsx` may drop. Trade-off discussed below.

#### HIGH — metro path alias is not the same as TS path alias

`tsconfig.json` `paths`/`baseUrl` only satisfies the TypeScript compiler. At RUNTIME, Metro (Expo's bundler) does NOT read `tsconfig.json` `paths` by default. theme.md's `import { useTheme } from '@/theme'` will TS-compile but FAIL TO BUNDLE on the AVD unless one of:

- (a) `babel.config.js` adds `babel-plugin-module-resolver` with the same `@/*` → `src/*` mapping; or
- (b) `metro.config.js` adds a `resolver.alias` entry; or
- (c) all imports use relative paths (`./theme`, `../theme`) and `@/...` is abandoned.

Story 2.0 currently mentions `tsconfig.json` and `jest.config.js` but NOT `babel.config.js` / `metro.config.js`. Story 2.7's AVD smoke test would catch this only if 2.7 imports via `@/...` — but the storage helper itself uses relative imports inside `src/Helper/`, so the failure would silently land in phase 3 instead. **Add to story 2.0 ACs:** wire metro/babel alias resolution to match the TS alias, AND add a tiny verification step (e.g., a throwaway test that imports via `@/...` and runs in Jest's jsdom-ish env, plus a note that phase 3 will validate runtime resolution on-device).

#### MEDIUM — `tsconfig.json` extends `expo/tsconfig.base`; `paths` requires `baseUrl`

`tsconfig.json` currently extends `expo/tsconfig.base` and does not set `baseUrl` or `paths`. Adding `paths` without `baseUrl` is a TS error in some versions; adding both works. Story 2.0 already says "configure `paths` and `baseUrl`", so this is just a heads-up that the agent should not omit `baseUrl: "."`.

#### MEDIUM — story 2.7 Leg A coverage interaction

If story 2.0 removes `'!App.tsx'` from `collectCoverageFrom`, then story 2.7 Leg A's temporary edit of `App.tsx` (to render `<StorageSmokeTest />`) will be coverage-tracked. The Leg A commit must include a unit test that renders the temporary `App.tsx` (or `<StorageSmokeTest />` directly) so coverage stays above 80%. Leg B's revert restores the bare phase-1 App.tsx — which then needs a smoke test, OR Leg B must restore the exclude.

Cleanest resolution: story 2.0 leaves the `'!App.tsx'` exclude in place but adds a follow-up todo-comment so phase 3 (which wires ThemeProvider + fonts into `App.tsx` and adds real tests) takes ownership of removing it. This violates the letter of the phase-1 contract ("phase 2's first story MUST remove") but honors the spirit (the exclude exists because there's no test; phase 2 still has no test for App.tsx; phase 3 will). **Recommend amending the phase-1 contract in story 2.0's notes**: defer the App.tsx exclude removal to phase 3 with a clear cross-reference, since phase 2 doesn't add a real `App.tsx` of its own.

#### LOW — brand context drift in labels.json

`theme.md` reframes the app as a "Muslim singles dating & social app" with brand pink/mint/gold. `architecture.md` and `labels.json` (story 2.2) describe a generic auth flow with `app_name`, `login_*`, `register_*`. The label COPY (English strings) for `app_name` and any user-facing greeting is currently undefined — the story says "exact v1 keys" but leaves the English content open. The agent will likely write generic copy ("Welcome", "Test App") that doesn't match the brand context. Not a blocker; just expect a follow-up label-copy pass once branding is finalized.

#### LOW — story 2.1 `useTheme` error-message test technicality

Testing that `useTheme()` throws outside the provider needs a `renderHook`-style harness (or an error-boundary-wrapped render). The AC is valid; the agent just needs to know `renderHook` is in `@testing-library/react-native` (already installed per phase 1.6).

### Dependency graph — clean

- 2.0: depends_on [] — first dispatch
- 2.1, 2.2, 2.3, 2.4, 2.5: each depends_on [2.0]
- 2.6: depends_on [2.3, 2.4]
- 2.7: depends_on [2.4]

Topological order: 2.0 → {2.1, 2.2, 2.3, 2.4, 2.5} (any order) → 2.6 → 2.7. No cycles, no forward references. All `depends_on` IDs exist within phase 2.

### Net recommendation

The 8-story PRD is materially sound. Two edits would tighten it:

1. **Story 2.0:** add explicit ACs for (a) Metro/Babel alias config in addition to TS alias, and (b) a documented decision on the `jest.config.js` App.tsx/index.ts exclude (recommend deferring removal to phase 3 with a cross-reference comment in `jest.config.js`, so 2.7's App.tsx churn doesn't collide with coverage).
2. **Story 2.7 Leg B:** if 2.0 keeps the exclude, no additional change. If 2.0 removes it, Leg B must add a smoke test for the restored bare `App.tsx`.

Both are tightening edits, not blocking ones. The PRD is `proceed`-able as-is, with the agent expected to make a sensible call on the alias and coverage details. But cleaner to address before dispatch.

## 2026-05-05 third-pass sanity check

Re-reviewed the amended PRD (uncommitted edits to `implementationplan/phase-2-shared-infra.md`) against `jest.config.js`, `tsconfig.json`, `package.json`, and the absence of `babel.config.js` / `metro.config.js`.

### Resolved since 21:25 brainstorm

- ✅ Story 2.0 now has explicit ACs for runtime alias resolution via `babel-plugin-module-resolver` (preferred) or `metro.config.js` `resolver.alias` (alternative) — closes the prior HIGH gap on Metro not reading `tsconfig.json` `paths`.
- ✅ End-to-end alias verification probe (TS + Babel + Jest) is mandated and explicitly removed before commit — proves runtime resolution before any real source file depends on it.
- ✅ Jest exclude deferral to phase 3 is documented in story 2.0 ACs and `notes:`, with required edit to the `jest.config.js` comment block (`CONTRACT: phase 3 …`). Closes the phase-1 contract amendment cleanly without colliding with story 2.7's `App.tsx` churn.
- ✅ `tsconfig.json` `baseUrl: "."` is explicitly named in the AC — agent cannot omit it.

### New observations (all LOW)

- **`babel.config.js` does not exist yet.** Phase 1 did not create one; SDK 55's default `babel-preset-expo` is implicit. Story 2.0 will need to CREATE `babel.config.js` (with `presets: ['babel-preset-expo']` + `plugins: [['module-resolver', {alias: {'@': './src'}}]]`). Not a blocker — well within scope of the AC — just flag for the dispatching brief so the agent doesn't go looking for an existing file to edit.
- **Uncommitted spec edits on `development`.** `phase-2-shared-infra.md` and the brainstorm file have unstaged modifications. They are spec edits, not implementation, and should be committed to `development` directly BEFORE the subagent cuts `feat/phase-2-shared-infra` — otherwise they ride into the feature branch and mix spec with implementation in the eventual PR. Recommend the user commit them now (or tell the dispatcher to commit them on `development` before delegating story 2.0).
- **Brand context still undefined for `labels.json` English copy** (carried from prior brainstorm). `theme.md` says "Muslim singles dating & social app"; `architecture.md` describes a generic auth flow; the actual English strings for `app_name`, `landing_screen_title`, etc. are unspecified. Story 2.2's AC requires keys + non-empty `en` values but does not constrain the COPY itself. Agent will write something generic. Acceptable for phase 2; revisit after branding lands.

### Dispatch order (unchanged from 21:25)

`2.0 → {2.1, 2.2, 2.3, 2.4, 2.5} → 2.6 → 2.7`. Strictly serial per `engineeringprinciples.md`. Story 2.7 includes a manual user checkpoint between Leg A and Leg B.

### Net recommendation

**Proceed.** The PRD is dispatch-ready. One housekeeping ask before story 2.0 is dispatched: commit the uncommitted spec edits to `development` so the phase 2 feature branch contains implementation only.
