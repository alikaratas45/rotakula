
"use client";

import Image from 'next/image';
import { APIProvider } from '@vis.gl/react-google-maps';
import EmbeddedMap from '@/components/map';
import { getImageById } from '@/lib/placeholder-images';
import type { PointOfInterest } from '@/lib/types';
import { useState, useRef, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { PlayIcon, PauseIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useApp } from '@/context/app-context';
import { useRouter, useSearchParams } from 'next/navigation';
import { Separator } from '@/components/ui/separator';

export default function PlaceClientPage({ poi }: { poi: PointOfInterest }) {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!;
    const heroImage = getImageById(poi.imageId);
    const { language, translations, setSurveyState } = useApp();
    const router = useRouter();
    const searchParams = useSearchParams();

    const [isPlaying, setIsPlaying] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    
    const synthRef = useRef<SpeechSynthesis | null>(null);
    const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
    const { toast } = useToast();
    
    const narrationText = poi.longDescription;
    const [remainingText, setRemainingText] = useState(narrationText);
    const charIndexRef = useRef(0);

    const startPlayback = useCallback((textToSpeak: string) => {
        const synth = synthRef.current;
        if (!synth || !textToSpeak) return;

        if (synth.speaking) {
            synth.cancel();
        }

        const textForSpeech = language === 'tr' ? textToSpeak.replace(/UNESCO/g, 'Unesko') : textToSpeak;

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
            const submittedSurveys = JSON.parse(localStorage.getItem('kula-submitted-surveys') || '{}');
            if (!submittedSurveys[poi.id]) {
                setSurveyState({ isOpen: true, poi: poi });
            }
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
    }, [language, narrationText, poi.id, poi, setSurveyState, toast, translations]);

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
                 synth.onvoiceschanged = () => startPlayback(remainingText);
            } else {
                startPlayback(remainingText);
            }
        }
    }, [isPaused, remainingText, narrationText, toast, translations, startPlayback]);

     useEffect(() => {
        if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
            synthRef.current = window.speechSynthesis;
        }
        setRemainingText(narrationText);
        charIndexRef.current = 0;
        
        const shouldAutoplay = searchParams.get('autoplay') === 'true';
        if (shouldAutoplay) {
            const newPath = `/places/${poi.slug}`;
            router.replace(newPath, { scroll: false });
            setTimeout(() => {
                // Check if synth is ready, otherwise wait for voices
                const synth = synthRef.current;
                if (synth && synth.getVoices().length > 0) {
                    startPlayback(narrationText);
                } else if (synth) {
                    synth.onvoiceschanged = () => startPlayback(narrationText);
                }
            }, 500); 
        }

        return () => {
            if (synthRef.current?.speaking) {
                synthRef.current.cancel();
            }
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [poi.id, narrationText, startPlayback]);


    return (
        <APIProvider apiKey={apiKey}>
            <article>
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
                            {poi.name}
                        </h1>
                         <p className="mt-2 text-lg text-white/90 capitalize">
                            {translations.category[poi.category as keyof typeof translations.category] || poi.category}
                         </p>
                    </div>
                </section>
                
                <div className="container px-4 py-8 md:py-12">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12">
                         <div className="lg:col-span-2">
                             <div className="flex items-center gap-4 mb-6">
                                <h2 className="text-2xl font-headline font-bold">{translations.pois.details}</h2>
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
                             </div>
                             <div className="prose prose-lg max-w-none text-foreground/90">
                                {poi.longDescription.split('\n').map((paragraph, index) => (
                                    <p key={index}>{paragraph}</p>
                                ))}
                            </div>
                        </div>

                        <aside className="lg:col-span-1">
                            <div className="sticky top-24 space-y-6">
                                <div>
                                    <h2 className="text-2xl font-headline font-bold mb-4">{translations.common.map}</h2>
                                    <EmbeddedMap pois={[poi]} />
                                </div>
                            </div>
                        </aside>
                    </div>
                </div>
            </article>
        </APIProvider>
    );
}

