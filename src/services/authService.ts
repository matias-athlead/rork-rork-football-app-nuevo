import AsyncStorage from '@react-native-async-storage/async-storage';
import { User, UserRole } from '@/src/types/User';
import { googleAuthService } from './googleAuthService';
import * as AppleAuthentication from 'expo-apple-authentication';
import { Platform } from 'react-native';

const AUTH_TOKEN_KEY = '@athlead_auth_token';
const USER_DATA_KEY = '@athlead_user_data';
const USERS_STORAGE_KEY = '@athlead_registered_users';
const RESET_CODES_KEY = '@athlead_reset_codes';

export interface LoginCredentials {
  email: string;
  password: string;
  role?: UserRole;
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

// Simple hash para contraseñas (sin dependencias externas)
function hashPassword(password: string): string {
  let hash = 0;
  const salt = 'athlead_salt_2024';
  const str = password + salt;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return `hashed_${Math.abs(hash).toString(16)}_${str.length}`;
}

function generateToken(): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substr(2, 16);
  const expiry = timestamp + (7 * 24 * 60 * 60 * 1000); // 7 días
  return `jwt_${timestamp}_${random}_exp_${expiry}`;
}

function isTokenExpired(token: string): boolean {
  try {
    const parts = token.split('_exp_');
    if (parts.length < 2) return true;
    const expiry = parseInt(parts[1]);
    return Date.now() > expiry;
  } catch {
    return true;
  }
}

// Guardar usuario en el registro local
async function saveRegisteredUser(user: User, password: string): Promise<void> {
  let users: Record<string, any> = {};
  try {
    const existingData = await AsyncStorage.getItem(USERS_STORAGE_KEY);
    if (existingData) {
      users = JSON.parse(existingData);
    }
  } catch {
    // Existing data is corrupt — start with a fresh store
    users = {};
  }
  const key = user.email.toLowerCase().trim();
  users[key] = { user: { ...user, email: key }, passwordHash: hashPassword(password) };
  await AsyncStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
}

// Obtener usuario registrado
async function getRegisteredUser(email: string): Promise<{ user: User; passwordHash: string } | null> {
  try {
    const existingUsers = await AsyncStorage.getItem(USERS_STORAGE_KEY);
    if (!existingUsers) return null;
    const users = JSON.parse(existingUsers);
    const key = email.toLowerCase().trim();
    return users[key] || null;
  } catch {
    return null;
  }
}

