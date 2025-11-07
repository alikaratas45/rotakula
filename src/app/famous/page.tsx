
"use client";

import Image from 'next/image';
import { useLanguage } from '@/context/language-context';
import { getImageById } from '@/lib/placeholder-images';
import { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { PlayIcon, PauseIcon } from 'lucide-react';

// Define the single audio file for the Turkish audio guide
const audioFile = '/sesler/kulahakkinda.mp3';

export default function FamousPage() {
    const { language, translations } = useLanguage();
    const heroImage = getImageById('hero-home');
    const { toast } = useToast();
    
    const [isPlaying, setIsPlaying] = useState(false);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    // This effect handles initializing and cleaning up the audio player.
    useEffect(() => {
        // We only want this feature for the Turkish language
        if (language !== 'tr') {
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current = null;
            }
            setIsPlaying(false);
            return;
        }

        const audio = new Audio(audioFile);
        audioRef.current = audio;

        const handleTrackEnd = () => {
            setIsPlaying(false);
        };

        const handleError = (e: ErrorEvent) => {
            toast({
                title: translations.toast.audioErrorTitle,
                description: `MP3 dosyası yüklenemedi: ${audio.src.split('/').pop()}`,
                variant: "destructive"
            });
            setIsPlaying(false);
        }

        audio.addEventListener('ended', handleTrackEnd);
        audio.addEventListener('error', handleError);

        // Cleanup function to run when the component unmounts or dependencies change
        return () => {
            if(audioRef.current) {
                audioRef.current.pause();
                audioRef.current.removeEventListener('ended', handleTrackEnd);
                audioRef.current.removeEventListener('error', handleError);
                audioRef.current = null;
            }
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [language]);

    const handlePlayPause = useCallback(() => {
        if (language !== 'tr') return;

        const audio = audioRef.current;
        if (!audio) return;
        
        if (isPlaying) {
            audio.pause();
        } else {
             audio.play().catch(e => {
                console.error("Audio play failed:", e);
                toast({
                    title: translations.toast.audioErrorTitle,
                    description: "Ses dosyası oynatılamadı.",
                    variant: "destructive"
                });
                // Ensure we reset the state on failure
                setIsPlaying(false);
             });
        }
        setIsPlaying(prev => !prev);
    }, [isPlaying, language, toast, translations]);
    
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
                         {language === 'tr' && (
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
                         )}
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
