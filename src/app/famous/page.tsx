
"use client";

import Image from 'next/image';
import { useLanguage } from '@/context/language-context';
import { getImageById } from '@/lib/placeholder-images';
import dynamic from 'next/dynamic';
import { Suspense } from 'react';

const TTSPlayer = dynamic(() => import('@/components/tts-player').then(mod => mod.TTSPlayer), {
    ssr: false,
    loading: () => <div className="h-10 w-28 bg-muted rounded-md animate-pulse"></div>
});


// --- Main Page Component ---
export default function FamousPage() {
    const { translations } = useLanguage();
    const heroImage = getImageById('hero-home');
    const narrationText = translations.famous.historyContent;

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
                        {translations.famous.pageTitle}
                    </h1>
                </div>
            </section>
            <div className="container px-4 py-8 md:py-12">
                <div className="max-w-4xl mx-auto">
                    <div className="flex items-center gap-4 mb-6">
                        <h2 className="text-2xl font-headline font-bold">{translations.pois.details}</h2>
                         <Suspense fallback={<div className="h-10 w-28 bg-muted rounded-md animate-pulse"></div>}>
                            <TTSPlayer textToRead={narrationText} />
                        </Suspense>
                    </div>
                   
                    <div className="prose prose-lg max-w-none text-foreground/90">
                         {narrationText.split('\n').map((paragraph, index) => (
                            <p key={index}>{paragraph}</p>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
