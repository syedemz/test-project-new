import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { useAuth } from '@/auth/AuthContext';
import AuthRoutes from '@/navigation/AuthRoutes';
import AppRoutes from '@/navigation/AppRoutes';

/**
 * Root navigator for the application.
 *
 * Reads {@link AuthContextValue.isAuthenticated} from {@link useAuth} and
 * performs a top-level conditional branch:
 *
 * - **unauthenticated** (`false`) → mounts {@link AuthRoutes} (pre-auth stack).
 * - **authenticated** (`true`) → mounts {@link AppRoutes} (post-auth tab navigator).
 *
 * The inactive stack is fully unmounted — not hidden — so that no route from
 * one auth state is reachable from the other. This is the auth-gate guarantee
 * described in architecture.md.
 *
 * Wraps its output in a single {@link NavigationContainer}. Consumers render
 * only `<AuthProvider><AppNavigator /></AuthProvider>`.
 *
 * @returns The root navigation tree gated on the current auth state.
 */
export default function AppNavigator(): React.JSX.Element {
  const { isAuthenticated } = useAuth();

  return (
    <NavigationContainer>{isAuthenticated ? <AppRoutes /> : <AuthRoutes />}</NavigationContainer>
  );
}
