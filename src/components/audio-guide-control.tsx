
"use client";

import { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { getPois } from '@/lib/kula-data';
import type { PointOfInterest } from '@/lib/types';
import { haversineDistance } from '@/lib/utils';
import { Button } from './ui/button';
import { Radio, RadioTower } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/context/language-context';
import { PlayIcon } from 'lucide-react';

const PROXIMITY_THRESHOLD_CENTER = 10; // meters for city center
const PROXIMITY_THRESHOLD_OUTSIDE = 50; // meters for geopark/villages

type GuideStatus = 'idle' | 'listening';

// Helper to check if a POI is likely outside the dense city center
const isPoiOutsideCenter = (poi: PointOfInterest): boolean => {
    // Geopark and Nature are always considered outside
    if (poi.category === 'geopark' || poi.category === 'nature') {
        return true;
    }
    // Specific history POIs that are villages/neighborhoods outside the main walking tour area
    const outsideSlugs = [
        'sandal-village', 
        'gokceoren-village', 
        'incesu-village',
        'korez-village',
        'emre-village',
        'evciler-village',
        'yurtbasi-tabala-village',
        'encekler-village'
    ];
    if (poi.category === 'history' && outsideSlugs.includes(poi.slug)) {
        return true;
    }
    return false;
}

export function AudioGuideControl() {
    const { language, translations } = useLanguage();
    const router = useRouter();

    const [status, setStatus] = useState<GuideStatus>('idle');
    const [pois, setPois] = useState<PointOfInterest[]>([]);
    const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
    const [triggeredPois, setTriggeredPois] = useState<Set<string>>(new Set());
    const watchIdRef = useRef<number | null>(null);
    const synthRef = useRef<SpeechSynthesis | null>(null);
    const { toast, dismiss } = useToast();

    useEffect(() => {
        async function fetchPois() {
            const allPois = await getPois(language);
            setPois(allPois);
        }
        fetchPois();
        synthRef.current = window.speechSynthesis;
    }, [language]);
    
     const stopLocationTracking = useCallback(() => {
        if (watchIdRef.current !== null) {
            navigator.geolocation.clearWatch(watchIdRef.current);
            watchIdRef.current = null;
        }
        if (synthRef.current && synthRef.current.speaking) {
            synthRef.current.cancel();
        }
        setUserLocation(null);
        setTriggeredPois(new Set());
        setStatus('idle');
        dismiss();
    }, [dismiss]);

    const startLocationTracking = () => {
        if (!('geolocation' in navigator) || !('speechSynthesis' in window)) {
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
        if (!synthRef.current) return;
        if (synthRef.current.speaking) {
            synthRef.current.cancel();
        }
        const notificationText = translations.audioGuide.proximityPrompt.replace('{poiName}', poiName);
        const utterance = new SpeechSynthesisUtterance(notificationText);
        utterance.lang = language;
        synthRef.current.speak(utterance);
    }, [language, translations]);


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

            const threshold = isPoiOutsideCenter(poi)
                ? PROXIMITY_THRESHOLD_OUTSIDE
                : PROXIMITY_THRESHOLD_CENTER;

            if (distance < threshold) {
                setTriggeredPois(prev => new Set(prev).add(poi.id));
                
                playProximityAlert(poi.name);
                
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
                duration: 5000,
            });
        } else {
            stopLocationTracking();
            toast({
                title: translations.audioGuide.stopped,
                duration: 3000,
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
                className="h-8 md:h-9"
            >
                {status === 'listening' ? <RadioTower className="h-4 w-4 animate-pulse text-green-500" /> : <Radio className="h-4 w-4" />}
                <span className="ml-2 text-xs md:text-sm">{status === 'listening' ? translations.audioGuide.activeShort : translations.audioGuide.title}</span>
            </Button>
        </div>
    );
}
