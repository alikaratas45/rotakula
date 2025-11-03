
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
import { useLanguage } from '@/context/language-context';

export default function MyRoutesPage() {
    const { savedRoutes, isLoaded, removeRoute } = useSavedRoutes();
    const [allRoutes, setAllRoutes] = useState<ThematicRoute[]>([]);
    const { language, translations } = useLanguage();

    useEffect(() => {
        async function fetchRoutes() {
            const routes = await getRoutes(language);
            setAllRoutes(routes);
        }
        fetchRoutes();
    }, [language]);

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
            <h1 className="text-3xl md:text-4xl font-headline font-bold mb-8">{translations.myRoutes.title}</h1>
            
            {userSavedRoutes.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {userSavedRoutes.map(route => {
                        const image = getImageById(route.imageId);
                        return (
                             <Card key={route.id} className="flex flex-col group overflow-hidden transition-all duration-300 ease-in-out bg-card/50 hover:bg-card hover:shadow-xl hover:-translate-y-1">
                                <Link href={`/routes/${route.slug}`} className="block">
                                    <CardHeader className="p-0">
                                        <div className="relative h-48 w-full overflow-hidden">
                                            {image && (
                                                <Image
                                                    src={image.imageUrl}
                                                    alt={image.description}
                                                    fill
                                                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                                                    data-ai-hint={image.imageHint}
                                                />
                                            )}
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent group-hover:from-black/40 transition-colors"></div>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="p-4 flex-grow">
                                        <CardTitle className="font-headline text-xl mb-2 group-hover:text-primary transition-colors">{route.title}</CardTitle>
                                        <CardDescription>{route.description}</CardDescription>
                                    </CardContent>
                                </Link>
                                <div className="p-4 pt-0 mt-auto">
                                    <Button variant="outline" size="sm" onClick={() => removeRoute(route.slug)}>
                                        <BookmarkX className="mr-2 h-4 w-4" />
                                        {translations.myRoutes.remove}
                                    </Button>
                                </div>
                            </Card>
                        );
                    })}
                </div>
            ) : (
                <div className="text-center py-16 border-2 border-dashed rounded-lg">
                    <h2 className="text-xl font-semibold text-muted-foreground">{translations.myRoutes.noRoutes}</h2>
                    <p className="text-muted-foreground mt-2">{translations.myRoutes.noRoutesDescription}</p>
                    <Button asChild className="mt-4">
                        <Link href="/">{translations.myRoutes.exploreRoutes}</Link>
                    </Button>
                </div>
            )}
        </div>
    );
}
