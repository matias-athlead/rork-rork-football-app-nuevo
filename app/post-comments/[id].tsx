import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, FlatList, Pressable, KeyboardAvoidingView, Platform, SafeAreaView } from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { X, Send, Heart } from 'lucide-react-native';
import { useTheme } from '@/src/hooks/useTheme';
import { useAuth } from '@/src/hooks/useAuth';
import { COLORS } from '@/src/utils/theme';
import * as Haptics from 'expo-haptics';

interface Comment {
  id: string;
  userId: string;
  username: string;
  userPhoto: string;
  text: string;
  likes: number;
  isLiked: boolean;
  createdAt: string;
}

const MOCK_COMMENTS: Comment[] = [
  {
    id: '1',
    userId: '1',
    username: 'carlos_rm',
    userPhoto: 'https://i.pravatar.cc/150?img=1',
    text: '¡Increíble jugada! 🔥',
    likes: 12,
    isLiked: false,
    createdAt: '2h',
  },
  {
    id: '2',
    userId: '2',
    username: 'maria_coach',
    userPhoto: 'https://i.pravatar.cc/150?img=2',
    text: 'Great technique! Keep it up 💪',
    likes: 8,
    isLiked: false,
    createdAt: '1h',
  },
];

export default function PostCommentsScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const { user } = useAuth();
  const [comments, setComments] = useState(MOCK_COMMENTS);
  const [newComment, setNewComment] = useState('');

  const handleLikeComment = (commentId: string) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setComments(comments.map(c =>
      c.id === commentId
        ? { ...c, isLiked: !c.isLiked, likes: c.isLiked ? c.likes - 1 : c.likes + 1 }
        : c
    ));
  };

  const handleAddComment = () => {
    if (!newComment.trim() || !user) return;

    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    const comment: Comment = {
      id: Date.now().toString(),
      userId: user.id,
      username: user.username,
      userPhoto: user.profilePhoto,
      text: newComment.trim(),
      likes: 0,
      isLiked: false,
      createdAt: 'now',
    };

    setComments([comment, ...comments]);
    setNewComment('');
  };

  const renderComment = ({ item }: { item: Comment }) => (
    <View style={styles.commentItem}>
      <Image source={{ uri: item.userPhoto }} style={styles.commentAvatar} />
      <View style={styles.commentContent}>
        <View style={styles.commentHeader}>
          <Text style={[styles.commentUsername, { color: theme.text }]}>{item.username}</Text>
          <Text style={[styles.commentTime, { color: theme.textSecondary }]}>{item.createdAt}</Text>
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
        <Pressable onPress={() => router.back()} style={styles.closeButton}>
          <X size={24} color={theme.text} />
        </Pressable>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.content}
        keyboardVerticalOffset={0}
      >
        <FlatList
          data={comments}
          renderItem={renderComment}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.commentsList}
          showsVerticalScrollIndicator={false}
        />

        <View style={[styles.inputContainer, { backgroundColor: theme.card, borderTopColor: theme.border }]}>
          {user && (
            <Image source={{ uri: user.profilePhoto }} style={styles.inputAvatar} />
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
            style={[
              styles.sendButton,
              { backgroundColor: newComment.trim() ? COLORS.primary : theme.border }
            ]}
          >
            <Send size={18} color={COLORS.white} />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
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
    borderBottomWidth: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 4,
  },
  content: {
    flex: 1,
  },
  commentsList: {
    padding: 16,
  },
  commentItem: {
    flexDirection: 'row',
    marginBottom: 20,
    gap: 12,
  },
  commentAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  commentContent: {
    flex: 1,
  },
  commentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  commentUsername: {
    fontSize: 14,
    fontWeight: '600',
  },
  commentTime: {
    fontSize: 12,
  },
  commentText: {
    fontSize: 14,
    lineHeight: 18,
    marginBottom: 6,
  },
  commentLike: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  commentLikes: {
    fontSize: 12,
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 12,
    borderTopWidth: 1,
    gap: 10,
    alignItems: 'flex-end',
  },
  inputAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
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
