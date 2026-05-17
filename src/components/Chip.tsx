/**
 * Display-only pill. Non-tappable. Maps to theme.md §9.6 (chip pattern).
 *
 * @example
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

/** Props for the Chip catalog component. */
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

/** Display-only pill: a small rounded container with an optional icon and a label. */
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
