
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

    // Player state
    const [isPlaying, setIsPlaying] = useState(false);
    
    // Refs to manage synthesis and utterance logic
    const synthRef = useRef<SpeechSynthesis | null>(null);
    const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
    
    // This ref holds the text that needs to be spoken, either from the beginning or from where it was paused.
    const textToSpeakRef = useRef(text);
    // This ref tracks the character index where speech was paused.
    const charIndexRef = useRef(0);

    // Effect to initialize and clean up the speech synthesis engine
    useEffect(() => {
        if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
            synthRef.current = window.speechSynthesis;
        }
        // Cleanup: cancel any ongoing speech when the component unmounts
        return () => {
            if (synthRef.current?.speaking) {
                synthRef.current.cancel();
            }
        };
    }, []);

    // Effect to reset the player state when the input text or language changes
    useEffect(() => {
        if (synthRef.current?.speaking) {
            synthRef.current.cancel(); // Stop any current speech
        }
        // Reset all states
        textToSpeakRef.current = text;
        charIndexRef.current = 0;
        setIsPlaying(false);
        utteranceRef.current = null;
    }, [text, language]);

    
    // The core function to start playback
    const startPlayback = useCallback((textToStart: string) => {
        const synth = synthRef.current;
        if (!synth || !textToStart) return;

        // Cancel any previous utterance to prevent overlaps
        if (synth.speaking) {
            synth.cancel();
        }

        const utterance = new SpeechSynthesisUtterance(textToStart);
        utteranceRef.current = utterance;
        
        // Find the best voice for the current language
        const voices = synth.getVoices();
        const voice = voices.find(v => v.lang.startsWith(language) && v.default) || voices.find(v => v.lang.startsWith(language));
        if (voice) {
            utterance.voice = voice;
        }
        utterance.lang = language;

        // Event listener to track progress
        utterance.onboundary = (event) => {
            // We add the starting point of the current utterance to get the absolute index in the full text
            const baseIndex = text.length - textToSpeakRef.current.length;
            charIndexRef.current = baseIndex + event.charIndex;
        };

        // Event listener for when speech ends
        utterance.onend = () => {
            setIsPlaying(false);
            textToSpeakRef.current = text; // Reset to full text
            charIndexRef.current = 0;
        };

        // Event listener for errors
        utterance.onerror = (event) => {
            // 'interrupted' is a normal error when we manually cancel speech, so we ignore it.
             if (event.error !== 'interrupted') {
                 toast({
                    title: translations.toast.audioErrorTitle,
                    description: `${translations.toast.audioErrorDescription} (${event.error})`,
                    variant: "destructive"
                });
            }
            setIsPlaying(false);
            textToSpeakRef.current = text; // Reset on error
            charIndexRef.current = 0;
        };
        
        // Use a small timeout to ensure the browser's speech engine is ready
        setTimeout(() => {
            synth.speak(utterance);
            setIsPlaying(true);
        }, 100);
    }, [language, text, translations, toast]);


    // The main play/pause handler
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
            // PAUSE LOGIC
            // We don't use synth.pause() because it's unreliable.
            // Instead, we cancel the speech and save our position.
            synth.cancel(); // This will trigger the 'onend' or 'onerror' event, setting isPlaying to false.
            
            // The onboundary event has kept charIndexRef.current updated.
            // We slice the original text from our last known position.
            textToSpeakRef.current = text.substring(charIndexRef.current);
            setIsPlaying(false);

        } else {
            // PLAY/RESUME LOGIC
            // Check if voices are loaded. If not, wait for them.
            if (synth.getVoices().length === 0) {
                synth.onvoiceschanged = () => {
                    startPlayback(textToSpeakRef.current);
                };
            } else {
                startPlayback(textToSpeakRef.current);
            }
        }
    }, [toast, translations, startPlayback, text]);

    // This effect handles the autoplay functionality.
    useEffect(() => {
        if (autoPlay && text) {
            // A delay gives the browser time to load voices and prepare the player.
            setTimeout(() => {
                // Ensure we start from the beginning for autoplay
                textToSpeakRef.current = text;
                charIndexRef.current = 0;
                handlePlayPause();
            }, 500);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [autoPlay, text]);


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
                            : (textToSpeakRef.current.length < text.length ? translations.famous.continueNarration : translations.pois.listen)
                        }
                    </span>
                </Button>
            </div>
        </div>
    );
}

