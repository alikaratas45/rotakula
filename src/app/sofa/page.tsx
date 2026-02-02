
"use client";

import { useApp } from '@/context/app-context';
import Image from 'next/image';
import { Gem } from 'lucide-react';
import { useEffect, useState } from 'react';
import { getImageById } from '@/lib/placeholder-images';
import AudioPlayer from '@/components/AudioPlayer';
import { BackButton } from '@/components/back-button';
import { getAudioUrl } from '@/lib/kula-data';

export default function SofaPage() {
    const { translations } = useApp();
    const heroImage = getImageById('story-sofa');
    const [narrationText, setNarrationText] = useState("");
    const [audioUrl, setAudioUrl] = useState<string | null>(null);

    useEffect(() => {
        const newNarrationText = Array.isArray(translations.sofa.content) ? translations.sofa.content.join(' ') : '';
        setNarrationText(newNarrationText);
        const url = getAudioUrl('sofa-page');
        setAudioUrl(url);
    }, [translations]);

    return (
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
                        {translations.sofa.title}
                    </h1>
                </div>
            </section>
            
            <div className="container px-4 py-8 md:py-12">
                <BackButton className="mb-8" />
                <div className="max-w-3xl mx-auto">
                    <div className="flex items-center gap-4 mb-6">
                        <Gem className="h-6 w-6 text-primary" />
                        <h2 className="text-2xl font-headline font-bold">{translations.pois.details}</h2>
                    </div>
                    <div className='mb-6'>
                        <AudioPlayer audioUrl={audioUrl} textToNarrate={narrationText} />
                    </div>
                    
                    <div className="prose prose-lg max-w-none text-foreground/90 space-y-4">
                        {Array.isArray(translations.sofa.content) && translations.sofa.content.map((paragraph: string, index: number) => (
                            <p key={index}>{paragraph}</p>
                        ))}
                    </div>
                </div>
            </div>
        </article>
    );
}
