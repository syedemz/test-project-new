/**
 * Generic tappable container. For pressable cards, list rows, or any
 * region that should respond to press without being a text Button.
 *
 * No style prop — the caller wraps TouchableArea in a local View for any
 * layout / sizing / spacing. This is A+ Rule 2.
 */

import React from 'react';
import { Pressable, type ViewStyle } from 'react-native';

/** Props for the TouchableArea catalog component. */
export interface TouchableAreaProps {
  onPress: () => void;
  /** REQUIRED — describes the press target to assistive tech. */
  accessibilityLabel: string;
  disabled?: boolean;
  children: React.ReactNode;
  testID?: string;
}

const PRESSED_OPACITY = 0.85;
const DISABLED_OPACITY = 0.4;

/** Generic tappable container. Caller wraps in a View for any layout. */
export const TouchableArea: React.FC<TouchableAreaProps> = ({
  onPress,
  accessibilityLabel,
  disabled = false,
  children,
  testID,
}) => {
  const containerStyle = ({ pressed }: { pressed: boolean }): ViewStyle => ({
    opacity: disabled ? DISABLED_OPACITY : pressed ? PRESSED_OPACITY : 1,
  });

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled }}
      testID={testID}
      style={containerStyle}
    >
      {children}
    </Pressable>
  );
};
