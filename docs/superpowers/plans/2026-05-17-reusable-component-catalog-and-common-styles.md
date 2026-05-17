# Reusable Component Catalog + Common Styles — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Introduce 9 reusable React Native components (`Button`, `IconButton`, `TouchableArea`, `TextInput`, `FormField`, `Chip`, `ChipRow`, `Card`, `Screen`), a `commonStyles.ts` factory for shared layout fragments, and ESLint enforcement so new screens cannot bypass the catalog.

**Architecture:** Catalog components live under `src/components/` and re-export from `src/components/index.ts`. Each component obeys the A+ closed-API rule: no `style` / `containerStyle` / `textStyle` / `contentContainerStyle` pass-through. Common layout fragments live in `src/theme/commonStyles.ts` as a `createCommonStyles(theme)` factory. Legacy screens (`LoginScreen`, `RegisterScreen`, `LandingScreen`) are grandfathered behind file-level eslint-disable directives.

**Tech Stack:** React Native 0.83.6, Expo SDK 55, TypeScript 5.9 strict, Jest 29 + `@testing-library/react-native` 13, ESLint 8 + `eslint-config-expo`, `react-native-safe-area-context` for `Screen`.

**Source spec:** `docs/superpowers/specs/2026-05-17-reusable-components-and-common-styles-design.md` (read it before starting Task 1; the props interfaces below are the spec's exact contracts).

**Branch:** `feat/component-catalog-and-common-styles` (already created from `origin/development`).

**Conventions enforced throughout this plan:**

- Test descriptions use `given … when … then …` phrasing (project standard from `__tests__/screens.stubs.test.tsx`).
- Every exported symbol carries a TSDoc block (per `codingprinciples.md` line 113).
- Variants are string-literal unions, never enums.
- No raw hex / font-size literals inside any component — everything from `useTheme()` + `textStyles.*`.
- Each task ends with a single commit. No squashing across tasks.

---

## Task 0: Pre-flight verification

**Files:** none (read-only checks)

- [ ] **Step 1: Confirm clean tree on the right branch**

Run: `git status -sb && git log -2 --oneline`
Expected: branch `feat/component-catalog-and-common-styles`, working tree clean, latest commit is `docs(spec): reusable component catalog + commonStyles design`.

- [ ] **Step 2: Establish baseline — lint + tests must pass before any new code lands**

Run: `npm run lint`
Expected: 0 errors. (Warnings tolerated.)

Run: `npm test -- --listTests | wc -l`
Expected: a positive count (sanity check that Jest discovers suites).

Run: `npm test`
Expected: all suites pass.

If any of the above fail, STOP and fix or surface to the user before proceeding — this plan assumes a green baseline.

- [ ] **Step 3: Confirm the spec is on this branch**

Run: `git log --oneline --all -- docs/superpowers/specs/2026-05-17-reusable-components-and-common-styles-design.md | head -1`
Expected: a commit hash on this branch (not just on `feat/phase-6-landing-screen`).

No commit at the end of Task 0 — nothing changed.

---

## Task 1: `commonStyles.ts` factory + theme barrel re-export

**Files:**
- Create: `src/theme/commonStyles.ts`
- Create: `__tests__/theme/commonStyles.test.ts`
- Modify: `src/theme/index.ts`

- [ ] **Step 1: Write the failing test**

Create `__tests__/theme/commonStyles.test.ts`:

```ts
/**
 * Smoke tests for createCommonStyles — confirms the factory produces a
 * complete StyleSheet for both light and dark themes and that every
 * declared fragment resolves without throwing or yielding undefined.
 */

import { createCommonStyles } from '@/theme/commonStyles';
import { lightTheme, darkTheme } from '@/theme/theme';

describe('given the light theme, when createCommonStyles runs', () => {
  it('then every declared fragment is an object', () => {
    const styles = createCommonStyles(lightTheme);
    expect(typeof styles.screenContent).toBe('object');
    expect(typeof styles.centerContent).toBe('object');
    expect(typeof styles.formStack).toBe('object');
    expect(typeof styles.sectionDivider).toBe('object');
    expect(typeof styles.errorTextBlock).toBe('object');
  });

  it('then sectionDivider pulls its color from the theme border token', () => {
    const styles = createCommonStyles(lightTheme);
    // StyleSheet.create returns a numeric id at runtime — flatten to inspect.
    const flat = require('react-native').StyleSheet.flatten(styles.sectionDivider);
    expect(flat.backgroundColor).toBe(lightTheme.colors.border.default);
  });
});

describe('given the dark theme, when createCommonStyles runs', () => {
  it('then errorTextBlock uses the dark status.error color', () => {
    const styles = createCommonStyles(darkTheme);
    const flat = require('react-native').StyleSheet.flatten(styles.errorTextBlock);
    expect(flat.color).toBe(darkTheme.colors.status.error);
  });
});
```

- [ ] **Step 2: Run the test and verify it fails**

Run: `npm test -- __tests__/theme/commonStyles.test.ts`
Expected: FAIL — `Cannot find module '@/theme/commonStyles'`.

- [ ] **Step 3: Write the minimal implementation**

Create `src/theme/commonStyles.ts`:

```ts
/**
 * Shared layout-only style fragments.
 *
 * `createCommonStyles(theme)` returns a `StyleSheet.create` block whose
 * entries are layout primitives used by ≥2 screens. The four hard rules:
 *
 * 1. Layout only — no component-shaped styles (use `@/components`).
 * 2. Rule of two — a fragment may be added when used in ≥2 screens.
 * 3. Factory only — no top-level static `StyleSheet.create`.
 * 4. No silent deletion — unused fragments are removed in a dedicated PR.
 *
 * See `docs/superpowers/specs/2026-05-17-reusable-components-and-common-styles-design.md` §7.
 */

import { StyleSheet } from 'react-native';
import type { Theme } from './theme';
import { textStyles } from './typography';

export const createCommonStyles = (theme: Theme) =>
  StyleSheet.create({
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
      ...textStyles.body.sm,
      marginTop: theme.spacing.xs,
      color: theme.colors.status.error,
    },
  });

export type CommonStyles = ReturnType<typeof createCommonStyles>;
```

- [ ] **Step 4: Update the theme barrel to re-export**

Edit `src/theme/index.ts` — replace contents with:

```ts
export * from './theme';
export * from './typography';
export { ThemeProvider, useTheme, useThemeControls } from './ThemeProvider';
export { createCommonStyles } from './commonStyles';
export type { CommonStyles } from './commonStyles';
```

- [ ] **Step 5: Run the test and verify it passes**

Run: `npm test -- __tests__/theme/commonStyles.test.ts`
Expected: PASS — all three tests green.

- [ ] **Step 6: Run lint**

Run: `npm run lint`
Expected: 0 errors.

- [ ] **Step 7: Commit**

```bash
git add src/theme/commonStyles.ts src/theme/index.ts __tests__/theme/commonStyles.test.ts
git commit -m "feat(theme): add createCommonStyles factory for shared layout fragments"
```

---

## Task 2: Create empty components barrel

**Files:**
- Create: `src/components/index.ts`

This is a scaffolding step so subsequent component tasks can append their export line. The barrel is empty for now; ESLint and TS both tolerate an empty re-export module.

- [ ] **Step 1: Write the file**

Create `src/components/index.ts`:

```ts
/**
 * Public barrel for the reusable component catalog.
 *
 * Screens import every catalog component from this barrel, never from
 * the individual files. Adding a component means appending one
 * `export { … } from './<Name>';` line below in alphabetical order.
 *
 * See `docs/superpowers/specs/2026-05-17-reusable-components-and-common-styles-design.md` §4
 * for the full catalog and §6 for the API discipline rules.
 */

export {};
```

- [ ] **Step 2: Verify TypeScript accepts the empty re-export**

Run: `npx tsc --noEmit`
Expected: 0 errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/index.ts
git commit -m "chore(components): scaffold empty catalog barrel"
```

---

## Task 3: ESLint `no-restricted-imports` rule + legacy grandfathering

**Files:**
- Modify: `.eslintrc.js`
- Modify: `src/screens/LoginScreen.tsx` (add file-top disable directive)
- Modify: `src/screens/RegisterScreen.tsx` (add file-top disable directive)
- Modify: `src/screens/LandingScreen.tsx` (add file-top disable directive)

- [ ] **Step 1: Update `.eslintrc.js` with the scoped rule**

Replace `.eslintrc.js` contents with:

```js
// eslint-plugin-tsdoc does not ship a 'recommended' config preset.
// The tsdoc/syntax rule is registered manually via the plugins + rules fields below.
// See story 1.4 notes in implementationplan/phase-1-bootstrap.md for the audit trail.
module.exports = {
  extends: ['expo', 'plugin:@typescript-eslint/recommended', 'prettier'],
  plugins: ['tsdoc'],
  rules: {
    'tsdoc/syntax': 'warn',
  },
  overrides: [
    {
      // Catalog enforcement: screens must use @/components, not raw react-native primitives.
      // Rationale: docs/superpowers/specs/2026-05-17-reusable-components-and-common-styles-design.md §6 Rule 5.
      // Legacy screens (Login/Register/Landing) carry file-top eslint-disable directives and are
      // grandfathered until they are refactored as part of unrelated future work.
      files: ['src/screens/**/*.{ts,tsx}'],
      rules: {
        'no-restricted-imports': [
          'error',
          {
            paths: [
              {
                name: 'react-native',
                importNames: ['TouchableOpacity', 'Pressable', 'TextInput', 'Switch', 'Modal'],
                message:
                  'Use the corresponding component from @/components instead. See codingprinciples.md → Component Catalog.',
              },
            ],
          },
        ],
      },
    },
  ],
};
```

- [ ] **Step 2: Add file-top disable directives to the three legacy screens**

For each of `src/screens/LoginScreen.tsx`, `src/screens/RegisterScreen.tsx`, `src/screens/LandingScreen.tsx`, insert this directive as the first non-empty line of the file (above the existing top-of-file doc comment, if any):

```ts
/* eslint-disable no-restricted-imports -- legacy screen grandfathered before the component catalog (spec 2026-05-17). Remove when this screen is refactored to use @/components. */
```

The exact insertion is at line 1 of each file, pushing existing content down by one line. Verify each screen still parses by running `npx tsc --noEmit` after each edit.

- [ ] **Step 3: Run lint to confirm the rule is wired correctly**

Run: `npm run lint`
Expected: 0 errors. Legacy screens pass because of the disable directive; no other screens currently exist that would trip the rule.

- [ ] **Step 4: Run the test suite to confirm nothing else regressed**

Run: `npm test`
Expected: all suites pass.

- [ ] **Step 5: Commit**

```bash
git add .eslintrc.js src/screens/LoginScreen.tsx src/screens/RegisterScreen.tsx src/screens/LandingScreen.tsx
git commit -m "feat(lint): forbid raw react-native primitives in src/screens; grandfather legacy screens"
```

---

## Task 4: `Chip` component (leaf, display-only)

**Files:**
- Create: `src/components/Chip.tsx`
- Create: `__tests__/components/Chip.test.tsx`
- Modify: `src/components/index.ts`

- [ ] **Step 1: Write the failing test**

Create `__tests__/components/Chip.test.tsx`:

```tsx
/**
 * Tests for the Chip catalog component. Chip is display-only (non-tappable).
 */

import React from 'react';
import { render } from '@testing-library/react-native';
import { Chip } from '@/components';
import { ThemeProvider } from '@/theme/ThemeProvider';

describe('given a Chip with only a label, when rendered', () => {
  it('then the label text is in the tree', () => {
    const { getByText } = render(
      <ThemeProvider>
        <Chip label="Vegetarian" />
      </ThemeProvider>,
    );
    expect(getByText('Vegetarian')).toBeTruthy();
  });

  it('then the testID resolves when provided', () => {
    const { getByTestId } = render(
      <ThemeProvider>
        <Chip label="Vegetarian" testID="chip-veg" />
      </ThemeProvider>,
    );
    expect(getByTestId('chip-veg')).toBeTruthy();
  });
});

describe('given a Chip with an icon string, when rendered', () => {
  it('then the icon string appears in the tree alongside the label', () => {
    const { getByText } = render(
      <ThemeProvider>
        <Chip icon="🌱" label="Vegetarian" />
      </ThemeProvider>,
    );
    expect(getByText('🌱')).toBeTruthy();
    expect(getByText('Vegetarian')).toBeTruthy();
  });
});
```

- [ ] **Step 2: Run the test and verify it fails**

Run: `npm test -- __tests__/components/Chip.test.tsx`
Expected: FAIL — `Chip` not exported from `@/components`.

- [ ] **Step 3: Write the minimal implementation**

Create `src/components/Chip.tsx`:

```tsx
/**
 * Display-only pill. Non-tappable. Maps to theme.md §9.6 (chip pattern).
 *
 * Examples:
 * ```tsx
 * <Chip label="Vegetarian" />
 * <Chip icon="🌱" label="Vegetarian" />
 * ```
 */

import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';
import { textStyles } from '@/theme/typography';
import type { Theme } from '@/theme/theme';

export interface ChipProps {
  /** Optional leading glyph (emoji or short string). */
  icon?: string;
  /** Pre-localized chip label. Callers resolve via labels.json. */
  label: string;
  /** Optional stable testID for query selectors. */
  testID?: string;
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    container: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.bg.muted,
      borderRadius: theme.radii.pill,
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.xs,
      gap: theme.spacing.xs,
    },
    icon: {
      ...textStyles.body.sm,
    },
    label: {
      ...textStyles.label.sm,
      color: theme.colors.text.secondary,
    },
  });

