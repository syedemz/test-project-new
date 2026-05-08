import React from 'react';
import { View, Text } from 'react-native';
import labels from '@/labels/labels.json';

const LoginScreen: React.FC = () => (
  <View testID="login-screen-stub">
    <Text>{labels.login_screen_title.en}</Text>
  </View>
);

export default LoginScreen;
