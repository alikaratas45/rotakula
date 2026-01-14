
"use client";

import { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Play, Pause } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useApp } from '@/context/app-context';

interface AudioPlayerProps {
  text: string;
  autoPlay?: boolean;
}

export default function AudioPlayer({ text, autoPlay = false }: AudioPlayerProps) {
    const { toast } = useToast();
    const { translations, language } = useApp();
    const [isPlaying, setIsPlaying] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const synthRef = useRef<SpeechSynthesis | null>(null);
    const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

    // This ref will hold the text that needs to be spoken, either from the beginning or from where it was paused.
    const remainingTextRef = useRef(text);
    
    // This effect ensures we have a reference to the synthesis object and cleans up on unmount.
    useEffect(() => {
        if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
            synthRef.current = window.speechSynthesis;
        }
        return () => {
            if (synthRef.current?.speaking) {
                synthRef.current.cancel();
            }
        };
    }, []);

    // This effect resets the player state whenever the input text or language changes.
    useEffect(() => {
        remainingTextRef.current = text;
        if (synthRef.current?.speaking) {
            synthRef.current.cancel();
        }
        setIsPlaying(false);
        setIsPaused(false);
    }, [text, language]);
    
    // This effect handles the autoplay functionality.
    useEffect(() => {
        if (autoPlay && text) {
            // A small delay can help ensure the voice list is populated.
            setTimeout(() => handlePlayPause(), 500);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [autoPlay, text]);


    const handlePlayPause = useCallback(() => {
        const synth = synthRef.current;
        if (!synth) {
            toast({
                title: translations.toast.unsupportedTitle,
                description: translations.toast.unsupportedDescription,
                variant: "destructive"
            });
            return;
        }

        if (synth.speaking) {
            // If it's speaking, we want to pause it.
            synth.pause();
            setIsPaused(true);
            setIsPlaying(false);
        } else {
            if (isPaused) {
                // If it's paused, we want to resume.
                synth.resume();
                setIsPaused(false);
                setIsPlaying(true);
            } else {
                // If it's not speaking and not paused, we start from the beginning of the remaining text.
                if (synth.getVoices().length === 0) {
                    // If voices are not loaded, wait for them.
                    synth.onvoiceschanged = () => {
                        startPlayback(remainingTextRef.current);
                    };
                } else {
                    startPlayback(remainingTextRef.current);
                }
            }
        }
    }, [isPaused, language, translations, toast]);

    const startPlayback = (textToSpeak: string) => {
        const synth = synthRef.current;
        if (!synth || !textToSpeak) return;

        // Cancel any previous utterance.
        if (synth.speaking) {
            synth.cancel();
        }

        const utterance = new SpeechSynthesisUtterance(textToSpeak);
        utteranceRef.current = utterance;
        
        // Find the best voice for the current language.
        const voices = synth.getVoices();
        const voice = voices.find(v => v.lang.startsWith(language) && v.default) || voices.find(v => v.lang.startsWith(language));
        if (voice) {
            utterance.voice = voice;
        }
        utterance.lang = language;

        utterance.onend = () => {
            setIsPlaying(false);
            setIsPaused(false);
            remainingTextRef.current = text; // Reset to full text on end.
        };

        utterance.onerror = (event) => {
             if (event.error !== 'interrupted') { // 'interrupted' is normal when we stop/start quickly.
                 toast({
                    title: translations.toast.audioErrorTitle,
                    description: `${translations.toast.audioErrorDescription} (${event.error})`,
                    variant: "destructive"
                });
            }
            setIsPlaying(false);
            setIsPaused(false);
        };
        
        // Use a small timeout to give the browser a moment to process the request, which can prevent some errors.
        setTimeout(() => {
            synth.speak(utterance);
            setIsPlaying(true);
            setIsPaused(false);
        }, 100);
    };

    return (
        <div className="w-full space-y-3">
            <div className="flex items-center gap-4">
                <Button
                    onClick={handlePlayPause}
                    disabled={!text}
                    size="lg"
                    aria-label={isPlaying ? translations.pois.pause : translations.pois.listen}
                >
                    {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
                    <span className="ml-2">
                        {isPlaying 
                            ? translations.pois.pause 
                            : (isPaused ? translations.famous.continueNarration : translations.pois.listen)
                        }
                    </span>
                </Button>
            </div>
        </div>
    );
}
