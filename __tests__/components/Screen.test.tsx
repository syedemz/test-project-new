/**
 * Tests for the Screen wrapper component.
 */

import React from 'react';
import { render } from '@testing-library/react-native';
import { Text } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Screen } from '@/components';
import { ThemeProvider } from '@/theme/ThemeProvider';

const wrap = (node: React.ReactNode) => (
  <SafeAreaProvider
    initialMetrics={{
      frame: { x: 0, y: 0, width: 320, height: 640 },
      insets: { top: 0, right: 0, bottom: 0, left: 0 },
    }}
  >
    <ThemeProvider>{node}</ThemeProvider>
  </SafeAreaProvider>
);

describe('given a Screen with default props, when rendered', () => {
  it('then the children are visible in the tree', () => {
    const { getByText } = render(
      wrap(
        <Screen>
          <Text>child</Text>
        </Screen>,
      ),
    );
    expect(getByText('child')).toBeTruthy();
  });

  it('then the testID resolves when provided', () => {
    const { getByTestId } = render(
      wrap(
        <Screen testID="screen-root">
          <Text>child</Text>
        </Screen>,
      ),
    );
    expect(getByTestId('screen-root')).toBeTruthy();
  });
});

describe('given scrollable=true, when rendered', () => {
  it('then children are still in the tree', () => {
    const { getByText } = render(
      wrap(
        <Screen scrollable>
          <Text>scroll-child</Text>
        </Screen>,
      ),
    );
    expect(getByText('scroll-child')).toBeTruthy();
  });
});
