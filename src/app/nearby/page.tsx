
"use client"

import { useEffect, useState, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { getPois } from '@/lib/kula-data';
import type { PointOfInterest } from '@/lib/types';
import { getImageById } from '@/lib/placeholder-images';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, MapPin, Mountain, Info, Compass, Navigation, LocateFixed, ShieldAlert } from 'lucide-react';
import { HistoricHouseIcon, FoodIcon, BedIcon } from '@/components/icons';
import EmbeddedMap from '@/components/map';
import { APIProvider } from '@vis.gl/react-google-maps';
import { useApp } from '@/context/app-context';
import { haversineDistance } from '@/lib/utils';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { BackButton } from '@/components/back-button';

const NEARBY_RADIUS_KM = 5;

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
    const { language, translations } = useApp();
    const [nearbyPois, setNearbyPois] = useState<PoiWithDistance[]>([]);
    const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
    const [status, setStatus] = useState<'idle' | 'loading' | 'error' | 'success' | 'no_results'>('idle');
    const [error, setError] = useState<string | null>(null);
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!;

    const requestLocation = useCallback(async () => {
        setStatus('loading');
        setError(null);

        if (!navigator.geolocation) {
            setError(translations.map.locationError);
            setStatus('error');
            return;
        }

        try {
            const position = await new Promise<GeolocationPosition>((resolve, reject) => {
                // PC'lerde ve bazı ağlarda enableHighAccuracy:true hata verebilir veya çok yavaş olabilir.
                // Önce daha hızlı sonuç almak için toleranslı bir istek yapıyoruz.
                navigator.geolocation.getCurrentPosition(resolve, reject, {
                    enableHighAccuracy: false, // PC uyumluluğu için false
                    timeout: 20000, // 20 saniye (PC ağ tabanlı konum için daha güvenli)
                    maximumAge: 60000, // 1 dakikalık eski konumu kabul et (hız için)
                });
            });

            const currentLocation = {
                lat: position.coords.latitude,
                lng: position.coords.longitude,
            };
            setUserLocation(currentLocation);

            const allPois = await getPois(language);
            const poisWithDistances: PoiWithDistance[] = allPois.map(poi => ({
                ...poi,
                distance: haversineDistance(
                    { lat: currentLocation.lat, lon: currentLocation.lng },
                    { lat: poi.latitude, lon: poi.longitude }
                ),
            })).filter(poi => poi.distance <= NEARBY_RADIUS_KM);

            poisWithDistances.sort((a, b) => a.distance - b.distance);
            
            setNearbyPois(poisWithDistances);
            setStatus(poisWithDistances.length > 0 ? 'success' : 'no_results');

        } catch (err: any) {
            console.error("Geolocation error:", err);
            let errorMessage = translations.map.locationError;
            if (err.code === 1) { // PERMISSION_DENIED
                errorMessage = translations.nearby.permissionDenied;
            } else if (err.code === 2) { // POSITION_UNAVAILABLE
                errorMessage = translations.nearby.positionUnavailable;
            } else if (err.code === 3) { // TIMEOUT
                errorMessage = translations.nearby.timeout;
            }
            setError(errorMessage);
            setStatus('error');
        }
    }, [language, translations]);
    
    const poisForMap = userLocation ? nearbyPois : [];

    const handleGetDirections = (poi: PointOfInterest) => {
        const url = `https://www.google.com/maps/dir/?api=1&destination=${poi.latitude},${poi.longitude}`;
        window.open(url, '_blank');
    };

    const renderContent = () => {
        switch (status) {
            case 'idle':
                return (
                    <div className="text-center py-16 border-2 border-dashed rounded-lg flex flex-col items-center gap-4">
                        <LocateFixed className="h-10 w-10 text-muted-foreground" />
                        <h2 className="text-xl font-semibold text-muted-foreground">{translations.nearby.discoverTitle}</h2>
                        <p className="text-muted-foreground max-w-md">{translations.nearby.discoverDescription}</p>
                        <Button onClick={requestLocation}>
                            <MapPin className="mr-2 h-4 w-4" />
                            {translations.nearby.findButton}
                        </Button>
                    </div>
                );
            case 'loading':
                return (
                    <div className="flex flex-col justify-center items-center h-64 text-center">
                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mb-4" />
                        <p className="text-lg text-muted-foreground">{translations.nearby.gettingLocation}</p>
                    </div>
                );
            case 'error':
                 return (
                    <Alert variant="destructive" className="mt-6">
                        <ShieldAlert className="h-4 w-4" />
                        <AlertTitle>{translations.toast.errorTitle}</AlertTitle>
                        <AlertDescription className="flex items-center justify-between">
                           <span className="mr-4">{error}</span>
                           <Button variant="secondary" size="sm" onClick={requestLocation}>{translations.nearby.tryAgain}</Button>
                        </AlertDescription>
                    </Alert>
                );
            case 'no_results':
                return (
                    <div className="text-center py-16 border-2 border-dashed rounded-lg">
                        <h2 className="text-xl font-semibold text-muted-foreground">{translations.nearby.noPoisFound.replace('{radius}', NEARBY_RADIUS_KM.toString())}</h2>
                         <p className="text-muted-foreground mt-2 mb-4">{translations.nearby.noResults}</p>
                        <Button asChild>
                          <Link href="/places">{translations.nav.places}</Link>
                        </Button>
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
                <BackButton className="mb-4" />
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4">
                    <h1 className="text-3xl md:text-4xl font-headline font-bold">{translations.nearby.title}</h1>
                </div>
                <p className="text-muted-foreground mb-8">{translations.nearby.description.replace('{radius}', NEARBY_RADIUS_KM.toString())}</p>

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
