
"use client"

import { getRouteBySlug, getPoisByIds } from '@/lib/kula-data';
import { notFound } from 'next/navigation';
import { getImageById } from '@/lib/placeholder-images';
import Image from 'next/image';
import RouteDetailsClient from './route-details-client';
import type { ThematicRoute, PointOfInterest } from '@/lib/types';
import { useApp } from '@/context/app-context';
import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';

export default function RoutePage({ params }: { params: { slug: string } }) {
    const { slug } = params;
    const { language } = useApp();
    const [route, setRoute] = useState<ThematicRoute | null>(null);
    const [pois, setPois] = useState<PointOfInterest[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchRouteData() {
            setLoading(true);
            const routeData = await getRouteBySlug(slug, language);
            if (routeData) {
                setRoute(routeData);
                const poisData = await getPoisByIds(routeData.poiIds, language);
                setPois(poisData);
            }
            setLoading(false);
        }
        fetchRouteData();
    }, [slug, language]);

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
            
            <RouteDetailsClient route={route} pois={pois} />
        </div>
    );
}
