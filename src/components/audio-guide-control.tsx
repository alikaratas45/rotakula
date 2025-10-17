"use client";

import { useEffect, useState, useRef, useCallback } from 'react';
import { getPois } from '@/lib/kula-data';
import type { PointOfInterest } from '@/lib/types';
import { haversineDistance } from '@/lib/utils';
import { textToSpeech } from '@/ai/flows/tts-flow';
import { Button } from './ui/button';
import { Loader2, Radio, RadioTower } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";


const PROXIMITY_THRESHOLD = 50; // meters

type GuideStatus = 'idle' | 'listening' | 'narrating' | 'generating';

export function AudioGuideControl() {
    const [status, setStatus] = useState<GuideStatus>('idle');
    const [pois, setPois] = useState<PointOfInterest[]>([]);
    const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
    const [triggeredPois, setTriggeredPois] = useState<Set<string>>(new Set());
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const watchIdRef = useRef<number | null>(null);
    const { toast } = useToast();

    // Fetch all POIs on initial load
    useEffect(() => {
        async function fetchPois() {
            const allPois = await getPois();
            setPois(allPois);
        }
        fetchPois();
    }, []);
    
    const startLocationTracking = () => {
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
                setStatus('idle');
            },
            { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
        );
    };

    const stopLocationTracking = () => {
        if (watchIdRef.current !== null) {
            navigator.geolocation.clearWatch(watchIdRef.current);
            watchIdRef.current = null;
        }
        setUserLocation(null);
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current = null;
        }
        setTriggeredPois(new Set()); // Reset triggered pois when stopping
    };

    const handlePlayAudio = useCallback(async (poi: PointOfInterest) => {
        if (audioRef.current?.src && status === 'narrating') {
            return; // Already narrating, don't interrupt
        }

        setStatus('generating');
        toast({
            title: "Anlatım Başlıyor",
            description: `${poi.name} için sesli anlatım hazırlanıyor...`,
        });

        try {
            const { media } = await textToSpeech(poi.description);
            if (media) {
                setStatus('narrating');
                if (audioRef.current) {
                    audioRef.current.src = media;
                } else {
                    audioRef.current = new Audio(media);
                }
                audioRef.current.play();
                audioRef.current.onended = () => {
                    setStatus('listening');
                };
            } else {
                 setStatus('listening');
            }
        } catch (error) {
            console.error("Failed to generate or play audio", error);
            toast({
                title: "Ses Hatası",
                description: "Sesli anlatım oluşturulurken bir hata oluştu.",
                variant: "destructive"
            });
            setStatus('listening');
        }
    }, [status, toast]);


    // Check for nearby POIs when user location changes and guide is active
    useEffect(() => {
        if (status !== 'listening' || !userLocation || pois.length === 0) {
            return;
        }

        for (const poi of pois) {
            if (triggeredPois.has(poi.id)) {
                continue; // Skip if already triggered for this session
            }

            const distance = haversineDistance(
                { lat: userLocation.lat, lon: userLocation.lng },
                { lat: poi.latitude, lon: poi.longitude }
            );

            if (distance < PROXIMITY_THRESHOLD) {
                setTriggeredPois(prev => new Set(prev).add(poi.id));
                handlePlayAudio(poi);
                break; 
            }
        }
    }, [userLocation, pois, status, triggeredPois, handlePlayAudio]);


    const toggleGuide = () => {
        if (status === 'idle') {
            setStatus('listening');
            startLocationTracking();
             toast({
                title: "Sesli Rehber Başlatıldı",
                description: "Yakınınızdaki yerler için anlatım otomatik olarak başlayacaktır.",
            });
        } else {
            setStatus('idle');
            stopLocationTracking();
            toast({
                title: "Sesli Rehber Kapatıldı",
            });
        }
    };

    const getButtonContent = () => {
        switch (status) {
            case 'idle':
                return <Radio className="h-5 w-5" />;
            case 'listening':
                return <RadioTower className="h-5 w-5 animate-pulse text-green-500" />;
            case 'generating':
                return <Loader2 className="h-5 w-5 animate-spin" />;
            case 'narrating':
                return <RadioTower className="h-5 w-5 text-blue-500" />;
            default:
                return <Radio className="h-5 w-5" />;
        }
    };
     
    const getTooltipContent = () => {
        switch (status) {
            case 'idle':
                return "Sesli Rehberi Başlat";
            case 'listening':
                return "Sesli Rehber Aktif: Yerler dinleniyor. Kapatmak için tıklayın.";
            case 'generating':
                return "Anlatım hazırlanıyor...";
            case 'narrating':
                return "Anlatım yapılıyor... Kapatmak için tıklayın.";
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
                        size="icon" 
                        onClick={toggleGuide}
                        aria-label={getTooltipContent()}
                        disabled={status === 'generating'}
                    >
                        {getButtonContent()}
                    </Button>
                </TooltipTrigger>
                <TooltipContent>
                    <p>{getTooltipContent()}</p>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
}
