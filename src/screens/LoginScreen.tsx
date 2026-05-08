import React, { useCallback, useMemo } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import labels from '@/labels/labels.json';
import { useTheme } from '@/theme/ThemeProvider';
import { textStyles } from '@/theme/typography';
import type { Theme } from '@/theme/theme';
import { AUTH_ROUTES } from '@/navigation/AuthRoutes';
import type { AuthStackParamList } from '@/navigation/AuthRoutes';

// ---------------------------------------------------------------------------
// StyleSheet factory
// ---------------------------------------------------------------------------

/**
 * Creates the screen's StyleSheet from the active theme.
 *
 * This factory is the sole place where theme tokens are translated into
 * concrete React Native style values. No inline style objects appear in JSX.
 *
 * @param theme - The current Theme object from `useTheme()`.
 * @returns A StyleSheet object for `LoginScreen`.
 */
function createStyles(theme: Theme) {
  return StyleSheet.create({
    keyboardAvoid: {
      flex: 1,
      backgroundColor: theme.colors.bg.primary,
    },
    scrollContent: {
      flexGrow: 1,
      paddingHorizontal: theme.spacing.xl,
      paddingTop: theme.spacing.xxxl,
      paddingBottom: theme.spacing.giant,
    },
    screenTitle: {
      ...textStyles.display.md,
      color: theme.colors.text.primary,
      marginBottom: theme.spacing.xxxl,
    },
    fieldContainer: {
      marginBottom: theme.spacing.xl,
    },
    label: {
      ...textStyles.label.md,
      color: theme.colors.text.secondary,
      marginBottom: theme.spacing.xs,
    },
    input: {
      ...textStyles.body.md,
      backgroundColor: theme.colors.bg.input,
      color: theme.colors.text.primary,
      borderWidth: 1,
      borderColor: theme.colors.border.default,
      borderRadius: theme.radii.md,
      paddingHorizontal: theme.spacing.lg,
      paddingVertical: theme.spacing.md,
    },
    submitButton: {
      backgroundColor: theme.colors.accent.primary,
      borderRadius: theme.radii.md,
      paddingVertical: theme.spacing.md,
      alignItems: 'center',
      marginTop: theme.spacing.xl,
    },
    submitButtonText: {
      ...textStyles.label.md,
      color: theme.colors.text.inverse,
    },
    registerLink: {
      marginTop: theme.spacing.lg,
      alignItems: 'center',
    },
    registerLinkText: {
      ...textStyles.body.md,
      color: theme.colors.accent.primary,
    },
  });
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * Login form screen.
 *
 * Renders two fields (username and password) with per-field label and
 * placeholder sourced from labels.json. A login button is rendered below
 * the fields. A Register link navigates to the Register screen.
 *
 * Submit handling, credential lookup, auth-state transitions, and inline
 * error rendering are implemented in stories 5.2 and 5.3.
 */
const LoginScreen: React.FC = () => {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const navigation = useNavigation<NativeStackNavigationProp<AuthStackParamList>>();

  const handleNavigateToRegister = useCallback(() => {
    navigation.navigate(AUTH_ROUTES.REGISTER);
  }, [navigation]);

  return (
    <KeyboardAvoidingView
      testID="login-screen"
      style={styles.keyboardAvoid}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Text testID="login-screen-title" style={styles.screenTitle}>
          {labels.login_screen_title.en}
        </Text>

        {/* Username field */}
        <View style={styles.fieldContainer}>
          <Text style={styles.label}>{labels.login_username_label.en}</Text>
          <TextInput
            testID="login-username-input"
            style={styles.input}
            placeholder={labels.login_username_placeholder.en}
            placeholderTextColor={theme.colors.text.tertiary}
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>

        {/* Password field */}
        <View style={styles.fieldContainer}>
          <Text style={styles.label}>{labels.login_password_label.en}</Text>
          <TextInput
            testID="login-password-input"
            style={styles.input}
            placeholder={labels.login_password_placeholder.en}
            placeholderTextColor={theme.colors.text.tertiary}
            secureTextEntry={true}
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>

        {/* Login button */}
        <TouchableOpacity
          testID="login-submit-button"
          style={styles.submitButton}
          activeOpacity={0.8}
        >
          <Text style={styles.submitButtonText}>{labels.login_button.en}</Text>
        </TouchableOpacity>

        {/* Register link */}
        <TouchableOpacity
          testID="login-register-link"
          style={styles.registerLink}
          onPress={handleNavigateToRegister}
          activeOpacity={0.7}
        >
          <Text style={styles.registerLinkText}>{labels.login_link_to_register.en}</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default LoginScreen;
