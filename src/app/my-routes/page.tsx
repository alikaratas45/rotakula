"use client"

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useSavedRoutes } from '@/hooks/use-saved-routes';
import { getRoutes } from '@/lib/kula-data';
import type { ThematicRoute } from '@/lib/types';
import { getImageById } from '@/lib/placeholder-images';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BookmarkX, Loader2 } from 'lucide-react';

export default function MyRoutesPage() {
    const { savedRoutes, isLoaded, removeRoute } = useSavedRoutes();
    const [allRoutes, setAllRoutes] = useState<ThematicRoute[]>([]);

    useEffect(() => {
        async function fetchRoutes() {
            const routes = await getRoutes();
            setAllRoutes(routes);
        }
        fetchRoutes();
    }, []);

    const userSavedRoutes = allRoutes.filter(route => savedRoutes.includes(route.slug));

    if (!isLoaded) {
        return (
            <div className="flex justify-center items-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        )
    }

    return (
        <div className="container py-8 md:py-12">
            <h1 className="text-3xl md:text-4xl font-headline font-bold mb-8">Rotalarım</h1>
            
            {userSavedRoutes.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {userSavedRoutes.map(route => {
                        const image = getImageById(route.imageId);
                        return (
                             <Card key={route.id} className="flex flex-col perspective-1000">
                                <Link href={`/routes/${route.slug}`} className="group block preserve-3d animate-unfold-in">
                                    <CardHeader className="p-0">
                                        <div className="relative h-48 w-full">
                                            {image && (
                                                <Image
                                                    src={image.imageUrl}
                                                    alt={image.description}
                                                    fill
                                                    className="object-cover rounded-t-lg transition-transform duration-300 group-hover:scale-105"
                                                    data-ai-hint={image.imageHint}
                                                />
                                            )}
                                        </div>
                                    </CardHeader>
                                    <CardContent className="p-4 flex-grow">
                                        <CardTitle className="font-headline text-xl mb-2">{route.title}</CardTitle>
                                        <CardDescription>{route.description}</CardDescription>
                                    </CardContent>
                                </Link>
                                <div className="p-4 pt-0 mt-auto">
                                    <Button variant="outline" size="sm" onClick={() => removeRoute(route.slug)}>
                                        <BookmarkX className="mr-2 h-4 w-4" />
                                        Kaldır
                                    </Button>
                                </div>
                            </Card>
                        );
                    })}
                </div>
            ) : (
                <div className="text-center py-16 border-2 border-dashed rounded-lg">
                    <h2 className="text-xl font-semibold text-muted-foreground">Henüz kaydedilmiş rotanız bulunmuyor.</h2>
                    <p className="text-muted-foreground mt-2">Kula'yı keşfetmeye başlamak için rotalara göz atın.</p>
                    <Button asChild className="mt-4">
                        <Link href="/">Rotaları Keşfet</Link>
                    </Button>
                </div>
            )}
        </div>
    );
}
