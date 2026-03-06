import AsyncStorage from '@react-native-async-storage/async-storage';
import { User, UserRole } from '@/src/types/User';
import { googleAuthService } from './googleAuthService';
import * as AppleAuthentication from 'expo-apple-authentication';
import { Platform } from 'react-native';

const AUTH_TOKEN_KEY = '@athlead_auth_token';
const USER_DATA_KEY = '@athlead_user_data';
const USERS_STORAGE_KEY = '@athlead_registered_users';

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

// Guardar usuario en el registro local
async function saveRegisteredUser(user: User, password: string): Promise<void> {
  try {
    const existingUsers = await AsyncStorage.getItem(USERS_STORAGE_KEY);
    const users = existingUsers ? JSON.parse(existingUsers) : {};
    users[user.email] = { user, password };
    await AsyncStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
  } catch (error) {
    console.log('Error saving registered user:', error);
  }
}

// Obtener usuario registrado
async function getRegisteredUser(email: string): Promise<{ user: User; password: string } | null> {
  try {
    const existingUsers = await AsyncStorage.getItem(USERS_STORAGE_KEY);
    if (!existingUsers) return null;
    const users = JSON.parse(existingUsers);
    return users[email] || null;
  } catch (error) {
    console.log('Error getting registered user:', error);
    return null;
  }
}

export const authService = {
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    await new Promise(resolve => setTimeout(resolve, 800));

    if (!credentials.email || !credentials.password) {
      throw new Error('Email and password are required');
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(credentials.email)) {
      throw new Error('Invalid email format');
    }

    if (credentials.password.length < 4) {
      throw new Error('Password must be at least 4 characters');
    }

    // Buscar usuario registrado
    const registeredUser = await getRegisteredUser(credentials.email);
    
    if (!registeredUser) {
      throw new Error('User not found. Please register first.');
    }

    if (registeredUser.password !== credentials.password) {
      throw new Error('Invalid password');
    }

    const token = generateMockToken();
    
    await AsyncStorage.setItem(AUTH_TOKEN_KEY, token);
    await AsyncStorage.setItem(USER_DATA_KEY, JSON.stringify(registeredUser.user));

    return { user: registeredUser.user, token };
  },

  async loginWithApple(): Promise<AuthResponse> {
    console.log('[Auth] Starting Apple login...');
    
    if (Platform.OS !== 'ios') {
      throw new Error('Apple Sign In is only available on iOS');
    }

    try {
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });

      console.log('[Auth] Apple credential received:', credential.user);

      const email = credential.email || `${credential.user}@privaterelay.appleid.com`;
      const fullName = credential.fullName
        ? `${credential.fullName.givenName || ''} ${credential.fullName.familyName || ''}`.trim()
        : 'Apple User';

      // Buscar si el usuario ya existe
      let existingUser = await getRegisteredUser(email);

      if (!existingUser) {
        console.log('[Auth] Creating new user from Apple account');
        const newUser: User = {
          id: `apple_user_${Date.now()}`,
          email,
          username: email.split('@')[0],
          fullName,
          role: 'player',
          profilePhoto: 'https://i.pravatar.cc/300?img=50',
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
        await saveRegisteredUser(newUser, `apple_${Date.now()}`);
        existingUser = { user: newUser, password: '' };
      }

      const token = generateMockToken();

      await AsyncStorage.setItem(AUTH_TOKEN_KEY, token);
      await AsyncStorage.setItem(USER_DATA_KEY, JSON.stringify(existingUser.user));

      console.log('[Auth] Apple login successful');
      return { user: existingUser.user, token };
    } catch (error: any) {
      console.error('[Auth] Apple login failed:', error);
      if (error.code === 'ERR_CANCELED') {
        throw new Error('Apple Sign In was canceled');
      }
      throw error;
    }
  },

  async loginWithGoogle(): Promise<AuthResponse> {
    console.log('[Auth] Starting Google login...');
    
    try {
      const { accessToken } = await googleAuthService.signInWithGoogle();
      const userInfo = await googleAuthService.getUserInfo(accessToken);

      console.log('[Auth] Google user info received:', userInfo.email);

      // Buscar si el usuario ya existe
      let existingUser = await getRegisteredUser(userInfo.email);

      if (!existingUser) {
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
        await saveRegisteredUser(newUser, `google_${Date.now()}`);
        existingUser = { user: newUser, password: '' };
      }

      const token = generateMockToken();

      await AsyncStorage.setItem(AUTH_TOKEN_KEY, token);
      await AsyncStorage.setItem(USER_DATA_KEY, JSON.stringify(existingUser.user));

      console.log('[Auth] Google login successful');
      return { user: existingUser.user, token };
    } catch (error) {
      console.error('[Auth] Google login failed:', error);
      throw error;
    }
  },

  async register(data: RegisterData): Promise<AuthResponse> {
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Verificar si el usuario ya existe
    const existingUser = await getRegisteredUser(data.email);
    if (existingUser) {
      throw new Error('User with this email already exists');
    }

    const age = data.age || 18;
    const birthYear = new Date().getFullYear() - age;
    const birthdate = data.birthdate || `${birthYear}-01-01`;

    const baseUser = {
      id: `user_${Date.now()}`,
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

    // Guardar usuario registrado
    await saveRegisteredUser(newUser, data.password);
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

  async forgotPassword(email: string): Promise<{ success: boolean; method: string }> {
    await new Promise(resolve => setTimeout(resolve, 800));
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new Error('Invalid email format');
    }

    // Verificar que el usuario existe
    const user = await getRegisteredUser(email);
    if (!user) {
      throw new Error('User with this email not found');
    }

    console.log('Password reset requested for:', email);
    
    const resetCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    const RESET_CODES_KEY = '@athlead_reset_codes';
    
    try {
      const existingCodes = await AsyncStorage.getItem(RESET_CODES_KEY);
      const codes = existingCodes ? JSON.parse(existingCodes) : {};
      codes[email] = {
        code: resetCode,
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
      };
      await AsyncStorage.setItem(RESET_CODES_KEY, JSON.stringify(codes));
    } catch (error) {
      console.log('Error storing reset code:', error);
    }

    return { success: true, method: 'email' };
  },

  async sendResetEmail(_email: string): Promise<{ subject: string; body: string }> {
    const resetCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    
    const subject = 'Athlead - Password Reset';
    const body = `Hello,\n\nYou have requested to reset your password for Athlead.\n\nYour reset code is: ${resetCode}\n\nThis code will expire in 30 minutes.\n\nIf you did not request this, please ignore this email.\n\nBest regards,\nThe Athlead Team`;
    
    return { subject, body };
  },

  async updateUser(user: User): Promise<User> {
    await AsyncStorage.setItem(USER_DATA_KEY, JSON.stringify(user));
    
    // También actualizar en la lista de usuarios registrados
    try {
      const existingUsers = await AsyncStorage.getItem(USERS_STORAGE_KEY);
      if (existingUsers) {
        const users = JSON.parse(existingUsers);
        if (users[user.email]) {
          users[user.email].user = user;
          await AsyncStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
        }
      }
    } catch (error) {
      console.log('Error updating user in registry:', error);
    }
    
    return user;
  },

  // Obtener todos los usuarios registrados (para búsqueda)
  async getAllUsers(): Promise<User[]> {
    try {
      const existingUsers = await AsyncStorage.getItem(USERS_STORAGE_KEY);
      if (!existingUsers) return [];
      const users = JSON.parse(existingUsers);
      return Object.values(users).map((u: any) => u.user);
    } catch (error) {
      console.log('Error getting all users:', error);
      return [];
    }
  }
};
