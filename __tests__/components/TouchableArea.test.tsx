/**
 * Tests for the TouchableArea catalog component.
 */

import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import { Text } from 'react-native';
import { TouchableArea } from '@/components';
import { ThemeProvider } from '@/theme/ThemeProvider';

const wrap = (node: React.ReactNode) => <ThemeProvider>{node}</ThemeProvider>;

describe('given a TouchableArea with onPress, when pressed', () => {
  it('then onPress is invoked exactly once', () => {
    const onPress = jest.fn();
    const { getByTestId } = render(
      wrap(
        <TouchableArea onPress={onPress} accessibilityLabel="row" testID="ta">
          <Text>child</Text>
        </TouchableArea>,
      ),
    );
    fireEvent.press(getByTestId('ta'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('then children are in the tree', () => {
    const { getByText } = render(
      wrap(
        <TouchableArea onPress={jest.fn()} accessibilityLabel="row">
          <Text>child-text</Text>
        </TouchableArea>,
      ),
    );
    expect(getByText('child-text')).toBeTruthy();
  });
});

describe('given disabled=true, when pressed', () => {
  it('then onPress is NOT invoked', () => {
    const onPress = jest.fn();
    const { getByTestId } = render(
      wrap(
        <TouchableArea
          onPress={onPress}
          accessibilityLabel="row"
          disabled
          testID="ta-d"
        >
          <Text>child</Text>
        </TouchableArea>,
      ),
    );
    fireEvent.press(getByTestId('ta-d'));
    expect(onPress).not.toHaveBeenCalled();
  });
});
