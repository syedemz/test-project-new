import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import LoginScreen from '@/screens/LoginScreen';
import RegisterScreen from '@/screens/RegisterScreen';

/**
 * Symbolic route name constants for the pre-authentication stack.
 *
 * Use these instead of raw string literals so that renaming a route requires
 * editing exactly one place and the TypeScript compiler catches all stale
 * references.
 */
export const AUTH_ROUTES = {
  LOGIN: 'Login',
  REGISTER: 'Register',
} as const;

/**
 * Param-list type for the pre-auth native stack.
 *
 * Neither Login nor Register accepts route params in v1.
 */
export type AuthStackParamList = {
  [AUTH_ROUTES.LOGIN]: undefined;
  [AUTH_ROUTES.REGISTER]: undefined;
};

const Stack = createNativeStackNavigator<AuthStackParamList>();

/**
 * Pre-authentication route tree.
 *
 * Renders a native-stack navigator with two screens: Login (initial route) and
 * Register. This component is rendered by AppNavigator when the user is not
 * authenticated. When the auth state transitions to authenticated, AppNavigator
 * unmounts this component entirely — no pre-auth route is reachable from the
 * post-auth stack.
 */
const AuthRoutes: React.FC = () => (
  <Stack.Navigator initialRouteName={AUTH_ROUTES.LOGIN}>
    <Stack.Screen name={AUTH_ROUTES.LOGIN} component={LoginScreen} />
    <Stack.Screen name={AUTH_ROUTES.REGISTER} component={RegisterScreen} />
  </Stack.Navigator>
);

export default AuthRoutes;
