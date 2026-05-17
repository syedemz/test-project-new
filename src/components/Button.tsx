/**
 * Every text button across the app. Three variants:
 * - primary: pink background, white text (theme.md §9.1)
 * - secondary: mint background, black text (theme.md §9.2)
 * - ghost: transparent background, pink text (theme.md §9.3)
 *
 * disabled and loading both block press. loading shows a spinner in
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

/** Button visual variant. */
export type ButtonVariant = 'primary' | 'secondary' | 'ghost';

/** Props for the Button catalog component. */
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
  /** Defaults to the label prop. */
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

/** Every text button across the app. Variant selects the surface/text colors. */
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
    if (variant === 'secondary')
      base.push(blocked ? styles.secondaryDisabled : styles.secondary);
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
