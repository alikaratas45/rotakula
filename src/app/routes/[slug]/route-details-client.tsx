
"use client"

import type { ThematicRoute, PointOfInterest } from '@/lib/types';
import { getImageById } from '@/lib/placeholder-images';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { MapPin, Mountain, Info, Footprints, Loader2, Car, UtensilsCrossed, Navigation } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { FoodIcon, HistoricHouseIcon } from '@/components/icons';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import EmbeddedMap, { NearbySearch } from '@/components/map';
import { APIProvider } from '@vis.gl/react-google-maps';
import { useLanguage } from '@/context/language-context';
import { useState } from 'react';
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
} from "@/components/ui/alert-dialog"

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

export default function RouteDetailsClient({ route, pois }: { route: ThematicRoute; pois: PointOfInterest[] }) {
    const { translations } = useLanguage();
    const { toast } = useToast();
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!;
    const [isStartingRoute, setIsStartingRoute] = useState(false);

    const isFlavorTour = route.slug === 'kula-flavor-tour';

    const handleFlavorTourClick = () => {
        const query = encodeURIComponent('Kula\'daki lokanta ve restoranlar');
        const url = `https://www.google.com/maps/search/?api=1&query=${query}`;
        window.open(url, '_blank');
    };

    const handleGetDirections = (poi: PointOfInterest) => {
        const url = `https://www.google.com/maps/dir/?api=1&destination=${poi.latitude},${poi.longitude}`;
        window.open(url, '_blank');
    };

    const handleStartRoute = () => {
        if (!navigator.geolocation) {
            toast({
                title: translations.toast.locationErrorTitle,
                description: translations.map.locationError,
                variant: 'destructive',
            });
            return;
        }

        if (pois.length < 1) return;

        setIsStartingRoute(true);

        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                const origin = `${latitude},${longitude}`;
                
                const waypointsString = pois
                    .map(p => `${p.latitude},${p.longitude}`)
                    .join('/');

                const travelMode = route.slug === 'geopark-discovery-route' ? 'driving' : 'walking';
                
                // Use a URL structure that lists all waypoints including the origin
                const googleMapsUrl = `https://www.google.com/maps/dir/${origin}/${waypointsString}`;

                window.open(googleMapsUrl, '_blank');
                setIsStartingRoute(false);
            },
            (error) => {
                toast({
                    title: translations.toast.locationErrorTitle,
                    description: translations.nearby.locationError,
                    variant: 'destructive',
                });
                setIsStartingRoute(false);
            },
            { enableHighAccuracy: true }
        );
    };
    
    return (
        <APIProvider apiKey={apiKey}>
            <div className="container px-4 py-8 md:py-12">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12">
                    <div className="lg:col-span-2">
                        <p className="text-lg text-foreground/80 mb-8">{route.longDescription}</p>

                        {!isFlavorTour && pois.length > 0 && (
                            <div className="mb-8">
                                 <h2 className="text-2xl font-headline font-bold mb-4">{translations.route.mapTitle}</h2>
                                <EmbeddedMap pois={pois} />
                            </div>
                        )}
                        
                        <h2 className="text-2xl font-headline font-bold mb-6">{translations.route.whatsOnThisRoute}</h2>

                        {isFlavorTour ? (
                            <div className="mb-8">
                                <NearbySearch />
                            </div>
                        ) : (
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
                                                        route.slug === 'geopark-discovery-route' ? <Car className="mr-2 h-4 w-4" /> : <Footprints className="mr-2 h-4 w-4" />
                                                    )}
                                                    {isStartingRoute ? translations.nearby.gettingLocation : "Rotayı Haritada Başlat"}
                                                </Button>
                                            </AlertDialogTrigger>
                                            <AlertDialogContent>
                                                <AlertDialogHeader>
                                                <AlertDialogTitle>Harita Uygulamasına Yönlendiriliyorsunuz</AlertDialogTitle>
                                                <AlertDialogDescription>
                                                    En iyi yol tarifi deneyimi için Google Haritalar uygulaması açılacaktır. Bu işlem sırasında sesli rehber duraklatılacaktır. Uygulamaya geri döndüğünüzde sesli rehberi yeniden başlatabilirsiniz.
                                                </AlertDialogDescription>
                                                </AlertDialogHeader>
                                                <AlertDialogFooter>
                                                <AlertDialogCancel>İptal</AlertDialogCancel>
                                                <AlertDialogAction onClick={handleStartRoute}>
                                                    Yine de Başlat
                                                </AlertDialogAction>
                                                </AlertDialogFooter>
                                            </AlertDialogContent>
                                        </AlertDialog>
                                    )}
                                    {!isFlavorTour && (
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
        </APIProvider>
    );
}
