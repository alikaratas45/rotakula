
"use client"

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { getPois } from '@/lib/kula-data';
import type { PointOfInterest } from '@/lib/types';
import { getImageById } from '@/lib/placeholder-images';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, MapPin, Mountain, Info, Compass, Navigation } from 'lucide-react';
import { HistoricHouseIcon, FoodIcon, BedIcon } from '@/components/icons';
import EmbeddedMap from '@/components/map';
import { APIProvider } from '@vis.gl/react-google-maps';
import { useLanguage } from '@/context/language-context';
import { haversineDistance } from '@/lib/utils';

const NEARBY_RADIUS_KM = 10;

type PoiWithDistance = PointOfInterest & { distance: number };

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

export default function NearbyPage() {
    const { language, translations } = useLanguage();
    const [nearbyPois, setNearbyPois] = useState<PoiWithDistance[]>([]);
    const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
    const [status, setStatus] = useState<'loading' | 'error' | 'success' | 'no_results'>('loading');
    const [error, setError] = useState<string | null>(null);
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!;

    useEffect(() => {
        if (!navigator.geolocation) {
            setError(translations.map.locationError);
            setStatus('error');
            return;
        }

        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const currentLocation = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude,
                };
                setUserLocation(currentLocation);

                try {
                    const allPois = await getPois(language);
                    const poisWithDistances: PoiWithDistance[] = allPois.map(poi => {
                        const distance = haversineDistance(
                            { lat: currentLocation.lat, lon: currentLocation.lng },
                            { lat: poi.latitude, lon: poi.longitude }
                        ) / 1000; // convert to km
                        return { ...poi, distance };
                    }).filter(poi => poi.distance <= NEARBY_RADIUS_KM);

                    poisWithDistances.sort((a, b) => a.distance - b.distance);
                    
                    setNearbyPois(poisWithDistances);
                    setStatus(poisWithDistances.length > 0 ? 'success' : 'no_results');

                } catch (fetchError) {
                    setError('Failed to fetch points of interest.');
                    setStatus('error');
                }
            },
            () => {
                setError(translations.nearby.locationError);
                setStatus('error');
            },
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
        );
    }, [language, translations]);
    
    const poisForMap = userLocation ? nearbyPois : [];

    const handleGetDirections = (poi: PointOfInterest) => {
        const url = `https://www.google.com/maps/dir/?api=1&destination=${poi.latitude},${poi.longitude}`;
        window.open(url, '_blank');
    };

    const renderContent = () => {
        switch (status) {
            case 'loading':
                return (
                    <div className="flex flex-col justify-center items-center h-64 text-center">
                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mb-4" />
                        <p className="text-lg text-muted-foreground">{translations.nearby.gettingLocation}</p>
                    </div>
                );
            case 'error':
                 return (
                    <div className="text-center py-16 border-2 border-dashed border-destructive/50 rounded-lg bg-destructive/10">
                        <h2 className="text-xl font-semibold text-destructive">{translations.toast.errorTitle}</h2>
                        <p className="text-destructive/80 mt-2">{error}</p>
                    </div>
                );
            case 'no_results':
                return (
                    <div className="text-center py-16 border-2 border-dashed rounded-lg">
                        <h2 className="text-xl font-semibold text-muted-foreground">{translations.nearby.noPoisFound}</h2>
                    </div>
                );
            case 'success':
                return (
                     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {nearbyPois.map(poi => {
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
                                        <div className="absolute top-2 right-2 flex items-center gap-1 rounded-full bg-background/80 backdrop-blur-sm px-2 py-1 text-xs font-semibold">
                                            <Compass className="h-3 w-3" />
                                            <span>{poi.distance.toFixed(1)} km</span>
                                        </div>
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
                                        <p className="text-foreground/80 mb-4 line-clamp-3">{poi.description}</p>
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
                );
        }
    }

    return (
        <APIProvider apiKey={apiKey}>
            <div className="container px-4 py-8 md:py-12">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4">
                    <h1 className="text-3xl md:text-4xl font-headline font-bold">{translations.nearby.title}</h1>
                </div>
                <p className="text-muted-foreground mb-8">{translations.nearby.description}</p>

                {poisForMap.length > 0 && (
                    <div className="mb-12">
                        <h2 className="text-2xl font-headline font-bold mb-4">{translations.common.map}</h2>
                        <EmbeddedMap pois={poisForMap} />
                    </div>
                )}
                
                {renderContent()}
            </div>
        </APIProvider>
    );
}
