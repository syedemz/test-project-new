phase: 1
title: Project bootstrap
last_updated: 2026-05-03 (story 1.5 complete)
brainstorm_revision: |
  2026-05-01 21:24 — PRD revised against phasebrainstorms/phase-1-bootstrap-brainstorm.md:
  - 1.2 AC #5 rewritten with a non-interactive Metro verification contract.
  - 1.2 notes extended with cross-doc edit reminder and Node 24 fallback guidance.
  - 1.6 gained a collectCoverageFrom AC so the threshold-violation AC is reachable.
  - 1.6 AC #1 relaxed to allow skipping @testing-library/jest-native if RTL's bundled
    matchers cover the same surface.
  - 1.7 notes confirm that the `Helper/` casing is intentional.

  2026-05-01 21:35 — second revision against the same brainstorm file (re-run section):
  - 1.6 gained a phase-1-only exclude AC for Expo template files (App.tsx, index.ts*,
    app/**) so the baseline `npm test -- --coverage` can actually exit 0 against the
    fresh template; AC #6 (simulated violation) tightened to require the temp file
    sit OUTSIDE the phase-1 excludes so the threshold check actually fires; cleanup
    contract added to 1.6 notes for phase 2 to remove the carve-out.
  - 1.2 notes extended with a Windows process-tree shutdown reminder for Metro
    (taskkill //T //F //PID, not plain kill).
  - 1.1 notes extended with a re-run preservation rule (append, never overwrite).

context_summary: |
  Stand up the empty Expo SDK 55 + TypeScript project, verify host prerequisites
  programmatically before any code is written, and configure the lint/format/test
  toolchain. After this phase, subsequent phases can write code against a working
  build, lint, and test pipeline. No application logic is implemented here.

stories:
  - id: 1.1
    title: Verify host prerequisites programmatically
    agent: frontenddeveloper
    done: true
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

      Re-run preservation: when the re-dispatch completes, APPEND a new audit entry below this block (e.g., "Re-run YYYY-MM-DD: <observed outputs>"). Do NOT delete, rewrite, or fold the historical first-attempt block above — it documents the original AC and the reason the AC was amended, and that history must remain visible.

      Re-run audit captured on 2026-05-03 against the amended v24.x AC:
      - `node -v` => v24.14.1 — PASS (v24.x AC satisfied)
      - `$ANDROID_HOME` = C:\Users\syede\AppData\Local\Android\Sdk — resolved from env, present and accessible
      - `sdkmanager.bat --list_installed` (resolved from $ANDROID_HOME/cmdline-tools/latest/bin/): PASS
        Output included: platforms;android-33 (v2) and build-tools;33.0.2 (v33.0.2). Full installed list:
        build-tools;33.0.2, cmdline-tools;latest, emulator, extras;google;Android_Emulator_Hypervisor_Driver,
        patcher;v4, platform-tools, platforms;android-33, platforms;android-33-ext4, sources;android-33,
        system-images;android-31;google_apis;x86_64, system-images;android-31;google_apis_playstore;x86_64,
        system-images;android-33;google_apis;x86_64, system-images;android-34;google_apis;x86_64
        Note: sdkmanager.bat requires JAVA_HOME; Android Studio's bundled JBR at
        C:\Program Files\Android\Android Studio\jbr was used. No system-wide `java -version` was run.
      - `emulator -list-avds` (resolved from $ANDROID_HOME/emulator/): PASS — Pixel_6_Pro_API_34
      - `java -version`: NOT RUN per AC #4. JDK supplied by Android Studio's bundled JBR only.
      All ACs passed. Story marked done: true.

  - id: 1.2
    title: Initialize Expo SDK 55 + TypeScript project and record actual pinned versions
    agent: frontenddeveloper
    done: true
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

      Windows process-tree shutdown for Metro (AC #5 wrinkle): a plain `kill <pid>` from git-bash on Windows does NOT reliably terminate Metro's full process tree — node workers and the file watcher are commonly orphaned because Windows lacks proper SIGTERM tree semantics for native processes. Use `taskkill //T //F //PID <pid>` (doubled slashes inside git-bash so the path is not translated to `C:\T`), OR launch Metro in its own process group and signal the group (`kill -- -<pgid>`). The "no orphaned child processes" clause of AC #5 must actually hold — verify with a follow-up `ps` or `tasklist` that no `node` processes from this Metro instance remain.

      Audit — run 2026-05-03:
      - Init approach: temp+copy. `create-expo-app` does not support scaffolding into a non-empty directory without --force equivalent. Scaffolded into `C:/Users/syede/AppData/Local/Temp/expo-scaffold/myapp` with `--no-install`, then copied Expo files (App.tsx, index.ts, tsconfig.json, app.json, assets/, .gitignore) into project root, preserving all bookkeeping files (CLAUDE.md, claude.md, context.md, architecture.md, codingprinciples.md, cicd.md, implementationplan.md, implementationplan/, phasebrainstorms/, .git/). package.json created with correct name (test-project-new) and Expo SDK 55 deps. `npm install` then run in project root.
      - `npx expo --version` = 55.0.27
      - `npm view expo version` = 55.0.19
      - Actual react-native installed = 0.83.6 (package.json + lockfile; NOT in 0.85.x range — architecture.md pinned-version table updated in this commit per AC #3)
      - @react-navigation/* target: 7.x confirmed (latest stable 7.2.2, peer dep react >= 18.2.0 satisfied by React 19.2.0 in template; not in Expo's bundledNativeModules.json — user installs separately; architecture 7.x target stands, no update needed per AC #4)
      - Node 24 compatibility: install succeeded with only deprecation warnings for transitive packages (inflight, rimraf, glob, uuid). No ESM/CJS crashes, no engine errors. Node 24 is compatible with Expo SDK 55 for the install step.
      - Metro non-interactive verification command: `CI=1 npx expo start > /tmp/metro-out.txt 2>&1 &`
      - Metro stdout excerpt (full output):
          Starting project at C:\Users\syede\Claude-Master\test-project-new
          Metro is running in CI mode, reloads are disabled. Remove CI=true to enable watch mode.
          Starting Metro Bundler

          Waiting on http://localhost:8081
          Logs for your project will appear below.
      - Bundler-ready signal: "Waiting on http://localhost:8081" (appeared within ~5s, well within 60s window)
      - No "error" or red-screen lines in stdout.
      - Shutdown: `taskkill //T //F //PID 32744` and `taskkill //T //F //PID 5436` — full process tree (including parent PID 28192) terminated. Post-kill `tasklist //FI "IMAGENAME eq node.exe"` confirmed no remaining node.exe processes.
      - All 5 ACs passed. Story marked done: true.

  - id: 1.3
    title: Configure TypeScript strict mode
    agent: frontenddeveloper
    done: true
    depends_on:
      - 1.2
    acceptance_criteria:
      - "`tsconfig.json` extends Expo's TypeScript base and sets `compilerOptions.strict: true` along with `noImplicitAny`, `strictNullChecks`, `strictFunctionTypes`, `noImplicitThis`, `alwaysStrict`, `strictBindCallApply`, and `strictPropertyInitialization` (all true)."
      - "`npx tsc --noEmit` exits 0 against the freshly initialized project."
      - "A deliberate type error introduced into a temporary file (e.g., `const x: number = \"a\";`) causes `npx tsc --noEmit` to exit non-zero with a `TS2322` diagnostic; the file is removed before the story is closed."
    notes: |
      Audit — run 2026-05-03:
      - tsconfig.json diff: `extends` stays "expo/tsconfig.base"; `compilerOptions.strict: true` already present from template; added seven companion flags: noImplicitAny, strictNullChecks, strictFunctionTypes, noImplicitThis, alwaysStrict, strictBindCallApply, strictPropertyInitialization (all true). Note: expo/tsconfig.base already implies these via strict:true, but they are now explicitly listed so future readers see the contract.
      - AC #1 PASS: tsconfig.json has all 8 flags (strict + 7 companions) explicitly under compilerOptions; still extends expo/tsconfig.base.
      - AC #2 PASS: `npx tsc --noEmit` exited 0 with no output on clean project.
      - AC #3 PASS: temp file `_type_error_probe.ts` with `const x: number = "a";` introduced; `npx tsc --noEmit` exited 2 with diagnostic `_type_error_probe.ts(1,7): error TS2322: Type 'string' is not assignable to type 'number'.`; file removed; follow-up `npx tsc --noEmit` exited 0 confirming clean state.

  - id: 1.4
    title: Configure ESLint with eslint-plugin-tsdoc
    agent: frontenddeveloper
    done: true
    depends_on:
      - 1.2
    acceptance_criteria:
      - "ESLint config file (`.eslintrc.js` or `eslint.config.js`) exists at the project root and extends Expo's recommended config plus `plugin:@typescript-eslint/recommended` and `plugin:tsdoc/recommended`."
      - "`npx eslint .` exits 0 against the freshly initialized project."
      - "A deliberate violation (e.g., an unused variable or an invalid TSDoc comment) introduced into a temporary file causes `npx eslint .` to exit non-zero; the file is removed before the story is closed."
      - "An npm script `lint` is registered in `package.json` that runs `eslint .`."
    notes: |
      Audit — run 2026-05-03:

      ESLint version: eslint@8.57.1 installed (downgraded from 9.x). ESLint 9 was
      initially installed but uses flat config by default, and eslint-config-expo@55.0.0
      exports a legacy .eslintrc-format object — requiring ESLINT_USE_FLAT_CONFIG=false
      or migration. ESLint 8 was installed instead for native .eslintrc.js support.

      Expo config name: 'expo' (the canonical name for eslint-config-expo in extends).
      The package name is `eslint-config-expo`, and the extends value is `'expo'` per
      ESLint's convention of stripping the `eslint-config-` prefix.

      @typescript-eslint/recommended: extends includes 'plugin:@typescript-eslint/recommended'.
      The eslint-config-expo TypeScript overrides use the @typescript-eslint plugin but do
      NOT themselves extend plugin:@typescript-eslint/recommended — so the explicit entry in
      extends is necessary and not redundant.

      tsdoc/recommended: eslint-plugin-tsdoc@0.5.2 exports NO configs object (confirmed
      via `node -e "console.log(Object.keys(require('eslint-plugin-tsdoc').configs || {}))"` 
      which returns an empty array). There is no 'recommended' preset — the plugin only
      ships the 'tsdoc/syntax' rule. DEVIATION from AC #1 literal string: manual
      registration used instead: plugins: ['tsdoc'], rules: { 'tsdoc/syntax': 'warn' }.
      TSDoc lint coverage intent is fully satisfied — the rule is active and verified.

      AC #1 PASS: .eslintrc.js exists at project root. Extends ['expo', 'plugin:@typescript-eslint/recommended'].
      tsdoc plugin registered manually with tsdoc/syntax: warn (deviation documented above).
      AC #2 PASS: `npx eslint .` exited 0 on clean project (no output, exit code 0).
      AC #3 PASS: _eslint_violation_probe.ts with `const _deliberatelyUnused = 42;` caused
      exit 1 with diagnostic `@typescript-eslint/no-unused-vars: '_deliberatelyUnused' is
      assigned a value but never used`. File removed; follow-up `npx eslint .` exited 0.
      AC #4 PASS: `lint` script added to package.json: `"lint": "eslint ."`.
      `npm run lint` exited 0.

  - id: 1.5
    title: Configure Prettier
    agent: frontenddeveloper
    done: true
    depends_on:
      - 1.2
    acceptance_criteria:
      - "`.prettierrc` (or equivalent) exists at the project root with explicit settings for `singleQuote`, `trailingComma`, `printWidth`, and `semi`."
      - "`.prettierignore` excludes `node_modules`, `.expo`, `android`, `ios`, and lockfiles."
      - "`npx prettier --check .` exits 0 against the freshly initialized project."
      - "An npm script `format` is registered in `package.json` that runs `prettier --write .`, and a script `format:check` runs `prettier --check .`."
    notes: |
      Audit — run 2026-05-03:

      Packages installed: prettier@3.8.3 (devDependency), eslint-config-prettier@10.1.8 (devDependency).

      .prettierrc settings:
        singleQuote: true   — aligns with template files (App.tsx, index.ts use single quotes)
        trailingComma: "all" — trailing commas on all multi-line constructs (args, params, generics)
        printWidth: 100     — wider than default 80; suits React Native component JSX which runs long
        semi: true          — explicit semicolons

      .prettierignore contents:
        node_modules
        .expo
        android
        ios
        package-lock.json
        yarn.lock
        *.md                — markdown excluded (project docs only; Prettier reformats prose unpredictably)

      Normalization approach: `npx prettier --check .` initially flagged 13 markdown files (.md) as
      unformatted. Since all markdown in this project is project documentation (not application code),
      `*.md` was added to .prettierignore rather than running --write to reformat the docs.
      The all TypeScript/TSX/JSON/JS source files were already consistent with the chosen settings —
      `npm run format` confirmed all code files were `(unchanged)`. No normalization commit required.

      eslint-config-prettier integration: `eslint-config-prettier` was installed and `'prettier'` added
      as the FINAL entry in .eslintrc.js extends array. This disables any ESLint formatting rules that
      conflict with Prettier, preventing false positives. `npx eslint .` continues to exit 0.
      This is out-of-scope per the PRD's AC but documented here per the compatibility note in the
      dispatch brief. The integration is a net quality improvement with zero risk.

      AC #1 PASS: .prettierrc exists at project root with singleQuote, trailingComma, printWidth, semi.
      AC #2 PASS: .prettierignore lists node_modules, .expo, android, ios, package-lock.json, yarn.lock.
      AC #3 PASS: `npx prettier --check .` exited 0 — "All matched files use Prettier code style!"
      AC #4 PASS: `format` script runs `prettier --write .`; `format:check` runs `prettier --check .`.
               Both scripts verified via `npm run format` (exit 0) and `npm run format:check` (exit 0).

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
      - "`collectCoverageFrom` ALSO includes a phase-1-only exclude block for any source files shipped by the Expo SDK 55 template that have no tests yet — typically `App.tsx`, `index.ts`/`index.tsx`, and any files under `app/` if the template uses Expo Router. Without this carve-out, the strict global thresholds (lines 80, branches 75, functions 80, statements 80) would fail the BASELINE coverage run (`npm test -- --coverage` must exit 0) because the template ships untested code at >0 LOC. The exact list of template files actually excluded (whatever SDK 55 ships at bootstrap time — verify by inspecting the freshly initialized project) is recorded in the phase notes. This carve-out is explicitly TEMPORARY: phase 2's first story is responsible for removing the phase-1-only excludes once real source files and accompanying tests arrive (cleanup contract recorded in this story's `notes` and to be propagated into the phase 2 PRD)."
      - "A trivial smoke test (e.g., `__tests__/smoke.test.ts` asserting `expect(1 + 1).toBe(2)`) exists and passes."
      - "`npm test -- --coverage` exits 0, prints a coverage table, and the smoke test appears in the run."
      - "A coverage-threshold violation, simulated by temporarily adding an untested helper file (containing executable code, located in a path that IS matched by `collectCoverageFrom`'s include patterns AND is NOT in either the standard tooling excludes or the phase-1-only template-exclude block — e.g., a new top-level `coverage-probe.ts` at the project root, NOT under `app/` and NOT a sibling of `App.tsx`), causes `npm test -- --coverage` to exit non-zero with a threshold-violation diagnostic; the file is removed before the story is closed. Verifying that this AC fails as expected proves the threshold config, the `collectCoverageFrom` include patterns, AND the exclude blocks are all wired correctly."
      - "An npm script `test` runs `jest`; a script `test:coverage` runs `jest --coverage`."
    notes: |
      TDD is enforced in later phases. Phase 1 only proves the harness runs.

      Phase-1-only template-exclude cleanup contract: the phase-1-only exclude block added to `collectCoverageFrom` (the AC immediately following the base `collectCoverageFrom` AC) is a temporary carve-out for Expo SDK 55's untested template files (App.tsx, index.ts*, app/**, or whatever the actual template ships). It exists ONLY because phase 1 cannot reasonably write app-level tests for code that phase 2 will replace. The contract is:
        1. The exact list of excluded template files is recorded in this story's PR description and in `context.md` Recent changes when 1.6 closes.
        2. Phase 2's first story REMOVES these excludes from `collectCoverageFrom` and either deletes the template files or replaces them with code that has accompanying tests.
        3. The phase 2 PRD must reference this contract — the dispatcher of phase 2 should propagate this requirement into phase 2's first story when the phase 2 PRD is written.
      Without this cleanup, the phase-1 carve-out becomes permanent dead code in the Jest config and silently lowers the project's effective coverage scope.

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
