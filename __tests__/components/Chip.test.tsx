/**
 * Tests for the Chip catalog component. Chip is display-only (non-tappable).
 */

import React from 'react';
import { render } from '@testing-library/react-native';
import { Chip } from '@/components';
import { ThemeProvider } from '@/theme/ThemeProvider';

describe('given a Chip with only a label, when rendered', () => {
  it('then the label text is in the tree', () => {
    const { getByText } = render(
      <ThemeProvider>
        <Chip label="Vegetarian" />
      </ThemeProvider>,
    );
    expect(getByText('Vegetarian')).toBeTruthy();
  });

  it('then the testID resolves when provided', () => {
    const { getByTestId } = render(
      <ThemeProvider>
        <Chip label="Vegetarian" testID="chip-veg" />
      </ThemeProvider>,
    );
    expect(getByTestId('chip-veg')).toBeTruthy();
  });
});

describe('given a Chip with an icon string, when rendered', () => {
  it('then the icon string appears in the tree alongside the label', () => {
    const { getByText } = render(
      <ThemeProvider>
        <Chip icon="🌱" label="Vegetarian" />
      </ThemeProvider>,
    );
    expect(getByText('🌱')).toBeTruthy();
    expect(getByText('Vegetarian')).toBeTruthy();
  });
});
