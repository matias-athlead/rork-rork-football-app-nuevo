import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, SafeAreaView, Linking, Platform } from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { Settings, Crown, Grid3x3, BarChart3, MapPin } from 'lucide-react-native';
import { useTheme } from '@/src/hooks/useTheme';
import { useAuth } from '@/src/hooks/useAuth';
import { COLORS } from '@/src/utils/theme';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';

const POSTS_STORAGE_KEY = '@athlead_user_posts';

export default function ProfileScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const { user } = useAuth();
  const [userPosts, setUserPosts] = useState<any[]>([]);

  const loadUserPosts = useCallback(async () => {
    if (!user) return;
    try {
      const postsData = await AsyncStorage.getItem(POSTS_STORAGE_KEY);
      if (postsData) {
        const allPosts = JSON.parse(postsData);
        setUserPosts(allPosts[user.id] || []);
      }
    } catch (error) {
      console.log('Error loading posts:', error);
    }
  }, [user]);

  const handleOpenMaps = async () => {
    if (!user?.city) return;
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    
    const city = encodeURIComponent(user.city);
    const url = Platform.select({
      ios: `maps://app?q=${city}`,
      android: `geo:0,0?q=${city}`,
      default: `https://www.google.com/maps/search/?api=1&query=${city}`,
    }) as string;

    try {
      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) {
        await Linking.openURL(url);
      } else if (Platform.OS !== 'web') {
        const webUrl = `https://www.google.com/maps/search/?api=1&query=${city}`;
        await Linking.openURL(webUrl);
      }
    } catch (error) {
      console.log('Error opening maps:', error);
    }
  };

  useEffect(() => {
    loadUserPosts();
  }, [loadUserPosts]);

  if (!user) return null;

  const stats = [
    { label: 'Posts', value: userPosts.length.toString() },
    { label: 'Followers', value: user.followers.toLocaleString() },
    { label: 'Following', value: user.following.toLocaleString() },
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { backgroundColor: theme.background }]}>
        <Text style={[styles.headerTitle, { color: theme.text }]}>{user.username}</Text>
        <Pressable onPress={() => router.push('/settings' as any)} style={styles.iconButton}>
          <Settings size={24} color={theme.text} />
        </Pressable>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.profileSection}>
          <View style={styles.avatarContainer}>
            <Image source={{ uri: user.profilePhoto }} style={styles.avatar} />
            {user.isPremium && (
              <View style={styles.premiumBadge}>
                <Crown size={16} color={COLORS.white} />
              </View>
            )}
          </View>

          <View style={styles.statsContainer}>
            {stats.map((stat, index) => (
              <View key={index} style={styles.stat}>
                <Text style={[styles.statValue, { color: theme.text }]}>{stat.value}</Text>
                <Text style={[styles.statLabel, { color: theme.textSecondary }]}>{stat.label}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.bioSection}>
          <Text style={[styles.displayName, { color: theme.text }]}>{user.username}</Text>
          <Text style={[styles.role, { color: theme.textSecondary }]}>
            {user.role.toUpperCase()}
          </Text>
          {user.bio && (
            <Text style={[styles.bio, { color: theme.text }]}>{user.bio}</Text>
          )}
          <Pressable onPress={handleOpenMaps} style={styles.locationContainer}>
            <MapPin size={14} color={COLORS.skyBlue} />
            <Text style={[styles.location, { color: COLORS.skyBlue }]}>
              {user.city} • {user.federation}
            </Text>
          </Pressable>
        </View>

        {user.role === 'player' && 'stats' in user && (
          <View style={[styles.statsCard, { backgroundColor: theme.card }]}>
            <Text style={[styles.statsTitle, { color: theme.text }]}>Performance Stats</Text>
            <View style={styles.statsGrid}>
              <View style={styles.statItem}>
                <Text style={styles.statEmoji}>⚡</Text>
                <Text style={[styles.statItemValue, { color: theme.text }]}>{user.stats.speed}</Text>
                <Text style={[styles.statItemLabel, { color: theme.textSecondary }]}>Speed</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statEmoji}>⚽</Text>
                <Text style={[styles.statItemValue, { color: theme.text }]}>{user.stats.goals}</Text>
                <Text style={[styles.statItemLabel, { color: theme.textSecondary }]}>Goals</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statEmoji}>🎯</Text>
                <Text style={[styles.statItemValue, { color: theme.text }]}>{user.stats.passAccuracy}%</Text>
                <Text style={[styles.statItemLabel, { color: theme.textSecondary }]}>Accuracy</Text>
              </View>
            </View>
          </View>
        )}

        <View style={styles.actionButtons}>
          <Pressable
            onPress={() => router.push('/edit-profile' as any)}
            style={[styles.actionButton, { backgroundColor: theme.card, borderColor: theme.border }]}
          >
            <Text style={[styles.actionButtonText, { color: theme.text }]}>Edit Profile</Text>
          </Pressable>
          {!user.isPremium && (
            <Pressable
              onPress={() => router.push('/premium' as any)}
              style={[styles.actionButton, { backgroundColor: COLORS.primary }]}
            >
              <Crown size={16} color={COLORS.white} />
              <Text style={styles.premiumButtonText}>Upgrade to Premium</Text>
            </Pressable>
          )}
        </View>

        <View style={styles.tabsContainer}>
          <Pressable style={[styles.tab, styles.tabActive]}>
            <Grid3x3 size={20} color={theme.text} />
          </Pressable>
          <Pressable 
            onPress={() => router.push('/radar-stats' as any)}
            style={styles.tab}
          >
            <BarChart3 size={20} color={theme.textSecondary} />
          </Pressable>
        </View>

        <View style={styles.postsGrid}>
          {userPosts.length > 0 ? (
            userPosts.map((post, index) => (
              <Pressable key={index} style={styles.postItem}>
                <Image
                  source={{ uri: post.thumbnailUrl }}
                  style={styles.postImage}
                  contentFit="cover"
                />
              </Pressable>
            ))
          ) : (
            <View style={[styles.emptyState, { backgroundColor: theme.card }]}>
              <Text style={[styles.emptyText, { color: theme.textSecondary }]}>No posts yet</Text>
              <Text style={[styles.emptySubtext, { color: theme.textSecondary }]}>Tap + to create your first post</Text>
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
    paddingVertical: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },

  iconButton: {
    padding: 4,
  },
  profileSection: {
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  avatarContainer: {
    position: 'relative',
    alignSelf: 'flex-start',
    marginBottom: 16,
  },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
  },
  premiumBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: COLORS.skyBlue,
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 24,
  },
  stat: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  statLabel: {
    fontSize: 13,
    marginTop: 2,
  },
  bioSection: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 4,
  },
  displayName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  role: {
    fontSize: 12,
    fontWeight: '600',
  },
  bio: {
    fontSize: 14,
    lineHeight: 20,
    marginTop: 4,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
    paddingVertical: 4,
  },
  location: {
    fontSize: 13,
    fontWeight: '500',
  },
  statsCard: {
    marginHorizontal: 20,
    padding: 20,
    borderRadius: 16,
    marginBottom: 16,
  },
  statsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
    gap: 4,
  },
  statEmoji: {
    fontSize: 24,
  },
  statItemValue: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  statItemLabel: {
    fontSize: 12,
  },
  actionButtons: {
    paddingHorizontal: 20,
    gap: 12,
    marginBottom: 20,
  },
  actionButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 10,
    gap: 8,
    borderWidth: 1,
  },
  actionButtonText: {
    fontSize: 15,
    fontWeight: '600',
  },
  premiumButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.white,
  },
  tabsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  tab: {
    padding: 12,
  },
  tabActive: {
    borderBottomWidth: 2,
    borderBottomColor: COLORS.primary,
  },
  postsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 20,
    gap: 2,
  },
  postItem: {
    width: '32.5%',
    aspectRatio: 1,
  },
  postImage: {
    width: '100%',
    height: '100%',
  },
  emptyState: {
    width: '100%',
    padding: 40,
    borderRadius: 16,
    alignItems: 'center',
    gap: 8,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
  },
  emptySubtext: {
    fontSize: 14,
  },
});
