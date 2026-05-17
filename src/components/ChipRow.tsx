/**
 * Wrapping flex row of Chips. Replaces the inline ChipRow sub-component
 * that previously lived in LandingScreen.
 */

import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';
import type { Theme } from '@/theme/theme';

/** Props for the ChipRow catalog component. */
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

/** Wrapping horizontal row of Chip elements. */
export const ChipRow: React.FC<ChipRowProps> = ({ children, testID }) => {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <View style={styles.row} testID={testID}>
      {children}
    </View>
  );
};
