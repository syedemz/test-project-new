import React, { useCallback, useMemo, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import labels from '@/labels/labels.json';
import { useTheme } from '@/theme/ThemeProvider';
import { textStyles } from '@/theme/typography';
import {
  validateConfirmPassword,
  validateEmail,
  validatePassword,
  validateUsername,
} from '@/Helper/validationHelper';
import type { Theme } from '@/theme/theme';

// ---------------------------------------------------------------------------
// Error-mapping helpers
// ---------------------------------------------------------------------------

/**
 * Maps a username validation reason to the corresponding label-key copy.
 *
 * All `username_*` reasons from `validateUsername` map to the same label key.
 *
 * @param reason - The `reason` field from a failed `ValidationResult`.
 * @returns The English copy for the inline error.
 */
function usernameErrorText(reason: string): string {
  // Any username_* reason -> register_validation_username_invalid
  if (reason.startsWith('username_')) {
    return labels.register_validation_username_invalid.en;
  }
  return labels.register_validation_username_invalid.en;
}

/**
 * Maps an email validation reason to the corresponding label-key copy.
 *
 * All `email_*` reasons from `validateEmail` map to the same label key.
 *
 * @param reason - The `reason` field from a failed `ValidationResult`.
 * @returns The English copy for the inline error.
 */
function emailErrorText(reason: string): string {
  if (reason.startsWith('email_')) {
    return labels.register_validation_email_invalid.en;
  }
  return labels.register_validation_email_invalid.en;
}

/**
 * Maps a password validation reason to the corresponding label-key copy.
 *
 * All password_required, password_too_short, password_too_long,
 * password_no_letter, and password_no_digit reasons map to the weak-password key.
 *
 * @param reason - The reason field from a failed ValidationResult.
 * @returns The English copy for the inline error.
 */
function passwordErrorText(reason: string): string {
  if (reason.startsWith('password_')) {
    return labels.register_validation_password_weak.en;
  }
  return labels.register_validation_password_weak.en;
}

/**
 * Maps the `password_mismatch` reason to the mismatch label-key copy.
 *
 * @returns The English copy for the mismatch inline error.
 */
function confirmPasswordErrorText(): string {
  return labels.register_validation_password_mismatch.en;
}

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
 * @returns A StyleSheet object for `RegisterScreen`.
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
    inputError: {
      borderColor: theme.colors.status.error,
    },
    errorText: {
      ...textStyles.caption,
      color: theme.colors.status.error,
      marginTop: theme.spacing.xs,
    },
  });
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * Registration form screen.
 *
 * Renders four fields (email, username, password, confirmPassword) with
 * per-field label, placeholder, and inline error text. Validation fires on
 * blur for all fields; confirmPassword mismatch also fires on blur (and will
 * fire again on submit in story 4.2). No submit wiring in this story.
 */
const RegisterScreen: React.FC = () => {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [emailError, setEmailError] = useState<string | null>(null);
  const [usernameError, setUsernameError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [confirmPasswordError, setConfirmPasswordError] = useState<string | null>(null);

  const handleEmailBlur = useCallback(() => {
    const result = validateEmail(email);
    setEmailError(result.ok ? null : emailErrorText(result.reason));
  }, [email]);

  const handleUsernameBlur = useCallback(() => {
    const result = validateUsername(username);
    setUsernameError(result.ok ? null : usernameErrorText(result.reason));
  }, [username]);

  const handlePasswordBlur = useCallback(() => {
    const result = validatePassword(password);
    setPasswordError(result.ok ? null : passwordErrorText(result.reason));
  }, [password]);

  // confirmPassword mismatch fires on blur AND on submit (story 4.2),
  // but NOT on every keystroke — architecture.md is explicit about this.
  const handleConfirmPasswordBlur = useCallback(() => {
    const result = validateConfirmPassword(password, confirmPassword);
    setConfirmPasswordError(result.ok ? null : confirmPasswordErrorText());
  }, [password, confirmPassword]);

  return (
    <KeyboardAvoidingView
      testID="register-screen"
      style={styles.keyboardAvoid}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.screenTitle}>{labels.register_screen_title.en}</Text>

        {/* Email field */}
        <View style={styles.fieldContainer}>
          <Text style={styles.label}>{labels.register_email_label.en}</Text>
          <TextInput
            testID="register-email-input"
            style={[styles.input, emailError !== null && styles.inputError]}
            value={email}
            onChangeText={setEmail}
            onBlur={handleEmailBlur}
            placeholder={labels.register_email_placeholder.en}
            placeholderTextColor={theme.colors.text.tertiary}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />
          {emailError !== null && (
            <Text testID="register-email-error" style={styles.errorText}>
              {emailError}
            </Text>
          )}
        </View>

        {/* Username field */}
        <View style={styles.fieldContainer}>
          <Text style={styles.label}>{labels.register_username_label.en}</Text>
          <TextInput
            testID="register-username-input"
            style={[styles.input, usernameError !== null && styles.inputError]}
            value={username}
            onChangeText={setUsername}
            onBlur={handleUsernameBlur}
            placeholder={labels.register_username_placeholder.en}
            placeholderTextColor={theme.colors.text.tertiary}
            autoCapitalize="none"
            autoCorrect={false}
          />
          {usernameError !== null && (
            <Text testID="register-username-error" style={styles.errorText}>
              {usernameError}
            </Text>
          )}
        </View>

        {/* Password field */}
        <View style={styles.fieldContainer}>
          <Text style={styles.label}>{labels.register_password_label.en}</Text>
          <TextInput
            testID="register-password-input"
            style={[styles.input, passwordError !== null && styles.inputError]}
            value={password}
            onChangeText={setPassword}
            onBlur={handlePasswordBlur}
            placeholder={labels.register_password_placeholder.en}
            placeholderTextColor={theme.colors.text.tertiary}
            secureTextEntry={true}
            autoCapitalize="none"
            autoCorrect={false}
          />
          {passwordError !== null && (
            <Text testID="register-password-error" style={styles.errorText}>
              {passwordError}
            </Text>
          )}
        </View>

        {/* Confirm password field */}
        <View style={styles.fieldContainer}>
          <Text style={styles.label}>{labels.register_confirm_password_label.en}</Text>
          <TextInput
            testID="register-confirm-password-input"
            style={[styles.input, confirmPasswordError !== null && styles.inputError]}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            onBlur={handleConfirmPasswordBlur}
            placeholder={labels.register_confirm_password_placeholder.en}
            placeholderTextColor={theme.colors.text.tertiary}
            secureTextEntry={true}
            autoCapitalize="none"
            autoCorrect={false}
          />
          {confirmPasswordError !== null && (
            <Text testID="register-confirm-password-error" style={styles.errorText}>
              {confirmPasswordError}
            </Text>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default RegisterScreen;
