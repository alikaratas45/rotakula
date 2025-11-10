
"use client"

import { getRoutes } from '@/lib/kula-data';
import { ThematicRoute } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Image from 'next/image';
import Link from 'next/link';
import { getImageById } from '@/lib/placeholder-images';
import { useEffect, useState, useMemo } from 'react';
import { useLanguage } from '@/context/language-context';
import { Button } from '@/components/ui/button';
import { Utensils, Map, Pin, Route, Info, BookOpen, QrCode, Landmark } from 'lucide-react';
import { BedIcon } from '@/components/icons';
import { cn } from '@/lib/utils';
import { FeedbackSection } from '@/components/feedback';


const RouteCard = ({ route, delay }: { route: ThematicRoute, delay: number }) => {
  const image = getImageById(route.imageId);
  return (
    <Link 
      href={`/routes/${route.slug}`} 
      className="group block animate-fade-in-up card-3d"
      style={{ animationDelay: `${delay}ms` }}
    >
      <Card className="h-full overflow-hidden transition-all duration-300 ease-in-out bg-card/50 hover:bg-card hover:shadow-2xl card-3d-hover">
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
  
  const iconNavItems = [
    { href: "/places", label: translations.nav.places, icon: Landmark, colorClass: "bg-blue-200 dark:bg-blue-900" },
    { href: "/nearby", label: translations.nav.nearby, icon: Pin, colorClass: "bg-red-200 dark:bg-red-900" },
    { href: "/create-route", label: translations.nav.createRoute, icon: Route, colorClass: "bg-green-200 dark:bg-green-900" },
    { href: "/stories", label: translations.nav.stories, icon: BookOpen, colorClass: "bg-yellow-200 dark:bg-yellow-900" },
    { href: "/about", label: translations.nav.about, icon: Info, colorClass: "bg-purple-200 dark:bg-purple-900" },
    { href: "/food", label: translations.nav.food, icon: Utensils, colorClass: "bg-orange-200 dark:bg-orange-900" },
    { href: "/accommodation", label: translations.nav.accommodation, icon: BedIcon, colorClass: "bg-teal-200 dark:bg-teal-900" },
    { href: "/qr-scanner", label: translations.nav.qrScanner, icon: QrCode, colorClass: "bg-indigo-200 dark:bg-indigo-900" },
  ];

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

      <section className="py-12 px-4 md:px-8 bg-background relative z-20">
         <div className="max-w-5xl mx-auto">
            <div className="grid grid-cols-4 md:grid-cols-8 gap-4">
              {iconNavItems.map((item, index) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex flex-col items-center gap-2 group animate-fade-in-up"
                   style={{ animationDelay: `${index * 100}ms` }}
                >
                  <Button
                    variant="secondary"
                    size="icon"
                    className={cn(
                      "h-16 w-16 rounded-full group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300 transform group-hover:scale-110",
                      item.colorClass
                    )}
                    aria-label={item.label}
                  >
                    <item.icon className="h-7 w-7" />
                  </Button>
                  <span className="text-center text-sm font-semibold text-muted-foreground dark:text-white group-hover:text-primary transition-colors">
                    {item.label}
                  </span>
                </Link>
              ))}
            </div>
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

      <section className="py-16 px-4 md:px-8 bg-background">
        <div className="max-w-4xl mx-auto">
          <div className="aspect-w-16 aspect-h-9 w-full">
            <iframe 
              className="w-full h-full rounded-lg shadow-xl"
              src="https://www.youtube.com/embed/_ARn-XIt0RE?si=37dKY5kQwhbA26hf&vq=hd1080" 
              title="YouTube video player" 
              frameBorder="0" 
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
              referrerPolicy="strict-origin-when-cross-origin" 
              allowFullScreen>
            </iframe>
          </div>
        </div>
      </section>

      <section className="py-16 px-4 md:px-8 bg-background">
        <div className="max-w-4xl mx-auto">
          <FeedbackSection />
        </div>
      </section>

    </div>
  );
}
