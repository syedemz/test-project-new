# Reusable Component Catalog + Shared Styles — Design

**Date:** 2026-05-17
**Project:** `test-project-new`
**Status:** Approved — ready for implementation planning
**Scope:** Project-local (does not modify workspace-level rules)

---

## 1. Goal

Make reusable components the standard practice in `test-project-new` by introducing a small enforced component catalog and a tightly-scoped shared-layout-styles file. The result:

- **Consistency by construction.** Screens physically cannot render two different-looking buttons because they import the same `<Button />` from one place.
- **Smaller test surface for new screens.** Catalog components are tested exhaustively in one place; new screens assert only wiring, not visual rendering.
- **Leaner screens.** A typical new screen is an outer view, nested layout views, and catalog component instances — no local `createStyles` for the common cases.
- **Rule files copyable to the next project.** The new rules live in `theme.md` and `codingprinciples.md` so they can be lifted verbatim into a future project's scaffold.

---

## 2. Non-goals

These are explicitly out of scope. Future work may revisit them; this phase does not.

- **No migration of legacy screens.** `LoginScreen.tsx`, `RegisterScreen.tsx`, `LandingScreen.tsx` keep their existing inline `createStyles` and existing test coverage. They predate this rule and conform incrementally when touched for unrelated reasons.
- **No new components beyond the 9 catalog primitives.** `Toggle`, `Slider`, `BottomSheet`, `TabSwitcher`, `SearchBar`, `ListRow`, `SelectableRow`, `BottomTabBar`, `Header`, `Modal`, `NotificationDot`, `PremiumSection` are deferred until a screen needs them. They remain in `theme.md` §9 as design guidance.
- **No workspace-level changes.** `engineeringprinciples.md`, `gitbranching.md`, `contextmanagement.md`, and the `/start-project` template are untouched. Copying the new rules into a future project is a manual or follow-up step.
- **No changes** to `theme.ts` tokens, `typography.ts`, `ThemeProvider.tsx`, the labels system, helpers organization, async-data rules, or any other section of `codingprinciples.md` not listed in §8.

---

## 3. Decisions locked during brainstorming

| # | Question | Decision |
|---|---|---|
| 1 | Catalog scope | Lean starter set (9 components: `Button`, `IconButton`, `TouchableArea`, `TextInput`, `FormField`, `Chip`, `ChipRow`, `Card`, `Screen`) plus `commonStyles.ts`. |
| 2 | Variant & escape-hatch philosophy | A+ — strict closed API; typed spacing-scale props (`marginTop?: keyof Theme['spacing']`) added **reactively** when a real need emerges, never preemptively; no `style` / `containerStyle` / `textStyle` pass-through on any catalog component. |
| 3 | `commonStyles.ts` scope | Layout-only fragments; rule-of-two threshold; `createCommonStyles(theme)` factory only (never a static `StyleSheet.create`); four hard rules including no silent deletion. |
| 4 | Migration strategy | Existing 3 screens grandfathered; rules apply to all new code. |
| 5 | Implementation scope | Rules + reference catalog ship together in one phase; no screen migrations. |

---

## 4. Architecture & file layout

Additions only. Nothing existing moves or renames.

```
src/
├── components/                       ← NEW directory
│   ├── Button.tsx
│   ├── IconButton.tsx
│   ├── TouchableArea.tsx
│   ├── TextInput.tsx
│   ├── FormField.tsx
│   ├── Chip.tsx
│   ├── ChipRow.tsx
│   ├── Card.tsx
│   ├── Screen.tsx
│   └── index.ts                      ← barrel: re-exports all components
├── theme/
│   ├── theme.ts                      ← unchanged
│   ├── typography.ts                 ← unchanged
│   ├── ThemeProvider.tsx             ← unchanged
│   ├── commonStyles.ts               ← NEW (createCommonStyles factory)
│   └── index.ts                      ← updated to re-export commonStyles
└── screens/                          ← unchanged (legacy screens stay as-is)

__tests__/
└── components/                       ← NEW directory
    ├── Button.test.tsx
    ├── IconButton.test.tsx
    ├── TouchableArea.test.tsx
    ├── TextInput.test.tsx
    ├── FormField.test.tsx
    ├── Chip.test.tsx
    ├── ChipRow.test.tsx
    ├── Card.test.tsx
    └── Screen.test.tsx

__tests__/theme/
└── commonStyles.test.ts              ← NEW (smoke test factory in both themes)
```

