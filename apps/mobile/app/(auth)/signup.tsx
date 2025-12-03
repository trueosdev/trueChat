import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { Link, router } from 'expo-router';
import { useAuth } from '@/lib/auth/auth-provider';
import { StatusBar } from 'expo-status-bar';
import { Colors, Spacing, Layout, BorderRadius, FontSize, FontWeight } from '@/styles';

export default function SignupScreen() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { signUp } = useAuth();

  const handleSignup = async () => {
    if (!username || !email || !password || !confirmPassword) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    const { error } = await signUp(email, password, username);
    setLoading(false);

    if (error) {
      Alert.alert('Error', error.message);
    } else {
      Alert.alert(
        'Success',
        'Account created! Please check your email to verify your account.',
        [{ text: 'OK', onPress: () => router.replace('/(auth)/login') }]
      );
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <StatusBar style="light" />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.content}>
          {/* Logo/Header */}
          <View style={styles.header}>
            <View style={styles.logoContainer}>
              <Text style={styles.logoText}>T</Text>
            </View>
            <Text style={styles.title}>TrueChat</Text>
            <Text style={styles.subtitle}>Create your account</Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Username</Text>
              <TextInput
                style={styles.input}
                placeholder="Choose a username"
                placeholderTextColor={Colors.secondary}
                value={username}
                onChangeText={setUsername}
                autoCapitalize="none"
                autoComplete="username"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter your email"
                placeholderTextColor={Colors.secondary}
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                autoComplete="email"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Password</Text>
              <TextInput
                style={styles.input}
                placeholder="Create a password"
                placeholderTextColor={Colors.secondary}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                autoComplete="password-new"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Confirm Password</Text>
              <TextInput
                style={styles.input}
                placeholder="Confirm your password"
                placeholderTextColor={Colors.secondary}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
                autoComplete="password-new"
              />
            </View>

            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handleSignup}
              disabled={loading}
              activeOpacity={0.8}
            >
              {loading ? (
                <ActivityIndicator color={Colors.background} />
              ) : (
                <Text style={styles.buttonText}>Create Account</Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>Already have an account? </Text>
            <Link href="/(auth)/login" asChild>
              <TouchableOpacity>
                <Text style={styles.linkText}>Sign In</Text>
              </TouchableOpacity>
            </Link>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: Layout.screenPadding,
    paddingVertical: Spacing.huge,
  },
  header: {
    alignItems: 'center',
    marginBottom: Spacing.xxxl,
  },
  logoContainer: {
    width: 80,
    height: 80,
    backgroundColor: Colors.background,
    borderWidth: 2,
    borderColor: Colors.primary,
    borderRadius: BorderRadius.small,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
  },
  logoText: {
    fontSize: 40,
    fontWeight: FontWeight.semibold,
    color: Colors.primary,
  },
  title: {
    fontSize: FontSize.display,
    fontWeight: FontWeight.semibold,
    color: Colors.textPrimary,
  },
  subtitle: {
    color: Colors.textSecondary,
    marginTop: Spacing.sm,
    fontSize: FontSize.normal,
  },
  form: {
    gap: Spacing.lg,
  },
  inputGroup: {
    marginBottom: Spacing.lg,
  },
  label: {
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
    fontSize: FontSize.small,
  },
  input: {
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.small,
    paddingHorizontal: Layout.inputPadding,
    paddingVertical: 14,
    color: Colors.textPrimary,
    fontSize: FontSize.normal,
  },
  button: {
    backgroundColor: Colors.primary,
    paddingVertical: 14,
    borderRadius: BorderRadius.small,
    alignItems: 'center',
    marginTop: Spacing.sm,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: Colors.background,
    fontWeight: FontWeight.medium,
    fontSize: FontSize.normal,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: Spacing.xxxl,
  },
  footerText: {
    color: Colors.textSecondary,
    fontSize: FontSize.normal,
  },
  linkText: {
    color: Colors.primary,
    fontWeight: FontWeight.medium,
    fontSize: FontSize.normal,
  },
});
