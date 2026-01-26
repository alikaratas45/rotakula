
"use client";

import { useApp } from '@/context/app-context';
import Image from 'next/image';
import { Gem } from 'lucide-react';
import { useEffect, useState } from 'react';
import { getImageById } from '@/lib/placeholder-images';
import AudioPlayer from '@/components/AudioPlayer';
import { BackButton } from '@/components/back-button';

export default function NarMotifiPage() {
    const { translations } = useApp();
    const heroImage = getImageById('story-nar-motifi');
    const [narrationText, setNarrationText] = useState("");

    useEffect(() => {
        const newNarrationText = translations.narMotifi.content.join(' ') + ' ' + translations.narMotifi.poem.join(' ');
        setNarrationText(newNarrationText);
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
                        {translations.narMotifi.title}
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
                      <AudioPlayer text={narrationText} />
                    </div>
                    
                    <div className="prose prose-lg max-w-none text-foreground/90 space-y-4">
                        {translations.narMotifi.content.map((paragraph, index) => (
                            <p key={index}>{paragraph}</p>
                        ))}
                        <blockquote className="border-l-4 border-primary pl-4 italic text-center">
                            {translations.narMotifi.poem.map((line, index) => (
                                <span key={index} className="block">{line}</span>
                            ))}
                        </blockquote>
                    </div>
                </div>
            </div>
        </article>
    );
}
