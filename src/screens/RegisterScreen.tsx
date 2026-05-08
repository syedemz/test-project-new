import React from 'react';
import { View, Text } from 'react-native';
import labels from '@/labels/labels.json';

const RegisterScreen: React.FC = () => (
  <View testID="register-screen-stub">
    <Text>{labels.register_screen_title.en}</Text>
  </View>
);

export default RegisterScreen;
