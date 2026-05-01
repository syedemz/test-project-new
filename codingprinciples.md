# Coding Principles — test-project-new

Used together with `C:\Users\syede\Claude-Master\engineeringprinciples.md`. If sections below are empty, the workspace engineeringprinciples apply by default. Fill these in only when this project needs principles that differ from or extend the workspace defaults.

The rules in this file have been checked for conflicts with the workspace `engineeringprinciples.md` and are intended to _extend_ — not contradict — them. Where the workspace file already covers a topic (TDD, DRY rule of three, no premature abstraction, definition of done, error handling, no commented-out code, etc.), this file does not restate it.

## General principles

- Keep modules small and single-purpose. If a file does more than one thing, split it.
- No hardcoded user-facing strings or style values inside components — both live in centralized files (see Frontend principles below). This is a project-specific extension of "Explicit over implicit" from the workspace principles.

## Frontend principles

### Component style

- Use **React Native functional components only**. No class components.
- Components must be **lean**: rendering + minimal local state. Anything beyond that (data shaping, formatting, validation, side-effect logic) belongs in a helper.
- Props must be explicitly typed (see TypeScript section) and destructured at the top of the component.
- One component per file. File name matches the component name (PascalCase, `.tsx`).

### Styling

- Use **React Native `StyleSheet`** (no inline `style={{ ... }}` objects, no third-party styling libraries).
- **All styles live in a single shared file**: `styles/styles.ts`. This file exports a single `StyleSheet.create({...})` object containing every style used across the app.
- Components import the styles object and reference styles by key:
  ```ts
  import styles from '../styles/styles';
  // ...
  <View style={styles.container}>
  ```
- Rationale: any visual change (color, spacing, typography) is made in exactly one place and propagates app-wide.
- Color values, font sizes, and spacing constants are defined as named `const` exports at the top of `styles.ts` and reused inside the StyleSheet — never inline literals like `#ff0000` or `16` scattered through styles.

### Hooks

- Use React Native hooks (`useState`, `useEffect`, `useCallback`, `useMemo`, etc.) where appropriate.
- Keep hook bodies **lean** — a `useEffect` should do one thing. If the effect needs more than a few lines, extract the logic into a helper and call it from the effect.
- Always declare the dependency array explicitly. Never omit it.
- Cleanup functions are required for any effect that subscribes, sets a timer, or opens a resource.

### Asynchronous data and I/O

Any operation that does not return synchronously must be written as asynchronous code. This includes — but is not limited to — loading data into a component on mount, calling a backend, hitting an external API or URL, reading from device storage, file I/O, and timers.

- Use `async / await`. **No raw `.then()` / `.catch()` chains** and no callback-style APIs.
- Side-effecting async work inside a component runs from a `useEffect`, never directly in the render body. Define an `async` function inside the effect and invoke it; do not mark the effect callback itself `async` (React expects an effect to return either nothing or a cleanup function, not a Promise).
  ```ts
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      const data = await fetchUserProfile(userId);
      if (!cancelled) setProfile(data);
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [userId]);
  ```
- Always model the three states explicitly: **loading**, **ready**, **error**. Components must render a loading state while data is in flight and an error state when the call fails — never a blank screen.
- Network and storage calls live in helpers (e.g., `Helper/apiHelper.ts`, `Helper/storageHelper.ts`), not inline in components. The helper exposes a typed async function; the component awaits it.
- Errors from `await` are caught locally and surfaced (component error state, log entry) — never swallowed in an empty `catch`. (Workspace rule: errors propagate explicitly.)
- Cancel or guard against late responses on unmount — either via an `AbortController` passed into `fetch`, or via the `cancelled` flag pattern shown above. This prevents `setState` on an unmounted component.
- Return types of async helpers are `Promise<T>` with `T` fully typed — never `Promise<any>`.

### Helpers

- All reusable, non-rendering functionality lives in a single folder: **`Helper/`** at the project root.
- Helpers are grouped by concern (e.g., `Helper/dateHelper.ts`, `Helper/validationHelper.ts`, `Helper/storageHelper.ts`).
- Helpers must be pure where possible (no side effects, no React state).
- Extraction follows the workspace **rule of three**: two similar pieces of code stay duplicated; on the third occurrence (or sooner if the shared meaning is already obvious), extract into `Helper/`. Don't extract speculatively.

### Labels and i18n

- All user-facing strings (labels, button text, messages, errors) live in a single file: **`labels/labels.json`**.
- Each label entry has a key and per-language values, with `en` as the required default. Schema:
  ```json
  {
    "welcome_title": {
      "en": "Welcome",
      "es": "Bienvenido"
    },
    "submit_button": {
      "en": "Submit"
    }
  }
  ```
