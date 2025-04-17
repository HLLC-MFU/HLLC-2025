// src/contexts/LanguageContext.tsx
import i18n from '@/locales/i18n';
import React, { createContext, useContext, useState, useEffect } from 'react';


type LanguageContextType = {
  language: "en" | "th";
  changeLanguage: (lang: "en" | "th") => void;
};

const LanguageContext = createContext<LanguageContextType>({
  language: 'en' as const,
  changeLanguage: () => {},
});

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<"en" | "th">(i18n.language as "en" | "th");

  const changeLanguage = (lang: string) => {
    i18n.changeLanguage(lang);
    setLanguage(lang as "en" | "th");
  };

  useEffect(() => {
    setLanguage(i18n.language as "en" | "th");
  }, []);

  return (
    <LanguageContext.Provider value={{ language, changeLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
