
"use client";

import { useApp } from '@/context/app-context';
import { BookOpen, PauseIcon, PlayIcon, Users, Home, Landmark } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';
import { getImageById } from '@/lib/placeholder-images';
import { Card, CardContent } from '@/components/ui/card';

export default function AboutPage() {
    const { language, translations } = useApp();
    const { toast } = useToast();
    const heroImage = getImageById('hero-home');

    const [narrationText, setNarrationText] = useState("");
    const [isPlaying, setIsPlaying] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    
    const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
    const synthRef = useRef<SpeechSynthesis | null>(null);
    const [remainingText, setRemainingText] = useState("");
    const charIndexRef = useRef(0);

    useEffect(() => {
        const newNarrationText = Array.isArray(translations.about.content)
            ? translations.about.content.join(' ')
            : translations.about.content || "";
            
        setNarrationText(newNarrationText);
        setRemainingText(newNarrationText);
        charIndexRef.current = 0;
        
        if (synthRef.current?.speaking) {
            synthRef.current.cancel();
            setIsPlaying(false);
            setIsPaused(false);
        }
    }, [translations.about.content]);

    useEffect(() => {
        if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
            synthRef.current = window.speechSynthesis;
        }
        // Clean up on component unmount
        return () => {
            if (synthRef.current?.speaking) {
                synthRef.current.cancel();
            }
        };
    }, []);
    
    const startPlayback = useCallback((textToSpeak: string) => {
        const synth = synthRef.current;
        if (!synth || !textToSpeak) return;

        const start = (text: string) => {
            if (synth.speaking) {
                synth.cancel();
            }

            const textForSpeech = language === 'tr' ? text.replace(/UNESCO/g, 'Unesko') : text;

            const utterance = new SpeechSynthesisUtterance(textForSpeech);
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
        }

        if (synth.getVoices().length > 0) {
            start(textToSpeak);
        } else {
            synth.onvoiceschanged = () => start(textToSpeak);
        }
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
            startPlayback(remainingText || narrationText);
        }
    }, [isPaused, remainingText, narrationText, toast, translations, startPlayback]);

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

    