
"use client";

import { useEffect, useState, useRef, useCallback } from 'react';
import { getPois } from '@/lib/kula-data';
import type { PointOfInterest } from '@/lib/types';
import { haversineDistance } from '@/lib/utils';
import { Button } from './ui/button';
import { PauseIcon, PlayIcon, Radio, RadioTower, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/context/language-context';

const PROXIMITY_THRESHOLD = 50; // meters

type GuideStatus = 'idle' | 'listening' | 'narrating' | 'generating';

export function AudioGuideControl() {
    const { language, translations } = useLanguage();
    const [status, setStatus] = useState<GuideStatus>('idle');
    const [pois, setPois] = useState<PointOfInterest[]>([]);
    const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
    const [triggeredPois, setTriggeredPois] = useState<Set<string>>(new Set());
    const watchIdRef = useRef<number | null>(null);
    const { toast, dismiss } = useToast();
    
    const [narratingPoi, setNarratingPoi] = useState<PointOfInterest | null>(null);
    const speechUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

    const cancelNarration = useCallback(() => {
        if (speechUtteranceRef.current) {
            speechUtteranceRef.current.onstart = null;
            speechUtteranceRef.current.onend = null;
            speechUtteranceRef.current.onerror = null;
        }
        if (window.speechSynthesis.speaking) {
            window.speechSynthesis.cancel();
        }
        setNarratingPoi(null);
    }, []);

    useEffect(() => {
        async function fetchPois() {
            const allPois = await getPois(language);
            setPois(allPois);
        }
        fetchPois();
        
        // Clean up on language change
        cancelNarration();
        
        return () => {
            cancelNarration();
        }
    }, [cancelNarration, language]);
    
     const stopLocationTracking = useCallback(() => {
        if (watchIdRef.current !== null) {
            navigator.geolocation.clearWatch(watchIdRef.current);
            watchIdRef.current = null;
        }
        setUserLocation(null);
        cancelNarration();
        setTriggeredPois(new Set());
        setStatus('idle');
        dismiss();
    }, [dismiss, cancelNarration]);

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

    const handlePlayAudio = useCallback(async (poi: PointOfInterest) => {
        if (status === 'narrating' || status === 'generating') {
             cancelNarration();
             if (status !== 'idle') { setStatus('listening'); }
             return;
        }
        
        setStatus('generating');
        setNarratingPoi(poi);

        const startPlayback = () => {
            const utterance = new SpeechSynthesisUtterance(poi.description);
            speechUtteranceRef.current = utterance;

            const voices = window.speechSynthesis.getVoices();
            const voiceLang = language === 'tr' ? 'tr-TR' : language === 'en' ? 'en-US' : language === 'fr' ? 'fr-FR' : 'de-DE';
            
            let voiceToUse = voices.find(v => v.lang === voiceLang && (v.name.toLowerCase().includes('erkek') || v.name.toLowerCase().includes('male') || v.name.toLowerCase().includes('männlich')));
            if (!voiceToUse) {
                voiceToUse = voices.find(v => v.lang === voiceLang && (v.name.toLowerCase().includes('kadın') || v.name.toLowerCase().includes('female') || v.name.toLowerCase().includes('weiblich')));
            }
            if (!voiceToUse) {
                voiceToUse = voices.find(v => v.lang === voiceLang);
            }


            if (voiceToUse) {
                utterance.voice = voiceToUse;
            }

            utterance.onstart = () => {
                setStatus('narrating');
            };
            utterance.onend = () => {
                cancelNarration();
                if (status !== 'idle') {
                    setStatus('listening');
                }
            };
            utterance.onerror = (event) => {
                if (event.error !== 'interrupted') {
                    toast({
                        title: translations.toast.audioErrorTitle,
                        description: translations.toast.audioErrorDescription,
                        variant: "destructive"
                    });
                }
                cancelNarration();
                if (status !== 'idle') {
                    setStatus('listening');
                }
            };

            window.speechSynthesis.speak(utterance);
        };
        
        const voices = window.speechSynthesis.getVoices();
        if (voices.length === 0) {
            window.speechSynthesis.onvoiceschanged = startPlayback;
        } else {
            startPlayback();
        }

    }, [status, toast, cancelNarration, translations, language]);


    useEffect(() => {
        if (status !== 'listening' || !userLocation || pois.length === 0) {
            return;
        }

        if (narratingPoi) return;

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
                toast({
                    title: `${translations.audioGuide.nearby}: ${poi.name}`,
                    description: translations.audioGuide.nearbyDescription,
                    duration: 15000, 
                    action: (
                        <Button onClick={() => handlePlayAudio(poi)}>
                           <PlayIcon className="mr-2 h-4 w-4" /> {translations.pois.listen}
                        </Button>
                    )
                });
                break; 
            }
        }
    }, [userLocation, pois, status, triggeredPois, handlePlayAudio, toast, narratingPoi, translations]);


    const toggleGuide = () => {
        if (status === 'idle') {
            setStatus('listening');
            startLocationTracking();
             toast({
                title: translations.audioGuide.started,
                description: translations.audioGuide.startedDescription,
                duration: 2000,
            });
        } else {
            stopLocationTracking();
            toast({
                title: translations.audioGuide.stopped,
                duration: 2000,
            });
        }
    };

    const handleButtonClick = () => {
        if (status === 'narrating' || status === 'generating') {
            cancelNarration();
            if (status !== 'idle') { setStatus('listening'); }
        } else {
            toggleGuide();
        }
    };

    return (
        <div className="flex items-center gap-1">
             <Button 
                variant="outline"
                size="sm" 
                onClick={handleButtonClick}
                aria-label={status === 'idle' ? translations.audioGuide.start : translations.audioGuide.active}
                disabled={status === 'generating'}
                className="w-[150px]"
            >
                {status === 'generating' && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {status === 'narrating' && <PauseIcon className="mr-2 h-4 w-4 text-blue-500" />}
                {status === 'listening' && <RadioTower className="mr-2 h-4 w-4 animate-pulse text-green-500" />}
                {status === 'idle' && <Radio className="mr-2 h-4 w-4" />}
                
                {status === 'generating' ? translations.audioGuide.generating
                 : status === 'narrating' ? `${translations.audioGuide.narrating}...`
                 : status === 'listening' ? translations.audioGuide.activeShort
                 : translations.audioGuide.title}
            </Button>
        </div>
    );
}

    