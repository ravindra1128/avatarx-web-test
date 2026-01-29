import React from 'react';
import { useTranslation } from 'react-i18next';

const TranslationExample = () => {
  const { t } = useTranslation();

  return (
    <div className="translation-example">
      <h1>{t('landing.hero.title')}</h1>
      <p>{t('landing.hero.subtitle')}</p>
      
      <div className="buttons">
        <button>{t('landing.hero.talkToExpert')}</button>
        <button>{t('landing.hero.tryDemo')}</button>
      </div>
      
      <h2>{t('landing.whatWeDo.title')}</h2>
      <p>{t('landing.whatWeDo.subtitle')}</p>
      
      <div className="services">
        <div className="service">
          <h3>{t('landing.whatWeDo.chronicCare.title')}</h3>
          <p>{t('landing.whatWeDo.chronicCare.description')}</p>
        </div>
        <div className="service">
          <h3>{t('landing.whatWeDo.remoteMonitoring.title')}</h3>
          <p>{t('landing.whatWeDo.remoteMonitoring.description')}</p>
        </div>
      </div>
    </div>
  );
};

export default TranslationExample; 