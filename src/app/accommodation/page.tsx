
"use client"

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { getPois } from '@/lib/kula-data';
import type { PointOfInterest } from '@/lib/types';
import { getImageById } from '@/lib/placeholder-images';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, MapPin } from 'lucide-react';
import { BedIcon } from '@/components/icons';
import EmbeddedMap from '@/components/map';
import { APIProvider } from '@vis.gl/react-google-maps';
import { useLanguage } from '@/context/language-context';

export default function AccommodationPage() {
    const { language, translations } = useLanguage();
    const [pois, setPois] = useState<PointOfInterest[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!;

    useEffect(() => {
        async function fetchPois() {
            try {
                setIsLoading(true);
                const allPois = await getPois(language);
                const filteredPois = allPois.filter(poi => poi.category === 'accommodation');
                setPois(filteredPois);
            } catch (error) {
                console.error("Failed to fetch POIs", error);
            } finally {
                setIsLoading(false);
            }
        }
        fetchPois();
    }, [language]);

    const handleShowPoiOnMap = (poi: PointOfInterest) => {
        const query = encodeURIComponent(`${poi.name}, Kula, Manisa`);
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
                    <h1 className="text-3xl md:text-4xl font-headline font-bold">{translations.accommodation.title}</h1>
                </div>

                {pois.length > 0 && (
                    <div className="mb-12">
                        <h2 className="text-2xl font-headline font-bold mb-4">{translations.common.map}</h2>
                        <EmbeddedMap pois={pois} />
                    </div>
                )}
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {pois.map(poi => {
                        const image = getImageById(poi.imageId);
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
                                        <BedIcon className="h-6 w-6 text-accent-foreground" />
                                    </div>
                                    <div>
                                        <CardTitle className="font-headline text-xl">{poi.name}</CardTitle>
                                        <CardDescription className="capitalize">{poi.category}</CardDescription>
                                    </div>
                                </CardHeader>
                                <CardContent className="flex-grow">
                                    <p className="text-foreground/80 mb-4">{poi.description}</p>
                                </CardContent>
                                <div className="p-4 pt-0 mt-auto">
                                    <Button variant="outline" size="sm" onClick={() => handleShowPoiOnMap(poi)}>
                                        <MapPin className="mr-2 h-4 w-4" />
                                        {translations.accommodation.openInGoogleMaps}
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
