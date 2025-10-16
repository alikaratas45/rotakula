
"use client"

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { getPois } from '@/lib/kula-data';
import type { PointOfInterest } from '@/lib/types';
import { getImageById } from '@/lib/placeholder-images';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Map, MapPin } from 'lucide-react';
import { VolcanoIcon, HistoricHouseIcon, FoodIcon } from '@/components/icons';

function getCategoryIcon(category: PointOfInterest['category']) {
    switch (category) {
        case 'geopark':
        case 'nature':
            return <VolcanoIcon className="h-6 w-6 text-accent-foreground" />;
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

    const getPoiQuery = (poi: PointOfInterest) => {
        if (poi.id === 'poi-13') { // Gökçeören
            return `${poi.latitude},${poi.longitude}`;
        }
        return encodeURIComponent(poi.name);
    };
    
    const handleShowAllOnMap = () => {
        if (pois.length === 0) return;

        const origin = getPoiQuery(pois[0]);
        const destination = pois.length > 1 ? getPoiQuery(pois[pois.length - 1]) : origin;
        
        const waypoints = pois.slice(1, -1).map(getPoiQuery).join('|');
        
        let url = `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}`;
        if (waypoints) {
            url += `&waypoints=${waypoints}`;
        }

        window.open(url, '_blank');
    };

    const handleShowPoiOnMap = (poi: PointOfInterest) => {
        const query = getPoiQuery(poi);
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
        <div className="container py-8 md:py-12">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
                <h1 className="text-3xl md:text-4xl font-headline font-bold">Gezilecek Yerler</h1>
                {pois.length > 0 && (
                     <Button onClick={handleShowAllOnMap}>
                        <Map className="mr-2 h-4 w-4" />
                        Tümünü Haritada Göster
                    </Button>
                )}
            </div>
            
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
                                    <CardDescription className="capitalize">{poi.category}</CardDescription>
                                </div>
                            </CardHeader>
                            <CardContent className="flex-grow">
                                <p className="text-foreground/80 mb-4">{poi.description}</p>
                            </CardContent>
                            <div className="p-4 pt-0 mt-auto">
                                <Button variant="outline" size="sm" onClick={() => handleShowPoiOnMap(poi)}>
                                    <MapPin className="mr-2 h-4 w-4" />
                                    Haritada Göster
                                </Button>
                            </div>
                        </Card>
                    );
                })}
            </div>
        </div>
    );
}
