phase: 4
title: Register screen
last_updated: 2026-04-30

context_summary: |
  Replace the RegisterScreen stub with the real registration flow: form layout,
  full client-side validation per architecture.md, AsyncStorage write of new user
  records, and the registration-success modal that navigates to Login on OK.
  After this phase, a user can register but cannot yet log in (phase 5 wires the
  Login screen against the same storage).

stories:
  - id: 4.1
    title: Build RegisterScreen layout with fields and per-field validation rendering
    agent: frontenddeveloper
    done: false
    depends_on: []
    acceptance_criteria:
      - "`screens/RegisterScreen.tsx` renders a screen titled via `register_screen_title`. Inside it, four `<TextInput>` controls for `email`, `username`, `password`, `confirmPassword`, each with a `<Text>` label and a `placeholder` prop populated from the corresponding `register_*_label` and `register_*_placeholder` label keys."
      - "Password and confirmPassword inputs have `secureTextEntry={true}`. The email input has `keyboardType=\"email-address\"` and `autoCapitalize=\"none\"`. The username input has `autoCapitalize=\"none\"`."
      - "Each input is paired with an inline error `<Text>` element (initially hidden) whose color is `styles.error` from `styles/styles.ts`. When the field's value fails the corresponding `validationHelper` rule on blur (or on submit), the inline error renders the matching label-keyed copy (e.g., `register_validation_username_invalid`, `register_validation_password_weak`, `register_validation_password_mismatch`)."
      - "ConfirmPassword's mismatch check fires on blur of the confirmPassword field AND again on submit, but NOT on every keystroke (architecture.md is explicit about timing)."
      - "All copy is sourced from `labels/labels.json`. No raw English strings are present in the screen file."
      - "All colors, spacing, and typography are sourced from `styles/styles.ts`. No inline color or spacing literals."
      - "The screen replaces the body of the phase-3 stub; the file path and default export name stay the same so `AuthRoutes` does not change. The `testID=\"register-screen-stub\"` is removed; a new stable testID `register-screen` is added to the screen root."
      - "Component tests cover: render with default state, blur on each field with invalid input renders the matching error label key, blur with valid input does not render an error, confirmPassword mismatch renders only after blur (not after every keystroke)."
      - "Submit handling, AsyncStorage writes, the success modal, and navigation are NOT in this story — they are stories 4.2 and 4.3."
    notes: ""

  - id: 4.2
    title: Wire submit handler with full validation, AsyncStorage write, and storage-failure UX
    agent: frontenddeveloper
    done: false
    depends_on:
      - 4.1
    acceptance_criteria:
      - "Tapping the submit button (label key `register_button`) runs the full `validationHelper` suite across all four fields. If any field fails, all matching inline errors render and the AsyncStorage write does NOT occur."
      - "Username uniqueness is enforced at submit: lowercased comparison against the existing registered list (via `storageHelper.readUsers`) AND against the seed username (`testuser`). A collision renders the `register_validation_username_in_use` error inline against the username field; no write occurs."
      - "Email uniqueness is enforced at submit: lowercased comparison against the existing registered list. A collision renders `register_validation_email_in_use` inline against the email field; no write occurs."
      - "On a fully valid submission, a new `StoredUser` record is appended via `storageHelper.writeUsers([...existing, newRecord])` with `username` stored in original case, `email` stored lowercased, `password` stored as-is (plaintext per architecture.md v1), `createdAt` an ISO 8601 timestamp."
      - "If `storageHelper.writeUsers` rejects, an inline non-blocking error renders using the `register_storage_error` label key. The form remains editable. No crash. No silent success. A test simulates the rejection (mock the helper to throw) and asserts the inline error renders and the form is still interactive."
      - "On a successful write, the screen sets a local `success` state that triggers the modal — but the modal itself is wired in story 4.3. This story exposes the success state via a test-only assertion: a test asserts that after a valid submit, the modal trigger condition is true (e.g., a state hook returns true, OR the modal component is now in the tree if 4.3 has already merged)."
      - "Component tests cover: each validation reason on submit, username collision against registered list, username collision against seed, email collision against registered list, successful write produces a record matching the StoredUser shape exactly, storage failure renders the storage-error label and leaves the form editable."
    notes: ""

  - id: 4.3
    title: Implement registration success modal with OK navigation and back-button intercept
    agent: frontenddeveloper
    done: false
    depends_on:
      - 4.2
    acceptance_criteria:
      - "After story 4.2's `success` state flips to true, a modal component renders over the RegisterScreen. The modal title is `registration_success_title`, body is `registration_success_body`, single primary button label is `ok_button`. All copy is label-keyed."
      - "Tap-outside-to-dismiss is disabled (e.g., `<Modal>` is configured to ignore backdrop touches). There is no auto-timeout. The only way to dismiss the modal is the OK button or the hardware back button."
      - "Tapping OK both dismisses the modal AND navigates to the Login route (`navigation.navigate(AUTH_ROUTES.LOGIN)`). The dismiss and navigation happen as a single user-observable action — there is no flash of the RegisterScreen between the two."
      - "Android hardware back press while the modal is open is intercepted (via `BackHandler` listener registered while the modal is open and unregistered when it closes) and triggers the same OK handler — modal dismisses AND navigates to Login. A test fires the `hardwareBackPress` event and asserts navigation occurred."
      - "Component tests cover: modal does not render before successful submit, modal renders after successful submit, OK button dismisses modal and navigates to Login, hardware back press intercepts and behaves identically to OK, tap-outside does NOT dismiss (a test fires a press event on the modal backdrop and asserts the modal is still rendered)."
    notes: ""
