
"use client";

import Image from 'next/image';
import { useLanguage } from '@/context/language-context';
import { getImageById } from '@/lib/placeholder-images';
import { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { PlayIcon, PauseIcon, Loader2 } from 'lucide-react';
import { generateAudio, type AudioRequest } from '@/ai/flows/audio-flow';


export default function FamousPage() {
    const { language, translations } = useLanguage();
    const heroImage = getImageById('hero-home');
    const { toast } = useToast();
    
    const [isPlaying, setIsPlaying] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const audioSrcRef = useRef<string | null>(null);

    const cleanupAudio = useCallback(() => {
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.remove();
            audioRef.current = null;
        }
        audioSrcRef.current = null;
        setIsPlaying(false);
        setIsPaused(false);
    }, []);

    useEffect(() => {
        // Cleanup on language change or component unmount
        return () => {
            cleanupAudio();
        };
    }, [language, cleanupAudio]);

    const handlePlayPause = async () => {
        if (isGenerating) return;

        if (audioRef.current) {
            if (isPlaying && !isPaused) {
                audioRef.current.pause();
                setIsPaused(true);
            } else {
                audioRef.current.play();
                setIsPaused(false);
            }
            return;
        }

        try {
            setIsGenerating(true);
            const textToSpeak = translations.famous.historyContent;
            
            const response = await generateAudio({ text: textToSpeak });
            audioSrcRef.current = response.media;

            const newAudio = new Audio(audioSrcRef.current);
            audioRef.current = newAudio;

            newAudio.onplay = () => {
                setIsPlaying(true);
                setIsPaused(false);
            };
            newAudio.onpause = () => {
                // This will be called for both pause and end of audio
                 if (newAudio.currentTime < newAudio.duration) {
                    setIsPaused(true);
                }
            };
            newAudio.onended = () => {
                cleanupAudio();
            };
            newAudio.onerror = () => {
                toast({
                    title: translations.toast.audioErrorTitle,
                    description: translations.toast.audioErrorDescription,
                    variant: "destructive"
                });
                cleanupAudio();
            };
            
            await newAudio.play();

        } catch (error) {
            console.error("Audio generation failed:", error);
            toast({
                title: translations.toast.audioErrorTitle,
                description: (error as Error).message || "Could not generate audio.",
                variant: "destructive"
            });
            cleanupAudio();
        } finally {
            setIsGenerating(false);
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
                            disabled={isGenerating}
                            aria-label={isPlaying && !isPaused ? translations.pois.pauseNarration : translations.pois.listenNarration}
                        >
                            {isGenerating ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : isPlaying && !isPaused ? (
                                <PauseIcon className="mr-2 h-4 w-4" />
                            ) : (
                                <PlayIcon className="mr-2 h-4 w-4" />
                            )}
                            {isGenerating ? translations.audioGuide.generating : (isPlaying && !isPaused ? translations.pois.pause : (isPaused ? translations.famous.continueNarration : translations.pois.listen))}
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
