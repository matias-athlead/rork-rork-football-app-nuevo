import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TextInput, FlatList, Pressable, KeyboardAvoidingView, Platform, SafeAreaView, ActivityIndicator } from 'react-native';
import Avatar from '@/src/components/Avatar';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { X, Send, Heart } from 'lucide-react-native';
import { useTheme } from '@/src/hooks/useTheme';
import { useAuth } from '@/src/hooks/useAuth';
import { COLORS } from '@/src/utils/theme';
import * as Haptics from 'expo-haptics';
import { socialService } from '@/src/services/socialService';
import { notificationService } from '@/src/services/notificationService';
import { Comment } from '@/src/types/Post';

export default function PostCommentsScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const { user } = useAuth();
  const { id: postId } = useLocalSearchParams<{ id: string }>();
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [postOwnerId, setPostOwnerId] = useState<string | null>(null);
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    const load = async () => {
      if (!postId) return;
      const pid = Array.isArray(postId) ? postId[0] : postId;
      const loaded = await socialService.getComments(pid);
      setComments(loaded);
      setIsLoading(false);
      // Find post owner for notifications
      try {
        const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
        const postsData = await AsyncStorage.getItem('@athlead_user_posts');
        if (postsData) {
          const allPosts = JSON.parse(postsData);
          for (const uid in allPosts) {
            if (allPosts[uid].some((p: any) => p.id === pid)) {
              setPostOwnerId(uid);
              break;
            }
          }
        }
      } catch {}
    };
    load();
  }, [postId]);

  const handleLikeComment = async (commentId: string) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    const pid = Array.isArray(postId) ? postId[0] : postId;
    const updated = await socialService.likeComment(pid, commentId);
    setComments(updated);
  };

  const handleAddComment = async () => {
    if (!newComment.trim() || !user) return;
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    const pid = Array.isArray(postId) ? postId[0] : postId;
    const comment: Comment = {
      id: `comment_${Date.now()}`,
      postId: pid,
      userId: user.id,
      username: user.username,
      userPhoto: user.profilePhoto,
      text: newComment.trim(),
      likes: 0,
      isLiked: false,
      createdAt: new Date().toISOString(),
    };

    const updated = await socialService.addComment(pid, comment);
    setComments(updated);
    setNewComment('');
    setTimeout(() => flatListRef.current?.scrollToOffset({ offset: 0, animated: true }), 100);

    // Notify post owner (if not commenting on own post)
    if (postOwnerId && postOwnerId !== user.id) {
      void notificationService.addNotification(
        postOwnerId,
        {
          type: 'comment',
          userId: user.id,
          username: user.username,
          userPhoto: user.profilePhoto,
          content: `commented: "${newComment.trim().slice(0, 50)}${newComment.trim().length > 50 ? '…' : ''}"`,
          postId: pid,
          isRead: false,
        },
        '💬 New comment',
        `${user.username} commented on your post`,
      );
    }
  };

  const formatTime = (iso: string) => {
    if (!iso || iso === 'now') return 'now';
    try {
      const diff = Date.now() - new Date(iso).getTime();
      const mins = Math.floor(diff / 60000);
      if (mins < 1) return 'now';
      if (mins < 60) return `${mins}m`;
      const hrs = Math.floor(mins / 60);
      if (hrs < 24) return `${hrs}h`;
      return `${Math.floor(hrs / 24)}d`;
    } catch {
      return '';
    }
  };

  const renderComment = ({ item }: { item: Comment }) => (
    <View style={styles.commentItem}>
      <Pressable onPress={() => router.push(`/profile/${item.userId}` as any)}>
        <Avatar uri={item.userPhoto} username={item.username} size={36} />
      </Pressable>
      <View style={styles.commentContent}>
        <View style={styles.commentHeader}>
          <Pressable onPress={() => router.push(`/profile/${item.userId}` as any)}>
            <Text style={[styles.commentUsername, { color: theme.text }]}>{item.username}</Text>
          </Pressable>
          <Text style={[styles.commentTime, { color: theme.textSecondary }]}>{formatTime(item.createdAt)}</Text>
        </View>
        <Text style={[styles.commentText, { color: theme.text }]}>{item.text}</Text>
        <Pressable onPress={() => handleLikeComment(item.id)} style={styles.commentLike}>
          <Heart
            size={14}
            color={item.isLiked ? COLORS.error : theme.textSecondary}
            fill={item.isLiked ? COLORS.error : 'transparent'}
          />
          {item.likes > 0 && (
            <Text style={[styles.commentLikes, { color: theme.textSecondary }]}>
              {item.likes}
            </Text>
          )}
        </Pressable>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { backgroundColor: theme.background, borderBottomColor: theme.border }]}>
        <Text style={[styles.title, { color: theme.text }]}>Comments</Text>
        <Pressable onPress={() => {
          try {
            if (Platform.OS !== 'web') router.back();
            else router.push('/(tabs)');
          } catch {
            router.push('/(tabs)');
          }
        }} style={styles.closeButton}>
          <X size={24} color={theme.text} />
        </Pressable>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.content}
        keyboardVerticalOffset={0}
      >
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color={COLORS.skyBlue} />
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={comments}
            renderItem={renderComment}
            keyExtractor={(item) => item.id}
            contentContainerStyle={[styles.commentsList, comments.length === 0 && styles.emptyList]}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
                  No comments yet. Be the first!
                </Text>
              </View>
            }
          />
        )}

        <View style={[styles.inputContainer, { backgroundColor: theme.card, borderTopColor: theme.border }]}>
          {user && (
            <Avatar uri={user.profilePhoto} username={user.username} size={32} />
          )}
          <TextInput
            style={[styles.input, { color: theme.text, backgroundColor: theme.inputBackground }]}
            placeholder="Add a comment..."
            placeholderTextColor={theme.textSecondary}
            value={newComment}
            onChangeText={setNewComment}
            multiline
          />
          <Pressable
            onPress={handleAddComment}
            disabled={!newComment.trim()}
            style={[styles.sendButton, { backgroundColor: newComment.trim() ? COLORS.primary : theme.border }]}
          >
            <Send size={18} color={COLORS.white} />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  title: { fontSize: 20, fontWeight: 'bold' },
  closeButton: { padding: 4 },
  content: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  commentsList: { padding: 16 },
  emptyList: { flex: 1 },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 60 },
  emptyText: { fontSize: 15, textAlign: 'center' },
  commentItem: { flexDirection: 'row', marginBottom: 20, gap: 12 },
  commentContent: { flex: 1 },
  commentHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  commentUsername: { fontSize: 14, fontWeight: '600' },
  commentTime: { fontSize: 12 },
  commentText: { fontSize: 14, lineHeight: 18, marginBottom: 6 },
  commentLike: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  commentLikes: { fontSize: 12 },
  inputContainer: {
    flexDirection: 'row',
    padding: 12,
    borderTopWidth: 1,
    gap: 10,
    alignItems: 'flex-end',
  },
  input: {
    flex: 1,
    maxHeight: 100,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    fontSize: 15,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
