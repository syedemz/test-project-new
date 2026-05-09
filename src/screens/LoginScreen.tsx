import React, { useCallback, useMemo, useState } from 'react';
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
import { useAuth } from '@/auth/AuthContext';
import { lookupCredential } from '@/Helper/credentialHelper';

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
      color: theme.colors.text.primary,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border.default,
      paddingVertical: theme.spacing.md,
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
    inlineError: {
      ...textStyles.caption,
      color: theme.colors.status.error,
      marginTop: theme.spacing.sm,
      textAlign: 'center',
    },
    storageErrorText: {
      ...textStyles.caption,
      color: theme.colors.status.error,
      marginTop: theme.spacing.sm,
      textAlign: 'center',
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
 * Submit flow (story 5.2):
 *   - Calls lookupCredential with the trimmed username and exact password.
 *   - On ok:true: calls signIn(); auth gate swaps to the post-auth stack.
 *   - On ok:false: sets credentialErrorVisible to show the inline error.
 *   - On storage rejection: sets storageErrorVisible; signIn is NOT called.
 *
 * Error surfaces (story 5.3):
 *   - Credential error: generic <Text testID="login-inline-error"> rendered
 *     directly below the login button. Cleared when either field changes.
 *   - Storage error: separate <Text testID="login-storage-error"> below the
 *     credential error element. Independent state; does not auto-clear.
 */
const LoginScreen: React.FC = () => {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const navigation = useNavigation<NativeStackNavigationProp<AuthStackParamList>>();
  const { signIn } = useAuth();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  // True when a credential lookup returns { ok: false } (unknown user or wrong password).
  const [credentialErrorVisible, setCredentialErrorVisible] = useState<boolean>(false);

  // True when a storage read fails during login (AsyncStorage rejection).
  const [storageErrorVisible, setStorageErrorVisible] = useState<boolean>(false);

  const handleNavigateToRegister = useCallback(() => {
    navigation.navigate(AUTH_ROUTES.REGISTER);
  }, [navigation]);

  /**
   * Wraps `setUsername` so that any change to the username field automatically
   * clears the credential error. Auto-clear covers both inputs per AC #4.
   */
  const handleUsernameChange = useCallback(
    (text: string) => {
      if (credentialErrorVisible) {
        setCredentialErrorVisible(false);
      }
      setUsername(text);
    },
    [credentialErrorVisible],
  );

  /**
   * Wraps `setPassword` so that any change to the password field automatically
   * clears the credential error. Auto-clear covers both inputs per AC #4.
   */
  const handlePasswordChange = useCallback(
    (text: string) => {
      if (credentialErrorVisible) {
        setCredentialErrorVisible(false);
      }
      setPassword(text);
    },
    [credentialErrorVisible],
  );

  const isSubmitDisabled = username.trim() === '' || password === '';

  const handleSubmit = useCallback(async () => {
    const trimmedUsername = username.trim();

    let result: Awaited<ReturnType<typeof lookupCredential>>;
    try {
      result = await lookupCredential(trimmedUsername, password);
    } catch {
      // Storage failure — clear any prior credential error, surface storage error.
      setCredentialErrorVisible(false);
      setStorageErrorVisible(true);
      return;
    }

    if (result.ok) {
      setCredentialErrorVisible(false);
      signIn();
    } else {
      // Credential failure (unknown user or wrong password) — show generic error.
      setStorageErrorVisible(false);
      setCredentialErrorVisible(true);
    }
  }, [username, password, signIn]);

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
            value={username}
            onChangeText={handleUsernameChange}
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
            value={password}
            onChangeText={handlePasswordChange}
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
          style={[styles.submitButton, isSubmitDisabled && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={isSubmitDisabled}
          activeOpacity={isSubmitDisabled ? 1 : 0.8}
        >
          <Text style={styles.submitButtonText}>{labels.login_button.en}</Text>
        </TouchableOpacity>

        {/* Credential error — rendered below the button on { ok: false } */}
        {credentialErrorVisible && (
          <Text testID="login-inline-error" style={styles.inlineError}>
            {labels.login_invalid_credentials.en}
          </Text>
        )}

        {/* Storage error — rendered when AsyncStorage read rejects */}
        {storageErrorVisible && (
          <Text testID="login-storage-error" style={styles.storageErrorText}>
            {labels.login_storage_error.en}
          </Text>
        )}

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
