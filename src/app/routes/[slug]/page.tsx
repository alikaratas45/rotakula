"use client"

import { getRouteBySlug, getPoisByIds } from '@/lib/kula-data';
import { notFound, useParams } from 'next/navigation';
import { getImageById } from '@/lib/placeholder-images';
import Image from 'next/image';
import type { ThematicRoute, PointOfInterest } from '@/lib/types';
import { useApp } from '@/context/app-context';
import { useEffect, useState } from 'react';
import { Loader2, MapPin, Mountain, Info, Footprints, Car, UtensilsCrossed, Navigation } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { FoodIcon, HistoricHouseIcon } from '@/components/icons';
import { Separator } from '@/components/ui/separator';
import EmbeddedMap from '@/components/map';
import { APIProvider } from '@vis.gl/react-google-maps';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { BackButton } from '@/components/back-button';

function getCategoryIcon(category: PointOfInterest['category']) {
    switch (category) {
        case 'geopark':
        case 'nature':
            return <Mountain className="h-6 w-6 text-accent-foreground" />;
        case 'history':
            return <HistoricHouseIcon className="h-6 w-6 text-accent-foreground" />;
        case 'food':
            return <FoodIcon className="h-6 w-6 text-accent-foreground" />;
        default:
            return <MapPin className="h-6 w-6 text-accent-foreground" />;
    }
}

