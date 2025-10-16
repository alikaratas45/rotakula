
"use client"

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { getPois } from '@/lib/kula-data';
import type { PointOfInterest } from '@/lib/types';
import { getImageById } from '@/lib/placeholder-images';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2, MapPin } from 'lucide-react';
import { FoodIcon } from '@/components/icons';
import { APIProvider } from '@vis.gl/react-google-maps';
import { NearbySearch } from '@/components/map';


export default function FoodPage() {
    const [pois, setPois] = useState<PointOfInterest[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!;

    useEffect(() => {
        async function fetchPois() {
            try {
                const allPois = await getPois();
                const filteredPois = allPois.filter(poi => poi.category === 'food');
                setPois(filteredPois);
            } catch (error) {
                console.error("Failed to fetch POIs", error);
            } finally {
                setIsLoading(false);
            }
        }
        fetchPois();
    }, []);

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }
    
    return (
        <APIProvider apiKey={apiKey}>
            <div className="container py-8 md:py-12">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
                    <h1 className="text-3xl md:text-4xl font-headline font-bold">Lezzet Durakları</h1>
                </div>

                <div className="mb-12">
                    <h2 className="text-2xl font-headline font-bold mb-4">Yakınınızdaki Restoranlar</h2>
                    <p className="text-muted-foreground mb-4">Harita, konumunuza göre yakındaki yeme içme mekanlarını göstermektedir. Yeni yerler keşfetmek için haritayı gezebilirsiniz.</p>
                    <NearbySearch />
                </div>
                
                <h2 className="text-2xl font-headline font-bold mb-4 mt-12">Editörün Seçimi: Öne Çıkan Lezzetler</h2>
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
                                        <FoodIcon className="h-6 w-6 text-accent-foreground" />
                                    </div>
                                    <div>
                                        <CardTitle className="font-headline text-xl">{poi.name}</CardTitle>
                                        <CardDescription>Öne Çıkan Lezzet</CardDescription>
                                    </div>
                                </CardHeader>
                                <CardContent className="flex-grow">
                                    <p className="text-foreground/80">{poi.description}</p>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            </div>
        </APIProvider>
    );
}
