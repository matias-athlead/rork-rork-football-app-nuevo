import React from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, SafeAreaView, Linking, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, Mail, MessageCircle, FileText, Shield, Info, ExternalLink } from 'lucide-react-native';
import { useTheme } from '@/src/hooks/useTheme';

interface SupportItem {
  icon: React.ReactElement;
  label: string;
  description?: string;
  onPress: () => void;
  showExternal?: boolean;
}

export default function HelpSupportScreen() {
  const { theme } = useTheme();
  const router = useRouter();

  const handleContactSupport = () => {
    Linking.openURL('mailto:support@athlead.com?subject=Support Request');
  };

  const handleSendFeedback = () => {
    Alert.alert(
      'Send Feedback',
      'Help us improve Athlead by sharing your thoughts and suggestions.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Email Feedback',
          onPress: () => Linking.openURL('mailto:feedback@athlead.com?subject=App Feedback'),
        },
      ]
    );
  };

  const handleOpenFAQ = () => {
    Alert.alert('FAQs', 'Frequently Asked Questions will be available in the next update.');
  };

  const handleOpenTerms = () => {
    Alert.alert('Terms of Service', 'Terms and conditions will be available soon.');
  };

  const handleOpenPrivacyPolicy = () => {
    Alert.alert('Privacy Policy', 'Privacy policy will be available soon.');
  };

  const handleOpenAbout = () => {
    Alert.alert(
      'About Athlead',
      'Athlead is a social network for athletes, coaches, and clubs.\n\nVersion 1.0.0 (Build 1)\n\n© 2024 Athlead. All rights reserved.'
    );
  };

  const sections: { title: string; items: SupportItem[] }[] = [
    {
      title: 'Support',
      items: [
        {
          icon: <MessageCircle size={22} color={theme.text} />,
          label: 'FAQs',
          description: 'Find answers to common questions',
          onPress: handleOpenFAQ,
        },
        {
          icon: <Mail size={22} color={theme.text} />,
          label: 'Contact Support',
          description: 'Get help from our support team',
          onPress: handleContactSupport,
          showExternal: true,
        },
        {
          icon: <MessageCircle size={22} color={theme.text} />,
          label: 'Send Feedback',
          description: 'Share your thoughts and suggestions',
          onPress: handleSendFeedback,
        },
      ],
    },
    {
      title: 'Legal',
      items: [
        {
          icon: <FileText size={22} color={theme.text} />,
          label: 'Terms of Service',
          onPress: handleOpenTerms,
        },
        {
          icon: <Shield size={22} color={theme.text} />,
          label: 'Privacy Policy',
          onPress: handleOpenPrivacyPolicy,
        },
      ],
    },
    {
      title: 'About',
      items: [
        {
          icon: <Info size={22} color={theme.text} />,
          label: 'About Athlead',
          onPress: handleOpenAbout,
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
        <Text style={[styles.title, { color: theme.text }]}>Help & Support</Text>
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
                    <View style={styles.settingTextContainer}>
                      <Text style={[styles.settingLabel, { color: theme.text }]}>
                        {item.label}
                      </Text>
                      {item.description && (
                        <Text style={[styles.settingDescription, { color: theme.textSecondary }]}>
                          {item.description}
                        </Text>
                      )}
                    </View>
                  </View>
                  {item.showExternal && (
                    <ExternalLink size={18} color={theme.textSecondary} />
                  )}
                </Pressable>
              ))}
            </View>
          </View>
        ))}

        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: theme.textSecondary }]}>
            Need more help? Contact us at support@athlead.com
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
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  settingTextContainer: {
    flex: 1,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '500',
  },
  settingDescription: {
    fontSize: 13,
    marginTop: 2,
    lineHeight: 18,
  },
  footer: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    marginTop: 20,
    marginBottom: 40,
  },
  footerText: {
    fontSize: 13,
    lineHeight: 18,
    textAlign: 'center',
  },
});
