export interface PremiumPlan {
  id: string;
  role: 'player' | 'coach' | 'club';
  name: string;
  price: number;
  currency: string;
  features: string[];
}

export interface PremiumFeature {
  id: string;
  name: string;
  description: string;
  requiredPremium: boolean;
}

export const PREMIUM_FEATURES = {
  player: [
    'AI video analysis with detailed metrics',
    'See who viewed your profile',
    'Annual performance recap',
    'Video calls with coaches',
    'Priority in search rankings',
    'AI-generated reports'
  ],
  coach: [
    'Player performance dashboard',
    'Create team lineups',
    'Create and manage groups',
    'Video calls with players',
    'Export player reports',
    'AI-generated training plans'
  ],
  club: [
    'Coach network access',
    'Federation statistics',
    'Top players AI recommendations',
    'Video calls',
    'Club analytics dashboard',
    'Multi-admin support'
  ]
};
