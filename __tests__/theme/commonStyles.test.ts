/**
 * Smoke tests for createCommonStyles — confirms the factory produces a
 * complete StyleSheet for both light and dark themes and that every
 * declared fragment resolves without throwing or yielding undefined.
 */

import { StyleSheet } from 'react-native';
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
    const flat = StyleSheet.flatten(styles.sectionDivider);
    expect(flat.backgroundColor).toBe(lightTheme.colors.border.default);
  });
});

describe('given the dark theme, when createCommonStyles runs', () => {
  it('then errorTextBlock uses the dark status.error color', () => {
    const styles = createCommonStyles(darkTheme);
    const flat = StyleSheet.flatten(styles.errorTextBlock);
    expect(flat.color).toBe(darkTheme.colors.status.error);
  });
});
