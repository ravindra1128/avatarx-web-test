import React from 'react';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '../../Hooks/useLanguage';
import './LanguageSwitcher.css';

const LanguageSwitcher = ({ className = '' }) => {
  const { t } = useTranslation();
  const { currentLanguage, changeLanguage, availableLanguages } = useLanguage();

  const selectedLanguage = currentLanguage == 'null' || currentLanguage == '' ? 'en' : currentLanguage;
  // Assume only two languages for toggle
  const isFirstSelected = selectedLanguage === availableLanguages[0].code;

  return (
    <div className={`language-toggle-switch real-toggle ${className}`} role="group" aria-label={t('language.changeLanguage')}>
      <div className={`toggle-indicator${isFirstSelected ? ' left' : ' right'}`}></div>
      {availableLanguages.map((language) => (
        <button
          key={language.code}
          className={`toggle-option${selectedLanguage === language.code ? ' selected' : ''}`}
          onClick={() => changeLanguage(language.code)}
          aria-pressed={selectedLanguage === language.code}
        >
          {language.nativeName}
        </button>
      ))}
    </div>
  );
};

export default LanguageSwitcher; 