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

export { Chip } from './Chip';
export type { ChipProps } from './Chip';
