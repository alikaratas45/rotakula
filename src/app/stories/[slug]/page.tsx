
"use client"

import { getStoryBySlug, getPoiBySlug, getAudioUrl } from '@/lib/kula-data';
import Image from 'next/image';
import { useApp } from '@/context/app-context';
import { useEffect, useState } from 'react';
import type { Story, PointOfInterest } from '@/lib/types';
import { notFound, useParams } from 'next/navigation';
import { getImageById } from '@/lib/placeholder-images';
import { Loader2 } from 'lucide-react';
import AudioPlayer from '@/components/AudioPlayer';
import { BackButton } from '@/components/back-button';
import { APIProvider } from '@vis.gl/react-google-maps';
import EmbeddedMap from '@/components/map';


export default function StoryPage() {
    const params = useParams();
    const slug = Array.isArray(params.slug) ? params.slug[0] : params.slug;
    const { language, translations } = useApp();
    const [story, setStory] = useState<Story | null>(null);
    const [drAristiEviLocation, setDrAristiEviLocation] = useState<PointOfInterest | null>(null);
    const [loading, setLoading] = useState(true);
    const [audioUrl, setAudioUrl] = useState<string | null>(null);
    
    const [narrationText, setNarrationText] = useState('');

    useEffect(() => {
      if (!slug) return;
      async function fetchData() {
        setLoading(true);
        const storyData = await getStoryBySlug(slug, language);
        if (storyData) {
          setStory(storyData);
          const fullText = storyData.content || '';
          setNarrationText(fullText.replace(/\\n/g, ' '));
          const url = getAudioUrl(storyData.slug);
          setAudioUrl(url);

           if (storyData.slug === 'kula-halisi') {
            const poiData = await getPoiBySlug('dr-aristi-evi', language);
            if (poiData) {
              setDrAristiEviLocation(poiData);
            }
          }

        } else {
          setStory(null);
          setNarrationText('');
          setAudioUrl(null);
        }
        setLoading(false);
      }
      fetchData();

    }, [slug, language]);


    if (loading) {
      return <div className="flex justify-center items-center h-screen">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>;
    }

    if (!story) {
        notFound();
    }

    const storyImage = getImageById(story.imageId);
    
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!;
    
    const paragraphs = story.content.split('\\n\\n').map(p => p.trim()).filter(Boolean);

    return (
        <APIProvider apiKey={apiKey}>
            <article>
                <section className="relative h-[40vh] md:h-[50vh] w-full flex items-end text-white">
                    {storyImage && (
                        <Image
                            src={storyImage.imageUrl}
                            alt={storyImage.description}
                            fill
                            priority
                            className="object-cover"
                            data-ai-hint={storyImage.imageHint}
                        />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                    <div className="relative z-10 container px-4 py-8">
                        <h1 className="font-headline text-4xl md:text-5xl font-bold tracking-tight drop-shadow-lg">
                            {story.title}
                        </h1>
                    </div>
                </section>
                
                <div className="container px-4 py-8 md:py-12">
                    <BackButton className="mb-8" />
                    <div className="max-w-3xl mx-auto">
                        <div className="flex flex-col gap-4 mb-6">
                            <h2 className="text-2xl font-headline font-bold">{translations.pois.details}</h2>
                            <AudioPlayer audioUrl={audioUrl} textToNarrate={narrationText} />
                        </div>

                        <div className="prose prose-lg max-w-none text-foreground/90">
                           {paragraphs.map((paragraph, index) => (
                                <p key={index}>{paragraph.replace(/\\n/g, ' ')}</p>
                            ))}
                        </div>

                        {story.slug === 'kula-halisi' && drAristiEviLocation && (
                            <div className="mt-12">
                                <h2 className="text-2xl font-headline font-bold mb-4">Konum</h2>
                                <EmbeddedMap pois={[drAristiEviLocation]} />
                            </div>
                        )}
                    </div>
                </div>
            </article>
        </APIProvider>
    );
}
