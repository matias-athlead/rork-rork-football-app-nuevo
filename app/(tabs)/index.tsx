import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  View, Text, StyleSheet, FlatList, Pressable, Platform,
  Animated, Dimensions, ViewabilityConfig, ViewToken,
  Modal, Alert, ScrollView, TextInput,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  Heart, MessageCircle, Send, Flag, MapPin, Music,
  Users, Repeat2, UserX, Share, Search, X, Download,
  Video, UserPlus, Bell, Play, Pause, Plus,
} from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Sharing from 'expo-sharing';
import * as MediaLibrary from 'expo-media-library';
import { File, Paths } from 'expo-file-system';
import { useTheme } from '@/src/hooks/useTheme';
import { Post } from '@/src/types/Post';
import { User } from '@/src/types/User';
import { COLORS } from '@/src/utils/theme';
import * as Haptics from 'expo-haptics';
import { useTranslation } from 'react-i18next';
import VideoPlayer from '@/src/components/VideoPlayer';
import Avatar from '@/src/components/Avatar';
import { useAuth } from '@/src/hooks/useAuth';
import { authService } from '@/src/services/authService';
import { notificationService } from '@/src/services/notificationService';
import { socialService } from '@/src/services/socialService';

const REPOSTS_STORAGE_KEY = '@athlead_user_reposts';
const FOLLOWED_USERS_KEY = '@athlead_followed_users';
const DELETED_POSTS_KEY = '@athlead_deleted_posts';
const DOUBLE_TAP_DELAY = 300;

const formatCount = (n: number): string => {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return String(n);
};

