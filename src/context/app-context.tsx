
"use client";

import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import tr from '@/lib/locales/tr.json';
import en from '@/lib/locales/en.json';
import fr from '@/lib/locales/fr.json';
import de from '@/lib/locales/de.json';
import { getPois } from '@/lib/kula-data';
import type { PointOfInterest, SurveyState } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';


type Language = 'tr' | 'en' | 'fr' | 'de';

export interface Badge {
  id: string;
  name: string;
  points: number;
  imageId: string;
}

interface AppContextType {
  language: Language;
  setLanguage: (language: Language) => void;
  translations: typeof tr;
  isAudioGuideActive: boolean;
  setIsAudioGuideActive: React.Dispatch<React.SetStateAction<boolean>>;
  earnedBadges: Badge[];
  addBadge: (poiId: string) => void;
  totalPoints: number;
  handleAdminLogin: (email: string, password: string) => void;
  handleAdminLogout: () => void;
  isAdmin: boolean;
  isUserLoading: boolean;
}

const translations = { tr, en, fr, de };
const ADMIN_EMAIL = "alikarataskula@gmail.com"; 

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguage] = useState<Language>('tr');
  const [isAudioGuideActive, setIsAudioGuideActive] = useState(false);
  const [earnedBadges, setEarnedBadges] = useState<Badge[]>([]);
  const [allPois, setAllPois] = useState<any[]>([]);
  const router = useRouter();
  const { toast } = useToast();
  
  const isAdmin = false;
  const isUserLoading = false;

  // Fetch all POIs on mount to map badge IDs to badge data
  useEffect(() => {
    async function fetchPois() {
        const pois = await getPois('tr'); // Use a base language to get all badge info
        setAllPois(pois);
    }
    fetchPois();
  }, []);

  // Load language and badges from localStorage, and register service worker
  useEffect(() => {
    const storedLang = localStorage.getItem('rota-kula-language') as Language;
    if (storedLang && ['tr', 'en', 'fr', 'de'].includes(storedLang)) {
      setLanguage(storedLang);
    } else {
        if (typeof navigator !== 'undefined') {
            const browserLang = navigator.language.split('-')[0];
            if (['en', 'fr', 'de'].includes(browserLang)) {
                setLanguage(browserLang as Language);
            }
        }
    }

    const storedBadges = localStorage.getItem('rota-kula-badges');
    if (storedBadges) {
        setEarnedBadges(JSON.parse(storedBadges));
    }

    // Register Service Worker for PWA capabilities
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js').then(registration => {
          console.log('Service Worker registered with scope:', registration.scope);
        }).catch(error => {
          console.log('Service Worker registration failed:', error);
        });
      });
    }

  }, []);

  const handleSetLanguage = (lang: Language) => {
    setLanguage(lang);
    localStorage.setItem('rota-kula-language', lang);
    if (typeof document !== 'undefined') {
      document.documentElement.lang = lang;
    }
  };
  
  const handleAdminLogin = async (email: string, password: string) => {
    toast({
        title: "Giriş Devre Dışı",
        description: "Firebase bağlantısı geçici olarak kaldırıldığı için admin girişi yapılamıyor.",
        variant: "destructive"
    });
  };

  const handleAdminLogout = () => {
    toast({
        title: "Giriş Devre Dışı",
        description: "Firebase bağlantısı geçici olarak kaldırıldığı için admin çıkışı yapılamıyor.",
        variant: "destructive"
    });
  }
  
  useEffect(() => {
      if (typeof document !== 'undefined') {
        document.documentElement.lang = language;
      }
  }, [language]);

  const addBadge = useCallback((poiId: string) => {
    if (!allPois.length) return;

    const poi = allPois.find(p => p.id === poiId);
    if (!poi || !poi.badgeId) return;

    const newBadge: Badge = {
        id: poi.badgeId,
        name: poi.name, // Use POI name for the badge name
        points: poi.points,
        imageId: poi.imageId
    };

    setEarnedBadges(prevBadges => {
        const isAlreadyEarned = prevBadges.some(b => b.id === newBadge.id);
        if (isAlreadyEarned) {
            return prevBadges; // Do not add if already earned
        }
        const updatedBadges = [...prevBadges, newBadge];
        localStorage.setItem('rota-kula-badges', JSON.stringify(updatedBadges));
        return updatedBadges;
    });
  }, [allPois]);

  const totalPoints = useMemo(() => {
    return earnedBadges.reduce((sum, badge) => sum + badge.points, 0);
  }, [earnedBadges]);

  const currentTranslations = useMemo(() => translations[language], [language]);

  const value: AppContextType = { 
    language, 
    setLanguage: handleSetLanguage, 
    translations: currentTranslations,
    isAudioGuideActive,
    setIsAudioGuideActive,
    earnedBadges,
    addBadge,
    totalPoints,
    handleAdminLogin,
    handleAdminLogout,
    isAdmin,
    isUserLoading,
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp(): AppContextType {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
// Keep useLanguage for backward compatibility if needed, but preferably refactor to useApp
export const useLanguage = useApp;
