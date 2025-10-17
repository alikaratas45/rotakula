
"use client"

import type { ThematicRoute, PointOfInterest } from '@/lib/types';
import { useSavedRoutes } from '@/hooks/use-saved-routes';
import { getImageById } from '@/lib/placeholder-images';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Heart, MapPin, Mountain, Info } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { FoodIcon, HistoricHouseIcon } from '@/components/icons';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import EmbeddedMap from '@/components/map';
import { APIProvider } from '@vis.gl/react-google-maps';

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
    const { isLoaded, isRouteSaved, toggleSaveRoute } = useSavedRoutes();
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!;
    const isSaved = isRouteSaved(route.slug);
    
    return (
        <APIProvider apiKey={apiKey}>
            <div className="container py-8 md:py-12">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12">
                    <div className="lg:col-span-2">
                        <p className="text-lg text-foreground/80 mb-8">{route.longDescription}</p>

                        {pois.length > 0 && (
                            <div className="mb-8">
                                 <h2 className="text-2xl font-headline font-bold mb-4">Rota Haritası</h2>
                                <EmbeddedMap pois={pois} />
                            </div>
                        )}
                        
                        <h2 className="text-2xl font-headline font-bold mb-6">Bu Rotada Neler Var?</h2>
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
                                                        <CardDescription className="capitalize">{poi.category}</CardDescription>
                                                    </div>
                                                </CardHeader>
                                                <CardContent>
                                                    <p className="text-foreground/80 mb-4">{poi.description}</p>
                                                     <div className="flex items-center gap-2">
                                                        <Button asChild variant="secondary" size="sm">
                                                            <Link href={`/pois/${poi.slug}`}>
                                                                <Info className="mr-2 h-4 w-4" />
                                                                Daha Fazla Bilgi
                                                            </Link>
                                                        </Button>
                                                    </div>
                                                </CardContent>
                                            </div>
                                        </div>
                                    </Card>
                                );
                            })}
                        </div>
                    </div>

                    <aside className="lg:col-span-1">
                        <div className="sticky top-24">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="font-headline text-xl">Rota Bilgileri</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <Button
                                        onClick={() => isLoaded && toggleSaveRoute(route.slug)}
                                        variant={isSaved ? "secondary" : "default"}
                                        className="w-full"
                                        disabled={!isLoaded}
                                    >
                                        <Heart className={cn("mr-2 h-4 w-4", isSaved && "fill-current text-red-500")} />
                                        {isSaved ? 'Kaydedildi' : 'Rotayı Kaydet'}
                                    </Button>
                                    <Separator />
                                    <div className="space-y-2">
                                         <h4 className="font-semibold">Duraklar</h4>
                                         <ul className="list-disc list-inside text-muted-foreground text-sm space-y-1">
                                             {pois.map(poi => <li key={poi.id}>{poi.name}</li>)}
                                         </ul>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </aside>
                </div>
            </div>
        </APIProvider>
    );
}
