
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
    
    const synthRef = useRef<SpeechSynthesis | null>(null);
    const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
    
    const textToSpeakRef = useRef(text);
    const charIndexRef = useRef(0);

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

    useEffect(() => {
        if (synthRef.current?.speaking) {
            synthRef.current.cancel();
        }
        textToSpeakRef.current = text;
        charIndexRef.current = 0;
        setIsPlaying(false);
        utteranceRef.current = null;
    }, [text, language]);

    
    const startPlayback = useCallback((textToStart: string) => {
        const synth = synthRef.current;
        if (!synth || !textToStart) return;

        if (synth.speaking) {
            synth.cancel();
        }

        const utterance = new SpeechSynthesisUtterance(textToStart);
        utteranceRef.current = utterance;
        
        const voices = synth.getVoices();
        const voice = voices.find(v => v.lang.startsWith(language) && v.default) || voices.find(v => v.lang.startsWith(language));
        if (voice) {
            utterance.voice = voice;
        }
        utterance.lang = language;

        utterance.onboundary = (event) => {
            const baseIndex = text.length - textToSpeakRef.current.length;
            charIndexRef.current = baseIndex + event.charIndex;
        };

        utterance.onend = () => {
            setIsPlaying(false);
            textToSpeakRef.current = text; 
            charIndexRef.current = 0;
        };

        utterance.onerror = (event) => {
             if (event.error !== 'interrupted') {
                console.warn("Speech synthesis error:", event.error);
            }
            setIsPlaying(false);
            textToSpeakRef.current = text; 
            charIndexRef.current = 0;
        };
        
        setTimeout(() => {
            synth.speak(utterance);
            setIsPlaying(true);
        }, 100);
    }, [language, text, translations, toast]);


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
            synth.cancel(); 
            textToSpeakRef.current = text.substring(charIndexRef.current);
            setIsPlaying(false);

        } else {
            if (synth.getVoices().length === 0) {
                synth.onvoiceschanged = () => {
                    startPlayback(textToSpeakRef.current);
                };
            } else {
                startPlayback(textToSpeakRef.current);
            }
        }
    }, [toast, translations, startPlayback, text]);

    useEffect(() => {
        if (autoPlay && text) {
            setTimeout(() => {
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
                    className="bg-primary hover:bg-primary/90 text-primary-foreground"
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

