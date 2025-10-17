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


const PROXIMITY_THRESHOLD = 50; // meters

type GuideStatus = 'idle' | 'listening' | 'narrating';

export function AudioGuideControl() {
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
            const allPois = await getPois();
            setPois(allPois);
        }
        fetchPois();
        
        return () => {
            cancelNarration();
        }
    }, [cancelNarration]);
    
    const startLocationTracking = () => {
        if (!('geolocation' in navigator) || !('speechSynthesis'in window)) {
            toast({
                title: "Desteklenmiyor",
                description: "Tarayıcınız sesli rehber özelliği için gerekli olan konum veya ses sentezleme servislerini desteklemiyor.",
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
                    title: "Konum Hatası",
                    description: "Konumunuza erişilemiyor. Lütfen tarayıcı ayarlarınızı kontrol edin.",
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
        utterance.lang = "tr-TR";

        // Find a male Turkish voice
        const maleVoice = voices.find(voice => voice.lang === 'tr-TR' && voice.name.toLowerCase().includes('male'));
        if (maleVoice) {
            utterance.voice = maleVoice;
        } else {
            const turkishVoice = voices.find(voice => voice.lang === 'tr-TR');
            if (turkishVoice) utterance.voice = turkishVoice;
        }

        utteranceRef.current = utterance;

        utterance.onend = () => {
            setNarratingPoi(null);
            setStatus('listening');
        };

        utterance.onerror = (event) => {
            toast({
                title: "Ses Hatası",
                description: `Sesli anlatım sırasında bir hata oluştu: ${event.error}`,
                variant: "destructive"
            });
            setNarratingPoi(null);
            setStatus('listening');
        };

        window.speechSynthesis.speak(utterance);
    }, [status, toast, cancelNarration, voices]);


    useEffect(() => {
        if (status !== 'listening' || !userLocation || pois.length === 0) {
            return;
        }

        // Do not trigger narration if another one is already playing
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
                    title: `📍 Yakınlardasınız: ${poi.name}`,
                    description: "Anlatımı dinlemek için butona tıklayın.",
                    duration: Infinity, // Keep toast until dismissed
                    action: (
                        <Button onClick={() => handlePlayAudio(poi)}>
                           <PlayIcon className="mr-2 h-4 w-4" /> Dinle
                        </Button>
                    )
                });
                break; 
            }
        }
    }, [userLocation, pois, status, triggeredPois, handlePlayAudio, toast, narratingPoi]);


    const toggleGuide = () => {
        if (status === 'idle') {
            setStatus('listening');
            startLocationTracking();
             toast({
                title: "Sesli Rehber Başlatıldı",
                description: "Yakınınızdaki yerler için bildirim alacaksınız.",
            });
        } else {
            stopLocationTracking();
            toast({
                title: "Sesli Rehber Kapatıldı",
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
                return "Sesli Rehberi Başlat";
            case 'listening':
                return "Sesli Rehber Aktif: Yerler dinleniyor. Kapatmak için tıklayın.";
            case 'narrating':
                return `Anlatım yapılıyor: ${narratingPoi?.name}. Durdurmak için tıklayın.`;
            default:
                return "Sesli Rehber";
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
                        <span className="ml-2">Sesli Rehber</span>
                    </Button>
                </TooltipTrigger>
                <TooltipContent>
                    <p>{getTooltipContent()}</p>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
}