export const authService = {
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    await new Promise(resolve => setTimeout(resolve, 800));

    if (!credentials.email || !credentials.password) {
      throw new Error('Email and password are required');
    }

    const email = credentials.email.toLowerCase().trim();

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new Error('Invalid email format');
    }

    if (credentials.password.length < 4) {
      throw new Error('Password must be at least 4 characters');
    }

    const registeredUser = await getRegisteredUser(email);

    if (!registeredUser) {
      throw new Error('User not found. Please register first.');
    }

    if (registeredUser.passwordHash !== hashPassword(credentials.password)) {
      throw new Error('Invalid password');
    }

    const token = generateToken();

    await AsyncStorage.setItem(AUTH_TOKEN_KEY, token);
    await AsyncStorage.setItem(USER_DATA_KEY, JSON.stringify(registeredUser.user));

    return { user: registeredUser.user, token };
  },

  async loginWithApple(): Promise<AuthResponse> {
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

      const email = credential.email || `${credential.user}@privaterelay.appleid.com`;
      const fullName = credential.fullName
        ? `${credential.fullName.givenName || ''} ${credential.fullName.familyName || ''}`.trim()
        : 'Apple User';

      let existingUser = await getRegisteredUser(email);

      if (!existingUser) {
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
            speed: 0, power: 0, sprints: 0, offBallRuns: 0,
            dribbles: 0, passAccuracy: 0, goals: 0, assists: 0,
            minutes: 0, matchesPlayed: 0, shotsOnTarget: 0,
          },
          radarStats: {
            speed: 0, passPercentage: 0, goalPercentage: 0,
            matchCompletionPercentage: 0, dribbles: 0,
          },
        };
        const tempPassword = `apple_${credential.user}_${Date.now()}`;
        await saveRegisteredUser(newUser, tempPassword);
        existingUser = { user: newUser, passwordHash: hashPassword(tempPassword) };
      }

      const token = generateToken();
      await AsyncStorage.setItem(AUTH_TOKEN_KEY, token);
      await AsyncStorage.setItem(USER_DATA_KEY, JSON.stringify(existingUser.user));

      return { user: existingUser.user, token };
    } catch (error: any) {
      if (error.code === 'ERR_CANCELED') {
        throw new Error('Apple Sign In was canceled');
      }
      throw error;
    }
  },

  async loginWithGoogle(): Promise<AuthResponse> {
    try {
      const { accessToken } = await googleAuthService.signInWithGoogle();
      const userInfo = await googleAuthService.getUserInfo(accessToken);

      let existingUser = await getRegisteredUser(userInfo.email);

      if (!existingUser) {
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
            speed: 0, power: 0, sprints: 0, offBallRuns: 0,
            dribbles: 0, passAccuracy: 0, goals: 0, assists: 0,
            minutes: 0, matchesPlayed: 0, shotsOnTarget: 0,
          },
          radarStats: {
            speed: 0, passPercentage: 0, goalPercentage: 0,
            matchCompletionPercentage: 0, dribbles: 0,
          },
        };
        const tempPassword = `google_${userInfo.id}_${Date.now()}`;
        await saveRegisteredUser(newUser, tempPassword);
        existingUser = { user: newUser, passwordHash: hashPassword(tempPassword) };
      }

      const token = generateToken();
      await AsyncStorage.setItem(AUTH_TOKEN_KEY, token);
      await AsyncStorage.setItem(USER_DATA_KEY, JSON.stringify(existingUser.user));

      return { user: existingUser.user, token };
    } catch (error) {
      throw error;
    }
  },

  async register(data: RegisterData): Promise<AuthResponse> {
    await new Promise(resolve => setTimeout(resolve, 1000));

    const email = data.email.toLowerCase().trim();

    const existingUser = await getRegisteredUser(email);
    if (existingUser) {
      throw new Error('User with this email already exists');
    }

    const age = data.age || 18;
    const birthYear = new Date().getFullYear() - age;
    const birthdate = data.birthdate || `${birthYear}-01-01`;

    const baseUser = {
      id: `user_${Date.now()}`,
      email,
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
          speed: 0, power: 0, sprints: 0, offBallRuns: 0,
          dribbles: 0, passAccuracy: 0, goals: 0, assists: 0,
          minutes: 0, matchesPlayed: 0, shotsOnTarget: 0,
        },
        radarStats: {
          speed: 0, passPercentage: 0, goalPercentage: 0,
          matchCompletionPercentage: 0, dribbles: 0,
        },
      };
    } else if (data.role === 'coach') {
      newUser = {
        ...baseUser,
        role: 'coach',
        club: data.currentClub || '',
        categories: [],
        radarStats: {
          winPercentage: 0, playerDevelopment: 0,
          trainingAttendance: 0, tacticsScore: 0, motivation: 0,
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
          winPercentage: 0, goalsPerGame: 0,
          cleanSheets: 0, youthDevelopment: 0, budgetManagement: 0,
        },
      };
    }

    const token = generateToken();
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

    if (!token || !userData) return null;

    // Bug fix: verificar si el token expiró
    if (isTokenExpired(token)) {
      await AsyncStorage.removeItem(AUTH_TOKEN_KEY);
      await AsyncStorage.removeItem(USER_DATA_KEY);
      return null;
    }

    return {
      token,
      user: JSON.parse(userData),
    };
  },

  async forgotPassword(email: string): Promise<{ success: boolean; method: string }> {
    await new Promise(resolve => setTimeout(resolve, 800));

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new Error('Invalid email format');
    }

    const user = await getRegisteredUser(email);
    if (!user) {
      throw new Error('User with this email not found');
    }

    // Bug fix: un único código guardado y devuelto correctamente
    const resetCode = Math.random().toString(36).substring(2, 8).toUpperCase();

    try {
      const existingCodes = await AsyncStorage.getItem(RESET_CODES_KEY);
      const codes = existingCodes ? JSON.parse(existingCodes) : {};
      codes[email] = {
        code: resetCode,
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
      };
      await AsyncStorage.setItem(RESET_CODES_KEY, JSON.stringify(codes));
    } catch {
      // silencioso
    }

    return { success: true, method: 'email', resetCode } as any;
  },

  async sendResetEmail(email: string): Promise<{ subject: string; body: string }> {
    // Bug fix: usar el código ya guardado en lugar de generar uno nuevo
    let resetCode = 'XXXXXX';
    try {
      const existingCodes = await AsyncStorage.getItem(RESET_CODES_KEY);
      if (existingCodes) {
        const codes = JSON.parse(existingCodes);
        if (codes[email]) {
          resetCode = codes[email].code;
        }
      }
    } catch {
      // silencioso
    }

    const subject = 'Athlead - Password Reset';
    const body = `Hello,\n\nYou have requested to reset your password for Athlead.\n\nYour reset code is: ${resetCode}\n\nThis code will expire in 30 minutes.\n\nIf you did not request this, please ignore this email.\n\nBest regards,\nThe Athlead Team`;

    return { subject, body };
  },

  async updateUser(user: User): Promise<User> {
    await AsyncStorage.setItem(USER_DATA_KEY, JSON.stringify(user));

    try {
      const existingUsers = await AsyncStorage.getItem(USERS_STORAGE_KEY);
      if (existingUsers) {
        const users = JSON.parse(existingUsers);
        if (users[user.email]) {
          users[user.email].user = user;
          await AsyncStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
        }
      }
    } catch {
      // silencioso
    }

    return user;
  },

  async clearAllAuthData(): Promise<void> {
    await AsyncStorage.multiRemove([
      AUTH_TOKEN_KEY,
      USER_DATA_KEY,
      USERS_STORAGE_KEY,
      RESET_CODES_KEY,
    ]);
  },

  async getAllUsers(): Promise<User[]> {
    try {
      const existingUsers = await AsyncStorage.getItem(USERS_STORAGE_KEY);
      if (!existingUsers) return [];
      const users = JSON.parse(existingUsers);
      return Object.values(users).map((u: any) => u.user);
    } catch {
      return [];
    }
  },
};
