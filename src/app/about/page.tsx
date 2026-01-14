
"use client";

import { useApp } from '@/context/app-context';
import { Users, Home, Landmark } from 'lucide-react';
import { useEffect, useState } from 'react';
import Image from 'next/image';
import { getImageById } from '@/lib/placeholder-images';
import { Card, CardContent } from '@/components/ui/card';
import AudioPlayer from '@/components/AudioPlayer';

export default function AboutPage() {
    const { translations } = useApp();
    const heroImage = getImageById('hero-home');

    const [narrationText, setNarrationText] = useState("");
    
    useEffect(() => {
        const newNarrationText = Array.isArray(translations.about.content)
            ? translations.about.content.join(' ')
            : translations.about.content || "";
            
        setNarrationText(newNarrationText);
    }, [translations.about.content]);
    
    const contentParagraphs = Array.isArray(translations.about.content)
        ? translations.about.content
        : (translations.about.content || "").split('\n\n');

    const stats = [
        { icon: Users, value: "42.952", label: translations.about.population },
        { icon: Home, value: "60", label: translations.about.neighborhoods },
        { icon: Landmark, value: "1150", label: translations.about.registeredBuildings },
    ];

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
                        {translations.about.title}
                    </h1>
                </div>
            </section>

             <section className="py-8 bg-muted/50">
                <div className="container px-4">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                        {stats.map((stat, index) => (
                            <Card key={index} className="bg-transparent border-0 shadow-none">
                                <CardContent className="flex flex-col items-center justify-center p-4 text-center">
                                    <stat.icon className="h-10 w-10 text-primary mb-3" strokeWidth={1.5} />
                                    <p className="text-3xl font-bold font-headline">{stat.value}</p>
                                    <p className="text-sm font-semibold text-muted-foreground">{stat.label}</p>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            </section>


            <div className="container px-4 py-8 md:py-12">
                <div className="max-w-3xl mx-auto">
                    <div className="flex flex-col gap-4 mb-6">
                        <h2 className="text-2xl font-headline font-bold">{translations.pois.details}</h2>
                        <AudioPlayer text={narrationText} />
                    </div>
                    
                    <div className="prose prose-lg max-w-none text-foreground/90">
                        {contentParagraphs.map((paragraph, index) => (
                            <p key={index}>{paragraph}</p>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
