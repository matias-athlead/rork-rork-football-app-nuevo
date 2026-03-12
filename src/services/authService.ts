import AsyncStorage from '@react-native-async-storage/async-storage';
import { User, UserRole } from '@/src/types/User';
import { googleAuthService } from './googleAuthService';
import * as AppleAuthentication from 'expo-apple-authentication';
import { Platform } from 'react-native';

const AUTH_TOKEN_KEY = '@athlead_auth_token';
const USER_DATA_KEY = '@athlead_user_data';
const USERS_STORAGE_KEY = '@athlead_registered_users';
const RESET_CODES_KEY = '@athlead_reset_codes';

// ---------------------------------------------------------------------------
// Storage abstraction — use localStorage directly on web to avoid AsyncStorage
// web polyfill quirks. On native, use AsyncStorage as normal.
// ---------------------------------------------------------------------------
const storage = {
  async getItem(key: string): Promise<string | null> {
    if (Platform.OS === 'web') {
      try { return window.localStorage.getItem(key); } catch { return null; }
    }
    return AsyncStorage.getItem(key);
  },
  async setItem(key: string, value: string): Promise<void> {
    if (Platform.OS === 'web') {
      try { window.localStorage.setItem(key, value); } catch (e) { throw e; }
      return;
    }
    return AsyncStorage.setItem(key, value);
  },
  async removeItem(key: string): Promise<void> {
    if (Platform.OS === 'web') {
      try { window.localStorage.removeItem(key); } catch {}
      return;
    }
    return AsyncStorage.removeItem(key);
  },
  async multiRemove(keys: string[]): Promise<void> {
    if (Platform.OS === 'web') {
      keys.forEach(k => { try { window.localStorage.removeItem(k); } catch {} });
      return;
    }
    return AsyncStorage.multiRemove(keys);
  },
};

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

// ---------------------------------------------------------------------------
// Password storage — stored as plain text (trimmed).
// This app has no backend; credentials live only in the user's own device storage.
// ---------------------------------------------------------------------------
function hashPassword(password: string): string {
  return password.trim();
}

function generateToken(): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substr(2, 16);
  const expiry = timestamp + (7 * 24 * 60 * 60 * 1000);
  return `jwt_${timestamp}_${random}_exp_${expiry}`;
}

