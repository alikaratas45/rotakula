
"use client"

import { useEffect, useState, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { getPois } from '@/lib/kula-data';
import type { PointOfInterest } from '@/lib/types';
import { getImageById } from '@/lib/placeholder-images';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, MapPin, Mountain, Info, Navigation } from 'lucide-react';
import { HistoricHouseIcon, FoodIcon, BedIcon } from '@/components/icons';
import EmbeddedMap from '@/components/map';
import { APIProvider } from '@vis.gl/react-google-maps';
import { useApp } from '@/context/app-context';

const customPoiOrder = [
    'poi-30', // Ahşap köprüler
    'poi-2',  // Peri Bacaları
    'poi-3',  // Çakırca Bazalt Sütunları
    'poi-4',  // tarihi kula evleri
    'poi-1',  // sandal divlit volkan konisi
    'poi-18', // jeopark ziyaretçi merkezi
];

const neighborhoodSlugs = [
    'encekler-village',
    'sandal-village',
    'gokceoren-village',
    'incesu-village',
    'korez-village',
    'emre-village',
    'evciler-village',
    'yurtbasi-tabala-village',
];


function getCategoryIcon(category: PointOfInterest['category']) {
    switch (category) {
        case 'geopark':
        case 'nature':
            return <Mountain className="h-6 w-6 text-accent-foreground" />;
        case 'history':
            return <HistoricHouseIcon className="h-6 w-6 text-accent-foreground" />;
        case 'food':
            return <FoodIcon className="h-6 w-6 text-accent-foreground" />;
        case 'accommodation':
            return <BedIcon className="h-6 w-6 text-accent-foreground" />;
        default:
            return <MapPin className="h-6 w-6 text-accent-foreground" />;
    }
}


export default function PlacesPage() {
    const { language, translations } = useApp();
    const [pois, setPois] = useState<PointOfInterest[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!;

    useEffect(() => {
        async function fetchPois() {
            try {
                setIsLoading(true);
                const allPois = await getPois(language);
                
                const sortedPois = allPois.sort((a, b) => {
                    const aIndex = customPoiOrder.indexOf(a.id);
                    const bIndex = customPoiOrder.indexOf(b.id);
                    const aIsNeighborhood = neighborhoodSlugs.includes(a.slug);
                    const bIsNeighborhood = neighborhoodSlugs.includes(b.slug);
                    const aIsBelediye = a.slug === 'kula-belediyesi';
                    const bIsBelediye = b.slug === 'kula-belediyesi';

                    if (aIsBelediye) return 1;
                    if (bIsBelediye) return -1;

                    if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex;
                    if (aIndex !== -1) return -1;
                    if (bIndex !== -1) return 1;

                    if (aIsNeighborhood && !bIsNeighborhood) return 1;
                    if (!aIsNeighborhood && bIsNeighborhood) return -1;

                    return a.name.localeCompare(b.name, language);
                });

                setPois(sortedPois);
            } catch (error) {
                console.error("Failed to fetch POIs", error);
            } finally {
                setIsLoading(false);
            }
        }
        fetchPois();
    }, [language]);

    const handleGetDirections = (poi: PointOfInterest) => {
        const url = `https://www.google.com/maps/dir/?api=1&destination=${poi.latitude},${poi.longitude}`;
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
            <div className="container px-4 py-8 md:py-12">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
                    <h1 className="text-3xl md:text-4xl font-headline font-bold">{translations.nav.places}</h1>
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
                                        {getCategoryIcon(poi.category)}
                                    </div>
                                    <div>
                                        <CardTitle className="font-headline text-xl">{poi.name}</CardTitle>
                                        <CardDescription className="capitalize">
                                            {translations.category[poi.category as keyof typeof translations.category] || poi.category}
                                        </CardDescription>
                                    </div>
                                </CardHeader>
                                <CardContent className="flex-grow">
                                    <p className="text-foreground/80 mb-4">{poi.description}</p>
                                </CardContent>
                                <div className="p-4 pt-0 mt-auto flex items-center gap-2">
                                     <Button asChild variant="secondary" size="sm">
                                        <Link href={`/places/${poi.slug}`}>
                                            <Info className="mr-2 h-4 w-4" />
                                            {translations.common.moreInfo}
                                        </Link>
                                    </Button>
                                    <Button variant="outline" size="sm" onClick={() => handleGetDirections(poi)}>
                                        <Navigation className="mr-2 h-4 w-4" />
                                        {translations.map.getDirections}
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
