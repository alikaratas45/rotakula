import { getRouteBySlug, getPoisByIds } from '@/lib/kula-data';
import { notFound } from 'next/navigation';
import { getImageById } from '@/lib/placeholder-images';
import Image from 'next/image';
import RouteDetailsClient from './route-details-client';
import type { Metadata } from 'next';

type Props = {
    params: { slug: string };
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const route = await getRouteBySlug(params.slug);

  if (!route) {
    return {
      title: 'Rota Bulunamadı',
    };
  }

  return {
    title: `${route.title} | RotaKula`,
    description: route.longDescription,
  };
}

export default async function RoutePage({ params }: Props) {
    const { slug } = params;
    const route = await getRouteBySlug(slug);

    if (!route) {
        notFound();
    }

    const pois = await getPoisByIds(route.poiIds);
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
