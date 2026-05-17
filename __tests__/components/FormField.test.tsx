/**
 * Tests for the FormField catalog component.
 */

import React from 'react';
import { render } from '@testing-library/react-native';
import { FormField, TextInput } from '@/components';
import { ThemeProvider } from '@/theme/ThemeProvider';

const wrap = (node: React.ReactNode) => <ThemeProvider>{node}</ThemeProvider>;

describe('given a FormField with label and no error, when rendered', () => {
  it('then the label text is visible', () => {
    const { getByText } = render(
      wrap(
        <FormField label="Email">
          <TextInput value="" onChangeText={jest.fn()} testID="email-input" />
        </FormField>,
      ),
    );
    expect(getByText('Email')).toBeTruthy();
  });

  it('then the child input is in the tree with its testID intact', () => {
    const { getByTestId } = render(
      wrap(
        <FormField label="Email">
          <TextInput value="" onChangeText={jest.fn()} testID="email-input" />
        </FormField>,
      ),
    );
    expect(getByTestId('email-input')).toBeTruthy();
  });
});

describe('given a FormField with an error, when rendered', () => {
  it('then the error message is visible in the tree', () => {
    const { getByText } = render(
      wrap(
        <FormField label="Email" error="Required">
          <TextInput value="" onChangeText={jest.fn()} />
        </FormField>,
      ),
    );
    expect(getByText('Required')).toBeTruthy();
  });
});
