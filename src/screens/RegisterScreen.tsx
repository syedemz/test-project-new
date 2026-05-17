/* eslint-disable no-restricted-imports -- legacy screen grandfathered before the component catalog (spec 2026-05-17). Remove when this screen is refactored to use @/components. */
import React, { useCallback, useMemo, useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
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
import {
  validateConfirmPassword,
  validateEmail,
  validatePassword,
  validateUsername,
} from '@/Helper/validationHelper';
import { readUsers, writeUsers } from '@/Helper/storageHelper';
import type { StoredUser } from '@/Helper/storageHelper';
import { SEED_CREDENTIAL } from '@/Helper/seedCredentials';
import type { Theme } from '@/theme/theme';
import { AUTH_ROUTES } from '@/navigation/AuthRoutes';
import type { AuthStackParamList } from '@/navigation/AuthRoutes';

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
      color: theme.colors.text.primary,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border.default,
      paddingVertical: theme.spacing.md,
    },
    inputError: {
      borderBottomColor: theme.colors.status.error,
    },
    errorText: {
      ...textStyles.caption,
      color: theme.colors.status.error,
      marginTop: theme.spacing.xs,
    },
    submitButton: {
      backgroundColor: theme.colors.accent.primary,
      borderRadius: theme.radii.pill,
      paddingVertical: theme.spacing.md,
      alignItems: 'center',
      marginTop: theme.spacing.xl,
    },
    submitButtonDisabled: {
      backgroundColor: theme.colors.accent.primaryDisabled,
    },
    submitButtonText: {
      ...textStyles.label.md,
      color: theme.colors.text.inverse,
    },
    storageErrorText: {
      ...textStyles.caption,
      color: theme.colors.status.error,
      marginTop: theme.spacing.sm,
      textAlign: 'center',
    },
    // -----------------------------------------------------------------------
    // Success modal styles
    // -----------------------------------------------------------------------
    modalOverlay: {
      flex: 1,
      backgroundColor: theme.colors.overlay,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: theme.spacing.xl,
    },
    modalCard: {
      backgroundColor: theme.colors.bg.surface,
      borderRadius: theme.radii.lg,
      paddingHorizontal: theme.spacing.xxl,
      paddingTop: theme.spacing.xxl,
      paddingBottom: theme.spacing.xl,
      width: '100%',
      ...theme.shadows.md,
    },
    modalTitle: {
      ...textStyles.heading.xl,
      color: theme.colors.text.primary,
      marginBottom: theme.spacing.sm,
    },
    modalBody: {
      ...textStyles.body.md,
      color: theme.colors.text.secondary,
      marginBottom: theme.spacing.xxxl,
    },
    modalOkButton: {
      backgroundColor: theme.colors.accent.primary,
      borderRadius: theme.radii.pill,
      paddingVertical: theme.spacing.md,
      alignItems: 'center',
    },
    modalOkButtonText: {
      ...textStyles.label.md,
      color: theme.colors.text.inverse,
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
 * blur for each field; the submit handler runs the full validation suite,
 * enforces username and email uniqueness against registered users and the
 * seed credential, and persists a new `StoredUser` record via `writeUsers`.
 *
 * State transitions:
 * - `success` flips to `true` after a successful `writeUsers` call, causing
 *   the registration success modal to render. The modal is the only way for
 *   the user to navigate to Login after a successful registration.
 * - `storageError` holds the storage-failure copy (from `register_storage_error`)
 *   when `writeUsers` rejects. The form remains editable on failure.
 */
const RegisterScreen: React.FC = () => {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const navigation = useNavigation<NativeStackNavigationProp<AuthStackParamList>>();

  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [emailError, setEmailError] = useState<string | null>(null);
  const [usernameError, setUsernameError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [confirmPasswordError, setConfirmPasswordError] = useState<string | null>(null);
  const [storageError, setStorageError] = useState<string | null>(null);

  // Flips to true after a successful writeUsers call. Drives modal visibility.
  const [success, setSuccess] = useState(false);

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

  // confirmPassword mismatch fires on blur AND on submit,
  // but NOT on every keystroke — architecture.md is explicit about this.
  const handleConfirmPasswordBlur = useCallback(() => {
    const result = validateConfirmPassword(password, confirmPassword);
    setConfirmPasswordError(result.ok ? null : confirmPasswordErrorText());
  }, [password, confirmPassword]);

  const isSubmitDisabled =
    email.trim() === '' || username.trim() === '' || password === '' || confirmPassword === '';

  const handleSubmit = useCallback(async () => {
    // Run the full validation suite across all four fields.
    const emailResult = validateEmail(email);
    const usernameResult = validateUsername(username);
    const passwordResult = validatePassword(password);
    const confirmResult = validateConfirmPassword(password, confirmPassword);

    const newEmailError = emailResult.ok ? null : emailErrorText(emailResult.reason);
    const newPasswordError = passwordResult.ok ? null : passwordErrorText(passwordResult.reason);
    const newConfirmError = confirmResult.ok ? null : confirmPasswordErrorText();

    // Username field can also surface a uniqueness error; compute format error first.
    const formatUsernameError = usernameResult.ok ? null : usernameErrorText(usernameResult.reason);

    setEmailError(newEmailError);
    setPasswordError(newPasswordError);
    setConfirmPasswordError(newConfirmError);
    // Username error may be overwritten below once uniqueness is checked.
    setUsernameError(formatUsernameError);

    const hasFormatErrors =
      newEmailError !== null ||
      formatUsernameError !== null ||
      newPasswordError !== null ||
      newConfirmError !== null;

    if (hasFormatErrors) {
      return;
    }

    // Read existing users to enforce uniqueness.
    let existingUsers: StoredUser[];
    try {
      existingUsers = await readUsers();
    } catch {
      setStorageError(labels.register_storage_error.en);
      return;
    }

    const trimmedUsername = username.trim();
    const lowercasedUsername = trimmedUsername.toLowerCase();
    const lowercasedEmail = email.trim().toLowerCase();

    // Enforce username uniqueness: registered list + seed.
    const usernameInUse =
      existingUsers.some((u) => u.username.toLowerCase() === lowercasedUsername) ||
      SEED_CREDENTIAL.username.toLowerCase() === lowercasedUsername;

    if (usernameInUse) {
      setUsernameError(labels.register_validation_username_in_use.en);
      return;
    }

    // Enforce email uniqueness: registered list only.
    const emailInUse = existingUsers.some((u) => u.email === lowercasedEmail);

    if (emailInUse) {
      setEmailError(labels.register_validation_email_in_use.en);
      return;
    }

    // All checks pass — build the record and persist.
    const newRecord: StoredUser = {
      username: trimmedUsername,
      email: lowercasedEmail,
      password,
      createdAt: new Date().toISOString(),
    };

    try {
      await writeUsers([...existingUsers, newRecord]);
    } catch {
      setStorageError(labels.register_storage_error.en);
      return;
    }

    // All writes succeeded: clear any stale storage error and flip success.
    setStorageError(null);
    setSuccess(true);
  }, [email, username, password, confirmPassword]);

  /**
   * Handles both the OK button tap and the hardware back press while the
   * success modal is open.
   *
   * Dismisses the modal (clears the `success` flag) and navigates to Login
   * in a single synchronous handler so there is no observable flash of the
   * RegisterScreen between the two actions.
   *
   * This is the ONLY dismiss path for the modal. No backdrop-press handler,
   * no auto-timeout, and no other `onDismiss` callback performs navigation.
   */
  const handleSuccess = useCallback(() => {
    setSuccess(false);
    navigation.navigate(AUTH_ROUTES.LOGIN);
  }, [navigation]);

  return (
    <KeyboardAvoidingView
      testID="register-screen"
      style={styles.keyboardAvoid}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/*
       * Registration success modal.
       *
       * visible is driven solely by the `success` state flag. The only two
       * dismiss paths are:
       *   1. OK button (onPress → handleSuccess)
       *   2. Android hardware back press (onRequestClose → handleSuccess)
       *
       * Tap-outside-to-dismiss is NOT wired: there is no Pressable backdrop
       * and no onBackdropPress prop. The modal contents do not intercept
       * touch events that fall outside the card — nothing outside the OK
       * button can close it.
       */}
      <Modal
        testID="register-success-modal"
        visible={success}
        transparent={true}
        animationType="fade"
        onRequestClose={handleSuccess}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text testID="register-success-modal-title" style={styles.modalTitle}>
              {labels.registration_success_title.en}
            </Text>
            <Text testID="register-success-modal-body" style={styles.modalBody}>
              {labels.registration_success_body.en}
            </Text>
            <TouchableOpacity
              testID="register-success-ok-button"
              style={styles.modalOkButton}
              onPress={handleSuccess}
              activeOpacity={0.8}
            >
              <Text style={styles.modalOkButtonText}>{labels.ok_button.en}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Text testID="register-screen-title" style={styles.screenTitle}>
          {labels.register_screen_title.en}
        </Text>

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

        {/* Submit button */}
        <TouchableOpacity
          testID="register-submit-button"
          style={[styles.submitButton, isSubmitDisabled && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={isSubmitDisabled}
          activeOpacity={isSubmitDisabled ? 1 : 0.8}
        >
          <Text style={styles.submitButtonText}>{labels.register_button.en}</Text>
        </TouchableOpacity>

        {/* Storage-failure inline error (non-blocking) */}
        {storageError !== null && (
          <Text testID="register-storage-error" style={styles.storageErrorText}>
            {storageError}
          </Text>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default RegisterScreen;
