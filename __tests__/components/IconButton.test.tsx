/**
 * Tests for the IconButton catalog component.
 */

import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import { Text } from 'react-native';
import { IconButton } from '@/components';
import { ThemeProvider } from '@/theme/ThemeProvider';

const wrap = (node: React.ReactNode) => <ThemeProvider>{node}</ThemeProvider>;

describe('given an IconButton with onPress, when pressed', () => {
  it('then onPress is invoked exactly once', () => {
    const onPress = jest.fn();
    const { getByTestId } = render(
      wrap(
        <IconButton
          icon={<Text>X</Text>}
          onPress={onPress}
          accessibilityLabel="Close"
          testID="ib"
        />,
      ),
    );
    fireEvent.press(getByTestId('ib'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('then the accessibilityLabel prop is forwarded to the underlying Pressable', () => {
    const { getByTestId } = render(
      wrap(
        <IconButton
          icon={<Text>X</Text>}
          onPress={jest.fn()}
          accessibilityLabel="Close dialog"
          testID="ib-a"
        />,
      ),
    );
    expect(getByTestId('ib-a').props.accessibilityLabel).toBe('Close dialog');
  });
});

describe('given disabled=true, when pressed', () => {
  it('then onPress is NOT invoked', () => {
    const onPress = jest.fn();
    const { getByTestId } = render(
      wrap(
        <IconButton
          icon={<Text>X</Text>}
          onPress={onPress}
          accessibilityLabel="Close"
          disabled
          testID="ib-d"
        />,
      ),
    );
    fireEvent.press(getByTestId('ib-d'));
    expect(onPress).not.toHaveBeenCalled();
  });
});

describe('given each tone, when rendered', () => {
  it.each(['primary', 'inverse', 'tertiary'] as const)(
    'then the %s tone renders without crashing',
    (tone) => {
      const { getByTestId } = render(
        wrap(
          <IconButton
            icon={<Text>i</Text>}
            onPress={jest.fn()}
            accessibilityLabel="Info"
            tone={tone}
            testID={`ib-${tone}`}
          />,
        ),
      );
      expect(getByTestId(`ib-${tone}`)).toBeTruthy();
    },
  );
});