export const Chip: React.FC<ChipProps> = ({ icon, label, testID }) => {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <View style={styles.container} testID={testID}>
      {icon !== undefined && <Text style={styles.icon}>{icon}</Text>}
      <Text style={styles.label}>{label}</Text>
    </View>
  );
};
```

- [ ] **Step 4: Add Chip to the barrel**

Edit `src/components/index.ts` — replace `export {};` with:

```ts
export { Chip } from './Chip';
export type { ChipProps } from './Chip';
```

- [ ] **Step 5: Run the test and verify it passes**

Run: `npm test -- __tests__/components/Chip.test.tsx`
Expected: PASS — all three tests green.

- [ ] **Step 6: Run lint**

Run: `npm run lint`
Expected: 0 errors.

- [ ] **Step 7: Commit**

```bash
git add src/components/Chip.tsx __tests__/components/Chip.test.tsx src/components/index.ts
git commit -m "feat(components): add Chip display-only pill"
```

---

## Task 5: `Card` component (leaf, visual container)

**Files:**
- Create: `src/components/Card.tsx`
- Create: `__tests__/components/Card.test.tsx`
- Modify: `src/components/index.ts`

- [ ] **Step 1: Write the failing test**

Create `__tests__/components/Card.test.tsx`:

```tsx
import React from 'react';
import { render } from '@testing-library/react-native';
import { Text } from 'react-native';
import { Card } from '@/components';
import { ThemeProvider } from '@/theme/ThemeProvider';

describe('given a Card with default variant, when rendered', () => {
  it('then the children are visible in the tree', () => {
    const { getByText } = render(
      <ThemeProvider>
        <Card>
          <Text>child</Text>
        </Card>
      </ThemeProvider>,
    );
    expect(getByText('child')).toBeTruthy();
  });

  it('then the testID resolves when provided', () => {
    const { getByTestId } = render(
      <ThemeProvider>
        <Card testID="standard-card">
          <Text>child</Text>
        </Card>
      </ThemeProvider>,
    );
    expect(getByTestId('standard-card')).toBeTruthy();
  });
});

describe('given a Card with variant="muted", when rendered', () => {
  it('then it renders without crashing and children are visible', () => {
    const { getByText } = render(
      <ThemeProvider>
        <Card variant="muted">
          <Text>muted-child</Text>
        </Card>
      </ThemeProvider>,
    );
    expect(getByText('muted-child')).toBeTruthy();
  });
});
```

- [ ] **Step 2: Run the test and verify it fails**

Run: `npm test -- __tests__/components/Card.test.tsx`
Expected: FAIL — `Card` not exported.

- [ ] **Step 3: Write the implementation**

Create `src/components/Card.tsx`:

```tsx
/**
 * Visual container. No press behavior — wrap with TouchableArea for press.
 * Maps to theme.md §9.6.
 *
 * Variants:
 * - `standard` (default): surface bg, 1px border, lg padding.
 * - `muted`: muted bg, no border, xl padding.
 */

import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';
import type { Theme } from '@/theme/theme';

