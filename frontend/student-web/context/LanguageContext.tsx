// src/contexts/LanguageContext.tsx
import i18n from '@/locales/i18n';
import { useLanguageStore } from '@/stores/language';
import React, { createContext, useContext, useEffect, useState } from 'react';

type LanguageContextType = {
  language: 'en' | 'th';
  changeLanguage: (lang: 'en' | 'th') => void;
};

const LanguageContext = createContext<LanguageContextType>({
  language: 'en',
  changeLanguage: () => {},
});

type LanguageProviderProps = {
  children: React.ReactNode;
};

export const LanguageProvider = ({ children }: LanguageProviderProps) => {
  const { language, setLanguage } = useLanguageStore();
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    const init = async () => {
      await i18n.changeLanguage(language);
      setInitialized(true);
    };
    init();
  }, [language]);

  const changeLanguage = (lang: 'en' | 'th') => {
    i18n.changeLanguage(lang);
    setLanguage(lang);
  };

  if (!initialized) return null; // สามารถแทนด้วย Splash Screen ได้

  return (
    <LanguageContext.Provider value={{ language, changeLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
