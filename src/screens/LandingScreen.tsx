import React from 'react';
import { View, Text } from 'react-native';
import labels from '@/labels/labels.json';

const LandingScreen: React.FC = () => (
  <View testID="landing-screen-stub">
    <Text>{labels.landing_screen_title.en}</Text>
  </View>
);

export default LandingScreen;
