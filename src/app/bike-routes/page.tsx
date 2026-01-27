"use client"

import { useEffect, useState, useRef } from 'react';
import { APIProvider, Map } from "@vis.gl/react-google-maps";
import { getBikeRoutes } from '@/lib/kula-data';
import type { BikeRoute } from '@/lib/types';
import { useApp } from '@/context/app-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Bike } from 'lucide-react';
import { cn } from '@/lib/utils';
import { UserLocationMarker } from '@/components/map';
import { useIsMobile } from '@/hooks/use-mobile';
import { KmlPolyline } from '@/components/kml-polyline';
import { BackButton } from '@/components/back-button';


export default function BikeRoutesPage() {
    const { language, translations } = useApp();
    const [routes, setRoutes] = useState<BikeRoute[]>([]);
    const [selectedRoute, setSelectedRoute] = useState<BikeRoute | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!;
    
    const isMobile = useIsMobile();
    const mapRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        async function fetchRoutes() {
            try {
                setIsLoading(true);
                const bikeRoutes = await getBikeRoutes(language);
                setRoutes(bikeRoutes);
                setSelectedRoute(null); 
            } catch (error) {
                console.error("Failed to fetch bike routes", error);
            } finally {
                setIsLoading(false);
            }
        }
        fetchRoutes();
    }, [language]);
    
    const handleRouteSelection = (route: BikeRoute) => {
        setSelectedRoute(prevRoute => (prevRoute?.id === route.id ? null : route));
        if (isMobile && mapRef.current) {
            mapRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
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
                <BackButton className="mb-8" />
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
                    <div className="flex items-center gap-4">
                         <Bike className="h-8 w-8 text-primary" />
                         <h1 className="text-3xl md:text-4xl font-headline font-bold">{translations.nav.bikeRoutes}</h1>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Routes List */}
                    <div className="lg:col-span-1 space-y-4">
                        <h2 className="text-2xl font-headline font-bold">{translations.route.routes}</h2>
                        {routes.map(route => (
                             <Card 
                                key={route.id}
                                className={cn("cursor-pointer transition-all hover:shadow-lg", selectedRoute?.id === route.id ? "ring-2 ring-primary" : "hover:bg-muted/50")}
                                onClick={() => handleRouteSelection(route)}
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
                    <div ref={mapRef} className="lg:col-span-2">
                        <div className="sticky top-24">
                             <div className="h-96 w-full rounded-lg overflow-hidden relative border">
                                <Map
                                    defaultCenter={{ lat: 38.547, lng: 28.65 }}
                                    defaultZoom={11}
                                    gestureHandling={"cooperative"}
                                    disableDefaultUI={false}
                                    mapId="rotakula-bike-map"
                                >
                                   <KmlPolyline kmlPath={selectedRoute?.kmlPath ?? null} />
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
