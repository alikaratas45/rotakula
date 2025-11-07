
"use client";

import Image from 'next/image';
import { useLanguage } from '@/context/language-context';
import { getImageById } from '@/lib/placeholder-images';
import { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { PlayIcon, PauseIcon } from 'lucide-react';

// Define the playlist for the Turkish audio guide
const audioPlaylist = [
    '/sesler/kulahakkinda1.mp3',
    '/sesler/kulahakkinda2.mp3',
    '/sesler/kulahakkinda3.mp3',
];

export default function FamousPage() {
    const { language, translations } = useLanguage();
    const heroImage = getImageById('hero-home');
    const { toast } = useToast();
    
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    // This effect initializes and cleans up the audio player
    useEffect(() => {
        // We only want this feature for Turkish language
        if (language !== 'tr') {
            // If there's an active audio player, stop it.
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current = null;
            }
            setIsPlaying(false);
            setCurrentTrackIndex(0);
            return;
        };

        // Initialize the Audio object
        audioRef.current = new Audio(audioPlaylist[currentTrackIndex]);
        
        const audio = audioRef.current;

        const handleTrackEnd = () => {
            // Check if there is a next track
            if (currentTrackIndex < audioPlaylist.length - 1) {
                setCurrentTrackIndex(prevIndex => prevIndex + 1);
            } else {
                // End of playlist
                setIsPlaying(false);
                setCurrentTrackIndex(0);
            }
        };

        const handleError = (e: ErrorEvent) => {
            toast({
                title: translations.toast.audioErrorTitle,
                description: `MP3 dosyası yüklenemedi: ${e.message}`,
                variant: "destructive"
            });
            setIsPlaying(false);
        }

        audio.addEventListener('ended', handleTrackEnd);
        audio.addEventListener('error', handleError);

        // Cleanup function
        return () => {
            audio.pause();
            audio.removeEventListener('ended', handleTrackEnd);
            audio.removeEventListener('error', handleError);
            audioRef.current = null;
            setIsPlaying(false);
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [language, translations.toast.audioErrorTitle]);


    // This effect handles changing tracks
    useEffect(() => {
        if (language !== 'tr' || !audioRef.current || !isPlaying) return;

        audioRef.current.src = audioPlaylist[currentTrackIndex];
        audioRef.current.play().catch(e => {
            console.error("Audio play failed:", e);
            setIsPlaying(false);
        });
        
    }, [currentTrackIndex, language, isPlaying]);


    const handlePlayPause = useCallback(() => {
        if (language !== 'tr' || !audioRef.current) {
            toast({
                title: translations.toast.unsupportedTitle,
                description: "Bu dil için sesli anlatım mevcut değil.",
                variant: "destructive"
            });
            return;
        }

        if (isPlaying) {
            audioRef.current.pause();
            setIsPlaying(false);
        } else {
            audioRef.current.play().then(() => {
                setIsPlaying(true);
            }).catch(e => {
                 toast({
                    title: translations.toast.audioErrorTitle,
                    description: "Ses dosyası oynatılamadı.",
                    variant: "destructive"
                });
            });
        }
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
