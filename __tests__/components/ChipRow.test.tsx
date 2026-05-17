/**
 * Tests for the ChipRow catalog component.
 */

import React from 'react';
import { render } from '@testing-library/react-native';
import { Chip, ChipRow } from '@/components';
import { ThemeProvider } from '@/theme/ThemeProvider';

describe('given a ChipRow with Chip children, when rendered', () => {
  it('then every child Chip label appears in the tree', () => {
    const { getByText } = render(
      <ThemeProvider>
        <ChipRow testID="chip-row">
          <Chip label="Veg" />
          <Chip label="Gluten-free" />
          <Chip label="Vegan" />
        </ChipRow>
      </ThemeProvider>,
    );
    expect(getByText('Veg')).toBeTruthy();
    expect(getByText('Gluten-free')).toBeTruthy();
    expect(getByText('Vegan')).toBeTruthy();
  });

  it('then the testID resolves when provided', () => {
    const { getByTestId } = render(
      <ThemeProvider>
        <ChipRow testID="chip-row">
          <Chip label="x" />
        </ChipRow>
      </ThemeProvider>,
    );
    expect(getByTestId('chip-row')).toBeTruthy();
  });
});