export interface CardProps {
  /** Visual variant. Defaults to `'standard'`. */
  variant?: 'standard' | 'muted';
  children: React.ReactNode;
  testID?: string;
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    standard: {
      backgroundColor: theme.colors.bg.surface,
      borderWidth: 1,
      borderColor: theme.colors.border.default,
      borderRadius: theme.radii.lg,
      padding: theme.spacing.lg,
    },
    muted: {
      backgroundColor: theme.colors.bg.muted,
      borderRadius: theme.radii.lg,
      padding: theme.spacing.xl,
    },
  });

export const Card: React.FC<CardProps> = ({ variant = 'standard', children, testID }) => {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <View style={variant === 'muted' ? styles.muted : styles.standard} testID={testID}>
      {children}
    </View>
  );
};
```

- [ ] **Step 4: Add Card to the barrel**

Edit `src/components/index.ts` — append after the Chip exports, keeping alphabetical order:

```ts
export { Card } from './Card';
export type { CardProps } from './Card';
export { Chip } from './Chip';
export type { ChipProps } from './Chip';
```

- [ ] **Step 5: Run the test and verify it passes**

Run: `npm test -- __tests__/components/Card.test.tsx`
Expected: PASS.

- [ ] **Step 6: Run lint**

Run: `npm run lint`
Expected: 0 errors.

- [ ] **Step 7: Commit**

```bash
git add src/components/Card.tsx __tests__/components/Card.test.tsx src/components/index.ts
git commit -m "feat(components): add Card visual container (standard/muted variants)"
```

---

## Task 6: `Screen` component (outer wrapper with safe-area handling)

**Files:**
- Create: `src/components/Screen.tsx`
- Create: `__tests__/components/Screen.test.tsx`
- Modify: `src/components/index.ts`

- [ ] **Step 1: Write the failing test**

Create `__tests__/components/Screen.test.tsx`:

```tsx
import React from 'react';
import { render } from '@testing-library/react-native';
import { Text } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Screen } from '@/components';
import { ThemeProvider } from '@/theme/ThemeProvider';

const wrap = (node: React.ReactNode) => (
  <SafeAreaProvider initialMetrics={{ frame: { x: 0, y: 0, width: 320, height: 640 }, insets: { top: 0, right: 0, bottom: 0, left: 0 } }}>
    <ThemeProvider>{node}</ThemeProvider>
  </SafeAreaProvider>
);

describe('given a Screen with default props, when rendered', () => {
  it('then the children are visible in the tree', () => {
    const { getByText } = render(wrap(<Screen><Text>child</Text></Screen>));
    expect(getByText('child')).toBeTruthy();
  });

  it('then the testID resolves when provided', () => {
    const { getByTestId } = render(
      wrap(<Screen testID="screen-root"><Text>child</Text></Screen>),
    );
    expect(getByTestId('screen-root')).toBeTruthy();
  });
});

describe('given scrollable=true, when rendered', () => {
  it('then children are still in the tree', () => {
    const { getByText } = render(
      wrap(<Screen scrollable><Text>scroll-child</Text></Screen>),
    );
    expect(getByText('scroll-child')).toBeTruthy();
  });
});
```

- [ ] **Step 2: Run the test and verify it fails**

Run: `npm test -- __tests__/components/Screen.test.tsx`
Expected: FAIL.

- [ ] **Step 3: Write the implementation**

Create `src/components/Screen.tsx`:

```tsx
/**
 * Outer wrapper for every screen. Provides safe-area inset padding,
 * the primary background color, horizontal page padding, and (optionally)
 * a vertical ScrollView. Replaces inline `View + useSafeAreaInsets +
 * paddingHorizontal` boilerplate.
 *
 * Defaults: `scrollable=false`, `edges=['top','bottom']`.
 */

import React, { useMemo } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/theme/ThemeProvider';
import type { Theme } from '@/theme/theme';

export type ScreenEdge = 'top' | 'bottom' | 'left' | 'right';

export interface ScreenProps {
  children: React.ReactNode;
  /** When true, content is rendered inside a ScrollView. Defaults to false. */
  scrollable?: boolean;
  /** Which safe-area edges to inset against. Defaults to `['top','bottom']`. */
  edges?: ScreenEdge[];
  testID?: string;
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.bg.primary,
      paddingHorizontal: theme.spacing.lg,
    },
    scrollContent: {
      flexGrow: 1,
    },
  });

const DEFAULT_EDGES: ScreenEdge[] = ['top', 'bottom'];

export const Screen: React.FC<ScreenProps> = ({
  children,
  scrollable = false,
  edges = DEFAULT_EDGES,
  testID,
}) => {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const insets = useSafeAreaInsets();

  const insetStyle = {
    paddingTop: edges.includes('top') ? insets.top : 0,
    paddingBottom: edges.includes('bottom') ? insets.bottom : 0,
    paddingLeft: edges.includes('left') ? insets.left : 0,
    paddingRight: edges.includes('right') ? insets.right : 0,
  };

  if (scrollable) {
    return (
      <ScrollView
        style={[styles.container, insetStyle]}
        contentContainerStyle={styles.scrollContent}
        testID={testID}
      >
        {children}
      </ScrollView>
    );
  }

  return (
    <View style={[styles.container, insetStyle]} testID={testID}>
      {children}
    </View>
  );
};
```

- [ ] **Step 4: Update the barrel**

Edit `src/components/index.ts`, append (alphabetical order):

```ts
export { Card } from './Card';
export type { CardProps } from './Card';
export { Chip } from './Chip';
export type { ChipProps } from './Chip';
export { Screen } from './Screen';
export type { ScreenEdge, ScreenProps } from './Screen';
```

- [ ] **Step 5: Run the test and verify it passes**

Run: `npm test -- __tests__/components/Screen.test.tsx`
Expected: PASS.

- [ ] **Step 6: Run lint**

Run: `npm run lint`
Expected: 0 errors.

- [ ] **Step 7: Commit**

```bash
git add src/components/Screen.tsx __tests__/components/Screen.test.tsx src/components/index.ts
git commit -m "feat(components): add Screen wrapper with safe-area + scrollable support"
```

---

## Task 7: `TextInput` component (replaces react-native's TextInput in screens)

**Files:**
- Create: `src/components/TextInput.tsx`
- Create: `__tests__/components/TextInput.test.tsx`
- Modify: `src/components/index.ts`

- [ ] **Step 1: Write the failing test**

Create `__tests__/components/TextInput.test.tsx`:

```tsx
import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import { TextInput } from '@/components';
import { ThemeProvider } from '@/theme/ThemeProvider';

const wrap = (node: React.ReactNode) => <ThemeProvider>{node}</ThemeProvider>;

describe('given a TextInput with value and onChangeText, when text changes', () => {
  it('then onChangeText is invoked with the new value', () => {
    const onChangeText = jest.fn();
    const { getByTestId } = render(
      wrap(
        <TextInput value="" onChangeText={onChangeText} testID="ti" placeholder="Type" />,
      ),
    );
    fireEvent.changeText(getByTestId('ti'), 'hello');
    expect(onChangeText).toHaveBeenCalledWith('hello');
  });

  it('then the placeholder is rendered as a prop on the underlying input', () => {
    const { getByPlaceholderText } = render(
      wrap(<TextInput value="" onChangeText={jest.fn()} placeholder="Type here" />),
    );
    expect(getByPlaceholderText('Type here')).toBeTruthy();
  });
});

describe('given hasError=true, when the input renders', () => {
  it('then it renders without crashing', () => {
    const { getByTestId } = render(
      wrap(
        <TextInput
          value=""
          onChangeText={jest.fn()}
          hasError
          testID="ti-err"
        />,
      ),
    );
    expect(getByTestId('ti-err')).toBeTruthy();
  });
});

describe('given multiline=true with numberOfLines, when rendered', () => {
  it('then the props pass through and the input is in the tree', () => {
    const { getByTestId } = render(
      wrap(
        <TextInput
          value=""
          onChangeText={jest.fn()}
          multiline
          numberOfLines={3}
          testID="ti-ml"
        />,
      ),
    );
    expect(getByTestId('ti-ml')).toBeTruthy();
  });
});
```

- [ ] **Step 2: Run the test and verify it fails**

Run: `npm test -- __tests__/components/TextInput.test.tsx`
Expected: FAIL — `TextInput` not exported.

- [ ] **Step 3: Write the implementation**

Create `src/components/TextInput.tsx`:

```tsx
/**
 * Single-line / multi-line text input. Replaces react-native's TextInput
 * in screens. Internally manages border-on-focus, placeholder color, and
 * background — callers cannot override these.
 *
 * Maps to theme.md §9.4.
 */

