import { useState, useEffect } from 'react';
import createContextHook from '@nkzw/create-context-hook';
import { settingsService, BlockedUser } from '@/src/services/settingsService';

interface BlockedUsersContextValue {
  blockedUsers: BlockedUser[];
  isLoading: boolean;
  blockUser: (user: Omit<BlockedUser, 'blockedAt'>) => Promise<void>;
  unblockUser: (userId: string) => Promise<void>;
  isUserBlocked: (userId: string) => boolean;
  reloadBlockedUsers: () => Promise<void>;
}

export const [BlockedUsersProvider, useBlockedUsers] = createContextHook((): BlockedUsersContextValue => {
  const [blockedUsers, setBlockedUsers] = useState<BlockedUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadBlockedUsers();
  }, []);

  const loadBlockedUsers = async () => {
    try {
      const users = await settingsService.getBlockedUsers();
      setBlockedUsers(users);
    } catch (error) {
      console.error('[BlockedUsers] Failed to load blocked users:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const blockUser = async (user: Omit<BlockedUser, 'blockedAt'>) => {
    try {
      const updated = await settingsService.blockUser(user);
      setBlockedUsers(updated);
    } catch (error) {
      console.error('[BlockedUsers] Failed to block user:', error);
      throw error;
    }
  };

  const unblockUser = async (userId: string) => {
    try {
      const updated = await settingsService.unblockUser(userId);
      setBlockedUsers(updated);
    } catch (error) {
      console.error('[BlockedUsers] Failed to unblock user:', error);
      throw error;
    }
  };

  const isUserBlocked = (userId: string): boolean => {
    return blockedUsers.some(u => u.id === userId);
  };

  const reloadBlockedUsers = async () => {
    await loadBlockedUsers();
  };

  return {
    blockedUsers,
    isLoading,
    blockUser,
    unblockUser,
    isUserBlocked,
    reloadBlockedUsers,
  };
});
