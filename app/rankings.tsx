import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, SafeAreaView } from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { ArrowLeft, Trophy, Medal, Award, Users, Target, Shield, Calendar } from 'lucide-react-native';
import { useTheme } from '@/src/hooks/useTheme';
import { MOCK_USERS, MOCK_POSTS } from '@/src/services/mockData';
import { COLORS } from '@/src/utils/theme';

type RankingTab = 'scorers' | 'assisters' | 'plays' | 'teams' | 'coaches';
type TimeFilter = 'week' | 'month' | 'season' | 'all';

export default function RankingsScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<RankingTab>('scorers');
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('week');
  const [showFilters, setShowFilters] = useState(false);

  const topScorers = MOCK_USERS.slice(0, 15)
    .filter(u => u.role === 'player')
    .map((user, index) => ({
      user,
      goals: 25 - index,
      rank: index + 1,
    }));

  const topAssisters = MOCK_USERS.slice(5, 20)
    .filter(u => u.role === 'player')
    .map((user, index) => ({
      user,
      assists: 18 - index,
      rank: index + 1,
    }));

  const bestPlays = MOCK_POSTS.slice(0, 15).map((post, index) => ({
    post,
    votes: 2500 - index * 150,
    rank: index + 1,
  }));

  const bestTeams = MOCK_USERS.slice(0, 10)
    .filter(u => u.role === 'club')
    .map((club, index) => ({
      club,
      wins: 20 - index,
      points: 60 - index * 3,
      rank: index + 1,
    }));

  const bestCoaches = MOCK_USERS.slice(0, 15)
    .filter(u => u.role === 'coach')
    .map((coach, index) => ({
      coach,
      wins: 18 - index,
      winRate: 75 - index * 2,
      rank: index + 1,
    }));

  const tabs: { id: RankingTab; label: string; icon: any; color: string }[] = [
    { id: 'scorers', label: 'Goleadores', icon: Trophy, color: COLORS.warning },
    { id: 'assisters', label: 'Asistentes', icon: Target, color: COLORS.primary },
    { id: 'plays', label: 'Jugadas', icon: Medal, color: COLORS.skyBlue },
    { id: 'teams', label: 'Equipos', icon: Shield, color: COLORS.success },
    { id: 'coaches', label: 'Entrenadores', icon: Users, color: COLORS.error },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'scorers':
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
                  <Image source={{ uri: item.user.profilePhoto }} style={styles.avatar} />
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.username, { color: theme.text }]} numberOfLines={1}>
                      {item.user.username}
                    </Text>
                    <Text style={[styles.subtitle, { color: theme.textSecondary }]} numberOfLines={1}>
                      {'currentClub' in item.user ? item.user.currentClub : 'Player'}
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
                  <Image source={{ uri: item.user.profilePhoto }} style={styles.avatar} />
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.username, { color: theme.text }]} numberOfLines={1}>
                      {item.user.username}
                    </Text>
                    <Text style={[styles.subtitle, { color: theme.textSecondary }]} numberOfLines={1}>
                      {'currentClub' in item.user ? item.user.currentClub : 'Player'}
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
                  <Image source={{ uri: item.post.thumbnailUrl }} style={styles.thumbnail} />
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
                  <Text style={[styles.votes, { color: theme.text }]}>{item.votes}</Text>
                </View>
              </Pressable>
            ))}
          </View>
        );

      case 'teams':
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
                  <Image source={{ uri: item.club.profilePhoto }} style={styles.avatar} />
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.username, { color: theme.text }]} numberOfLines={1}>
                      {item.club.username}
                    </Text>
                    <Text style={[styles.subtitle, { color: theme.textSecondary }]} numberOfLines={1}>
                      {'clubName' in item.club ? item.club.clubName : 'Club'}
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
                  <Image source={{ uri: item.coach.profilePhoto }} style={styles.avatar} />
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.username, { color: theme.text }]} numberOfLines={1}>
                      {item.coach.username}
                    </Text>
                    <Text style={[styles.subtitle, { color: theme.textSecondary }]} numberOfLines={1}>
                      {'club' in item.coach ? item.coach.club : 'Coach'}
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
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color={theme.text} />
        </Pressable>
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
  backButton: {
    padding: 4,
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
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
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
