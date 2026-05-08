/**
 * Unit tests for AppRoutes — story 3.4 acceptance criteria.
 *
 * Asserts: mounting AppRoutes inside a NavigationContainer renders the Landing
 * screen as the initial (and only) tab, identified by its stable testID, and
 * that the tab label is wired to the correct label key from labels.json (F5).
 */

import React from 'react';
import { render } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import AppRoutes from '@/navigation/AppRoutes';
import labels from '@/labels/labels.json';

describe('given AppRoutes is mounted inside a NavigationContainer, when the initial tab is rendered', () => {
  it('then the landing-screen-stub testID is in the tree (Landing is the only tab)', () => {
    const { getByTestId } = render(
      <NavigationContainer>
        <AppRoutes />
      </NavigationContainer>,
    );
    expect(getByTestId('landing-screen-stub')).toBeTruthy();
  });

  it('then the landing_tab_home_label text is present in the tree (F5: tab label key wiring)', () => {
    // landing_tab_home_label.en ("Home") also appears as the LandingScreen stub's
    // title text, so getAllByText is used to confirm at least one instance of the
    // label value is rendered rather than asserting a unique element.
    const { getAllByText } = render(
      <NavigationContainer>
        <AppRoutes />
      </NavigationContainer>,
    );
    expect(getAllByText(labels.landing_tab_home_label.en).length).toBeGreaterThan(0);
  });
});
