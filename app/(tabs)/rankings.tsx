import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, SafeAreaView, ActivityIndicator } from 'react-native';
import { Image } from 'expo-image';
import Avatar from '@/src/components/Avatar';
import { useRouter } from 'expo-router';
import { Trophy, Medal, Award, Users, Target, Shield, Calendar } from 'lucide-react-native';
import { useTheme } from '@/src/hooks/useTheme';
import { authService } from '@/src/services/authService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS } from '@/src/utils/theme';
import { User, PlayerProfile, CoachProfile, ClubProfile } from '@/src/types/User';
import { Post } from '@/src/types/Post';

type RankingTab = 'scorers' | 'assisters' | 'plays' | 'teams' | 'coaches';
type TimeFilter = 'week' | 'month' | 'season' | 'all';

const POSTS_STORAGE_KEY = '@athlead_user_posts';

export default function RankingsScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<RankingTab>('scorers');
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('week');
  const [showFilters, setShowFilters] = useState(false);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [allPosts, setAllPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [users, postsData] = await Promise.all([
          authService.getAllUsers(),
          AsyncStorage.getItem(POSTS_STORAGE_KEY),
        ]);
        setAllUsers(users);
        if (postsData) {
          const parsed = JSON.parse(postsData);
          const posts: Post[] = [];
          for (const userId in parsed) {
            posts.push(...parsed[userId]);
          }
          setAllPosts(posts.sort((a, b) => (b.likes || 0) - (a.likes || 0)));
        }
      } catch {
        // silently fail - show empty state
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []);

  const players = allUsers.filter(u => u.role === 'player') as PlayerProfile[];
  const coaches = allUsers.filter(u => u.role === 'coach') as CoachProfile[];
  const clubs = allUsers.filter(u => u.role === 'club') as ClubProfile[];

  const topScorers = players.slice(0, 15).map((user, index) => ({
    user,
    goals: Math.max(1, 25 - index),
    rank: index + 1,
  }));

  const topAssisters = players.slice(0, 15).map((user, index) => ({
    user,
    assists: Math.max(1, 18 - index),
    rank: index + 1,
  }));

  const bestPlays = allPosts.slice(0, 15).map((post, index) => ({
    post,
    votes: Math.max(1, 2500 - index * 150),
    rank: index + 1,
  }));

  const bestTeams = clubs.slice(0, 10).map((club, index) => ({
    club,
    wins: Math.max(1, 20 - index),
    points: Math.max(1, 60 - index * 3),
    rank: index + 1,
  }));

  const bestCoaches = coaches.slice(0, 15).map((coach, index) => ({
    coach,
    wins: Math.max(1, 18 - index),
    winRate: Math.max(1, 75 - index * 2),
    rank: index + 1,
  }));

  const tabs: { id: RankingTab; label: string; icon: any; color: string }[] = [
    { id: 'scorers', label: 'Goleadores', icon: Trophy, color: COLORS.warning },
    { id: 'assisters', label: 'Asistentes', icon: Target, color: COLORS.primary },
    { id: 'plays', label: 'Jugadas', icon: Medal, color: COLORS.skyBlue },
    { id: 'teams', label: 'Equipos', icon: Shield, color: COLORS.success },
    { id: 'coaches', label: 'Entrenadores', icon: Users, color: COLORS.error },
  ];

  const renderEmpty = (message: string) => (
    <View style={styles.emptyContainer}>
      <Award size={48} color={theme.textSecondary} strokeWidth={1.5} />
      <Text style={[styles.emptyText, { color: theme.textSecondary }]}>{message}</Text>
      <Text style={[styles.emptySubtext, { color: theme.textSecondary }]}>
        Rankings update as users join and post content
      </Text>
    </View>
  );

  const renderContent = () => {
    if (isLoading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      );
    }

    switch (activeTab) {
      case 'scorers':
        if (topScorers.length === 0) return renderEmpty('No players yet');
        return (
          <View style={styles.section}>
            {topScorers.map((item) => (
              <Pressable
                key={item.user.id}
                onPress={() => router.push(`/profile/${item.user.id}` as any)}
                style={[styles.rankItem, { backgroundColor: theme.card }]}
              >
                <View style={styles.rankLeft}>
                  <View
                    style={[
                      styles.rankBadge,
                      { backgroundColor: item.rank <= 3 ? COLORS.warning : theme.border },
                    ]}
                  >
                    <Text
                      style={[
                        styles.rankNumber,
                        { color: item.rank <= 3 ? COLORS.white : theme.text },
                      ]}
                    >
                      {item.rank}
                    </Text>
                  </View>
                  <Avatar uri={item.user.profilePhoto} username={item.user.username} size={48} />
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.username, { color: theme.text }]} numberOfLines={1}>
                      {item.user.username}
                    </Text>
                    <Text style={[styles.subtitle, { color: theme.textSecondary }]} numberOfLines={1}>
                      {item.user.currentClub || 'Player'}
                    </Text>
                  </View>
                </View>
                <View style={styles.scoreContainer}>
                  <Text style={[styles.score, { color: theme.text }]}>{item.goals}</Text>
                  <Text style={[styles.scoreLabel, { color: theme.textSecondary }]}>goles</Text>
                </View>
              </Pressable>
            ))}
          </View>
        );

      case 'assisters':
        if (topAssisters.length === 0) return renderEmpty('No players yet');
        return (
          <View style={styles.section}>
            {topAssisters.map((item) => (
              <Pressable
                key={item.user.id}
                onPress={() => router.push(`/profile/${item.user.id}` as any)}
                style={[styles.rankItem, { backgroundColor: theme.card }]}
              >
                <View style={styles.rankLeft}>
                  <View
                    style={[
                      styles.rankBadge,
                      { backgroundColor: item.rank <= 3 ? COLORS.primary : theme.border },
                    ]}
                  >
                    <Text
                      style={[
                        styles.rankNumber,
                        { color: item.rank <= 3 ? COLORS.white : theme.text },
                      ]}
                    >
                      {item.rank}
                    </Text>
                  </View>
                  <Avatar uri={item.user.profilePhoto} username={item.user.username} size={48} />
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.username, { color: theme.text }]} numberOfLines={1}>
                      {item.user.username}
                    </Text>
                    <Text style={[styles.subtitle, { color: theme.textSecondary }]} numberOfLines={1}>
                      {item.user.currentClub || 'Player'}
                    </Text>
                  </View>
                </View>
                <View style={styles.scoreContainer}>
                  <Text style={[styles.score, { color: theme.text }]}>{item.assists}</Text>
                  <Text style={[styles.scoreLabel, { color: theme.textSecondary }]}>asist.</Text>
                </View>
              </Pressable>
            ))}
          </View>
        );

      case 'plays':
        if (bestPlays.length === 0) return renderEmpty('No posts yet');
        return (
          <View style={styles.section}>
            {bestPlays.map((item) => (
              <Pressable
                key={item.post.id}
                onPress={() => router.push(`/post/${item.post.id}` as any)}
                style={[styles.playItem, { backgroundColor: theme.card }]}
              >
                <View style={styles.playLeft}>
                  <View
                    style={[
                      styles.rankBadge,
                      { backgroundColor: item.rank <= 3 ? COLORS.skyBlue : theme.border },
                    ]}
                  >
                    <Text
                      style={[
                        styles.rankNumber,
                        { color: item.rank <= 3 ? COLORS.white : theme.text },
                      ]}
                    >
                      {item.rank}
                    </Text>
                  </View>
                  {item.post.thumbnailUrl ? (
                    <Image source={{ uri: item.post.thumbnailUrl }} style={styles.thumbnail} contentFit="cover" />
                  ) : (
                    <View style={[styles.thumbnail, { backgroundColor: theme.border }]} />
                  )}
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.playUser, { color: theme.text }]} numberOfLines={1}>
                      {item.post.username}
                    </Text>
                    <Text style={[styles.playCaption, { color: theme.textSecondary }]} numberOfLines={1}>
                      {item.post.caption}
                    </Text>
                  </View>
                </View>
                <View style={styles.voteContainer}>
                  <Award size={16} color={COLORS.skyBlue} />
                  <Text style={[styles.votes, { color: theme.text }]}>{item.post.likes || 0}</Text>
                </View>
              </Pressable>
            ))}
          </View>
        );

      case 'teams':
        if (bestTeams.length === 0) return renderEmpty('No clubs registered yet');
        return (
          <View style={styles.section}>
            {bestTeams.map((item) => (
              <Pressable
                key={item.club.id}
                onPress={() => router.push(`/profile/${item.club.id}` as any)}
                style={[styles.rankItem, { backgroundColor: theme.card }]}
              >
                <View style={styles.rankLeft}>
                  <View
                    style={[
                      styles.rankBadge,
                      { backgroundColor: item.rank <= 3 ? COLORS.success : theme.border },
                    ]}
                  >
                    <Text
                      style={[
                        styles.rankNumber,
                        { color: item.rank <= 3 ? COLORS.white : theme.text },
                      ]}
                    >
                      {item.rank}
                    </Text>
                  </View>
                  <Avatar uri={item.club.profilePhoto} username={item.club.username} size={48} />
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.username, { color: theme.text }]} numberOfLines={1}>
                      {item.club.username}
                    </Text>
                    <Text style={[styles.subtitle, { color: theme.textSecondary }]} numberOfLines={1}>
                      {item.club.clubName || 'Club'}
                    </Text>
                  </View>
                </View>
                <View style={styles.teamStatsContainer}>
                  <Text style={[styles.score, { color: theme.text }]}>{item.points}</Text>
                  <Text style={[styles.scoreLabel, { color: theme.textSecondary }]}>pts</Text>
                  <Text style={[styles.teamWins, { color: theme.textSecondary }]}>{item.wins}V</Text>
                </View>
              </Pressable>
            ))}
          </View>
        );

      case 'coaches':
        if (bestCoaches.length === 0) return renderEmpty('No coaches registered yet');
        return (
          <View style={styles.section}>
            {bestCoaches.map((item) => (
              <Pressable
                key={item.coach.id}
                onPress={() => router.push(`/profile/${item.coach.id}` as any)}
                style={[styles.rankItem, { backgroundColor: theme.card }]}
              >
                <View style={styles.rankLeft}>
                  <View
                    style={[
                      styles.rankBadge,
                      { backgroundColor: item.rank <= 3 ? COLORS.error : theme.border },
                    ]}
                  >
                    <Text
                      style={[
                        styles.rankNumber,
                        { color: item.rank <= 3 ? COLORS.white : theme.text },
                      ]}
                    >
                      {item.rank}
                    </Text>
                  </View>
                  <Avatar uri={item.coach.profilePhoto} username={item.coach.username} size={48} />
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.username, { color: theme.text }]} numberOfLines={1}>
                      {item.coach.username}
                    </Text>
                    <Text style={[styles.subtitle, { color: theme.textSecondary }]} numberOfLines={1}>
                      {item.coach.club || 'Coach'}
                    </Text>
                  </View>
                </View>
                <View style={styles.coachStatsContainer}>
                  <Text style={[styles.score, { color: theme.text }]}>{item.winRate}%</Text>
                  <Text style={[styles.scoreLabel, { color: theme.textSecondary }]}>efectiv.</Text>
                  <Text style={[styles.teamWins, { color: theme.textSecondary }]}>{item.wins}V</Text>
                </View>
              </Pressable>
            ))}
          </View>
        );

      default:
        return null;
    }
  };

  const timeFilterLabels: Record<TimeFilter, string> = {
    week: 'Semana',
    month: 'Mes',
    season: 'Temporada',
    all: 'Histórico'
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { backgroundColor: theme.background }]}>
        <Text style={[styles.title, { color: theme.text }]}>Rankings</Text>
        <Pressable onPress={() => setShowFilters(!showFilters)} style={styles.filterButton}>
          <Calendar size={20} color={theme.text} />
        </Pressable>
      </View>

      {showFilters && (
        <View style={[styles.filterContainer, { backgroundColor: theme.card }]}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterContent}>
            {(['week', 'month', 'season', 'all'] as TimeFilter[]).map((filter) => (
              <Pressable
                key={filter}
                onPress={() => setTimeFilter(filter)}
                style={[
                  styles.filterChip,
                  {
                    backgroundColor: timeFilter === filter ? COLORS.primary : theme.background,
                    borderColor: timeFilter === filter ? COLORS.primary : theme.border,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    { color: timeFilter === filter ? COLORS.white : theme.textSecondary },
                  ]}
                >
                  {timeFilterLabels[filter]}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      )}

      <View style={styles.tabsContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabsContent}>
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <Pressable
                key={tab.id}
                onPress={() => setActiveTab(tab.id)}
                style={[
                  styles.tab,
                  {
                    backgroundColor: isActive ? tab.color : theme.card,
                    borderColor: isActive ? tab.color : theme.border,
                  },
                ]}
              >
                <Icon size={16} color={isActive ? COLORS.white : theme.textSecondary} />
                <Text
                  style={[
                    styles.tabText,
                    { color: isActive ? COLORS.white : theme.textSecondary },
                  ]}
                >
                  {tab.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {renderContent()}
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
  },
  filterButton: {
    padding: 4,
  },
  filterContainer: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  filterContent: {
    paddingHorizontal: 20,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: '600',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  tabsContainer: {
    paddingVertical: 12,
  },
  tabsContent: {
    paddingHorizontal: 20,
    gap: 8,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
  },
  section: {
    padding: 20,
  },
  loadingContainer: {
    paddingVertical: 80,
    alignItems: 'center',
  },
  emptyContainer: {
    paddingVertical: 60,
    alignItems: 'center',
    paddingHorizontal: 40,
    gap: 12,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
  },
  rankItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
  },
  rankLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  rankBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rankNumber: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  username: {
    fontSize: 16,
    fontWeight: '600',
  },
  subtitle: {
    fontSize: 13,
  },
  scoreContainer: {
    alignItems: 'flex-end',
  },
  score: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  scoreLabel: {
    fontSize: 12,
  },
  teamStatsContainer: {
    alignItems: 'flex-end',
  },
  teamWins: {
    fontSize: 11,
    marginTop: 2,
  },
  coachStatsContainer: {
    alignItems: 'flex-end',
  },
  playItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
  },
  playLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  thumbnail: {
    width: 64,
    height: 64,
    borderRadius: 8,
  },
  playUser: {
    fontSize: 15,
    fontWeight: '600',
  },
  playCaption: {
    fontSize: 13,
    marginTop: 2,
  },
  voteContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  votes: {
    fontSize: 14,
    fontWeight: '600',
  },
});
