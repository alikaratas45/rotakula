"use client";

import Image from 'next/image';
import { APIProvider } from '@vis.gl/react-google-maps';
import EmbeddedMap from '@/components/map';
import { getImageById } from '@/lib/placeholder-images';
import type { PointOfInterest, TtsOutput } from '@/lib/types';
import { useState, useRef, useCallback, useEffect } from 'react';
import { textToSpeech } from '@/ai/flows/tts-flow';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { PlayIcon, PauseIcon } from '@/components/icons';
import { useToast } from '@/hooks/use-toast';


export default function PoiClientPage({ poi }: { poi: PointOfInterest }) {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!;
    const heroImage = getImageById(poi.imageId);

    const [isPlaying, setIsPlaying] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const { toast } = useToast();

    const cleanup = useCallback(() => {
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.onended = null;
            audioRef.current.onerror = null;
            audioRef.current = null;
        }
        setIsPlaying(false);
        setIsGenerating(false);
    }, []);

    useEffect(() => {
      // Cleanup on component unmount
      return () => {
        cleanup();
      };
    }, [cleanup]);

    const handlePlayPause = useCallback(async () => {
        if (isGenerating) return;

        // If audio is playing, pause it.
        if (isPlaying && audioRef.current) {
            audioRef.current.pause();
            setIsPlaying(false);
            return;
        }

        // If audio is paused, resume it.
        if (!isPlaying && audioRef.current) {
            audioRef.current.play();
            setIsPlaying(true);
            return;
        }
        
        // If no audio is loaded, generate and play it.
        setIsGenerating(true);

        try {
            const { media }: TtsOutput = await textToSpeech(poi.longDescription);

            if (media) {
                const newAudio = new Audio(media);
                audioRef.current = newAudio;
                
                newAudio.onplaying = () => {
                    setIsGenerating(false);
                    setIsPlaying(true);
                };
                
                newAudio.onpause = () => {
                    // This handles both manual pause and end-of-track pause
                    if (audioRef.current?.ended) {
                        cleanup();
                    } else {
                        setIsPlaying(false);
                    }
                };

                newAudio.onended = () => {
                   cleanup();
                };

                newAudio.onerror = () => {
                    toast({
                        title: "Ses Hatası",
                        description: "Ses dosyası çalınırken bir hata oluştu.",
                        variant: "destructive"
                    });
                    cleanup();
                };

                newAudio.play();
            } else {
                 throw new Error("No media received from the server.");
            }

        } catch (error: any) {
            console.error("Failed to stream or play audio", error);
            toast({
                title: "Ses Hatası",
                description: "Sesli anlatım oluşturulurken bir hata oluştu.",
                variant: "destructive"
            });
            cleanup();
        }
    }, [poi.longDescription, isPlaying, isGenerating, cleanup, toast]);

     const handleStop = useCallback(() => {
        cleanup();
    }, [cleanup]);

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
                                <h2 className="text-2xl font-headline font-bold">Detaylı Bilgi</h2>
                                <Button
                                    variant="outline"
                                    onClick={isPlaying ? handleStop : handlePlayPause}
                                    disabled={isGenerating}
                                    aria-label={isPlaying ? "Anlatımı durdur" : "Anlatımı dinle"}
                                >
                                    {isGenerating ? (
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    ) : isPlaying ? (
                                        <PauseIcon className="mr-2 h-4 w-4" />
                                    ) : (
                                        <PlayIcon className="mr-2 h-4 w-4" />
                                    )}
                                    {isGenerating ? 'Hazırlanıyor...' : isPlaying ? 'Durdur' : 'Sesli Dinle'}
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
                                    <h2 className="text-2xl font-headline font-bold mb-4">Harita</h2>
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
