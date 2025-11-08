
"use client";

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { PlayIcon, PauseIcon } from 'lucide-react';
import { useLanguage } from '@/context/language-context';
import { useToast } from '@/hooks/use-toast';

interface TTSPlayerProps {
    textToRead: string;
}

export function TTSPlayer({ textToRead }: TTSPlayerProps) {
    const { language, translations } = useLanguage();
    const { toast } = useToast();
    
    const [isAvailable, setIsAvailable] = useState(false);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isPaused, setIsPaused] = useState(false);

    const synthRef = useRef<SpeechSynthesis | null>(null);
    const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

    useEffect(() => {
        if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
            synthRef.current = window.speechSynthesis;
            setIsAvailable(true);
        }

        // Cleanup function to cancel speech when the component unmounts
        return () => {
            if (synthRef.current?.speaking) {
                synthRef.current.cancel();
            }
        };
    }, []);

    useEffect(() => {
        // This effect creates/updates the utterance when the text or language changes.
        const synth = synthRef.current;
        if (!synth || !isAvailable) return;

        // If currently speaking, cancel it before creating a new one
        if (synth.speaking) {
            synth.cancel();
        }
        
        const newUtterance = new SpeechSynthesisUtterance(textToRead);
        newUtterance.lang = language;

        newUtterance.onend = () => {
            setIsPlaying(false);
            setIsPaused(false);
        };

        newUtterance.onerror = (event) => {
             // Don't show an error if the language was changed while speaking
            if (event.error === 'interrupted') return;
            toast({
                title: translations.toast.audioErrorTitle,
                description: `${translations.toast.audioErrorDescription} (${event.error})`,
                variant: "destructive"
            });
            setIsPlaying(false);
            setIsPaused(false);
        };

        utteranceRef.current = newUtterance;

        // Reset playback state when text/language changes
        setIsPlaying(false);
        setIsPaused(false);

    }, [textToRead, language, isAvailable, toast, translations]);


    const handlePlayPause = () => {
        const synth = synthRef.current;
        const utterance = utteranceRef.current;

        if (!synth || !utterance) {
            toast({
                title: translations.toast.unsupportedTitle,
                description: translations.toast.unsupportedDescription,
                variant: "destructive"
            });
            return;
        }

        if (synth.speaking && !synth.paused) { // Is speaking, so pause
            synth.pause();
            setIsPaused(true);
        } else if (synth.speaking && synth.paused) { // Is paused, so resume
            synth.resume();
            setIsPaused(false);
        } else { // Not speaking, so start
            // If there's any lingering speech, cancel it before starting new.
            if (synth.speaking) {
                synth.cancel();
            }
            
            const startPlayback = () => {
                const voices = synth.getVoices();
                // Find a voice that matches the current language
                const voice = voices.find(v => v.lang.startsWith(language));
                if (voice) {
                    utterance.voice = voice;
                }
                synth.speak(utterance);
                setIsPlaying(true);
                setIsPaused(false);
            };

            // Voices might load asynchronously. If they are not ready, wait for the onvoiceschanged event.
            if (synth.getVoices().length === 0) {
                synth.onvoiceschanged = startPlayback;
            } else {
                startPlayback();
            }
        }
    };
    
    const getButtonText = () => {
        if (!isPlaying) return translations.pois.listen;
        if (isPaused) return translations.famous.continueNarration;
        return translations.pois.pause;
    };

    if (!isAvailable) {
        return null; // Don't render the button if TTS is not supported
    }

    return (
        <Button
            variant="outline"
            onClick={handlePlayPause}
            aria-label={isPlaying && !isPaused ? translations.pois.pauseNarration : translations.pois.listenNarration}
        >
            {isPlaying && !isPaused ? (
                <PauseIcon className="mr-2 h-4 w-4" />
            ) : (
                <PlayIcon className="mr-2 h-4 w-4" />
            )}
            {getButtonText()}
        </Button>
    );
}
