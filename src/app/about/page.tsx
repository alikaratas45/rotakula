
"use client";

import { useLanguage } from '@/context/language-context';
import { BookOpen, PauseIcon, PlayIcon, Users, Home, Landmark } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';
import { getImageById } from '@/lib/placeholder-images';
import { Card, CardContent } from '@/components/ui/card';

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
        if (!narrationText || typeof window === 'undefined' || !('speechSynthesis' in window)) return;

        const synth = window.speechSynthesis;
        synthRef.current = synth;

        const utterance = new SpeechSynthesisUtterance(narrationText);
        utteranceRef.current = utterance;

        const onEnd = () => {
            setIsPlaying(false);
            setIsPaused(false);
            if (synthRef.current) {
                synthRef.current.cancel();
            }
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
        
        utterance.addEventListener('end', onEnd);
        utterance.addEventListener('error', onError);

        const updateVoice = () => {
            const voices = synth.getVoices();
            const voice = voices.find(v => v.lang.startsWith(language) && v.default) || voices.find(v => v.lang.startsWith(language));
            if (voice && utteranceRef.current) {
                utteranceRef.current.voice = voice;
            }
             if (utteranceRef.current) {
                utteranceRef.current.lang = language;
                utteranceRef.current.text = narrationText;
            }
        };

        if (synth.getVoices().length === 0) {
            synth.addEventListener('voiceschanged', updateVoice);
        } else {
            updateVoice();
        }

        return () => {
            utterance.removeEventListener('end', onEnd);
            utterance.removeEventListener('error', onError);
            synth.removeEventListener('voiceschanged', updateVoice);
            if (synth.speaking) {
                synth.cancel();
            }
        };
    }, [narrationText, language, toast, translations]);


    const handlePlayPause = useCallback(() => {
        const synth = synthRef.current;
        if (!synth || !utteranceRef.current) {
            toast({
                title: translations.toast.unsupportedTitle,
                description: translations.toast.unsupportedDescription,
                variant: "destructive"
            });
            return;
        }

        const utterance = utteranceRef.current;

        const startPlayback = () => {
            if (synth.speaking) {
                synth.cancel(); // Cancel any previous speech
            }
            // Re-check and set voice right before speaking
            const voices = synth.getVoices();
            const voice = voices.find(v => v.lang.startsWith(language) && v.default) || voices.find(v => v.lang.startsWith(language));
            if (voice) {
                utterance.voice = voice;
            }
            utterance.lang = language;
            utterance.text = narrationText; // Ensure text is current
            
            setTimeout(() => { // Small delay can help
                synth.speak(utterance);
                setIsPlaying(true);
                setIsPaused(false);
            }, 100);
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
    }, [language, narrationText, toast, translations]);

    const contentParagraphs = Array.isArray(translations.about.content)
        ? translations.about.content
        : (translations.about.content || "").split('\n\n');

    const stats = [
        { icon: Users, value: "42.952", label: translations.about.population },
        { icon: Home, value: "60", label: translations.about.neighborhoods },
        { icon: Landmark, value: "1150", label: translations.about.registeredBuildings },
    ];

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

             <section className="py-8 bg-muted/50">
                <div className="container px-4">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                        {stats.map((stat, index) => (
                            <Card key={index} className="bg-transparent border-0 shadow-none">
                                <CardContent className="flex flex-col items-center justify-center p-4 text-center">
                                    <stat.icon className="h-10 w-10 text-primary mb-3" strokeWidth={1.5} />
                                    <p className="text-3xl font-bold font-headline">{stat.value}</p>
                                    <p className="text-sm font-semibold text-muted-foreground">{stat.label}</p>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
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
