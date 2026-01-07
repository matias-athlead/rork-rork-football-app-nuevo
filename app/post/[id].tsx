import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, SafeAreaView, Alert, Modal, Platform } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, Trash2, Edit3, MoreVertical, Flag, Share2, UserX } from 'lucide-react-native';
import { Image } from 'expo-image';
import { useTheme } from '@/src/hooks/useTheme';
import { MOCK_POSTS } from '@/src/services/mockData';
import { COLORS } from '@/src/utils/theme';
import { useAuth } from '@/src/hooks/useAuth';
import VideoPlayer from '@/src/components/VideoPlayer';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';

const POSTS_STORAGE_KEY = '@athlead_user_posts';

export default function PostDetailScreen() {
  const { theme } = useTheme();
  const { user } = useAuth();
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const [post, setPost] = useState<any>(null);
  const [showOptionsMenu, setShowOptionsMenu] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const loadPost = useCallback(async () => {
    try {
      const postsData = await AsyncStorage.getItem(POSTS_STORAGE_KEY);
      if (postsData) {
        const allPosts = JSON.parse(postsData);
        let foundPost = null;
        
        for (const userId in allPosts) {
          const userPosts = allPosts[userId];
          foundPost = userPosts.find((p: any) => p.id === id);
          if (foundPost) break;
        }
        
        if (foundPost) {
          setPost(foundPost);
        } else {
          const mockPost = MOCK_POSTS.find(p => p.id === id);
          setPost(mockPost || MOCK_POSTS[0]);
        }
      } else {
        const mockPost = MOCK_POSTS.find(p => p.id === id);
        setPost(mockPost || MOCK_POSTS[0]);
      }
    } catch (error) {
      console.log('Error loading post:', error);
      const mockPost = MOCK_POSTS.find(p => p.id === id);
      setPost(mockPost || MOCK_POSTS[0]);
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadPost();
  }, [loadPost]);

  const isOwnPost = user?.id === post?.userId;

  const handleDeletePost = async () => {
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    }
    setShowOptionsMenu(false);
    Alert.alert(
      'Delete Post',
      'Are you sure you want to delete this post? This action cannot be undone.',
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
              if (Platform.OS !== 'web') {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              }
              Alert.alert('Success', 'Post deleted successfully');
              router.back();
            } catch {
              if (Platform.OS !== 'web') {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
              }
              Alert.alert('Error', 'Failed to delete post');
            }
          },
        },
      ]
    );
  };

  const handleReport = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    setShowOptionsMenu(false);
    Alert.alert(
      'Report Post',
      'Why are you reporting this post?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Spam',
          onPress: () => Alert.alert('Reported', 'Thanks for helping keep our community safe.'),
        },
        {
          text: 'Inappropriate Content',
          onPress: () => Alert.alert('Reported', 'Thanks for helping keep our community safe.'),
        },
        {
          text: 'False Information',
          onPress: () => Alert.alert('Reported', 'Thanks for helping keep our community safe.'),
        },
      ]
    );
  };

  const handleShare = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setShowOptionsMenu(false);
    Alert.alert('Share', 'Share functionality coming soon!');
  };

  const handleBlockUser = () => {
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    }
    setShowOptionsMenu(false);
    Alert.alert(
      'Block User',
      `Are you sure you want to block @${post?.username}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Block',
          style: 'destructive',
          onPress: () => {
            if (Platform.OS !== 'web') {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            }
            Alert.alert('Blocked', `You have blocked @${post?.username}`);
          },
        },
      ]
    );
  };

  const handleEdit = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setShowOptionsMenu(false);
    router.push(`/edit-post/${id}` as any);
  };

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={styles.loadingContainer}>
          <Text style={[styles.loadingText, { color: theme.textSecondary }]}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!post) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={styles.loadingContainer}>
          <Text style={[styles.loadingText, { color: theme.textSecondary }]}>Post not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { backgroundColor: theme.background }]}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color={theme.text} />
        </Pressable>
        <Text style={[styles.title, { color: theme.text }]}>Post</Text>
        <Pressable 
          onPress={() => {
            if (Platform.OS !== 'web') {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }
            setShowOptionsMenu(true);
          }} 
          style={styles.moreButton}
        >
          <MoreVertical size={24} color={theme.text} />
        </Pressable>
      </View>

      <ScrollView>
        {post.mediaType === 'video' || post.videoUrl ? (
          <VideoPlayer
            uri={post.videoUrl}
            style={styles.video}
            autoPlay={true}
            loop={true}
            showControls={true}
          />
        ) : (
          <Image
            source={{ uri: post.thumbnailUrl || post.videoUrl }}
            style={styles.video}
            contentFit="cover"
          />
        )}
        
        <View style={styles.content}>
          <View style={styles.userInfo}>
            <Image source={{ uri: post.userPhoto }} style={styles.avatar} />
            <View style={styles.userInfoText}>
              <Text style={[styles.username, { color: theme.text }]}>{post.username}</Text>
              <Text style={[styles.role, { color: theme.textSecondary }]}>
                {post.userRole ? post.userRole.toUpperCase() : 'USER'}
              </Text>
            </View>
          </View>

          {post.caption && (
            <Text style={[styles.caption, { color: theme.text }]}>{post.caption}</Text>
          )}
          
          {post.hashtags && post.hashtags.length > 0 && (
            <Text style={[styles.hashtags, { color: COLORS.skyBlue }]}>
              {post.hashtags.join(' ')}
            </Text>
          )}

          {post.taggedUsers && post.taggedUsers.length > 0 && (
            <View style={styles.taggedSection}>
              <Text style={[styles.taggedLabel, { color: theme.textSecondary }]}>Tagged:</Text>
              <View style={styles.taggedUsers}>
                {post.taggedUsers.map((username: string, index: number) => (
                  <Text key={index} style={[styles.taggedUser, { color: COLORS.skyBlue }]}>
                    @{username}
                  </Text>
                ))}
              </View>
            </View>
          )}

          <View style={styles.stats}>
            <Text style={[styles.statText, { color: theme.textSecondary }]}>
              {post.likes || 0} likes
            </Text>
            <Text style={[styles.statText, { color: theme.textSecondary }]}>
              {post.comments || 0} comments
            </Text>
            <Text style={[styles.statText, { color: theme.textSecondary }]}>
              {post.shares || 0} shares
            </Text>
          </View>

          <Text style={[styles.timestamp, { color: theme.textSecondary }]}>
            {post.createdAt ? new Date(post.createdAt).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            }) : ''}
          </Text>
        </View>
      </ScrollView>

      <Modal
        visible={showOptionsMenu}
        transparent
        animationType="fade"
        onRequestClose={() => setShowOptionsMenu(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setShowOptionsMenu(false)}>
          <View style={[styles.optionsMenu, { backgroundColor: theme.card }]}>
            {isOwnPost ? (
              <>
                <Pressable onPress={handleEdit} style={styles.optionItem}>
                  <Edit3 size={22} color={theme.text} />
                  <Text style={[styles.optionText, { color: theme.text }]}>Edit Post</Text>
                </Pressable>
                <View style={[styles.separator, { backgroundColor: theme.border }]} />
                <Pressable onPress={handleDeletePost} style={styles.optionItem}>
                  <Trash2 size={22} color={COLORS.error} />
                  <Text style={[styles.optionText, { color: COLORS.error }]}>Delete Post</Text>
                </Pressable>
              </>
            ) : (
              <>
                <Pressable onPress={handleReport} style={styles.optionItem}>
                  <Flag size={22} color={theme.text} />
                  <Text style={[styles.optionText, { color: theme.text }]}>Report</Text>
                </Pressable>
                <View style={[styles.separator, { backgroundColor: theme.border }]} />
                <Pressable onPress={handleShare} style={styles.optionItem}>
                  <Share2 size={22} color={theme.text} />
                  <Text style={[styles.optionText, { color: theme.text }]}>Share</Text>
                </Pressable>
                <View style={[styles.separator, { backgroundColor: theme.border }]} />
                <Pressable onPress={handleBlockUser} style={styles.optionItem}>
                  <UserX size={22} color={COLORS.error} />
                  <Text style={[styles.optionText, { color: COLORS.error }]}>Block User</Text>
                </Pressable>
              </>
            )}
            <View style={[styles.separator, { backgroundColor: theme.border }]} />
            <Pressable onPress={() => setShowOptionsMenu(false)} style={styles.optionItem}>
              <Text style={[styles.optionText, { color: theme.textSecondary }]}>Cancel</Text>
            </Pressable>
          </View>
        </Pressable>
      </Modal>
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
  moreButton: {
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
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
  userInfoText: {
    flex: 1,
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
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(128, 128, 128, 0.2)',
    marginTop: 12,
  },
  statText: {
    fontSize: 14,
  },
  timestamp: {
    fontSize: 12,
    marginTop: 8,
  },
  taggedSection: {
    marginTop: 12,
    padding: 12,
    backgroundColor: 'rgba(128, 128, 128, 0.1)',
    borderRadius: 8,
  },
  taggedLabel: {
    fontSize: 12,
    marginBottom: 6,
    fontWeight: '600',
  },
  taggedUsers: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  taggedUser: {
    fontSize: 14,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  optionsMenu: {
    width: '100%',
    borderRadius: 16,
    overflow: 'hidden',
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    gap: 16,
  },
  optionText: {
    fontSize: 16,
    fontWeight: '500',
  },
  separator: {
    height: 1,
    marginLeft: 20,
  },
});
