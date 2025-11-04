"use client"

import { getStoryBySlug } from '@/lib/kula-data';
import Image from 'next/image';
import { Calendar, User } from 'lucide-react';
import { useLanguage } from '@/context/language-context';
import { useEffect, useState, use } from 'react';
import type { Story } from '@/lib/types';
import { notFound } from 'next/navigation';
import { getImageById } from '@/lib/placeholder-images';

export default function StoryPage({ params }: { params: { slug: string } }) {
    const slug = use(params).slug;
    const { language, translations } = useLanguage();
    const [story, setStory] = useState<Story | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
      async function fetchData() {
        setLoading(true);
        const storyData = await getStoryBySlug(slug, language);
        if (storyData) {
          setStory(storyData);
        }
        setLoading(false);
      }
      fetchData();
    }, [slug, language]);


    if (loading) {
      return <div className="container py-8">{translations.common.loading}...</div>;
    }

    if (!story) {
        notFound();
    }

    const storyImage = getImageById(story.imageId);
    
    const displayDate = story.date;

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
                <div className="relative z-10 container py-8">
                    <h1 className="font-headline text-4xl md:text-5xl font-bold tracking-tight drop-shadow-lg">
                        {story.title}
                    </h1>
                </div>
            </section>
            
            <div className="container py-8 md:py-12">
                <div className="max-w-3xl mx-auto">
                    <div className="flex items-center gap-6 text-sm text-muted-foreground mb-6">
                        <div className="flex items-center gap-2">
                            <User className="h-4 w-4" />
                            <span>{story.author}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            <time dateTime={story.date}>{displayDate}</time>
                        </div>
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
