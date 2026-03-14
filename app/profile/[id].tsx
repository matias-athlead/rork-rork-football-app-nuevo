import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, SafeAreaView, FlatList, Platform } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, MapPin, Heart, MessageCircle } from 'lucide-react-native';
import { Image } from 'expo-image';
import Avatar from '@/src/components/Avatar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '@/src/hooks/useTheme';
import { useAuth } from '@/src/hooks/useAuth';
import { authService } from '@/src/services/authService';
import { notificationService } from '@/src/services/notificationService';
import { socialService } from '@/src/services/socialService';
import { COLORS } from '@/src/utils/theme';
import * as Haptics from 'expo-haptics';
import { Post } from '@/src/types/Post';
import { User } from '@/src/types/User';
import * as Linking from 'expo-linking';

const POSTS_STORAGE_KEY = '@athlead_user_posts';

export default function ProfileDetailScreen() {
  const { theme } = useTheme();
  const { user: currentUser, updateUser } = useAuth();
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const [isFollowing, setIsFollowing] = useState(false);
  const [activeTab, setActiveTab] = useState<'posts' | 'stats'>('posts');
  const [user, setUser] = useState<User | null>(null);
  const [userPosts, setUserPosts] = useState<Post[]>([]);

  useEffect(() => {
    const loadProfile = async () => {
      const userId = Array.isArray(id) ? id[0] : id;
      const users = await authService.getAllUsers();
      const found = users.find(u => u.id === userId) ?? null;
      setUser(found);
      if (found) {
        const postsData = await AsyncStorage.getItem(POSTS_STORAGE_KEY);
        if (postsData) {
          const allPosts = JSON.parse(postsData);
          setUserPosts(allPosts[found.id] || []);
        }
        const following = await socialService.isFollowing(found.id);
        setIsFollowing(following);
      }
    };
    loadProfile();
  }, [id]);

  const isOwnProfile = currentUser?.id === user?.id;

  const handleFollow = async () => {
    if (!user || !currentUser) return;
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    const { isFollowing: nowFollowing, targetFollowers } = await socialService.toggleFollow(user.id, currentUser.id);
    setIsFollowing(nowFollowing);
    // Update displayed follower count instantly
    setUser(prev => prev ? { ...prev, followers: targetFollowers } : prev);
    // Sync current user's following count in auth state
    const delta = nowFollowing ? 1 : -1;
    updateUser({ ...currentUser, following: Math.max(0, (currentUser.following || 0) + delta) });
    if (nowFollowing) {
      void notificationService.addNotification(
        user.id,
        {
          type: 'follow',
          userId: currentUser.id,
          username: currentUser.username,
          userPhoto: currentUser.profilePhoto,
          content: 'started following you',
          isRead: false,
        },
        '👤 New follower',
        `${currentUser.username} started following you`,
      );
    }
  };

  const handleMessage = () => {
    if (!user) return;
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    router.push(`/chat/${user.id}`);
  };

  const handleLocationPress = () => {
    if (user?.city) {
      const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(user.city)}`;
      Linking.openURL(url);
    }
  };

  const renderPost = ({ item }: { item: Post }) => {
    return (
      <Pressable
        onPress={() => router.push(`/post/${item.id}` as any)}
        style={styles.gridPost}
      >
        <Image source={{ uri: item.thumbnailUrl }} style={styles.gridPostImage} contentFit="cover" />
        <View style={styles.videoIndicatorBadge}>
          <Text style={styles.videoIndicatorBadgeText}>▶</Text>
        </View>
        <View style={styles.gridPostOverlay}>
          <View style={styles.gridPostStats}>
            <Heart size={16} color={COLORS.white} fill={item.isLiked ? COLORS.white : 'transparent'} />
            <Text style={styles.gridPostStatText}>{item.likes}</Text>
          </View>
          <View style={styles.gridPostStats}>
            <MessageCircle size={16} color={COLORS.white} />
            <Text style={styles.gridPostStatText}>{item.comments}</Text>
          </View>
        </View>
      </Pressable>
    );
  };

  if (!user) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={[styles.header, { backgroundColor: theme.background, borderBottomColor: theme.border }]}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <ArrowLeft size={24} color={theme.text} />
          </Pressable>
          <Text style={[styles.title, { color: theme.text }]}>Profile</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.emptyState}>
          <Text style={[styles.emptyStateText, { color: theme.textSecondary }]}>User not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { backgroundColor: theme.background, borderBottomColor: theme.border }]}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color={theme.text} />
        </Pressable>
        <Text style={[styles.title, { color: theme.text }]}>{user.username}</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <Image source={{ uri: user.coverPhoto }} style={styles.coverPhoto} />
        
        <View style={styles.content}>
          <View style={styles.avatarContainer}>
            <Avatar uri={user.profilePhoto} username={user.username} size={120} style={{ borderWidth: 4, borderColor: COLORS.white }} />
          </View>

          <Text style={[styles.username, { color: theme.text }]}>{user.fullName}</Text>
          <Text style={[styles.handle, { color: theme.textSecondary }]}>@{user.username}</Text>
          <Text style={[styles.role, { color: theme.textSecondary }]}>
            {user.role ? user.role.toUpperCase() : 'USER'}
          </Text>

          {user.bio && (
            <Text style={[styles.bio, { color: theme.text }]}>{user.bio}</Text>
          )}

          {user.city && (
            <Pressable onPress={handleLocationPress} style={styles.locationContainer}>
              <MapPin size={16} color={COLORS.skyBlue} />
              <Text style={[styles.locationText, { color: COLORS.skyBlue }]}>{user.city}</Text>
            </Pressable>
          )}

          <View style={styles.statsContainer}>
            <View style={styles.stat}>
              <Text style={[styles.statValue, { color: theme.text }]}>{userPosts.length}</Text>
              <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Posts</Text>
            </View>
            <View style={styles.stat}>
              <Text style={[styles.statValue, { color: theme.text }]}>{user.followers}</Text>
              <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Followers</Text>
            </View>
            <View style={styles.stat}>
              <Text style={[styles.statValue, { color: theme.text }]}>{user.following}</Text>
              <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Following</Text>
            </View>
          </View>

          {!isOwnProfile && (
            <View style={styles.actionsContainer}>
              <Pressable
                onPress={handleFollow}
                style={[styles.followButton, { backgroundColor: isFollowing ? theme.card : COLORS.primary, borderWidth: isFollowing ? 1 : 0, borderColor: theme.border }]}
              >
                <Text style={[styles.followButtonText, { color: isFollowing ? theme.text : COLORS.white }]}>
                  {isFollowing ? 'Following' : 'Follow'}
                </Text>
              </Pressable>
              <Pressable
                onPress={handleMessage}
                style={[styles.messageButton, { backgroundColor: theme.card, borderColor: theme.border }]}
              >
                <Text style={[styles.messageButtonText, { color: theme.text }]}>Message</Text>
              </Pressable>
            </View>
          )}

          <View style={[styles.tabBar, { borderBottomColor: theme.border }]}>
            <Pressable
              onPress={() => setActiveTab('posts')}
              style={[styles.tabItem, activeTab === 'posts' && styles.tabItemActive]}
            >
              <Text style={[styles.tabText, { color: activeTab === 'posts' ? theme.text : theme.textSecondary }]}>
                Posts
              </Text>
            </Pressable>
            <Pressable
              onPress={() => setActiveTab('stats')}
              style={[styles.tabItem, activeTab === 'stats' && styles.tabItemActive]}
            >
              <Text style={[styles.tabText, { color: activeTab === 'stats' ? theme.text : theme.textSecondary }]}>
                Stats
              </Text>
            </Pressable>
          </View>

          {activeTab === 'posts' ? (
            userPosts.length > 0 ? (
              <FlatList
                data={userPosts}
                renderItem={renderPost}
                keyExtractor={(item) => item.id}
                numColumns={3}
                scrollEnabled={false}
                contentContainerStyle={styles.postsGrid}
                columnWrapperStyle={styles.postsGridRow}
              />
            ) : (
              <View style={styles.emptyState}>
                <Text style={[styles.emptyStateText, { color: theme.textSecondary }]}>No posts yet</Text>
              </View>
            )
          ) : (
            <View style={[styles.statsSection, { backgroundColor: theme.card }]}>
              <Text style={[styles.statsSectionTitle, { color: theme.text }]}>Profile Statistics</Text>
              {user.role === 'player' && 'stats' in user && (
                <View style={styles.statsGrid}>
                  <View style={styles.statCard}>
                    <Text style={[styles.statCardValue, { color: theme.text }]}>{user.stats.goals}</Text>
                    <Text style={[styles.statCardLabel, { color: theme.textSecondary }]}>Goals</Text>
                  </View>
                  <View style={styles.statCard}>
                    <Text style={[styles.statCardValue, { color: theme.text }]}>{user.stats.assists}</Text>
                    <Text style={[styles.statCardLabel, { color: theme.textSecondary }]}>Assists</Text>
                  </View>
                  <View style={styles.statCard}>
                    <Text style={[styles.statCardValue, { color: theme.text }]}>{user.stats.matchesPlayed}</Text>
                    <Text style={[styles.statCardLabel, { color: theme.textSecondary }]}>Matches</Text>
                  </View>
                  <View style={styles.statCard}>
                    <Text style={[styles.statCardValue, { color: theme.text }]}>{user.stats.passAccuracy}%</Text>
                    <Text style={[styles.statCardLabel, { color: theme.textSecondary }]}>Pass Accuracy</Text>
                  </View>
                </View>
              )}
            </View>
          )}
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
    borderBottomWidth: 1,
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
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  handle: {
    fontSize: 15,
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
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 16,
  },
  locationText: {
    fontSize: 14,
    fontWeight: '600',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginBottom: 24,
    paddingVertical: 16,
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
  actionsContainer: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
    marginBottom: 24,
  },
  followButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  followButtonText: {
    fontSize: 15,
    fontWeight: '600',
  },
  messageButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
  },
  messageButtonText: {
    fontSize: 15,
    fontWeight: '600',
  },
  tabBar: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    marginBottom: 16,
    width: '100%',
  },
  tabItem: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  tabItemActive: {
    borderBottomWidth: 2,
    borderBottomColor: COLORS.primary,
  },
  tabText: {
    fontSize: 15,
    fontWeight: '600',
  },
  postsGrid: {
    paddingBottom: 20,
  },
  postsGridRow: {
    gap: 2,
    marginBottom: 2,
  },
  gridPost: {
    flex: 1,
    aspectRatio: 1,
    position: 'relative',
  },
  gridPostImage: {
    width: '100%',
    height: '100%',
  },
  gridPostOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
    opacity: 0,
  },
  gridPostStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  gridPostStatText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '600',
  },
  emptyState: {
    paddingVertical: 60,
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: 15,
  },
  statsSection: {
    padding: 20,
    borderRadius: 12,
    marginTop: 8,
  },
  statsSectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    width: '48%',
    padding: 16,
    alignItems: 'center',
  },
  statCardValue: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statCardLabel: {
    fontSize: 13,
  },
  videoIndicatorBadge: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  videoIndicatorBadgeText: {
    color: COLORS.white,
    fontSize: 10,
  },
});
