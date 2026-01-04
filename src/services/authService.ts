import AsyncStorage from '@react-native-async-storage/async-storage';
import { User, UserRole } from '@/src/types/User';
import { MOCK_USERS } from './mockData';
import { googleAuthService } from './googleAuthService';

const AUTH_TOKEN_KEY = '@athlead_auth_token';
const USER_DATA_KEY = '@athlead_user_data';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  username: string;
  fullName: string;
  role: UserRole;
  age?: number;
  birthdate?: string;
  positions?: string[];
  federation?: string;
  currentClub?: string;
  city?: string;
  profilePhoto?: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

function generateMockToken(): string {
  return `mock_jwt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export const authService = {
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    await new Promise(resolve => setTimeout(resolve, 800));

    const user = MOCK_USERS.find(u => u.email === credentials.email);
    
    if (!user) {
      throw new Error('Invalid credentials');
    }

    const token = generateMockToken();
    
    await AsyncStorage.setItem(AUTH_TOKEN_KEY, token);
    await AsyncStorage.setItem(USER_DATA_KEY, JSON.stringify(user));

    return { user, token };
  },

  async loginWithGoogle(): Promise<AuthResponse> {
    console.log('[Auth] Starting Google login...');
    
    try {
      const { accessToken } = await googleAuthService.signInWithGoogle();
      const userInfo = await googleAuthService.getUserInfo(accessToken);

      console.log('[Auth] Google user info received:', userInfo.email);

      let user = MOCK_USERS.find(u => u.email === userInfo.email);

      if (!user) {
        console.log('[Auth] Creating new user from Google account');
        const newUser: User = {
          id: `google_user_${Date.now()}`,
          email: userInfo.email,
          username: userInfo.email.split('@')[0],
          fullName: userInfo.name,
          role: 'player',
          profilePhoto: userInfo.picture,
          coverPhoto: 'https://images.unsplash.com/photo-1540747913346-19e32778a8e?w=800&h=300&fit=crop',
          bio: '',
          followers: 0,
          following: 0,
          isPrivate: false,
          isPremium: false,
          createdAt: new Date().toISOString(),
          birthdate: '1990-01-01',
          city: '',
          federation: 'RFEF',
          age: 25,
          currentClub: '',
          positions: [],
          stats: {
            speed: 0,
            power: 0,
            sprints: 0,
            offBallRuns: 0,
            dribbles: 0,
            passAccuracy: 0,
            goals: 0,
            assists: 0,
            minutes: 0,
            matchesPlayed: 0,
            shotsOnTarget: 0,
          },
          radarStats: {
            speed: 0,
            passPercentage: 0,
            goalPercentage: 0,
            matchCompletionPercentage: 0,
            dribbles: 0,
          },
        };
        user = newUser;
      }

      const token = generateMockToken();

      await AsyncStorage.setItem(AUTH_TOKEN_KEY, token);
      await AsyncStorage.setItem(USER_DATA_KEY, JSON.stringify(user));

      console.log('[Auth] Google login successful');
      return { user, token };
    } catch (error) {
      console.error('[Auth] Google login failed:', error);
      throw error;
    }
  },

  async register(data: RegisterData): Promise<AuthResponse> {
    await new Promise(resolve => setTimeout(resolve, 1000));

    const age = data.age || 18;
    const birthYear = new Date().getFullYear() - age;
    const birthdate = `${birthYear}-01-01`;

    const baseUser = {
      id: `new_user_${Date.now()}`,
      email: data.email,
      username: data.username,
      fullName: data.fullName,
      profilePhoto: data.profilePhoto || 'https://i.pravatar.cc/300?img=50',
      coverPhoto: 'https://images.unsplash.com/photo-1540747913346-19e32778a8e?w=800&h=300&fit=crop',
      bio: '',
      followers: 0,
      following: 0,
      isPrivate: false,
      isPremium: false,
      createdAt: new Date().toISOString(),
      birthdate,
      city: data.city || '',
      federation: (data.federation || 'RFEF') as any,
    };

    let newUser: User;

    if (data.role === 'player') {
      newUser = {
        ...baseUser,
        role: 'player',
        age,
        currentClub: data.currentClub || '',
        positions: (data.positions || []) as any[],
        stats: {
          speed: 0,
          power: 0,
          sprints: 0,
          offBallRuns: 0,
          dribbles: 0,
          passAccuracy: 0,
          goals: 0,
          assists: 0,
          minutes: 0,
          matchesPlayed: 0,
          shotsOnTarget: 0,
        },
        radarStats: {
          speed: 0,
          passPercentage: 0,
          goalPercentage: 0,
          matchCompletionPercentage: 0,
          dribbles: 0,
        },
      };
    } else if (data.role === 'coach') {
      newUser = {
        ...baseUser,
        role: 'coach',
        club: data.currentClub || '',
        categories: [],
        radarStats: {
          winPercentage: 0,
          playerDevelopment: 0,
          trainingAttendance: 0,
          tacticsScore: 0,
          motivation: 0,
        },
      };
    } else {
      newUser = {
        ...baseUser,
        role: 'club',
        clubName: data.fullName,
        badge: 'https://i.pravatar.cc/200?img=50',
        responsiblePerson: '',
        coaches: [],
        radarStats: {
          winPercentage: 0,
          goalsPerGame: 0,
          cleanSheets: 0,
          youthDevelopment: 0,
          budgetManagement: 0,
        },
      };
    }

    const token = generateMockToken();

    await AsyncStorage.setItem(AUTH_TOKEN_KEY, token);
    await AsyncStorage.setItem(USER_DATA_KEY, JSON.stringify(newUser));

    return { user: newUser, token };
  },

  async logout(): Promise<void> {
    await AsyncStorage.removeItem(AUTH_TOKEN_KEY);
    await AsyncStorage.removeItem(USER_DATA_KEY);
  },

  async getStoredAuth(): Promise<AuthResponse | null> {
    const token = await AsyncStorage.getItem(AUTH_TOKEN_KEY);
    const userData = await AsyncStorage.getItem(USER_DATA_KEY);

    if (!token || !userData) {
      return null;
    }

    return {
      token,
      user: JSON.parse(userData)
    };
  },

  async forgotPassword(email: string): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 800));
    console.log('Password reset email sent to:', email);
  },

  async updateUser(user: User): Promise<User> {
    await AsyncStorage.setItem(USER_DATA_KEY, JSON.stringify(user));
    return user;
  }
};
