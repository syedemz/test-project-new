# Phase 1 brainstorm — Project bootstrap

## 2026-05-01 08:47 brainstorm

Audit of `implementationplan/phase-1-bootstrap.md` against `architecture.md` and the slash-command contract. Findings grouped by category.

### Non-testable / ambiguous acceptance criteria

- **1.1 AC #1–#3 — "halts the phase with a message" is not directly testable.** "Halt" is not defined as an observable behavior. Define explicitly: the subagent reports failure (does not flip `done: true`), prints the exact message to its reply, and the main agent's failure-management protocol takes over. Without this, two readers can disagree on what "halt" means.
- **1.1 AC #2 — implicit precondition on `$ANDROID_HOME`.** The criterion reads as if `$ANDROID_HOME` is set. Make the unset case explicit as a separate failure path: "if `$ANDROID_HOME` is unset, halt with message naming `$ANDROID_HOME` as the missing piece."
- **1.1 AC #5 — "captured in the phase notes (or the PR description)" is ambiguous.** "Or" creates two valid implementations. Pick one canonical location. Recommend: PR description (since the PR is the audit artifact other phases reference).
- **1.2 AC #5 — `npx expo start` exit-cleanly criterion is operationally fuzzy.** Metro is interactive and runs until killed. "Process exits cleanly when stopped; no red-screen output" doesn't say *how* the subagent stops it, *how long* it waits, or what counts as "no red-screen output" (Metro logs to stdout, not a UI). Concrete restatement: "Metro bundler reaches the 'Waiting on http://localhost:...' / 'Logs for your project will appear below' state without printing `error` or `Error:` lines within 60s; subagent sends SIGINT and confirms the process exits within 10s."

### Scope bleed (siblings or future phases)

- **1.7 scaffolds folders owned by later phases.** `styles/` and `labels/` are populated by phase 2; `navigation/` by phase 3. Scaffolding all four in phase 1 with `.gitkeep` placeholders is a mild scope smuggle. Justified because they are inert (no source files yet) and avoid noisy folder-creation churn in later phases. Keep, but be aware.

### `depends_on` issues

- **Implicit ordering risk between 1.4 (ESLint) and 1.5 (Prettier).** Both depend only on 1.2 and can land in either order. If 1.4 lands first without `eslint-config-prettier`, ESLint may flag formatting choices that Prettier would later rewrite — producing a configuration that lints clean today and fails tomorrow. Two acceptable fixes:
  - Add an AC to 1.4 requiring `eslint-config-prettier` to be installed and placed last in the `extends` chain (so ESLint surrenders formatting to Prettier regardless of merge order). **Recommended.**
  - Or make 1.4 `depends_on: [1.2, 1.5]` so Prettier's rules exist before the ESLint config is finalized. Slightly more brittle.

### Unvalidated external dependencies

- **Expo SDK 55 availability.** The architecture and PRD assume Expo SDK 55 is released and installable as of 2026-05-01. Not yet verified. If SDK 55 is unreleased or yanked, story 1.2 fails immediately. Story 1.1 should arguably also include a `npm view expo versions --json` check to confirm `55.x.x` is published before story 1.2 begins.
- **`eslint-config-expo` for SDK 55.** Story 1.4 says "extends Expo's recommended config" but does not name the package. Pin the package name explicitly (`eslint-config-expo`) and confirm it ships compatible with SDK 55, otherwise the subagent guesses.
- **`jest-expo` preset for SDK 55.** Story 1.6 references "the Expo Jest preset (`jest-expo`)". Pinned package, but not version-confirmed for SDK 55. Worth a quick `npm view jest-expo` check.
- **`@testing-library/jest-native` deprecation drift.** In RNTL 12.4+ the matchers from `jest-native` are built-in; installing `jest-native` is redundant churn (and produces a deprecation warning). The actual RN version Expo SDK 55 pins determines RNTL compatibility. Recommend: 1.6 AC be re-worded to "install `@testing-library/react-native`; install `@testing-library/jest-native` only if RNTL major < 12.4; otherwise rely on built-in matchers and document the choice."

### Drift since the plan was written

- PRD `last_updated: 2026-04-30`; today is 2026-05-01. No meaningful drift.
- No earlier phase shipped — drift from prior phases is not possible.

### Cross-cutting (informational, not blockers)

- All 7 stories use `frontenddeveloper`. Correct — there is no backend in this project.
- Branch and PR mechanics are not in the PRD by design (subagents read `gitbranching.md` at dispatch). Confirm at dispatch time that subagents branch from `development` as `feat/phase-1-<story-id>-<slug>` and open PRs into `development`.
- The architecture's pinned-version table (architecture.md lines 138–149) referenced by 1.2 AC #3/#4 exists. The "update the table to match actual pin" pathway is therefore real and editable.

### Suggested PRD edits (compact)

1. **1.1 AC #1/#2/#3** — replace "halts the phase with a message" with "the subagent reports failure to the main agent with the exact message and does not flip `done: true`."
2. **1.1 AC #2** — add explicit `$ANDROID_HOME` unset failure path.
3. **1.1 AC #5** — pick one canonical capture location (recommend PR description).
4. **1.1** — add an AC: `npm view expo versions --json` confirms an `^55.0.0` version is published; failure halts the phase.
5. **1.2 AC #5** — replace with the concrete Metro / SIGINT criterion above.
6. **1.4** — add an AC: `eslint-config-prettier` is installed and placed last in `extends`.
7. **1.4** — name the Expo ESLint package explicitly (`eslint-config-expo`).
8. **1.6** — re-word the `jest-native` AC per the RNTL-12.4 conditional above.
