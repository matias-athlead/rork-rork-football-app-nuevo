import React from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, SafeAreaView } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import { Image } from 'expo-image';
import { useTheme } from '@/src/hooks/useTheme';
import { MOCK_POSTS } from '@/src/services/mockData';
import { COLORS } from '@/src/utils/theme';

export default function PostDetailScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const { id } = useLocalSearchParams();

  const post = MOCK_POSTS.find(p => p.id === id) || MOCK_POSTS[0];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { backgroundColor: theme.background }]}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color={theme.text} />
        </Pressable>
        <Text style={[styles.title, { color: theme.text }]}>Post</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView>
        <Image source={{ uri: post.thumbnailUrl }} style={styles.image} />
        
        <View style={styles.content}>
          <View style={styles.userInfo}>
            <Image source={{ uri: post.userPhoto }} style={styles.avatar} />
            <View>
              <Text style={[styles.username, { color: theme.text }]}>{post.username}</Text>
              <Text style={[styles.role, { color: theme.textSecondary }]}>
                {post.userRole.toUpperCase()}
              </Text>
            </View>
          </View>

          <Text style={[styles.caption, { color: theme.text }]}>{post.caption}</Text>
          <Text style={[styles.hashtags, { color: COLORS.skyBlue }]}>
            {post.hashtags.join(' ')}
          </Text>

          <View style={styles.stats}>
            <Text style={[styles.statText, { color: theme.textSecondary }]}>
              {post.likes} likes
            </Text>
            <Text style={[styles.statText, { color: theme.textSecondary }]}>
              {post.comments} comments
            </Text>
            <Text style={[styles.statText, { color: theme.textSecondary }]}>
              {post.shares} shares
            </Text>
          </View>
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
  image: {
    width: '100%',
    height: 400,
  },
  content: {
    padding: 20,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  username: {
    fontSize: 16,
    fontWeight: '600',
  },
  role: {
    fontSize: 12,
    marginTop: 2,
  },
  caption: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 8,
  },
  hashtags: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 16,
  },
  stats: {
    flexDirection: 'row',
    gap: 16,
  },
  statText: {
    fontSize: 14,
  },
});
