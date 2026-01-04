import React from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, SafeAreaView } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import { Image } from 'expo-image';
import { useTheme } from '@/src/hooks/useTheme';
import { MOCK_USERS } from '@/src/services/mockData';
import { COLORS } from '@/src/utils/theme';

export default function ProfileDetailScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const { id } = useLocalSearchParams();

  const user = MOCK_USERS.find(u => u.id === id) || MOCK_USERS[0];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { backgroundColor: theme.background }]}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color={theme.text} />
        </Pressable>
        <Text style={[styles.title, { color: theme.text }]}>{user.username}</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView>
        <Image source={{ uri: user.coverPhoto }} style={styles.coverPhoto} />
        
        <View style={styles.content}>
          <View style={styles.avatarContainer}>
            <Image source={{ uri: user.profilePhoto }} style={styles.avatar} />
          </View>

          <Text style={[styles.username, { color: theme.text }]}>{user.username}</Text>
          <Text style={[styles.role, { color: theme.textSecondary }]}>
            {user.role.toUpperCase()}
          </Text>

          {user.bio && (
            <Text style={[styles.bio, { color: theme.text }]}>{user.bio}</Text>
          )}

          <View style={styles.statsContainer}>
            <View style={styles.stat}>
              <Text style={[styles.statValue, { color: theme.text }]}>{user.followers}</Text>
              <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Followers</Text>
            </View>
            <View style={styles.stat}>
              <Text style={[styles.statValue, { color: theme.text }]}>{user.following}</Text>
              <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Following</Text>
            </View>
          </View>

          <Pressable style={[styles.followButton, { backgroundColor: COLORS.primary }]}>
            <Text style={styles.followButtonText}>Follow</Text>
          </Pressable>
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
    fontSize: 18,
    fontWeight: '600',
  },
  coverPhoto: {
    width: '100%',
    height: 200,
  },
  content: {
    padding: 20,
    alignItems: 'center',
  },
  avatarContainer: {
    marginTop: -60,
    marginBottom: 16,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 4,
    borderColor: COLORS.white,
  },
  username: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  role: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
  },
  bio: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 20,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 40,
    marginBottom: 24,
  },
  stat: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  statLabel: {
    fontSize: 14,
    marginTop: 4,
  },
  followButton: {
    paddingHorizontal: 40,
    paddingVertical: 12,
    borderRadius: 24,
  },
  followButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.white,
  },
});
