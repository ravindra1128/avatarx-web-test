import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Import translation files
import en from './locales/en.json';
import es from './locales/es.json';

const resources = {
  en: {
    translation: en
  },
  es: {
    translation: es
  }
};

i18n
  // .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    lng: 'en',
    resources,
    fallbackLng: 'en',
    debug: process.env.NODE_ENV === 'development',
    
    interpolation: {
      escapeValue: false, // React already escapes values
    },
    
    // detection: {
    //   order: ['localStorage', 'navigator', 'htmlTag'],
    //   caches: ['localStorage'],
    //   // Normalize language codes to base language
    //   lookupLocalStorage: 'i18nextLng',
    //   lookupSessionStorage: 'i18nextLng',
    //   lookupCookie: 'i18nextLng',
    //   lookupQuerystring: 'lng',
    //   lookupFromPathIndex: 0,
    //   lookupFromSubdomainIndex: 0,
      
    //   // Convert locale codes to base language codes
    //   convertDetectedLanguage: (lng) => {
    //     // Convert locale codes like 'en-GB', 'en-US' to 'en'
    //     if (lng && lng.includes('-')) {
    //       return lng.split('-')[0];
    //     }
    //     return lng;
    //   }
    // },
  });

export default i18n; 