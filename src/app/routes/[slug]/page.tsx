
"use client"

import { getRouteBySlug, getPoisByIds } from '@/lib/kula-data';
import { notFound } from 'next/navigation';
import { getImageById } from '@/lib/placeholder-images';
import Image from 'next/image';
import RouteDetailsClient from './route-details-client';
import { useLanguage } from '@/context/language-context';
import { useEffect, useState, use } from 'react';
import type { ThematicRoute, PointOfInterest } from '@/lib/types';

export default function RoutePage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = use(params);
    const { language, translations } = useLanguage();
    const [route, setRoute] = useState<ThematicRoute | null>(null);
    const [pois, setPois] = useState<PointOfInterest[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchData() {
            setLoading(true);
            const routeData = await getRouteBySlug(slug, language);
            if (routeData) {
                const poisData = await getPoisByIds(routeData.poiIds, language);
                setRoute(routeData);
                setPois(poisData);
            }
            setLoading(false);
        }
        fetchData();
    }, [slug, language]);

    if (loading) {
        return <div className="container py-8">{translations.common.loading}...</div>;
    }

    if (!route) {
        notFound();
    }

    const heroImage = getImageById(route.imageId);

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
                <div className="relative z-10 container py-8">
                    <h1 className="font-headline text-4xl md:text-5xl font-bold tracking-tight drop-shadow-lg">
                        {route.title}
                    </h1>
                </div>
            </section>
            
            <RouteDetailsClient route={route} pois={pois} />
        </div>
    );
}
