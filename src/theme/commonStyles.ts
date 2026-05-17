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

/** Factory: produces a StyleSheet of shared layout fragments bound to the given theme. */
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

/** Return type of `createCommonStyles` — the resolved StyleSheet for a given theme. */
export type CommonStyles = ReturnType<typeof createCommonStyles>;
