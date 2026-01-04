import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, SafeAreaView, Switch, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import { useTheme } from '@/src/hooks/useTheme';
import { useAuth } from '@/src/hooks/useAuth';
import { usePrivacySettings } from '@/src/hooks/usePrivacySettings';

export default function PrivacySettingsScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const { user, updateUser } = useAuth();
  const { settings, updateSetting } = usePrivacySettings();

  useEffect(() => {
    if (user && settings.isPrivate !== user.isPrivate) {
      updateUser({ ...user, isPrivate: settings.isPrivate });
    }
  }, [settings.isPrivate, user, updateUser]);

  const handlePrivacyToggle = async (value: boolean) => {
    try {
      await updateSetting('isPrivate', value);
      if (user) {
        await updateUser({ ...user, isPrivate: value });
      }
      Alert.alert(
        'Account Privacy Updated',
        value
          ? 'Your account is now private. Only approved followers can see your posts.'
          : 'Your account is now public. Anyone can see your posts.'
      );
    } catch {
      Alert.alert('Error', 'Failed to update privacy setting');
    }
  };

  const handleToggle = async (key: keyof typeof settings, value: boolean) => {
    try {
      await updateSetting(key, value);
    } catch {
      Alert.alert('Error', 'Failed to update setting');
    }
  };

  const sections = [
    {
      title: 'Account Privacy',
      items: [
        {
          label: 'Private Account',
          description: 'Only approved followers can see your posts',
          value: settings.isPrivate,
          onToggle: handlePrivacyToggle,
        },
      ],
    },
    {
      title: 'Activity Status',
      items: [
        {
          label: 'Show Online Status',
          description: 'Let others see when you\'re active',
          value: settings.showOnlineStatus,
          onToggle: (value: boolean) => handleToggle('showOnlineStatus', value),
        },
        {
          label: 'Read Receipts',
          description: 'Let others see when you read their messages',
          value: settings.showReadReceipts,
          onToggle: (value: boolean) => handleToggle('showReadReceipts', value),
        },
      ],
    },
    {
      title: 'Content',
      items: [
        {
          label: 'Allow Tagging',
          description: 'Let others tag you in posts',
          value: settings.allowTagging,
          onToggle: (value: boolean) => handleToggle('allowTagging', value),
        },
        {
          label: 'Show Stats',
          description: 'Display your stats on your profile',
          value: settings.showStats,
          onToggle: (value: boolean) => handleToggle('showStats', value),
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
        <Text style={[styles.title, { color: theme.text }]}>Privacy</Text>
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
                <View
                  key={itemIndex}
                  style={[
                    styles.settingItem,
                    itemIndex !== section.items.length - 1 && [
                      styles.settingItemBorder,
                      { borderBottomColor: theme.border },
                    ],
                  ]}
                >
                  <View style={styles.settingInfo}>
                    <Text style={[styles.settingLabel, { color: theme.text }]}>
                      {item.label}
                    </Text>
                    <Text style={[styles.settingDescription, { color: theme.textSecondary }]}>
                      {item.description}
                    </Text>
                  </View>
                  <Switch
                    value={item.value}
                    onValueChange={item.onToggle}
                    trackColor={{ false: theme.border, true: '#10b981' }}
                    thumbColor="#ffffff"
                    ios_backgroundColor={theme.border}
                  />
                </View>
              ))}
            </View>
          </View>
        ))}

        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: theme.textSecondary }]}>
            Your privacy settings help control who can see your content and activity on Athlead.
          </Text>
        </View>
      </ScrollView>
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
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  settingItemBorder: {
    borderBottomWidth: 1,
  },
  settingInfo: {
    flex: 1,
    marginRight: 12,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 13,
    lineHeight: 18,
  },
  footer: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    marginBottom: 40,
  },
  footerText: {
    fontSize: 13,
    lineHeight: 18,
    textAlign: 'center',
  },
});
