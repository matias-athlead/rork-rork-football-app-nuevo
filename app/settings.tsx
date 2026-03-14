import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, SafeAreaView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, ChevronRight, Moon, Sun, Globe, Bell, Lock, Shield, HelpCircle, LogOut, Trash2 } from 'lucide-react-native';
import { useTheme } from '@/src/hooks/useTheme';
import { useAuth } from '@/src/hooks/useAuth';
import { COLORS } from '@/src/utils/theme';
import { getCurrentLanguage } from '@/src/i18n';
import LanguageSelector from '@/src/components/LanguageSelector';

export default function SettingsScreen() {
  const { theme, themeMode, setThemeMode, isDark } = useTheme();
  const { user, logout, deleteAccount } = useAuth();
  const router = useRouter();
  const [languageModalVisible, setLanguageModalVisible] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [currentLanguage, setCurrentLanguage] = useState(getCurrentLanguage());

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          await logout();
          router.replace('/onboarding');
        },
      },
    ]);
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'Are you sure you want to permanently delete your account? This will remove all your posts, messages, followers, and account data. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Continue',
          style: 'destructive',
          onPress: () => {
            Alert.alert(
              'Final Confirmation',
              `You are about to delete the account for ${user?.email ?? 'this account'}. All data will be permanently erased.`,
              [
                { text: 'Go Back', style: 'cancel' },
                {
                  text: 'Delete Forever',
                  style: 'destructive',
                  onPress: async () => {
                    setIsDeletingAccount(true);
                    try {
                      await deleteAccount();
                      router.replace('/onboarding');
                    } catch {
                      setIsDeletingAccount(false);
                      Alert.alert('Error', 'Failed to delete account. Please try again.');
                    }
                  },
                },
              ]
            );
          },
        },
      ]
    );
  };

  const handleThemeChange = async () => {
    const modes: ('light' | 'dark' | 'auto')[] = ['light', 'dark', 'auto'];
    const currentIndex = modes.indexOf(themeMode);
    const nextMode = modes[(currentIndex + 1) % modes.length];
    await setThemeMode(nextMode);
  };

  const getThemeLabel = () => {
    return themeMode.charAt(0).toUpperCase() + themeMode.slice(1);
  };

  const getLanguageLabel = () => {
    return currentLanguage === 'es' ? 'Español' : 'English';
  };

  const handleLanguageModalClose = () => {
    setLanguageModalVisible(false);
    setCurrentLanguage(getCurrentLanguage());
  };

  const sections = [
    {
      title: 'Appearance',
      items: [
        {
          icon: isDark ? <Moon size={22} color={theme.text} /> : <Sun size={22} color={theme.text} />,
          label: 'Theme',
          value: getThemeLabel(),
          onPress: handleThemeChange,
        },
      ],
    },
    {
      title: 'Preferences',
      items: [
        {
          icon: <Globe size={22} color={theme.text} />,
          label: 'Language',
          value: getLanguageLabel(),
          onPress: () => setLanguageModalVisible(true),
        },
        {
          icon: <Bell size={22} color={theme.text} />,
          label: 'Notifications',
          onPress: () => router.push('/notification-settings'),
        },
      ],
    },
    {
      title: 'Privacy & Security',
      items: [
        {
          icon: <Lock size={22} color={theme.text} />,
          label: 'Privacy',
          value: user?.isPrivate ? 'Private' : 'Public',
          onPress: () => router.push('/privacy-settings'),
        },
        {
          icon: <Shield size={22} color={theme.text} />,
          label: 'Blocked Users',
          onPress: () => router.push('/blocked-users'),
        },
      ],
    },
    {
      title: 'Support',
      items: [
        {
          icon: <HelpCircle size={22} color={theme.text} />,
          label: 'Help & Support',
          onPress: () => router.push('/help-support'),
        },
      ],
    },
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { backgroundColor: theme.background }]}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color={theme.text} />
        </Pressable>
        <Text style={[styles.title, { color: theme.text }]}>Settings</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {sections.map((section, sectionIndex) => (
          <View key={sectionIndex} style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>
              {section.title}
            </Text>
            <View style={[styles.sectionContent, { backgroundColor: theme.card }]}>
              {section.items.map((item, itemIndex) => (
                <Pressable
                  key={itemIndex}
                  onPress={item.onPress}
                  style={[
                    styles.settingItem,
                    itemIndex !== section.items.length - 1 && [
                      styles.settingItemBorder,
                      { borderBottomColor: theme.border },
                    ],
                  ]}
                >
                  <View style={styles.settingLeft}>
                    {item.icon}
                    <Text style={[styles.settingLabel, { color: theme.text }]}>
                      {item.label}
                    </Text>
                  </View>
                  <View style={styles.settingRight}>
                    {item.value && (
                      <Text style={[styles.settingValue, { color: theme.textSecondary }]}>
                        {item.value}
                      </Text>
                    )}
                    <ChevronRight size={20} color={theme.textSecondary} />
                  </View>
                </Pressable>
              ))}
            </View>
          </View>
        ))}

        <Pressable
          onPress={handleLogout}
          style={[styles.logoutButton, { backgroundColor: theme.card }]}
        >
          <LogOut size={22} color={COLORS.error} />
          <Text style={[styles.logoutText, { color: COLORS.error }]}>Logout</Text>
        </Pressable>

        <Pressable
          onPress={handleDeleteAccount}
          disabled={isDeletingAccount}
          style={[styles.deleteButton, { backgroundColor: theme.card, opacity: isDeletingAccount ? 0.5 : 1 }]}
        >
          <Trash2 size={22} color={COLORS.error} />
          <Text style={[styles.deleteText, { color: COLORS.error }]}>
            {isDeletingAccount ? 'Deleting…' : 'Delete Account'}
          </Text>
        </Pressable>

        <Text style={[styles.version, { color: theme.textSecondary }]}>
          Version 1.0.0 (Build 1)
        </Text>
      </ScrollView>

      <LanguageSelector
        visible={languageModalVisible}
        onClose={handleLanguageModalClose}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  backButton: {
    padding: 4,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    paddingHorizontal: 20,
    marginBottom: 8,
  },
  sectionContent: {
    marginHorizontal: 20,
    borderRadius: 12,
    overflow: 'hidden',
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  settingItemBorder: {
    borderBottomWidth: 1,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  settingLabel: {
    fontSize: 16,
  },
  settingRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  settingValue: {
    fontSize: 15,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 20,
    marginTop: 12,
    paddingVertical: 16,
    borderRadius: 12,
    gap: 12,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 20,
    marginTop: 12,
    paddingVertical: 16,
    borderRadius: 12,
    gap: 12,
  },
  deleteText: {
    fontSize: 16,
    fontWeight: '600',
  },
  version: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: 24,
    marginBottom: 40,
  },
});
