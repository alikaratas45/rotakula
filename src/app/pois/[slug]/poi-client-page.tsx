
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
import { useRouter, useSearchParams } from 'next/navigation';

export default function PoiClientPage({ poi }: { poi: PointOfInterest }) {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!;
    const heroImage = getImageById(poi.imageId);
    const { language, translations } = useLanguage();
    const router = useRouter();
    const searchParams = useSearchParams();

    const [isPlaying, setIsPlaying] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const { toast } = useToast();

    const cleanupAudio = useCallback(() => {
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.src = '';
            audioRef.current = null;
        }
        setIsPlaying(false);
    }, []);

    const handlePlayPause = useCallback(async () => {
        if (isGenerating) return;

        if (audioRef.current && isPlaying) {
            audioRef.current.pause();
            setIsPlaying(false);
            return;
        }
        
        if (audioRef.current && !isPlaying && audioRef.current.src) {
             audioRef.current.play();
             setIsPlaying(true);
             return;
        }
        
        setIsGenerating(true);
        try {
            const response = await fetch('/api/audio', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text: poi.longDescription }),
            });

            if (!response.ok) {
                 toast({
                    title: translations.toast.audioErrorTitle,
                    description: translations.toast.audioErrorApi,
                    variant: "destructive"
                });
                throw new Error('Failed to generate audio');
            }

            const { audioDataUri } = await response.json();
            
            if (!audioDataUri) {
                toast({
                    title: translations.toast.audioErrorTitle,
                    description: translations.toast.audioErrorApi,
                    variant: "destructive"
                });
                throw new Error('No audio data received');
            }

            const player = new Audio(audioDataUri);
            audioRef.current = player;

            player.play();
            setIsPlaying(true);

            player.onended = () => setIsPlaying(false);
            player.onerror = () => {
                toast({
                    title: translations.toast.audioErrorTitle,
                    description: translations.toast.audioErrorDescription,
                    variant: "destructive"
                });
                cleanupAudio();
            };

        } catch (error) {
            console.error("Audio generation/playback error:", error);
        } finally {
            setIsGenerating(false);
        }
    }, [poi.longDescription, isPlaying, isGenerating, cleanupAudio, toast, translations, language]);

    useEffect(() => {
        if (searchParams.get('autoplay') === 'true') {
            handlePlayPause();
            // Clean up URL
            const newPath = `/pois/${poi.slug}`;
            router.replace(newPath, { scroll: false });
        }
    }, [searchParams, handlePlayPause, poi.slug, router]);


    useEffect(() => {
        return () => {
            cleanupAudio();
        };
    }, [cleanupAudio, poi]);

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
                         <p className="mt-2 text-lg text-white/90 capitalize">
                            {translations.category[poi.category as keyof typeof translations.category] || poi.category}
                         </p>
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
                                    aria-label={isPlaying ? translations.pois.pauseNarration : translations.pois.listenNarration}
                                >
                                    {isGenerating ? (
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    ) : isPlaying ? (
                                        <PauseIcon className="mr-2 h-4 w-4" />
                                    ) : (
                                        <PlayIcon className="mr-2 h-4 w-4" />
                                    )}
                                    {isGenerating ? translations.audioGuide.generating : (isPlaying ? translations.pois.pause : translations.pois.listen)}
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