export default function RoutePage() {
    const params = useParams();
    const slug = Array.isArray(params.slug) ? params.slug[0] : params.slug;
    const { language, translations } = useApp();
    const { toast } = useToast();
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!;
    
    const [route, setRoute] = useState<ThematicRoute | null>(null);
    const [pois, setPois] = useState<PointOfInterest[]>([]);
    const [loading, setLoading] = useState(true);
    const [isStartingRoute, setIsStartingRoute] = useState(false);

    useEffect(() => {
        if (!slug) return;
        setRoute(null);
        setPois([]);
        async function fetchRouteData() {
            setLoading(true);
            const routeData = await getRouteBySlug(slug as string, language);
            if (routeData) {
                setRoute(routeData);
                if (routeData.poiIds.length > 0) {
                    const poisData = await getPoisByIds(routeData.poiIds, language);
                    setPois(poisData);
                }
            } else {
                setRoute(null);
                setPois([]);
            }
            setLoading(false);
        }
        fetchRouteData();
    }, [slug, language]);

    const handleFlavorTourClick = () => {
        const query = encodeURIComponent('Kula\'daki lokanta ve restoranlar');
        const url = `https://www.google.com/maps/search/?api=1&query=${query}`;
        window.open(url, '_blank');
    };

    const handleGetDirections = (poi: PointOfInterest) => {
        const url = `https://www.google.com/maps/dir/?api=1&destination=${poi.latitude},${poi.longitude}`;
        window.open(url, '_blank');
    };

    const handleStartRoute = (travelMode: 'driving' | 'walking') => {
        if (!pois || pois.length < 1) {
             toast({
                title: translations.toast.errorTitle,
                description: translations.route.noStopsFound,
                variant: 'destructive',
            });
            return;
        }

        if (!navigator.geolocation) {
            toast({
                title: translations.toast.locationErrorTitle,
                description: translations.map.locationError,
                variant: 'destructive',
            });
            return;
        }
        
        setIsStartingRoute(true);

        const destination = `${pois[pois.length - 1].latitude},${pois[pois.length - 1].longitude}`;
        const waypoints = pois
            .slice(0, pois.length - 1)
            .map(p => `${p.latitude},${p.longitude}`)
            .join('|');

        const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${destination}&waypoints=${waypoints}&travelmode=${travelMode}`;
        
        window.open(googleMapsUrl, '_blank');
        setIsStartingRoute(false);
    };

    const heroImage = route ? getImageById(route.imageId) : null;
    
    if (loading) {
        return (
             <div className="flex justify-center items-center h-screen">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    if (!route) {
        notFound();
    }
    
    const isFlavorTour = route.slug === 'kula-flavor-tour';
    const isDrivingRoute = route.slug === 'geopark-discovery-route';
    const isHistoricKulaWalkingTour = route.slug === 'historic-kula-walking-tour';

    return (
        <div>
            <section className="relative h-[40vh] md:h-[50vh] w-full flex items-end text-white">
                {heroImage && (
                    <Image
                        src={heroImage.imageUrl}
                        alt={heroImage.description}
                        fill
                        priority
                        className="object-cover"
                        data-ai-hint={heroImage.imageHint}
                    />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                <div className="relative z-10 container px-4 py-8">
                    <h1 className="font-headline text-4xl md:text-5xl font-bold tracking-tight drop-shadow-lg">
                        {route.title}
                    </h1>
                </div>
            </section>
            
            <div className="container px-4 py-8 md:py-12">
                <BackButton className="mb-8" />
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12">
                    <div className="lg:col-span-2">
                        <div className="prose prose-lg max-w-none text-foreground/90 mb-8">
                            {route.longDescription.split('\\n\\n').map((paragraph, index) => {
                                const trimmed = paragraph.trim();
                                return trimmed ? <p key={index}>{trimmed.replace(/\\n/g, ' ')}</p> : null;
                            })}
                        </div>
                        {isFlavorTour ? null : (
                            <>
                                {pois.length > 0 && (
                                     <div className="mb-8">
                                        <h2 className="text-2xl font-headline font-bold mb-4">{translations.route.mapTitle}</h2>
                                        <APIProvider apiKey={apiKey} libraries={['places']}>
                                            <EmbeddedMap
                                                pois={pois}
                                                drawRouteLine
                                                routeTravelMode={isHistoricKulaWalkingTour ? "WALKING" : "DRIVING"}
                                            />
                                        </APIProvider>
                                    </div>
                                )}
                                <h2 className="text-2xl font-headline font-bold mb-6">{translations.route.whatsOnThisRoute}</h2>
                                <div className="space-y-6">
                                    {pois.map((poi, index) => {
                                        const image = getImageById(poi.imageId);
                                        return (
                                            <Card key={poi.id} className="overflow-hidden">
                                                <div className="flex flex-col md:flex-row">
                                                    <div className="md:w-1/3 relative h-48 md:h-auto">
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
                                                    <div className="md:w-2/3">
                                                        <CardHeader className="flex flex-row items-start gap-4">
                                                            <div className="flex-shrink-0 bg-accent rounded-full p-3">
                                                                {getCategoryIcon(poi.category)}
                                                            </div>
                                                            <div>
                                                                <CardTitle className="font-headline text-xl">{index + 1}. {poi.name}</CardTitle>
                                                                <CardDescription className="capitalize">
                                                                    {translations.category[poi.category as keyof typeof translations.category] || poi.category}
                                                                </CardDescription>
                                                            </div>
                                                        </CardHeader>
                                                        <CardContent>
                                                            <p className="text-foreground/80 mb-4">{poi.description}</p>
                                                            <div className="flex items-center gap-2">
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
                                                        </CardContent>
                                                    </div>
                                                </div>
                                            </Card>
                                        );
                                    })}
                                </div>
                            </>
                        )}
                    </div>

                    <aside className="lg:col-span-1">
                        <div className="sticky top-24">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="font-headline text-xl">{translations.route.routeInfo}</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    {isFlavorTour ? (
                                        <Button
                                            onClick={handleFlavorTourClick}
                                            className="w-full"
                                        >
                                            <UtensilsCrossed className="mr-2 h-4 w-4" />
                                            {translations.food.nearbyRestaurants}
                                        </Button>
                                    ) : (
                                        <AlertDialog>
                                            <AlertDialogTrigger asChild>
                                                <Button className="w-full" disabled={isStartingRoute}>
                                                    {isStartingRoute ? (
                                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                    ) : (
                                                        isDrivingRoute ? <Car className="mr-2 h-4 w-4" /> : <Footprints className="mr-2 h-4 w-4" />
                                                    )}
                                                    {isStartingRoute ? translations.nearby.gettingLocation : translations.route.startRouteOnMap}
                                                </Button>
                                            </AlertDialogTrigger>
                                            <AlertDialogContent>
                                                <AlertDialogHeader>
                                                <AlertDialogTitle>{translations.route.redirectToMapsTitle}</AlertDialogTitle>
                                                <AlertDialogDescription>
                                                    {translations.route.redirectToMapsDescription}
                                                </AlertDialogDescription>
                                                </AlertDialogHeader>
                                                <AlertDialogFooter>
                                                <AlertDialogCancel>{translations.common.cancel}</AlertDialogCancel>
                                                <AlertDialogAction onClick={() => handleStartRoute(isDrivingRoute ? 'driving' : 'walking')}>
                                                    {translations.route.startAnyway}
                                                </AlertDialogAction>
                                                </AlertDialogFooter>
                                            </AlertDialogContent>
                                        </AlertDialog>
                                    )}
                                    {!isFlavorTour && pois.length > 0 && (
                                        <>
                                            <Separator />
                                            <div className="space-y-2">
                                                <h4 className="font-semibold">{translations.route.stops}</h4>
                                                <ul className="list-disc list-inside text-muted-foreground text-sm space-y-1">
                                                    {pois.map(poi => <li key={poi.id}>{poi.name}</li>)}
                                                </ul>
                                            </div>
                                        </>
                                    )}
                                </CardContent>
                            </Card>
                        </div>
                    </aside>
                </div>
            </div>
        </div>
    );
}
