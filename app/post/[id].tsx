import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, SafeAreaView, Alert, Modal, Platform, Animated, Linking } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, Trash2, Edit3, MoreVertical, Flag, Share2, UserX, MapPin, Music, Users, Heart } from 'lucide-react-native';
import { Image } from 'expo-image';
import { useTheme } from '@/src/hooks/useTheme';
import { MOCK_POSTS } from '@/src/services/mockData';
import { COLORS } from '@/src/utils/theme';
import { useAuth } from '@/src/hooks/useAuth';
import VideoPlayer from '@/src/components/VideoPlayer';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import { Audio } from 'expo-av';

const POSTS_STORAGE_KEY = '@athlead_user_posts';

export default function PostDetailScreen() {
  const { theme } = useTheme();
  const { user } = useAuth();
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const [post, setPost] = useState<any>(null);
  const [showOptionsMenu, setShowOptionsMenu] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [audioSound, setAudioSound] = useState<Audio.Sound | null>(null);
  const lastTap = useRef<number>(0);
  const likeAnimation = useRef(new Animated.Value(0)).current;
  const scrollViewRef = useRef<ScrollView>(null);

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
          setIsLiked(foundPost.isLiked || false);
          setLikeCount(foundPost.likes || 0);
        } else {
          const mockPost = MOCK_POSTS.find(p => p.id === id);
          setPost(mockPost || MOCK_POSTS[0]);
        }
      } else {
        const mockPost = MOCK_POSTS.find(p => p.id === id);
        const postToSet = mockPost || MOCK_POSTS[0];
        setPost(postToSet);
        setIsLiked(postToSet?.isLiked || false);
        setLikeCount(postToSet?.likes || 0);
      }
    } catch (error) {
      console.log('Error loading post:', error);
      const mockPost = MOCK_POSTS.find(p => p.id === id);
      const postToSet = mockPost || MOCK_POSTS[0];
      setPost(postToSet);
      setIsLiked(postToSet?.isLiked || false);
      setLikeCount(postToSet?.likes || 0);
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    return () => {
      if (audioSound) {
        audioSound.unloadAsync();
      }
    };
  }, [audioSound]);

  useEffect(() => {
    loadPost();
  }, [loadPost]);

  useEffect(() => {
    const playMusic = async () => {
      if (post?.musicUrl) {
        try {
          const { sound } = await Audio.Sound.createAsync(
            { uri: post.musicUrl },
            { shouldPlay: true, isLooping: true, volume: 0.5 }
          );
          setAudioSound(sound);
        } catch (error) {
          console.log('Error playing music:', error);
        }
      }
    };
    playMusic();
  }, [post?.musicUrl]);

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

  const handleDoubleTap = () => {
    const now = Date.now();
    const DOUBLE_TAP_DELAY = 300;

    if (now - lastTap.current < DOUBLE_TAP_DELAY) {
      if (!isLiked) {
        setIsLiked(true);
        setLikeCount(prev => prev + 1);
        if (Platform.OS !== 'web') {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        }

        Animated.sequence([
          Animated.spring(likeAnimation, {
            toValue: 1,
            useNativeDriver: true,
            friction: 3,
          }),
          Animated.timing(likeAnimation, {
            toValue: 0,
            duration: 300,
            delay: 400,
            useNativeDriver: true,
          }),
        ]).start();
      }
    }
    lastTap.current = now;
  };

  const handleLocationPress = async () => {
    if (!post?.location) return;
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    
    const location = encodeURIComponent(post.location);
    const url = Platform.select({
      ios: `maps://app?q=${location}`,
      android: `geo:0,0?q=${location}`,
      default: `https://www.google.com/maps/search/?api=1&query=${location}`,
    }) as string;

    try {
      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) {
        await Linking.openURL(url);
      } else if (Platform.OS !== 'web') {
        const webUrl = `https://www.google.com/maps/search/?api=1&query=${location}`;
        await Linking.openURL(webUrl);
      }
    } catch (error) {
      console.log('Error opening maps:', error);
    }
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

      <ScrollView ref={scrollViewRef}>
        <Pressable onPress={handleDoubleTap} style={styles.videoContainer}>
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
          
          {(post.location || post.musicTitle || post.clubTag) && (
            <View style={styles.metadataOverlay}>
              {post.location && (
                <Pressable onPress={handleLocationPress} style={styles.overlayItem}>
                  <MapPin size={14} color={COLORS.white} />
                  <Text style={styles.overlayText} numberOfLines={1}>{post.location}</Text>
                </Pressable>
              )}
              {post.musicTitle && (
                <View style={styles.overlayItem}>
                  <Music size={14} color={COLORS.white} />
                  <Text style={styles.overlayText} numberOfLines={1}>
                    {post.musicTitle} {post.musicArtist ? `• ${post.musicArtist}` : ''}
                  </Text>
                </View>
              )}
              {post.clubTag && (
                <View style={styles.overlayItem}>
                  <Users size={14} color={COLORS.white} />
                  <Text style={styles.overlayText} numberOfLines={1}>@{post.clubTag}</Text>
                </View>
              )}
            </View>
          )}

          <Animated.View 
            style={[styles.likeAnimationContainer, {
              opacity: likeAnimation,
              transform: [{
                scale: likeAnimation.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.5, 1.2],
                }),
              }],
            }]}
          >
            <Heart size={80} color={COLORS.white} fill={COLORS.white} />
          </Animated.View>
        </Pressable>
        
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
            <Pressable onPress={() => {
              setIsLiked(!isLiked);
              setLikeCount(prev => isLiked ? prev - 1 : prev + 1);
              if (Platform.OS !== 'web') {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }
            }}>
              <View style={styles.likeButton}>
                <Heart size={18} color={isLiked ? COLORS.error : theme.textSecondary} fill={isLiked ? COLORS.error : 'none'} />
                <Text style={[styles.statText, { color: theme.textSecondary }]}>
                  {likeCount} likes
                </Text>
              </View>
            </Pressable>
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
  videoContainer: {
    position: 'relative',
  },
  video: {
    width: '100%',
    height: 400,
  },
  metadataOverlay: {
    position: 'absolute',
    top: 16,
    left: 16,
    right: 16,
    gap: 8,
  },
  overlayItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(0,0,0,0.4)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  overlayText: {
    color: COLORS.white,
    fontSize: 13,
    fontWeight: '500',
    flex: 1,
  },
  likeAnimationContainer: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginLeft: -40,
    marginTop: -40,
    pointerEvents: 'none',
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
    alignItems: 'center',
  },
  likeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
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
  metadataSection: {
    marginTop: 12,
    padding: 12,
    backgroundColor: 'rgba(128, 128, 128, 0.05)',
    borderRadius: 8,
    gap: 10,
  },
  metadataItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  metadataText: {
    fontSize: 14,
    flex: 1,
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
