"use client";

import Image from 'next/image';
import { APIProvider } from '@vis.gl/react-google-maps';
import EmbeddedMap from '@/components/map';
import { getImageById } from '@/lib/placeholder-images';
import type { PointOfInterest } from '@/lib/types';
import { useState, useRef } from 'react';
import { textToSpeech } from '@/ai/flows/tts-flow';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { PlayIcon, PauseIcon } from '@/components/icons';

export default function PoiClientPage({ poi }: { poi: PointOfInterest }) {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!;
    const heroImage = getImageById(poi.imageId);

    const [isPlaying, setIsPlaying] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    const handlePlayPause = async () => {
        if (audioRef.current && isPlaying) {
            audioRef.current.pause();
            setIsPlaying(false);
            return;
        }

        if (audioRef.current && !isPlaying) {
            audioRef.current.play();
            setIsPlaying(true);
            return;
        }

        setIsGenerating(true);

        try {
            const { media } = await textToSpeech(poi.longDescription);
            if (media) {
                if (audioRef.current) {
                    audioRef.current.src = media;
                } else {
                    audioRef.current = new Audio(media);
                }
                audioRef.current.play();
                setIsPlaying(true);
                audioRef.current.onended = () => {
                    setIsPlaying(false);
                };
            }
        } catch (error) {
            console.error("Failed to generate audio", error);
        } finally {
            setIsGenerating(false);
        }
    };

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
                                    onClick={handlePlayPause}
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
