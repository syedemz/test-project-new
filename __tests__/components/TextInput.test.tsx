/**
 * Tests for the TextInput catalog component.
 */

import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import { TextInput } from '@/components';
import { ThemeProvider } from '@/theme/ThemeProvider';

const wrap = (node: React.ReactNode) => <ThemeProvider>{node}</ThemeProvider>;

describe('given a TextInput with value and onChangeText, when text changes', () => {
  it('then onChangeText is invoked with the new value', () => {
    const onChangeText = jest.fn();
    const { getByTestId } = render(
      wrap(
        <TextInput value="" onChangeText={onChangeText} testID="ti" placeholder="Type" />,
      ),
    );
    fireEvent.changeText(getByTestId('ti'), 'hello');
    expect(onChangeText).toHaveBeenCalledWith('hello');
  });

  it('then the placeholder is rendered as a prop on the underlying input', () => {
    const { getByPlaceholderText } = render(
      wrap(<TextInput value="" onChangeText={jest.fn()} placeholder="Type here" />),
    );
    expect(getByPlaceholderText('Type here')).toBeTruthy();
  });
});

describe('given hasError=true, when the input renders', () => {
  it('then it renders without crashing', () => {
    const { getByTestId } = render(
      wrap(<TextInput value="" onChangeText={jest.fn()} hasError testID="ti-err" />),
    );
    expect(getByTestId('ti-err')).toBeTruthy();
  });
});

describe('given multiline=true with numberOfLines, when rendered', () => {
  it('then the props pass through and the input is in the tree', () => {
    const { getByTestId } = render(
      wrap(
        <TextInput
          value=""
          onChangeText={jest.fn()}
          multiline
          numberOfLines={3}
          testID="ti-ml"
        />,
      ),
    );
    expect(getByTestId('ti-ml')).toBeTruthy();
  });
});
