/**
 * Public barrel for the reusable component catalog.
 *
 * Screens import every catalog component from this barrel, never from
 * the individual files. Adding a component means appending one
 * `export { … } from './<Name>';` line below in alphabetical order.
 *
 * See `docs/superpowers/specs/2026-05-17-reusable-components-and-common-styles-design.md` §4
 * for the full catalog and §6 for the API discipline rules.
 */

export { Button } from './Button';
export type { ButtonProps, ButtonVariant } from './Button';
export { Card } from './Card';
export type { CardProps, CardVariant } from './Card';
export { Chip } from './Chip';
export type { ChipProps } from './Chip';
export { ChipRow } from './ChipRow';
export type { ChipRowProps } from './ChipRow';
export { IconButton } from './IconButton';
export type { IconButtonProps, IconButtonTone } from './IconButton';
export { Screen } from './Screen';
export type { ScreenEdge, ScreenProps } from './Screen';
export { TextInput } from './TextInput';
export type { TextInputKeyboardType, TextInputProps } from './TextInput';
export { TouchableArea } from './TouchableArea';
export type { TouchableAreaProps } from './TouchableArea';
