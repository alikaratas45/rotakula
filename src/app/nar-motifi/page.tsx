"use client";

import { useApp } from '@/context/app-context';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Gem, PlayIcon, PauseIcon } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useSearchParams } from 'next/navigation';

export default function NarMotifiPage() {
    const { language, translations } = useApp();
    const { toast } = useToast();
    const searchParams = useSearchParams();

    const [isPlaying, setIsPlaying] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const synthRef = useRef<SpeechSynthesis | null>(null);
    const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

    const narrationText = translations.narMotifi.content.join(' ') + ' ' + translations.narMotifi.poem.join(' ');
    const [remainingText, setRemainingText] = useState(narrationText);
    const charIndexRef = useRef(0);
    
    // Initialize Speech Synthesis
    useEffect(() => {
        if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
            synthRef.current = window.speechSynthesis;
        }
         // General cleanup
        return () => {
            if (synthRef.current?.speaking) {
                synthRef.current.cancel();
            }
        };
    }, []);

    // Update text when language changes
    useEffect(() => {
        const newNarrationText = translations.narMotifi.content.join(' ') + ' ' + translations.narMotifi.poem.join(' ');
        setRemainingText(newNarrationText);
        charIndexRef.current = 0;
        // Stop any ongoing speech when language changes
        if (synthRef.current?.speaking) {
            synthRef.current.cancel();
            setIsPlaying(false);
            setIsPaused(false);
        }
    }, [translations]);


    const startPlayback = useCallback((textToSpeak: string) => {
        const synth = synthRef.current;
        if (!synth || !textToSpeak) return;

        if (synth.speaking) {
            synth.cancel();
        }

        const utterance = new SpeechSynthesisUtterance(textToSpeak);
        utteranceRef.current = utterance;
        
        const voices = synth.getVoices();
        const voice = voices.find(v => v.lang.startsWith(language) && v.default) || voices.find(v => v.lang.startsWith(language));
        if (voice) {
            utterance.voice = voice;
        }
        utterance.lang = language;

        utterance.onboundary = (event) => {
            charIndexRef.current = event.charIndex;
        };

        utterance.onend = () => {
            setIsPlaying(false);
            setIsPaused(false);
            charIndexRef.current = 0;
            setRemainingText(narrationText); 
        };

        utterance.onerror = (event) => {
             if (event.error !== 'interrupted') {
                 toast({
                    title: translations.toast.audioErrorTitle,
                    description: `${translations.toast.audioErrorDescription} (${event.error})`,
                    variant: "destructive"
                });
            }
            setIsPlaying(false);
            setIsPaused(false);
            charIndexRef.current = 0;
            setRemainingText(narrationText); 
        };
        
        setTimeout(() => {
            synth.speak(utterance);
            setIsPlaying(true);
            setIsPaused(false);
        }, 100);
    }, [language, narrationText, toast, translations]);


    const handlePlayPause = useCallback(() => {
        const synth = synthRef.current;
        if (!synth) {
            toast({
                title: translations.toast.unsupportedTitle,
                description: translations.toast.unsupportedDescription,
                variant: "destructive"
            });
            return;
        }

        if (synth.speaking && !isPaused) { 
            const fullText = utteranceRef.current?.text || narrationText;
            const spokenTextLength = charIndexRef.current;
            const remaining = fullText.substring(spokenTextLength);
            
            synth.cancel(); 
            setRemainingText(remaining);
            setIsPaused(true);
            setIsPlaying(false);

        } else { 
             if (synth.getVoices().length === 0) {
                 synth.onvoiceschanged = () => startPlayback(remainingText || narrationText);
            } else {
                startPlayback(remainingText || narrationText);
            }
        }
    }, [isPaused, remainingText, narrationText, toast, translations, startPlayback]);

    // Autoplay effect
    useEffect(() => {
        const shouldAutoplay = searchParams.get('autoplay') === 'true';
        if (shouldAutoplay && narrationText) {
             const synth = synthRef.current;
             const safeStartPlayback = () => startPlayback(narrationText);

             if (synth && synth.getVoices().length > 0) {
                 safeStartPlayback();
             } else if (synth) {
                 synth.onvoiceschanged = safeStartPlayback;
             }
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [searchParams, narrationText]);


    return (
        <article>
            <section className="relative h-[40vh] md:h-[50vh] w-full flex items-end text-white">
                <Image
                    src="https://picsum.photos/seed/pomegranate/1200/800"
                    alt="Pomegranate carving on wood"
                    fill
                    priority
                    className="object-cover"
                    data-ai-hint="wood carving"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                <div className="relative z-10 container px-4 py-8">
                    <h1 className="font-headline text-4xl md:text-5xl font-bold tracking-tight drop-shadow-lg">
                        {translations.narMotifi.title}
                    </h1>
                </div>
            </section>
            
            <div className="container px-4 py-8 md:py-12">
                <div className="max-w-3xl mx-auto">
                    <div className="flex items-center gap-4 mb-6">
                        <Gem className="h-6 w-6 text-primary" />
                        <h2 className="text-2xl font-headline font-bold">{translations.pois.details}</h2>
                         {narrationText && (
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
                                {isPlaying ? translations.pois.pause : (isPaused ? translations.famous.continueNarration : translations.pois.listen)}
                            </Button>
                        )}
                    </div>
                    
                    <div className="prose prose-lg max-w-none text-foreground/90 space-y-4">
                        {translations.narMotifi.content.map((paragraph, index) => (
                            <p key={index}>{paragraph}</p>
                        ))}
                        <blockquote className="border-l-4 border-primary pl-4 italic text-center">
                            {translations.narMotifi.poem.map((line, index) => (
                                <span key={index} className="block">{line}</span>
                            ))}
                        </blockquote>
                    </div>
                </div>
            </div>
        </article>
    );
}
    