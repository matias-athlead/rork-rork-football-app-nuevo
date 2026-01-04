import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, SafeAreaView, Switch } from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ArrowLeft } from 'lucide-react-native';
import { useTheme } from '@/src/hooks/useTheme';
import { notificationService } from '@/src/services/notificationService';

const NOTIFICATION_SETTINGS_KEY = '@athlead_notification_settings';

interface NotificationSettings {
  pushEnabled: boolean;
  likes: boolean;
  comments: boolean;
  follows: boolean;
  messages: boolean;
  posts: boolean;
  birthday: boolean;
  matchReminders: boolean;
  trainingReminders: boolean;
  achievements: boolean;
}

const defaultSettings: NotificationSettings = {
  pushEnabled: true,
  likes: true,
  comments: true,
  follows: true,
  messages: true,
  posts: true,
  birthday: true,
  matchReminders: true,
  trainingReminders: true,
  achievements: true,
};

export default function NotificationSettingsScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const [settings, setSettings] = useState<NotificationSettings>(defaultSettings);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const stored = await AsyncStorage.getItem(NOTIFICATION_SETTINGS_KEY);
      if (stored) {
        setSettings(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Failed to load notification settings:', error);
    }
  };

  const saveSettings = async (newSettings: NotificationSettings) => {
    try {
      await AsyncStorage.setItem(NOTIFICATION_SETTINGS_KEY, JSON.stringify(newSettings));
      setSettings(newSettings);
    } catch (error) {
      console.error('Failed to save notification settings:', error);
    }
  };

  const handleToggle = async (key: keyof NotificationSettings) => {
    if (key === 'pushEnabled') {
      const hasPermission = await notificationService.requestPermissions();
      if (!hasPermission) {
        return;
      }
    }

    const newSettings = { ...settings, [key]: !settings[key] };
    await saveSettings(newSettings);
  };

  const sections = [
    {
      title: 'General',
      items: [
        {
          key: 'pushEnabled' as keyof NotificationSettings,
          label: 'Push Notifications',
          description: 'Enable or disable all push notifications',
        },
      ],
    },
    {
      title: 'Activity',
      items: [
        {
          key: 'likes' as keyof NotificationSettings,
          label: 'Likes',
          description: 'When someone likes your post',
        },
        {
          key: 'comments' as keyof NotificationSettings,
          label: 'Comments',
          description: 'When someone comments on your post',
        },
        {
          key: 'follows' as keyof NotificationSettings,
          label: 'New Followers',
          description: 'When someone follows you',
        },
      ],
    },
    {
      title: 'Messages',
      items: [
        {
          key: 'messages' as keyof NotificationSettings,
          label: 'Direct Messages',
          description: 'When you receive a new message',
        },
      ],
    },
    {
      title: 'Content',
      items: [
        {
          key: 'posts' as keyof NotificationSettings,
          label: 'New Posts',
          description: 'When people you follow post',
        },
      ],
    },
    {
      title: 'Reminders',
      items: [
        {
          key: 'birthday' as keyof NotificationSettings,
          label: 'Birthday',
          description: 'Get notified on your birthday',
        },
        {
          key: 'matchReminders' as keyof NotificationSettings,
          label: 'Match Reminders',
          description: 'Upcoming match notifications',
        },
        {
          key: 'trainingReminders' as keyof NotificationSettings,
          label: 'Training Reminders',
          description: 'Training session reminders',
        },
      ],
    },
    {
      title: 'Achievements',
      items: [
        {
          key: 'achievements' as keyof NotificationSettings,
          label: 'Achievements',
          description: 'When you unlock achievements',
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
        <Text style={[styles.title, { color: theme.text }]}>Notifications</Text>
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
                  key={item.key}
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
                    value={settings[item.key]}
                    onValueChange={() => handleToggle(item.key)}
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
            You can manage notification preferences for each type of activity. Changes take effect immediately.
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
