/**
 * Tests for the Button catalog component.
 */

import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import { Button } from '@/components';
import { ThemeProvider } from '@/theme/ThemeProvider';

const wrap = (node: React.ReactNode) => <ThemeProvider>{node}</ThemeProvider>;

describe('given a primary Button with onPress, when pressed', () => {
  it('then onPress is invoked exactly once', () => {
    const onPress = jest.fn();
    const { getByTestId } = render(
      wrap(<Button variant="primary" label="Save" onPress={onPress} testID="btn" />),
    );
    fireEvent.press(getByTestId('btn'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('then the label text is in the tree', () => {
    const { getByText } = render(
      wrap(<Button variant="primary" label="Save" onPress={jest.fn()} />),
    );
    expect(getByText('Save')).toBeTruthy();
  });
});

describe('given disabled=true, when the button is pressed', () => {
  it('then onPress is NOT invoked', () => {
    const onPress = jest.fn();
    const { getByTestId } = render(
      wrap(
        <Button variant="primary" label="Save" onPress={onPress} disabled testID="btn-d" />,
      ),
    );
    fireEvent.press(getByTestId('btn-d'));
    expect(onPress).not.toHaveBeenCalled();
  });
});

describe('given loading=true, when the button is pressed', () => {
  it('then onPress is NOT invoked', () => {
    const onPress = jest.fn();
    const { getByTestId } = render(
      wrap(
        <Button variant="primary" label="Save" onPress={onPress} loading testID="btn-l" />,
      ),
    );
    fireEvent.press(getByTestId('btn-l'));
    expect(onPress).not.toHaveBeenCalled();
  });
});

describe('given each variant, when rendered', () => {
  it.each(['primary', 'secondary', 'ghost'] as const)(
    'then the %s variant renders without crashing',
    (variant) => {
      const { getByText } = render(
        wrap(<Button variant={variant} label={`btn-${variant}`} onPress={jest.fn()} />),
      );
      expect(getByText(`btn-${variant}`)).toBeTruthy();
    },
  );
});

describe('given accessibilityLabel is omitted, when rendered', () => {
  it('then the accessibilityLabel defaults to the label prop', () => {
    const { getByTestId } = render(
      wrap(<Button variant="primary" label="Save" onPress={jest.fn()} testID="btn-a" />),
    );
    expect(getByTestId('btn-a').props.accessibilityLabel).toBe('Save');
  });
});
