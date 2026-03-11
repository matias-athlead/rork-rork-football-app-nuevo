import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TextInput, FlatList, Pressable, SafeAreaView, Platform } from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { Search as SearchIcon, Filter, MapPin, MessageCircle } from 'lucide-react-native';
import { useTheme } from '@/src/hooks/useTheme';
import { MOCK_USERS } from '@/src/services/mockData';
import { User, PlayerProfile } from '@/src/types/User';
import { COLORS } from '@/src/utils/theme';
import * as Haptics from 'expo-haptics';

export default function SearchScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filteredUsers, setFilteredUsers] = useState(MOCK_USERS);
  const [followingUsers, setFollowingUsers] = useState<Set<string>>(new Set());

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (query.trim() === '') {
      setFilteredUsers(MOCK_USERS);
    } else {
      const filtered = MOCK_USERS.filter(user =>
        user.username.toLowerCase().includes(query.toLowerCase()) ||
        user.bio.toLowerCase().includes(query.toLowerCase())
      );
      setFilteredUsers(filtered);
    }
  };

  const handleFollow = useCallback((userId: string, event: any) => {
    event.stopPropagation();
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    setFollowingUsers(prev => {
      const newSet = new Set(prev);
      if (newSet.has(userId)) {
        newSet.delete(userId);
      } else {
        newSet.add(userId);
      }
      return newSet;
    });
  }, []);

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
      <Image source={{ uri: item.profilePhoto }} style={styles.userAvatar} />
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
          onPress={(e) => handleFollow(item.id, e)} 
          style={[styles.followButton, { backgroundColor: followingUsers.has(item.id) ? theme.card : COLORS.primary, borderWidth: followingUsers.has(item.id) ? 1 : 0, borderColor: theme.border }]}
        >
          <Text style={[styles.followButtonText, { color: followingUsers.has(item.id) ? theme.text : COLORS.white }]}>
            {followingUsers.has(item.id) ? 'Following' : 'Follow'}
          </Text>
        </Pressable>
      </View>
    </Pressable>
  );

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
            onChangeText={handleSearch}
          />
        </View>
        <Pressable
          onPress={() => setShowFilters(!showFilters)}
          style={[styles.filterButton, { backgroundColor: theme.card }]}
        >
          <Filter size={20} color={theme.text} />
        </Pressable>
      </View>

      {showFilters && (
        <View style={[styles.filters, { backgroundColor: theme.card }]}>
          <Text style={[styles.filterTitle, { color: theme.text }]}>Quick Filters</Text>
          <View style={styles.filterChips}>
            <Pressable style={[styles.chip, { backgroundColor: COLORS.primary }]}>
              <Text style={styles.chipText}>Players</Text>
            </Pressable>
            <Pressable style={[styles.chip, { backgroundColor: theme.border }]}>
              <Text style={[styles.chipText, { color: theme.text }]}>Coaches</Text>
            </Pressable>
            <Pressable style={[styles.chip, { backgroundColor: theme.border }]}>
              <Text style={[styles.chipText, { color: theme.text }]}>Clubs</Text>
            </Pressable>
            <Pressable style={[styles.chip, { backgroundColor: theme.border }]}>
              <Text style={[styles.chipText, { color: theme.text }]}>Premium</Text>
            </Pressable>
          </View>
        </View>
      )}

      <FlatList
        data={filteredUsers}
        renderItem={renderUser}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
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
    color: COLORS.white,
  },
  listContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
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
