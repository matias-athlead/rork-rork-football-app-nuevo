import AsyncStorage from '@react-native-async-storage/async-storage';

const PRIVACY_SETTINGS_KEY = '@athlead_privacy_settings';
const BLOCKED_USERS_KEY = '@athlead_blocked_users';

export interface PrivacySettings {
  isPrivate: boolean;
  showOnlineStatus: boolean;
  showReadReceipts: boolean;
  allowTagging: boolean;
  showStats: boolean;
}

export interface BlockedUser {
  id: string;
  username: string;
  fullName: string;
  profilePhoto: string;
  blockedAt: string;
}

const defaultPrivacySettings: PrivacySettings = {
  isPrivate: false,
  showOnlineStatus: true,
  showReadReceipts: true,
  allowTagging: true,
  showStats: true,
};

export const settingsService = {
  async getPrivacySettings(): Promise<PrivacySettings> {
    try {
      const stored = await AsyncStorage.getItem(PRIVACY_SETTINGS_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
      return defaultPrivacySettings;
    } catch (error) {
      console.error('Failed to load privacy settings:', error);
      return defaultPrivacySettings;
    }
  },

  async savePrivacySettings(settings: PrivacySettings): Promise<void> {
    try {
      await AsyncStorage.setItem(PRIVACY_SETTINGS_KEY, JSON.stringify(settings));
      console.log('[Settings] Privacy settings saved:', settings);
    } catch (error) {
      console.error('Failed to save privacy settings:', error);
      throw error;
    }
  },

  async updatePrivacySetting<K extends keyof PrivacySettings>(
    key: K,
    value: PrivacySettings[K]
  ): Promise<PrivacySettings> {
    const settings = await this.getPrivacySettings();
    const updated = { ...settings, [key]: value };
    await this.savePrivacySettings(updated);
    return updated;
  },

  async getBlockedUsers(): Promise<BlockedUser[]> {
    try {
      const stored = await AsyncStorage.getItem(BLOCKED_USERS_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
      return [];
    } catch (error) {
      console.error('Failed to load blocked users:', error);
      return [];
    }
  },

  async blockUser(user: Omit<BlockedUser, 'blockedAt'>): Promise<BlockedUser[]> {
    try {
      const blocked = await this.getBlockedUsers();
      const isAlreadyBlocked = blocked.some(u => u.id === user.id);
      
      if (isAlreadyBlocked) {
        console.log('[Settings] User already blocked:', user.username);
        return blocked;
      }

      const newBlockedUser: BlockedUser = {
        ...user,
        blockedAt: new Date().toISOString(),
      };

      const updated = [...blocked, newBlockedUser];
      await AsyncStorage.setItem(BLOCKED_USERS_KEY, JSON.stringify(updated));
      console.log('[Settings] User blocked:', user.username);
      return updated;
    } catch (error) {
      console.error('Failed to block user:', error);
      throw error;
    }
  },

  async unblockUser(userId: string): Promise<BlockedUser[]> {
    try {
      const blocked = await this.getBlockedUsers();
      const updated = blocked.filter(u => u.id !== userId);
      await AsyncStorage.setItem(BLOCKED_USERS_KEY, JSON.stringify(updated));
      console.log('[Settings] User unblocked:', userId);
      return updated;
    } catch (error) {
      console.error('Failed to unblock user:', error);
      throw error;
    }
  },

  async isUserBlocked(userId: string): Promise<boolean> {
    const blocked = await this.getBlockedUsers();
    return blocked.some(u => u.id === userId);
  },

  async clearAllSettings(): Promise<void> {
    try {
      await AsyncStorage.multiRemove([
        PRIVACY_SETTINGS_KEY,
        BLOCKED_USERS_KEY,
      ]);
      console.log('[Settings] All settings cleared');
    } catch (error) {
      console.error('Failed to clear settings:', error);
      throw error;
    }
  },
};
