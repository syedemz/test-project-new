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

/** Visual variant for the Card container. */
export type CardVariant = 'standard' | 'muted';

/** Props for the Card catalog component. */
export interface CardProps {
  /** Visual variant. Defaults to `'standard'`. */
  variant?: CardVariant;
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

/** Visual container. Choose `variant='muted'` for the recessed-section look. */
export const Card: React.FC<CardProps> = ({ variant = 'standard', children, testID }) => {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <View style={variant === 'muted' ? styles.muted : styles.standard} testID={testID}>
      {children}
    </View>
  );
};
