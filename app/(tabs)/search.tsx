import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, TextInput, FlatList, Pressable, SafeAreaView, Platform } from 'react-native';
import Avatar from '@/src/components/Avatar';
import { useRouter } from 'expo-router';
import { Search as SearchIcon, Filter, MapPin, MessageCircle } from 'lucide-react-native';
import { useTheme } from '@/src/hooks/useTheme';
import { useAuth } from '@/src/hooks/useAuth';
import { authService } from '@/src/services/authService';
import { notificationService } from '@/src/services/notificationService';
import { socialService } from '@/src/services/socialService';
import { User, PlayerProfile } from '@/src/types/User';
import { COLORS } from '@/src/utils/theme';
import * as Haptics from 'expo-haptics';

type FilterType = 'all' | 'player' | 'coach' | 'club' | 'premium';

export default function SearchScreen() {
  const { theme } = useTheme();
  const { user: currentUser } = useAuth();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [followingUsers, setFollowingUsers] = useState<Set<string>>(new Set());

  useEffect(() => {
    const load = async () => {
      const [users, followedIds] = await Promise.all([
        authService.getAllUsers(),
        socialService.getFollowedUsers(),
      ]);
      setAllUsers(users.filter(u => u.id !== currentUser?.id));
      setFollowingUsers(new Set(followedIds));
    };
    load();
  }, [currentUser]);

  const filteredUsers = useMemo(() => {
    let result = allUsers;

    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      result = result.filter(user =>
        (user.username || '').toLowerCase().includes(q) ||
        (user.fullName || '').toLowerCase().includes(q) ||
        (user.bio || '').toLowerCase().includes(q)
      );
    }

    if (activeFilter === 'premium') {
      result = result.filter(u => u.isPremium);
    } else if (activeFilter !== 'all') {
      result = result.filter(u => u.role === activeFilter);
    }

    return result;
  }, [allUsers, searchQuery, activeFilter]);

  const handleFollow = useCallback(async (userId: string, username: string, userPhoto: string, event: any) => {
    event.stopPropagation();
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    const { isFollowing: nowFollowing } = await socialService.toggleFollow(userId);
    setFollowingUsers(prev => {
      const newSet = new Set(prev);
      if (nowFollowing) {
        newSet.add(userId);
        if (currentUser && userId !== currentUser.id) {
          void notificationService.addNotification(
            userId,
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
      } else {
        newSet.delete(userId);
      }
      return newSet;
    });
  }, [currentUser]);

  const handleMessage = useCallback((userId: string, event: any) => {
    event.stopPropagation();
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    router.push(`/chat/${userId}` as any);
  }, [router]);

  const renderUser = ({ item }: { item: User }) => (
    <Pressable
      onPress={() => router.push(`/profile/${item.id}` as any)}
      style={[styles.userCard, { backgroundColor: theme.card, borderColor: theme.border }]}
    >
      <Avatar uri={item.profilePhoto} username={item.username} size={64} />
      <View style={styles.userInfo}>
        <View style={styles.userHeader}>
          <Text style={[styles.username, { color: theme.text }]}>{item.username}</Text>
          {item.isPremium && (
            <View style={styles.premiumBadge}>
              <Text style={styles.premiumText}>PRO</Text>
            </View>
          )}
        </View>
        <Text style={[styles.userBio, { color: theme.textSecondary }]} numberOfLines={2}>
          {item.bio}
        </Text>
        <View style={styles.userMeta}>
          <MapPin size={14} color={theme.textSecondary} />
          <Text style={[styles.metaText, { color: theme.textSecondary }]}>
            {[item.city, item.federation].filter(Boolean).join(' • ')}
          </Text>
        </View>
        {item.role === 'player' && (
          <View style={styles.stats}>
            <Text style={[styles.statText, { color: theme.text }]}>
              {`⚡ ${(item as PlayerProfile).stats.speed}`}
            </Text>
            <Text style={[styles.statText, { color: theme.text }]}>
              {`⚽ ${(item as PlayerProfile).stats.goals}`}
            </Text>
            <Text style={[styles.statText, { color: theme.text }]}>
              {`🎯 ${(item as PlayerProfile).stats.passAccuracy}%`}
            </Text>
          </View>
        )}
      </View>
      <View style={styles.actionButtons}>
        <Pressable
          onPress={(e) => handleMessage(item.id, e)}
          style={[styles.messageButton, { backgroundColor: theme.inputBackground }]}
        >
          <MessageCircle size={18} color={theme.text} />
        </Pressable>
        <Pressable
          onPress={(e) => handleFollow(item.id, item.username, item.profilePhoto, e)}
          style={[styles.followButton, {
            backgroundColor: followingUsers.has(item.id) ? theme.card : COLORS.primary,
            borderWidth: followingUsers.has(item.id) ? 1 : 0,
            borderColor: theme.border,
          }]}
        >
          <Text style={[styles.followButtonText, { color: followingUsers.has(item.id) ? theme.text : COLORS.white }]}>
            {followingUsers.has(item.id) ? 'Following' : 'Follow'}
          </Text>
        </Pressable>
      </View>
    </Pressable>
  );

  const filterButtons: { key: FilterType; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'player', label: 'Players' },
    { key: 'coach', label: 'Coaches' },
    { key: 'club', label: 'Clubs' },
    { key: 'premium', label: 'Premium' },
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { backgroundColor: theme.background }]}>
        <Text style={[styles.title, { color: theme.text }]}>Talent Explorer</Text>
      </View>

      <View style={styles.searchContainer}>
        <View style={[styles.searchBar, { backgroundColor: theme.inputBackground }]}>
          <SearchIcon size={20} color={theme.textSecondary} />
          <TextInput
            style={[styles.searchInput, { color: theme.text }]}
            placeholder="Search players, coaches, clubs..."
            placeholderTextColor={theme.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
        <Pressable
          onPress={() => setShowFilters(!showFilters)}
          style={[styles.filterButton, { backgroundColor: theme.card }]}
        >
          <Filter size={20} color={showFilters ? COLORS.primary : theme.text} />
        </Pressable>
      </View>

      {showFilters && (
        <View style={[styles.filters, { backgroundColor: theme.card }]}>
          <Text style={[styles.filterTitle, { color: theme.text }]}>Quick Filters</Text>
          <View style={styles.filterChips}>
            {filterButtons.map(({ key, label }) => {
              const isActive = activeFilter === key;
              return (
                <Pressable
                  key={key}
                  onPress={() => setActiveFilter(key)}
                  style={[styles.chip, { backgroundColor: isActive ? COLORS.primary : theme.border }]}
                >
                  <Text style={[styles.chipText, { color: isActive ? COLORS.white : theme.text }]}>
                    {label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      )}

      <FlatList
        data={filteredUsers}
        renderItem={renderUser}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
              {allUsers.length === 0
                ? 'No other users registered yet'
                : 'No users match your search'}
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 12,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  searchContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingBottom: 12,
    gap: 12,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
  },
  filterButton: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filters: {
    marginHorizontal: 20,
    marginBottom: 12,
    padding: 16,
    borderRadius: 12,
  },
  filterTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  filterChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  chipText: {
    fontSize: 14,
    fontWeight: '600',
  },
  listContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    flexGrow: 1,
  },
  emptyState: {
    flex: 1,
    paddingTop: 60,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 15,
  },
  userCard: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    gap: 12,
  },
  userAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
  },
  userInfo: {
    flex: 1,
    gap: 4,
  },
  userHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  username: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  premiumBadge: {
    backgroundColor: COLORS.skyBlue,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  premiumText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: COLORS.white,
  },
  userBio: {
    fontSize: 13,
  },
  userMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 12,
  },
  stats: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 4,
  },
  statText: {
    fontSize: 12,
    fontWeight: '600',
  },
  actionButtons: {
    flexDirection: 'column',
    gap: 8,
    alignSelf: 'flex-start',
  },
  messageButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  followButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  followButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