**Import conventions (codified in `codingprinciples.md`):**

- Components: `import { Button, TextInput, FormField } from '@/components'`
- Common styles: `import { createCommonStyles } from '@/theme/commonStyles'` (or via the `@/theme` barrel once re-export is added)
- Theme: `import { useTheme } from '@/theme/ThemeProvider'` (unchanged)
- Typography: `import { textStyles } from '@/theme/typography'` (unchanged)

**Forbidden imports in `src/screens/**` (enforced by ESLint — see §8):**

- `TouchableOpacity` from `react-native`
- `Pressable` from `react-native`
- `TextInput` from `react-native`
- `Switch` from `react-native` (deferred — gated on future `Toggle` component)
- `Modal` from `react-native` (deferred — gated on future `BottomSheet` component)

Imports of `View`, `Text`, `Image`, `ScrollView`, `Dimensions`, etc. from `react-native` remain permitted — those are not covered by the catalog.

**Barrel file rationale.** `src/components/index.ts` is a pure re-export so screens can write a single import line: `import { Button, TextInput, FormField } from '@/components'`. No logic, no side effects.

---

## 5. Component catalog (props & semantics)

Each catalog component obeys the A+ rule: closed prop surface, no `style` pass-through, optional typed spacing-scale props added reactively. Every public component has a TSDoc block and exports a `Props` interface above it (per `codingprinciples.md` line 113). All visual values come from `useTheme()` + `textStyles.*` — no literals.

### 5.1 `Button` — every text button across the app

Maps to `theme.md` §9.1 / §9.2 / §9.3.

```ts
interface ButtonProps {
  variant: 'primary' | 'secondary' | 'ghost';
  label: string;                        // resolved from labels.json by caller
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;                    // shows spinner; disables press
  fullWidth?: boolean;                  // default true
  iconLeft?: React.ReactNode;           // optional lucide icon
  iconRight?: React.ReactNode;
  accessibilityLabel?: string;          // defaults to `label`
  testID?: string;
}
```

Internally uses `Pressable`. `disabled` AND `loading` both disable press. Variants map 1:1 to §9.1 (primary, pink, white text), §9.2 (secondary, mint, black text), §9.3 (ghost, transparent, pink text + optional border).

### 5.2 `IconButton` — icon-only tap target

For things like the `X` close in `LandingScreen` header.

```ts
interface IconButtonProps {
  icon: React.ReactNode;                // 24×24 lucide icon
  onPress: () => void;
  accessibilityLabel: string;           // required (no label text to fall back on)
  tone?: 'primary' | 'inverse' | 'tertiary';  // default 'primary'
  disabled?: boolean;
  testID?: string;
}
```

Always renders a 44×44 hit area with the icon centered, per `theme.md` §13 accessibility minimum.

### 5.3 `TouchableArea` — generic tappable container

For pressable cards / rows that aren't text buttons (e.g., the 3-column action buttons in `LandingScreen`, or a list row that opens a detail). Wraps `Pressable`, enforces touch-target sizing, propagates pressed-state opacity (0.85 per §12), enforces `accessibilityLabel`.

```ts
interface TouchableAreaProps {
  onPress: () => void;
  accessibilityLabel: string;
  disabled?: boolean;
  children: React.ReactNode;
  testID?: string;
}
```

**No `style` prop.** The caller wraps `TouchableArea` in its own `<View style={styles.localLayout}>` for screen-specific positioning.

### 5.4 `TextInput` — replaces `react-native`'s `TextInput`

Maps to `theme.md` §9.4.

