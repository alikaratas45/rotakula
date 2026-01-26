
"use client";

import { useApp } from '@/context/app-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Image from 'next/image';
import { getImageById } from '@/lib/placeholder-images';
import { Award, Gem } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { BackButton } from '@/components/back-button';

export default function MyBadgesPage() {
    const { earnedBadges, totalPoints, translations } = useApp();

    return (
        <div className="container px-4 py-8 md:py-12">
            <BackButton className="mb-8" />
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
                <div className="flex items-center gap-4">
                    <Award className="h-8 w-8 text-primary" />
                    <h1 className="text-3xl md:text-4xl font-headline font-bold">{translations.badges.title}</h1>
                </div>
                <Card className="w-full sm:w-auto">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">{translations.badges.totalPoints}</CardTitle>
                        <Gem className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{totalPoints}</div>
                    </CardContent>
                </Card>
            </div>
            
            {earnedBadges.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
                    {earnedBadges.map(badge => {
                        const image = getImageById(badge.imageId);
                        return (
                            <Card key={badge.id} className="flex flex-col items-center text-center p-4">
                                <div className="relative h-24 w-24 mb-4">
                                    {image && (
                                        <Image
                                            src={image.imageUrl}
                                            alt={badge.name}
                                            fill
                                            className="object-cover rounded-full border-4 border-yellow-400"
                                        />
                                    )}
                                </div>
                                <CardTitle className="font-headline text-lg">{badge.name}</CardTitle>
                                <CardDescription className="text-yellow-500 font-semibold">{badge.points} {translations.badges.totalPoints.toLowerCase()}</CardDescription>
                            </Card>
                        );
                    })}
                </div>
            ) : (
                <div className="text-center py-16 border-2 border-dashed rounded-lg">
                    <h2 className="text-xl font-semibold text-muted-foreground">{translations.badges.noBadges}</h2>
                    <p className="text-muted-foreground mt-2 mb-4">{translations.badges.noBadgesDescription}</p>
                    <Button asChild>
                      <Link href="/places">{translations.nav.places}</Link>
                    </Button>
                </div>
            )}
        </div>
    );
}
