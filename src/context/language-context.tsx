
"use client";

import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import tr from '@/lib/locales/tr.json';
import en from '@/lib/locales/en.json';
import fr from '@/lib/locales/fr.json';

type Language = 'tr' | 'en' | 'fr';

interface LanguageContextType {
  language: Language;
  setLanguage: (language: Language) => void;
  translations: typeof tr;
}

const translations = { tr, en, fr };

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguage] = useState<Language>('tr');

  useEffect(() => {
    const storedLang = localStorage.getItem('rota-kula-language') as Language;
    if (storedLang && (storedLang === 'tr' || storedLang === 'en' || storedLang === 'fr')) {
      setLanguage(storedLang);
    } else {
        const browserLang = navigator.language.split('-')[0];
        if (browserLang === 'en' || browserLang === 'fr') {
            setLanguage(browserLang);
        }
    }
  }, []);

  const handleSetLanguage = (lang: Language) => {
    setLanguage(lang);
    localStorage.setItem('rota-kula-language', lang);
  };

  const currentTranslations = useMemo(() => translations[language], [language]);

  return (
    <LanguageContext.Provider value={{ language, setLanguage: handleSetLanguage, translations: currentTranslations }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
