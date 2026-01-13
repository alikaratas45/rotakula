
"use client";

import { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { getPois } from '@/lib/kula-data';
import type { PointOfInterest } from '@/lib/types';
import { haversineDistance } from '@/lib/utils';
import { Button } from './ui/button';
import { Radio, RadioTower, PlayIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useApp } from '@/context/app-context';

const PROXIMITY_THRESHOLD_ENTER = 75; // meters
const PROXIMITY_THRESHOLD_EXIT = 150; // meters

export function AudioGuideControl() {
    const { language, translations, isAudioGuideActive, setIsAudioGuideActive, addBadge, earnedBadges } = useApp();
    const router = useRouter();
    const { toast, dismiss } = useToast();

    // Refs to hold current values without causing re-renders
    const poisRef = useRef<PointOfInterest[]>([]);
    const notifiedPoiIdRef = useRef<string | null>(null);
    const watchIdRef = useRef<number | null>(null);
    const appStateRef = useRef({ language, translations, isAudioGuideActive, addBadge, earnedBadges, router, toast, dismiss });

    // Update refs when AppContext values change
    useEffect(() => {
        appStateRef.current = { language, translations, isAudioGuideActive, addBadge, earnedBadges, router, toast, dismiss };
    }, [language, translations, isAudioGuideActive, addBadge, earnedBadges, router, toast, dismiss]);

    // Fetch POIs once on component mount
    useEffect(() => {
        async function fetchPois() {
            const allPois = await getPois(appStateRef.current.language);
            poisRef.current = allPois;
        }
        fetchPois();
    }, [language]);


    useEffect(() => {
        const playProximityAlert = (poiName: string) => {
            if (!appStateRef.current.isAudioGuideActive) return;
            const synth = window.speechSynthesis;
            if (!synth || synth.speaking) return;

            const notificationText = appStateRef.current.translations.audioGuide.proximityPrompt.replace('{poiName}', poiName);
            const utterance = new SpeechSynthesisUtterance(notificationText);
            utterance.lang = appStateRef.current.language;
            
            const voices = synth.getVoices();
            if (voices.length > 0) {
                const voice = voices.find(v => v.lang.startsWith(appStateRef.current.language) && v.default) || voices.find(v => v.lang.startsWith(appStateRef.current.language));
                if (voice) utterance.voice = voice;
            }
            synth.speak(utterance);
        };
        
        const handlePositionUpdate = (position: GeolocationPosition) => {
            const userLocation = {
                lat: position.coords.latitude,
                lng: position.coords.longitude,
            };
            const currentPois = poisRef.current;
            if (currentPois.length === 0) return;

            const sortedPoisByDistance = [...currentPois]
                .map(poi => ({
                    ...poi,
                    distance: haversineDistance(
                        { lat: userLocation.lat, lon: userLocation.lng },
                        { lat: poi.latitude, lon: poi.longitude }
                    ),
                }))
                .sort((a, b) => a.distance - b.distance);

            const closestPoi = sortedPoisByDistance[0];

            if (closestPoi && closestPoi.distance < PROXIMITY_THRESHOLD_ENTER && notifiedPoiIdRef.current !== closestPoi.id) {
                notifiedPoiIdRef.current = closestPoi.id;
                
                const isBadgeAlreadyEarned = appStateRef.current.earnedBadges.some(b => b.id === closestPoi.badgeId);
                if (closestPoi.badgeId && !isBadgeAlreadyEarned) {
                    appStateRef.current.addBadge(closestPoi.id);
                     appStateRef.current.toast({
                        title: `✨ ${appStateRef.current.translations.badges.earnedTitle}`,
                        description: appStateRef.current.translations.badges.earnedDescription.replace('{poiName}', closestPoi.name),
                        duration: 8000,
                    });
                }
                
                if (appStateRef.current.isAudioGuideActive) {
                    playProximityAlert(closestPoi.name);
                     appStateRef.current.toast({
                        title: `${appStateRef.current.translations.audioGuide.nearby}: ${closestPoi.name}`,
                        description: appStateRef.current.translations.audioGuide.nearbyDescription,
                        duration: 15000, 
                        action: (
                            <Button onClick={() => appStateRef.current.router.push(`/places/${closestPoi.slug}?autoplay=true`)}>
                               <PlayIcon className="mr-2 h-4 w-4" /> {appStateRef.current.translations.pois.listen}
                            </Button>
                        )
                    });
                }
            } else if (notifiedPoiIdRef.current) {
                const notifiedPoi = currentPois.find(p => p.id === notifiedPoiIdRef.current);
                if (notifiedPoi) {
                    const distanceToNotifiedPoi = haversineDistance(
                        { lat: userLocation.lat, lon: userLocation.lng },
                        { lat: notifiedPoi.latitude, lon: notifiedPoi.longitude }
                    );
                    if (distanceToNotifiedPoi > PROXIMITY_THRESHOLD_EXIT) {
                        notifiedPoiIdRef.current = null;
                        appStateRef.current.dismiss();
                    }
                }
            }
        };

        if ('geolocation' in navigator && 'watchPosition' in navigator.geolocation) {
            watchIdRef.current = navigator.geolocation.watchPosition(
                handlePositionUpdate,
                (error) => console.warn("Could not get user location:", error.message),
                { enableHighAccuracy: true }
            );
        }

        return () => {
            if (watchIdRef.current !== null) {
                navigator.geolocation.clearWatch(watchIdRef.current);
            }
        };
    }, []); // This effect runs only once on mount

    const toggleGuide = () => {
        const newState = !isAudioGuideActive;
        setIsAudioGuideActive(newState);
        if (newState) {
            toast({
                title: translations.audioGuide.started,
                description: translations.audioGuide.startedDescription,
                duration: 5000,
            });
        } else {
            toast({
                title: translations.audioGuide.stopped,
                duration: 3000,
            });
            dismiss(); 
        }
    };

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
