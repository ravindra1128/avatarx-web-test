import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from './button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from './dialog';

const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'es', label: 'Español' },
];

export default function LanguageSelectModal({ open, onClose, onSelect, loading }) {
  const { t } = useTranslation();
  const [selected, setSelected] = useState('en');

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen) {
          onClose();
        }
      }}
      className="!bg-white border-none shadow-none"
    >
      <DialogContent className="bg-white border-none shadow-none max-w-md mx-auto">
        <DialogHeader className="!p-0 mb-6">
          <DialogTitle className="!text-center text-2xl font-bold text-gray-900">
            {t('language.selectInvitationLanguage')}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-6">
          <p className="text-sm text-gray-600 text-center leading-relaxed">
            {t('language.chooseLanguageDescription')}
          </p>
          
          <div className="grid grid-cols-1 gap-3">
            {LANGUAGES.map(({ code, label }) => (
              <div
                key={code}
                className={`relative rounded-xl p-4 border-2 transition-all duration-300 cursor-pointer hover:shadow-lg hover:scale-[1.02] select-none group
                  ${selected === code 
                    ? 'border-black bg-gray-50 shadow-md scale-[1.02]' 
                    : 'border-gray-200 hover:border-gray-400 bg-white'
                  }`}
                onClick={() => setSelected(code)}
                tabIndex={0}
                onKeyDown={e => { 
                  if (e.key === 'Enter' || e.key === ' ') { 
                    setSelected(code); 
                  } 
                }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <span className={`text-base font-semibold transition-colors duration-200
                      ${selected === code ? 'text-black' : 'text-gray-700 group-hover:text-gray-900'}`}>
                      {label}
                    </span>
                  </div>
                  {selected === code && (
                    <div className="w-6 h-6 bg-black rounded-full flex items-center justify-center">
                      <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                  )}
                </div>
                
                {/* Subtle overlay for selected state */}
                {selected === code && (
                  <div className="absolute inset-0 bg-gradient-to-r from-gray-900/5 to-gray-700/5 rounded-xl pointer-events-none" />
                )}
              </div>
            ))}
          </div>
          
          <div className="flex flex-col space-y-3 pt-4">
            <Button
              onClick={() => onSelect(selected)}
              disabled={loading}
              className="w-full bg-black hover:bg-gray-800 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-300 transform hover:scale-[1.02] hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {loading ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>{t('language.sending')}</span>
                </div>
              ) : (
                <span>{t('language.sendInvite')}</span>
              )}
            </Button>
            
            <Button 
              variant="outline" 
              onClick={onClose} 
              disabled={loading} 
              className="w-full border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400 font-medium py-3 px-6 rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {t('language.cancel')}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}