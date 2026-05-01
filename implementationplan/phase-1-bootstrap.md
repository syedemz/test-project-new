phase: 1
title: Project bootstrap
last_updated: 2026-05-01

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
      - "`node -v` reports a `v20.x` version on stdout; any other major halts the phase with an explicit message naming the detected version."
      - "`sdkmanager --list_installed` (resolved from `$ANDROID_HOME/cmdline-tools/latest/bin/`) prints output containing at least one line matching `platforms;android-` and at least one line matching `build-tools;`. An empty list, missing `$ANDROID_HOME`, or a missing `sdkmanager` binary halts the phase with a message that names the missing piece."
      - "`emulator -list-avds` (resolved from `$ANDROID_HOME/emulator/`) prints at least one non-empty AVD name on stdout. An empty list halts the phase with a message instructing the user to create an AVD via Android Studio's AVD Manager."
      - "No system-wide `java -version` check runs; the phase explicitly does not require a system Java install. The PRD's notes record that JDK is supplied by Android Studio."
      - "Each verification command and its observed output is captured in the phase notes (or the PR description) so the result is auditable."
    notes: |
      FAILED 2026-05-01: node -v reports v24.14.1 (major 24), not the required v20.x | blocker: install Node.js 20.x LTS (e.g. via nvm: `nvm install 20 && nvm use 20`) and ensure `node -v` reports v20.x before re-running this story.
      
      PARTIAL RESULTS CAPTURED FOR AUDIT:
      - `node -v` => v24.14.1 (FAIL — requires v20.x)
      - `$ANDROID_HOME` is not set in shell env; SDK detected at C:\Users\syede\AppData\Local\Android\Sdk
      - `sdkmanager --list_installed` (run via Android Studio JDK at C:\Program Files\Android\Android Studio\jbr): PASS
        platforms;android-33   | 2       | Android SDK Platform 33
        build-tools;33.0.2     | 33.0.2  | Android SDK Build-Tools 33.0.2
      - `emulator -list-avds` (C:\Users\syede\AppData\Local\Android\Sdk\emulator\emulator.exe): PASS
        Pixel_6_Pro_API_34
      - java -version: NOT RUN (JDK is supplied by Android Studio; no system Java check required per AC)

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
      - "`npx expo start` launches the Metro bundler without errors against the freshly initialized project (process exits cleanly when stopped; no red-screen output)."
    notes: |
      This is the install step. Configuration of TypeScript strictness, ESLint, Prettier, and Jest are separate stories below.

      BLOCKED 2026-05-01 by 1.1 (Node 20 LTS not installed). Clear this note when 1.1 passes.

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
      - "Jest is configured via the Expo Jest preset (`jest-expo`); `@testing-library/react-native` and `@testing-library/jest-native` are installed."
      - "`jest.config.js` (or `package.json` Jest block) sets `coverageThreshold.global` to `{ lines: 80, branches: 75, functions: 80, statements: 80 }` exactly as specified in architecture.md."
      - "A trivial smoke test (e.g., `__tests__/smoke.test.ts` asserting `expect(1 + 1).toBe(2)`) exists and passes."
      - "`npm test -- --coverage` exits 0, prints a coverage table, and the smoke test appears in the run."
      - "A coverage-threshold violation, simulated by temporarily adding an untested helper file with executable code, causes `npm test -- --coverage` to exit non-zero; the file is removed before the story is closed."
      - "An npm script `test` runs `jest`; a script `test:coverage` runs `jest --coverage`."
    notes: "TDD is enforced in later phases. Phase 1 only proves the harness runs."

  - id: 1.7
    title: Scaffold project folder structure with .gitkeep placeholders
    agent: frontenddeveloper
    done: false
    depends_on:
      - 1.2
    acceptance_criteria:
      - "Folders `styles/`, `labels/`, `Helper/`, and `navigation/` exist at the project root."
      - "Each of those folders contains a `.gitkeep` file so the empty directory is tracked by git."
      - "No source files (`.ts`, `.tsx`, `.json` other than `.gitkeep`) exist in those folders yet — they are intentionally empty placeholders for phase 2 and phase 3 to populate."
      - "`git status` after the story shows the four `.gitkeep` files as the only additions in those folders."
    notes: ""
