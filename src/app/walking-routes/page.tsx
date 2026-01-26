"use client"

import { useEffect, useState, useRef } from 'react';
import { APIProvider, Map } from "@vis.gl/react-google-maps";
import { getWalkingRoutes } from '@/lib/kula-data';
import type { WalkingRoute } from '@/lib/types';
import { useApp } from '@/context/app-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Footprints } from 'lucide-react';
import { cn } from '@/lib/utils';
import { UserLocationMarker } from '@/components/map';
import { useIsMobile } from '@/hooks/use-mobile';
import { KmlPolyline } from '@/components/kml-polyline';
import { Separator } from '@/components/ui/separator';
import { BackButton } from '@/components/back-button';


export default function WalkingRoutesPage() {
    const { language, translations } = useApp();
    const [routes, setRoutes] = useState<WalkingRoute[]>([]);
    const [selectedRoute, setSelectedRoute] = useState<WalkingRoute | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!;
    
    const isMobile = useIsMobile();
    const mapRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        async function fetchRoutes() {
            try {
                setIsLoading(true);
                const walkingRoutes = await getWalkingRoutes(language);
                setRoutes(walkingRoutes);
                setSelectedRoute(null); 
            } catch (error) {
                console.error("Failed to fetch walking routes", error);
            } finally {
                setIsLoading(false);
            }
        }
        fetchRoutes();
    }, [language]);
    
    const handleRouteSelection = (route: WalkingRoute) => {
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
                         <Footprints className="h-8 w-8 text-primary" />
                         <h1 className="text-3xl md:text-4xl font-headline font-bold">{translations.nav.walkingRoutes}</h1>
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
                                    {route.difficulty && (
                                        <>
                                            <Separator className="my-4" />
                                            <h4 className="text-md font-semibold mb-3">{translations.route.statsTitle}</h4>
                                            <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                                                <div>
                                                    <p className="text-muted-foreground">{translations.route.distanceLabel}</p>
                                                    <p className="font-semibold">{route.distance}</p>
                                                </div>
                                                <div>
                                                    <p className="text-muted-foreground">{translations.route.elevationGainLabel}</p>
                                                    <p className="font-semibold">{route.elevationGain}</p>
                                                </div>
                                                <div>
                                                    <p className="text-muted-foreground">{translations.route.difficultyLabel}</p>
                                                    <p className="font-semibold">{route.difficulty}</p>
                                                </div>
                                                <div>
                                                    <p className="text-muted-foreground">{translations.route.elevationLossLabel}</p>
                                                    <p className="font-semibold">{route.elevationLoss}</p>
                                                </div>
                                                <div>
                                                    <p className="text-muted-foreground">{translations.route.maxElevationLabel}</p>
                                                    <p className="font-semibold">{route.maxElevation}</p>
                                                </div>
                                                <div>
                                                    <p className="text-muted-foreground">{translations.route.minElevationLabel}</p>
                                                    <p className="font-semibold">{route.minElevation}</p>
                                                </div>
                                                 <div>
                                                    <p className="text-muted-foreground">{translations.route.trailRankLabel}</p>
                                                    <p className="font-semibold">{route.trailRank}</p>
                                                </div>
                                                <div>
                                                    <p className="text-muted-foreground">{translations.route.trackTypeLabel}</p>
                                                    <p className="font-semibold">{route.trackType}</p>
                                                </div>
                                            </div>
                                        </>
                                    )}
                                </CardContent>
                             </Card>
                        ))}
                    </div>

                    {/* Map Area */}
                    <div ref={mapRef} className="lg:col-span-2">
                        <div className="sticky top-24">
                             <div className="h-[60vh] w-full rounded-lg overflow-hidden relative border">
                                <Map
                                    defaultCenter={{ lat: 38.547, lng: 28.65 }}
                                    defaultZoom={11}
                                    gestureHandling={"cooperative"}
                                    disableDefaultUI={false}
                                    mapId="rotakula-walking-map"
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
