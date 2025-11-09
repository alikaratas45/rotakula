
"use client";

import Image from 'next/image';
import { useLanguage } from '@/context/language-context';
import { getImageById } from '@/lib/placeholder-images';
import { useState, useRef, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { PlayIcon, PauseIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function FamousPage() {
    const { language, translations } = useLanguage();
    const { toast } = useToast();
    const heroImage = getImageById('hero-home');
    const narrationText = translations.famous.historyContent;

    const [isPlaying, setIsPlaying] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    
    const synthRef = useRef<SpeechSynthesis | null>(null);
    const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

    // This effect runs only once to initialize the speech synthesis and utterance
    useEffect(() => {
        const synth = window.speechSynthesis;
        synthRef.current = synth;
        
        const utterance = new SpeechSynthesisUtterance(narrationText);
        utteranceRef.current = utterance;

        const onEnd = () => {
            setIsPlaying(false);
            setIsPaused(false);
        };

        const onError = (event: SpeechSynthesisErrorEvent) => {
            if (event.error !== 'interrupted') {
                toast({
                    title: translations.toast.audioErrorTitle,
                    description: `${translations.toast.audioErrorDescription} (${event.error})`,
                    variant: "destructive"
                });
            }
            setIsPlaying(false);
            setIsPaused(false);
        };

        utterance.onend = onEnd;
        utterance.onerror = onError;

        // Cleanup function to run when the component unmounts
        return () => {
            if (synth.speaking) {
                synth.cancel();
            }
            // Remove listeners to prevent memory leaks
            utterance.removeEventListener('end', onEnd);
            utterance.removeEventListener('error', onError);
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // Empty dependency array ensures this runs only once on mount.

    // This effect handles changes in language or narration text
    useEffect(() => {
        const synth = synthRef.current;
        const utterance = utteranceRef.current;

        if (synth && utterance) {
            // Stop any ongoing speech before changing language or text
            if (synth.speaking) {
                synth.cancel();
            }
            utterance.lang = language;
            utterance.text = narrationText;
        }
    }, [narrationText, language]);


    const handlePlayPause = useCallback(() => {
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

        if (synth.speaking) {
            if (synth.paused) {
                synth.resume();
                setIsPaused(false);
            } else {
                synth.pause();
                setIsPaused(true);
            }
        } else {
            const startPlayback = () => {
                const voices = synth.getVoices();
                const voice = voices.find(v => v.lang.startsWith(language) && v.default) || voices.find(v => v.lang.startsWith(language));
                if (voice) {
                    utterance.voice = voice;
                }
                synth.speak(utterance);
                setIsPlaying(true);
                setIsPaused(false);
            };

            // Voices may not be loaded initially. Wait for them.
            if (synth.getVoices().length === 0) {
                synth.onvoiceschanged = startPlayback;
            } else {
                startPlayback();
            }
        }
    }, [language, toast, translations]);


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
                         {narrationText.split('\n\n').map((paragraph, index) => (
                            <p key={index}>{paragraph}</p>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
