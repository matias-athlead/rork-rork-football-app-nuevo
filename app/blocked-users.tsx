import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, SafeAreaView, Image, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, UserX } from 'lucide-react-native';
import { useTheme } from '@/src/hooks/useTheme';

interface BlockedUser {
  id: string;
  username: string;
  fullName: string;
  profilePhoto: string;
  blockedAt: string;
}

const mockBlockedUsers: BlockedUser[] = [
  {
    id: '1',
    username: 'user123',
    fullName: 'John Doe',
    profilePhoto: 'https://i.pravatar.cc/150?img=1',
    blockedAt: '2024-01-15',
  },
  {
    id: '2',
    username: 'spammer99',
    fullName: 'Jane Smith',
    profilePhoto: 'https://i.pravatar.cc/150?img=2',
    blockedAt: '2024-01-10',
  },
];

export default function BlockedUsersScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const [blockedUsers, setBlockedUsers] = useState<BlockedUser[]>(mockBlockedUsers);

  const handleUnblock = (user: BlockedUser) => {
    Alert.alert(
      'Unblock User',
      `Are you sure you want to unblock ${user.username}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Unblock',
          style: 'default',
          onPress: () => {
            setBlockedUsers(blockedUsers.filter(u => u.id !== user.id));
            Alert.alert('Success', `${user.username} has been unblocked`);
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { backgroundColor: theme.background }]}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color={theme.text} />
        </Pressable>
        <Text style={[styles.title, { color: theme.text }]}>Blocked Users</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {blockedUsers.length === 0 ? (
          <View style={styles.emptyState}>
            <UserX size={64} color={theme.textSecondary} strokeWidth={1.5} />
            <Text style={[styles.emptyTitle, { color: theme.text }]}>
              No Blocked Users
            </Text>
            <Text style={[styles.emptyDescription, { color: theme.textSecondary }]}>
              You haven&apos;t blocked anyone yet. Blocked users won&apos;t be able to see your posts or contact you.
            </Text>
          </View>
        ) : (
          <View style={styles.list}>
            {blockedUsers.map((user, index) => (
              <View
                key={user.id}
                style={[
                  styles.userItem,
                  { backgroundColor: theme.card },
                  index !== blockedUsers.length - 1 && [
                    styles.userItemBorder,
                    { borderBottomColor: theme.border },
                  ],
                ]}
              >
                <View style={styles.userInfo}>
                  <Image source={{ uri: user.profilePhoto }} style={styles.avatar} />
                  <View style={styles.userDetails}>
                    <Text style={[styles.fullName, { color: theme.text }]}>
                      {user.fullName}
                    </Text>
                    <Text style={[styles.username, { color: theme.textSecondary }]}>
                      @{user.username}
                    </Text>
                  </View>
                </View>
                <Pressable
                  onPress={() => handleUnblock(user)}
                  style={[styles.unblockButton, { borderColor: theme.border }]}
                >
                  <Text style={[styles.unblockText, { color: theme.text }]}>
                    Unblock
                  </Text>
                </Pressable>
              </View>
            ))}
          </View>
        )}

        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: theme.textSecondary }]}>
            Blocked users cannot see your posts, follow you, or send you messages. They won&apos;t be notified that you&apos;ve blocked them.
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
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    paddingTop: 80,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
  },
  list: {
    marginHorizontal: 20,
    marginTop: 8,
    borderRadius: 12,
    overflow: 'hidden',
  },
  userItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  userItemBorder: {
    borderBottomWidth: 1,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  userDetails: {
    marginLeft: 12,
    flex: 1,
  },
  fullName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  username: {
    fontSize: 14,
  },
  unblockButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  unblockText: {
    fontSize: 14,
    fontWeight: '600',
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
