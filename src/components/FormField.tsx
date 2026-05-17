/**
 * Label + input + inline-error wrapper. Clones its TextInput child to
 * inject hasError when error is set, keeping screen markup readable
 * without forcing FormField to know about every TextInput prop.
 *
 * Error styling pulls from createCommonStyles(theme).errorTextBlock.
 */

import React, { isValidElement, useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';
import { textStyles } from '@/theme/typography';
import { createCommonStyles } from '@/theme/commonStyles';
import type { Theme } from '@/theme/theme';
import type { TextInputProps } from './TextInput';

/** Props for the FormField catalog component. */
export interface FormFieldProps {
  label: string;
  /** When set, child input gets hasError=true and the error is rendered. */
  error?: string;
  /** Expected to be a single TextInput element. */
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

/** Wrap a TextInput with a label and inline error message. */
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
