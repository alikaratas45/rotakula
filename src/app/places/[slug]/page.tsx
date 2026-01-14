
"use client"

import { getPoiBySlug } from '@/lib/kula-data';
import { notFound, useRouter, useSearchParams, useParams } from 'next/navigation';
import Image from 'next/image';
import { APIProvider } from '@vis.gl/react-google-maps';
import EmbeddedMap from '@/components/map';
import { getImageById } from '@/lib/placeholder-images';
import type { PointOfInterest } from '@/lib/types';
import { useState, useRef, useCallback, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { useApp } from '@/context/app-context';
import { Survey } from '@/components/survey';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import AudioPlayer from '@/components/AudioPlayer';

export default function PlaceDetailPage() {
    const params = useParams();
    const slug = Array.isArray(params.slug) ? params.slug[0] : params.slug;
    const { language, translations, addBadge } = useApp();
    const [poi, setPoi] = useState<PointOfInterest | null>(null);
    const [loading, setLoading] = useState(true);

    const router = useRouter();
    const searchParams = useSearchParams();
    const [showSurvey, setShowSurvey] = useState(false);
    
    const [narrationText, setNarrationText] = useState('');
    const [shouldAutoplay, setShouldAutoplay] = useState(false);

    useEffect(() => {
        if (!slug) return;
        setPoi(null);
        setNarrationText('');
        
        async function fetchPoi() {
            setLoading(true);
            const poiData = await getPoiBySlug(slug, language);
            if (poiData) {
                setPoi(poiData);
                const fullText = poiData.longDescription || '';
                setNarrationText(fullText);
                if (poiData.badgeId) {
                    addBadge(poiData.id);
                }
            } else {
                setPoi(null);
            }
            setLoading(false);
        }
        fetchPoi();

    }, [slug, language, addBadge]);

     useEffect(() => {
        const autoplay = searchParams.get('autoplay') === 'true';
        if (autoplay && poi) {
            setShowSurvey(true);
            setShouldAutoplay(true);
            const newPath = `/places/${poi.slug}`;
            router.replace(newPath, { scroll: false });
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [poi, searchParams]);

    if (loading) {
        return (
            <div className="flex justify-center items-center h-screen">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }
    
    if (!poi) {
        notFound();
    }
    
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!;
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
                    <div className="relative z-10 container px-4 py-8">
                        <h1 className="font-headline text-4xl md:text-5xl font-bold tracking-tight drop-shadow-lg">
                            {poi.name}
                        </h1>
                         <p className="mt-2 text-lg text-white/90 capitalize">
                            {translations.category[poi.category as keyof typeof translations.category] || poi.category}
                         </p>
                    </div>
                </section>
                
                <div className="container px-4 py-8 md:py-12">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12">
                         <div className="lg:col-span-2">
                             <div className="flex flex-col gap-4 mb-6">
                                <h2 className="text-2xl font-headline font-bold">{translations.pois.details}</h2>
                                <AudioPlayer text={narrationText} autoPlay={shouldAutoplay} />
                             </div>
                             <div className="prose prose-lg max-w-none text-foreground/90">
                                {poi.longDescription.split('\n').map((paragraph, index) => (
                                    <p key={index}>{paragraph}</p>
                                ))}
                            </div>
                        </div>

                        <aside className="lg:col-span-1">
                            <div className="sticky top-24 space-y-6">
                                <div>
                                    <h2 className="text-2xl font-headline font-bold mb-4">{translations.common.map}</h2>
                                    <EmbeddedMap pois={[poi]} />
                                </div>
                            </div>
                        </aside>
                    </div>
                </div>

                {showSurvey && (
                    <section className="py-12 bg-muted">
                        <div className="container px-4">
                            <div className="max-w-2xl mx-auto">
                                <Card>
                                    <CardHeader>
                                        <CardTitle>{translations.survey.title.replace('{poiName}', poi.name)}</CardTitle>
                                        <CardDescription>
                                            {translations.survey.description}
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <Survey poiId={poi.id} poiName={poi.name} onSubmitted={() => setShowSurvey(false)} />
                                    </CardContent>
                                </Card>
                            </div>
                        </div>
                    </section>
                )}
            </article>
        </APIProvider>
    );
}

