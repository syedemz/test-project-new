import React, { createContext, useContext, useState, useMemo } from 'react';
import { useColorScheme } from 'react-native';
import { lightTheme, darkTheme, Theme } from './theme';

type ThemeContextValue = {
  theme: Theme;
  toggleTheme: () => void;
  setMode: (mode: 'light' | 'dark' | 'system') => void;
};

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

/**
 * Provides the active theme to the React tree.
 *
 * By default the theme tracks the device's system color scheme. Use
 * `useThemeControls` to override it programmatically.
 *
 * @param children - The React tree that will have access to the theme.
 */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useColorScheme();
  const [override, setOverride] = useState<'light' | 'dark' | 'system'>('system');
  const mode = override === 'system' ? (systemScheme ?? 'light') : override;
  const theme = mode === 'dark' ? darkTheme : lightTheme;

  const value = useMemo(
    () => ({
      theme,
      toggleTheme: () => setOverride(theme.mode === 'dark' ? 'light' : 'dark'),
      setMode: setOverride,
    }),
    [theme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

/**
 * Returns the active Theme object.
 *
 * @returns The current theme (light or dark).
 * @throws When called outside of a ThemeProvider.
 */
export function useTheme(): Theme {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx.theme;
}

/**
 * Returns the controls for toggling or setting the active theme mode.
 *
 * @returns An object with `toggleTheme` and `setMode` functions.
 * @throws When called outside of a ThemeProvider.
 */
export function useThemeControls() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useThemeControls must be used within ThemeProvider');
  return { toggleTheme: ctx.toggleTheme, setMode: ctx.setMode };
}
