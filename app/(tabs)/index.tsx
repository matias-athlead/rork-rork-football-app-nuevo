import React, { useState, useRef, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, SafeAreaView, Platform, PanResponder, Animated, Dimensions, ViewabilityConfig, ViewToken, Modal, Alert, ScrollView, TextInput } from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { Heart, MessageCircle, UserPlus, Bell, Send, Flag, MapPin, Music, Users, Repeat2, UserX, Share, Search, X } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Sharing from 'expo-sharing';
import { useTheme } from '@/src/hooks/useTheme';
import { MOCK_POSTS, MOCK_USERS } from '@/src/services/mockData';
import { Post } from '@/src/types/Post';
import { COLORS } from '@/src/utils/theme';
import * as Haptics from 'expo-haptics';
import { useTranslation } from 'react-i18next';
import VideoPlayer from '@/src/components/VideoPlayer';
import { useAuth } from '@/src/hooks/useAuth';

const REPOSTS_STORAGE_KEY = '@athlead_user_reposts';
const FOLLOWED_USERS_KEY = '@athlead_followed_users';

export default function HomeScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const { t } = useTranslation();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'forYou' | 'following'>('forYou');
  const [posts, setPosts] = useState(MOCK_POSTS);
  const [metadataIndexMap, setMetadataIndexMap] = useState<{[key: string]: number}>({});
  const [visiblePostIds, setVisiblePostIds] = useState<string[]>([]);
  const [followedUsers, setFollowedUsers] = useState<string[]>([]);
  const [showLongPressMenu, setShowLongPressMenu] = useState(false);
  const [showSendModal, setShowSendModal] = useState(false);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [sendSearchQuery, setSendSearchQuery] = useState('');
  const panX = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const screenWidth = Dimensions.get('window').width;
  const POSTS_STORAGE_KEY = '@athlead_user_posts';
  const lastTapMap = useRef<{[key: string]: number}>({});
  const likeAnimationMap = useRef<{[key: string]: Animated.Value}>({});

  const viewabilityConfig: ViewabilityConfig = {
    itemVisiblePercentThreshold: 50,
  };

  useEffect(() => {
    const loadFollowedUsers = async () => {
      try {
        const stored = await AsyncStorage.getItem(FOLLOWED_USERS_KEY);
        if (stored) {
          setFollowedUsers(JSON.parse(stored));
        } else {
          const randomFollowed = MOCK_USERS.slice(0, 15).map(u => u.id);
          setFollowedUsers(randomFollowed);
          await AsyncStorage.setItem(FOLLOWED_USERS_KEY, JSON.stringify(randomFollowed));
        }
      } catch (error) {
        console.log('Error loading followed users:', error);
      }
    };
    loadFollowedUsers();
  }, []);

  const onViewableItemsChanged = useRef(({ viewableItems }: { viewableItems: ViewToken[] }) => {
    const visibleIds = viewableItems.map(item => item.item.id);
    setVisiblePostIds(visibleIds);
  }).current;

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

  const handleShareOutside = async (post: Post) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setShowLongPressMenu(false);
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

  const handleRepost = async (post: Post) => {
    if (!user) return;
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    setShowLongPressMenu(false);

    try {
      const existingReposts = await AsyncStorage.getItem(REPOSTS_STORAGE_KEY);
      const reposts = existingReposts ? JSON.parse(existingReposts) : {};
      
      if (!reposts[user.id]) {
        reposts[user.id] = [];
      }

      const repost = {
        ...post,
        id: `repost_${Date.now()}`,
        originalPostId: post.id,
        repostedBy: user.id,
        repostedByUsername: user.username,
        repostedAt: new Date().toISOString(),
      };

      reposts[user.id].unshift(repost);
      await AsyncStorage.setItem(REPOSTS_STORAGE_KEY, JSON.stringify(reposts));

      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      Alert.alert('Success', 'Post reposted to your profile!');
    } catch (error) {
      console.log('Error reposting:', error);
      Alert.alert('Error', 'Failed to repost');
    }
  };

  const handleReport = (post: Post) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    setShowLongPressMenu(false);
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

  const handleBlockUser = (post: Post) => {
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    }
    setShowLongPressMenu(false);
    Alert.alert(
      'Block User',
      `Are you sure you want to block @${post.username}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Block',
          style: 'destructive',
          onPress: () => {
            if (Platform.OS !== 'web') {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            }
            Alert.alert('Blocked', `You have blocked @${post.username}`);
          },
        },
      ]
    );
  };

  const handleSendToUsers = (post: Post) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setSelectedPost(post);
    setSendSearchQuery('');
    setShowSendModal(true);
  };

  const handleToggleUserSelection = (userId: string) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setSelectedUsers(prev => 
      prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
    );
  };

  const handleConfirmSend = () => {
    if (selectedUsers.length === 0) {
      Alert.alert('Error', 'Please select at least one user');
      return;
    }
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    Alert.alert('Sent!', `Post sent to ${selectedUsers.length} user${selectedUsers.length > 1 ? 's' : ''}`);
    setShowSendModal(false);
    setSelectedUsers([]);
    setSelectedPost(null);
    setSendSearchQuery('');
  };

  const handleDoubleTap = (postId: string) => {
    const now = Date.now();
    const DOUBLE_TAP_DELAY = 300;
    const lastTap = lastTapMap.current[postId] || 0;

    if (now - lastTap < DOUBLE_TAP_DELAY) {
      const post = posts.find(p => p.id === postId);
      if (post && !post.isLiked) {
        handleLike(postId);
        
        if (!likeAnimationMap.current[postId]) {
          likeAnimationMap.current[postId] = new Animated.Value(0);
        }
        const anim = likeAnimationMap.current[postId];
        
        Animated.sequence([
          Animated.spring(anim, {
            toValue: 1,
            useNativeDriver: true,
            friction: 3,
          }),
          Animated.timing(anim, {
            toValue: 0,
            duration: 300,
            delay: 400,
            useNativeDriver: true,
          }),
        ]).start();
      }
    }
    lastTapMap.current[postId] = now;
  };

  const handleLongPress = (post: Post) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    }
    setSelectedPost(post);
    setShowLongPressMenu(true);
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
    const isVisible = visiblePostIds.includes(item.id);

    if (!likeAnimationMap.current[item.id]) {
      likeAnimationMap.current[item.id] = new Animated.Value(0);
    }
    const likeAnim = likeAnimationMap.current[item.id];

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

      <Pressable 
        onPress={() => handleDoubleTap(item.id)}
        onLongPress={() => handleLongPress(item)}
        delayLongPress={500}
      >
        <View style={styles.videoWrapper}>
          <VideoPlayer
            uri={item.videoUrl}
            style={styles.postImage}
            autoPlay={false}
            loop={true}
            showControls={true}
            forceMute={!!(item as any).musicUrl}
            isVisible={isVisible}
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

          <Animated.View 
            style={[styles.likeAnimationContainer, {
              opacity: likeAnim,
              transform: [{
                scale: likeAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.5, 1.2],
                }),
              }],
            }]}
            pointerEvents="none"
          >
            <Heart size={80} color={COLORS.white} fill={COLORS.white} />
          </Animated.View>
        </View>
      </Pressable>

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
          <Pressable onPress={() => handleSendToUsers(item)} style={styles.actionBtn}>
            <Send size={26} color={theme.text} />
          </Pressable>
        </View>
      </View>

      <View style={styles.postInfo}>
        <Text style={[styles.likesCount, { color: theme.text }]}>{item.likes} {t('home.likes')}</Text>
        <Text style={[styles.postCaption, { color: theme.text }]} numberOfLines={2}>
          <Text style={styles.captionUsername}>{item.username}</Text> {item.caption}
        </Text>
        {item.hashtags && Array.isArray(item.hashtags) && item.hashtags.length > 0 && (
          <Text style={styles.postHashtags}>{item.hashtags.join(' ')}</Text>
        )}
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
    ? posts.filter(p => followedUsers.includes(p.userId))
    : posts;

  const chatUsers = useMemo(() => MOCK_USERS.slice(0, 15), []);

  const filteredChatUsers = useMemo(() => {
    if (!sendSearchQuery.trim()) return chatUsers;
    const query = sendSearchQuery.toLowerCase();
    return chatUsers.filter(user => 
      user.username.toLowerCase().includes(query) ||
      user.fullName.toLowerCase().includes(query)
    );
  }, [sendSearchQuery, chatUsers]);

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
        <Animated.View
          style={[
            styles.feedContainer,
            {
              transform: [{ translateX: panX }],
            },
          ]}
          {...panResponder.panHandlers}
        >
          <FlatList
          data={filteredPosts}
          renderItem={renderPost}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          scrollEnabled={true}
          viewabilityConfig={viewabilityConfig}
          onViewableItemsChanged={onViewableItemsChanged}
          />
        </Animated.View>
      </View>

      <Modal
        visible={showLongPressMenu}
        transparent
        animationType="fade"
        onRequestClose={() => setShowLongPressMenu(false)}
      >
        <Pressable style={styles.longPressOverlay} onPress={() => setShowLongPressMenu(false)}>
          <View style={[styles.longPressMenu, { backgroundColor: theme.card }]}>
            <Pressable 
              onPress={() => selectedPost && handleRepost(selectedPost)} 
              style={styles.longPressItem}
            >
              <Repeat2 size={24} color={theme.text} />
              <Text style={[styles.longPressText, { color: theme.text }]}>Repost</Text>
            </Pressable>
            <View style={[styles.longPressSeparator, { backgroundColor: theme.border }]} />
            <Pressable 
              onPress={() => selectedPost && handleReport(selectedPost)} 
              style={styles.longPressItem}
            >
              <Flag size={24} color={theme.text} />
              <Text style={[styles.longPressText, { color: theme.text }]}>Report</Text>
            </Pressable>
            <View style={[styles.longPressSeparator, { backgroundColor: theme.border }]} />
            <Pressable 
              onPress={() => selectedPost && handleShareOutside(selectedPost)} 
              style={styles.longPressItem}
            >
              <Share size={24} color={theme.text} />
              <Text style={[styles.longPressText, { color: theme.text }]}>Share Outside App</Text>
            </Pressable>
            <View style={[styles.longPressSeparator, { backgroundColor: theme.border }]} />
            <Pressable 
              onPress={() => selectedPost && handleBlockUser(selectedPost)} 
              style={styles.longPressItem}
            >
              <UserX size={24} color={COLORS.error} />
              <Text style={[styles.longPressText, { color: COLORS.error }]}>Block User</Text>
            </Pressable>
            <View style={[styles.longPressSeparator, { backgroundColor: theme.border }]} />
            <Pressable onPress={() => setShowLongPressMenu(false)} style={styles.longPressItem}>
              <Text style={[styles.longPressText, { color: theme.textSecondary }]}>Cancel</Text>
            </Pressable>
          </View>
        </Pressable>
      </Modal>

      <Modal
        visible={showSendModal}
        transparent
        animationType="slide"
        onRequestClose={() => {
          setShowSendModal(false);
          setSelectedUsers([]);
          setSelectedPost(null);
        }}
      >
        <View style={styles.sendModalOverlay}>
          <View style={[styles.sendModalContent, { backgroundColor: theme.background }]}>
            <View style={styles.sendModalHeader}>
              <Text style={[styles.sendModalTitle, { color: theme.text }]}>Send to</Text>
              <Pressable onPress={() => {
                setShowSendModal(false);
                setSelectedUsers([]);
                setSelectedPost(null);
                setSendSearchQuery('');
              }}>
                <Text style={[styles.sendModalCancel, { color: COLORS.skyBlue }]}>Cancel</Text>
              </Pressable>
            </View>
            <View style={[styles.sendModalSearchContainer, { backgroundColor: theme.inputBackground }]}>
              <Search size={18} color={theme.textSecondary} />
              <TextInput
                style={[styles.sendModalSearchInput, { color: theme.text }]}
                placeholder="Search users..."
                placeholderTextColor={theme.textSecondary}
                value={sendSearchQuery}
                onChangeText={setSendSearchQuery}
              />
              {sendSearchQuery.length > 0 && (
                <Pressable onPress={() => setSendSearchQuery('')}>
                  <X size={18} color={theme.textSecondary} />
                </Pressable>
              )}
            </View>
            <ScrollView style={styles.sendModalUserList}>
              {filteredChatUsers.map((mockUser) => {
                const isSelected = selectedUsers.includes(mockUser.id);
                return (
                  <Pressable
                    key={mockUser.id}
                    onPress={() => handleToggleUserSelection(mockUser.id)}
                    style={[styles.sendModalUserItem, { backgroundColor: isSelected ? `${COLORS.skyBlue}20` : 'transparent' }]}
                  >
                    <Image source={{ uri: mockUser.profilePhoto }} style={styles.sendModalAvatar} />
                    <View style={styles.sendModalUserInfo}>
                      <Text style={[styles.sendModalUsername, { color: theme.text }]}>{mockUser.username}</Text>
                      <Text style={[styles.sendModalFullName, { color: theme.textSecondary }]}>{mockUser.fullName}</Text>
                    </View>
                    <View style={[styles.sendModalCheckbox, { 
                      borderColor: isSelected ? COLORS.skyBlue : theme.border, 
                      backgroundColor: isSelected ? COLORS.skyBlue : 'transparent' 
                    }]}>
                      {isSelected && <Text style={styles.sendModalCheck}>✓</Text>}
                    </View>
                  </Pressable>
                );
              })}
              {filteredChatUsers.length === 0 && (
                <View style={styles.sendModalEmpty}>
                  <Text style={[styles.sendModalEmptyText, { color: theme.textSecondary }]}>No users found</Text>
                </View>
              )}
            </ScrollView>
            <Pressable
              onPress={handleConfirmSend}
              style={[styles.sendModalButton, { 
                backgroundColor: selectedUsers.length > 0 ? COLORS.skyBlue : theme.border 
              }]}
              disabled={selectedUsers.length === 0}
            >
              <Text style={[styles.sendModalButtonText, { 
                color: selectedUsers.length > 0 ? COLORS.white : theme.textSecondary 
              }]}>Send to {selectedUsers.length} user{selectedUsers.length !== 1 ? 's' : ''}</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
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
  likeAnimationContainer: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginLeft: -40,
    marginTop: -40,
    pointerEvents: 'none',
  },
  longPressOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  longPressMenu: {
    width: '85%',
    borderRadius: 16,
    overflow: 'hidden',
  },
  longPressItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 18,
    paddingHorizontal: 20,
    gap: 16,
  },
  longPressText: {
    fontSize: 17,
    fontWeight: '500',
  },
  longPressSeparator: {
    height: 1,
    marginLeft: 60,
  },
  sendModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  sendModalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 20,
    maxHeight: '80%',
  },
  sendModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(128,128,128,0.2)',
  },
  sendModalTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  sendModalCancel: {
    fontSize: 16,
    fontWeight: '600',
  },
  sendModalSearchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginHorizontal: 20,
    marginTop: 16,
    marginBottom: 8,
    borderRadius: 12,
    gap: 10,
  },
  sendModalSearchInput: {
    flex: 1,
    fontSize: 15,
  },
  sendModalUserList: {
    flex: 1,
    paddingHorizontal: 20,
  },
  sendModalUserItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 12,
    marginTop: 8,
    gap: 12,
  },
  sendModalAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  sendModalUserInfo: {
    flex: 1,
  },
  sendModalUsername: {
    fontSize: 15,
    fontWeight: '600',
  },
  sendModalFullName: {
    fontSize: 13,
    marginTop: 2,
  },
  sendModalCheckbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendModalCheck: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '700',
  },
  sendModalButton: {
    marginHorizontal: 20,
    marginVertical: 20,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  sendModalButtonText: {
    fontSize: 16,
    fontWeight: '700',
  },
  sendModalEmpty: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  sendModalEmptyText: {
    fontSize: 15,
  },
});
