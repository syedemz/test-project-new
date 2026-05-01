phase: 1
title: Project bootstrap
last_updated: 2026-05-01
brainstorm_revision: |
  2026-05-01 21:24 — PRD revised against phasebrainstorms/phase-1-bootstrap-brainstorm.md:
  - 1.2 AC #5 rewritten with a non-interactive Metro verification contract.
  - 1.2 notes extended with cross-doc edit reminder and Node 24 fallback guidance.
  - 1.6 gained a collectCoverageFrom AC so the threshold-violation AC is reachable.
  - 1.6 AC #1 relaxed to allow skipping @testing-library/jest-native if RTL's bundled
    matchers cover the same surface.
  - 1.7 notes confirm that the `Helper/` casing is intentional.

context_summary: |
  Stand up the empty Expo SDK 55 + TypeScript project, verify host prerequisites
  programmatically before any code is written, and configure the lint/format/test
  toolchain. After this phase, subsequent phases can write code against a working
  build, lint, and test pipeline. No application logic is implemented here.

stories:
  - id: 1.1
    title: Verify host prerequisites programmatically
    agent: frontenddeveloper
    done: false
    depends_on: []
    acceptance_criteria:
      - "`node -v` reports a `v24.x` version on stdout; any other major halts the phase with an explicit message naming the detected version. (Pin raised from 20.x LTS to 24.x on 2026-05-01 to match host `v24.14.1`; see architecture.md Open questions for the compatibility caveat.)"
      - "`sdkmanager --list_installed` (resolved from `$ANDROID_HOME/cmdline-tools/latest/bin/`) prints output containing at least one line matching `platforms;android-` and at least one line matching `build-tools;`. An empty list, missing `$ANDROID_HOME`, or a missing `sdkmanager` binary halts the phase with a message that names the missing piece."
      - "`emulator -list-avds` (resolved from `$ANDROID_HOME/emulator/`) prints at least one non-empty AVD name on stdout. An empty list halts the phase with a message instructing the user to create an AVD via Android Studio's AVD Manager."
      - "No system-wide `java -version` check runs; the phase explicitly does not require a system Java install. The PRD's notes record that JDK is supplied by Android Studio."
      - "Each verification command and its observed output is captured in the phase notes (or the PR description) so the result is auditable."
    notes: |
      First-run audit captured on 2026-05-01 against the original v20.x AC (see PR #1 history):
      - `node -v` => v24.14.1 (originally FAIL; AC raised to v24.x on 2026-05-01, now PASS)
      - `$ANDROID_HOME` is NOT set in shell env; SDK present at C:\Users\syede\AppData\Local\Android\Sdk. Subagent resolved binaries manually. Setting `ANDROID_HOME` as a system env var is still recommended before the next run so AC #2/#3 pass without manual path resolution.
      - `sdkmanager --list_installed`: PASS — platforms;android-33 and build-tools;33.0.2 both present
      - `emulator -list-avds`: PASS — Pixel_6_Pro_API_34
      - `java -version`: NOT RUN per AC #4

      Story will be re-dispatched on the next /implement-phase 1 run; this note is the audit trail of the first attempt under the prior AC.

  - id: 1.2
    title: Initialize Expo SDK 55 + TypeScript project and record actual pinned versions
    agent: frontenddeveloper
    done: false
    depends_on:
      - 1.1
    acceptance_criteria:
      - "An Expo project is initialized in the project root using the Expo SDK 55 TypeScript template; `package.json` declares `expo` at SDK 55."
      - "`npx expo --version` and `npm view expo version` are recorded in `context.md` Recent changes."
      - "The actual pinned `react-native` version installed by SDK 55 is read from `package.json`/lockfile and recorded in `context.md`. If it is not in the `0.85.x` range, the architecture's pinned-version table is updated in the same commit to match the actual pin (per architecture.md)."
      - "The actual pinned `@react-navigation/*` major version installed (or recommended by Expo SDK 55 docs at bootstrap) is recorded the same way; if it is not 7.x, architecture.md's pinned-version table is updated."
      - "Metro is verified non-interactively: `npx expo start` is launched as a background process (or wrapped in a timeout), and within 60 seconds the captured stdout contains a `Metro waiting on` (or equivalent bundler-ready) line and contains no `error` / red-screen output. The process is then terminated with SIGTERM and exits within 10 seconds with no orphaned child processes. The exact command used and the relevant stdout excerpt are recorded in the phase notes (or PR description) for audit. The story does NOT depend on a human pressing keys in an interactive Metro prompt."
    notes: |
      This is the install step. Configuration of TypeScript strictness, ESLint, Prettier, and Jest are separate stories below.

      Cross-doc edit: AC #3 and AC #4 require updating architecture.md's pinned-version table in the SAME commit if the actual installed `react-native` version is outside `0.85.x` or the actual installed `@react-navigation/*` major is not `7.x`. Do not split this across commits — the PRD, lockfile, and architecture.md must move together.

      Node 24 fallback: if `npx create-expo-app` or any subsequent install/bundler step fails with errors that point to Node version incompatibility (engine warnings, ESM/CJS interop crashes inside Expo's CLI, native module post-install failures), STOP the story with a clear failure note and surface the error to the user. Do NOT downgrade Node (`nvm`, version manager, or otherwise) on the user's host — the Node 24 pin is recorded in architecture.md as an open compatibility question and the user decides whether to revert to Node 20 LTS.

  - id: 1.3
    title: Configure TypeScript strict mode
    agent: frontenddeveloper
    done: false
    depends_on:
      - 1.2
    acceptance_criteria:
      - "`tsconfig.json` extends Expo's TypeScript base and sets `compilerOptions.strict: true` along with `noImplicitAny`, `strictNullChecks`, `strictFunctionTypes`, `noImplicitThis`, `alwaysStrict`, `strictBindCallApply`, and `strictPropertyInitialization` (all true)."
      - "`npx tsc --noEmit` exits 0 against the freshly initialized project."
      - "A deliberate type error introduced into a temporary file (e.g., `const x: number = \"a\";`) causes `npx tsc --noEmit` to exit non-zero with a `TS2322` diagnostic; the file is removed before the story is closed."
    notes: ""

  - id: 1.4
    title: Configure ESLint with eslint-plugin-tsdoc
    agent: frontenddeveloper
    done: false
    depends_on:
      - 1.2
    acceptance_criteria:
      - "ESLint config file (`.eslintrc.js` or `eslint.config.js`) exists at the project root and extends Expo's recommended config plus `plugin:@typescript-eslint/recommended` and `plugin:tsdoc/recommended`."
      - "`npx eslint .` exits 0 against the freshly initialized project."
      - "A deliberate violation (e.g., an unused variable or an invalid TSDoc comment) introduced into a temporary file causes `npx eslint .` to exit non-zero; the file is removed before the story is closed."
      - "An npm script `lint` is registered in `package.json` that runs `eslint .`."
    notes: ""

  - id: 1.5
    title: Configure Prettier
    agent: frontenddeveloper
    done: false
    depends_on:
      - 1.2
    acceptance_criteria:
      - "`.prettierrc` (or equivalent) exists at the project root with explicit settings for `singleQuote`, `trailingComma`, `printWidth`, and `semi`."
      - "`.prettierignore` excludes `node_modules`, `.expo`, `android`, `ios`, and lockfiles."
      - "`npx prettier --check .` exits 0 against the freshly initialized project."
      - "An npm script `format` is registered in `package.json` that runs `prettier --write .`, and a script `format:check` runs `prettier --check .`."
    notes: ""

  - id: 1.6
    title: Configure Jest + React Native Testing Library with coverage thresholds
    agent: frontenddeveloper
    done: false
    depends_on:
      - 1.2
    acceptance_criteria:
      - "Jest is configured via the Expo Jest preset (`jest-expo`); `@testing-library/react-native` is installed. `@testing-library/jest-native` is installed ONLY if the version of `@testing-library/react-native` pulled in by Expo SDK 55 does not already provide built-in matchers — if RTL ships the matchers natively, `jest-native` is skipped (it is on a deprecation path upstream) and the decision is recorded in the phase notes."
      - "`jest.config.js` (or `package.json` Jest block) sets `coverageThreshold.global` to `{ lines: 80, branches: 75, functions: 80, statements: 80 }` exactly as specified in architecture.md."
      - "`jest.config.js` (or `package.json` Jest block) sets `collectCoverageFrom` to include the entire source tree (e.g., `['**/*.{ts,tsx}']` with excludes for `node_modules`, `.expo`, `__tests__`, `coverage`, and any `*.config.{js,ts}` files). This is required so the global coverage thresholds apply to all source files, not only those imported by tests — without it, the threshold-violation AC below is unreachable."
      - "A trivial smoke test (e.g., `__tests__/smoke.test.ts` asserting `expect(1 + 1).toBe(2)`) exists and passes."
      - "`npm test -- --coverage` exits 0, prints a coverage table, and the smoke test appears in the run."
      - "A coverage-threshold violation, simulated by temporarily adding an untested helper file (containing executable code, located somewhere matched by `collectCoverageFrom`), causes `npm test -- --coverage` to exit non-zero with a threshold-violation diagnostic; the file is removed before the story is closed. Verifying that this AC fails as expected proves both the threshold config AND the `collectCoverageFrom` config are wired correctly."
      - "An npm script `test` runs `jest`; a script `test:coverage` runs `jest --coverage`."
    notes: "TDD is enforced in later phases. Phase 1 only proves the harness runs."

  - id: 1.7
    title: Scaffold project folder structure with .gitkeep placeholders
    agent: frontenddeveloper
    done: false
    depends_on:
      - 1.2
    acceptance_criteria:
      - "Folders `styles/`, `labels/`, `Helper/`, and `navigation/` exist at the project root, with casing exactly as written here. `Helper/` is intentionally capitalized to match architecture.md; the other three are intentionally lowercase. Casing must NOT be normalized."
      - "Each of those folders contains a `.gitkeep` file so the empty directory is tracked by git."
      - "No source files (`.ts`, `.tsx`, `.json` other than `.gitkeep`) exist in those folders yet — they are intentionally empty placeholders for phase 2 and phase 3 to populate."
      - "`git status` after the story shows the four `.gitkeep` files as the only additions in those folders."
    notes: |
      The mixed casing (`Helper/` capitalized, others lowercase) is deliberate and matches architecture.md's folder-structure spec. If a reviewer flags it as inconsistent, the answer is "intentional, see architecture.md" — do not silently rename in this phase.
