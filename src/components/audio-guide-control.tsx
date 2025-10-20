
"use client";

import { useEffect, useState, useRef, useCallback } from 'react';
import { getPois } from '@/lib/kula-data';
import type { PointOfInterest } from '@/lib/types';
import { haversineDistance } from '@/lib/utils';
import { Button } from './ui/button';
import { PauseIcon, PlayIcon, Radio, RadioTower, Loader2, Settings, Check } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/context/language-context';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"

const PROXIMITY_THRESHOLD = 50; // meters
const VOICE_STORAGE_KEY = 'rota-kula-selected-voice';

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

    const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
    const [selectedVoiceURI, setSelectedVoiceURI] = useState<string | null>(null);
    const [popoverOpen, setPopoverOpen] = useState(false);


    useEffect(() => {
      const loadVoices = () => {
        const allVoices = window.speechSynthesis.getVoices();
        if (allVoices.length > 0) {
            const supportedVoices = allVoices.filter(v => v.lang.startsWith('tr') || v.lang.startsWith('en'));
            setAvailableVoices(supportedVoices);
            return true;
        }
        return false;
      };

      if (!loadVoices()) {
          window.speechSynthesis.onvoiceschanged = loadVoices;
      }
      
      const savedVoice = localStorage.getItem(VOICE_STORAGE_KEY);
      if (savedVoice) {
        setSelectedVoiceURI(savedVoice);
      }
    }, []);

    const handleVoiceSelect = (voiceURI: string) => {
      setSelectedVoiceURI(voiceURI);
      localStorage.setItem(VOICE_STORAGE_KEY, voiceURI);
      setPopoverOpen(false);
    }

    const cancelNarration = useCallback(() => {
        if (window.speechSynthesis.speaking) {
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

    const handlePlayAudio = useCallback(async (poi: PointOfInterest) => {
        if (status === 'narrating' || status === 'generating') {
             cancelNarration();
             return;
        }
        
        setStatus('generating');
        setNarratingPoi(poi);

        const startPlayback = () => {
            const utterance = new SpeechSynthesisUtterance(poi.description);
            speechUtteranceRef.current = utterance;

            const voices = window.speechSynthesis.getVoices();
            let selectedVoice = selectedVoiceURI ? voices.find(v => v.voiceURI === selectedVoiceURI) : null;
            
             if (!selectedVoice) {
                const voiceLang = language === 'tr' ? 'tr-TR' : 'en-US';
                selectedVoice = voices.find(v => v.lang === voiceLang && v.name.toLowerCase().includes('erkek'));
                if (!selectedVoice) {
                    selectedVoice = voices.find(v => v.lang === voiceLang && v.name.toLowerCase().includes('male'));
                }
                if (!selectedVoice) {
                    selectedVoice = voices.find(v => v.lang === voiceLang);
                }
            }


            if (selectedVoice) {
                utterance.voice = selectedVoice;
            }

            utterance.onstart = () => {
                setStatus('narrating');
            };
            utterance.onend = () => {
                cancelNarration();
            };
            utterance.onerror = () => {
                toast({
                    title: translations.toast.audioErrorTitle,
                    description: translations.toast.audioErrorDescription,
                    variant: "destructive"
                });
                cancelNarration();
            };

            window.speechSynthesis.speak(utterance);
        };
        
        if (window.speechSynthesis.getVoices().length === 0) {
            window.speechSynthesis.onvoiceschanged = startPlayback;
        } else {
            startPlayback();
        }

    }, [status, toast, cancelNarration, translations, language, selectedVoiceURI]);


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
            });
        } else {
            stopLocationTracking();
            toast({
                title: translations.audioGuide.stopped,
            });
        }
    };

    const handleButtonClick = () => {
        if (status === 'narrating' || status === 'generating') {
            cancelNarration();
        } else {
            toggleGuide();
        }
    };

    const currentLangVoices = availableVoices.filter(v => v.lang.startsWith(language));

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
                {(status === 'idle' || status === 'listening') && status !== 'narrating' && status !== 'generating' && <Radio className="mr-2 h-4 w-4" />}
                
                {status === 'generating' ? translations.audioGuide.generating
                 : status === 'narrating' ? `${translations.audioGuide.narrating}...`
                 : status === 'listening' ? translations.audioGuide.activeShort
                 : translations.audioGuide.title}
            </Button>
            <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
                <PopoverTrigger asChild>
                    <Button variant="ghost" size="icon" aria-label={translations.audioGuide.voiceSettings}>
                        <Settings className="h-5 w-5" />
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[300px] p-0">
                    <Command>
                        <CommandInput placeholder={translations.audioGuide.searchVoice} />
                        <CommandList>
                            <CommandEmpty>{translations.audioGuide.noVoiceFound}</CommandEmpty>
                            <CommandGroup heading={translations.audioGuide.availableVoices}>
                                {currentLangVoices.map(voice => (
                                    <CommandItem
                                        key={voice.voiceURI}
                                        onSelect={() => handleVoiceSelect(voice.voiceURI)}
                                        value={voice.name}
                                    >
                                        <Check className={`mr-2 h-4 w-4 ${selectedVoiceURI === voice.voiceURI ? 'opacity-100' : 'opacity-0'}`} />
                                        {voice.name} ({voice.lang})
                                    </CommandItem>
                                ))}
                            </CommandGroup>
                        </CommandList>
                    </Command>
                </PopoverContent>
            </Popover>
        </div>
    );
}

    