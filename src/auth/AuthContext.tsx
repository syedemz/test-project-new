/**
 * In-memory authentication context for v1.
 *
 * Provides the {@link AuthContextValue} to the component tree via
 * {@link AuthProvider}. Consumers access the value through the
 * {@link useAuth} hook; the underlying context object is intentionally
 * module-private so callers cannot bypass the missing-provider guard.
 *
 * No session persistence — state is reset on app restart. This is an
 * explicit v1 design decision recorded in architecture.md.
 */

import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/**
 * The value shape exposed to consumers of the auth context.
 */
export interface AuthContextValue {
  /** Whether the user is currently authenticated. */
  readonly isAuthenticated: boolean;
  /** Transition to the authenticated state. */
  signIn: () => void;
  /** Transition back to the unauthenticated state. */
  signOut: () => void;
}

// ---------------------------------------------------------------------------
// Context (module-private — consumers must use useAuth)
// ---------------------------------------------------------------------------

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

/**
 * Wraps the component subtree with the in-memory auth state.
 *
 * Place `<AuthProvider>` at the root of the app (story 3.5 wires it into
 * `App.tsx`). All descendants may call {@link useAuth} to read or mutate
 * auth state.
 *
 * @param props - Standard React children prop.
 */
export function AuthProvider({
  children,
}: {
  readonly children: React.ReactNode;
}): React.JSX.Element {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);

  // useCallback keeps the function references stable across renders where
  // isAuthenticated does not change, preventing unnecessary consumer re-renders.
  const signIn = useCallback((): void => {
    setIsAuthenticated(true);
  }, []);

  const signOut = useCallback((): void => {
    setIsAuthenticated(false);
  }, []);

  // useMemo keeps the context value reference stable; only a new object is
  // produced when isAuthenticated actually changes.
  const value = useMemo<AuthContextValue>(
    () => ({ isAuthenticated, signIn, signOut }),
    [isAuthenticated, signIn, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

/**
 * Returns the current auth context value.
 *
 * Must be called inside a component that is a descendant of
 * {@link AuthProvider}. Throws otherwise — this is a deliberate guard
 * against wiring mistakes caught at development time, not silently
 * returning a null/undefined value.
 *
 * @returns The {@link AuthContextValue} for the nearest {@link AuthProvider}.
 * @throws When called outside an {@link AuthProvider} — throws `Error`.
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { isAuthenticated, signIn, signOut } = useAuth();
 *   // ...
 * }
 * ```
 */
export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