```ts
interface TextInputProps {
  value: string;
  onChangeText: (next: string) => void;
  placeholder?: string;
  secureTextEntry?: boolean;
  multiline?: boolean;
  numberOfLines?: number;               // meaningful only with multiline
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  autoCorrect?: boolean;
  keyboardType?: 'default' | 'email-address' | 'numeric' | 'phone-pad';
  hasError?: boolean;                   // toggles error border styling
  testID?: string;
}
```

The component handles focus border, placeholder color (`text.tertiary`), background (`bg.input`), `radii.md`, min-height 48 internally. `placeholderTextColor` is set internally — never passed by caller.

### 5.5 `FormField` — label + input + inline error wrapper

```ts
interface FormFieldProps {
  label: string;
  error?: string;                       // when set, hasError flows to child input
  children: React.ReactNode;            // expected to be a <TextInput />
  testID?: string;
}
```

`FormField` accepts a `TextInput` as `children` and clones it (`React.cloneElement`) with `hasError = !!error`. This keeps screen markup readable:

```tsx
<FormField label={labels.email.en} error={emailError}>
  <TextInput value={email} onChangeText={setEmail} />
</FormField>
```

…without forcing `FormField` to know about every prop of `TextInput`.

Error styling uses `commonStyles.errorTextBlock` so error appearance is the same across all FormFields.

### 5.6 `Chip` — display-only pill (icon + label)

Maps to the chip pattern currently duplicated across `LoginScreen`, `RegisterScreen`, `LandingScreen` (the `Chip` sub-component inlined inside `LandingScreen`).

```ts
interface ChipProps {
  icon?: string;                        // emoji or short string; lucide-via-slot later
  label: string;
  testID?: string;
}
```

Non-tappable in v1. A future `SelectableChip` becomes its own component when needed (rule of three).

### 5.7 `ChipRow` — wrapping flex row of Chips

```ts
interface ChipRowProps {
  children: React.ReactNode;            // expected to be Chip elements
  testID?: string;
}
```

Wraps with `flexDirection: 'row'`, `flexWrap: 'wrap'`, `gap: theme.spacing.sm`. Replaces the inlined `ChipRow` sub-component currently in `LandingScreen`.

### 5.8 `Card` — visual container (no press)

Maps to `theme.md` §9.6. A pressable card composes: `<TouchableArea><Card>…</Card></TouchableArea>`.

```ts
interface CardProps {
  variant?: 'standard' | 'muted';       // default 'standard'
  children: React.ReactNode;
  testID?: string;
}
```

- `standard` — `bg.surface` + 1px `border.default` + `radii.lg` + `padding: spacing.lg`.
- `muted` — `bg.muted` + no border + `radii.lg` + `padding: spacing.xl` (matches `LandingScreen` `sectionCard`).

`premium` variant deferred — `§9.15 PremiumSection` becomes its own component when first needed.

### 5.9 `Screen` — outer wrapper for every screen

Replaces the `View` + `useSafeAreaInsets` + `paddingHorizontal: theme.spacing.lg` boilerplate inlined in `LoginScreen` and `RegisterScreen`.

```ts
interface ScreenProps {
  children: React.ReactNode;
  scrollable?: boolean;                 // default false; when true uses ScrollView internally
  edges?: ('top' | 'bottom' | 'left' | 'right')[]; // default ['top', 'bottom']
  testID?: string;
}
```

Provides safe-area inset handling, `flex: 1`, `bg.primary` background, and `paddingHorizontal: spacing.lg`. Does **not** provide vertical padding — that's screen-local.

### 5.10 Cross-cutting rules for the catalog

- **No `style` / `containerStyle` / `textStyle` / `contentContainerStyle` prop on any catalog component.** Period.
- **All labels still come from `labels.json`.** Components take `label: string` props; they never know what the string means or what language it's in.
- **All `onPress` handlers are owned by screens.** Components know nothing about navigation, business logic, or persistence.
- **All visual tokens come from `useTheme()` + `textStyles.*`.** No hex literals, no font names, no raw numbers — including inside the component file itself.

---

## 6. The A+ variant & API discipline

These rules are codified into `codingprinciples.md` Frontend → Component Catalog (new subsection — see §8). They are not aspirational — they are the rules.

