phase: 6
title: Landing screen and end-to-end glue
last_updated: 2026-04-30

context_summary: |
  Replace the LandingScreen stub with the v1 empty landing screen rendered inside
  the bottom tab navigator already wired in phase 3. Then run the manual
  end-to-end test on the Android emulator (register → modal → OK → login →
  landing) per architecture.md's testing strategy. After this phase, the v1 MVP
  is feature-complete and the project is ready for the user's sign-off.

stories:
  - id: 6.1
    title: Replace LandingScreen stub with v1 empty landing content
    agent: frontenddeveloper
    done: false
    depends_on: []
    acceptance_criteria:
      - "`screens/LandingScreen.tsx` renders a `<SafeAreaView>` with the `landing_screen_title` label as a heading using the `heading` typography from `styles/styles.ts`. No other content is rendered (architecture.md is explicit that the landing screen is empty for v1 beyond the tab bar itself)."
      - "All copy is sourced from `labels/labels.json`; all colors/spacing/typography from `styles/styles.ts`. No inline literals."
      - "The `testID=\"landing-screen-stub\"` from the phase-3 stub is replaced with `testID=\"landing-screen\"`. The auth-gate render-tree tests from phase 3 are updated in the same story to query the new testID; all phase-3 auth-gate tests still pass after the update. (This is the only auth-gate test update required; phase 3's structure remains otherwise unchanged.)"
      - "The bottom tab navigator from phase 3 still hosts this screen as its only tab; the tab bar remains visible (decision recorded in phase 3 story 3.4). A test renders `<AppRoutes />` and asserts `landing-screen` is in the tree and the tab labelled `landing_tab_home_label` is rendered."
      - "Component test covers: render produces the `landing-screen` testID, the heading text matches `landing_screen_title`'s `en` value."
    notes: ""

  - id: 6.2
    title: Document the manual end-to-end test script
    agent: frontenddeveloper
    done: false
    depends_on: []
    acceptance_criteria:
      - "A new file `tests/manual-e2e.md` (or equivalent under the project root) is committed containing a step-by-step manual test script that a human runs on the Android emulator to validate the v1 happy path."
      - "The script covers, in order: (1) clear AsyncStorage / use a fresh AVD profile so the registered list starts empty; (2) launch `npx expo start` and open on the Android emulator; (3) on Login, tap the link to Register; (4) submit the Register form with a fresh valid record (e.g., `email: smoke@example.com, username: smoke, password: Smoke1234`); (5) verify the success modal renders with the expected title/body; (6) verify tap-outside does NOT dismiss; (7) tap OK and verify Login is now displayed; (8) log in with the same credentials; (9) verify the post-auth landing screen renders with the bottom tab bar; (10) seed-fallback path: relaunch with empty storage, log in directly with `testuser` / `Test@123`, verify landing renders."
      - "Each step states explicitly what the user should see (the expected observation) so the test produces a pass/fail result, not a free-form impression."
      - "The script also lists the negative checks the architecture mandates: (a) on Register, submit with mismatched confirm password — expect inline mismatch error and NO modal; (b) on Login, submit wrong credentials — expect inline `login_invalid_credentials` text below the button; (c) start typing in either field on Login — expect the inline error to clear."
      - "The script lists the back-button checks: hardware back from RegisterScreen returns to Login; hardware back while the success modal is open dismisses the modal AND navigates to Login (same as OK); hardware back from LandingScreen exits the app."
    notes: ""

  - id: 6.3
    title: Execute the manual E2E test on the Android emulator and record the result
    agent: frontenddeveloper
    done: false
    depends_on:
      - 6.1
      - 6.2
    acceptance_criteria:
      - "The user (or the agent under user observation) runs the script from story 6.2 against the Android emulator, top to bottom."
      - "Each step in the script produces a pass/fail line in a results record committed to `tests/manual-e2e-results-<ISO-date>.md`."
      - "Every happy-path step passes, every negative check produces the expected error UX, and every back-button check matches the architecture contract."
      - "If any step fails, the story is NOT closed. The failure is diagnosed and either (a) fixed in the same phase via a follow-up story whose scope is bounded to the failure, or (b) converted to a phase-6 blocker entry in `context.md` Active blockers, with the user deciding next action."
      - "A short note is added to `context.md` Recent changes summarizing the result and linking the results file."
    notes: "This story is the only place in the project where a human-in-the-loop assertion gates phase completion."
