import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, Pressable, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Mail, ArrowLeft, Check } from 'lucide-react-native';
import { useTheme } from '@/src/hooks/useTheme';
import { authService } from '@/src/services/authService';
import { COLORS } from '@/src/utils/theme';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const handleResetPassword = async () => {
    if (!email) {
      Alert.alert('Error', 'Please enter your email');
      return;
    }

    setIsLoading(true);
    try {
      await authService.forgotPassword(email);
      setEmailSent(true);
    } catch {
      Alert.alert('Error', 'Failed to send reset email');
    } finally {
      setIsLoading(false);
    }
  };

  if (emailSent) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <LinearGradient
          colors={[COLORS.primary, COLORS.primaryDark]}
          style={styles.header}
        >
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <ArrowLeft size={24} color={COLORS.white} />
          </Pressable>
          <Text style={styles.logo}>Athlead</Text>
        </LinearGradient>

        <View style={styles.content}>
          <View style={styles.successIcon}>
            <Check size={60} color={COLORS.success} />
          </View>
          <Text style={[styles.successTitle, { color: theme.text }]}>
            Email Sent!
          </Text>
          <Text style={[styles.successText, { color: theme.textSecondary }]}>
            We&apos;ve sent password reset instructions to {email}
          </Text>

          <Pressable
            onPress={() => router.back()}
            style={[styles.button, { backgroundColor: COLORS.primary }]}
          >
            <Text style={styles.buttonText}>Back to Login</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <LinearGradient
        colors={[COLORS.primary, COLORS.primaryDark]}
        style={styles.header}
      >
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color={COLORS.white} />
        </Pressable>
        <Text style={styles.logo}>Athlead</Text>
        <Text style={styles.headerTitle}>Forgot Password</Text>
        <Text style={styles.headerSubtitle}>
          Enter your email to reset your password
        </Text>
      </LinearGradient>

      <View style={styles.content}>
        <View style={styles.inputContainer}>
          <Mail size={20} color={theme.textSecondary} style={styles.inputIcon} />
          <TextInput
            style={[styles.input, { color: theme.text, backgroundColor: theme.inputBackground }]}
            placeholder="Email"
            placeholderTextColor={theme.textSecondary}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
          />
        </View>

        <Pressable
          onPress={handleResetPassword}
          disabled={isLoading}
          style={[styles.button, { backgroundColor: COLORS.primary }]}
        >
          <Text style={styles.buttonText}>
            {isLoading ? 'Sending...' : 'Send Reset Link'}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 60,
    paddingBottom: 40,
    paddingHorizontal: 24,
  },
  backButton: {
    marginBottom: 20,
  },
  logo: {
    fontSize: 32,
    fontWeight: 'bold',
    color: COLORS.white,
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.white,
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: COLORS.white,
    opacity: 0.9,
  },
  content: {
    flex: 1,
    padding: 24,
  },
  inputContainer: {
    position: 'relative',
    marginBottom: 24,
  },
  inputIcon: {
    position: 'absolute',
    left: 16,
    top: 18,
    zIndex: 1,
  },
  input: {
    paddingLeft: 48,
    paddingRight: 16,
    paddingVertical: 16,
    borderRadius: 12,
    fontSize: 16,
  },
  button: {
    paddingVertical: 16,
    borderRadius: 30,
    alignItems: 'center',
  },
  buttonText: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: 'bold',
  },
  successIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginBottom: 24,
    marginTop: 40,
  },
  successTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 12,
  },
  successText: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 40,
  },
});
