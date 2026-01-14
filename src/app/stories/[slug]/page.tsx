
"use client"

import { getStoryBySlug } from '@/lib/kula-data';
import Image from 'next/image';
import { useApp } from '@/context/app-context';
import { useEffect, useState } from 'react';
import type { Story } from '@/lib/types';
import { notFound, useParams } from 'next/navigation';
import { getImageById } from '@/lib/placeholder-images';
import { Loader2 } from 'lucide-react';
import AudioPlayer from '@/components/AudioPlayer';

export default function StoryPage() {
    const params = useParams();
    const slug = Array.isArray(params.slug) ? params.slug[0] : params.slug;
    const { language, translations } = useApp();
    const [story, setStory] = useState<Story | null>(null);
    const [loading, setLoading] = useState(true);
    
    const [narrationText, setNarrationText] = useState('');

    useEffect(() => {
      if (!slug) return;
      async function fetchData() {
        setLoading(true);
        const storyData = await getStoryBySlug(slug, language);
        if (storyData) {
          setStory(storyData);
          const fullText = storyData.content || '';
          setNarrationText(fullText);
        } else {
          setStory(null);
          setNarrationText('');
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
    
    return (
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
                <div className="max-w-3xl mx-auto">
                    <div className="flex flex-col gap-4 mb-6">
                        <h2 className="text-2xl font-headline font-bold">{translations.pois.details}</h2>
                         <AudioPlayer text={narrationText} />
                    </div>

                    <div className="prose prose-lg max-w-none text-foreground/90">
                         {story.content.split('\n\n').map((paragraph, index) => (
                            <p key={index}>{paragraph}</p>
                        ))}
                    </div>
                </div>
            </div>
        </article>
    );
}
