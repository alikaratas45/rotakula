
"use client";

import Image from 'next/image';
import { useLanguage } from '@/context/language-context';
import { getImageById } from '@/lib/placeholder-images';
import { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { PlayIcon, PauseIcon } from '@/components/icons';


export default function FamousPage() {
    const { language, translations } = useLanguage();
    const heroImage = getImageById('hero-home');
    const { toast } = useToast();
    
    const [isPlaying, setIsPlaying] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const paragraphsRef = useRef<string[]>([]);
    const currentParagraphIndexRef = useRef(0);

    const cleanupSpeech = useCallback(() => {
        if (window.speechSynthesis) {
            window.speechSynthesis.cancel();
        }
        setIsPlaying(false);
        setIsPaused(false);
        currentParagraphIndexRef.current = 0;
    }, []);

    useEffect(() => {
        return () => {
            cleanupSpeech();
        };
    }, [cleanupSpeech]);

    useEffect(() => {
        paragraphsRef.current = translations.famous.historyContent.split('\n').filter(p => p.trim() !== '');
        cleanupSpeech();
    }, [translations.famous.historyContent, cleanupSpeech]);

    
    const speakParagraph = useCallback((index: number) => {
        if (index >= paragraphsRef.current.length) {
            cleanupSpeech();
            return;
        }

        const utterance = new SpeechSynthesisUtterance(paragraphsRef.current[index]);
        utterance.lang = language === 'tr' ? "tr-TR" : "en-US";
        
        const voices = window.speechSynthesis.getVoices();
        const voiceCriteria = (v: SpeechSynthesisVoice) => 
            v.lang.startsWith(language) && (v.name.toLowerCase().includes('male') || v.name.toLowerCase().includes('erkek'));
        
        const preferredVoice = voices.find(voiceCriteria);
        if (preferredVoice) {
            utterance.voice = preferredVoice;
        } else {
            const langVoice = voices.find(v => v.lang.startsWith(language));
            if (langVoice) utterance.voice = langVoice;
        }

        utterance.onend = () => {
            currentParagraphIndexRef.current += 1;
            speakParagraph(currentParagraphIndexRef.current);
        };
        
        utterance.onerror = (event) => {
            toast({
                title: translations.toast.audioErrorTitle,
                description: `${translations.toast.audioErrorDescription}: ${event.error}`,
                variant: "destructive"
            });
            cleanupSpeech();
        };

        window.speechSynthesis.speak(utterance);

    }, [language, translations, toast, cleanupSpeech]);


    const handlePlayPause = () => {
        if (!('speechSynthesis' in window)) {
            toast({
                title: translations.toast.unsupportedTitle,
                description: translations.toast.unsupportedDescription,
                variant: "destructive"
            });
            return;
        }
        
        if (!isPlaying) {
            cleanupSpeech();
            setIsPlaying(true);
            setIsPaused(false);
            currentParagraphIndexRef.current = 0;
            setTimeout(() => speakParagraph(0), 100);
        } else if (isPaused) {
            window.speechSynthesis.resume();
            setIsPaused(false);
        } else {
            window.speechSynthesis.pause();
            setIsPaused(true);
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
