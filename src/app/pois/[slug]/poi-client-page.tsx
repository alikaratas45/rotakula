
"use client";

import Image from 'next/image';
import { APIProvider } from '@vis.gl/react-google-maps';
import EmbeddedMap from '@/components/map';
import { getImageById } from '@/lib/placeholder-images';
import type { PointOfInterest } from '@/lib/types';
import { useState, useRef, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { PlayIcon, PauseIcon } from '@/components/icons';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/context/language-context';

export default function PoiClientPage({ poi }: { poi: PointOfInterest }) {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!;
    const heroImage = getImageById(poi.imageId);
    const { language, translations } = useLanguage();

    const [isPlaying, setIsPlaying] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const speechUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
    const { toast } = useToast();

    const cleanupSpeech = useCallback(() => {
        if (speechUtteranceRef.current) {
            speechUtteranceRef.current.onstart = null;
            speechUtteranceRef.current.onpause = null;
            speechUtteranceRef.current.onresume = null;
            speechUtteranceRef.current.onend = null;
            speechUtteranceRef.current.onerror = null;
        }
        if (window.speechSynthesis.speaking) {
            window.speechSynthesis.cancel();
        }
        setIsPlaying(false);
        setIsPaused(false);
    }, []);

    useEffect(() => {
        cleanupSpeech();
        return () => {
            cleanupSpeech();
        };
    }, [cleanupSpeech, poi, language]);

    const handlePlayPause = useCallback(async () => {
        if (isGenerating) return;

        if (isPlaying) {
            if (isPaused) {
                window.speechSynthesis.resume();
                setIsPaused(false);
            } else {
                window.speechSynthesis.pause();
                setIsPaused(true);
            }
            return;
        }

        setIsGenerating(true);

        const startPlayback = () => {
            const utterance = new SpeechSynthesisUtterance(poi.longDescription);
            speechUtteranceRef.current = utterance;
            
            const availableVoices = window.speechSynthesis.getVoices();
            const voiceLang = language === 'tr' ? 'tr-TR' : language === 'en' ? 'en-US' : language === 'fr' ? 'fr-FR' : 'de-DE';
            
            let selectedVoice = availableVoices.find(v => v.lang === voiceLang && (v.name.toLowerCase().includes('erkek') || v.name.toLowerCase().includes('male') || v.name.toLowerCase().includes('männlich')));
            if (!selectedVoice) {
                selectedVoice = availableVoices.find(v => v.lang === voiceLang && (v.name.toLowerCase().includes('kadın') || v.name.toLowerCase().includes('female') || v.name.toLowerCase().includes('weiblich')));
            }
            if (!selectedVoice) {
                selectedVoice = availableVoices.find(v => v.lang === voiceLang);
            }

            if (selectedVoice) {
                utterance.voice = selectedVoice;
            }

            utterance.onstart = () => {
                setIsPlaying(true);
                setIsPaused(false);
                setIsGenerating(false);
            };
            utterance.onpause = () => {
                setIsPaused(true);
            };
            utterance.onresume = () => {
                setIsPaused(false);
            };
            utterance.onend = () => {
                cleanupSpeech();
            };
            utterance.onerror = (event) => {
                if (event.error !== 'interrupted') {
                    toast({
                        title: translations.toast.audioErrorTitle,
                        description: translations.toast.audioErrorDescription,
                        variant: "destructive"
                    });
                }
                cleanupSpeech();
            };
            
            window.speechSynthesis.speak(utterance);
        };
        
        // Ensure voices are loaded
        const voices = window.speechSynthesis.getVoices();
        if (voices.length === 0) {
            window.speechSynthesis.onvoiceschanged = () => {
                startPlayback();
            };
        } else {
            startPlayback();
        }

    }, [poi.longDescription, isPlaying, isPaused, isGenerating, cleanupSpeech, toast, translations, language]);

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
                    <div className="relative z-10 container py-8">
                        <h1 className="font-headline text-4xl md:text-5xl font-bold tracking-tight drop-shadow-lg">
                            {poi.name}
                        </h1>
                         <p className="mt-2 text-lg text-white/90 capitalize">{poi.category}</p>
                    </div>
                </section>
                
                <div className="container py-8 md:py-12">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12">
                         <div className="lg:col-span-2">
                             <div className="flex items-center gap-4 mb-6">
                                <h2 className="text-2xl font-headline font-bold">{translations.pois.details}</h2>
                                <Button
                                    variant="outline"
                                    onClick={handlePlayPause}
                                    disabled={isGenerating}
                                    aria-label={isPlaying && !isPaused ? translations.pois.pauseNarration : translations.pois.listenNarration}
                                >
                                    {isGenerating ? (
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    ) : isPlaying && !isPaused ? (
                                        <PauseIcon className="mr-2 h-4 w-4" />
                                    ) : (
                                        <PlayIcon className="mr-2 h-4 w-4" />
                                    )}
                                    {isGenerating ? translations.audioGuide.generating : (isPlaying && !isPaused ? translations.pois.pause : (isPaused ? translations.famous.continueNarration : translations.pois.listen))}
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

    