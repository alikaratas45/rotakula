import { getPoiBySlug, getPois } from '@/lib/kula-data';
import { notFound } from 'next/navigation';
import { getImageById } from '@/lib/placeholder-images';
import Image from 'next/image';
import type { Metadata } from 'next';
import { APIProvider } from '@vis.gl/react-google-maps';
import EmbeddedMap from '@/components/map';
import { Button } from '@/components/ui/button';
import { MapPin } from 'lucide-react';
import type { PointOfInterest } from '@/lib/types';

type Props = {
    params: { slug: string };
};

export async function generateStaticParams() {
    const pois = await getPois();
    return pois.map((poi) => ({
        slug: poi.slug,
    }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const poi = await getPoiBySlug(params.slug);

  if (!poi) {
    return {
      title: 'Yer Bulunamadı',
    };
  }

  return {
    title: `${poi.name} | RotaKula Gezilecek Yerler`,
    description: poi.description,
  };
}

const handleShowPoiOnMap = (poi: PointOfInterest) => {
    const query = poi.id === 'poi-13' 
        ? `${poi.latitude},${poi.longitude}` 
        : encodeURIComponent(`${poi.name}, Kula, Manisa`);
    const url = `https://www.google.com/maps/search/?api=1&query=${query}`;
    window.open(url, '_blank');
};


export default async function PoiDetailPage({ params }: Props) {
    const { slug } = params;
    const poi = await getPoiBySlug(slug);
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!;

    if (!poi) {
        notFound();
    }

    const heroImage = getImageById(poi.imageId);

    return (
        <APIProvider apiKey={apiKey}>
            <article>
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
                            {poi.name}
                        </h1>
                         <p className="mt-2 text-lg text-white/90 capitalize">{poi.category}</p>
                    </div>
                </section>
                
                <div className="container py-8 md:py-12">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12">
                         <div className="lg:col-span-2">
                             <div className="prose prose-lg max-w-none text-foreground/90">
                                {poi.longDescription.split('\n').map((paragraph, index) => (
                                    <p key={index}>{paragraph}</p>
                                ))}
                            </div>
                        </div>

                        <aside className="lg:col-span-1">
                            <div className="sticky top-24 space-y-6">
                                <div>
                                    <h2 className="text-2xl font-headline font-bold mb-4">Harita</h2>
                                    <EmbeddedMap pois={[poi]} />
                                </div>
                            </div>
                        </aside>
                    </div>
                </div>
            </article>
        </APIProvider>
    );
}