**Rule 1 — Closed prop surfaces.**
Every catalog component has a documented `Props` interface. Adding a prop requires:
1. A second screen demonstrating the need (no speculative props).
2. The new prop documented in the component's TSDoc.
3. If the prop changes visual behavior, a corresponding update to `theme.md` §9.

**Rule 2 — No `style` / `containerStyle` / `textStyle` / `contentContainerStyle` prop on any catalog component.** Not now, not later. Caller-side composition uses Rule 3 (typed spacing-scale props) or wrapping `<View>`s.

**Rule 3 — Typed spacing-scale props added reactively.**
When wrapping a catalog component in `<View style={{ marginTop: … }}>` becomes repetitive (≥3 occurrences across screens), the component may add a typed spacing prop:

```ts
interface ButtonProps {
  // ...
  marginTop?: keyof Theme['spacing'];   // 'lg' | 'xl' | 'xxl' | ... — never a raw number
  marginBottom?: keyof Theme['spacing'];
}
```

The component maps the token to the actual value internally: `theme.spacing[marginTop]`. Raw numbers remain forbidden, even here.

**Rule 4 — Variants are string-literal unions, not strings.**
Per `codingprinciples.md` line 117 (no enums, string-literal unions only). Restated here for the catalog: `variant: 'primary' | 'secondary' | 'ghost'`, never `variant: string`.

**Rule 5 — Screens never import from `react-native` the things the catalog covers.**
Enforced by ESLint `no-restricted-imports` scoped to `src/screens/**` (see §8). The catalog components themselves import freely from `react-native` — that's their job.

**Rule 6 — Composition through children, not config.**
Catalog components are leaves. They do not accept `extraSlot`, `rightAccessory`, or other slot-like props. If a screen needs a button-plus-extra-thing, it composes them in JSX.

**Rule 7 — No magic defaults.**
Required props have no `?`. Optional props with defaults document the default in TSDoc. No prop's default changes based on the value of another prop.