import React, { useMemo, useState } from 'react';
import {
  StyleSheet,
  TextInput as RNTextInput,
  type TextInputProps as RNTextInputProps,
} from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';
import { textStyles } from '@/theme/typography';
import type { Theme } from '@/theme/theme';

type AutoCapitalize = NonNullable<RNTextInputProps['autoCapitalize']>;
type KeyboardType = 'default' | 'email-address' | 'numeric' | 'phone-pad';

export interface TextInputProps {
  value: string;
  onChangeText: (next: string) => void;
  placeholder?: string;
  secureTextEntry?: boolean;
  multiline?: boolean;
  /** Meaningful only when `multiline` is true. */
  numberOfLines?: number;
  autoCapitalize?: AutoCapitalize;
  autoCorrect?: boolean;
  keyboardType?: KeyboardType;
  /** When true, applies the error-border treatment. */
  hasError?: boolean;
  testID?: string;
}

const createStyles = (theme: Theme, focused: boolean, hasError: boolean) => {
  const borderColor = hasError
    ? theme.colors.status.error
    : focused
      ? theme.colors.accent.primary
      : theme.colors.border.default;
  return StyleSheet.create({
    input: {
      ...textStyles.body.lg,
      backgroundColor: theme.colors.bg.input,
      color: theme.colors.text.primary,
      borderWidth: 1,
      borderColor,
      borderRadius: theme.radii.md,
      paddingHorizontal: theme.spacing.lg,
      paddingVertical: theme.spacing.md,
      minHeight: 48,
    },
  });
};

export const TextInput: React.FC<TextInputProps> = ({
  value,
  onChangeText,
  placeholder,
  secureTextEntry,
  multiline,
  numberOfLines,
  autoCapitalize,
  autoCorrect,
  keyboardType,
  hasError = false,
  testID,
}) => {
  const theme = useTheme();
  const [focused, setFocused] = useState(false);
  const styles = useMemo(() => createStyles(theme, focused, hasError), [theme, focused, hasError]);

  return (
    <RNTextInput
      style={styles.input}
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor={theme.colors.text.tertiary}
      secureTextEntry={secureTextEntry}
      multiline={multiline}
      numberOfLines={numberOfLines}
      autoCapitalize={autoCapitalize}
      autoCorrect={autoCorrect}
      keyboardType={keyboardType}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      testID={testID}
    />
  );
};
```

- [ ] **Step 4: Update the barrel**

Edit `src/components/index.ts`, append in alphabetical order:

```ts
export { Card } from './Card';
export type { CardProps } from './Card';
export { Chip } from './Chip';
export type { ChipProps } from './Chip';
export { Screen } from './Screen';
export type { ScreenEdge, ScreenProps } from './Screen';
export { TextInput } from './TextInput';
export type { TextInputProps } from './TextInput';
```

- [ ] **Step 5: Run the test and verify it passes**

Run: `npm test -- __tests__/components/TextInput.test.tsx`
Expected: PASS.

- [ ] **Step 6: Run lint**

Run: `npm run lint`
Expected: 0 errors. (Note: the catalog component itself imports `TextInput` from `react-native` — that's allowed because the ESLint override is scoped to `src/screens/**`, not `src/components/**`.)

- [ ] **Step 7: Commit**

```bash
git add src/components/TextInput.tsx __tests__/components/TextInput.test.tsx src/components/index.ts
git commit -m "feat(components): add TextInput with focus/error states (theme.md §9.4)"
```

---

## Task 8: `Button` component

**Files:**
- Create: `src/components/Button.tsx`
- Create: `__tests__/components/Button.test.tsx`
- Modify: `src/components/index.ts`

- [ ] **Step 1: Write the failing test**

Create `__tests__/components/Button.test.tsx`:

```tsx
import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import { Button } from '@/components';
import { ThemeProvider } from '@/theme/ThemeProvider';

const wrap = (node: React.ReactNode) => <ThemeProvider>{node}</ThemeProvider>;

describe('given a primary Button with onPress, when pressed', () => {
  it('then onPress is invoked exactly once', () => {
    const onPress = jest.fn();
    const { getByTestId } = render(
      wrap(<Button variant="primary" label="Save" onPress={onPress} testID="btn" />),
    );
    fireEvent.press(getByTestId('btn'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('then the label text is in the tree', () => {
    const { getByText } = render(
      wrap(<Button variant="primary" label="Save" onPress={jest.fn()} />),
    );
    expect(getByText('Save')).toBeTruthy();
  });
});

describe('given disabled=true, when the button is pressed', () => {
  it('then onPress is NOT invoked', () => {
    const onPress = jest.fn();
    const { getByTestId } = render(
      wrap(
        <Button
          variant="primary"
          label="Save"
          onPress={onPress}
          disabled
          testID="btn-d"
        />,
      ),
    );
    fireEvent.press(getByTestId('btn-d'));
    expect(onPress).not.toHaveBeenCalled();
  });
});

describe('given loading=true, when the button is pressed', () => {
  it('then onPress is NOT invoked', () => {
    const onPress = jest.fn();
    const { getByTestId } = render(
      wrap(
        <Button
          variant="primary"
          label="Save"
          onPress={onPress}
          loading
          testID="btn-l"
        />,
      ),
    );
    fireEvent.press(getByTestId('btn-l'));
    expect(onPress).not.toHaveBeenCalled();
  });
});

describe('given each variant, when rendered', () => {
  it.each(['primary', 'secondary', 'ghost'] as const)(
    'then the %s variant renders without crashing',
    (variant) => {
      const { getByText } = render(
        wrap(<Button variant={variant} label={`btn-${variant}`} onPress={jest.fn()} />),
      );
      expect(getByText(`btn-${variant}`)).toBeTruthy();
    },
  );
});

describe('given accessibilityLabel is omitted, when rendered', () => {
  it('then the accessibilityLabel defaults to the label prop', () => {
    const { getByTestId } = render(
      wrap(<Button variant="primary" label="Save" onPress={jest.fn()} testID="btn-a" />),
    );
    expect(getByTestId('btn-a').props.accessibilityLabel).toBe('Save');
  });
});
```

- [ ] **Step 2: Run the test and verify it fails**

Run: `npm test -- __tests__/components/Button.test.tsx`
Expected: FAIL — `Button` not exported.

- [ ] **Step 3: Write the implementation**

Create `src/components/Button.tsx`:

```tsx
/**
 * Every text button across the app. Three variants:
 * - `primary`: pink background, white text (theme.md §9.1)
 * - `secondary`: mint background, black text (theme.md §9.2)
 * - `ghost`: transparent background, pink text (theme.md §9.3)
 *
 * `disabled` and `loading` both block press. `loading` shows a spinner in
 * place of the label icons.
 */

import React, { useMemo } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
  type ViewStyle,
} from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';
import { textStyles } from '@/theme/typography';
import type { Theme } from '@/theme/theme';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost';

export interface ButtonProps {
  variant: ButtonVariant;
  label: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  /** When false, the button shrinks to content width. Defaults to true. */
  fullWidth?: boolean;
  iconLeft?: React.ReactNode;
  iconRight?: React.ReactNode;
  /** Defaults to `label`. */
  accessibilityLabel?: string;
  testID?: string;
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    base: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: theme.spacing.sm,
      borderRadius: theme.radii.pill,
      paddingHorizontal: theme.spacing.xl,
      paddingVertical: theme.spacing.md,
      minHeight: 44,
    },
    fullWidth: {
      alignSelf: 'stretch',
    },
    primary: {
      backgroundColor: theme.colors.accent.primary,
    },
    primaryDisabled: {
      backgroundColor: theme.colors.accent.primaryDisabled,
    },
    secondary: {
      backgroundColor: theme.colors.accent.secondary,
    },
    secondaryDisabled: {
      backgroundColor: theme.colors.accent.secondaryDisabled,
    },
    ghost: {
      backgroundColor: 'transparent',
    },
    pressed: {
      opacity: 0.85,
    },
    label: {
      ...textStyles.label.lg,
    },
    primaryLabel: {
      color: theme.colors.text.inverse,
    },
    secondaryLabel: {
      color: theme.colors.text.primary,
    },
    ghostLabel: {
      color: theme.colors.text.brand,
    },
  });

