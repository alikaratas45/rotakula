
"use client"

import { useEffect, useState } from 'react';
import { APIProvider, Map, useMap } from "@vis.gl/react-google-maps";
import { getBikeRoutes } from '@/lib/kula-data';
import type { BikeRoute } from '@/lib/types';
import { useApp } from '@/context/app-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, DraftingCompass } from 'lucide-react';
import { cn } from '@/lib/utils';
import { KmlPolyline } from '@/components/kml-polyline';
import { UserLocationMarker } from '@/components/map';

function MapController({ selectedRoute }: { selectedRoute: BikeRoute | null }) {
    const map = useMap();

    useEffect(() => {
        if (!map || !selectedRoute) return;
        
        let center = { lat: 38.547, lng: 28.65 }; // Default Kula center
        let zoom = 13;

        if (selectedRoute.slug.includes('kula-divlit-parkuru')) {
            center = { lat: 38.557, lng: 28.661 };
            zoom = 14;
        } else if (selectedRoute.slug.includes('emre')) {
            center = { lat: 38.623, lng: 28.523 };
        } else if (selectedRoute.slug.includes('peribacalari-kula')) {
            center = { lat: 38.607, lng: 28.808 };
        } else if (selectedRoute.slug.includes('evciler')) {
            center = { lat: 38.538, lng: 28.765 };
        }

        map.panTo(center);
        map.setZoom(zoom);

    }, [map, selectedRoute]);

    return null;
}


export default function BikeRoutesPage() {
    const { language, translations } = useApp();
    const [routes, setRoutes] = useState<BikeRoute[]>([]);
    const [selectedRoute, setSelectedRoute] = useState<BikeRoute | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!;

    useEffect(() => {
        async function fetchRoutes() {
            try {
                setIsLoading(true);
                const bikeRoutes = await getBikeRoutes(language);
                setRoutes(bikeRoutes);
                // Do not select a default route anymore
                setSelectedRoute(null); 
            } catch (error) {
                console.error("Failed to fetch bike routes", error);
            } finally {
                setIsLoading(false);
            }
        }
        fetchRoutes();
    }, [language]);

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
                    <div className="flex items-center gap-4">
                         <DraftingCompass className="h-8 w-8 text-primary" />
                         <h1 className="text-3xl md:text-4xl font-headline font-bold">{translations.nav.bikeRoutes}</h1>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Routes List */}
                    <div className="lg:col-span-1 space-y-4">
                        <h2 className="text-2xl font-headline font-bold">Rotalar</h2>
                        {routes.map(route => (
                             <Card 
                                key={route.id}
                                className={cn("cursor-pointer transition-all hover:shadow-lg", selectedRoute?.id === route.id ? "ring-2 ring-primary" : "hover:bg-muted/50")}
                                onClick={() => setSelectedRoute(route)}
                            >
                                <CardHeader>
                                    <CardTitle className="font-headline">{route.name}</CardTitle>
                                    <CardDescription>{route.distance}</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-sm text-muted-foreground">{route.description}</p>
                                </CardContent>
                             </Card>
                        ))}
                    </div>

                    {/* Map Area */}
                    <div className="lg:col-span-2">
                        <div className="sticky top-24">
                             <div className="h-[60vh] w-full rounded-lg overflow-hidden relative border">
                                <Map
                                    defaultCenter={{ lat: 38.547, lng: 28.65 }}
                                    defaultZoom={11}
                                    gestureHandling={"cooperative"}
                                    disableDefaultUI={false}
                                    mapId="rotakula-bike-map"
                                >
                                   {selectedRoute && <KmlPolyline kmlPath={selectedRoute.kmlPath} />}
                                   <MapController selectedRoute={selectedRoute} />
                                   <UserLocationMarker />
                                </Map>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </APIProvider>
    );
}
