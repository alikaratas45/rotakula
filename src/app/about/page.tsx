
"use client";

import { useLanguage } from '@/context/language-context';
import { BookOpen, PauseIcon, PlayIcon } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

export default function AboutPage() {
    const { language, translations } = useLanguage();
    const { toast } = useToast();

    const narrationText = translations.about.content;

    const [isPlaying, setIsPlaying] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    
    const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
    const synthRef = useRef<SpeechSynthesis | null>(null);

    useEffect(() => {
        const synth = window.speechSynthesis;
        synthRef.current = synth;

        const handleVoicesChanged = () => {
            if (!utteranceRef.current) {
                const newUtterance = new SpeechSynthesisUtterance(narrationText);
                utteranceRef.current = newUtterance;
            }
            updateUtterance(utteranceRef.current);
        };

        const updateUtterance = (utterance: SpeechSynthesisUtterance) => {
            const voices = synth.getVoices();
            const voice = voices.find(v => v.lang.startsWith(language) && v.default) || voices.find(v => v.lang.startsWith(language));
            if (voice) {
                utterance.voice = voice;
            }
            utterance.lang = language;
            utterance.text = narrationText;

            utterance.onend = () => {
                setIsPlaying(false);
                setIsPaused(false);
            };
            utterance.onerror = (event) => {
                if (event.error !== 'interrupted') {
                     toast({
                        title: translations.toast.audioErrorTitle,
                        description: `${translations.toast.audioErrorDescription} (${event.error})`,
                        variant: "destructive"
                    });
                }
                setIsPlaying(false);
                setIsPaused(false);
            };
        };

        if (synth.getVoices().length === 0) {
            synth.addEventListener('voiceschanged', handleVoicesChanged);
        } else {
            handleVoicesChanged();
        }

        return () => {
            synth.removeEventListener('voiceschanged', handleVoicesChanged);
            if (synth.speaking) {
                synth.cancel();
            }
        };
    }, [narrationText, language, toast, translations]);


    const handlePlayPause = useCallback(() => {
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

        if (synth.speaking) {
            if (synth.paused) {
                synth.resume();
                setIsPaused(false);
            } else {
                synth.pause();
                setIsPaused(true);
            }
        } else {
            synth.speak(utterance);
            setIsPlaying(true);
            setIsPaused(false);
        }
    }, [toast, translations]);

    return (
        <div className="container px-4 py-8 md:py-12">
            <div className="max-w-3xl mx-auto">
                 <div className="flex items-center gap-4 mb-6">
                    <BookOpen className="h-8 w-8 text-primary" />
                    <div>
                        <h1 className="text-3xl md:text-4xl font-headline font-bold">{translations.about.title}</h1>
                    </div>
                </div>

                <div className="flex items-center gap-4 mb-6">
                    <h2 className="text-2xl font-headline font-bold">{translations.pois.details}</h2>
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
                        {isPlaying && !isPaused ? translations.pois.pause : (isPaused ? translations.famous.continueNarration : translations.pois.listen)}
                    </Button>
                </div>
                
                <div className="prose prose-lg max-w-none text-foreground/90">
                    {narrationText.split('\n\n').map((paragraph, index) => (
                        <p key={index}>{paragraph}</p>
                    ))}
                </div>
            </div>
        </div>
    );
}
