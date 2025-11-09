"use client";

import Image from 'next/image';
import { useLanguage } from '@/context/language-context';
import { getImageById } from '@/lib/placeholder-images';
import { useState, useRef, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { PlayIcon, PauseIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function FamousPage() {
    const { language, translations } = useLanguage();
    const { toast } = useToast();
    const heroImage = getImageById('hero-home');
    const narrationText = translations.famous.historyContent;

    const [isPlaying, setIsPlaying] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    
    const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
    const synthRef = useRef<SpeechSynthesis | null>(null);

    useEffect(() => {
        const synth = window.speechSynthesis;
        synthRef.current = synth;
        
        const utterance = new SpeechSynthesisUtterance(narrationText);
        utterance.lang = language;
        
        utterance.onend = () => {
            setIsPlaying(false);
            setIsPaused(false);
        };
        utterance.onerror = (event) => {
            if (event.error === 'interrupted') return;
            toast({
                title: translations.toast.audioErrorTitle,
                description: `${translations.toast.audioErrorDescription} (${event.error})`,
                variant: "destructive"
            });
            setIsPlaying(false);
            setIsPaused(false);
        };
        utteranceRef.current = utterance;

        // Cleanup function: This is crucial to stop any ongoing speech when the component unmounts or dependencies change.
        return () => {
             if (synthRef.current?.speaking) {
                synthRef.current.cancel();
            }
            setIsPlaying(false);
            setIsPaused(false);
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
        
        const startPlayback = () => {
            const voices = synth.getVoices();
            const voice = voices.find(v => v.lang.startsWith(language) && v.default) || voices.find(v => v.lang.startsWith(language));
            if (voice) {
                utterance.voice = voice;
            }
            synth.speak(utterance);
            setIsPlaying(true);
            setIsPaused(false);
        }

        if (synth.speaking && !synth.paused) {
            synth.pause();
            setIsPaused(true);
            setIsPlaying(true);
        } else if (synth.speaking && synth.paused) {
            synth.resume();
            setIsPaused(false);
        } else {
            if (synth.speaking) {
                synth.cancel();
            }
            // If voices are not loaded yet, wait for them. This is a common cause for "synthesis-failed".
            if (synth.getVoices().length === 0) {
                 synth.onvoiceschanged = startPlayback;
            } else {
                startPlayback();
            }
        }
    }, [language, toast, translations]);


    return (
        <div>
            <section className="relative h-[40vh] md:h-[50vh] w-full flex items-end text-white">
                {heroImage && (
                    <Image
                        src={heroImage.imageUrl}
                        alt={heroImage.description}
                        fill
                        priority
                        className="object-cover"
                        data-ai-hint={heroImage.imageHint}
                    />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                <div className="relative z-10 container px-4 py-8">
                    <h1 className="font-headline text-4xl md:text-5xl font-bold tracking-tight drop-shadow-lg">
                        {translations.famous.pageTitle}
                    </h1>
                </div>
            </section>
            <div className="container px-4 py-8 md:py-12">
                <div className="max-w-4xl mx-auto">
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
        </div>
    );
}