
"use client";

import Image from 'next/image';
import { useLanguage } from '@/context/language-context';
import { getImageById } from '@/lib/placeholder-images';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { PlayIcon, PauseIcon } from '@/components/icons';

export default function FamousPage() {
    const { language, translations } = useLanguage();
    const heroImage = getImageById('hero-home');
    const { toast } = useToast();

    const [isPlaying, setIsPlaying] = useState(false);
    const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
    const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

    useEffect(() => {
        if ('speechSynthesis' in window) {
            const handleVoicesChanged = () => {
                setVoices(window.speechSynthesis.getVoices());
            };
            window.speechSynthesis.onvoiceschanged = handleVoicesChanged;
            handleVoicesChanged();

            return () => {
                window.speechSynthesis.onvoiceschanged = null;
                if (window.speechSynthesis.speaking) {
                    window.speechSynthesis.cancel();
                }
            };
        }
    }, []);

    const cleanup = useCallback(() => {
        if (window.speechSynthesis) {
            window.speechSynthesis.cancel();
        }
        setIsPlaying(false);
    }, []);

    useEffect(() => {
      return () => {
        cleanup();
      };
    }, [cleanup]);

    const handlePlayPause = useCallback(async () => {
        if (!('speechSynthesis' in window)) {
            toast({
                title: translations.toast.unsupportedTitle,
                description: translations.toast.unsupportedDescription,
                variant: "destructive"
            });
            return;
        }

        if (window.speechSynthesis.speaking) {
            if (window.speechSynthesis.paused) {
                 window.speechSynthesis.resume();
                 setIsPlaying(true);
            } else {
                window.speechSynthesis.pause();
                setIsPlaying(false);
            }
            return;
        }
        
        cleanup();

        const utterance = new SpeechSynthesisUtterance(translations.famous.historyContent);
        utterance.lang = language === 'tr' ? "tr-TR" : "en-US";
        
        const voiceCriteria = (v: SpeechSynthesisVoice) => 
            v.lang.startsWith(language) && v.name.toLowerCase().includes('male');
        
        const maleVoice = voices.find(voiceCriteria);

        if (maleVoice) {
            utterance.voice = maleVoice;
        } else {
            const langVoice = voices.find(v => v.lang.startsWith(language));
            if (langVoice) utterance.voice = langVoice;
        }
        
        utteranceRef.current = utterance;

        utterance.onstart = () => setIsPlaying(true);
        utterance.onpause = () => setIsPlaying(false);
        utterance.onresume = () => setIsPlaying(true);
        utterance.onend = () => cleanup();
        utterance.onerror = (event) => {
            toast({
                title: translations.toast.audioErrorTitle,
                description: `${translations.toast.audioErrorDescription}: ${event.error}`,
                variant: "destructive"
            });
            cleanup();
        };

        window.speechSynthesis.speak(utterance);

    }, [translations.famous.historyContent, cleanup, toast, voices, language, translations]);

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
                            aria-label={isPlaying ? translations.pois.pauseNarration : translations.pois.listenNarration}
                        >
                            {isPlaying ? (
                                <PauseIcon className="mr-2 h-4 w-4" />
                            ) : (
                                <PlayIcon className="mr-2 h-4 w-4" />
                            )}
                            {isPlaying ? translations.pois.pause : translations.pois.listen}
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
