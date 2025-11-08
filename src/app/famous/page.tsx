
"use client";

import Image from 'next/image';
import { useLanguage } from '@/context/language-context';
import { getImageById } from '@/lib/placeholder-images';
import { Button } from '@/components/ui/button';
import { PlayIcon, PauseIcon } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';

// --- Main Page Component ---
export default function FamousPage() {
    const { language, translations } = useLanguage();
    const heroImage = getImageById('hero-home');
    const narrationText = translations.famous.historyContent;

    const [isPlaying, setIsPlaying] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const [showButton, setShowButton] = useState(false);

    const audioRef = useRef<HTMLAudioElement | null>(null);
    const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
    const synthRef = useRef<SpeechSynthesis | null>(null);
    const { toast } = useToast();

    // Effect to handle all audio setup and cleanup based on language
    useEffect(() => {
        const synth = window.speechSynthesis;
        synthRef.current = synth;
        setShowButton(!!synth);

        // Stop any currently playing audio
        const stopAllAudio = () => {
            if (audioRef.current && !audioRef.current.paused) {
                audioRef.current.pause();
            }
            if (synth?.speaking) {
                synth.cancel();
            }
            setIsPlaying(false);
            setIsPaused(false);
        };
        
        stopAllAudio();
        
        // --- Setup based on language ---
        if (language === 'tr') {
            const audio = new Audio('/sesler/kulahakkinda.mp3');
            audioRef.current = audio;
            utteranceRef.current = null; // Clear utterance ref

            const handleAudioEnd = () => {
                setIsPlaying(false);
                setIsPaused(false);
            };
            audio.addEventListener('ended', handleAudioEnd);

            // Cleanup function for TR
            return () => {
                audio.removeEventListener('ended', handleAudioEnd);
                if (!audio.paused) {
                    audio.pause();
                }
            };
        } else {
            const newUtterance = new SpeechSynthesisUtterance(narrationText);
            newUtterance.lang = language;
            utteranceRef.current = newUtterance;
            audioRef.current = null; // Clear audio ref

            const handleTtsEnd = () => {
                setIsPlaying(false);
                setIsPaused(false);
            };

            const handleTtsError = (event: SpeechSynthesisErrorEvent) => {
                if (event.error === 'interrupted') return; // Don't show error if we interrupted it ourselves
                 toast({
                    title: translations.toast.audioErrorTitle,
                    description: `${translations.toast.audioErrorDescription} (${event.error})`,
                    variant: "destructive"
                });
                setIsPlaying(false);
                setIsPaused(false);
            };

            newUtterance.onend = handleTtsEnd;
            newUtterance.onerror = handleTtsError;
            
            // Cleanup function for other languages
            return () => {
                if (synth?.speaking) {
                    synth.cancel();
                }
                // Explicitly remove listeners to be safe
                newUtterance.onend = null;
                newUtterance.onerror = null;
            };
        }

    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [language, narrationText, translations]);


    const handlePlayPause = () => {
        // --- Turkish MP3 Logic ---
        if (language === 'tr') {
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
        } 
        // --- Other Languages TTS Logic ---
        else {
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

            if (synth.speaking && !synth.paused) { // Is speaking, so pause
                synth.pause();
                setIsPaused(true);
            } else if (synth.speaking && synth.paused) { // Is paused, so resume
                synth.resume();
                setIsPaused(false);
                setIsPlaying(true);
            } else { // Not speaking, so start
                if (synth.speaking) { // Cancel any previous speech
                    synth.cancel();
                }
                
                const startPlayback = () => {
                    const voices = synth.getVoices();
                    const voice = voices.find(v => v.lang.startsWith(language));
                    if (voice) {
                        utterance.voice = voice;
                    }
                    synth.speak(utterance);
                    setIsPlaying(true);
                    setIsPaused(false);
                };

                // Voices might load asynchronously.
                if (synth.getVoices().length === 0) {
                    synth.onvoiceschanged = startPlayback;
                } else {
                    startPlayback();
                }
            }
        }
    };
    
    const getButtonText = () => {
        if (!isPlaying) return translations.pois.listen;
        if (isPaused) return translations.famous.continueNarration;
        return translations.pois.pause;
    }

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
                         {showButton && (
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
                        )}
                    </div>
                   
                    <div className="prose prose-lg max-w-none text-foreground/90">
                         {narrationText.split('\n').map((paragraph, index) => (
                            <p key={index}>{paragraph}</p>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