export const Button: React.FC<ButtonProps> = ({
  variant,
  label,
  onPress,
  disabled = false,
  loading = false,
  fullWidth = true,
  iconLeft,
  iconRight,
  accessibilityLabel,
  testID,
}) => {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const blocked = disabled || loading;

  const containerStyle = (pressed: boolean): ViewStyle[] => {
    const base: ViewStyle[] = [styles.base];
    if (fullWidth) base.push(styles.fullWidth);
    if (variant === 'primary') base.push(blocked ? styles.primaryDisabled : styles.primary);
    if (variant === 'secondary') base.push(blocked ? styles.secondaryDisabled : styles.secondary);
    if (variant === 'ghost') base.push(styles.ghost);
    if (pressed && !blocked) base.push(styles.pressed);
    return base;
  };

  const labelStyle = [
    styles.label,
    variant === 'primary' && styles.primaryLabel,
    variant === 'secondary' && styles.secondaryLabel,
    variant === 'ghost' && styles.ghostLabel,
  ];

  const spinnerColor =
    variant === 'primary' ? theme.colors.text.inverse : theme.colors.text.primary;

  return (
    <Pressable
      onPress={onPress}
      disabled={blocked}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ disabled: blocked, busy: loading }}
      testID={testID}
      style={({ pressed }) => containerStyle(pressed)}
    >
      {loading ? (
        <ActivityIndicator color={spinnerColor} />
      ) : (
        <>
          {iconLeft !== undefined && <View>{iconLeft}</View>}
          <Text style={labelStyle}>{label}</Text>
          {iconRight !== undefined && <View>{iconRight}</View>}
        </>
      )}
    </Pressable>
  );
};
```

- [ ] **Step 4: Update the barrel**

Edit `src/components/index.ts`, append in alphabetical order:

```ts
export { Button } from './Button';
export type { ButtonProps, ButtonVariant } from './Button';
export { Card } from './Card';
export type { CardProps } from './Card';
export { Chip } from './Chip';
export type { ChipProps } from './Chip';
export { Screen } from './Screen';
export type { ScreenEdge, ScreenProps } from './Screen';
export { TextInput } from './TextInput';
export type { TextInputProps } from './TextInput';
```

- [ ] **Step 5: Run the test and verify it passes**

Run: `npm test -- __tests__/components/Button.test.tsx`
Expected: PASS — all tests green (one parameterized `it.each` runs three times).

- [ ] **Step 6: Run lint**

Run: `npm run lint`
Expected: 0 errors.

- [ ] **Step 7: Commit**

```bash
git add src/components/Button.tsx __tests__/components/Button.test.tsx src/components/index.ts
git commit -m "feat(components): add Button with primary/secondary/ghost variants"
```

---

## Task 9: `IconButton` component

**Files:**
- Create: `src/components/IconButton.tsx`
- Create: `__tests__/components/IconButton.test.tsx`
- Modify: `src/components/index.ts`

- [ ] **Step 1: Write the failing test**

Create `__tests__/components/IconButton.test.tsx`:

```tsx
import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import { Text } from 'react-native';
import { IconButton } from '@/components';
import { ThemeProvider } from '@/theme/ThemeProvider';

const wrap = (node: React.ReactNode) => <ThemeProvider>{node}</ThemeProvider>;

