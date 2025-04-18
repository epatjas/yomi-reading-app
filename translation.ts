import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Import translation files
import enCommon from './translations/en/common.json';
import fiCommon from './translations/fi/common.json';

// Define resources
const resources = {
  en: {
    common: enCommon
  },
  fi: {
    common: fiCommon
  }
};

// Initialize with synchronous configuration only
i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'en',
    fallbackLng: 'en',
    ns: ['common'],
    defaultNS: 'common',
    interpolation: {
      escapeValue: false
    },
    react: {
      useSuspense: false // Disable suspense which can cause issues on React Native
    }
  });

// Function to load the language but don't call it during import
export const loadSavedLanguage = async () => {
  try {
    const language = await AsyncStorage.getItem('userLanguage');
    if (language) {
      i18n.changeLanguage(language);
    }
    return language || 'en';
  } catch (error) {
    console.error('Error loading language preference:', error);
    return 'en';
  }
};

// Export function to change language
export const changeLanguage = async (language: string) => {
  try {
    await AsyncStorage.setItem('userLanguage', language);
    i18n.changeLanguage(language);
  } catch (error) {
    console.error('Error setting user language:', error);
  }
};

export default i18n; 