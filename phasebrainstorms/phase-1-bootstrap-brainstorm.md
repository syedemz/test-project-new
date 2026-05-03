# Phase 1 brainstorm — Project bootstrap

## 2026-05-01 21:24 brainstorm

Per-phase critique of `implementationplan/phase-1-bootstrap.md` ahead of dispatch.
Findings grouped by: (A) blockers — fix the PRD or the env before dispatch, (B)
gaps in acceptance criteria — testable but underspecified, (C) drift risks —
assumptions baked into the PRD that may have shifted, (D) bookkeeping that's
stale.

### A. Blockers (recommend address before dispatch)

1. **Story 1.2 AC #5 has no non-interactive verification path.**
   `npx expo start` is a long-running, foreground-by-default Metro server. The
   AC says "launches without errors … process exits cleanly when stopped; no
   red-screen output," but it does not say *how* the subagent verifies that
   non-interactively. Without a contract, the subagent will improvise — risk:
   it hangs the bash shell, kills the wrong PID, or declares success based on
   stdout it never read. Concrete fix in the PRD: spawn with a timeout
   (e.g. `timeout 30 npx expo start --non-interactive` or run in background and
   poll for the "Metro waiting on" / "Logs for your project" line, then SIGTERM
   and assert exit was clean). Without this the story will produce ambiguous
   results.

2. **Story 1.6 AC #5 is unreachable without `collectCoverageFrom`.**
   The "simulate threshold violation by adding an untested helper file" AC only
   fires if Jest is configured to *include that file in the coverage scope*.
   Out of the box, `jest-expo` only counts files imported by tests. So an
   orphan untested helper would not lower coverage and would not trip the
   global threshold — the AC will silently pass even if the threshold config
   is wrong. Fix: add an AC requiring `collectCoverageFrom` to include
   `**/*.{ts,tsx}` (with the usual excludes) so coverage scope is the whole
   source tree, which is also how thresholds are intended to be used. Then the
   simulated violation actually exercises the threshold.

### B. Gaps in acceptance criteria

3. **Story 1.2 cross-doc edit not flagged in the brief.**
   AC #3 and #4 say *"if the actual pin is not in the expected range, update
   architecture.md's pinned-version table in the same commit."* That's a
   cross-document edit the dispatch brief must call out explicitly, otherwise
   the subagent will edit only `package.json` / `context.md` and leave
   architecture.md drifted. Recommend the dispatcher add a one-line reminder
   in the brief: "if pins differ, update architecture.md's pinned-version
   table in the same commit per the AC."

