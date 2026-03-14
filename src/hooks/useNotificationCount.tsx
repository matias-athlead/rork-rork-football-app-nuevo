import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { AppState } from 'react-native';
import { notificationService } from '@/src/services/notificationService';
import { useAuth } from './useAuth';

interface NotificationCountContextValue {
  unreadCount: number;
  refreshCount: () => Promise<void>;
  resetCount: () => void;
}

const NotificationCountContext = createContext<NotificationCountContextValue>({
  unreadCount: 0,
  refreshCount: async () => {},
  resetCount: () => {},
});

export function NotificationCountProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  const refreshCount = useCallback(async () => {
    if (!user) {
      setUnreadCount(0);
      return;
    }
    const count = await notificationService.getUnreadCount(user.id);
    setUnreadCount(count);
  }, [user]);

  const resetCount = useCallback(() => {
    setUnreadCount(0);
  }, []);

  // Poll every 10 seconds
  useEffect(() => {
    refreshCount();
    const interval = setInterval(refreshCount, 10000);
    return () => clearInterval(interval);
  }, [refreshCount]);

  // Refresh when app comes to foreground
  useEffect(() => {
    const sub = AppState.addEventListener('change', state => {
      if (state === 'active') refreshCount();
    });
    return () => sub.remove();
  }, [refreshCount]);

  return React.createElement(
    NotificationCountContext.Provider,
    { value: { unreadCount, refreshCount, resetCount } },
    children,
  );
}

export function useNotificationCount() {
  return useContext(NotificationCountContext);
}
