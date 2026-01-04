import { useState, useEffect } from 'react';
import createContextHook from '@nkzw/create-context-hook';
import { settingsService, PrivacySettings } from '@/src/services/settingsService';

interface PrivacySettingsContextValue {
  settings: PrivacySettings;
  isLoading: boolean;
  updateSetting: <K extends keyof PrivacySettings>(key: K, value: PrivacySettings[K]) => Promise<void>;
  reloadSettings: () => Promise<void>;
}

export const [PrivacySettingsProvider, usePrivacySettings] = createContextHook((): PrivacySettingsContextValue => {
  const [settings, setSettings] = useState<PrivacySettings>({
    isPrivate: false,
    showOnlineStatus: true,
    showReadReceipts: true,
    allowTagging: true,
    showStats: true,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const stored = await settingsService.getPrivacySettings();
      setSettings(stored);
    } catch (error) {
      console.error('[PrivacySettings] Failed to load settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateSetting = async <K extends keyof PrivacySettings>(
    key: K,
    value: PrivacySettings[K]
  ) => {
    try {
      const updated = await settingsService.updatePrivacySetting(key, value);
      setSettings(updated);
    } catch (error) {
      console.error('[PrivacySettings] Failed to update setting:', error);
      throw error;
    }
  };

  const reloadSettings = async () => {
    await loadSettings();
  };

  return {
    settings,
    isLoading,
    updateSetting,
    reloadSettings,
  };
});
