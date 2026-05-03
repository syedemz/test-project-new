# test-project-new — Context

## Elevator pitch
<1-2 sentences. Auto-populate from architecture.md after /create-plan, or user fills now.>

## Current phase
Phase 1 — Project bootstrap (in progress). Stories 1.1–1.6 complete. Next: story 1.7 (scaffold project folder structure).

## Active blockers
- None. (`$ANDROID_HOME` was set at Windows User scope to `C:\Users\syede\AppData\Local\Android\Sdk` on 2026-05-01 and is now visible to the bash subshell — verified before the phase 1 re-dispatch. `$ANDROID_SDK_ROOT` remains unset; not required by architecture.md or the phase 1 PRD.)

## Critical design decisions
- 2026-05-01: Node pin raised from `20.x LTS` to `24.x` to match the host (`v24.14.1`). Expo SDK 55 was originally evaluated against Node 20; Node 24 may not be officially supported. If `npx expo` install or bundler breaks at any point, suspect Node first and revert to Node 20 LTS via `nvm`. Recorded in architecture.md (pinned-version table + Open questions).

## Recent changes
- 2026-04-30: project created via /start-project
- 2026-04-30: GitHub repo bootstrapped via /setup-repo (visibility: public, url: https://github.com/syedemz/test-project-new)
- 2026-05-01: story 1.1 first attempt — `node -v` v24.14.1 failed against original `v20.x` AC; SDK/AVD checks passed (manual `$ANDROID_HOME` resolution); audit captured in PR #1 and story 1.1 notes
- 2026-05-01: architecture.md, phase-1-bootstrap.md, and context.md updated — Node pin raised from 20.x LTS to 24.x; story 1.1 AC #1 amended; story 1.1 will re-dispatch on next /implement-phase 1 run
- 2026-05-01: `$ANDROID_HOME` set at Windows User scope to `C:\Users\syede\AppData\Local\Android\Sdk` and verified visible to the bash subshell — clears the prior active blocker for story 1.1
- 2026-05-01: phase 1 PRD revised against `phasebrainstorms/phase-1-bootstrap-brainstorm.md` — non-interactive Metro verification contract on 1.2 AC #5, `collectCoverageFrom` AC added to 1.6, `@testing-library/jest-native` made conditional on RTL bundling, folder-casing intent recorded on 1.7, cross-doc and Node-fallback notes added to 1.2
- 2026-05-03: story 1.1 re-run complete — all ACs passed: node v24.14.1 (v24.x AC), sdkmanager.bat listed platforms;android-33 and build-tools;33.0.2, emulator listed Pixel_6_Pro_API_34, no system java -version run; story marked done: true
- 2026-05-03: story 1.2 complete — Expo SDK 55 TypeScript project initialized (temp+copy approach); `npx expo --version` = 55.0.27; `npm view expo version` = 55.0.19; actual react-native installed by SDK 55 = 0.83.6 (NOT 0.85.x — architecture.md pinned-version table updated in same commit); @react-navigation/* target 7.x confirmed compatible (latest stable 7.2.2, compatible with React 19.2.0 + RN 0.83.6, no architecture update needed); Metro CI-mode verified: "Waiting on http://localhost:8081" within 60s, no errors, process tree terminated via taskkill //T //F, no orphaned node processes; story marked done: true
- 2026-05-03: story 1.3 complete — tsconfig.json updated to explicitly list all 8 strict-mode flags (strict + noImplicitAny, strictNullChecks, strictFunctionTypes, noImplicitThis, alwaysStrict, strictBindCallApply, strictPropertyInitialization); `npx tsc --noEmit` exited 0 on clean project; TS2322 deliberately triggered and confirmed; story marked done: true
- 2026-05-03: story 1.4 complete — .eslintrc.js created with extends ['expo', 'plugin:@typescript-eslint/recommended'] + manual tsdoc plugin registration (tsdoc/syntax: warn — no 'recommended' preset exists in eslint-plugin-tsdoc@0.5.2); eslint@8.57.1 installed (ESLint 9 incompatible with eslint-config-expo legacy format); `npx eslint .` exited 0; violation probe triggered exit 1; `lint` script added to package.json; story marked done: true
- 2026-05-03: story 1.5 complete — prettier@3.8.3 and eslint-config-prettier@10.1.8 installed; .prettierrc created (singleQuote:true, trailingComma:"all", printWidth:100, semi:true); .prettierignore created (node_modules, .expo, android, ios, lockfiles, *.md); `npx prettier --check .` exited 0 — all code files already clean; `format` and `format:check` scripts added to package.json; 'prettier' added as final entry in .eslintrc.js extends to disable conflicting ESLint formatting rules; story marked done: true
- 2026-05-03: story 1.6 complete — jest@29.7.0, jest-expo@55.0.16, @testing-library/react-native@13.3.3 (RTL), and react-test-renderer@19.2.0 installed; RTL 13.3.3 ships built-in matchers (toHaveTextContent etc.) — @testing-library/jest-native skipped (deprecation path, matchers natively bundled since RTL 12.4+); jest.config.js created with jest-expo preset, coverageThreshold.global={lines:80,branches:75,functions:80,statements:80}, collectCoverageFrom includes **/*.{ts,tsx} with standard excludes PLUS phase-1-only template excludes ['!App.tsx','!index.ts'] (exact SDK 55 template files — no app/ directory in template); __tests__/smoke.test.ts added (expect(1+1).toBe(2)); test and test:coverage scripts added to package.json; baseline npm test --coverage exits 0; violation probe coverage-probe.ts at root triggered all 4 threshold diagnostics (exit 1) then removed; story marked done: true. PHASE-2 CLEANUP CONTRACT: phase 2's first story must remove '!App.tsx' and '!index.ts' from collectCoverageFrom in jest.config.js and replace/delete those template files with tested code.
