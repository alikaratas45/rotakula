
"use client"

import { useState, useEffect, useCallback } from 'react';
import { useToast } from './use-toast';
import { useLanguage } from '@/context/language-context';

const STORAGE_KEY = 'rota-kula-saved-routes';

export function useSavedRoutes() {
    const [savedRoutes, setSavedRoutes] = useState<string[]>([]);
    const [isLoaded, setIsLoaded] = useState(false);
    const { toast } = useToast();
    const { translations } = useLanguage();

    useEffect(() => {
        try {
            const item = window.localStorage.getItem(STORAGE_KEY);
            if (item) {
                setSavedRoutes(JSON.parse(item));
            }
        } catch (error) {
            console.error('Failed to load saved routes from localStorage', error);
        } finally {
            setIsLoaded(true);
        }
    }, []);

    const updateLocalStorage = (routes: string[]) => {
        try {
            window.localStorage.setItem(STORAGE_KEY, JSON.stringify(routes));
        } catch (error) {
            console.error('Failed to save routes to localStorage', error);
            toast({
                title: translations.toast.errorTitle,
                description: translations.toast.saveErrorDescription,
                variant: "destructive",
            });
        }
    };

    const addRoute = useCallback((slug: string) => {
        setSavedRoutes(prevRoutes => {
            if (prevRoutes.includes(slug)) {
                return prevRoutes;
            }
            const newRoutes = [...prevRoutes, slug];
            updateLocalStorage(newRoutes);
            toast({
                title: translations.toast.savedTitle,
                description: translations.toast.savedDescription,
            });
            return newRoutes;
        });
    }, [toast, translations]);

    const removeRoute = useCallback((slug: string) => {
        setSavedRoutes(prevRoutes => {
            const newRoutes = prevRoutes.filter(r => r !== slug);
            updateLocalStorage(newRoutes);
            toast({
                title: translations.toast.removedTitle,
                description: translations.toast.removedDescription,
            });
            return newRoutes;
        });
    }, [toast, translations]);

    const isRouteSaved = useCallback((slug: string) => {
        return savedRoutes.includes(slug);
    }, [savedRoutes]);

    const toggleSaveRoute = useCallback((slug: string) => {
        if (isRouteSaved(slug)) {
            removeRoute(slug);
        } else {
            addRoute(slug);
        }
    }, [addRoute, removeRoute, isRouteSaved]);

    return { savedRoutes, isLoaded, addRoute, removeRoute, isRouteSaved, toggleSaveRoute };
}
