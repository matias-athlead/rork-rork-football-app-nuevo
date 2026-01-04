import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import en from './en.json';
import es from './es.json';

const LANGUAGE_STORAGE_KEY = 'athlead_language';

const resources = {
  en: { translation: en },
  es: { translation: es },
};

const initI18n = async () => {
  const savedLanguage = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);

  i18n
    .use(initReactI18next)
    .init({
      resources,
      lng: savedLanguage || 'en',
      fallbackLng: 'en',
      interpolation: {
        escapeValue: false,
      },
      compatibilityJSON: 'v4',
    });
};

export const changeLanguage = async (language: string) => {
  await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, language);
  await i18n.changeLanguage(language);
};

export const getCurrentLanguage = () => i18n.language;

initI18n();

export default i18n;
