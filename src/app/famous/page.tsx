
"use client";

import Image from 'next/image';
import { useLanguage } from '@/context/language-context';
import { getImageById } from '@/lib/placeholder-images';
import { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { PlayIcon, PauseIcon, Loader2 } from 'lucide-react';

export default function FamousPage() {
    const { language, translations } = useLanguage();
    const heroImage = getImageById('hero-home');
    const { toast } = useToast();
    
    const [isPlaying, setIsPlaying] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
    const synthRef = useRef<SpeechSynthesis | null>(null);

    const cleanupSpeech = useCallback(() => {
        if (synthRef.current && synthRef.current.speaking) {
            synthRef.current.cancel();
        }
        setIsPlaying(false);
        setIsPaused(false);
        utteranceRef.current = null;
    }, []);

    useEffect(() => {
        synthRef.current = window.speechSynthesis;
        const utterance = new SpeechSynthesisUtterance(translations.famous.historyContent);
        utterance.lang = language;
        utterance.onend = () => {
            setIsPlaying(false);
            setIsPaused(false);
        };
        utterance.onerror = () => {
            toast({
                title: translations.toast.audioErrorTitle,
                description: translations.toast.audioErrorDescription,
                variant: "destructive"
            });
            cleanupSpeech();
        };
        utteranceRef.current = utterance;
        
        // Cleanup on component unmount or language change
        return () => {
            cleanupSpeech();
        };
    }, [language, translations, toast, cleanupSpeech]);
    

    const handlePlayPause = () => {
        if (!synthRef.current || !utteranceRef.current) {
            toast({
                title: translations.toast.unsupportedTitle,
                description: translations.toast.unsupportedDescription,
                variant: "destructive"
            });
            return;
        }

        if (synthRef.current.speaking && !synthRef.current.paused) {
            synthRef.current.pause();
            setIsPaused(true);
        } else if (synthRef.current.speaking && synthRef.current.paused) {
            synthRef.current.resume();
            setIsPaused(false);
        } else {
            synthRef.current.speak(utteranceRef.current);
            setIsPlaying(true);
            setIsPaused(false);
        }
    };
    
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
                <div className="relative z-10 container py-8">
                    <h1 className="font-headline text-4xl md:text-5xl font-bold tracking-tight drop-shadow-lg">
                        {translations.famous.pageTitle}
                    </h1>
                </div>
            </section>
            <div className="container py-8 md:py-12">
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
                         {translations.famous.historyContent.split('\n').map((paragraph, index) => (
                            <p key={index}>{paragraph}</p>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
