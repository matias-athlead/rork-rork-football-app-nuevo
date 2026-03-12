import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, Pressable, ScrollView, KeyboardAvoidingView, Platform, Alert, Modal, FlatList } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Mail, Lock, User, ArrowLeft, ChevronDown } from 'lucide-react-native';
import * as AppleAuthentication from 'expo-apple-authentication';
import { useTheme } from '@/src/hooks/useTheme';
import { useAuth } from '@/src/hooks/useAuth';
import { authService } from '@/src/services/authService';
import { COLORS } from '@/src/utils/theme';
import { useTranslation } from 'react-i18next';
import { PhotoUpload } from '@/src/components/PhotoUpload';
import { RoleSelector } from '@/src/components/RoleSelector';
import { FederationPicker } from '@/src/components/FederationPicker';
import { UserRole, Position, Federation } from '@/src/types/User';

const POSITIONS: Position[] = ['GK', 'RB', 'LB', 'CB', 'DM', 'CM', 'AM', 'RW', 'LW', 'ST'];

export default function RegisterScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const { register, loginWithGoogle, loginWithApple } = useAuth();
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(false);
  const [isAppleSignInAvailable, setIsAppleSignInAvailable] = useState(false);

  useEffect(() => {
    const checkAppleSignIn = async () => {
      if (Platform.OS === 'ios') {
        const isAvailable = await AppleAuthentication.isAvailableAsync();
        setIsAppleSignInAvailable(isAvailable);
      }
    };
    checkAppleSignIn();
  }, []);

  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);
  const [role, setRole] = useState<UserRole>('player');
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [birthDay, setBirthDay] = useState<number>(1);
  const [birthMonth, setBirthMonth] = useState<number>(1);
  const [birthYear, setBirthYear] = useState<number>(2005);
  const [positions, setPositions] = useState<Position[]>([]);
  const [federation, setFederation] = useState<Federation | null>('RFEF');
  const [currentClub, setCurrentClub] = useState('');
  const [city, setCity] = useState('');

  const [showDayModal, setShowDayModal] = useState(false);
  const [showMonthModal, setShowMonthModal] = useState(false);
  const [showYearModal, setShowYearModal] = useState(false);
  const [showPositionsModal, setShowPositionsModal] = useState(false);

  const months = [
    { value: 1, label: 'January' },
    { value: 2, label: 'February' },
    { value: 3, label: 'March' },
    { value: 4, label: 'April' },
    { value: 5, label: 'May' },
    { value: 6, label: 'June' },
    { value: 7, label: 'July' },
    { value: 8, label: 'August' },
    { value: 9, label: 'September' },
    { value: 10, label: 'October' },
    { value: 11, label: 'November' },
    { value: 12, label: 'December' },
  ];

  const getDaysInMonth = (month: number, year: number) => {
    return new Date(year, month, 0).getDate();
  };

  const calculateAge = (day: number, month: number, year: number) => {
    const today = new Date();
    const birthDate = new Date(year, month - 1, day);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const handleRegister = async () => {
    if (!fullName || !email || !username || !password || !confirmPassword) {
      Alert.alert(t('common.error'), 'Please fill in all required fields');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert(t('common.error'), 'Passwords do not match');
      return;
    }

    if (password.length < 6) {
      Alert.alert(t('common.error'), 'Password must be at least 6 characters');
      return;
    }

    const calculatedAge = calculateAge(birthDay, birthMonth, birthYear);
    const birthdate = `${birthYear}-${String(birthMonth).padStart(2, '0')}-${String(birthDay).padStart(2, '0')}`;

    if (role === 'player' && positions.length === 0) {
      Alert.alert(t('common.error'), 'Please select at least one position');
      return;
    }

    if (role === 'player' && positions.length > 3) {
      Alert.alert(t('common.error'), 'Maximum 3 positions allowed');
      return;
    }

    setIsLoading(true);
    try {
      await register({
        email,
        username,
        fullName,
        password,
        role,
        age: role === 'player' ? calculatedAge : undefined,
        birthdate,
        positions: role === 'player' ? positions : undefined,
        federation: federation || 'RFEF',
        currentClub,
        city,
        profilePhoto: profilePhoto || undefined,
      });
      router.replace('/(tabs)');
    } catch (error: any) {
      Alert.alert(t('common.error'), error?.message || 'Registration failed. Please try again.');
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
      Alert.alert(t('common.error'), 'Google login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAppleLogin = async () => {
    setIsLoading(true);
    try {
      await loginWithApple();
      router.replace('/(tabs)');
    } catch (error: any) {
      if (error.message !== 'Apple Sign In was canceled') {
        Alert.alert(t('common.error'), 'Apple login failed. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const togglePosition = (position: Position) => {
    if (positions.includes(position)) {
      setPositions(positions.filter(p => p !== position));
    } else if (positions.length < 3) {
      setPositions([...positions, position]);
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
        <Text style={styles.headerTitle}>Create Account</Text>
        <Text style={styles.headerSubtitle}>{t('auth.register')}</Text>
      </LinearGradient>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        <View style={styles.form}>
          <PhotoUpload value={profilePhoto} onChange={setProfilePhoto} username={username} />

          <RoleSelector value={role} onChange={setRole} />

          <View style={styles.inputContainer}>
            <User size={20} color={theme.textSecondary} style={styles.inputIcon} />
            <TextInput
              style={[styles.input, { color: theme.text, backgroundColor: theme.inputBackground }]}
              placeholder="Nombre completo / Full name"
              placeholderTextColor={theme.textSecondary}
              value={fullName}
              onChangeText={setFullName}
            />
          </View>

          <View style={styles.inputContainer}>
            <User size={20} color={theme.textSecondary} style={styles.inputIcon} />
            <TextInput
              style={[styles.input, { color: theme.text, backgroundColor: theme.inputBackground }]}
              placeholder="Nombre de usuario / Username"
              placeholderTextColor={theme.textSecondary}
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
            />
          </View>

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
              placeholder="Contraseña (mínimo 6 caracteres)"
              placeholderTextColor={theme.textSecondary}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoComplete="password"
            />
          </View>

          <View style={styles.inputContainer}>
            <Lock size={20} color={theme.textSecondary} style={styles.inputIcon} />
            <TextInput
              style={[styles.input, { color: theme.text, backgroundColor: theme.inputBackground }]}
              placeholder="Confirmar contraseña / Confirm password"
              placeholderTextColor={theme.textSecondary}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
              autoComplete="password"
            />
          </View>

          {role === 'player' && (
            <>
              <View>
                <Text style={[styles.label, { color: theme.text }]}>Fecha de nacimiento / Birthdate</Text>
                <View style={styles.birthdateRow}>
                  <Pressable
                    onPress={() => setShowDayModal(true)}
                    style={[styles.birthdatePicker, { backgroundColor: theme.card, borderColor: theme.border }]}
                  >
                    <Text style={[styles.pickerText, { color: theme.text }]}>{birthDay}</Text>
                    <ChevronDown size={20} color={theme.textSecondary} />
                  </Pressable>
                  
                  <Pressable
                    onPress={() => setShowMonthModal(true)}
                    style={[styles.birthdatePicker, { backgroundColor: theme.card, borderColor: theme.border, flex: 2 }]}
                  >
                    <Text style={[styles.pickerText, { color: theme.text }]}>
                      {months.find(m => m.value === birthMonth)?.label || 'Month'}
                    </Text>
                    <ChevronDown size={20} color={theme.textSecondary} />
                  </Pressable>
                  
                  <Pressable
                    onPress={() => setShowYearModal(true)}
                    style={[styles.birthdatePicker, { backgroundColor: theme.card, borderColor: theme.border }]}
                  >
                    <Text style={[styles.pickerText, { color: theme.text }]}>{birthYear}</Text>
                    <ChevronDown size={20} color={theme.textSecondary} />
                  </Pressable>
                </View>
              </View>

              <View>
                <Text style={[styles.label, { color: theme.text }]}>
                  Posiciones en el campo / Positions (Máximo 3)
                </Text>
                <Pressable
                  onPress={() => setShowPositionsModal(true)}
                  style={[styles.picker, { backgroundColor: theme.card, borderColor: theme.border }]}
                >
                  <Text style={[styles.pickerText, { color: positions.length > 0 ? theme.text : theme.textSecondary }]}>
                    {positions.length > 0 ? positions.join(', ') : 'Selecciona posiciones / Select positions'}
                  </Text>
                  <ChevronDown size={20} color={theme.textSecondary} />
                </Pressable>
              </View>
            </>
          )}

          <FederationPicker value={federation} onChange={setFederation} />

          <View style={styles.inputContainer}>
            <TextInput
              style={[styles.input, { color: theme.text, backgroundColor: theme.inputBackground }]}
              placeholder="Nombre del club / Club name"
              placeholderTextColor={theme.textSecondary}
              value={currentClub}
              onChangeText={setCurrentClub}
            />
          </View>

          <View style={styles.inputContainer}>
            <TextInput
              style={[styles.input, { color: theme.text, backgroundColor: theme.inputBackground }]}
              placeholder="Ciudad (opcional) / City (optional)"
              placeholderTextColor={theme.textSecondary}
              value={city}
              onChangeText={setCity}
            />
          </View>

          <Pressable
            onPress={handleRegister}
            disabled={isLoading}
            style={[styles.registerButton, { backgroundColor: COLORS.primary }]}
          >
            <Text style={styles.registerText}>
              {isLoading ? t('common.loading') : t('auth.register')}
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
              {t('auth.continueWithGoogle')}
            </Text>
          </Pressable>

          {isAppleSignInAvailable && (
            <AppleAuthentication.AppleAuthenticationButton
              buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
              buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
              cornerRadius={30}
              style={styles.appleButton}
              onPress={handleAppleLogin}
            />
          )}

          <View style={styles.footer}>
            <Text style={[styles.footerText, { color: theme.textSecondary }]}>
              {t('auth.alreadyHaveAccount')}{' '}
            </Text>
            <Pressable onPress={() => router.back()}>
              <Text style={[styles.footerLink, { color: COLORS.skyBlue }]}>
                {t('auth.login')}
              </Text>
            </Pressable>
          </View>

          <Pressable
            onPress={() => {
              Alert.alert(
                'Reset App Data',
                'This will delete all saved accounts and sessions. Use this if you are stuck and cannot register.',
                [
                  { text: 'Cancel', style: 'cancel' },
                  {
                    text: 'Reset',
                    style: 'destructive',
                    onPress: async () => {
                      await authService.clearAllAuthData();
                      Alert.alert('Done', 'App data cleared. You can now register a new account.');
                    },
                  },
                ]
              );
            }}
            style={styles.resetButton}
          >
            <Text style={[styles.resetText, { color: theme.textSecondary }]}>
              Having trouble? Reset app data
            </Text>
          </Pressable>
        </View>
      </ScrollView>

      <Modal visible={showDayModal} transparent animationType="slide">
        <Pressable style={styles.modalOverlay} onPress={() => setShowDayModal(false)}>
          <View style={[styles.modalContent, { backgroundColor: theme.background }]}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>Day</Text>
            <FlatList
              data={Array.from({ length: getDaysInMonth(birthMonth, birthYear) }, (_, i) => i + 1)}
              keyExtractor={(item) => item.toString()}
              renderItem={({ item }) => (
                <Pressable
                  onPress={() => {
                    setBirthDay(item);
                    setShowDayModal(false);
                  }}
                  style={[styles.option, { backgroundColor: birthDay === item ? COLORS.skyBlue : 'transparent' }]}
                >
                  <Text style={[styles.optionText, { color: birthDay === item ? COLORS.white : theme.text }]}>
                    {item}
                  </Text>
                </Pressable>
              )}
            />
          </View>
        </Pressable>
      </Modal>

      <Modal visible={showMonthModal} transparent animationType="slide">
        <Pressable style={styles.modalOverlay} onPress={() => setShowMonthModal(false)}>
          <View style={[styles.modalContent, { backgroundColor: theme.background }]}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>Month</Text>
            <FlatList
              data={months}
              keyExtractor={(item) => item.value.toString()}
              renderItem={({ item }) => (
                <Pressable
                  onPress={() => {
                    setBirthMonth(item.value);
                    setShowMonthModal(false);
                    if (birthDay > getDaysInMonth(item.value, birthYear)) {
                      setBirthDay(getDaysInMonth(item.value, birthYear));
                    }
                  }}
                  style={[styles.option, { backgroundColor: birthMonth === item.value ? COLORS.skyBlue : 'transparent' }]}
                >
                  <Text style={[styles.optionText, { color: birthMonth === item.value ? COLORS.white : theme.text }]}>
                    {item.label}
                  </Text>
                </Pressable>
              )}
            />
          </View>
        </Pressable>
      </Modal>

      <Modal visible={showYearModal} transparent animationType="slide">
        <Pressable style={styles.modalOverlay} onPress={() => setShowYearModal(false)}>
          <View style={[styles.modalContent, { backgroundColor: theme.background }]}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>Year</Text>
            <FlatList
              data={Array.from({ length: 48 }, (_, i) => new Date().getFullYear() - 13 - i)}
              keyExtractor={(item) => item.toString()}
              renderItem={({ item }) => (
                <Pressable
                  onPress={() => {
                    setBirthYear(item);
                    setShowYearModal(false);
                    if (birthDay > getDaysInMonth(birthMonth, item)) {
                      setBirthDay(getDaysInMonth(birthMonth, item));
                    }
                  }}
                  style={[styles.option, { backgroundColor: birthYear === item ? COLORS.skyBlue : 'transparent' }]}
                >
                  <Text style={[styles.optionText, { color: birthYear === item ? COLORS.white : theme.text }]}>
                    {item}
                  </Text>
                </Pressable>
              )}
            />
          </View>
        </Pressable>
      </Modal>

      <Modal visible={showPositionsModal} transparent animationType="slide">
        <Pressable style={styles.modalOverlay} onPress={() => setShowPositionsModal(false)}>
          <View style={[styles.modalContent, { backgroundColor: theme.background }]}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>
              {t('roles.positions')} (Max 3)
            </Text>
            <View style={styles.positionsGrid}>
              {POSITIONS.map((pos) => (
                <Pressable
                  key={pos}
                  onPress={() => togglePosition(pos)}
                  style={[
                    styles.positionChip,
                    {
                      backgroundColor: positions.includes(pos) ? COLORS.primary : theme.card,
                      borderColor: positions.includes(pos) ? COLORS.primary : theme.border,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.positionText,
                      { color: positions.includes(pos) ? COLORS.white : theme.text },
                    ]}
                  >
                    {pos}
                  </Text>
                </Pressable>
              ))}
            </View>
            <Pressable
              onPress={() => setShowPositionsModal(false)}
              style={[styles.doneButton, { backgroundColor: COLORS.primary }]}
            >
              <Text style={styles.doneText}>Done</Text>
            </Pressable>
          </View>
        </Pressable>
      </Modal>
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
  fieldRow: {
    flexDirection: 'row',
    gap: 12,
  },
  birthdateRow: {
    flexDirection: 'row',
    gap: 8,
  },
  birthdatePicker: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  picker: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  pickerText: {
    fontSize: 16,
  },
  registerButton: {
    paddingVertical: 16,
    borderRadius: 30,
    alignItems: 'center',
    marginTop: 8,
  },
  registerText: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: 'bold',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
    gap: 12,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    fontSize: 14,
    fontWeight: '500',
  },
  googleButton: {
    paddingVertical: 16,
    borderRadius: 30,
    alignItems: 'center',
    borderWidth: 1,
  },
  googleText: {
    fontSize: 16,
    fontWeight: '600',
  },
  appleButton: {
    width: '100%',
    height: 56,
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
  resetButton: {
    alignItems: 'center',
    marginTop: 24,
    paddingVertical: 8,
  },
  resetText: {
    fontSize: 12,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: '70%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 16,
  },
  option: {
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  optionText: {
    fontSize: 16,
    fontWeight: '500',
  },
  positionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 20,
  },
  positionChip: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 2,
  },
  positionText: {
    fontSize: 14,
    fontWeight: '600',
  },
  doneButton: {
    paddingVertical: 16,
    borderRadius: 30,
    alignItems: 'center',
    marginTop: 8,
  },
  doneText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
});
