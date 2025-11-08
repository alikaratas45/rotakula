"use client";

import Image from 'next/image';
import { useLanguage } from '@/context/language-context';
import { getImageById } from '@/lib/placeholder-images';
import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { PlayIcon, PauseIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';


// --- Main Page Component ---
export default function FamousPage() {
    const { language, translations } = useLanguage();
    const heroImage = getImageById('hero-home');
    const narrationText = translations.famous.historyContent;

    const { toast } = useToast();
    const [isPlaying, setIsPlaying] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const synthRef = useRef<SpeechSynthesis | null>(null);
    const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
        setIsClient(true);
        if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
            synthRef.current = window.speechSynthesis;
        }

        // Cleanup function to cancel speech when component unmounts or language changes
        return () => {
            if (synthRef.current?.speaking) {
                synthRef.current.cancel();
            }
        };
    }, []);

     useEffect(() => {
        const synth = synthRef.current;
        if (!synth || !narrationText) return;

        // If speaking, cancel the previous utterance before creating a new one
        if (synth.speaking) {
            synth.cancel();
        }

        const newUtterance = new SpeechSynthesisUtterance(narrationText);
        newUtterance.lang = language;
        
        newUtterance.onend = () => {
            setIsPlaying(false);
            setIsPaused(false);
        };
        newUtterance.onerror = (event) => {
            // Ignore interruption errors, which can happen during navigation or language change
            if (event.error === 'interrupted') return;
            toast({
                title: translations.toast.audioErrorTitle,
                description: `${translations.toast.audioErrorDescription} (${event.error})`,
                variant: "destructive"
            });
            setIsPlaying(false);
            setIsPaused(false);
        };
        utteranceRef.current = newUtterance;
        
        // Reset playback state
        setIsPlaying(false);
        setIsPaused(false);

    }, [narrationText, language, toast, translations]);


    const handlePlayPause = () => {
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

        if (synth.speaking && !synth.paused) { // Is playing, so pause
            synth.pause();
            setIsPaused(true);
        } else if (synth.speaking && synth.paused) { // Is paused, so resume
            synth.resume();
            setIsPaused(false);
        } else { // Not speaking, so start
            // If there's a leftover speaking state, cancel it before starting new
            if (synth.speaking) {
                synth.cancel();
            }
            
            const startPlayback = () => {
                const voices = synth.getVoices();
                // Prefer a default voice for the language, but fall back to any voice for that language
                const voice = voices.find(v => v.lang.startsWith(language) && v.default) || voices.find(v => v.lang.startsWith(language));
                if (voice) {
                    utterance.voice = voice;
                }
                synth.speak(utterance);
                setIsPlaying(true);
                setIsPaused(false);
            };

            // Voices are loaded asynchronously. If they are not ready, wait for the `voiceschanged` event.
            if (synth.getVoices().length === 0) {
                synth.onvoiceschanged = startPlayback;
            } else {
                startPlayback();
            }
        }
    };

    const getButtonText = () => {
        if (!isPlaying) return translations.pois.listen;
        if (isPaused) return translations.famous.continueNarration;
        return translations.pois.pause;
    };
    
    // Only show the button on the client-side if the browser supports speech synthesis
    const showButton = isClient && typeof window !== 'undefined' && 'speechSynthesis' in window;


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
                         {narrationText.split('\n\n').map((paragraph, index) => (
                            <p key={index}>{paragraph}</p>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
