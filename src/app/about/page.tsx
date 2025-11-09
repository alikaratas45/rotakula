
"use client";

import { useLanguage } from '@/context/language-context';
import { BookOpen, PauseIcon, PlayIcon } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';
import { getImageById } from '@/lib/placeholder-images';

export default function AboutPage() {
    const { language, translations } = useLanguage();
    const { toast } = useToast();
    const heroImage = getImageById('hero-home');

    const narrationText = Array.isArray(translations.about.content)
        ? translations.about.content.join(' ')
        : translations.about.content;

    const [isPlaying, setIsPlaying] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    
    const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
    const synthRef = useRef<SpeechSynthesis | null>(null);

    useEffect(() => {
        if (!narrationText) return;

        const synth = window.speechSynthesis;
        synthRef.current = synth;

        const utterance = new SpeechSynthesisUtterance(narrationText);
        utteranceRef.current = utterance;

        const handleVoicesChanged = () => {
            if (utteranceRef.current) {
                updateUtterance(utteranceRef.current);
            }
        };

        const updateUtterance = (utterance: SpeechSynthesisUtterance) => {
            const voices = synth.getVoices();
            const voice = voices.find(v => v.lang.startsWith(language) && v.default) || voices.find(v => v.lang.startsWith(language));
            if (voice) {
                utterance.voice = voice;
            }
            utterance.lang = language;
            utterance.text = narrationText;

            utterance.onend = () => {
                setIsPlaying(false);
                setIsPaused(false);
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
            };
        };
        
        if (synth.getVoices().length === 0) {
            synth.addEventListener('voiceschanged', handleVoicesChanged);
        } else {
            handleVoicesChanged();
        }

        return () => {
            synth.removeEventListener('voiceschanged', handleVoicesChanged);
            if (synth.speaking) {
                synth.cancel();
            }
        };
    }, [narrationText, language, toast, translations]);


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

        const startPlayback = () => {
            const voices = synth.getVoices();
            const voice = voices.find(v => v.lang.startsWith(language) && v.default) || voices.find(v => v.lang.startsWith(language));
            if (voice) {
                utterance.voice = voice;
            }
            synth.speak(utterance);
            setIsPlaying(true);
            setIsPaused(false);
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
             if (synth.getVoices().length === 0) {
                synth.onvoiceschanged = startPlayback;
            } else {
                startPlayback();
            }
        }
    }, [language, toast, translations]);

    const contentParagraphs = Array.isArray(translations.about.content)
        ? translations.about.content
        : (translations.about.content || "").split('\n\n');

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
                        {translations.about.title}
                    </h1>
                </div>
            </section>
            <div className="container px-4 py-8 md:py-12">
                <div className="max-w-3xl mx-auto">
                    <div className="flex items-center gap-4 mb-6">
                        <h2 className="text-2xl font-headline font-bold">{translations.pois.details}</h2>
                        {narrationText && (
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
                        )}
                    </div>
                    
                    <div className="prose prose-lg max-w-none text-foreground/90">
                        {contentParagraphs.map((paragraph, index) => (
                            <p key={index}>{paragraph}</p>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
