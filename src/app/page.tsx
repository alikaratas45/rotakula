
"use client"

import { getRoutes } from '@/lib/kula-data';
import { ThematicRoute } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Image from 'next/image';
import Link from 'next/link';
import { getImageById } from '@/lib/placeholder-images';
import { useEffect, useState, useMemo } from 'react';
import { useLanguage } from '@/context/language-context';

const RouteCard = ({ route, delay }: { route: ThematicRoute, delay: number }) => {
  const image = getImageById(route.imageId);
  return (
    <Link 
      href={`/routes/${route.slug}`} 
      className="group block animate-fade-in-up"
      style={{ animationDelay: `${delay}ms` }}
    >
      <Card className="h-full overflow-hidden transition-all duration-300 ease-in-out bg-card/50 hover:bg-card hover:shadow-[0_8px_30px_rgb(0,0,0,0.12)] hover:-translate-y-2">
        <CardHeader className="p-0">
          <div className="relative h-48 w-full">
            {image && (
              <Image
                src={image.imageUrl}
                alt={image.description}
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-105"
                data-ai-hint={image.imageHint}
              />
            )}
             <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent group-hover:from-black/40 transition-colors"></div>
          </div>
        </CardHeader>
        <CardContent className="p-4">
          <CardTitle className="font-headline text-xl mb-2 group-hover:text-primary transition-colors">{route.title}</CardTitle>
          <CardDescription className="text-sm">{route.description}</CardDescription>
        </CardContent>
      </Card>
    </Link>
  );
};

export default function Home() {
  const { language, translations } = useLanguage();
  const [allRoutes, setAllRoutes] = useState<ThematicRoute[]>([]);
  
  useEffect(() => {
    async function fetchData() {
      const routes = await getRoutes(language);
      setAllRoutes(routes);
    }
    fetchData();
  }, [language]);

  const sortedRoutes = useMemo(() => {
    const flavorTour = allRoutes.find(route => route.slug === 'kula-flavor-tour');
    const otherRoutes = allRoutes.filter(route => route.slug !== 'kula-flavor-tour');
    return flavorTour ? [...otherRoutes, flavorTour] : otherRoutes;
  }, [allRoutes]);
  
  const heroImage = getImageById('hero-home');

  return (
    <div className="flex flex-col">
      <section className="relative h-[70vh] md:h-[90vh] w-full flex items-center justify-center text-center">
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
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-transparent" />
        <div className="relative z-10 max-w-4xl p-4 mt-24">
          <h1 className="font-headline text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight drop-shadow-lg animate-fade-in text-black dark:text-white" style={{animationDelay: '200ms'}}>
            {translations.home.heroTitle}
          </h1>
          <p className="mt-6 text-lg md:text-xl max-w-3xl mx-auto drop-shadow-md animate-fade-in text-black dark:text-white" style={{animationDelay: '600ms'}}>
            {translations.home.heroSubtitle}
          </p>
        </div>
      </section>

      <section className="py-16 px-4 md:px-8 bg-background">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-4xl font-headline font-bold text-center mb-12 animate-fade-in-up">{translations.home.thematicRoutes}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {sortedRoutes.map((route, index) => (
              <RouteCard key={route.id} route={route} delay={index * 150} />
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
