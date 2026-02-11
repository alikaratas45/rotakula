
"use client";

import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import tr from '@/lib/locales/tr.json';
import en from '@/lib/locales/en.json';
import fr from '@/lib/locales/fr.json';
import de from '@/lib/locales/de.json';
import { getPois } from '@/lib/kula-data';
import { useToast } from '@/hooks/use-toast';
import { signInWithEmailAndPassword, signOut } from "firebase/auth";
import { useAuth, useUser } from '@/firebase';
import { Loader2 } from 'lucide-react';

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
  handleAdminLogin: (username: string, pass: string) => void;
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
  const [isMounted, setIsMounted] = useState(false);
  
  const router = useRouter();
  const { toast } = useToast();
  
  const auth = useAuth();
  const { user, isUserLoading: isAuthLoading } = useUser();
  
  const isAdmin = useMemo(() => {
    return !!user && user.email === ADMIN_EMAIL;
  }, [user]);

  useEffect(() => {
    setIsMounted(true);
    async function fetchPois() {
        const pois = await getPois('tr');
        setAllPois(pois);
    }
    fetchPois();

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

    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js').catch(err => console.log('SW fail:', err));
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
  
  const handleAdminLogin = async (username: string, pass: string) => {
     try {
      const email = username === 'kulaadmin' ? ADMIN_EMAIL : username;
      await signInWithEmailAndPassword(auth, email, pass);
      router.push('/admin/surveys');
      toast({ title: "Giriş Başarılı", description: "Admin paneline yönlendiriliyorsunuz." });
    } catch (error) {
       toast({ title: "Giriş Başarısız", description: "Kullanıcı adı veya şifre hatalı.", variant: "destructive" });
    }
  };

  const handleAdminLogout = async () => {
     try {
      await signOut(auth);
      router.push('/');
      toast({ title: "Çıkış Başarılı" });
    } catch (error) {
       toast({ title: "Çıkış Yapılamadı", variant: "destructive" });
    }
  }
  
  const addBadge = useCallback((poiId: string) => {
    if (!allPois.length) return;
    const poi = allPois.find(p => p.id === poiId);
    if (!poi || !poi.badgeId) return;

    const newBadge: Badge = {
        id: poi.badgeId,
        name: poi.name,
        points: poi.points || 10,
        imageId: poi.imageId
    };

    setEarnedBadges(prev => {
        if (prev.some(b => b.id === newBadge.id)) return prev;
        const updated = [...prev, newBadge];
        localStorage.setItem('rota-kula-badges', JSON.stringify(updated));
        return updated;
    });
  }, [allPois]);

  const currentTranslations = useMemo(() => translations[language], [language]);

  const value: AppContextType = { 
    language, 
    setLanguage: handleSetLanguage, 
    translations: currentTranslations,
    isAudioGuideActive,
    setIsAudioGuideActive,
    earnedBadges,
    addBadge,
    totalPoints: earnedBadges.reduce((sum, b) => sum + b.points, 0),
    handleAdminLogin,
    handleAdminLogout,
    isAdmin,
    isUserLoading: isAuthLoading,
  };

  if (!isMounted) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

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
export const useLanguage = useApp;
