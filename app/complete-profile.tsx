import React from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { User, Users, Video, ChevronRight, Trophy } from 'lucide-react-native';
import { Image } from 'expo-image';
import { useAuth } from '@/src/hooks/useAuth';
import { useTheme } from '@/src/hooks/useTheme';
import { COLORS } from '@/src/utils/theme';

export default function CompleteProfileScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const { user } = useAuth();

  if (!user) {
    router.replace('/(tabs)');
    return null;
  }

  const checks = [
    { label: 'Profile photo', done: !!user.profilePhoto && !user.profilePhoto.includes('pravatar') },
    { label: 'Bio', done: !!user.bio && user.bio.length > 0 },
    { label: 'City', done: !!user.city },
    ...(user.role === 'player'
      ? [
          { label: 'Position', done: (user as any).positions?.length > 0 },
          { label: 'Club', done: !!(user as any).currentClub },
        ]
      : []),
  ];

  const completedCount = checks.filter(c => c.done).length;
  const completionPct = Math.round((completedCount / checks.length) * 100);

  const steps = [
    {
      icon: <User size={26} color={COLORS.primary} />,
      bg: `${COLORS.primary}18`,
      title: 'Complete Your Profile',
      description: 'Add a bio and photo so scouts and clubs can find you',
      onPress: () => router.push('/edit-profile'),
      cta: 'Edit Profile',
    },
    {
      icon: <Users size={26} color={COLORS.skyBlue} />,
      bg: `${COLORS.skyBlue}18`,
      title: 'Discover Players & Clubs',
      description: 'Follow players, coaches, and clubs to fill your feed',
      onPress: () => router.replace('/(tabs)/search' as any),
      cta: 'Explore',
    },
    {
      icon: <Video size={26} color="#22c55e" />,
      bg: '#22c55e18',
      title: 'Share Your First Play',
      description: 'Upload a highlight and start building your portfolio',
      onPress: () => router.replace('/(tabs)/create' as any),
      cta: 'Create Post',
    },
    {
      icon: <Trophy size={26} color="#f59e0b" />,
      bg: '#f59e0b18',
      title: 'Add Your Stats',
      description: 'Enter your goals, assists, and match stats to get noticed',
      onPress: () => router.push('/edit-profile'),
      cta: 'Add Stats',
    },
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <LinearGradient colors={[COLORS.primary, COLORS.primaryDark]} style={styles.hero}>
          <Image source={{ uri: user.profilePhoto }} style={styles.avatar} contentFit="cover" />
          <Text style={styles.heroTitle}>Welcome, {user.fullName.split(' ')[0]}!</Text>
          <Text style={styles.heroSub}>Your account is ready. Here's what to do next.</Text>

          <View style={styles.progressWrap}>
            <View style={[styles.progressTrack, { backgroundColor: 'rgba(255,255,255,0.25)' }]}>
              <View style={[styles.progressFill, { width: `${completionPct}%` }]} />
            </View>
            <Text style={styles.progressLabel}>{completionPct}% profile complete</Text>
          </View>
        </LinearGradient>

        <View style={styles.body}>
          <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>NEXT STEPS</Text>

          {steps.map((step, i) => (
            <Pressable
              key={i}
              onPress={step.onPress}
              style={[styles.card, { backgroundColor: theme.card }]}
            >
              <View style={[styles.iconWrap, { backgroundColor: step.bg }]}>
                {step.icon}
              </View>
              <View style={styles.cardContent}>
                <Text style={[styles.cardTitle, { color: theme.text }]}>{step.title}</Text>
                <Text style={[styles.cardDesc, { color: theme.textSecondary }]} numberOfLines={2}>
                  {step.description}
                </Text>
              </View>
              <ChevronRight size={20} color={theme.textSecondary} />
            </Pressable>
          ))}

          <Pressable
            onPress={() => router.replace('/(tabs)')}
            style={[styles.ctaButton, { backgroundColor: COLORS.primary }]}
          >
            <Text style={styles.ctaText}>Go to My Feed</Text>
          </Pressable>

          <Pressable onPress={() => router.replace('/(tabs)')} style={styles.laterButton}>
            <Text style={[styles.laterText, { color: theme.textSecondary }]}>
              I'll finish this later
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { paddingBottom: 40 },
  hero: {
    paddingTop: 48,
    paddingBottom: 36,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.6)',
    marginBottom: 16,
  },
  heroTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    color: COLORS.white,
    marginBottom: 6,
    textAlign: 'center',
  },
  heroSub: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.85)',
    textAlign: 'center',
    marginBottom: 24,
  },
  progressWrap: { width: '100%', alignItems: 'center' },
  progressTrack: {
    width: '100%',
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.white,
    borderRadius: 3,
  },
  progressLabel: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '600',
  },
  body: { padding: 20 },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 12,
    marginTop: 4,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    gap: 14,
  },
  iconWrap: {
    width: 50,
    height: 50,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardContent: { flex: 1 },
  cardTitle: { fontSize: 15, fontWeight: '700', marginBottom: 3 },
  cardDesc: { fontSize: 13, lineHeight: 18 },
  ctaButton: {
    paddingVertical: 16,
    borderRadius: 30,
    alignItems: 'center',
    marginTop: 8,
  },
  ctaText: { color: COLORS.white, fontSize: 17, fontWeight: 'bold' },
  laterButton: { alignItems: 'center', marginTop: 16, paddingVertical: 8 },
  laterText: { fontSize: 14 },
});
