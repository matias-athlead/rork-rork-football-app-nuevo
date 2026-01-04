import { useState, useEffect } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import createContextHook from '@nkzw/create-context-hook';
import { lightTheme, darkTheme, Theme } from '@/src/utils/theme';

const THEME_KEY = '@athlead_theme';

type ThemeMode = 'light' | 'dark' | 'auto';

interface ThemeContextValue {
  theme: Theme;
  themeMode: ThemeMode;
  isDark: boolean;
  setThemeMode: (mode: ThemeMode) => Promise<void>;
}

export const [ThemeProvider, useTheme] = createContextHook((): ThemeContextValue => {
  const systemColorScheme = useColorScheme();
  const [themeMode, setThemeModeState] = useState<ThemeMode>('auto');

  useEffect(() => {
    loadThemeMode();
  }, []);

  const loadThemeMode = async () => {
    try {
      const stored = await AsyncStorage.getItem(THEME_KEY);
      if (stored) {
        setThemeModeState(stored as ThemeMode);
      }
    } catch (error) {
      console.error('Failed to load theme:', error);
    }
  };

  const setThemeMode = async (mode: ThemeMode) => {
    setThemeModeState(mode);
    await AsyncStorage.setItem(THEME_KEY, mode);
  };

  const isDark = themeMode === 'auto' 
    ? systemColorScheme === 'dark'
    : themeMode === 'dark';

  const theme = isDark ? darkTheme : lightTheme;

  return {
    theme,
    themeMode,
    isDark,
    setThemeMode
  };
});
