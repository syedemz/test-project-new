/**
 * Tests for the Card catalog component.
 */

import React from 'react';
import { render } from '@testing-library/react-native';
import { Text } from 'react-native';
import { Card } from '@/components';
import { ThemeProvider } from '@/theme/ThemeProvider';

describe('given a Card with default variant, when rendered', () => {
  it('then the children are visible in the tree', () => {
    const { getByText } = render(
      <ThemeProvider>
        <Card>
          <Text>child</Text>
        </Card>
      </ThemeProvider>,
    );
    expect(getByText('child')).toBeTruthy();
  });

  it('then the testID resolves when provided', () => {
    const { getByTestId } = render(
      <ThemeProvider>
        <Card testID="standard-card">
          <Text>child</Text>
        </Card>
      </ThemeProvider>,
    );
    expect(getByTestId('standard-card')).toBeTruthy();
  });
});

describe('given a Card with variant="muted", when rendered', () => {
  it('then it renders without crashing and children are visible', () => {
    const { getByText } = render(
      <ThemeProvider>
        <Card variant="muted">
          <Text>muted-child</Text>
        </Card>
      </ThemeProvider>,
    );
    expect(getByText('muted-child')).toBeTruthy();
  });
});
