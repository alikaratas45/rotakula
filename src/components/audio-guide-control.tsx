
"use client";

import { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { getPois } from '@/lib/kula-data';
import type { PointOfInterest } from '@/lib/types';
import { haversineDistance } from '@/lib/utils';
import { Button } from './ui/button';
import { PauseIcon, PlayIcon, Radio, RadioTower, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/context/language-context';

const PROXIMITY_THRESHOLD = 50; // meters

type GuideStatus = 'idle' | 'listening';

export function AudioGuideControl() {
    const { language, translations } = useLanguage();
    const router = useRouter();

    const [status, setStatus] = useState<GuideStatus>('idle');
    const [pois, setPois] = useState<PointOfInterest[]>([]);
    const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
    const [triggeredPois, setTriggeredPois] = useState<Set<string>>(new Set());
    const watchIdRef = useRef<number | null>(null);
    const { toast, dismiss } = useToast();
    

    useEffect(() => {
        async function fetchPois() {
            const allPois = await getPois(language);
            setPois(allPois);
        }
        fetchPois();
    }, [language]);
    
     const stopLocationTracking = useCallback(() => {
        if (watchIdRef.current !== null) {
            navigator.geolocation.clearWatch(watchIdRef.current);
            watchIdRef.current = null;
        }
        setUserLocation(null);
        setTriggeredPois(new Set());
        setStatus('idle');
        dismiss();
        window.speechSynthesis.cancel();
    }, [dismiss]);

    const startLocationTracking = () => {
        if (!('geolocation' in navigator)) {
            toast({
                title: translations.toast.unsupportedTitle,
                description: translations.toast.audioGuideUnsupported,
                variant: "destructive"
            });
            setStatus('idle');
            return;
        }

        if (watchIdRef.current !== null) return;
        
        watchIdRef.current = navigator.geolocation.watchPosition(
            (position) => {
                setUserLocation({
                    lat: position.coords.latitude,
                    lng: position.coords.longitude,
                });
            },
            (error) => {
                console.warn("Could not get user location:", error.message);
                toast({
                    title: translations.toast.locationErrorTitle,
                    description: translations.toast.locationErrorDescription,
                    variant: "destructive"
                });
                stopLocationTracking();
            },
            { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
        );
    };

    const handlePlayAudioForPoi = useCallback((poi: PointOfInterest) => {
        router.push(`/pois/${poi.slug}?autoplay=true`);
    }, [router]);
    
    const playProximityAlert = useCallback((poiName: string) => {
        if (typeof window === 'undefined' || !window.speechSynthesis) {
            return;
        }

        const notificationText = `${poiName}'na geldiniz. Anlatmamı ister misiniz?`;
        const utterance = new SpeechSynthesisUtterance(notificationText);
        
        const voiceLang = language === 'tr' ? 'tr-TR' : language === 'en' ? 'en-US' : language === 'fr' ? 'fr-FR' : 'de-DE';
        utterance.lang = voiceLang;

        const voices = window.speechSynthesis.getVoices();
        let selectedVoice = voices.find(v => v.lang === voiceLang && (v.name.toLowerCase().includes('kadın') || v.name.toLowerCase().includes('female')));
        if (!selectedVoice) {
            selectedVoice = voices.find(v => v.lang === voiceLang);
        }

        if (selectedVoice) {
            utterance.voice = selectedVoice;
        }
        
        window.speechSynthesis.cancel(); // Cancel any ongoing speech
        window.speechSynthesis.speak(utterance);
    }, [language]);


    useEffect(() => {
        if (status !== 'listening' || !userLocation || pois.length === 0) {
            return;
        }

        for (const poi of pois) {
            if (triggeredPois.has(poi.id)) {
                continue; 
            }

            const distance = haversineDistance(
                { lat: userLocation.lat, lon: userLocation.lng },
                { lat: poi.latitude, lon: poi.longitude }
            );

            if (distance < PROXIMITY_THRESHOLD) {
                setTriggeredPois(prev => new Set(prev).add(poi.id));
                
                // Play audio alert
                const startPlayback = () => {
                   playProximityAlert(poi.name);
                }

                if (window.speechSynthesis.getVoices().length === 0) {
                     window.speechSynthesis.onvoiceschanged = () => {
                        startPlayback();
                     };
                } else {
                    startPlayback();
                }
                
                // Show visual toast notification
                toast({
                    title: `${translations.audioGuide.nearby}: ${poi.name}`,
                    description: translations.audioGuide.nearbyDescription,
                    duration: 15000, 
                    action: (
                        <Button onClick={() => handlePlayAudioForPoi(poi)}>
                           <PlayIcon className="mr-2 h-4 w-4" /> {translations.pois.listen}
                        </Button>
                    )
                });
                break; 
            }
        }
    }, [userLocation, pois, status, triggeredPois, handlePlayAudioForPoi, toast, translations, playProximityAlert]);


    const toggleGuide = () => {
        if (status === 'idle') {
            setStatus('listening');
            startLocationTracking();
             toast({
                title: translations.audioGuide.started,
                description: translations.audioGuide.startedDescription,
                duration: 1500,
            });
        } else {
            stopLocationTracking();
            toast({
                title: translations.audioGuide.stopped,
                duration: 1500,
            });
        }
    };

    return (
        <div className="flex items-center gap-1">
             <Button 
                variant="outline"
                size="sm" 
                onClick={toggleGuide}
                aria-label={status === 'idle' ? translations.audioGuide.start : translations.audioGuide.active}
                className="w-[150px]"
            >
                {status === 'listening' ? <RadioTower className="mr-2 h-4 w-4 animate-pulse text-green-500" /> : <Radio className="mr-2 h-4 w-4" />}
                {status === 'listening' ? translations.audioGuide.activeShort : translations.audioGuide.title}
            </Button>
        </div>
    );
}
