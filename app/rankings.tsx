import React from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, SafeAreaView } from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { ArrowLeft, Trophy, Medal, Award } from 'lucide-react-native';
import { useTheme } from '@/src/hooks/useTheme';
import { MOCK_USERS, MOCK_POSTS } from '@/src/services/mockData';
import { COLORS } from '@/src/utils/theme';

export default function RankingsScreen() {
  const { theme } = useTheme();
  const router = useRouter();

  const topScorers = MOCK_USERS.slice(0, 10)
    .filter(u => u.role === 'player')
    .map((user, index) => ({
      user,
      goals: 15 - index,
      rank: index + 1,
    }));

  const bestPlays = MOCK_POSTS.slice(0, 5).map((post, index) => ({
    post,
    votes: 1500 - index * 200,
    rank: index + 1,
  }));

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { backgroundColor: theme.background }]}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color={theme.text} />
        </Pressable>
        <Text style={[styles.title, { color: theme.text }]}>Rankings</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Trophy size={24} color={COLORS.warning} />
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Top Scorers</Text>
          </View>

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
                <View>
                  <Text style={[styles.username, { color: theme.text }]}>
                    {item.user.username}
                  </Text>
                  <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
                    {'currentClub' in item.user ? item.user.currentClub : 'Player'}
                  </Text>
                </View>
              </View>
              <View style={styles.scoreContainer}>
                <Text style={[styles.score, { color: theme.text }]}>{item.goals}</Text>
                <Text style={[styles.scoreLabel, { color: theme.textSecondary }]}>goals</Text>
              </View>
            </Pressable>
          ))}
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Medal size={24} color={COLORS.skyBlue} />
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Best Plays</Text>
          </View>

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
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  section: {
    padding: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
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
