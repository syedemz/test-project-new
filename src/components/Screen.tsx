/**
 * Outer wrapper for every screen. Provides safe-area inset padding,
 * the primary background color, horizontal page padding, and (optionally)
 * a vertical ScrollView. Replaces inline View + useSafeAreaInsets +
 * paddingHorizontal boilerplate.
 *
 * Defaults: scrollable=false, edges=['top','bottom'].
 */

import React, { useMemo } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/theme/ThemeProvider';
import type { Theme } from '@/theme/theme';

/** Safe-area edge identifier used by Screen.edges. */
export type ScreenEdge = 'top' | 'bottom' | 'left' | 'right';

/** Props for the Screen wrapper component. */
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

/** Outer wrapper for every screen. Applies safe-area insets, bg, and horizontal padding. */
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
