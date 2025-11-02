
"use client"

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { getPois } from '@/lib/kula-data';
import type { PointOfInterest } from '@/lib/types';
import { getImageById } from '@/lib/placeholder-images';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2, MapPin } from 'lucide-react';
import { FoodIcon } from '@/components/icons';
import { useLanguage } from '@/context/language-context';
import { Button } from '@/components/ui/button';


export default function FoodPage() {
    const { language, translations } = useLanguage();
    const [pois, setPois] = useState<PointOfInterest[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        async function fetchPois() {
            try {
                setIsLoading(true);
                const allPois = await getPois(language);
                const filteredPois = allPois.filter(poi => poi.category === 'food');
                setPois(filteredPois);
            } catch (error) {
                console.error("Failed to fetch POIs", error);
            } finally {
                setIsLoading(false);
            }
        }
        fetchPois();
    }, [language]);
    
    const openGoogleMapsSearch = () => {
        const query = encodeURIComponent('Kula\'daki lokantalar');
        const url = `https://www.google.com/maps/search/${query}`;
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
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4">
                <h1 className="text-3xl md:text-4xl font-headline font-bold">{translations.food.title}</h1>
                 <Button variant="outline" onClick={openGoogleMapsSearch}>
                    <MapPin className="mr-2 h-4 w-4" />
                    {translations.food.nearbyRestaurants}
                </Button>
            </div>
             <p className="text-muted-foreground mb-8">{translations.food.nearbyDescription}</p>
            
            <h2 className="text-2xl font-headline font-bold mb-4 mt-12">{translations.food.editorsChoice}</h2>
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
                                    <CardDescription>{translations.food.featuredFlavor}</CardDescription>
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
    );
}
