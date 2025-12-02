
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

function MapBoundsUpdater({ kmlPath }: { kmlPath: string | null }) {
    const map = useMap();

    useEffect(() => {
        if (!map || !kmlPath) return;

        async function updateBounds() {
            try {
                const response = await fetch(kmlPath);
                if (!response.ok) return;
                
                const kmlText = await response.text();
                const parser = new DOMParser();
                const kml = parser.parseFromString(kmlText, "application/xml");
                
                const coordsString = kml.getElementsByTagName('coordinates')[0]?.textContent;
                if (!coordsString) return;

                const coordinates = coordsString.trim().split(/\s+/).map(coord => {
                    const [lng, lat] = coord.split(',').map(Number);
                    return { lat, lng };
                });

                if (coordinates.length > 0) {
                    const bounds = new google.maps.LatLngBounds();
                    coordinates.forEach(coord => {
                        bounds.extend(coord);
                    });
                    map.fitBounds(bounds, 100);
                }

            } catch (error) {
                console.error("Error updating map bounds:", error);
            }
        }

        updateBounds();

    }, [map, kmlPath]);

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
                if (bikeRoutes.length > 0) {
                    setSelectedRoute(bikeRoutes[0]);
                }
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
                                   <MapBoundsUpdater kmlPath={selectedRoute?.kmlPath || null} />
                                </Map>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </APIProvider>
    );
}