export default function HomeScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const { t } = useTranslation();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'forYou' | 'following'>('forYou');
  const [posts, setPosts] = useState<Post[]>([]);
  const [visiblePostId, setVisiblePostId] = useState<string>('');
  const [followedUsers, setFollowedUsers] = useState<string[]>([]);
  const [deletedPostIds, setDeletedPostIds] = useState<string[]>([]);
  const [blockedUserIds, setBlockedUserIds] = useState<string[]>([]);
  const [showLongPressMenu, setShowLongPressMenu] = useState(false);
  const [userReposts, setUserReposts] = useState<{[key: string]: boolean}>({});
  const [showSendModal, setShowSendModal] = useState(false);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [sendSearchQuery, setSendSearchQuery] = useState('');
  const [pausedPostIds, setPausedPostIds] = useState<Set<string>>(new Set());
  const [feedHeight, setFeedHeight] = useState(Dimensions.get('window').height);
  const [registeredUsers, setRegisteredUsers] = useState<User[]>([]);

  const POSTS_STORAGE_KEY = '@athlead_user_posts';

  // Animation refs
  const likeAnimationMap = useRef<{[key: string]: Animated.Value}>({});
  const playPauseAnimMap = useRef<{[key: string]: Animated.Value}>({});
  const likeButtonAnimMap = useRef<{[key: string]: Animated.Value}>({});
  const singleTapTimerRef = useRef<{[key: string]: ReturnType<typeof setTimeout>}>({});
  const lastTapMap = useRef<{[key: string]: number}>({});

  // Swipe-to-messages animation
  const panX = useRef(new Animated.Value(0)).current;
  const swipeOpacity = useRef(new Animated.Value(0)).current;

  const viewabilityConfig: ViewabilityConfig = { itemVisiblePercentThreshold: 60 };

  // ── Data loading ────────────────────────────────────────────────────────────

  useEffect(() => {
    const load = async () => {
      try {
        const stored = await AsyncStorage.getItem(FOLLOWED_USERS_KEY);
        setFollowedUsers(stored ? JSON.parse(stored) : []);
      } catch {}
    };
    void load();
  }, []);

  useEffect(() => {
    const load = async () => {
      if (!user) return;
      try {
        const raw = await AsyncStorage.getItem(REPOSTS_STORAGE_KEY);
        if (raw) {
          const reposts = JSON.parse(raw);
          const userRepostsList = reposts[user.id] || [];
          const map: {[key: string]: boolean} = {};
          userRepostsList.forEach((r: any) => { map[r.originalPostId || r.id] = true; });
          setUserReposts(map);
        }
      } catch {}
    };
    void load();
  }, [user]);

  useEffect(() => {
    const load = async () => {
      try {
        const raw = await AsyncStorage.getItem(DELETED_POSTS_KEY);
        setDeletedPostIds(raw ? JSON.parse(raw) : []);
      } catch {}
    };
    void load();
  }, []);

  useEffect(() => {
    const load = async () => {
      const ids = await socialService.getBlockedUserIds();
      setBlockedUserIds(ids);
    };
    void load();
  }, []);

  useEffect(() => {
    const load = async () => {
      try {
        const [postsData, likedPosts] = await Promise.all([
          AsyncStorage.getItem(POSTS_STORAGE_KEY),
          socialService.getLikedPosts(),
        ]);
        if (postsData) {
          const allPosts = JSON.parse(postsData);
          const flat: Post[] = [];
          for (const uid in allPosts) flat.push(...allPosts[uid]);
          const sorted = flat
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
            .map(p => ({ ...p, isLiked: !!likedPosts[p.id] }));
          setPosts(sorted);
        }
      } catch {}
    };
    void load();
  }, []);

  useEffect(() => {
    const load = async () => {
      try { setRegisteredUsers(await authService.getAllUsers()); } catch {}
    };
    void load();
  }, []);

  const onViewableItemsChanged = useRef(({ viewableItems }: { viewableItems: ViewToken[] }) => {
    if (viewableItems.length > 0) {
      setVisiblePostId(viewableItems[0].item.id);
    }
  }).current;

  // ── Helpers ─────────────────────────────────────────────────────────────────

  const getAnim = (map: React.MutableRefObject<{[key: string]: Animated.Value}>, id: string, initial = 0) => {
    if (!map.current[id]) map.current[id] = new Animated.Value(initial);
    return map.current[id];
  };

  // ── Interaction handlers ─────────────────────────────────────────────────────

  const handleLike = (postId: string, fromDoubleTap = false) => {
    if (Platform.OS !== 'web') void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const post = posts.find(p => p.id === postId);
    if (!post) return;
    if (fromDoubleTap && post.isLiked) return; // double-tap only likes, never unlikes

    // Animate like button
    const btnAnim = getAnim(likeButtonAnimMap, postId, 1);
    Animated.sequence([
      Animated.spring(btnAnim, { toValue: 1.4, useNativeDriver: true, friction: 3 }),
      Animated.spring(btnAnim, { toValue: 1, useNativeDriver: true, friction: 3 }),
    ]).start();

    setPosts(prev => prev.map(p =>
      p.id === postId ? { ...p, isLiked: !p.isLiked, likes: p.isLiked ? p.likes - 1 : p.likes + 1 } : p
    ));
    void socialService.toggleLike(postId);
    if (!post.isLiked && user && post.userId !== user.id) {
      void notificationService.addNotification(
        post.userId,
        { type: 'like', userId: user.id, username: user.username, userPhoto: user.profilePhoto,
          content: 'liked your post', postId: post.id, postThumbnail: post.thumbnailUrl, isRead: false },
        '❤️ New like', `${user.username} liked your post`,
      );
    }
  };

  const handleComment = (postId: string) => {
    if (Platform.OS !== 'web') void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push(`/post-comments/${postId}` as any);
  };

  const handleReport = (post: Post) => {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setShowLongPressMenu(false);
    const report = (reason: string) => {
      if (user) void socialService.reportPost(post.id, reason, user.id);
      Alert.alert('Reported', 'Thanks for helping keep our community safe.');
    };
    Alert.alert('Report Post', 'Why are you reporting this post?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Inappropriate content', onPress: () => report('Inappropriate Content') },
      { text: 'Spam', onPress: () => report('Spam') },
      { text: 'Harassment', onPress: () => report('Harassment') },
      { text: 'False information', onPress: () => report('False Information') },
    ]);
  };

  const handleShareOutside = async (post: Post) => {
    if (Platform.OS !== 'web') void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setShowLongPressMenu(false);
    try {
      if (Platform.OS === 'web') {
        if (navigator.share) {
          await navigator.share({ title: `${post.username}'s post`, text: post.caption, url: post.videoUrl });
        } else {
          await navigator.clipboard.writeText(post.videoUrl);
          alert('Link copied!');
        }
      } else {
        const available = await Sharing.isAvailableAsync();
        if (available) await Sharing.shareAsync(post.videoUrl, { dialogTitle: `Share ${post.username}'s post` });
      }
    } catch {}
  };

  const handleRepost = async (post: Post) => {
    if (!user) return;
    if (Platform.OS !== 'web') void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setShowLongPressMenu(false);
    const originalPostId = post.originalPostId || post.id;
    try {
      const raw = await AsyncStorage.getItem(REPOSTS_STORAGE_KEY);
      const reposts = raw ? JSON.parse(raw) : {};
      if (!reposts[user.id]) reposts[user.id] = [];
      const repost = { ...post, id: `repost_${Date.now()}`, originalPostId,
        repostedBy: user.id, repostedByUsername: user.username,
        repostedByPhoto: user.profilePhoto, repostedAt: new Date().toISOString() };
      reposts[user.id].unshift(repost);
      await AsyncStorage.setItem(REPOSTS_STORAGE_KEY, JSON.stringify(reposts));
      setUserReposts(prev => ({ ...prev, [originalPostId]: true }));
      setPosts(prev => [repost, ...prev]);
      if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Success', 'Post reposted to your profile!');
    } catch { Alert.alert('Error', 'Failed to repost'); }
  };

  const handleRemoveRepost = async (post: Post) => {
    if (!user) return;
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setShowLongPressMenu(false);
    const originalPostId = post.originalPostId || post.id;
    try {
      const raw = await AsyncStorage.getItem(REPOSTS_STORAGE_KEY);
      if (raw) {
        const reposts = JSON.parse(raw);
        if (reposts[user.id]) {
          reposts[user.id] = reposts[user.id].filter((r: any) => (r.originalPostId || r.id) !== originalPostId);
          await AsyncStorage.setItem(REPOSTS_STORAGE_KEY, JSON.stringify(reposts));
          setUserReposts(prev => { const n = { ...prev }; delete n[originalPostId]; return n; });
          setPosts(prev => prev.filter(p => !(p.repostedBy === user.id && (p.originalPostId || p.id) === originalPostId)));
          if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          Alert.alert('Success', 'Repost removed!');
        }
      }
    } catch { Alert.alert('Error', 'Failed to remove repost'); }
  };

  const handleBlockUser = (post: Post) => {
    if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    setShowLongPressMenu(false);
    Alert.alert('Block User', `Block @${post.username}?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Block', style: 'destructive', onPress: async () => {
        await socialService.blockUser(post.userId, post.username, post.userPhoto || '');
        setBlockedUserIds(prev => [...prev, post.userId]);
        setPosts(prev => prev.filter(p => p.userId !== post.userId));
        Alert.alert('Blocked', `You have blocked @${post.username}`);
      }},
    ]);
  };

  const handleSendToUsers = (post: Post) => {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedPost(post);
    setSendSearchQuery('');
    setShowSendModal(true);
  };

  const handleToggleUserSelection = (userId: string) => {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedUsers(prev => prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]);
  };

  const sendPostToUser = async (userId: string, post: Post) => {
    const key = `@chat_messages_${userId}`;
    const raw = await AsyncStorage.getItem(key);
    const msgs = raw ? JSON.parse(raw) : [];
    msgs.push({ id: `${Date.now()}${Math.random()}`, text: '',
      postData: { id: post.id, userId: post.userId, username: post.username, userPhoto: post.userPhoto,
        videoUrl: post.videoUrl, thumbnailUrl: post.thumbnailUrl, caption: post.caption, likes: post.likes },
      isSent: true, createdAt: new Date().toISOString() });
    await AsyncStorage.setItem(key, JSON.stringify(msgs));
  };

  const handleConfirmSend = async () => {
    if (selectedUsers.length === 0) { Alert.alert('Error', 'Select at least one user'); return; }
    if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    if (selectedPost) {
      for (const uid of selectedUsers) { try { await sendPostToUser(uid, selectedPost); } catch {} }
    }
    Alert.alert('Sent!', `Post sent to ${selectedUsers.length} user${selectedUsers.length > 1 ? 's' : ''}`);
    setShowSendModal(false); setSelectedUsers([]); setSelectedPost(null); setSendSearchQuery('');
  };

  const handleQuickSend = async (userId: string, username: string) => {
    if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    if (selectedPost) { try { await sendPostToUser(userId, selectedPost); } catch {} }
    Alert.alert('Sent!', `Post sent to ${username}`);
    setShowSendModal(false); setSelectedUsers([]); setSelectedPost(null); setSendSearchQuery('');
  };

  const handleDownloadVideo = async (post: Post) => {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setShowLongPressMenu(false);
    try {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') { Alert.alert('Permission Required', 'Need permission to save videos'); return; }
      Alert.alert('Downloading', 'Your video is being downloaded...');
      const downloaded = await File.downloadFileAsync(post.videoUrl, Paths.cache);
      if (downloaded?.exists) {
        const asset = await MediaLibrary.createAssetAsync(downloaded.uri);
        await MediaLibrary.createAlbumAsync('Athlead', asset, false);
        if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Alert.alert('Success', 'Video saved to your gallery!');
      }
    } catch { Alert.alert('Error', 'Failed to download video'); }
  };

  const handleFollowToggle = async (userId: string, username?: string, userPhoto?: string) => {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      const { isFollowing: nowFollowing, followedUsers: updatedList } = await socialService.toggleFollow(userId, user?.id);
      setFollowedUsers(updatedList);
      if (nowFollowing && user && userId !== user.id) {
        void notificationService.addNotification(userId, {
          type: 'follow', userId: user.id, username: user.username, userPhoto: user.profilePhoto,
          content: 'started following you', isRead: false,
        });
      }
      if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {}
  };

  const handleLongPress = (post: Post) => {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    setSelectedPost(post);
    setShowLongPressMenu(true);
  };

  // ── Double-tap / single-tap detection ───────────────────────────────────────

  const showHeartAnim = (postId: string) => {
    const anim = getAnim(likeAnimationMap, postId);
    Animated.sequence([
      Animated.spring(anim, { toValue: 1, useNativeDriver: true, friction: 3 }),
      Animated.timing(anim, { toValue: 0, duration: 300, delay: 500, useNativeDriver: true }),
    ]).start();
  };

  const showPlayPauseAnim = (postId: string) => {
    const anim = getAnim(playPauseAnimMap, postId);
    Animated.sequence([
      Animated.timing(anim, { toValue: 1, duration: 80, useNativeDriver: true }),
      Animated.timing(anim, { toValue: 0, duration: 300, delay: 600, useNativeDriver: true }),
    ]).start();
  };

  const handleVideoTap = (item: Post) => {
    const now = Date.now();
    const lastTap = lastTapMap.current[item.id] || 0;

    if (now - lastTap < DOUBLE_TAP_DELAY) {
      // Double tap — like + heart animation
      clearTimeout(singleTapTimerRef.current[item.id]);
      if (Platform.OS !== 'web') void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      showHeartAnim(item.id);
      handleLike(item.id, true);
    } else {
      // Might be single tap — wait to confirm
      singleTapTimerRef.current[item.id] = setTimeout(() => {
        // Single tap confirmed — toggle pause
        setPausedPostIds(prev => {
          const next = new Set(prev);
          if (next.has(item.id)) next.delete(item.id); else next.add(item.id);
          return next;
        });
        showPlayPauseAnim(item.id);
      }, DOUBLE_TAP_DELAY);
    }
    lastTapMap.current[item.id] = now;
  };

  // ── Filtered posts ───────────────────────────────────────────────────────────

  const filteredPosts = useMemo(() => {
    const base = activeTab === 'following'
      ? posts.filter(p => followedUsers.includes(p.userId))
      : posts;
    return base.filter(p =>
      !deletedPostIds.includes(p.id) &&
      !deletedPostIds.includes(p.originalPostId || '') &&
      !blockedUserIds.includes(p.userId)
    );
  }, [activeTab, posts, followedUsers, deletedPostIds, blockedUserIds]);

  const chatUsers = useMemo(() => registeredUsers.slice(0, 15), [registeredUsers]);
  const filteredChatUsers = useMemo(() => {
    if (!sendSearchQuery.trim()) return chatUsers;
    const q = sendSearchQuery.toLowerCase();
    return chatUsers.filter(u => u.username.toLowerCase().includes(q) || u.fullName.toLowerCase().includes(q));
  }, [sendSearchQuery, chatUsers]);

  // ── Render post (TikTok fullscreen) ─────────────────────────────────────────

  const renderPost = ({ item }: { item: Post }) => {
    const isVisible = visiblePostId === item.id;
    const isPaused = pausedPostIds.has(item.id);
    const isFollowing = followedUsers.includes(item.userId);
    const isOwnPost = user?.id === item.userId;
    const isReposted = !!(item.repostedBy && item.repostedByUsername);

    const likeAnim = getAnim(likeAnimationMap, item.id);
    const playPauseAnim = getAnim(playPauseAnimMap, item.id);
    const likeScale = getAnim(likeButtonAnimMap, item.id, 1);

    return (
      <View style={[styles.postCard, { height: feedHeight }]}>
        {/* Full-screen video */}
        <VideoPlayer
          uri={item.videoUrl}
          style={StyleSheet.absoluteFill}
          autoPlay={false}
          loop={true}
          showControls={false}
          isVisible={isVisible}
          paused={isPaused}
        />

        {/* Tap overlay: single tap = play/pause, double tap = like, long press = menu */}
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={() => handleVideoTap(item)}
          onLongPress={() => handleLongPress(item)}
          delayLongPress={600}
        />

        {/* Heart animation (double tap) */}
        <Animated.View
          style={[styles.heartAnimation, {
            opacity: likeAnim,
            transform: [{ scale: likeAnim.interpolate({ inputRange: [0, 1], outputRange: [0.5, 1.3] }) }],
          }]}
          pointerEvents="none"
        >
          <Heart size={100} color={COLORS.white} fill={COLORS.white} />
        </Animated.View>

        {/* Play/Pause animation (single tap) */}
        <Animated.View style={[styles.playPauseAnimation, { opacity: playPauseAnim }]} pointerEvents="none">
          <View style={styles.playPauseBg}>
            {isPaused
              ? <Play size={44} color={COLORS.white} fill={COLORS.white} />
              : <Pause size={44} color={COLORS.white} fill={COLORS.white} />
            }
          </View>
        </Animated.View>

        {/* Top overlay: header tabs */}
        <View style={styles.topOverlay} pointerEvents="box-none">
          <View style={styles.overlayHeader} pointerEvents="box-none">
            <Pressable onPress={() => router.push('/messages')} style={styles.overlayIconBtn}>
              <Send size={22} color={COLORS.white} />
            </Pressable>
            <View style={styles.tabRow}>
              <Pressable onPress={() => setActiveTab('following')} style={styles.tabBtn}>
                <Text style={[styles.tabBtnText, activeTab === 'following' && styles.tabBtnActive]}>Following</Text>
                {activeTab === 'following' && <View style={styles.tabUnderline} />}
              </Pressable>
              <Pressable onPress={() => setActiveTab('forYou')} style={styles.tabBtn}>
                <Text style={[styles.tabBtnText, activeTab === 'forYou' && styles.tabBtnActive]}>For You</Text>
                {activeTab === 'forYou' && <View style={styles.tabUnderline} />}
              </Pressable>
            </View>
            <Pressable onPress={() => router.push('/notifications' as any)} style={styles.overlayIconBtn}>
              <Bell size={22} color={COLORS.white} />
            </Pressable>
          </View>
        </View>

        {/* Right side buttons */}
        <View style={styles.sideButtons} pointerEvents="box-none">
          {/* Avatar + follow */}
          <View style={styles.avatarContainer}>
            <Pressable onPress={() => router.push(`/profile/${item.userId}` as any)}>
              <Avatar uri={item.userPhoto} username={item.username} size={48}
                style={{ borderWidth: 2, borderColor: COLORS.white }} />
            </Pressable>
            {!isOwnPost && (
              <Pressable
                onPress={() => handleFollowToggle(item.userId, item.username, item.userPhoto)}
                style={[styles.followPill, { backgroundColor: isFollowing ? 'transparent' : COLORS.error }]}
              >
                {isFollowing
                  ? <Text style={styles.followPillTextFollowing}>✓</Text>
                  : <Plus size={14} color={COLORS.white} />
                }
              </Pressable>
            )}
          </View>

          {/* Like button */}
          <Pressable style={styles.sideBtn} onPress={() => handleLike(item.id)}>
            <Animated.View style={{ transform: [{ scale: likeScale }] }}>
              <Heart
                size={36}
                color={item.isLiked ? COLORS.error : COLORS.white}
                fill={item.isLiked ? COLORS.error : 'transparent'}
              />
            </Animated.View>
            <Text style={styles.sideBtnCount}>{formatCount(item.likes)}</Text>
          </Pressable>

          {/* Comment button */}
          <Pressable style={styles.sideBtn} onPress={() => handleComment(item.id)}>
            <MessageCircle size={36} color={COLORS.white} />
            <Text style={styles.sideBtnCount}>{formatCount(item.comments || 0)}</Text>
          </Pressable>

          {/* Share button */}
          <Pressable style={styles.sideBtn} onPress={() => handleSendToUsers(item)}>
            <Share size={34} color={COLORS.white} />
            <Text style={styles.sideBtnCount}>Share</Text>
          </Pressable>

          {/* Report button */}
          <Pressable style={styles.sideBtn} onPress={() => handleReport(item)}>
            <Flag size={30} color={COLORS.white} />
          </Pressable>
        </View>

        {/* Bottom overlay: user info */}
        <View style={styles.bottomOverlay} pointerEvents="box-none">
          {isReposted && (
            <View style={styles.repostRow}>
              <Repeat2 size={13} color="rgba(255,255,255,0.8)" />
              <Text style={styles.repostLabel}>{item.repostedByUsername} reposted</Text>
            </View>
          )}
          <Pressable onPress={() => router.push(`/profile/${item.userId}` as any)}>
            <Text style={styles.overlayUsername}>@{item.username}</Text>
          </Pressable>
          {item.caption ? (
            <Text style={styles.overlayCaption} numberOfLines={2}>{item.caption}</Text>
          ) : null}
          {item.hashtags && item.hashtags.length > 0 && (
            <Text style={styles.overlayHashtags} numberOfLines={1}>{item.hashtags.join(' ')}</Text>
          )}
          {item.musicTitle ? (
            <View style={styles.musicRow}>
              <Music size={13} color={COLORS.white} />
              <Text style={styles.musicText} numberOfLines={1}>
                {item.musicTitle}{item.musicArtist ? ` • ${item.musicArtist}` : ''}
              </Text>
            </View>
          ) : null}
          {item.location ? (
            <View style={styles.locationRow}>
              <MapPin size={13} color={COLORS.white} />
              <Text style={styles.locationText} numberOfLines={1}>{item.location}</Text>
            </View>
          ) : null}
        </View>
      </View>
    );
  };

  // ── Main render ──────────────────────────────────────────────────────────────

  return (
    <View style={styles.container}>
      <View
        style={styles.feedWrapper}
        onLayout={e => setFeedHeight(e.nativeEvent.layout.height)}
      >
        <FlatList
          data={filteredPosts}
          renderItem={renderPost}
          keyExtractor={item => item.id}
          showsVerticalScrollIndicator={false}
          pagingEnabled
          snapToInterval={feedHeight}
          snapToAlignment="start"
          decelerationRate="fast"
          viewabilityConfig={viewabilityConfig}
          onViewableItemsChanged={onViewableItemsChanged}
          getItemLayout={(_, index) => ({ length: feedHeight, offset: feedHeight * index, index })}
          ListEmptyComponent={() => (
            <View style={[styles.emptyContainer, { height: feedHeight }]}>
              {activeTab === 'following' ? (
                <>
                  <Users size={56} color={COLORS.skyBlue} />
                  <Text style={styles.emptyTitle}>No posts yet</Text>
                  <Text style={styles.emptySubtitle}>Follow players and clubs to see their content here</Text>
                  <Pressable onPress={() => router.push('/(tabs)/search' as any)} style={styles.emptyBtn}>
                    <Search size={18} color={COLORS.white} />
                    <Text style={styles.emptyBtnText}>Discover Players</Text>
                  </Pressable>
                </>
              ) : (
                <>
                  {user && <Text style={styles.emptyWelcome}>Welcome, {user.fullName.split(' ')[0]}!</Text>}
                  <Text style={styles.emptySubtitle}>Your feed is empty.</Text>
                  <Pressable onPress={() => router.push('/(tabs)/create' as any)} style={styles.emptyBtn}>
                    <Video size={18} color={COLORS.white} />
                    <Text style={styles.emptyBtnText}>Share Your First Play</Text>
                  </Pressable>
                </>
              )}
            </View>
          )}
        />
      </View>

      {/* Long press menu modal */}
      <Modal visible={showLongPressMenu} transparent animationType="fade" onRequestClose={() => setShowLongPressMenu(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => setShowLongPressMenu(false)}>
          <View style={[styles.menuSheet, { backgroundColor: theme.card }]}>
            {selectedPost && userReposts[selectedPost.originalPostId || selectedPost.id] ? (
              <Pressable onPress={() => selectedPost && handleRemoveRepost(selectedPost)} style={styles.menuItem}>
                <Repeat2 size={22} color={COLORS.error} />
                <Text style={[styles.menuText, { color: COLORS.error }]}>Remove Repost</Text>
              </Pressable>
            ) : (
              <Pressable onPress={() => selectedPost && handleRepost(selectedPost)} style={styles.menuItem}>
                <Repeat2 size={22} color={theme.text} />
                <Text style={[styles.menuText, { color: theme.text }]}>Repost</Text>
              </Pressable>
            )}
            <View style={[styles.menuDivider, { backgroundColor: theme.border }]} />
            <Pressable onPress={() => selectedPost && handleShareOutside(selectedPost)} style={styles.menuItem}>
              <Share size={22} color={theme.text} />
              <Text style={[styles.menuText, { color: theme.text }]}>Share Outside App</Text>
            </Pressable>
            <View style={[styles.menuDivider, { backgroundColor: theme.border }]} />
            <Pressable onPress={() => selectedPost && handleDownloadVideo(selectedPost)} style={styles.menuItem}>
              <Download size={22} color={theme.text} />
              <Text style={[styles.menuText, { color: theme.text }]}>Download Video</Text>
            </Pressable>
            <View style={[styles.menuDivider, { backgroundColor: theme.border }]} />
            <Pressable onPress={() => selectedPost && handleReport(selectedPost)} style={styles.menuItem}>
              <Flag size={22} color={theme.text} />
              <Text style={[styles.menuText, { color: theme.text }]}>Report</Text>
            </Pressable>
            <View style={[styles.menuDivider, { backgroundColor: theme.border }]} />
            <Pressable onPress={() => selectedPost && handleBlockUser(selectedPost)} style={styles.menuItem}>
              <UserX size={22} color={COLORS.error} />
              <Text style={[styles.menuText, { color: COLORS.error }]}>Block User</Text>
            </Pressable>
            <View style={[styles.menuDivider, { backgroundColor: theme.border }]} />
            <Pressable onPress={() => setShowLongPressMenu(false)} style={styles.menuItem}>
              <Text style={[styles.menuText, { color: theme.textSecondary }]}>Cancel</Text>
            </Pressable>
          </View>
        </Pressable>
      </Modal>

      {/* Send modal */}
      <Modal
        visible={showSendModal}
        transparent
        animationType="slide"
        onRequestClose={() => { setShowSendModal(false); setSelectedUsers([]); setSelectedPost(null); }}
      >
        <View style={styles.sendOverlay}>
          <View style={[styles.sendSheet, { backgroundColor: theme.background }]}>
            <View style={styles.sendHeader}>
              <Text style={[styles.sendTitle, { color: theme.text }]}>Send to</Text>
              <Pressable onPress={() => { setShowSendModal(false); setSelectedUsers([]); setSelectedPost(null); setSendSearchQuery(''); }}>
                <Text style={[styles.sendCancel, { color: COLORS.skyBlue }]}>Cancel</Text>
              </Pressable>
            </View>
            <View style={styles.frequentSection}>
              <Text style={[styles.frequentLabel, { color: theme.textSecondary }]}>Frequent</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {chatUsers.slice(0, 8).map(u => (
                  <Pressable key={u.id} onPress={() => handleQuickSend(u.id, u.username)} style={styles.frequentItem}>
                    <Avatar uri={u.profilePhoto} username={u.username} size={52} style={{ marginBottom: 4 }} />
                    <Text style={[styles.frequentName, { color: theme.text }]} numberOfLines={1}>{u.username}</Text>
                  </Pressable>
                ))}
              </ScrollView>
            </View>
            <View style={[styles.searchBox, { backgroundColor: theme.inputBackground }]}>
              <Search size={16} color={theme.textSecondary} />
              <TextInput
                style={[styles.searchInput, { color: theme.text }]}
                placeholder="Search users..."
                placeholderTextColor={theme.textSecondary}
                value={sendSearchQuery}
                onChangeText={setSendSearchQuery}
              />
              {sendSearchQuery.length > 0 && (
                <Pressable onPress={() => setSendSearchQuery('')}><X size={16} color={theme.textSecondary} /></Pressable>
              )}
            </View>
            <ScrollView style={styles.userList}>
              {filteredChatUsers.map(u => {
                const sel = selectedUsers.includes(u.id);
                return (
                  <Pressable key={u.id} onPress={() => handleToggleUserSelection(u.id)}
                    style={[styles.userItem, { backgroundColor: sel ? `${COLORS.skyBlue}20` : 'transparent' }]}>
                    <Avatar uri={u.profilePhoto} username={u.username} size={44} />
                    <View style={styles.userItemInfo}>
                      <Text style={[styles.userItemName, { color: theme.text }]}>{u.username}</Text>
                      <Text style={[styles.userItemFull, { color: theme.textSecondary }]}>{u.fullName}</Text>
                    </View>
                    <View style={[styles.checkbox, { borderColor: sel ? COLORS.skyBlue : theme.border, backgroundColor: sel ? COLORS.skyBlue : 'transparent' }]}>
                      {sel && <Text style={styles.checkmark}>✓</Text>}
                    </View>
                  </Pressable>
                );
              })}
              {filteredChatUsers.length === 0 && (
                <View style={styles.noUsers}>
                  <Text style={[styles.noUsersText, { color: theme.textSecondary }]}>No users found</Text>
                </View>
              )}
            </ScrollView>
            <Pressable
              onPress={handleConfirmSend}
              disabled={selectedUsers.length === 0}
              style={[styles.sendBtn, { backgroundColor: selectedUsers.length > 0 ? COLORS.skyBlue : theme.border }]}
            >
              <Text style={[styles.sendBtnText, { color: selectedUsers.length > 0 ? COLORS.white : theme.textSecondary }]}>
                Send to {selectedUsers.length} user{selectedUsers.length !== 1 ? 's' : ''}
              </Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  feedWrapper: { flex: 1 },

  // Post card (fullscreen)
  postCard: { width: '100%', backgroundColor: '#000', overflow: 'hidden' },

  // Animations
  heartAnimation: {
    position: 'absolute', top: '50%', left: '50%',
    marginLeft: -50, marginTop: -50, zIndex: 20, pointerEvents: 'none',
  },
  playPauseAnimation: {
    position: 'absolute', top: '50%', left: '50%',
    marginLeft: -44, marginTop: -44, zIndex: 20, pointerEvents: 'none',
  },
  playPauseBg: {
    width: 88, height: 88, borderRadius: 44,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center', alignItems: 'center',
  },

  // Top overlay
  topOverlay: {
    position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10,
    paddingTop: Platform.OS === 'android' ? 36 : 8,
  },
  overlayHeader: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 8,
  },
  overlayIconBtn: { padding: 6, width: 40, alignItems: 'center' },
  tabRow: { flexDirection: 'row', alignItems: 'center', gap: 24 },
  tabBtn: { alignItems: 'center', paddingVertical: 4 },
  tabBtnText: { fontSize: 16, fontWeight: '600', color: 'rgba(255,255,255,0.65)' },
  tabBtnActive: { color: COLORS.white },
  tabUnderline: { height: 2, width: '100%', backgroundColor: COLORS.white, marginTop: 3, borderRadius: 1 },

  // Right side buttons
  sideButtons: {
    position: 'absolute', right: 12, bottom: 120, zIndex: 10,
    alignItems: 'center', gap: 20,
  },
  avatarContainer: { alignItems: 'center', marginBottom: 4 },
  followPill: {
    width: 22, height: 22, borderRadius: 11,
    justifyContent: 'center', alignItems: 'center',
    marginTop: -10, borderWidth: 2, borderColor: COLORS.white,
  },
  followPillTextFollowing: { color: COLORS.white, fontSize: 12, fontWeight: '700' },
  sideBtn: { alignItems: 'center', gap: 4 },
  sideBtnCount: { color: COLORS.white, fontSize: 13, fontWeight: '600', textShadowColor: 'rgba(0,0,0,0.5)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 2 },

  // Bottom overlay
  bottomOverlay: {
    position: 'absolute', left: 0, right: 90, bottom: 90, zIndex: 10,
    paddingHorizontal: 16, gap: 4,
  },
  repostRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 2 },
  repostLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 12, fontWeight: '500' },
  overlayUsername: {
    color: COLORS.white, fontSize: 16, fontWeight: '700',
    textShadowColor: 'rgba(0,0,0,0.6)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 3,
  },
  overlayCaption: {
    color: COLORS.white, fontSize: 14, lineHeight: 19,
    textShadowColor: 'rgba(0,0,0,0.6)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 3,
  },
  overlayHashtags: { color: COLORS.skyBlue, fontSize: 13, fontWeight: '500' },
  musicRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  musicText: { color: COLORS.white, fontSize: 13, flex: 1 },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  locationText: { color: COLORS.white, fontSize: 13, flex: 1 },

  // Empty state
  emptyContainer: { justifyContent: 'center', alignItems: 'center', paddingHorizontal: 40, gap: 16 },
  emptyWelcome: { fontSize: 22, fontWeight: '700', color: COLORS.white },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: COLORS.white },
  emptySubtitle: { fontSize: 15, color: 'rgba(255,255,255,0.7)', textAlign: 'center', lineHeight: 22 },
  emptyBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: COLORS.skyBlue, paddingHorizontal: 24, paddingVertical: 14, borderRadius: 24, marginTop: 8 },
  emptyBtnText: { color: COLORS.white, fontSize: 15, fontWeight: '700' },

  // Long press menu
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  menuSheet: { width: '88%', borderRadius: 16, overflow: 'hidden' },
  menuItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 17, paddingHorizontal: 20, gap: 14 },
  menuText: { fontSize: 16, fontWeight: '500' },
  menuDivider: { height: 1, marginLeft: 54 },

  // Send modal
  sendOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  sendSheet: { borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingTop: 20, maxHeight: '80%' },
  sendHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingBottom: 14, borderBottomWidth: 1, borderBottomColor: 'rgba(128,128,128,0.2)' },
  sendTitle: { fontSize: 18, fontWeight: '700' },
  sendCancel: { fontSize: 16, fontWeight: '600' },
  frequentSection: { paddingVertical: 14, paddingLeft: 20, borderBottomWidth: 1, borderBottomColor: 'rgba(128,128,128,0.2)' },
  frequentLabel: { fontSize: 13, fontWeight: '600', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 },
  frequentItem: { alignItems: 'center', marginRight: 14, width: 60 },
  frequentName: { fontSize: 11, fontWeight: '500', textAlign: 'center' },
  searchBox: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 20, marginVertical: 12, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12, gap: 8 },
  searchInput: { flex: 1, fontSize: 15 },
  userList: { flex: 1, paddingHorizontal: 20 },
  userItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 10, borderRadius: 10, marginTop: 6, gap: 12 },
  userItemInfo: { flex: 1 },
  userItemName: { fontSize: 15, fontWeight: '600' },
  userItemFull: { fontSize: 13, marginTop: 1 },
  checkbox: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, justifyContent: 'center', alignItems: 'center' },
  checkmark: { color: COLORS.white, fontSize: 13, fontWeight: '700' },
  sendBtn: { marginHorizontal: 20, marginVertical: 18, paddingVertical: 15, borderRadius: 12, alignItems: 'center' },
  sendBtnText: { fontSize: 16, fontWeight: '700' },
  noUsers: { paddingVertical: 36, alignItems: 'center' },
  noUsersText: { fontSize: 15 },
});
