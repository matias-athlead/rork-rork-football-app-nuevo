import React from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, Zap, TrendingUp, Activity } from 'lucide-react-native';
import { useTheme } from '@/src/hooks/useTheme';
import { useAuth } from '@/src/hooks/useAuth';
import { COLORS } from '@/src/utils/theme';

export default function AIAnalysisScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const { user } = useAuth();

  const mockStats = {
    speed: { current: 87, change: +5, max: 92 },
    power: { current: 82, change: +3, max: 88 },
    sprints: { current: 45, change: +8, max: 52 },
    dribbles: { current: 38, change: -2, max: 42 },
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { backgroundColor: theme.background }]}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color={theme.text} />
        </Pressable>
        <Text style={[styles.title, { color: theme.text }]}>AI Analysis</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={[styles.premiumBanner, { backgroundColor: COLORS.primary }]}>
          <Zap size={24} color={COLORS.white} />
          <Text style={styles.bannerText}>
            AI-Powered Performance Analysis
          </Text>
        </View>

        <Text style={[styles.sectionTitle, { color: theme.text }]}>Latest Metrics</Text>

        {Object.entries(mockStats).map(([key, value]) => (
          <View key={key} style={[styles.statCard, { backgroundColor: theme.card }]}>
            <View style={styles.statHeader}>
              <Text style={[styles.statName, { color: theme.text }]}>
                {key.charAt(0).toUpperCase() + key.slice(1)}
              </Text>
              <View style={[styles.changeIndicator, { backgroundColor: value.change > 0 ? `${COLORS.success}20` : `${COLORS.error}20` }]}>
                <TrendingUp size={16} color={value.change > 0 ? COLORS.success : COLORS.error} />
                <Text style={[styles.changeText, { color: value.change > 0 ? COLORS.success : COLORS.error }]}>
                  {value.change > 0 ? '+' : ''}{value.change}
                </Text>
              </View>
            </View>

            <View style={styles.statContent}>
              <Text style={[styles.statValue, { color: theme.text }]}>{value.current}</Text>
              <Text style={[styles.statMax, { color: theme.textSecondary }]}>
                Max: {value.max}
              </Text>
            </View>

            <View style={styles.progressBar}>
              <View
                style={[styles.progressFill, { width: `${(value.current / 100) * 100}%`, backgroundColor: COLORS.skyBlue }]}
              />
            </View>
          </View>
        ))}

        <View style={[styles.insightCard, { backgroundColor: theme.card }]}>
          <Activity size={24} color={COLORS.skyBlue} />
          <Text style={[styles.insightTitle, { color: theme.text }]}>
            Performance Insight
          </Text>
          <Text style={[styles.insightText, { color: theme.textSecondary }]}>
            Your speed has improved by 5 points this week! Keep up the intensity in sprint drills.
          </Text>
        </View>

        {!user?.isPremium && (
          <Pressable
            onPress={() => router.push('/premium' as any)}
            style={[styles.upgradeButton, { backgroundColor: COLORS.primary }]}
          >
            <Text style={styles.upgradeButtonText}>
              Upgrade to Premium for Full Analysis
            </Text>
          </Pressable>
        )}
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
  content: {
    padding: 20,
  },
  premiumBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
    gap: 12,
  },
  bannerText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.white,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  statCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  statHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  statName: {
    fontSize: 16,
    fontWeight: '600',
  },
  changeIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  changeText: {
    fontSize: 13,
    fontWeight: '600',
  },
  statContent: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
    marginBottom: 8,
  },
  statValue: {
    fontSize: 32,
    fontWeight: 'bold',
  },
  statMax: {
    fontSize: 14,
  },
  progressBar: {
    height: 6,
    backgroundColor: 'rgba(96, 165, 250, 0.2)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  insightCard: {
    padding: 20,
    borderRadius: 16,
    marginTop: 12,
    marginBottom: 24,
    gap: 12,
  },
  insightTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  insightText: {
    fontSize: 14,
    lineHeight: 20,
  },
  upgradeButton: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  upgradeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.white,
  },
});
