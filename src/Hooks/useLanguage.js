import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

export const useLanguage = () => {
  const { i18n } = useTranslation();
  const [currentLanguage, setCurrentLanguage] = useState(i18n.language);

  useEffect(() => {
    setCurrentLanguage(i18n.language);
  }, [i18n.language]);

  const changeLanguage = (language) => {
    i18n.changeLanguage(language);
    localStorage.setItem("userLanguage", language);
    localStorage.setItem("selected_language", language);
    setCurrentLanguage(language);
    
    // Update HTML lang attribute
    document.documentElement.lang = language;
    
    // Store in localStorage
    localStorage.setItem('i18nextLng', language);
  };

  const toggleLanguage = () => {
    const newLanguage = currentLanguage === 'en' ? 'es' : 'en';
    changeLanguage(newLanguage);
  };

  const isEnglish = currentLanguage === 'en';
  const isSpanish = currentLanguage === 'es';

  return {
    currentLanguage,
    changeLanguage,
    toggleLanguage,
    isEnglish,
    isSpanish,
    availableLanguages: [
      { code: 'en', name: 'English', nativeName: 'English' },
      { code: 'es', name: 'Spanish', nativeName: 'Español' }
    ]
  };
}; 