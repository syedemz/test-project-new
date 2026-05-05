/**
 * Unit tests for src/theme/* — story 2.1 acceptance criteria.
 *
 * Asserts: token values, typography values, and that hooks throw the correct
 * error messages when used outside ThemeProvider.
 */

import React from 'react';
import { lightTheme, darkTheme, spacing, radii } from '@/theme/theme';
import { textStyles } from '@/theme/typography';
import { renderHook, act } from '@testing-library/react-native';
import { useTheme, useThemeControls, ThemeProvider } from '@/theme/ThemeProvider';

// ---------------------------------------------------------------------------
// Token value assertions
// ---------------------------------------------------------------------------

describe('given the light theme, when reading accent.primary', () => {
  it('then it equals #E91E63', () => {
    expect(lightTheme.colors.accent.primary).toBe('#E91E63');
  });
});

describe('given the dark theme, when reading accent.primary', () => {
  it('then it equals #FF4081', () => {
    expect(darkTheme.colors.accent.primary).toBe('#FF4081');
  });
});

describe('given the spacing scale, when reading spacing.lg', () => {
  it('then it equals 16', () => {
    expect(spacing.lg).toBe(16);
  });
});

describe('given the radii scale, when reading radii.pill', () => {
  it('then it equals 999', () => {
    expect(radii.pill).toBe(999);
  });
});

// ---------------------------------------------------------------------------
// Typography assertions
// ---------------------------------------------------------------------------

describe('given the text styles, when reading heading.xl.fontSize', () => {
  it('then it equals 24', () => {
    expect(textStyles.heading.xl.fontSize).toBe(24);
  });
});

describe('given the text styles, when reading heading.xl.fontFamily', () => {
  it('then it equals PlusJakartaSans-Bold', () => {
    expect(textStyles.heading.xl.fontFamily).toBe('PlusJakartaSans-Bold');
  });
});

// ---------------------------------------------------------------------------
// ThemeProvider hook error guards (outside-provider path)
// ---------------------------------------------------------------------------

describe('given useTheme is called outside ThemeProvider, when the hook renders', () => {
  it('then it throws "useTheme must be used within ThemeProvider"', () => {
    expect(() => renderHook(() => useTheme())).toThrow(
      'useTheme must be used within ThemeProvider',
    );
  });
});

describe('given useThemeControls is called outside ThemeProvider, when the hook renders', () => {
  it('then it throws "useThemeControls must be used within ThemeProvider"', () => {
    expect(() => renderHook(() => useThemeControls())).toThrow(
      'useThemeControls must be used within ThemeProvider',
    );
  });
});

// ---------------------------------------------------------------------------
// ThemeProvider — inside-provider paths
// ---------------------------------------------------------------------------

const wrapper = ({ children }: { children: React.ReactNode }) =>
  React.createElement(ThemeProvider, null, children);

describe('given useTheme is called inside ThemeProvider, when the hook renders', () => {
  it('then it returns a theme object with a mode property', () => {
    const { result } = renderHook(() => useTheme(), { wrapper });
    expect(result.current.mode === 'light' || result.current.mode === 'dark').toBe(true);
  });

  it('then it returns lightTheme by default (system defaults to light in JSDOM)', () => {
    const { result } = renderHook(() => useTheme(), { wrapper });
    // JSDOM has no system color-scheme preference, which resolves to "light".
    expect(result.current.colors.accent.primary).toBe('#E91E63');
  });
});

describe('given useThemeControls is called inside ThemeProvider, when toggleTheme is invoked', () => {
  it('then the theme mode flips from light to dark', () => {
    const { result } = renderHook(() => ({ theme: useTheme(), controls: useThemeControls() }), {
      wrapper,
    });
    expect(result.current.theme.mode).toBe('light');

    act(() => {
      result.current.controls.toggleTheme();
    });

    expect(result.current.theme.mode).toBe('dark');
    expect(result.current.theme.colors.accent.primary).toBe('#FF4081');
  });
});

describe('given useThemeControls is called inside ThemeProvider, when setMode is called with "dark"', () => {
  it('then the theme switches to dark mode', () => {
    const { result } = renderHook(() => ({ theme: useTheme(), controls: useThemeControls() }), {
      wrapper,
    });

    act(() => {
      result.current.controls.setMode('dark');
    });

    expect(result.current.theme.mode).toBe('dark');
  });
});

describe('given useThemeControls is called inside ThemeProvider, when setMode is called with "light"', () => {
  it('then the theme switches to light mode', () => {
    const { result } = renderHook(() => ({ theme: useTheme(), controls: useThemeControls() }), {
      wrapper,
    });

    act(() => {
      result.current.controls.setMode('dark');
    });
    act(() => {
      result.current.controls.setMode('light');
    });

    expect(result.current.theme.mode).toBe('light');
  });
});

describe('given useThemeControls is called inside ThemeProvider, when setMode is called with "system"', () => {
  it('then the theme falls back to the system scheme (light in JSDOM)', () => {
    const { result } = renderHook(() => ({ theme: useTheme(), controls: useThemeControls() }), {
      wrapper,
    });

    // Force to dark first, then revert to system
    act(() => {
      result.current.controls.setMode('dark');
    });
    act(() => {
      result.current.controls.setMode('system');
    });

    // JSDOM resolves system to light
    expect(result.current.theme.mode).toBe('light');
  });
});