- A shared TypeScript type for the labels structure lives in `labels/labels.types.ts` so components get autocomplete and compile-time checking on label keys.
- Components import the **default English value** for the label they need:
  ```ts
  import labels from '../labels/labels.json';
  // ...
  <Text>{labels.welcome_title.en}</Text>
  ```
- No raw string literals inside components. If a label is missing from `labels.json`, add it there first, then reference it.
- A label-resolver helper may be added later (`Helper/labelHelper.ts`) once a runtime language switch is needed — keep components importing through the same indirection so the switch is non-breaking.

## Backend principles

N/A — this project has no backend.

## Language-specific principles

### TypeScript (mandatory for all frontend code)

- **The entire frontend is written in TypeScript.** No plain `.js`/`.jsx` files in the app source — only `.ts` / `.tsx`. Config files (e.g., `babel.config.js`, `metro.config.js`) may remain JavaScript where the toolchain requires it.
- `tsconfig.json` runs in **strict mode**: `"strict": true`, `"noImplicitAny": true`, `"strictNullChecks": true`, `"noUncheckedIndexedAccess": true`, `"noImplicitReturns": true`.
- **No `any`.** If a type is genuinely unknown, use `unknown` and narrow before use. `any` requires an inline justification comment and is reviewed as a code smell.
- **No non-null assertions (`!`)** unless the invariant is enforced one line above and noted in a comment.
- Prefer `interface` for object shapes that may be extended; prefer `type` for unions, intersections, and mapped types.
- Component props are declared with an explicit `Props` interface or type alias above the component. No inline anonymous prop types.
- Function signatures are fully typed — explicit parameter types and explicit return types on exported functions. Inferred return types are acceptable for short, non-exported helpers.
- Use `readonly` for arrays and object fields that should not mutate after construction.
- Discriminated unions over boolean flags when modeling alternative states (e.g., `{ status: 'loading' } | { status: 'ready'; data: Foo } | { status: 'error'; error: Error }`).
- Enums are avoided in favor of string literal union types (`type Status = 'idle' | 'loading' | 'ready'`).
- `import type { ... }` is used for type-only imports to keep the runtime bundle clean.

### Documentation comments (TSDoc)

This project uses **TSDoc** for API-level documentation. This is a deliberate, scoped extension of the workspace "minimal comments" rule (`engineeringprinciples.md` line 109), not an override of it: inline "what" comments inside function bodies remain banned. TSDoc blocks document the _contract_ of an exported symbol so it surfaces in IntelliSense, hover tooltips, and onboarding.

- **Every exported component, hook, helper, and type** has a TSDoc block (`/** ... */`) directly above it.
- A TSDoc block describes purpose, parameters, return value, thrown errors (if any), and any non-obvious behavior or constraint. Use the standard tags: `@param`, `@returns`, `@throws`, `@example`, `@deprecated`.
- Example:
  ```ts
  /**
   * Loads the user profile for the given user id.
   *
   * Performs a network call against the profile API. The caller is responsible
   * for cancelling on unmount (see Asynchronous data and I/O principles).
   *
   * @param userId - The id of the user whose profile to load.
   * @returns The resolved {@link UserProfile}.
   * @throws {ApiError} When the network call fails or returns a non-2xx status.
   */
  export async function fetchUserProfile(userId: string): Promise<UserProfile> { ... }
  ```
- **Inline body comments remain minimal.** Inside a function body, only add a comment when the _why_ is non-obvious — a constraint, a workaround, a subtle invariant. Never describe what the next line of code does; the names should already say that.
- No commented-out code. No "removed X here" markers. Version control is the history.
- TSDoc is enforced by lint rules (`eslint-plugin-tsdoc`) on exported symbols. A missing or malformed TSDoc block on an exported symbol is a lint error.

### React Native

- Functional components + hooks only.
- Prefer `const` over `let`. No `var`.
- Async work uses `async/await`, not raw `.then()` chains.
- No direct DOM-style assumptions — this is React Native, not React DOM.

## Testing principles

The workspace TDD rules apply in full. Project-specific extensions:

- **Every component has a test suite** colocated with it (`MyComponent.tsx` + `MyComponent.test.tsx`) or under a parallel `__tests__/` folder.
- Every helper in `Helper/` has its own unit test file.
- Tests use **Jest + React Native Testing Library**, written in TypeScript (`.test.tsx` / `.test.ts`).
- A component's test suite covers, at minimum: render without crash, prop variations, user interaction (where applicable), and any conditional rendering branches. Pure styling concerns fall under the workspace visual-work carve-out and are not unit-tested.
