
"use client";

import { useEffect, useState, useRef, useCallback } from 'react';
import { getPois } from '@/lib/kula-data';
import type { PointOfInterest } from '@/lib/types';
import { haversineDistance } from '@/lib/utils';
import { Button } from './ui/button';
import { PauseIcon, PlayIcon, Radio, RadioTower } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useLanguage } from '@/context/language-context';


const PROXIMITY_THRESHOLD = 50; // meters

type GuideStatus = 'idle' | 'listening' | 'narrating';

export function AudioGuideControl() {
    const { language, translations } = useLanguage();
    const [status, setStatus] = useState<GuideStatus>('idle');
    const [pois, setPois] = useState<PointOfInterest[]>([]);
    const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
    const [triggeredPois, setTriggeredPois] = useState<Set<string>>(new Set());
    const watchIdRef = useRef<number | null>(null);
    const { toast, dismiss } = useToast();
    const [narratingPoi, setNarratingPoi] = useState<PointOfInterest | null>(null);
    const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
    const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);

    useEffect(() => {
        if ('speechSynthesis' in window) {
            const handleVoicesChanged = () => {
                setVoices(window.speechSynthesis.getVoices());
            };
            window.speechSynthesis.onvoiceschanged = handleVoicesChanged;
            handleVoicesChanged(); // Initial load
            
            return () => {
                window.speechSynthesis.onvoiceschanged = null;
                if (window.speechSynthesis.speaking) {
                    window.speechSynthesis.cancel();
                }
            };
        }
    }, []);

     const cancelNarration = useCallback(() => {
        if (window.speechSynthesis) {
            window.speechSynthesis.cancel();
        }
        setNarratingPoi(null);
        if (status !== 'idle') {
            setStatus('listening');
        }
    }, [status]);


    useEffect(() => {
        async function fetchPois() {
            const allPois = await getPois(language);
            setPois(allPois);
        }
        fetchPois();
        
        return () => {
            cancelNarration();
        }
    }, [cancelNarration, language]);
    
    const startLocationTracking = () => {
        if (!('geolocation' in navigator) || !('speechSynthesis'in window)) {
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

    const stopLocationTracking = useCallback(() => {
        if (watchIdRef.current !== null) {
            navigator.geolocation.clearWatch(watchIdRef.current);
            watchIdRef.current = null;
        }
        setUserLocation(null);
        cancelNarration();
        setTriggeredPois(new Set());
        setStatus('idle');
        dismiss(); // Dismiss any active toasts
    }, [dismiss, cancelNarration]);

    const handlePlayAudio = useCallback((poi: PointOfInterest) => {
        if (status === 'narrating') {
             cancelNarration();
             return;
        }

        setNarratingPoi(poi);
        setStatus('narrating');
        
        const utterance = new SpeechSynthesisUtterance(poi.description);
        utterance.lang = language === 'tr' ? "tr-TR" : "en-US";

        const voiceCriteria = (v: SpeechSynthesisVoice) => 
            v.lang.startsWith(language) && v.name.toLowerCase().includes('male');
        
        const maleVoice = voices.find(voiceCriteria);

        if (maleVoice) {
            utterance.voice = maleVoice;
        } else {
            const langVoice = voices.find(v => v.lang.startsWith(language));
            if (langVoice) utterance.voice = langVoice;
        }

        utteranceRef.current = utterance;

        utterance.onend = () => {
            setNarratingPoi(null);
            setStatus('listening');
        };

        utterance.onerror = (event) => {
            toast({
                title: translations.toast.audioErrorTitle,
                description: `${translations.toast.audioErrorDescription}: ${event.error}`,
                variant: "destructive"
            });
            setNarratingPoi(null);
            setStatus('listening');
        };

        window.speechSynthesis.speak(utterance);
    }, [status, toast, cancelNarration, voices, language, translations]);


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
                    duration: Infinity, 
                    action: (
                        <Button onClick={() => handlePlayAudio(poi)}>
                           <PlayIcon className="mr-2 h-4 w-4" /> {translations.poi.listen}
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
            });
        } else {
            stopLocationTracking();
            toast({
                title: translations.audioGuide.stopped,
            });
        }
    };

    const getButtonContent = () => {
        if (status === 'narrating') return <PauseIcon className="h-5 w-5 text-blue-500" />;
        if (status === 'listening') return <RadioTower className="h-5 w-5 animate-pulse text-green-500" />;
        return <Radio className="h-5 w-5" />;
    };
     
    const getTooltipContent = () => {
        switch (status) {
            case 'idle':
                return translations.audioGuide.start;
            case 'listening':
                return translations.audioGuide.active;
            case 'narrating':
                return `${translations.audioGuide.narrating}: ${narratingPoi?.name}.`;
            default:
                return translations.audioGuide.title;
        }
    };

    return (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <Button 
                        variant="ghost"
                        size="sm" 
                        onClick={status === 'narrating' ? cancelNarration : toggleGuide}
                        aria-label={getTooltipContent()}
                    >
                        {getButtonContent()}
                        <span className="ml-2">{translations.audioGuide.title}</span>
                    </Button>
                </TooltipTrigger>
                <TooltipContent>
                    <p>{getTooltipContent()}</p>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
}
