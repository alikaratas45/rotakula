
import { getRouteBySlug, getPoisByIds } from '@/lib/kula-data';
import { notFound } from 'next/navigation';
import { getImageById } from '@/lib/placeholder-images';
import Image from 'next/image';
import RouteDetailsClient from './route-details-client';
import type { ThematicRoute, PointOfInterest } from '@/lib/types';

export default async function RoutePage({ params }: { params: { slug: string } }) {
    const route = await getRouteBySlug(params.slug, 'tr');

    if (!route) {
        notFound();
    }

    const pois = await getPoisByIds(route.poiIds, 'tr');
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
