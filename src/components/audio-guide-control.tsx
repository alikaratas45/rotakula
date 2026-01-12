
"use client";

import { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { getPois } from '@/lib/kula-data';
import type { PointOfInterest } from '@/lib/types';
import { haversineDistance } from '@/lib/utils';
import { Button } from './ui/button';
import { Radio, RadioTower } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useApp } from '@/context/app-context';
import { PlayIcon } from 'lucide-react';

const PROXIMITY_THRESHOLD_ENTER = 75; // meters to consider a POI 'visited'
const PROXIMITY_THRESHOLD_EXIT = 150; // meters to consider 'left' the POI

export function AudioGuideControl() {
    const { language, translations, isAudioGuideActive, setIsAudioGuideActive, addBadge, earnedBadges } = useApp();
    const router = useRouter();

    const [pois, setPois] = useState<PointOfInterest[]>([]);
    const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
    const [visitedPoiId, setVisitedPoiId] = useState<string | null>(null);

    const watchIdRef = useRef<number | null>(null);
    const synthRef = useRef<SpeechSynthesis | null>(null);
    const { toast, dismiss } = useToast();
    
    useEffect(() => {
        async function fetchPois() {
            const allPois = await getPois(language);
            setPois(allPois);
        }
        fetchPois();
        if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
            synthRef.current = window.speechSynthesis;
        }
    }, [language]);
    
     const stopLocationTracking = useCallback(() => {
        if (watchIdRef.current !== null) {
            navigator.geolocation.clearWatch(watchIdRef.current);
            watchIdRef.current = null;
        }
        setUserLocation(null);
        setVisitedPoiId(null);
        dismiss();
    }, [dismiss]);

    const startLocationTracking = () => {
        if (!('geolocation' in navigator)) {
            toast({
                title: translations.toast.unsupportedTitle,
                description: translations.toast.audioGuideUnsupported,
                variant: "destructive"
            });
            setIsAudioGuideActive(false);
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
                setIsAudioGuideActive(false);
            },
            { enableHighAccuracy: true } // Optimized settings
        );
    };

    const handlePlayAudioForPoi = useCallback((poi: PointOfInterest, toastId?: string) => {
        if (toastId) dismiss(toastId);
        router.push(`/places/${poi.slug}?autoplay=true`);
    }, [router, dismiss]);
    
    const playProximityAlert = useCallback((poiName: string) => {
        const synth = synthRef.current;
        if (!synth || synth.speaking) return;

        const notificationText = translations.audioGuide.proximityPrompt.replace('{poiName}', poiName);
        const utterance = new SpeechSynthesisUtterance(notificationText);
        utterance.lang = language;
        
        const voices = synth.getVoices();
        if (voices.length > 0) {
            const voice = voices.find(v => v.lang.startsWith(language) && v.default) || voices.find(v => v.lang.startsWith(language));
            if (voice) utterance.voice = voice;
            synth.speak(utterance);
        } else {
            // Fallback if voices are not ready, though less likely for a short alert
            synth.speak(utterance);
        }
    }, [language, translations]);


    useEffect(() => {
        if (!isAudioGuideActive || !userLocation || pois.length === 0) {
            return;
        }

        const sortedPoisByDistance = [...pois]
            .map(poi => ({
                ...poi,
                distance: haversineDistance(
                    { lat: userLocation.lat, lon: userLocation.lng },
                    { lat: poi.latitude, lon: poi.longitude }
                ),
            }))
            .sort((a, b) => a.distance - b.distance);

        const closestPoi = sortedPoisByDistance[0];

        // LOGIC FOR ENTERING A POI's GEOFENCE
        if (closestPoi && closestPoi.distance < PROXIMITY_THRESHOLD_ENTER && visitedPoiId !== closestPoi.id) {
            setVisitedPoiId(closestPoi.id); // Mark as currently visiting
            
            // Badge earning logic
            const isBadgeAlreadyEarned = earnedBadges.some(b => b.id === closestPoi.badgeId);
            if (closestPoi.badgeId && !isBadgeAlreadyEarned) {
                addBadge(closestPoi.id);
                toast({
                    title: `✨ ${translations.badges.earnedTitle}`,
                    description: translations.badges.earnedDescription.replace('{poiName}', closestPoi.name),
                    duration: 8000,
                });
            } else {
                 playProximityAlert(closestPoi.name);
                 const { id: toastId } = toast({
                    title: `${translations.audioGuide.nearby}: ${closestPoi.name}`,
                    description: translations.audioGuide.nearbyDescription,
                    duration: 15000, 
                    action: (
                        <Button onClick={() => handlePlayAudioForPoi(closestPoi, toastId)}>
                           <PlayIcon className="mr-2 h-4 w-4" /> {translations.pois.listen}
                        </Button>
                    )
                });
            }
        }
        
        // LOGIC FOR EXITING A POI's GEOFENCE
        if (visitedPoiId) {
             const visitedPoi = pois.find(p => p.id === visitedPoiId);
             if (!visitedPoi) return;

             const distanceToVisitedPoi = haversineDistance(
                { lat: userLocation.lat, lon: userLocation.lng },
                { lat: visitedPoi.latitude, lon: visitedPoi.longitude }
            );

            if (distanceToVisitedPoi > PROXIMITY_THRESHOLD_EXIT) {
                setVisitedPoiId(null); // Reset visited POI, ready for the next one
            }
        }

    }, [userLocation, pois, isAudioGuideActive, visitedPoiId, handlePlayAudioForPoi, toast, translations, playProximityAlert, addBadge, earnedBadges]);


    const toggleGuide = () => {
       setIsAudioGuideActive(prev => !prev);
    };

    useEffect(() => {
        if (isAudioGuideActive) {
            startLocationTracking();
            toast({
                title: translations.audioGuide.started,
                description: translations.audioGuide.startedDescription,
                duration: 5000,
            });
        } else {
            stopLocationTracking();
        }

        return () => {
            stopLocationTracking();
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isAudioGuideActive]);

    return (
        <div className="flex items-center gap-1">
             <Button 
                variant="outline"
                size="sm"
                onClick={toggleGuide}
                aria-label={!isAudioGuideActive ? translations.audioGuide.start : translations.audioGuide.active}
                className="h-8 md:h-9"
            >
                {isAudioGuideActive ? <RadioTower className="h-4 w-4 animate-pulse text-green-500" /> : <Radio className="h-4 w-4" />}
                <span className="ml-2 text-xs md:text-sm">{isAudioGuideActive ? translations.audioGuide.activeShort : translations.audioGuide.title}</span>
            </Button>
        </div>
    );
}
