import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, Pressable, ScrollView, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Mail, Lock, ArrowLeft } from 'lucide-react-native';
import { RoleSelector } from '@/src/components/RoleSelector';
import { UserRole } from '@/src/types/User';
import { useTheme } from '@/src/hooks/useTheme';
import { useAuth } from '@/src/hooks/useAuth';
import { COLORS } from '@/src/utils/theme';

export default function LoginScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const { login, loginWithGoogle } = useAuth();
  const [role, setRole] = useState<UserRole>('player');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setIsLoading(true);
    try {
      await login({ email, password });
      router.replace('/(tabs)');
    } catch {
      Alert.alert('Error', 'Invalid credentials. Try: any email from mock data with any password');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    try {
      await loginWithGoogle();
      router.replace('/(tabs)');
    } catch {
      Alert.alert('Error', 'Google login failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[styles.container, { backgroundColor: theme.background }]}
    >
      <LinearGradient
        colors={[COLORS.primary, COLORS.primaryDark]}
        style={styles.header}
      >
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color={COLORS.white} />
        </Pressable>
        <Text style={styles.logo}>Athlead</Text>
        <Text style={styles.headerTitle}>Welcome Back</Text>
        <Text style={styles.headerSubtitle}>Sign in to continue</Text>
      </LinearGradient>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        <View style={styles.form}>
          <RoleSelector value={role} onChange={setRole} />
          <View style={styles.inputContainer}>
            <Mail size={20} color={theme.textSecondary} style={styles.inputIcon} />
            <TextInput
              style={[styles.input, { color: theme.text, backgroundColor: theme.inputBackground }]}
              placeholder="Correo electrónico / Email"
              placeholderTextColor={theme.textSecondary}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
            />
          </View>

          <View style={styles.inputContainer}>
            <Lock size={20} color={theme.textSecondary} style={styles.inputIcon} />
            <TextInput
              style={[styles.input, { color: theme.text, backgroundColor: theme.inputBackground }]}
              placeholder="Contraseña / Password"
              placeholderTextColor={theme.textSecondary}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoComplete="password"
            />
          </View>

          <Pressable onPress={() => router.push('/forgot-password' as any)}>
            <Text style={[styles.forgotText, { color: COLORS.skyBlue }]}>
              Forgot Password?
            </Text>
          </Pressable>

          <Pressable
            onPress={handleLogin}
            disabled={isLoading}
            style={[styles.loginButton, { backgroundColor: COLORS.primary }]}
          >
            <Text style={styles.loginText}>
              {isLoading ? 'Signing in...' : 'Sign In'}
            </Text>
          </Pressable>

          <View style={styles.divider}>
            <View style={[styles.dividerLine, { backgroundColor: theme.border }]} />
            <Text style={[styles.dividerText, { color: theme.textSecondary }]}>OR</Text>
            <View style={[styles.dividerLine, { backgroundColor: theme.border }]} />
          </View>

          <Pressable
            onPress={handleGoogleLogin}
            disabled={isLoading}
            style={[styles.googleButton, { backgroundColor: theme.card, borderColor: theme.border }]}
          >
            <Text style={[styles.googleText, { color: theme.text }]}>
              Continue with Google
            </Text>
          </Pressable>

          <View style={styles.footer}>
            <Text style={[styles.footerText, { color: theme.textSecondary }]}>
              Don&apos;t have an account?{' '}
            </Text>
            <Pressable onPress={() => router.push('/register')}>
              <Text style={[styles.footerLink, { color: COLORS.skyBlue }]}>
                Sign Up
              </Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
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
  },
  contentContainer: {
    padding: 24,
  },
  form: {
    gap: 16,
  },
  inputContainer: {
    position: 'relative',
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
  forgotText: {
    textAlign: 'right',
    fontSize: 14,
    fontWeight: '600',
  },
  loginButton: {
    paddingVertical: 16,
    borderRadius: 30,
    alignItems: 'center',
    marginTop: 8,
  },
  loginText: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: 'bold',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 8,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    marginHorizontal: 16,
    fontSize: 14,
    fontWeight: '600',
  },
  googleButton: {
    paddingVertical: 16,
    borderRadius: 30,
    alignItems: 'center',
    borderWidth: 2,
  },
  googleText: {
    fontSize: 16,
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
  },
  footerText: {
    fontSize: 14,
  },
  footerLink: {
    fontSize: 14,
    fontWeight: 'bold',
  },
});
