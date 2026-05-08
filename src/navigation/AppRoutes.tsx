import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import LandingScreen from '@/screens/LandingScreen';
import labels from '@/labels/labels.json';

/**
 * Symbolic route name constants for the post-authentication tab navigator.
 *
 * Use these instead of raw string literals so that renaming a route requires
 * editing exactly one place and the TypeScript compiler catches all stale
 * references.
 */
export const APP_ROUTES = {
  LANDING: 'Landing',
} as const;

/**
 * Param-list type for the post-auth bottom tab navigator.
 *
 * The Landing tab accepts no route params in v1.
 */
export type AppTabParamList = {
  [APP_ROUTES.LANDING]: undefined;
};

const Tab = createBottomTabNavigator<AppTabParamList>();

/**
 * Post-authentication route tree.
 *
 * Renders a bottom-tab navigator with a single tab: Landing (labelled via the
 * `landing_tab_home_label` label key). The tab bar is intentionally visible in
 * v1 — the structure is in place for additional tabs in later phases, and
 * showing the bar with one tab is confirmed by phase 6's manual E2E run.
 *
 * This component is rendered by AppNavigator when the user is authenticated.
 * When the auth state transitions to unauthenticated, AppNavigator unmounts
 * this component entirely — no post-auth route is reachable from the pre-auth
 * stack.
 */
const AppRoutes: React.FC = () => (
  <Tab.Navigator>
    <Tab.Screen
      name={APP_ROUTES.LANDING}
      component={LandingScreen}
      options={{ tabBarLabel: labels.landing_tab_home_label.en }}
    />
  </Tab.Navigator>
);

export default AppRoutes;