function isTokenExpired(token: string): boolean {
  try {
    const parts = token.split('_exp_');
    if (parts.length < 2) return true;
    return Date.now() > parseInt(parts[1]);
  } catch {
    return true;
  }
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------
async function loadUsersStore(): Promise<Record<string, { user: User; passwordHash: string }>> {
  try {
    const raw = await storage.getItem(USERS_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    // Normalise any keys that weren't lowercased by older code
    const normalised: Record<string, any> = {};
    for (const [k, v] of Object.entries(parsed)) {
      normalised[k.toLowerCase().trim()] = v;
    }
    return normalised;
  } catch (e) {
    console.warn('[AUTH] loadUsersStore — corrupt data, resetting:', e);
    return {};
  }
}

async function saveUsersStore(users: Record<string, any>): Promise<void> {
  await storage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
}

async function saveRegisteredUser(user: User, password: string): Promise<void> {
  const users = await loadUsersStore();
  const key = user.email.toLowerCase().trim();
  const passwordHash = hashPassword(password);
  users[key] = { user: { ...user, email: key }, passwordHash };
  console.log('[AUTH] saveRegisteredUser — key:', key, '| hash:', passwordHash);
  await saveUsersStore(users);
}

async function getRegisteredUser(email: string): Promise<{ user: User; passwordHash: string } | null> {
  const users = await loadUsersStore();
  const key = email.toLowerCase().trim();
  const keys = Object.keys(users);
  console.log('[AUTH] getRegisteredUser — lookup:', key, '| stored keys:', keys);
  const entry = users[key] ?? null;
  console.log('[AUTH] getRegisteredUser — found:', !!entry);
  return entry;
}

// ---------------------------------------------------------------------------
// authService
// ---------------------------------------------------------------------------
export const authService = {
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    await new Promise(resolve => setTimeout(resolve, 400));

    const email = credentials.email.toLowerCase().trim();
    const password = credentials.password.trim();

    if (!email || !password) {
      throw new Error('Email and password are required');
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new Error(`Invalid email format: "${email}"`);
    }

    const users = await loadUsersStore();
    const storedKeys = Object.keys(users);
    console.log('[AUTH] login — email:', email, '| storedKeys:', storedKeys);

    const registeredUser = users[email] ?? null;

    if (!registeredUser) {
      const msg = storedKeys.length === 0
        ? 'No accounts found. Please register first.'
        : `No account found for "${email}". Registered emails: ${storedKeys.join(', ')}`;
      throw new Error(msg);
    }

    const computedHash = hashPassword(password);
    const storedHash = registeredUser.passwordHash;
    console.log('[AUTH] login — storedHash:', storedHash, '| computedHash:', computedHash, '| match:', storedHash === computedHash);

    if (storedHash !== computedHash) {
      throw new Error(`Incorrect password for "${email}". (If you just registered, try again — hash mismatch detected.)`);
    }

    const token = generateToken();
    await storage.setItem(AUTH_TOKEN_KEY, token);
    await storage.setItem(USER_DATA_KEY, JSON.stringify(registeredUser.user));

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
          email: email.toLowerCase().trim(),
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
      await storage.setItem(AUTH_TOKEN_KEY, token);
      await storage.setItem(USER_DATA_KEY, JSON.stringify(existingUser.user));

      return { user: existingUser.user, token };
    } catch (error: any) {
      if (error.code === 'ERR_CANCELED') {
        throw new Error('Apple Sign In was canceled');
      }
      throw error;
    }
  },

  async loginWithGoogle(): Promise<AuthResponse> {
    const { accessToken } = await googleAuthService.signInWithGoogle();
    const userInfo = await googleAuthService.getUserInfo(accessToken);

    let existingUser = await getRegisteredUser(userInfo.email);

    if (!existingUser) {
      const newUser: User = {
        id: `google_user_${Date.now()}`,
        email: userInfo.email.toLowerCase().trim(),
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
    await storage.setItem(AUTH_TOKEN_KEY, token);
    await storage.setItem(USER_DATA_KEY, JSON.stringify(existingUser.user));

    return { user: existingUser.user, token };
  },

  async register(data: RegisterData): Promise<AuthResponse> {
    await new Promise(resolve => setTimeout(resolve, 600));

    const email = data.email.toLowerCase().trim();
    const password = data.password.trim();

    if (!email || !password) {
      throw new Error('Email and password are required');
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new Error(`Invalid email format: "${email}"`);
    }

    if (password.length < 4) {
      throw new Error('Password must be at least 4 characters');
    }

    const users = await loadUsersStore();
    console.log('[AUTH] register — email:', email, '| existing keys:', Object.keys(users));

    if (users[email]) {
      throw new Error(`An account with "${email}" already exists. Please log in instead.`);
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

    await saveRegisteredUser(newUser, password);

    // Verify the save worked before issuing token
    const verify = await getRegisteredUser(email);
    if (!verify) {
      throw new Error('Registration failed: could not save account data. Please try again.');
    }

    const token = generateToken();
    await storage.setItem(AUTH_TOKEN_KEY, token);
    await storage.setItem(USER_DATA_KEY, JSON.stringify(newUser));

    console.log('[AUTH] register — success for:', email);
    return { user: newUser, token };
  },

  async logout(): Promise<void> {
    await storage.removeItem(AUTH_TOKEN_KEY);
    await storage.removeItem(USER_DATA_KEY);
  },

  async getStoredAuth(): Promise<AuthResponse | null> {
    const token = await storage.getItem(AUTH_TOKEN_KEY);
    const userData = await storage.getItem(USER_DATA_KEY);

    if (!token || !userData) return null;

    if (isTokenExpired(token)) {
      await storage.removeItem(AUTH_TOKEN_KEY);
      await storage.removeItem(USER_DATA_KEY);
      return null;
    }

    return { token, user: JSON.parse(userData) };
  },

  async forgotPassword(email: string): Promise<{ success: boolean; method: string }> {
    await new Promise(resolve => setTimeout(resolve, 800));

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) throw new Error('Invalid email format');

    const user = await getRegisteredUser(email);
    if (!user) throw new Error('No account found for this email');

    const resetCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    try {
      const raw = await storage.getItem(RESET_CODES_KEY);
      const codes = raw ? JSON.parse(raw) : {};
      codes[email.toLowerCase().trim()] = {
        code: resetCode,
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
      };
      await storage.setItem(RESET_CODES_KEY, JSON.stringify(codes));
    } catch {}

    return { success: true, method: 'email', resetCode } as any;
  },

  async sendResetEmail(email: string): Promise<{ subject: string; body: string }> {
    let resetCode = 'XXXXXX';
    try {
      const raw = await storage.getItem(RESET_CODES_KEY);
      if (raw) {
        const codes = JSON.parse(raw);
        const key = email.toLowerCase().trim();
        if (codes[key]) resetCode = codes[key].code;
      }
    } catch {}

    const subject = 'Athlead - Password Reset';
    const body = `Hello,\n\nYou have requested to reset your password for Athlead.\n\nYour reset code is: ${resetCode}\n\nThis code will expire in 30 minutes.\n\nIf you did not request this, please ignore this email.\n\nBest regards,\nThe Athlead Team`;
    return { subject, body };
  },

  async updateUser(user: User): Promise<User> {
    await storage.setItem(USER_DATA_KEY, JSON.stringify(user));
    try {
      const users = await loadUsersStore();
      const key = user.email.toLowerCase().trim();
      if (users[key]) {
        users[key].user = user;
        await saveUsersStore(users);
      }
    } catch {}
    return user;
  },

  async debugReadAuthStorage(): Promise<void> {
    try {
      const [token, userData, usersRaw] = await Promise.all([
        storage.getItem(AUTH_TOKEN_KEY),
        storage.getItem(USER_DATA_KEY),
        storage.getItem(USERS_STORAGE_KEY),
      ]);
      console.log('[AUTH DEBUG] ==============================');
      console.log('[AUTH DEBUG] platform:', Platform.OS);
      console.log('[AUTH DEBUG] AUTH_TOKEN_KEY:', token ? token.substring(0, 40) + '...' : null);
      console.log('[AUTH DEBUG] USER_DATA_KEY email:', userData ? JSON.parse(userData).email : null);
      if (usersRaw) {
        const users = JSON.parse(usersRaw);
        const keys = Object.keys(users);
        console.log('[AUTH DEBUG] USERS_STORAGE_KEY — count:', keys.length, '| keys:', keys);
        keys.forEach(k => {
          const entry = users[k];
          console.log(`[AUTH DEBUG]   key="${k}" | hash:`, entry?.passwordHash ?? 'MISSING');
        });
      } else {
        console.log('[AUTH DEBUG] USERS_STORAGE_KEY: empty / null');
      }
      console.log('[AUTH DEBUG] ==============================');
    } catch (e) {
      console.error('[AUTH DEBUG] Error reading storage:', e);
    }
  },

  async clearAllAuthData(): Promise<void> {
    await storage.multiRemove([
      AUTH_TOKEN_KEY,
      USER_DATA_KEY,
      USERS_STORAGE_KEY,
      RESET_CODES_KEY,
    ]);
    console.log('[AUTH] clearAllAuthData — done');
  },

  async getAllUsers(): Promise<User[]> {
    try {
      const users = await loadUsersStore();
      return Object.values(users).map((u: any) => u.user);
    } catch {
      return [];
    }
  },
};
