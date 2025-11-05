
"use client";

import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import tr from '@/lib/locales/tr.json';
import en from '@/lib/locales/en.json';
import fr from '@/lib/locales/fr.json';
import de from '@/lib/locales/de.json';

type Language = 'tr' | 'en' | 'fr' | 'de';

interface LanguageContextType {
  language: Language;
  setLanguage: (language: Language) => void;
  translations: typeof tr;
  selectedVoice: string | null;
  setSelectedVoice: (voice: string) => void;
  availableVoices: SpeechSynthesisVoice[];
}

const translations = { tr, en, fr, de };
const VOICE_STORAGE_KEY = 'rota-kula-selected-voice';

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguage] = useState<Language>('tr');
  const [selectedVoice, setSelectedVoiceState] = useState<string | null>(null);
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);

  // --- Voice Management ---
  useEffect(() => {
    const getVoices = () => {
        const voices = window.speechSynthesis.getVoices();
        setAvailableVoices(voices);
    };

    // Initial fetch
    getVoices();

    // Fetch when voices change
    window.speechSynthesis.onvoiceschanged = getVoices;

    return () => {
        window.speechSynthesis.onvoiceschanged = null;
    };
  }, []);
  
  useEffect(() => {
    if (availableVoices.length > 0) {
        const storedVoiceName = localStorage.getItem(VOICE_STORAGE_KEY);
        const voicesForLang = availableVoices.filter(v => v.lang.startsWith(language));
        
        // Check if stored voice is valid for the current language
        const storedVoiceIsValid = storedVoiceName && voicesForLang.some(v => v.name === storedVoiceName);

        if (storedVoiceIsValid) {
            setSelectedVoiceState(storedVoiceName);
        } else {
            // Find the best default voice for the current language
            const defaultVoice = 
                voicesForLang.find(v => v.name.includes('Google') && v.default) ||
                voicesForLang.find(v => v.name.includes('Google')) ||
                voicesForLang.find(v => v.default) ||
                voicesForLang[0];
            
            if (defaultVoice) {
                setSelectedVoiceState(defaultVoice.name);
                localStorage.setItem(VOICE_STORAGE_KEY, defaultVoice.name);
            }
        }
    }
  }, [availableVoices, language]);


  const handleSetSelectedVoice = useCallback((voiceName: string) => {
    setSelectedVoiceState(voiceName);
    localStorage.setItem(VOICE_STORAGE_KEY, voiceName);
  }, []);


  // --- Language Management ---
  useEffect(() => {
    const storedLang = localStorage.getItem('rota-kula-language') as Language;
    if (storedLang && ['tr', 'en', 'fr', 'de'].includes(storedLang)) {
      setLanguage(storedLang);
    } else {
        const browserLang = navigator.language.split('-')[0];
        if (['en', 'fr', 'de'].includes(browserLang)) {
            setLanguage(browserLang as Language);
        }
    }
  }, []);

  const handleSetLanguage = (lang: Language) => {
    setLanguage(lang);
    localStorage.setItem('rota-kula-language', lang);
    document.documentElement.lang = lang;
  };
  
  useEffect(() => {
      document.documentElement.lang = language;
  }, [language]);


  const currentTranslations = useMemo(() => translations[language], [language]);

  const value = { 
    language, 
    setLanguage: handleSetLanguage, 
    translations: currentTranslations,
    selectedVoice,
    setSelectedVoice: handleSetSelectedVoice,
    availableVoices,
  };

  return (
    <LanguageContext.Provider value={value}>
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
