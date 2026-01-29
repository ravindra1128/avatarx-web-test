import React from 'react';
import { useTranslation } from 'react-i18next';

const PageNotFound = () => {
    const { t } = useTranslation();
    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 px-4 lg:mb-[-120px]">
            <div className="text-center max-w-md">
                <h1 className="text-6xl font-bold text-gray-800 mb-4 animate-bounce">404</h1>
                <h2 className="text-3xl font-semibold text-gray-800 mb-2 animate-fade-in">{t('errors.pageNotFound')}</h2>
                <p className="text-gray-600 mb-8 animate-fade-in" style={{animationDelay: '0.3s'}}>{t('errors.pageNotFoundMessage')}</p>
                <div className="flex justify-center">
                    <a 
                        href="/"
                        className="px-6 py-3 bg-gray-800 !text-white font-medium rounded-md hover:bg-gray-900 transition-all duration-300 shadow-md hover:scale-105 animate-fade-in"
                        style={{animationDelay: '0.6s'}}
                    >
                        {t('errors.returnHome')}
                    </a>
                </div>
            </div>
        </div>
    );
}

export default PageNotFound;
