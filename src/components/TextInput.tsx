/**
 * Single-line or multi-line text input. Replaces react-native's TextInput
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

/** Subset of native keyboardType values that the catalog exposes. */
export type TextInputKeyboardType = 'default' | 'email-address' | 'numeric' | 'phone-pad';

/** Props for the TextInput catalog component. */
export interface TextInputProps {
  value: string;
  onChangeText: (next: string) => void;
  placeholder?: string;
  secureTextEntry?: boolean;
  multiline?: boolean;
  /** Meaningful only when multiline is true. */
  numberOfLines?: number;
  autoCapitalize?: AutoCapitalize;
  autoCorrect?: boolean;
  keyboardType?: TextInputKeyboardType;
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

/** Themed text input with internal focus/error border handling. */
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
  const styles = useMemo(
    () => createStyles(theme, focused, hasError),
    [theme, focused, hasError],
  );

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