**Scenario this discipline explicitly forbids.** A future screen wants a Button with brand-mint background. Under A+, the answer is NOT `<Button style={{ backgroundColor: theme.colors.brandMint }}>`. The answer is either:
1. Add `'mint'` to the `Button` variant union (if it's a real, repeated design need, documented in `theme.md`), OR
2. The screen is wrong — go back to one of the three existing variants.

No "just this once."

---

## 7. `commonStyles.ts` boundary & contract

**File location:** `src/theme/commonStyles.ts`. Re-exported from `src/theme/index.ts` for clean imports.

**Shape — factory only, never a static `StyleSheet.create`:**

```ts
// src/theme/commonStyles.ts
import { StyleSheet } from 'react-native';
import type { Theme } from './theme';

export const createCommonStyles = (theme: Theme) =>
  StyleSheet.create({
    // -- Layout fragments --
    screenContent: {
      flex: 1,
      paddingHorizontal: theme.spacing.lg,
    },
    centerContent: {
      alignItems: 'center',
      justifyContent: 'center',
    },
    formStack: {
      gap: theme.spacing.lg,
    },
    sectionDivider: {
      height: 1,
      backgroundColor: theme.colors.border.default,
      marginVertical: theme.spacing.lg,
    },
    errorTextBlock: {
      marginTop: theme.spacing.xs,
      // textStyles.body.sm spread here in real file
      color: theme.colors.status.error,
    },
  });

export type CommonStyles = ReturnType<typeof createCommonStyles>;
```

**Consumption pattern.**

```tsx
import { useMemo } from 'react';
import { useTheme } from '@/theme/ThemeProvider';
import { createCommonStyles } from '@/theme/commonStyles';

const LoginScreen = () => {
  const theme = useTheme();
  const common = useMemo(() => createCommonStyles(theme), [theme]);
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <Screen>
      <View style={common.formStack}>{/* ... */}</View>
    </Screen>
  );
};
```

A screen with **no** screen-specific styles defines no local `createStyles` at all — it consumes only `commonStyles` and catalog components. Many new screens are expected to reach this goal state.

**Initial contents — seeded only from real duplication observed in `LoginScreen` + `RegisterScreen` + `LandingScreen`:**

- `screenContent` — `{ flex: 1, paddingHorizontal: theme.spacing.lg }`
- `centerContent` — `{ alignItems: 'center', justifyContent: 'center' }`
- `formStack` — vertical gap pattern duplicated across login + register
- `errorTextBlock` — inline form errors in login + register
- `sectionDivider` — anticipated for `LandingScreen` and form screens

The exact set is finalized during implementation by reading the three legacy screens. A fragment that appears only once does NOT go into `commonStyles.ts`; it stays in the screen's local `createStyles`.

**Four hard rules for `commonStyles.ts`:**

1. **Layout only.** No backgrounds intended to look like components (use a catalog component). No text-style shortcuts (use `textStyles.*`). No "almost-component" combinations (use the catalog).
2. **Rule of two.** A fragment may be added when it is used in ≥2 distinct screens or files. One-off styles stay in the screen's `createStyles`.
3. **Factory only.** `createCommonStyles(theme)` is the only export. No top-level static `StyleSheet.create`. No exported `commonColors` or `commonSpacing` — tokens already live in `theme.ts`.
4. **No silent deletion.** A fragment that becomes unused is removed in a dedicated cleanup PR with a justification — not silently dropped by whoever happens to delete the last call site.

**What `commonStyles.ts` is NOT:**
- Not a place for component-like styles (`primaryButtonContainer`, `submitButtonText`) — those live inside the component.
- Not a place for screen-specific layouts (`landingHeroOverlay`, `marriageTrack`) — those stay in the screen's `createStyles`.
- Not a "theme extension." Theme tokens live in `theme.ts`.
- Not a junk drawer.

---

## 8. Rule file edits

The implementation phase produces these documentation edits.

### 8.1 `codingprinciples.md`

**Frontend principles → Component style** (currently lines 14–19) — add a final bullet:

> **Catalog components are mandatory.** Screens MUST import the following from `@/components` for the roles they cover: `Button`, `IconButton`, `TouchableArea`, `TextInput`, `FormField`, `Chip`, `ChipRow`, `Card`, `Screen`. Screens MAY NOT import `TouchableOpacity`, `Pressable`, `TextInput` (as the `react-native` primitive), `Switch`, or `Modal` directly from `react-native`. New variants are added to the catalog component, never inlined in a screen. See **Component Catalog** below.

**New subsection: Frontend principles → Component Catalog** (inserted between **Component style** and **Styling**) — contents:

- Catalog index with one-line purpose for each of the 9 components.
- Rules 1–7 from §6 above.
- Adding a new component requires: real ≥2-screen need, TSDoc, `theme.md` §9 entry, tests under `__tests__/components/`.
- Forbidden-imports list (Rule 5) repeated for emphasis.
- **Pre-rule legacy footnote:** `LoginScreen`, `RegisterScreen`, `LandingScreen` predate this rule. They use inline patterns and conform incrementally as they are touched for unrelated work. New code does not get the same grace.

**Frontend principles → Styling** (currently lines 22–34):

- Line 26 (no inline style objects) — unchanged.
- Line 27 (`createStyles(theme)` factory canonical) — unchanged.
- Line 28 (`Design tokens are split by domain…`) — add a fifth bullet: `src/theme/commonStyles.ts` — `createCommonStyles(theme)` factory for shared layout fragments. Rule-of-two threshold for additions; layout only.
- Line 33 (`A single combined styles/styles.ts is not used`) — replace with: A single combined `styles/styles.ts` is **not** used. Shared layout fragments live in `commonStyles.ts`; catalog-component styles live inside each component file; screen-specific layout stays in the screen's local `createStyles`.

**Testing principles** (currently lines 152–158):

- Replace existing test-location bullet with: Every component has a test under `__tests__/components/<ComponentName>.test.tsx`. Every helper has a test under `__tests__/helpers/` (or its own colocated `*.test.ts`). Screen integration tests live under `__tests__/`.
- Add bullet: **Catalog components are tested centrally and exhaustively.** A screen's test suite does NOT re-assert the visual rendering of a catalog component it uses — it asserts only the wiring (correct props passed, `onPress` invokes the right handler, conditional rendering branches). This is the testing-effort reduction that mandatory components deliver.
- Add bullet: A screen that uses ONLY catalog components and `commonStyles.ts` (no local `createStyles`) requires only wiring tests. A screen with screen-specific layout still tests render-without-crash + prop variations as before.

### 8.2 `theme.md`

**§0 Critical Rules for the Agent** — add a new rule 9:

> **All interactive primitives are imported from `@/components`, never built ad-hoc.** A screen that needs a button uses `<Button variant="primary" />`; it does not assemble a button from `<Pressable>` and `<Text>`. See §9 for the catalog and §15 for the canonical implementation pattern.

**§1.4 Styling Approach** — add a final line:

> Shared layout fragments live in `src/theme/commonStyles.ts` as a `createCommonStyles(theme)` factory. See `codingprinciples.md` → Styling for the rule-of-two threshold.

**§9 Component Patterns** — annotate each pattern that maps to a catalog component:

- §9.1 Primary Button → **Implemented as `<Button variant="primary" />`. See §15.**
- §9.2 Secondary Button → **Implemented as `<Button variant="secondary" />`.**
- §9.3 Tertiary / Ghost Button → **Implemented as `<Button variant="ghost" />`.**
- §9.4 Input Field → **Implemented as `<TextInput />`. Wrap with `<FormField label="…" error={…}>` for labeled inputs.**
- §9.6 List Row / Card → **Implemented as `<Card variant="standard" />`. Press-able variant: `<TouchableArea><Card>…</Card></TouchableArea>`.**

Add a footnote at the top of §9:

> Patterns marked **Implemented as …** below have a corresponding component under `@/components` and MUST be used by screens. Unmarked patterns are design guidance only and will be promoted to components when first used.

Unmarked patterns (§9.5 SearchBar, §9.7 SelectableRow, §9.8 BottomTabBar, §9.9 Header, §9.10 TabSwitcher, §9.11 Modal, §9.12 Toggle, §9.13 Slider, §9.14 NotificationDot, §9.15 PremiumSection) remain in §9 as-is.

**§15 (canonical example)** — repurpose:

- Replace the hypothetical `PrimaryButton.tsx` example with a reference pointer to `src/components/Button.tsx` as the canonical example (the real file, after implementation).
- The "Bad components — all of the following are forbidden" block remains unchanged.
- Add a new sub-section **§15.1 — When to add a new component** restating the criteria from `codingprinciples.md`.

### 8.3 ESLint enforcement

Update `.eslintrc` (or equivalent) to add a `no-restricted-imports` rule scoped to `src/screens/**`:

```json
{
  "overrides": [
    {
      "files": ["src/screens/**/*.{ts,tsx}"],
      "rules": {
        "no-restricted-imports": ["error", {
          "paths": [{
            "name": "react-native",
            "importNames": ["TouchableOpacity", "Pressable", "TextInput", "Switch", "Modal"],
            "message": "Use the corresponding component from @/components instead. See codingprinciples.md → Component Catalog."
          }]
        }]
      }
    }
  ]
}
```

The exact config-file shape depends on whether this project uses `.eslintrc.js`, `.eslintrc.json`, or flat config — the implementation phase determines that and applies the right form. Legacy screens (`LoginScreen`, `RegisterScreen`, `LandingScreen`) are grandfathered until they're refactored; the implementation plan determines whether to use `// eslint-disable-next-line` on their existing imports or a per-file `eslint-disable`.

---

## 9. Testing impact

**Where tests live, after the change:**

| Surface | Test location | Coverage |
|---|---|---|
| Catalog component | `__tests__/components/<Name>.test.tsx` | Render-without-crash; every variant; every interactive prop; disabled/loading states; `accessibilityLabel` resolution; `onPress` fires; theme switch (light→dark) renders both. **Exhaustive.** |
| `commonStyles` factory | `__tests__/theme/commonStyles.test.ts` | One test per fragment confirming the fragment resolves with light theme + dark theme without throwing; smoke check that no fragment references a raw literal. |
| New screen (catalog + commonStyles only) | `__tests__/<Screen>.test.tsx` | **Wiring only.** Correct labels passed; correct handlers wired; conditional rendering branches. No visual re-assertion. |
| New screen (with screen-specific layout) | `__tests__/<Screen>.test.tsx` | Wiring + render-without-crash + prop variations on screen-local sub-components. |
| Legacy screens (Login / Register / Landing) | existing `__tests__/*.test.tsx` | Unchanged. |

**Estimated test additions for the implementation phase:** 9 component test files × 4–8 tests each ≈ 35–50 new unit tests, plus a small `commonStyles` smoke test.

**The "fewer tests" property:** delivers for *new* screens, not for the legacy three. A new login-style screen built with `Screen` + `FormField` + `TextInput` + `Button` + `commonStyles.formStack` needs roughly 5–8 wiring assertions; the legacy `LoginScreen` test currently has many more visual assertions. Existing screens stay where they are by design (decision Q4).

---

## 10. Risks & mitigations

| Risk | Mitigation |
|---|---|
| Catalog API freezes wrong on first design. | API pressure-tested during implementation by reading (not modifying) `LoginScreen`, `RegisterScreen`, `LandingScreen` — the catalog must be able to express what those screens render. Spec amended before implementation if needed. |
| `commonStyles.ts` drifts toward junk drawer. | Four hard rules (§7). PR review enforces. |
| ESLint forbidden-imports rule blocks something legitimate. | Lint scope is `src/screens/**` only. Non-screen code unaffected. `// eslint-disable-next-line` allowed for genuinely-justified one-offs, reviewed as a code smell. |
| Adding 9 components is roughly one phase of work and delays other planned phase work. | This rule change is its own phase, sequenced explicitly. Not interleaved with feature work. |
| Rule files become large. | `theme.md` §9 already contains the patterns — we annotate them. `codingprinciples.md` Component Catalog subsection is new but bounded to the rules. |
| `/start-project` template doesn't carry these rules forward; next project regresses. | Out of scope. Follow-up: copy `theme.md` + `codingprinciples.md` into the next project's scaffold manually, or update the `/start-project` template at workspace level. Flagged as known follow-up. |

---

## 11. Open questions resolved during brainstorming

| Question | Resolution |
|---|---|
| Lint enforcement of Rule 5 — automated, review-checklist, or both? | **Automated.** ESLint `no-restricted-imports` scoped to `src/screens/**`. |
| Version-stamp the new `codingprinciples.md` sections with introduction dates? | **No.** Git blame is the version history. |
| Strike unimplemented patterns (§9.5, §9.7–§9.15) from `theme.md` §9? | **No, leave as-is.** They remain useful design guidance and are promoted to components on first real use, per the footnote rule. |
| Test location for new catalog components — colocated or `__tests__/components/`? | **`__tests__/components/`.** Mirrors the existing test layout in the project. |
| `commonStyles` vs `layoutStyles` / `sharedStyles` naming? | **`commonStyles`.** May revisit if the file's actual contents drift from the intent. |
| Migration of `LoginScreen` / `RegisterScreen` / `LandingScreen` — all at once, one as proof, or grandfathered? | **Grandfathered.** Rules apply to all new code; legacy screens conform incrementally when touched. |
| Build the catalog now or ship rules first? | **Build now.** Rules + reference catalog ship together so the rules aren't aspirational. |

---

## 12. Implementation phase — handoff

This spec feeds into the `superpowers:writing-plans` skill to produce a detailed implementation plan. The plan will sequence:

1. Foundation — `commonStyles.ts` + ESLint rule + index re-exports.
2. The 9 catalog components — built individually (one per story), each with its own test file under `__tests__/components/`, in dependency order (leaf components first: `Chip`, `Card`, `Screen`; then `TextInput`, `Button`, `IconButton`, `TouchableArea`; then composite `FormField`, `ChipRow`).
3. Rule file edits — `theme.md` + `codingprinciples.md`.
4. Verification — full test run; lint run; manual smoke that legacy screens still build/render unchanged.

No screen migration stories are part of this plan. Legacy screens remain untouched.

---

*End of spec.*
