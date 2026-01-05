import React from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, SafeAreaView, Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, Trash2, Edit3 } from 'lucide-react-native';
import { Image } from 'expo-image';
import { useTheme } from '@/src/hooks/useTheme';
import { MOCK_POSTS } from '@/src/services/mockData';
import { COLORS } from '@/src/utils/theme';
import { useAuth } from '@/src/hooks/useAuth';
import VideoPlayer from '@/src/components/VideoPlayer';
import AsyncStorage from '@react-native-async-storage/async-storage';

const POSTS_STORAGE_KEY = '@athlead_user_posts';

export default function PostDetailScreen() {
  const { theme } = useTheme();
  const { user } = useAuth();
  const router = useRouter();
  const { id } = useLocalSearchParams();

  const post = MOCK_POSTS.find(p => p.id === id) || MOCK_POSTS[0];
  const isOwnPost = user?.id === post.userId;

  const handleDeletePost = async () => {
    Alert.alert(
      'Delete Post',
      'Are you sure you want to delete this post?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const existingPosts = await AsyncStorage.getItem(POSTS_STORAGE_KEY);
              if (existingPosts && user) {
                const posts = JSON.parse(existingPosts);
                if (posts[user.id]) {
                  posts[user.id] = posts[user.id].filter((p: any) => p.id !== id);
                  await AsyncStorage.setItem(POSTS_STORAGE_KEY, JSON.stringify(posts));
                }
              }
              Alert.alert('Success', 'Post deleted successfully');
              router.back();
            } catch {
              Alert.alert('Error', 'Failed to delete post');
            }
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
        <Text style={[styles.title, { color: theme.text }]}>Post</Text>
        {isOwnPost ? (
          <View style={styles.headerActions}>
            <Pressable onPress={() => router.push(`/edit-post/${id}` as any)} style={styles.editButton}>
              <Edit3 size={22} color={theme.text} />
            </Pressable>
            <Pressable onPress={handleDeletePost} style={styles.deleteButton}>
              <Trash2 size={22} color={COLORS.error} />
            </Pressable>
          </View>
        ) : (
          <View style={{ width: 24 }} />
        )}
      </View>

      <ScrollView>
        <VideoPlayer
          uri={post.videoUrl}
          style={styles.video}
          autoPlay={true}
          loop={true}
          showControls={true}
        />
        
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
  video: {
    width: '100%',
    height: 400,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 12,
  },
  editButton: {
    padding: 4,
  },
  deleteButton: {
    padding: 4,
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
