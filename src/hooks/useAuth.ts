import { useState, useEffect } from 'react';
import createContextHook from '@nkzw/create-context-hook';
import { User } from '@/src/types/User';
import { authService, LoginCredentials, RegisterData } from '@/src/services/authService';

interface AuthContextValue {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  loginWithApple: () => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (user: User) => Promise<void>;
  deleteAccount: () => Promise<void>;
  clearAllAuthData: () => Promise<void>;
}

export const [AuthProvider, useAuth] = createContextHook((): AuthContextValue => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadStoredAuth();
  }, []);

  const loadStoredAuth = async () => {
    try {
      const stored = await authService.getStoredAuth();
      if (stored) {
        setUser(stored.user);
        setToken(stored.token);
      }
    } catch (error) {
      console.error('Failed to load auth:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (credentials: LoginCredentials) => {
    const response = await authService.login(credentials);
    setUser(response.user);
    setToken(response.token);
  };

  const loginWithGoogle = async () => {
    const response = await authService.loginWithGoogle();
    setUser(response.user);
    setToken(response.token);
  };

  const loginWithApple = async () => {
    const response = await authService.loginWithApple();
    setUser(response.user);
    setToken(response.token);
  };

  const register = async (data: RegisterData) => {
    const response = await authService.register(data);
    setUser(response.user);
    setToken(response.token);
  };

  const logout = async () => {
    await authService.logout();
    setUser(null);
    setToken(null);
  };

  const updateUser = async (updatedUser: User) => {
    const updated = await authService.updateUser(updatedUser);
    setUser(updated);
  };

  const deleteAccount = async () => {
    if (!user) return;
    await authService.deleteAccount(user.id, user.email);
    setUser(null);
    setToken(null);
  };

  const clearAllAuthData = async () => {
    await authService.clearAllAuthData();
    setUser(null);
    setToken(null);
  };

  return {
    user,
    token,
    isLoading,
    isAuthenticated: !!user && !!token,
    login,
    loginWithGoogle,
    loginWithApple,
    register,
    logout,
    updateUser,
    deleteAccount,
    clearAllAuthData,
  };
});
