
"use client"

import { useEffect, useState, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { getPois } from '@/lib/kula-data';
import type { PointOfInterest } from '@/lib/types';
import { getImageById } from '@/lib/placeholder-images';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, MapPin, Mountain, Info } from 'lucide-react';
import { HistoricHouseIcon, FoodIcon, PlayIcon, PauseIcon } from '@/components/icons';
import EmbeddedMap from '@/components/map';
import { APIProvider } from '@vis.gl/react-google-maps';
import { textToSpeech } from '@/ai/flows/tts-flow';

function getCategoryIcon(category: PointOfInterest['category']) {
    switch (category) {
        case 'geopark':
        case 'nature':
            return <Mountain className="h-6 w-6 text-accent-foreground" />;
        case 'history':
            return <HistoricHouseIcon className="h-6 w-6 text-accent-foreground" />;
        case 'food':
            return <FoodIcon className="h-6 w-6 text-accent-foreground" />;
        default:
            return <MapPin className="h-6 w-6 text-accent-foreground" />;
    }
}


export default function PoisPage() {
    const [pois, setPois] = useState<PointOfInterest[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [nowPlaying, setNowPlaying] = useState<string | null>(null);
    const [isGenerating, setIsGenerating] = useState<string | null>(null);
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!;

    useEffect(() => {
        async function fetchPois() {
            try {
                const allPois = await getPois();
                const filteredPois = allPois.filter(poi => poi.category !== 'food' && poi.category !== 'accommodation');
                setPois(filteredPois);
            } catch (error) {
                console.error("Failed to fetch POIs", error);
            } finally {
                setIsLoading(false);
            }
        }
        fetchPois();
    }, []);

    const handlePlayPause = async (poi: PointOfInterest) => {
        if (audioRef.current && nowPlaying === poi.id) {
            audioRef.current.pause();
            setNowPlaying(null);
            return;
        }

        if (audioRef.current && nowPlaying) {
             audioRef.current.pause();
        }

        setIsGenerating(poi.id);
        setNowPlaying(null);

        try {
            const { media } = await textToSpeech(poi.longDescription);
            if (media) {
                if (audioRef.current) {
                    audioRef.current.src = media;
                } else {
                    audioRef.current = new Audio(media);
                }
                 audioRef.current.play();
                 setNowPlaying(poi.id);
                 audioRef.current.onended = () => {
                     setNowPlaying(null);
                 };
            }
        } catch (error) {
            console.error("Failed to generate audio", error);
        } finally {
            setIsGenerating(null);
        }
    };


    const handleShowPoiOnMap = (poi: PointOfInterest) => {
        const query = poi.id === 'poi-13' 
            ? `${poi.latitude},${poi.longitude}` 
            : encodeURIComponent(`${poi.name}, Kula, Manisa`);
        const url = `https://www.google.com/maps/search/?api=1&query=${query}`;
        window.open(url, '_blank');
    };

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }
    
    return (
        <APIProvider apiKey={apiKey}>
            <div className="container py-8 md:py-12">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
                    <h1 className="text-3xl md:text-4xl font-headline font-bold">Gezilecek Yerler</h1>
                </div>

                {pois.length > 0 && (
                    <div className="mb-12">
                        <h2 className="text-2xl font-headline font-bold mb-4">Harita</h2>
                        <EmbeddedMap pois={pois} />
                    </div>
                )}
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {pois.map(poi => {
                        const image = getImageById(poi.imageId);
                        const isPlaying = nowPlaying === poi.id;
                        const isGeneratingAudio = isGenerating === poi.id;

                        return (
                            <Card key={poi.id} className="flex flex-col overflow-hidden">
                                <div className="relative h-48 w-full">
                                    {image && (
                                        <Image
                                            src={image.imageUrl}
                                            alt={image.description}
                                            fill
                                            className="object-cover"
                                            data-ai-hint={image.imageHint}
                                        />
                                    )}
                                </div>
                                <CardHeader className="flex flex-row items-start gap-4">
                                    <div className="flex-shrink-0 bg-accent rounded-full p-3">
                                        {getCategoryIcon(poi.category)}
                                    </div>
                                    <div>
                                        <CardTitle className="font-headline text-xl">{poi.name}</CardTitle>
                                        <CardDescription className="capitalize">{poi.category}</CardDescription>
                                    </div>
                                </CardHeader>
                                <CardContent className="flex-grow">
                                    <p className="text-foreground/80 mb-4">{poi.description}</p>
                                </CardContent>
                                <div className="p-4 pt-0 mt-auto flex items-center gap-2">
                                     <Button asChild variant="secondary" size="sm">
                                        <Link href={`/pois/${poi.slug}`}>
                                            <Info className="mr-2 h-4 w-4" />
                                            Daha Fazla Bilgi
                                        </Link>
                                    </Button>
                                    <Button
                                            variant="outline"
                                            size="icon"
                                            onClick={() => handlePlayPause(poi)}
                                            disabled={isGeneratingAudio}
                                            aria-label={isPlaying ? "Anlatımı durdur" : "Anlatımı dinle"}
                                        >
                                            {isGeneratingAudio ? (
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                            ) : isPlaying ? (
                                                <PauseIcon className="h-4 w-4" />
                                            ) : (
                                                <PlayIcon className="h-4 w-4" />
                                            )}
                                        </Button>
                                </div>
                            </Card>
                        );
                    })}
                </div>
            </div>
        </APIProvider>
    );
}
