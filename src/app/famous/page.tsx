
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

    // This effect handles initializing and cleaning up the audio player.
    // It also plays the next track when one ends.
    useEffect(() => {
        // We only want this feature for the Turkish language
        if (language !== 'tr') {
            // If language is switched, stop and clear the audio player
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current = null;
            }
            setIsPlaying(false);
            setCurrentTrackIndex(0);
            return;
        }

        // Initialize Audio object if it doesn't exist
        if (!audioRef.current) {
             audioRef.current = new Audio(audioPlaylist[0]);
        }
        
        const audio = audioRef.current;
        
        // Set the source based on the current track index
        audio.src = audioPlaylist[currentTrackIndex];

        // Function to handle when a track ends
        const handleTrackEnd = () => {
            if (currentTrackIndex < audioPlaylist.length - 1) {
                // Move to the next track
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

        // Add event listeners
        audio.addEventListener('ended', handleTrackEnd);
        audio.addEventListener('error', handleError);

        // If isPlaying is true, play the new track
        if (isPlaying) {
            audio.play().catch(e => {
                console.error("Audio play failed:", e);
                setIsPlaying(false);
                toast({
                    title: translations.toast.audioErrorTitle,
                    description: "Ses dosyası oynatılamadı.",
                    variant: "destructive"
                });
            });
        }
        
        // Cleanup function to run when the component unmounts or dependencies change
        return () => {
            if (audio) {
                audio.pause();
                audio.removeEventListener('ended', handleTrackEnd);
                audio.removeEventListener('error', handleError);
                // When language changes, we want a fresh start
                audioRef.current = null;
            }
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [language, currentTrackIndex, isPlaying]);


    const handlePlayPause = useCallback(() => {
        setIsPlaying(prevIsPlaying => !prevIsPlaying);
    }, []);
    
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
