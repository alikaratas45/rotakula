"use client"

import { useEffect, useState, useRef } from 'react';
import { APIProvider, Map } from "@vis.gl/react-google-maps";
import { getWalkingRoutes, getPoisByIds } from '@/lib/kula-data';
import type { WalkingRoute, PointOfInterest } from '@/lib/types';
import { useApp } from '@/context/app-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Loader2, Footprints, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import { UserLocationMarker } from '@/components/map';
import { useIsMobile } from '@/hooks/use-mobile';
import { KmlPolyline } from '@/components/kml-polyline';
import { Separator } from '@/components/ui/separator';
import { BackButton } from '@/components/back-button';
import Image from 'next/image';
import Link from 'next/link';
import { getImageById } from '@/lib/placeholder-images';
import { Button } from '@/components/ui/button';


export default function WalkingRoutesPage() {
    const { language, translations } = useApp();
    const [routes, setRoutes] = useState<WalkingRoute[]>([]);
    const [selectedRoute, setSelectedRoute] = useState<WalkingRoute | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!;
    
    const isMobile = useIsMobile();
    const mapRef = useRef<HTMLDivElement>(null);

    const [routePois, setRoutePois] = useState<PointOfInterest[]>([]);
    const [isPoisLoading, setIsPoisLoading] = useState(false);

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
    
    const handleRouteSelection = async (route: WalkingRoute) => {
        const isDeselecting = selectedRoute?.id === route.id;
        const newSelectedRoute = isDeselecting ? null : route;
        setSelectedRoute(newSelectedRoute);

        if (newSelectedRoute && newSelectedRoute.poiIds && newSelectedRoute.poiIds.length > 0) {
            setIsPoisLoading(true);
            setRoutePois([]);
            const poisData = await getPoisByIds(newSelectedRoute.poiIds, language);
            setRoutePois(poisData);
            setIsPoisLoading(false);
        } else {
            setRoutePois([]);
        }

        if (!isDeselecting && isMobile && mapRef.current) {
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
                             <div className="h-96 w-full rounded-lg overflow-hidden relative border">
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
                            {selectedRoute?.slug === 'korez-kula-parkuru' && (
                                <div className="mt-8">
                                    <h3 className="text-xl font-headline font-bold mb-4">Wikiloc Rota Detayı</h3>
                                    <iframe 
                                        frameBorder="0" 
                                        scrolling="no" 
                                        src="https://tr.wikiloc.com/wikiloc/embedv2.do?id=248605240&elevation=off&images=off&maptype=H" 
                                        className="w-full h-[500px] rounded-lg border"
                                    ></iframe>
                                    <div style={{color:'#777', fontSize:'11px', lineHeight:'16px', marginTop: '4px'}}>
                                        Powered by&nbsp;
                                        <a style={{color:'#4C8C2B', fontSize:'11px', lineHeight:'16px'}} target="_blank" rel="noopener noreferrer" href="https://tr.wikiloc.com">
                                            Wikiloc
                                        </a>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="mt-12">
                    {isPoisLoading && (
                         <div className="flex justify-center py-8">
                            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                        </div>
                    )}
                    {!isPoisLoading && routePois.length > 0 && (
                        <div>
                            <h2 className="text-2xl font-headline font-bold mb-6">{translations.route.whatsOnThisRoute}</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {routePois.map(poi => {
                                    const image = getImageById(poi.imageId);
                                    return (
                                        <Card key={poi.id} className="flex flex-col">
                                            {image && (
                                                <div className="relative h-40 w-full">
                                                    <Image src={image.imageUrl} alt={image.description} fill className="object-cover rounded-t-lg" data-ai-hint={image.imageHint} />
                                                </div>
                                            )}
                                            <CardHeader>
                                                <CardTitle className="font-headline text-lg">{poi.name}</CardTitle>
                                                <CardDescription className="capitalize">
                                                    {translations.category[poi.category as keyof typeof translations.category] || poi.category}
                                                </CardDescription>
                                            </CardHeader>
                                            <CardContent className="flex-grow">
                                                <p className="text-sm text-muted-foreground line-clamp-3">{poi.description}</p>
                                            </CardContent>
                                            <CardFooter>
                                                <Button asChild variant="secondary" size="sm">
                                                    <Link href={`/places/${poi.slug}`}>
                                                        <Info className="mr-2 h-4 w-4" />
                                                        {translations.common.moreInfo}
                                                    </Link>
                                                </Button>
                                            </CardFooter>
                                        </Card>
                                    )
                                })}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </APIProvider>
    );
}