describe('given an IconButton with onPress, when pressed', () => {
  it('then onPress is invoked exactly once', () => {
    const onPress = jest.fn();
    const { getByTestId } = render(
      wrap(
        <IconButton
          icon={<Text>X</Text>}
          onPress={onPress}
          accessibilityLabel="Close"
          testID="ib"
        />,
      ),
    );
    fireEvent.press(getByTestId('ib'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('then the accessibilityLabel prop is forwarded to the underlying Pressable', () => {
    const { getByTestId } = render(
      wrap(
        <IconButton
          icon={<Text>X</Text>}
          onPress={jest.fn()}
          accessibilityLabel="Close dialog"
          testID="ib-a"
        />,
      ),
    );
    expect(getByTestId('ib-a').props.accessibilityLabel).toBe('Close dialog');
  });
});

describe('given disabled=true, when pressed', () => {
  it('then onPress is NOT invoked', () => {
    const onPress = jest.fn();
    const { getByTestId } = render(
      wrap(
        <IconButton
          icon={<Text>X</Text>}
          onPress={onPress}
          accessibilityLabel="Close"
          disabled
          testID="ib-d"
        />,
      ),
    );
    fireEvent.press(getByTestId('ib-d'));
    expect(onPress).not.toHaveBeenCalled();
  });
});

describe('given each tone, when rendered', () => {
  it.each(['primary', 'inverse', 'tertiary'] as const)(
    'then the %s tone renders without crashing',
    (tone) => {
      const { getByTestId } = render(
        wrap(
          <IconButton
            icon={<Text>i</Text>}
            onPress={jest.fn()}
            accessibilityLabel="Info"
            tone={tone}
            testID={`ib-${tone}`}
          />,
        ),
      );
      expect(getByTestId(`ib-${tone}`)).toBeTruthy();
    },
  );
});
```

- [ ] **Step 2: Run the test and verify it fails**

Run: `npm test -- __tests__/components/IconButton.test.tsx`
Expected: FAIL — `IconButton` not exported.

- [ ] **Step 3: Write the implementation**

Create `src/components/IconButton.tsx`:

```tsx
/**
 * Icon-only tap target — 44×44 minimum hit area per theme.md §13.
 * Used for header chrome (close, back, share), inline actions, etc.
 *
 * Tone selects the icon color; the surrounding hit area stays transparent.
 */

import React, { useMemo } from 'react';
import { Pressable, StyleSheet, View, type ViewStyle } from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';
import type { Theme } from '@/theme/theme';

export type IconButtonTone = 'primary' | 'inverse' | 'tertiary';

export interface IconButtonProps {
  /** Rendered icon node (e.g., a lucide-react-native component). */
  icon: React.ReactNode;
  onPress: () => void;
  /** REQUIRED — there is no label text to fall back on. */
  accessibilityLabel: string;
  /** Color tone for the icon background context. Defaults to `'primary'`. */
  tone?: IconButtonTone;
  disabled?: boolean;
  testID?: string;
}

const createStyles = (_theme: Theme) =>
  StyleSheet.create({
    base: {
      width: 44,
      height: 44,
      alignItems: 'center',
      justifyContent: 'center',
    },
    pressed: {
      opacity: 0.6,
    },
    disabled: {
      opacity: 0.4,
    },
  });

export const IconButton: React.FC<IconButtonProps> = ({
  icon,
  onPress,
  accessibilityLabel,
  tone: _tone = 'primary',
  disabled = false,
  testID,
}) => {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const containerStyle = ({ pressed }: { pressed: boolean }): ViewStyle[] => {
    const out: ViewStyle[] = [styles.base];
    if (disabled) out.push(styles.disabled);
    else if (pressed) out.push(styles.pressed);
    return out;
  };

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled }}
      testID={testID}
      style={containerStyle}
    >
      <View>{icon}</View>
    </Pressable>
  );
};
```

- [ ] **Step 4: Update the barrel**

Edit `src/components/index.ts`, append in alphabetical order:

```ts
export { Button } from './Button';
export type { ButtonProps, ButtonVariant } from './Button';
export { Card } from './Card';
export type { CardProps } from './Card';
export { Chip } from './Chip';
export type { ChipProps } from './Chip';
export { IconButton } from './IconButton';
export type { IconButtonProps, IconButtonTone } from './IconButton';
export { Screen } from './Screen';
export type { ScreenEdge, ScreenProps } from './Screen';
export { TextInput } from './TextInput';
export type { TextInputProps } from './TextInput';
```

- [ ] **Step 5: Run the test and verify it passes**

Run: `npm test -- __tests__/components/IconButton.test.tsx`
Expected: PASS.

- [ ] **Step 6: Run lint**

Run: `npm run lint`
Expected: 0 errors. (`_tone` is intentionally prefixed because tone-specific color application is reserved for the first real consumer — A+ Rule 3 forbids preemptive elaboration.)

- [ ] **Step 7: Commit**

```bash
git add src/components/IconButton.tsx __tests__/components/IconButton.test.tsx src/components/index.ts
git commit -m "feat(components): add IconButton 44x44 tap target"
```

---

## Task 10: `TouchableArea` component

**Files:**
- Create: `src/components/TouchableArea.tsx`
- Create: `__tests__/components/TouchableArea.test.tsx`
- Modify: `src/components/index.ts`

- [ ] **Step 1: Write the failing test**

Create `__tests__/components/TouchableArea.test.tsx`:

```tsx
import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import { Text } from 'react-native';
import { TouchableArea } from '@/components';
import { ThemeProvider } from '@/theme/ThemeProvider';

const wrap = (node: React.ReactNode) => <ThemeProvider>{node}</ThemeProvider>;

describe('given a TouchableArea with onPress, when pressed', () => {
  it('then onPress is invoked exactly once', () => {
    const onPress = jest.fn();
    const { getByTestId } = render(
      wrap(
        <TouchableArea onPress={onPress} accessibilityLabel="row" testID="ta">
          <Text>child</Text>
        </TouchableArea>,
      ),
    );
    fireEvent.press(getByTestId('ta'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('then children are in the tree', () => {
    const { getByText } = render(
      wrap(
        <TouchableArea onPress={jest.fn()} accessibilityLabel="row">
          <Text>child-text</Text>
        </TouchableArea>,
      ),
    );
    expect(getByText('child-text')).toBeTruthy();
  });
});

describe('given disabled=true, when pressed', () => {
  it('then onPress is NOT invoked', () => {
    const onPress = jest.fn();
    const { getByTestId } = render(
      wrap(
        <TouchableArea
          onPress={onPress}
          accessibilityLabel="row"
          disabled
          testID="ta-d"
        >
          <Text>child</Text>
        </TouchableArea>,
      ),
    );
    fireEvent.press(getByTestId('ta-d'));
    expect(onPress).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run the test and verify it fails**

Run: `npm test -- __tests__/components/TouchableArea.test.tsx`
Expected: FAIL.

- [ ] **Step 3: Write the implementation**

Create `src/components/TouchableArea.tsx`:

```tsx
/**
 * Generic tappable container. For pressable cards, list rows, or any
 * region that should respond to press without being a text Button.
 *
 * No `style` prop — the caller wraps `TouchableArea` in a local `<View>`
 * for any layout / sizing / spacing. This is A+ Rule 2.
 */

import React from 'react';
import { Pressable, type ViewStyle } from 'react-native';

export interface TouchableAreaProps {
  onPress: () => void;
  /** REQUIRED — describes the press target to assistive tech. */
  accessibilityLabel: string;
  disabled?: boolean;
  children: React.ReactNode;
  testID?: string;
}

const PRESSED_OPACITY = 0.85;
const DISABLED_OPACITY = 0.4;

export const TouchableArea: React.FC<TouchableAreaProps> = ({
  onPress,
  accessibilityLabel,
  disabled = false,
  children,
  testID,
}) => {
  const containerStyle = ({ pressed }: { pressed: boolean }): ViewStyle => ({
    opacity: disabled ? DISABLED_OPACITY : pressed ? PRESSED_OPACITY : 1,
  });

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled }}
      testID={testID}
      style={containerStyle}
    >
      {children}
    </Pressable>
  );
};
```

- [ ] **Step 4: Update the barrel**

Edit `src/components/index.ts`, append in alphabetical order:

```ts
export { Button } from './Button';
export type { ButtonProps, ButtonVariant } from './Button';
export { Card } from './Card';
export type { CardProps } from './Card';
export { Chip } from './Chip';
export type { ChipProps } from './Chip';
export { IconButton } from './IconButton';
export type { IconButtonProps, IconButtonTone } from './IconButton';
export { Screen } from './Screen';
export type { ScreenEdge, ScreenProps } from './Screen';
export { TextInput } from './TextInput';
export type { TextInputProps } from './TextInput';
export { TouchableArea } from './TouchableArea';
export type { TouchableAreaProps } from './TouchableArea';
```

- [ ] **Step 5: Run the test and verify it passes**

Run: `npm test -- __tests__/components/TouchableArea.test.tsx`
Expected: PASS.

- [ ] **Step 6: Run lint**

Run: `npm run lint`
Expected: 0 errors.

- [ ] **Step 7: Commit**

```bash
git add src/components/TouchableArea.tsx __tests__/components/TouchableArea.test.tsx src/components/index.ts
git commit -m "feat(components): add TouchableArea generic tappable container"
```

---

## Task 11: `ChipRow` composite component

**Files:**
- Create: `src/components/ChipRow.tsx`
- Create: `__tests__/components/ChipRow.test.tsx`
- Modify: `src/components/index.ts`

- [ ] **Step 1: Write the failing test**

Create `__tests__/components/ChipRow.test.tsx`:

```tsx
import React from 'react';
import { render } from '@testing-library/react-native';
import { Chip, ChipRow } from '@/components';
import { ThemeProvider } from '@/theme/ThemeProvider';

describe('given a ChipRow with Chip children, when rendered', () => {
  it('then every child Chip label appears in the tree', () => {
    const { getByText } = render(
      <ThemeProvider>
        <ChipRow testID="chip-row">
          <Chip label="Veg" />
          <Chip label="Gluten-free" />
          <Chip label="Vegan" />
        </ChipRow>
      </ThemeProvider>,
    );
    expect(getByText('Veg')).toBeTruthy();
    expect(getByText('Gluten-free')).toBeTruthy();
    expect(getByText('Vegan')).toBeTruthy();
  });

  it('then the testID resolves when provided', () => {
    const { getByTestId } = render(
      <ThemeProvider>
        <ChipRow testID="chip-row">
          <Chip label="x" />
        </ChipRow>
      </ThemeProvider>,
    );
    expect(getByTestId('chip-row')).toBeTruthy();
  });
});
```

- [ ] **Step 2: Run the test and verify it fails**

Run: `npm test -- __tests__/components/ChipRow.test.tsx`
Expected: FAIL.

- [ ] **Step 3: Write the implementation**

Create `src/components/ChipRow.tsx`:

```tsx
/**
 * Wrapping flex row of Chips. Replaces the inline ChipRow sub-component
 * that previously lived in LandingScreen.
 */

import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';
import type { Theme } from '@/theme/theme';

export interface ChipRowProps {
  /** Expected to be Chip elements; not enforced at the type level. */
  children: React.ReactNode;
  testID?: string;
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    row: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: theme.spacing.sm,
    },
  });

export const ChipRow: React.FC<ChipRowProps> = ({ children, testID }) => {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <View style={styles.row} testID={testID}>
      {children}
    </View>
  );
};
```

- [ ] **Step 4: Update the barrel**

Edit `src/components/index.ts`, append in alphabetical order:

```ts
export { Button } from './Button';
export type { ButtonProps, ButtonVariant } from './Button';
export { Card } from './Card';
export type { CardProps } from './Card';
export { Chip } from './Chip';
export type { ChipProps } from './Chip';
export { ChipRow } from './ChipRow';
export type { ChipRowProps } from './ChipRow';
export { IconButton } from './IconButton';
export type { IconButtonProps, IconButtonTone } from './IconButton';
export { Screen } from './Screen';
export type { ScreenEdge, ScreenProps } from './Screen';
export { TextInput } from './TextInput';
export type { TextInputProps } from './TextInput';
export { TouchableArea } from './TouchableArea';
export type { TouchableAreaProps } from './TouchableArea';
```

- [ ] **Step 5: Run the test and verify it passes**

Run: `npm test -- __tests__/components/ChipRow.test.tsx`
Expected: PASS.

- [ ] **Step 6: Run lint**

Run: `npm run lint`
Expected: 0 errors.

- [ ] **Step 7: Commit**

```bash
git add src/components/ChipRow.tsx __tests__/components/ChipRow.test.tsx src/components/index.ts
git commit -m "feat(components): add ChipRow wrapping flex row"
```

---

## Task 12: `FormField` composite component

**Files:**
- Create: `src/components/FormField.tsx`
- Create: `__tests__/components/FormField.test.tsx`
- Modify: `src/components/index.ts`

- [ ] **Step 1: Write the failing test**

Create `__tests__/components/FormField.test.tsx`:

```tsx
import React from 'react';
import { render } from '@testing-library/react-native';
import { FormField, TextInput } from '@/components';
import { ThemeProvider } from '@/theme/ThemeProvider';

const wrap = (node: React.ReactNode) => <ThemeProvider>{node}</ThemeProvider>;

describe('given a FormField with label and no error, when rendered', () => {
  it('then the label text is visible', () => {
    const { getByText } = render(
      wrap(
        <FormField label="Email">
          <TextInput value="" onChangeText={jest.fn()} testID="email-input" />
        </FormField>,
      ),
    );
    expect(getByText('Email')).toBeTruthy();
  });

  it('then the child input is in the tree with its testID intact', () => {
    const { getByTestId } = render(
      wrap(
        <FormField label="Email">
          <TextInput value="" onChangeText={jest.fn()} testID="email-input" />
        </FormField>,
      ),
    );
    expect(getByTestId('email-input')).toBeTruthy();
  });
});

describe('given a FormField with an error, when rendered', () => {
  it('then the error message is visible in the tree', () => {
    const { getByText } = render(
      wrap(
        <FormField label="Email" error="Required">
          <TextInput value="" onChangeText={jest.fn()} />
        </FormField>,
      ),
    );
    expect(getByText('Required')).toBeTruthy();
  });
});
```

- [ ] **Step 2: Run the test and verify it fails**

Run: `npm test -- __tests__/components/FormField.test.tsx`
Expected: FAIL.

- [ ] **Step 3: Write the implementation**

Create `src/components/FormField.tsx`:

```tsx
/**
 * Label + input + inline-error wrapper. Clones its TextInput child to
 * inject `hasError = !!error`, keeping screen markup readable without
 * forcing FormField to know about every TextInput prop.
 *
 * Error styling pulls from `createCommonStyles(theme).errorTextBlock`.
 */

import React, { isValidElement, useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';
import { textStyles } from '@/theme/typography';
import { createCommonStyles } from '@/theme/commonStyles';
import type { Theme } from '@/theme/theme';
import type { TextInputProps } from './TextInput';

export interface FormFieldProps {
  label: string;
  /** When set, child input gets `hasError={true}` and the error is rendered. */
  error?: string;
  /** Expected to be a single <TextInput /> element. */
  children: React.ReactNode;
  testID?: string;
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    container: {
      gap: theme.spacing.xs,
    },
    label: {
      ...textStyles.label.md,
      color: theme.colors.text.secondary,
    },
  });

export const FormField: React.FC<FormFieldProps> = ({ label, error, children, testID }) => {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const common = useMemo(() => createCommonStyles(theme), [theme]);

  const childWithError = isValidElement<TextInputProps>(children)
    ? React.cloneElement(children, { hasError: !!error })
    : children;

  return (
    <View style={styles.container} testID={testID}>
      <Text style={styles.label}>{label}</Text>
      {childWithError}
      {error !== undefined && <Text style={common.errorTextBlock}>{error}</Text>}
    </View>
  );
};
```

- [ ] **Step 4: Update the barrel**

Edit `src/components/index.ts`, append in alphabetical order:

```ts
export { Button } from './Button';
export type { ButtonProps, ButtonVariant } from './Button';
export { Card } from './Card';
export type { CardProps } from './Card';
export { Chip } from './Chip';
export type { ChipProps } from './Chip';
export { ChipRow } from './ChipRow';
export type { ChipRowProps } from './ChipRow';
export { FormField } from './FormField';
export type { FormFieldProps } from './FormField';
export { IconButton } from './IconButton';
export type { IconButtonProps, IconButtonTone } from './IconButton';
export { Screen } from './Screen';
export type { ScreenEdge, ScreenProps } from './Screen';
export { TextInput } from './TextInput';
export type { TextInputProps } from './TextInput';
export { TouchableArea } from './TouchableArea';
export type { TouchableAreaProps } from './TouchableArea';
```

- [ ] **Step 5: Run the test and verify it passes**

Run: `npm test -- __tests__/components/FormField.test.tsx`
Expected: PASS.

- [ ] **Step 6: Run lint**

Run: `npm run lint`
Expected: 0 errors.

- [ ] **Step 7: Commit**

```bash
git add src/components/FormField.tsx __tests__/components/FormField.test.tsx src/components/index.ts
git commit -m "feat(components): add FormField label+input+error composite"
```

---

## Task 13: `codingprinciples.md` edits

**Files:**
- Modify: `codingprinciples.md`

This task applies the edits described in spec §8.1. Read the spec section first; the changes are surgical, not a rewrite.

- [ ] **Step 1: Add the catalog-mandatory bullet to "Component style"**

Open `codingprinciples.md`. Locate the "Component style" section (currently lines 14–19 per the spec). Append this bullet to that list:

```markdown
- **Catalog components are mandatory.** Screens MUST import the following from `@/components` for the roles they cover: `Button`, `IconButton`, `TouchableArea`, `TextInput`, `FormField`, `Chip`, `ChipRow`, `Card`, `Screen`. Screens MAY NOT import `TouchableOpacity`, `Pressable`, `TextInput` (as the `react-native` primitive), `Switch`, or `Modal` directly from `react-native`. New variants are added to the catalog component, never inlined in a screen. See **Component Catalog** below.
```

- [ ] **Step 2: Insert the new "Component Catalog" subsection**

Between the existing "Component style" subsection and the "Styling" subsection, insert:

```markdown
### Component Catalog

The reusable component catalog under `src/components/` is the only way screens build interactive UI. The catalog is closed-API by design.

**Catalog (9 components):**

- `Button` — every text button. Variants: `primary`, `secondary`, `ghost`.
- `IconButton` — icon-only 44×44 tap target.
- `TouchableArea` — generic tappable container for cards / list rows.
- `TextInput` — single- or multi-line text input.
- `FormField` — label + input + inline error wrapper.
- `Chip` — display-only pill (icon + label).
- `ChipRow` — wrapping flex row of Chips.
- `Card` — visual container. Variants: `standard`, `muted`.
- `Screen` — outer wrapper with safe-area + horizontal page padding.

**Rules (A+ discipline):**

1. **Closed prop surfaces.** Every catalog component has a documented `Props` interface. Adding a prop requires (a) a second screen demonstrating the need, (b) TSDoc on the new prop, (c) a corresponding `theme.md` §9 update if it changes visuals.
2. **No `style` / `containerStyle` / `textStyle` / `contentContainerStyle` prop on any catalog component.** Ever. Composition uses Rule 3 or wrapping `<View>`s.
3. **Typed spacing-scale props added reactively.** When wrapping a catalog component in `<View style={{ marginTop: … }}>` is repeated in ≥3 screens, the component may add `marginTop?: keyof Theme['spacing']`. Raw numbers stay forbidden.
4. **Variants are string-literal unions, not strings.** `variant: 'primary' | 'secondary' | 'ghost'`, never `variant: string`.
5. **Screens never import `TouchableOpacity`, `Pressable`, `TextInput`, `Switch`, or `Modal` from `react-native`.** Enforced by ESLint (`no-restricted-imports`) scoped to `src/screens/**`.
6. **Composition through children, not config.** No `extraSlot`, `rightAccessory`, or other slot-like props. Compose in JSX.
7. **No magic defaults.** Required props have no `?`. Optional defaults are documented in TSDoc. No prop default depends on another prop.

**Adding a new component:**

- Demonstrate ≥2-screen need (rule of two, not rule of three — this is stricter).
- TSDoc on every exported symbol.
- Add a `theme.md` §9 entry annotated as "Implemented as …".
- Test file at `__tests__/components/<Name>.test.tsx` covering every variant, every interactive prop, disabled/loading states, `accessibilityLabel`, `onPress`, light + dark theme.

**Legacy footnote:** `LoginScreen.tsx`, `RegisterScreen.tsx`, and `LandingScreen.tsx` predate this rule. They use inline patterns and carry a file-top `eslint-disable no-restricted-imports` directive. They conform incrementally when touched for unrelated work. New code does not get the same grace.
```

- [ ] **Step 3: Update the "Styling" subsection**

In the "Styling" subsection of `codingprinciples.md`:

- Locate the bullet that lists where design tokens live ("Design tokens are split by domain…"). Append a new sub-bullet at the end of that list:

```markdown
  - `src/theme/commonStyles.ts` — `createCommonStyles(theme)` factory for shared layout fragments. Rule-of-two threshold; layout only.
```

- Locate the line that reads "A single combined `styles/styles.ts` is not used" and replace it with:

```markdown
A single combined `styles/styles.ts` is **not** used. Shared layout fragments live in `commonStyles.ts`; catalog-component styles live inside each component file; screen-specific layout stays in the screen's local `createStyles`.
```

- [ ] **Step 4: Update the "Testing principles" subsection**

Replace the existing test-location bullet (paraphrased: "every component has a test colocated…") with:

```markdown
- Every component has a test under `__tests__/components/<ComponentName>.test.tsx`. Every helper has a test under `__tests__/helpers/` (or its own colocated `*.test.ts`). Screen integration tests live under `__tests__/`.
```

Append two new bullets to the same list:

```markdown
- **Catalog components are tested centrally and exhaustively.** A screen's test suite does NOT re-assert the visual rendering of a catalog component it uses — it asserts only the wiring (correct props passed, `onPress` invokes the right handler, conditional rendering branches). This is the testing-effort reduction that mandatory components deliver.
- A screen that uses ONLY catalog components and `commonStyles.ts` (no local `createStyles`) requires only wiring tests. A screen with screen-specific layout still tests render-without-crash + prop variations as before.
```

- [ ] **Step 5: Verify the doc still reads cleanly**

Run: `npx prettier --check codingprinciples.md` (or skip if prettier doesn't track `.md` in this repo).
Expected: no warnings.

- [ ] **Step 6: Commit**

```bash
git add codingprinciples.md
git commit -m "docs(codingprinciples): codify component catalog + commonStyles rules"
```

---

## Task 14: `theme.md` edits

**Files:**
- Modify: `theme.md`

- [ ] **Step 1: Add the new §0 rule**

In `theme.md` §0 ("Critical Rules for the Agent"), append a new numbered rule:

```markdown
9. **All interactive primitives are imported from `@/components`, never built ad-hoc.** A screen that needs a button uses `<Button variant="primary" />`; it does not assemble a button from `<Pressable>` and `<Text>`. See §9 for the catalog and §15 for the canonical implementation pattern.
```

(If §0 currently has 8 rules, this becomes rule 9. If a different count, renumber appropriately.)

- [ ] **Step 2: Update §1.4 Styling Approach**

Append a final paragraph (or final bullet, matching the existing style) to §1.4:

```markdown
Shared layout fragments live in `src/theme/commonStyles.ts` as a `createCommonStyles(theme)` factory. See `codingprinciples.md` → Styling for the rule-of-two threshold.
```

- [ ] **Step 3: Annotate §9 pattern entries that map to catalog components**

For each of the patterns below in `theme.md` §9, append the bracketed annotation at the end of the pattern's prose block:

- §9.1 Primary Button → **Implemented as `<Button variant="primary" />`. See §15.**
- §9.2 Secondary Button → **Implemented as `<Button variant="secondary" />`.**
- §9.3 Tertiary / Ghost Button → **Implemented as `<Button variant="ghost" />`.**
- §9.4 Input Field → **Implemented as `<TextInput />`. Wrap with `<FormField label="…" error={…}>` for labeled inputs.**
- §9.6 List Row / Card → **Implemented as `<Card variant="standard" />`. Pressable variant: `<TouchableArea><Card>…</Card></TouchableArea>`.**

Then add this footnote immediately under the §9 heading:

```markdown
> Patterns marked **Implemented as …** below have a corresponding component under `@/components` and MUST be used by screens. Unmarked patterns are design guidance only and will be promoted to components when first used.
```

- [ ] **Step 4: Update §15 to point at the real Button file**

In §15, locate the hypothetical `PrimaryButton.tsx` example block. Replace its opening prose with a reference to the real file:

```markdown
The canonical implementation pattern lives in `src/components/Button.tsx`. Read that file alongside this section for the concrete factory pattern. The example below is a reduced sketch — the real file is authoritative.
```

Keep the existing "Bad components — all of the following are forbidden" subsection unchanged.

Add a new subsection §15.1 at the end of §15:

```markdown
### §15.1 — When to add a new component

A new component is added to `src/components/` only when:

1. ≥2 screens demonstrate the need (rule of two, codified in `codingprinciples.md` → Component Catalog).
2. The proposed prop surface is closed-API per A+ Rule 2 (no `style` pass-through).
3. A corresponding §9 entry is added or updated, annotated as "Implemented as …".
4. Tests live at `__tests__/components/<Name>.test.tsx` and cover every variant, every interactive prop, disabled / loading states, `accessibilityLabel`, `onPress`, and light + dark theme.

No "just for this screen." No "we'll generalize later." See `codingprinciples.md` → Component Catalog for the full rules.
```

- [ ] **Step 5: Verify the doc still parses**

Run: `npx prettier --check theme.md` (or skip if not tracked).
Expected: no warnings.

- [ ] **Step 6: Commit**

```bash
git add theme.md
git commit -m "docs(theme): annotate catalog patterns and add §15.1 component-addition rule"
```

---

## Task 15: Verification gate

**Files:** none (read-only verification)

This task ensures the full suite is green, coverage targets are met, and no regression slipped in across the prior 14 tasks.

- [ ] **Step 1: Run the full test suite**

Run: `npm test`
Expected: all suites pass. New component suites should add ≈ 30–45 tests beyond the pre-existing baseline.

- [ ] **Step 2: Run lint across the whole repo**

Run: `npm run lint`
Expected: 0 errors. (Warnings from `tsdoc/syntax` on legacy files are tolerated; do not silence them in this PR.)

- [ ] **Step 3: Run TypeScript type-check**

Run: `npx tsc --noEmit`
Expected: 0 errors.

- [ ] **Step 4: Run the full coverage report**

Run: `npm run test:coverage`
Expected: all four thresholds remain green (`lines ≥ 80`, `branches ≥ 75`, `functions ≥ 80`, `statements ≥ 80`).

If any threshold fails:
- If the failure is on a brand-new component, add the missing test cases to that component's suite.
- If the failure is in `commonStyles.ts`, add a targeted fragment test.
- Do NOT lower the thresholds in `jest.config.js`.

- [ ] **Step 5: Verify the legacy screens still render in isolation**

Run: `npm test -- screens.stubs.test.tsx`
Expected: PASS — legacy screen rendering is unaffected by the catalog additions.

- [ ] **Step 6: Final commit log sanity check**

Run: `git log --oneline origin/development..HEAD`
Expected: 14 commits in order:
1. `feat(theme): add createCommonStyles factory for shared layout fragments`
2. `chore(components): scaffold empty catalog barrel`
3. `feat(lint): forbid raw react-native primitives in src/screens; grandfather legacy screens`
4. `feat(components): add Chip display-only pill`
5. `feat(components): add Card visual container (standard/muted variants)`
6. `feat(components): add Screen wrapper with safe-area + scrollable support`
7. `feat(components): add TextInput with focus/error states (theme.md §9.4)`
8. `feat(components): add Button with primary/secondary/ghost variants`
9. `feat(components): add IconButton 44x44 tap target`
10. `feat(components): add TouchableArea generic tappable container`
11. `feat(components): add ChipRow wrapping flex row`
12. `feat(components): add FormField label+input+error composite`
13. `docs(codingprinciples): codify component catalog + commonStyles rules`
14. `docs(theme): annotate catalog patterns and add §15.1 component-addition rule`

(Plus the spec commit cherry-picked at the start, which precedes the 14 above.)

No commit at the end of Task 15 — nothing changed.

- [ ] **Step 7: Open the PR**

```bash
git push -u origin feat/component-catalog-and-common-styles
gh pr create --base development --title "Reusable component catalog + commonStyles" --body "$(cat <<'EOF'
## Summary
- Adds 9 reusable React Native components under `src/components/` (Button, IconButton, TouchableArea, TextInput, FormField, Chip, ChipRow, Card, Screen).
- Adds `src/theme/commonStyles.ts` factory for shared layout fragments.
- Adds ESLint `no-restricted-imports` scoped to `src/screens/**` blocking raw react-native primitives.
- Grandfathers the 3 legacy screens (Login / Register / Landing) behind file-top eslint-disable directives.
- Codifies the rules in `codingprinciples.md` (new Component Catalog subsection) and `theme.md` (§9 annotations + §15.1).

Spec: `docs/superpowers/specs/2026-05-17-reusable-components-and-common-styles-design.md`
Plan: `docs/superpowers/plans/2026-05-17-reusable-component-catalog-and-common-styles.md`

## Test plan
- [ ] All Jest suites pass.
- [ ] Coverage thresholds 80/75/80/80 green.
- [ ] `npm run lint` clean.
- [ ] `npx tsc --noEmit` clean.
- [ ] Legacy screen render tests still pass unchanged.

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

---

*End of plan.*
