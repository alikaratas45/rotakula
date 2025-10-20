
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
import { generateAudio, type AudioRequest } from '@/ai/flows/audio-flow';


export default function PoiClientPage({ poi }: { poi: PointOfInterest }) {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!;
    const heroImage = getImageById(poi.imageId);
    const { language, translations } = useLanguage();

    const [isPlaying, setIsPlaying] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const audioSrcRef = useRef<string | null>(null);
    const { toast } = useToast();

    const cleanupAudio = useCallback(() => {
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.remove();
            audioRef.current = null;
        }
        audioSrcRef.current = null;
        setIsPlaying(false);
        setIsPaused(false);
    }, []);

    useEffect(() => {
      // Cleanup on component unmount
      return () => {
        cleanupAudio();
      };
    }, [cleanupAudio, poi, language]);

    const handlePlayPause = useCallback(async () => {
        if (isGenerating) return;

        if (audioRef.current) {
            if (isPlaying && !isPaused) {
                audioRef.current.pause();
                setIsPaused(true);
            } else {
                audioRef.current.play();
                setIsPaused(false);
            }
            return;
        }

        try {
            setIsGenerating(true);
            const response = await generateAudio({ text: poi.longDescription });
            audioSrcRef.current = response.media;

            const newAudio = new Audio(audioSrcRef.current);
            audioRef.current = newAudio;

            newAudio.onplay = () => {
                setIsPlaying(true);
                setIsPaused(false);
            };
            newAudio.onpause = () => {
                if (newAudio.currentTime < newAudio.duration) {
                    setIsPaused(true);
                }
            };
            newAudio.onended = () => {
                cleanupAudio();
            };
            newAudio.onerror = () => {
                toast({
                    title: translations.toast.audioErrorTitle,
                    description: translations.toast.audioErrorDescription,
                    variant: "destructive"
                });
                cleanupAudio();
            };
            
            await newAudio.play();

        } catch (error) {
            console.error("Audio generation failed:", error);
            toast({
                title: translations.toast.audioErrorTitle,
                description: (error as Error).message || "Could not generate audio.",
                variant: "destructive"
            });
            cleanupAudio();
        } finally {
            setIsGenerating(false);
        }

    }, [poi.longDescription, isPlaying, isPaused, isGenerating, cleanupAudio, toast, translations]);

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