4. **Story 1.7 folder casing is inconsistent (`Helper/` capitalized, others
   lowercase).** Probably intentional per architecture.md, but the subagent
   will not know that without checking. The PRD should either confirm casing
   in the AC ("`Helper/` is intentionally capitalized to match
   architecture.md") or normalize. Low-impact but produces avoidable churn if
   it gets "fixed" later.

### C. Drift risks (assumptions that may have shifted)

5. **Expo SDK 55 + Node 24 compatibility is still untested.**
   The architecture.md raised the Node pin from 20.x LTS to 24.x on 2026-05-01
   to match the host (`v24.14.1`). Expo SDK 55 was originally evaluated
   against Node 20. If `npx create-expo-app` or the installer fails at story
   1.2, suspect Node first. The PRD does not document a fallback. Suggest the
   brief tells the subagent: "if 1.2 fails on Node-related errors, do not
   downgrade Node yourself — fail the story with a clear note and stop, so the
   user can decide whether to revert the Node pin." This protects the host
   environment from surprise downgrades.

6. **`@testing-library/jest-native` is deprecated upstream.**
   Story 1.6 AC #1 mandates installing `@testing-library/jest-native`. As of
   recent React Native Testing Library releases, those matchers are built into
   `@testing-library/react-native` itself and the standalone `jest-native`
   package is on a deprecation path. Depending on which RTL version `jest-expo`
   pulls in for SDK 55, installing `jest-native` may produce a deprecation
   warning or be redundant. Not a blocker — the install will still work — but
   worth noting so the subagent does not chase the warning as a bug. PRD
   could be relaxed to "install `@testing-library/react-native`; install
   `@testing-library/jest-native` only if RTL's bundled matchers are not yet
   available."

7. **`react-native` 0.85.x and `@react-navigation/*` 7.x are expectations,
   not facts.** Story 1.2 AC #3/#4 explicitly anticipate the actual pins may
   differ and require updating architecture.md to match. Good — the PRD
   already handles drift correctly here. Flagging only because the subagent
   should expect this branch to fire.

### D. Stale bookkeeping (clean up before or alongside the next dispatch)

8. **`context.md` "Active blockers" still says ANDROID_HOME is unset.**
   Verified in this session: `ANDROID_HOME=C:\Users\syede\AppData\Local\Android\Sdk`
   is now set at Windows User scope and is visible to the bash subshell.
   `ANDROID_SDK_ROOT` remains unset (architecture.md never required it; it's
   the older SDK env var name and either works for Android tooling). Recommend
   clearing the blocker entry from `context.md` before re-dispatch so it does
   not falsely re-fire as a halt condition for story 1.1. The subagent
   inheriting a fresh shell from this Claude Code instance will see
   ANDROID_HOME, but a brand-new terminal opened by the user later would also
   see it (User-scope env vars are persistent).

9. **Story 1.1 first-attempt notes are now historical.**
   The story's `notes:` block documents the 2026-05-01 first attempt against
   the old Node 20.x AC. Once the re-dispatch closes the story, the notes
   should be preserved as audit trail (don't delete) but the closing entry
   should make clear which run satisfied which AC.

### depends_on review

10. **No issues with the dependency graph.**
    1.1 → ∅; 1.2 → {1.1}; 1.3, 1.4, 1.5, 1.6, 1.7 each → {1.2}. Siblings under
    1.2 are independent, which is correct — they touch different config
    surfaces. Per engineeringprinciples.md the executor will still run them
    serially. No parallelism implied or possible.

### Scope smuggling

11. **None detected.** Phase 1 is bootstrap-only — no app code, no theme, no
    navigation, no auth. Stories stay inside that scope. The folder scaffold
    in 1.7 contains only `.gitkeep`, which is correct (population is phases 2
    and 3).

### Summary recommendation

Three items rise to the level of "address before re-dispatch": **1**
(non-interactive verification for `expo start`), **2** (collectCoverageFrom
for Jest), and **8** (clear the stale ANDROID_HOME blocker in context.md).
Everything else is informational and can ride along, with the brief reminding
the subagent of items 3, 5, and 6 inline.

## 2026-05-01 21:35 brainstorm

Re-run after the PRD revision was committed to `development`. Verifying gap
closure and surfacing second-order issues.

### Closure check (prior items)

- **A1 — non-interactive Metro contract on 1.2 AC #5:** closed. Lines 52 of
  the PRD now spell out background launch, 60s poll for "Metro waiting on" or
  equivalent, clean SIGTERM, and an audit excerpt requirement.
- **A2 — `collectCoverageFrom` AC on 1.6:** closed. New AC #3 requires whole
  source tree coverage scope with the right excludes; AC #6 explicitly notes
  it now proves both threshold and scope configs.
- **A8 — stale ANDROID_HOME blocker:** closed. `context.md` Active blockers
  reads "None." Verified `$ANDROID_HOME` is visible to bash. Story 1.1's hard
  failure path will not falsely fire.
- **B3 — cross-doc edit reminder on 1.2:** closed. Notes call it out
  explicitly, including "do not split this across commits."
- **B4 — folder casing on 1.7:** closed. AC and notes both say casing must
  not be normalized.
- **C5 — Node 24 fallback on 1.2:** closed. Notes forbid the subagent from
  downgrading Node and require failing loudly instead.
- **C6 — `@testing-library/jest-native` deprecation:** closed. AC #1 made it
  conditional on RTL bundling.

All seven prior items resolved. No reopens.

### New finding (one real, one second-order)

12. **Story 1.6 AC #5 conflicts with the new collectCoverageFrom AC + strict
    thresholds (real, blocking-class).**
    Once `collectCoverageFrom: ['**/*.{ts,tsx}']` is set AND the global
    thresholds are `{ lines: 80, branches: 75, functions: 80, statements: 80 }`,
    the *baseline* run `npm test -- --coverage` (AC #5) will FAIL because the
    Expo SDK 55 TypeScript template ships an untested `App.tsx` (and possibly
    additional template files) that land inside the coverage scope at 0%
    coverage. AC #5 says the baseline run must exit 0, but it cannot — the
    threshold check kills it before AC #6 (the deliberate violation) is even
    simulated.

    Three resolution options, in increasing order of intrusiveness:
    - (a) Add a phase-1-only exclusion to `collectCoverageFrom` for the
      template entry file (`!App.tsx`, `!app/**`, or whatever SDK 55's
      template scaffolds). Document in the AC that this exclusion is removed
      in phase 2 once real source files arrive.
    - (b) Move strict-threshold *enforcement* to phase 2. Phase 1 keeps the
      threshold config for documentation but runs without `--coverage` in the
      smoke check, or sets `coverageThreshold` to `0` for the bootstrap
      commit and ratchets up in phase 2.
    - (c) Have story 1.2 replace the template's `App.tsx` with a placeholder
      that has 100% statement coverage from the smoke test (e.g., the smoke
      test imports it and asserts a single export). Smuggles a tiny bit of
      app-shape into phase 1 but keeps the threshold enforcement honest.

    Recommend (a) — explicit, contained, easy to remove in phase 2.
    Recommend AGAINST proceeding to dispatch with this gap open: the
    subagent will hit it during 1.6 and either fail the story or
    silently work around it in a way that isn't recorded.

13. **Windows process-tree shutdown for Metro (second-order, brief-level).**
    The new 1.2 AC #5 says SIGTERM with no orphaned children. On
    Windows/git-bash, a plain `kill <pid>` does not always terminate the full
    Metro process tree — node workers and the file watcher commonly survive.
    The subagent will need `taskkill //T //F //PID <pid>` (note the doubled
    slashes inside git-bash to avoid path-translation) or `kill -- -<pgid>`
    if the process was launched in its own group. This is a Windows-specific
    operational wrinkle, not a PRD-level gap. Recommend the dispatch brief
    include a one-line reminder: "on Windows, kill the Metro process tree
    explicitly (taskkill //T //F //PID), not just the parent."

### Brief-level reminders (no PRD edits required)

- **Preserve story 1.1's historical `notes:` block on re-run.** The block is
  marked "audit trail of the first attempt." The subagent should APPEND a new
  closing entry for the successful re-run, not overwrite. Mention this in the
  1.1 dispatch brief.
- **Cross-doc edit alert (1.2).** Already in the PRD notes, but the
  dispatcher should echo it once in the brief — easy to miss when reading
  many ACs.
- **Node-related failure path (1.2).** Already in the PRD notes; same
  reasoning.
- **`@testing-library/jest-native` decision recording (1.6).** AC #1 says
  the install/skip decision is recorded in the phase notes — remind the
  subagent so it doesn't end up in PR description only.

### Summary recommendation

One item warrants a PRD edit before dispatch: **#12** (the threshold/coverage
conflict in 1.6). The remaining items (#13 + brief reminders) can be conveyed
inline in the dispatch briefs. Without resolving #12, story 1.6 is set up to
fail in a confusing way.

## 2026-05-01 21:44 brainstorm

Third pass after PRD's second revision (`brainstorm_revision` block, lines
4–22 of the PRD). Verifying closure of prior items 1–13, doing a fresh-eyes
sweep for anything the first two sessions missed, and validating the repo
state ahead of dispatch.

### Closure check (prior 13 items)

All seven items from session 1 plus items 12 and 13 from session 2 remain
closed. Quick re-verification:

- 12 (1.6 threshold-vs-baseline conflict) — resolved via the phase-1-only
  template-exclude AC (PRD lines 122–125) plus AC #6 requiring the violation
  probe to sit OUTSIDE the carve-out. Cleanup contract for phase 2 is in
  notes (PRD lines 130–134). Closed.
- 13 (Windows process-tree shutdown) — surfaced into 1.2 notes as a Windows
  taskkill reminder. Closed.

Repo state verified: PR #1 (`feat/phase-1-1.1-verify-prereqs`) is MERGED;
local + remote have only `main` and `development`. No orphaned phase-1
branch, so the next dispatch creates a clean phase branch.

### New findings (this pass)

14. **Phase-branch continuity across sibling stories — brief-level, real.**
    Stories 1.3–1.7 are siblings under 1.2. Per `gitbranching.md`, the rule
    is **one branch per phase** (`feat/phase-1-<short>`). The lesson recorded
    in `CLAUDE.md` (and in `lessons.md` from PR #1) prohibits the dispatcher
    from dictating a branch *name* — that's the subagent's job. But the
    dispatcher MUST tell stories 1.3 and onward that **a phase branch
    already exists from a prior story in this same phase** so the new
    subagent does `git checkout feat/phase-1-<short>` instead of creating a
    new branch. Without this signal, a fresh subagent reading
    `gitbranching.md` and following the rule by-the-book might create
    `feat/phase-1-bootstrap` once for 1.1 and a second time for 1.3, getting
    confused when the branch already exists, or worse: silently branching
    off main.

    Resolution: each dispatch brief from story 1.3 onward includes the
    sentence "the phase-1 branch already exists from prior stories in this
    phase; check it out before working." Do NOT name the branch — instruct
    the subagent to discover it via `git branch --list 'feat/phase-1-*'`.

15. **Expo SDK 55 pin mechanism not specified in 1.2 — real, AC #1.**
    PRD AC #1 of 1.2: "An Expo project is initialized in the project root
    using the Expo SDK 55 TypeScript template; `package.json` declares
    `expo` at SDK 55." The AC says *what* must be true after init but does
    not specify *how* the subagent pins to SDK 55. `npx create-expo-app`
    by default uses whatever the latest released SDK is — if that's 56 or
    53 at the moment of dispatch, AC #1 immediately fails and the subagent
    has no documented fallback path. The right invocation is one of:
    - `npx create-expo-app@latest --template blank-typescript@sdk-55`
    - Initialize, then `npx expo install expo@^55` and re-resolve the
      template files.

    Recommend the dispatch brief for 1.2 include: "to satisfy AC #1, pin
    the template to SDK 55 explicitly via the `@sdk-55` template tag (or
    equivalent). If the SDK 55 template tag is not published, fail the
    story loudly and surface the issue — do not silently scaffold a
    different SDK." This is a brief-level reminder, not a PRD edit; the AC
    itself is correct.

16. **`plugin:tsdoc/recommended` may not be a valid extends target — real,
    1.4 AC #1.** `eslint-plugin-tsdoc` traditionally exposes a plugin to
    register and a single rule (`tsdoc/syntax`) to enable; it has not
    historically shipped a `recommended` config preset. If the literal
    string `plugin:tsdoc/recommended` is passed to ESLint's `extends:` and
    the plugin doesn't define one, ESLint exits non-zero with
    "Cannot find module 'eslint-config-tsdoc'..." or similar. AC #2
    (`npx eslint . exits 0`) then fails for the wrong reason.

    Resolution: the dispatch brief for 1.4 instructs the subagent to verify
    the plugin's actual exports first. If `recommended` exists, use it. If
    not, register the plugin and enable the rule manually
    (`plugins: ['tsdoc']`, `rules: { 'tsdoc/syntax': 'warn' }`), and record
    the deviation in the phase notes. The PRD's intent (TSDoc lint
    coverage) is satisfied either way; the literal string is the
    implementation detail. Brief-level reminder.

17. **`sdkmanager` invocation on Windows/git-bash — informational.**
    The first-attempt notes show the subagent worked around the `.bat`
    extension issue by resolving the binary manually from
    `$ANDROID_HOME/cmdline-tools/latest/bin/`. Now that `$ANDROID_HOME`
    is set, the bash subshell still won't auto-append `.bat` for native
    Windows binaries. The subagent will likely either (a) call
    `sdkmanager.bat` explicitly, (b) `cd` into the bin directory, or
    (c) add `.bat` to `PATHEXT` in the shell. All work; none need a PRD
    change. Informational.

18. **`CI=1` env var as canonical non-interactive Expo CLI — informational.**
    1.2 AC #5 already permits "or wrapped in a timeout" + background
    spawn + SIGTERM. Worth noting in the brief that `CI=1 npx expo start`
    is the documented Expo CLI flag for non-interactive mode (suppresses
    prompts, prints status without TUI). Combined with backgrounding +
    polling, this is the cleanest implementation. Optional brief reminder.

### Brief-level reminder summary (carry forward into dispatch)

- 1.1 — preserve historical notes block; APPEND a new audit entry for the
  successful re-run, do not overwrite (already in PRD line 51).
- 1.2 — pin to SDK 55 explicitly via template tag (item 15 above);
  cross-doc edit if pins differ (PRD line 68); Node-fallback policy
  (PRD line 70); Windows taskkill for Metro process tree (PRD line 72);
  optionally suggest `CI=1` (item 18).
- 1.3+ — phase branch already exists from a prior story; check it out,
  do not create a new one. Discover via `git branch --list 'feat/phase-1-*'`
  rather than hardcoding the name (item 14).
- 1.4 — verify `eslint-plugin-tsdoc` exports `recommended` before relying
  on it; fall back to manual rule registration if not (item 16).
- 1.6 — record the `@testing-library/jest-native` install/skip decision in
  phase notes per AC #1 (existing PRD requirement); record the exact list
  of phase-1-only template excludes per AC #4.

### depends_on review

No changes from prior reviews. Graph remains 1.1 → ∅; 1.2 → {1.1};
1.3, 1.4, 1.5, 1.6, 1.7 each → {1.2}. All siblings are independent and run
serially per the engineering rule.

### Scope smuggling

None detected. PRD remains bootstrap-only.

### Summary recommendation

No PRD edits required. All five new findings (14–18) are brief-level
reminders that the dispatcher carries into each story's dispatch. Item 14
(phase-branch continuity) is the most important — it directly mitigates a
repeat of the PR #1 lesson if the dispatcher and subagents drift on branch
discipline.
