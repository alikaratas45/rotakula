
"use client";

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { PlayIcon, PauseIcon } from 'lucide-react';
import { useLanguage } from '@/context/language-context';

export function AudioPlayer() {
    const { translations } = useLanguage();
    const [isPlaying, setIsPlaying] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    useEffect(() => {
        // Create audio element only on the client
        audioRef.current = new Audio('/sesler/kulahakkinda.mp3');
        const audio = audioRef.current;

        const handleAudioEnd = () => {
            setIsPlaying(false);
            setIsPaused(false);
        };

        audio.addEventListener('ended', handleAudioEnd);

        // Cleanup on component unmount
        return () => {
            audio.removeEventListener('ended', handleAudioEnd);
            audio.pause();
        };
    }, []);

    const handlePlayPause = () => {
        const audio = audioRef.current;
        if (!audio) return;

        if (isPlaying && !isPaused) {
            audio.pause();
            setIsPaused(true);
        } else {
            audio.play().catch(e => console.error("Audio play failed:", e));
            setIsPlaying(true);
            setIsPaused(false);
        }
    };

    const getButtonText = () => {
        if (!isPlaying) return translations.pois.listen;
        if (isPaused) return translations.famous.continueNarration;
        return translations.pois.pause;
    };

    return (
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
            {getButtonText()}
        </Button>
    );
}
