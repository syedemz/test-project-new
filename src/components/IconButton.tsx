/**
 * Icon-only tap target — 44x44 minimum hit area per theme.md §13.
 * Used for header chrome (close, back, share), inline actions, etc.
 *
 * Tone selects the icon color context. Color application is reserved
 * for the first real consumer per A+ Rule 3 (typed props added reactively).
 */

import React, { useMemo } from 'react';
import { Pressable, StyleSheet, View, type ViewStyle } from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';
import type { Theme } from '@/theme/theme';

/** Color tone for the icon context. */
export type IconButtonTone = 'primary' | 'inverse' | 'tertiary';

/** Props for the IconButton catalog component. */
export interface IconButtonProps {
  /** Rendered icon node (e.g., a lucide-react-native component). */
  icon: React.ReactNode;
  onPress: () => void;
  /** REQUIRED — there is no label text to fall back on. */
  accessibilityLabel: string;
  /** Color tone for the icon context. Defaults to 'primary'. */
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

/** Icon-only tap target with 44x44 hit area. */
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
