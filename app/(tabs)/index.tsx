import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, SafeAreaView, Platform, PanResponder, Animated, Dimensions } from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { Heart, MessageCircle, Share2, UserPlus, Bell, Send, Flag, MapPin, Music, Users } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Sharing from 'expo-sharing';
import { useTheme } from '@/src/hooks/useTheme';
import { MOCK_POSTS } from '@/src/services/mockData';
import { Post } from '@/src/types/Post';
import { COLORS } from '@/src/utils/theme';
import * as Haptics from 'expo-haptics';
import { useTranslation } from 'react-i18next';
import VideoPlayer from '@/src/components/VideoPlayer';

export default function HomeScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<'forYou' | 'following'>('forYou');
  const [posts, setPosts] = useState(MOCK_POSTS);
  const [metadataIndexMap, setMetadataIndexMap] = useState<{[key: string]: number}>({});
  const panX = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const screenWidth = Dimensions.get('window').width;
  const POSTS_STORAGE_KEY = '@athlead_user_posts';

  useEffect(() => {
    const loadPosts = async () => {
      try {
        const postsData = await AsyncStorage.getItem(POSTS_STORAGE_KEY);
        if (postsData) {
          const allPosts = JSON.parse(postsData);
          const userPosts = [];
          for (const userId in allPosts) {
            userPosts.push(...allPosts[userId]);
          }
          if (userPosts.length > 0) {
            setPosts([...userPosts, ...MOCK_POSTS]);
          }
        }
      } catch (error) {
        console.log('Error loading posts:', error);
      }
    };
    loadPosts();
  }, []);

  useEffect(() => {
    const intervals: {[key: string]: ReturnType<typeof setInterval>} = {};
    
    posts.forEach(post => {
      const metadataItems = [];
      if (post.location) metadataItems.push('location');
      if (post.musicTitle) metadataItems.push('music');
      if (post.clubTag) metadataItems.push('club');
      
      if (metadataItems.length > 1) {
        intervals[post.id] = setInterval(() => {
          setMetadataIndexMap(prev => ({
            ...prev,
            [post.id]: ((prev[post.id] || 0) + 1) % metadataItems.length
          }));
        }, 3000);
      }
    });

    return () => {
      Object.values(intervals).forEach(clearInterval);
    };
  }, [posts]);

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) => {
        const isDraggingLeft = gestureState.dx < 0;
        const isHorizontal = Math.abs(gestureState.dx) > Math.abs(gestureState.dy);
        return isDraggingLeft && isHorizontal && Math.abs(gestureState.dx) > 5;
      },
      onPanResponderGrant: () => {
        if (Platform.OS !== 'web') {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
      },
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dx < 0) {
          const progress = Math.min(Math.abs(gestureState.dx) / 100, 1);
          panX.setValue(gestureState.dx);
          opacity.setValue(progress * 0.3);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        const velocity = gestureState.vx;
        const shouldNavigate = gestureState.dx < -60 || velocity < -0.5;
        
        if (shouldNavigate) {
          if (Platform.OS !== 'web') {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          }
          Animated.parallel([
            Animated.timing(panX, {
              toValue: -screenWidth,
              duration: 280,
              useNativeDriver: true,
            }),
            Animated.timing(opacity, {
              toValue: 1,
              duration: 280,
              useNativeDriver: true,
            }),
          ]).start(() => {
            panX.setValue(0);
            opacity.setValue(0);
            router.push('/messages');
          });
        } else {
          Animated.parallel([
            Animated.spring(panX, {
              toValue: 0,
              tension: 65,
              friction: 8,
              useNativeDriver: true,
            }),
            Animated.timing(opacity, {
              toValue: 0,
              duration: 200,
              useNativeDriver: true,
            }),
          ]).start();
        }
      },
    })
  ).current;

  const handleLike = (postId: string) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setPosts(posts.map(p => 
      p.id === postId ? { ...p, isLiked: !p.isLiked, likes: p.isLiked ? p.likes - 1 : p.likes + 1 } : p
    ));
  };

  const handleComment = (postId: string) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    router.push(`/post-comments/${postId}` as any);
  };

  const handleVote = (postId: string) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    setPosts(posts.map(p => 
      p.id === postId ? { ...p, votes: (p.votes || 0) + (p.isVoted ? -1 : 1), isVoted: !p.isVoted } : p
    ));
  };

  const handleShare = async (post: Post) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    try {
      if (Platform.OS === 'web') {
        if (navigator.share) {
          await navigator.share({
            title: `${post.username}'s post`,
            text: post.caption,
            url: post.videoUrl
          });
        } else {
          await navigator.clipboard.writeText(post.videoUrl);
          alert('Link copied to clipboard!');
        }
      } else {
        const isAvailable = await Sharing.isAvailableAsync();
        if (isAvailable) {
          await Sharing.shareAsync(post.videoUrl, {
            dialogTitle: `Share ${post.username}'s post`
          });
        }
      }
    } catch (error) {
      console.log('Share error:', error);
    }
  };

  const renderPost = ({ item }: { item: Post }) => {
    const metadataItems = [];
    if (item.location) metadataItems.push({ type: 'location', content: item.location });
    if (item.musicTitle) metadataItems.push({ 
      type: 'music', 
      content: `${item.musicTitle}${item.musicArtist ? ' • ' + item.musicArtist : ''}` 
    });
    if (item.clubTag) metadataItems.push({ type: 'club', content: `@${item.clubTag}` });
    
    const metadataIndex = metadataIndexMap[item.id] || 0;
    const currentMetadata = metadataItems[metadataIndex % metadataItems.length];

    return (
    <View style={[styles.postCard, { backgroundColor: theme.card }]}>
      <Pressable onPress={() => router.push(`/profile/${item.userId}` as any)} style={styles.postHeader}>
        <Image source={{ uri: item.userPhoto }} style={styles.postAvatar} />
        <View style={styles.postHeaderInfo}>
          <Text style={[styles.postUsername, { color: theme.text }]}>{item.username}</Text>
          <Text style={[styles.postRole, { color: theme.textSecondary }]}>{item.userRole ? item.userRole.toUpperCase() : 'USER'}</Text>
        </View>
        <Pressable style={styles.followButton}>
          <UserPlus size={16} color={COLORS.white} />
        </Pressable>
      </Pressable>

      <View style={styles.videoWrapper}>
        <VideoPlayer
          uri={item.videoUrl}
          style={styles.postImage}
          autoPlay={false}
          loop={true}
          showControls={true}
          forceMute={!!(item as any).musicUrl}
        />
        
        {currentMetadata && (
          <View style={styles.metadataOverlay}>
            <View style={styles.overlayItemSingle}>
              {currentMetadata.type === 'location' && <MapPin size={14} color={COLORS.white} />}
              {currentMetadata.type === 'music' && <Music size={14} color={COLORS.white} />}
              {currentMetadata.type === 'club' && <Users size={14} color={COLORS.white} />}
              <Text style={styles.overlayText} numberOfLines={1}>{currentMetadata.content}</Text>
            </View>
          </View>
        )}
      </View>

      <View style={styles.postActions}>
        <View style={styles.leftActions}>
          <Pressable onPress={() => handleLike(item.id)} style={styles.actionBtn}>
            <Heart
              size={26}
              color={item.isLiked ? COLORS.error : theme.text}
              fill={item.isLiked ? COLORS.error : 'transparent'}
            />
          </Pressable>
          <Pressable onPress={() => handleComment(item.id)} style={styles.actionBtn}>
            <MessageCircle size={26} color={theme.text} />
          </Pressable>
          <Pressable onPress={() => handleVote(item.id)} style={styles.actionBtn}>
            <Flag
              size={26}
              color={item.isVoted ? COLORS.skyBlue : theme.text}
              fill={item.isVoted ? COLORS.skyBlue : 'transparent'}
            />
          </Pressable>
          <Pressable onPress={() => handleShare(item)} style={styles.actionBtn}>
            <Share2 size={26} color={theme.text} />
          </Pressable>
        </View>
      </View>

      <View style={styles.postInfo}>
        <Text style={[styles.likesCount, { color: theme.text }]}>{item.likes} {t('home.likes')}</Text>
        <Text style={[styles.postCaption, { color: theme.text }]} numberOfLines={2}>
          <Text style={styles.captionUsername}>{item.username}</Text> {item.caption}
        </Text>
        <Text style={styles.postHashtags}>{item.hashtags.join(' ')}</Text>
        {item.comments > 0 && (
          <Text style={[styles.viewComments, { color: theme.textSecondary }]}>
            View all {item.comments} {t('home.comments')}
          </Text>
        )}
        {(item.votes || 0) > 0 && (
          <Text style={[styles.votesCount, { color: COLORS.skyBlue }]}>
            {item.votes} {item.votes === 1 ? 'vote' : 'votes'}
          </Text>
        )}
      </View>
    </View>
    );
  };

  const filteredPosts = activeTab === 'following' 
    ? posts.filter(p => Math.random() > 0.5)
    : posts;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.topHeader, { backgroundColor: theme.background, borderBottomColor: theme.border }]}>
        <Text style={[styles.logo, { color: theme.text }]}>Athlead</Text>
        <View style={styles.headerIcons}>
          <Pressable onPress={() => router.push('/messages')} style={styles.headerIcon}>
            <Send size={24} color={theme.text} />
          </Pressable>
          <Pressable onPress={() => router.push('/notifications' as any)} style={styles.headerIcon}>
            <Bell size={24} color={theme.text} />
          </Pressable>
        </View>
      </View>

      <View style={[styles.tabHeader, { backgroundColor: theme.background }]}>
        <Pressable
          onPress={() => setActiveTab('following')}
          style={[styles.tab, activeTab === 'following' && styles.tabActive]}
        >
          <Text style={[styles.tabText, { color: activeTab === 'following' ? theme.text : theme.textSecondary }]}>
            Following
          </Text>
        </Pressable>
        <Pressable
          onPress={() => setActiveTab('forYou')}
          style={[styles.tab, activeTab === 'forYou' && styles.tabActive]}
        >
          <Text style={[styles.tabText, { color: activeTab === 'forYou' ? theme.text : theme.textSecondary }]}>
            For You
          </Text>
        </Pressable>
      </View>

      <View style={styles.feedWrapper}>
        {activeTab === 'forYou' && (
          <Animated.View
            style={[
              styles.swipeIndicator,
              {
                opacity,
              },
            ]}
            pointerEvents="none"
          >
            <View style={[styles.swipeIndicatorContent, { backgroundColor: theme.card }]}>
              <Send size={24} color={COLORS.skyBlue} />
              <Text style={[styles.swipeIndicatorText, { color: theme.text }]}>Messages</Text>
            </View>
          </Animated.View>
        )}
        <Animated.View
          style={[
            styles.feedContainer,
            {
              transform: [{ translateX: panX }],
            },
          ]}
          {...(activeTab === 'forYou' ? panResponder.panHandlers : {})}
        >
          <FlatList
          data={filteredPosts}
          renderItem={renderPost}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          scrollEnabled={true}
          />
        </Animated.View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  feedWrapper: {
    flex: 1,
    position: 'relative',
  },
  feedContainer: {
    flex: 1,
  },
  swipeIndicator: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    width: 120,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  swipeIndicatorContent: {
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  swipeIndicatorText: {
    fontSize: 13,
    fontWeight: '600',
  },
  topHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  logo: {
    fontSize: 24,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  headerIcons: {
    flexDirection: 'row',
    gap: 16,
  },
  headerIcon: {
    padding: 4,
  },
  tabHeader: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 8,
    gap: 24,
  },
  tab: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  tabActive: {
    borderBottomWidth: 2,
    borderBottomColor: COLORS.primary,
  },
  tabText: {
    fontSize: 16,
    fontWeight: '700',
  },
  listContent: {
    paddingBottom: 20,
  },
  postCard: {
    marginBottom: 24,
    borderRadius: 12,
    overflow: 'hidden',
    marginHorizontal: 12,
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  postAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  postHeaderInfo: {
    flex: 1,
    marginLeft: 12,
  },
  postUsername: {
    fontSize: 15,
    fontWeight: '600',
  },
  postRole: {
    fontSize: 11,
    marginTop: 2,
  },
  followButton: {
    backgroundColor: COLORS.skyBlue,
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
  },
  videoWrapper: {
    position: 'relative',
    width: '100%',
  },
  postImage: {
    width: '100%',
    height: 400,
  },
  metadataOverlay: {
    position: 'absolute',
    top: 16,
    left: 16,
    right: 16,
  },
  overlayItemSingle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(0,0,0,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  overlayText: {
    color: COLORS.white,
    fontSize: 13,
    fontWeight: '500',
    maxWidth: 200,
  },
  postActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  leftActions: {
    flexDirection: 'row',
    gap: 16,
  },
  actionBtn: {
    padding: 4,
  },
  postInfo: {
    paddingHorizontal: 12,
    paddingBottom: 12,
  },
  likesCount: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 6,
  },
  postCaption: {
    fontSize: 14,
    lineHeight: 18,
    marginBottom: 4,
  },
  captionUsername: {
    fontWeight: '600',
  },
  postHashtags: {
    fontSize: 14,
    color: COLORS.skyBlue,
    marginTop: 4,
  },
  viewComments: {
    fontSize: 13,
    marginTop: 6,
  },
  votesCount: {
    fontSize: 13,
    fontWeight: '600',
    marginTop: 4,
  },
});
