import React from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, SafeAreaView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { X, Check, Crown, Zap, BarChart3, Eye, Video } from 'lucide-react-native';
import { useTheme } from '@/src/hooks/useTheme';
import { useAuth } from '@/src/hooks/useAuth';
import { PREMIUM_FEATURES } from '@/src/types/Premium';
import { COLORS } from '@/src/utils/theme';

export default function PremiumScreen() {
  const { theme } = useTheme();
  const { user, updateUser } = useAuth();
  const router = useRouter();

  if (!user) return null;

  const features = PREMIUM_FEATURES[user.role];
  const price = user.role === 'player' ? 9.99 : user.role === 'coach' ? 14.99 : 19.99;

  const handleSubscribe = async () => {
    console.log('[Premium] Demo mode - granting premium access');
    if (!user) {
      console.log('[Premium] No user found');
      return;
    }

    try {
      console.log('[Premium] Current user isPremium:', user.isPremium);
      
      const updatedUser = {
        ...user,
        isPremium: true,
      };

      console.log('[Premium] Updating user with isPremium: true');
      await updateUser(updatedUser);
      
      console.log('[Premium] User updated successfully');
      Alert.alert(
        '¡Éxito!', 
        '¡Premium activado! Todas las funciones premium están ahora disponibles para la demo.', 
        [
          { text: 'OK', onPress: () => {
            console.log('[Premium] Navigating back');
            router.back();
          }}
        ]
      );
    } catch (error) {
      console.error('[Premium] Failed to grant premium:', error);
      Alert.alert('Error', 'No se pudo activar premium. Por favor, intenta de nuevo.');
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.closeButton}>
          <X size={24} color={theme.text} />
        </Pressable>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <View style={styles.hero}>
          <View style={styles.crownIcon}>
            <Crown size={48} color={COLORS.skyBlue} />
          </View>
          <Text style={[styles.heroTitle, { color: theme.text }]}>
            Upgrade to Premium
          </Text>
          <Text style={[styles.heroSubtitle, { color: theme.textSecondary }]}>
            Unlock exclusive features and take your game to the next level
          </Text>
        </View>

        <View style={[styles.pricingCard, { backgroundColor: theme.card }]}>
          <Text style={[styles.priceAmount, { color: theme.text }]}>
            ${price}
            <Text style={[styles.pricePeriod, { color: theme.textSecondary }]}>/month</Text>
          </Text>
          <Text style={[styles.priceDescription, { color: theme.textSecondary }]}>
            Cancel anytime
          </Text>
        </View>

        <View style={styles.featuresSection}>
          <Text style={[styles.featuresTitle, { color: theme.text }]}>
            Premium Features
          </Text>
          {features.map((feature, index) => (
            <View key={index} style={styles.featureItem}>
              <View style={styles.checkIcon}>
                <Check size={18} color={COLORS.white} />
              </View>
              <Text style={[styles.featureText, { color: theme.text }]}>{feature}</Text>
            </View>
          ))}
        </View>

        <View style={styles.highlights}>
          <HighlightCard
            icon={<Zap size={24} color={COLORS.skyBlue} />}
            title="AI Analysis"
            description="Get instant performance insights"
            theme={theme}
          />
          <HighlightCard
            icon={<BarChart3 size={24} color={COLORS.skyBlue} />}
            title="Advanced Stats"
            description="Track detailed metrics"
            theme={theme}
          />
          <HighlightCard
            icon={<Eye size={24} color={COLORS.skyBlue} />}
            title="Profile Views"
            description="See who viewed your profile"
            theme={theme}
          />
          <HighlightCard
            icon={<Video size={24} color={COLORS.skyBlue} />}
            title="Video Calls"
            description="Connect face-to-face"
            theme={theme}
          />
        </View>

        <Pressable
          onPress={handleSubscribe}
          style={[styles.subscribeButton, { backgroundColor: COLORS.primary }]}
        >
          <Crown size={20} color={COLORS.white} />
          <Text style={styles.subscribeButtonText}>Subscribe Now</Text>
        </Pressable>

        <Text style={[styles.disclaimer, { color: theme.textSecondary }]}>
          By subscribing, you agree to our Terms of Service. Your subscription will automatically
          renew unless cancelled at least 24 hours before the end of the current period.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

function HighlightCard({
  icon,
  title,
  description,
  theme,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  theme: any;
}) {
  return (
    <View style={[styles.highlightCard, { backgroundColor: theme.card }]}>
      <View style={styles.highlightIcon}>{icon}</View>
      <Text style={[styles.highlightTitle, { color: theme.text }]}>{title}</Text>
      <Text style={[styles.highlightDescription, { color: theme.textSecondary }]}>
        {description}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  closeButton: {
    padding: 4,
  },
  content: {
    padding: 20,
  },
  hero: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  crownIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(96, 165, 250, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  heroTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  heroSubtitle: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
  pricingCard: {
    padding: 24,
    borderRadius: 20,
    alignItems: 'center',
    marginVertical: 24,
  },
  priceAmount: {
    fontSize: 48,
    fontWeight: 'bold',
  },
  pricePeriod: {
    fontSize: 20,
  },
  priceDescription: {
    fontSize: 14,
    marginTop: 8,
  },
  featuresSection: {
    marginBottom: 32,
  },
  featuresTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },
  checkIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.skyBlue,
    justifyContent: 'center',
    alignItems: 'center',
  },
  featureText: {
    fontSize: 15,
    flex: 1,
  },
  highlights: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 32,
  },
  highlightCard: {
    width: '48%',
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
  },
  highlightIcon: {
    marginBottom: 12,
  },
  highlightTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
    textAlign: 'center',
  },
  highlightDescription: {
    fontSize: 13,
    textAlign: 'center',
  },
  subscribeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    borderRadius: 30,
    gap: 12,
    marginBottom: 24,
  },
  subscribeButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.white,
  },
  disclaimer: {
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
  },
});
