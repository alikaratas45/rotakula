
"use client";

import Image from 'next/image';
import { useLanguage } from '@/context/language-context';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getImageById } from '@/lib/placeholder-images';
import { Gem, Home, UtensilsCrossed, HandMetal } from 'lucide-react';
import type { ImagePlaceholder } from '@/lib/placeholder-images';

type FamousThing = {
    title: string;
    description: string;
    icon: React.ElementType;
    imageId: string;
};

export default function FamousPage() {
    const { translations } = useLanguage();

    const famousThings: FamousThing[] = [
        {
            title: translations.famous.geoparkTitle,
            description: translations.famous.geoparkDescription,
            icon: Gem,
            imageId: 'route-geopark',
        },
        {
            title: translations.famous.housesTitle,
            description: translations.famous.housesDescription,
            icon: Home,
            imageId: 'route-history',
        },
        {
            title: translations.famous.craftsTitle,
            description: translations.famous.craftsDescription,
            icon: HandMetal,
            imageId: 'story-artisan',
        },
        {
            title: translations.famous.foodTitle,
            description: translations.famous.foodDescription,
            icon: UtensilsCrossed,
            imageId: 'route-food',
        },
    ];

    const heroImage = getImageById('hero-home');

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
                        {translations.famous.pageTitle}
                    </h1>
                </div>
            </section>
            <div className="container py-8 md:py-12">
                <div className="max-w-4xl mx-auto">
                    <p className="text-lg text-center text-muted-foreground mb-12">{translations.famous.intro}</p>
                    <div className="space-y-12">
                        {famousThings.map((item, index) => {
                            const image = getImageById(item.imageId);
                            return (
                                <Card key={index} className="overflow-hidden md:flex md:flex-row items-center">
                                     <div className="md:w-1/3 relative h-64 md:h-full">
                                        {image && (
                                            <Image 
                                                src={image.imageUrl} 
                                                alt={image.description} 
                                                fill 
                                                className="object-cover"
                                                data-ai-hint={image.imageHint}
                                            />
                                        )}
                                    </div>
                                    <div className="md:w-2/3">
                                        <CardHeader className="flex flex-row items-start gap-4">
                                            <div className="flex-shrink-0 bg-accent rounded-full p-3">
                                                <item.icon className="h-6 w-6 text-accent-foreground" />
                                            </div>
                                            <div>
                                                <CardTitle className="font-headline text-2xl">{item.title}</CardTitle>
                                            </div>
                                        </CardHeader>
                                        <CardContent>
                                            <p className="text-foreground/80">{item.description}</p>
                                        </CardContent>
                                    </div>
                                </Card>
                            )
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
}

