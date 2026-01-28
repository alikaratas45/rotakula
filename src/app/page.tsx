"use client"

import { getRoutes } from '@/lib/kula-data';
import { ThematicRoute } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Image from 'next/image';
import Link from 'next/link';
import { getImageById } from '@/lib/placeholder-images';
import { useEffect, useState, useMemo, memo } from 'react';
import { useApp } from '@/context/app-context';
import { Utensils, Map, Pin, Route, BookOpen, QrCode, Landmark, Smile, Award, Bike, Loader2, Users, Footprints, Home as HomeIcon } from 'lucide-react';
import { BedIcon } from '@/components/icons';
import { cn } from '@/lib/utils';
import { InstallPwaButton } from '@/components/install-pwa-button';
import dynamic from 'next/dynamic';

const FeedbackSection = dynamic(() => import('@/components/feedback').then(mod => mod.FeedbackSection), {
    loading: () => <div className="flex justify-center py-8"><Loader2 className="h-8 w-8 animate-spin" /></div>,
    ssr: false
});

const VisitorCounter = dynamic(() => import('@/components/VisitorCounter'), {
    loading: () => (
      <section className="py-12 bg-muted">
        <div className="container mx-auto px-4 md:px-8 text-center">
          <Users className="h-10 w-10 text-primary mx-auto mb-3" />
            <div className="text-3xl font-bold font-headline text-foreground h-9 bg-muted-foreground/10 rounded-md animate-pulse w-56 mx-auto mb-2" />
            <div className="text-5xl font-bold text-primary mt-2 h-14 bg-muted-foreground/20 rounded-md animate-pulse w-48 mx-auto" />
        </div>
      </section>
    ),
    ssr: false
});

const RouteCard = memo(({ route, delay, color }: { route: ThematicRoute, delay: number, color: string }) => {
  const image = getImageById(route.imageId);
  return (
    <Link 
      href={`/routes/${route.slug}`} 
      className="group block animate-fade-in-up"
      style={{ animationDelay: `${delay}ms` }}
    >
      <Card className={cn(
        "h-full overflow-hidden transition-all duration-300 ease-in-out bg-card/50 hover:bg-card hover:shadow-2xl hover:-translate-y-1 rounded-2xl border-b-4 border-r-4",
        color
      )}>
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
});
RouteCard.displayName = 'RouteCard';

export default function Home() {
  const { language, translations } = useApp();
  const [allRoutes, setAllRoutes] = useState<ThematicRoute[]>([]);
  
  useEffect(() => {
    async function fetchData() {
      const routes = await getRoutes(language);
      setAllRoutes(routes);
    }
    fetchData();
  }, [language]);

  const displayedRoutes = useMemo(() => {
    return allRoutes.filter(route => route.slug !== 'kula-flavor-tour');
  }, [allRoutes]);
  
  const heroImage = getImageById('hero-home');
  
  const iconNavItems = [
    { href: "/places", label: translations.nav.places, icon: Landmark, color: "border-blue-500" },
    { href: "/create-route", label: translations.nav.createRoute, icon: Route, color: "border-green-500" },
    { href: "/bike-routes", label: translations.nav.bikeRoutes, icon: Bike, color: "border-yellow-500" },
    { href: "/walking-routes", label: translations.nav.walkingRoutes, icon: Footprints, color: "border-lime-500" },
    { href: "/stories", label: translations.nav.stories, icon: BookOpen, color: "border-purple-500" },
    { href: "/routes/kula-flavor-tour", label: translations.nav.food, icon: Utensils, color: "border-orange-500" },
    { href: "/accommodation", label: translations.nav.accommodation, icon: BedIcon, color: "border-teal-500" },
    { href: "/selfie-spot", label: translations.nav.selfieSpot, icon: Smile, color: "border-cyan-500" },
    { href: "/qr-okuyucu", label: translations.nav.qrScanner, icon: QrCode, color: "border-indigo-500" },
    { href: "/nearby", label: translations.nav.nearby, icon: Pin, color: "border-red-500" },
    { href: "/my-badges", label: translations.nav.myBadges, icon: Award, color: "border-amber-500" },
  ];

  const stats = [
    { icon: Users, value: "42.952", label: translations.about.population },
    { icon: HomeIcon, value: "60", label: translations.about.neighborhoods },
    { icon: Landmark, value: "1150", label: translations.about.registeredBuildings },
  ];

  const routeCardColors = ["border-blue-500", "border-green-500", "border-purple-500", "border-orange-500"];

  return (
    <div className="flex flex-col">
      <section className="relative h-[70vh] md:h-[90vh] w-full text-center flex flex-col justify-start pt-0">
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
        <div className="relative z-10 mx-auto max-w-4xl px-4 pb-4">
        <div className="flex justify-center items-center gap-4">
            <Image
                src="https://i.imgur.com/aQa6rQO.png"
                alt="Kula Belediyesi Logosu"
                width={350}
                height={350}
                className="animate-fade-in w-full max-w-[350px] h-auto"
                style={{ animationDelay: '0ms' }}
                priority
            />
        </div>
          <h1 className="font-headline text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight text-3d animate-fade-in" style={{animationDelay: '200ms'}}>
            {translations.home.heroTitle}
          </h1>
          <p className="mt-6 text-lg md:text-xl max-w-3xl mx-auto drop-shadow-md animate-fade-in" style={{animationDelay: '600ms'}}>
            {translations.home.heroSubtitle}
          </p>
        </div>
      </section>

      <section className="relative z-20 pb-12 px-4 md:px-8 -mt-20 md:-mt-32">
         <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
              {iconNavItems.map((item, index) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="group animate-fade-in-up"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className={cn(
                      "relative p-4 bg-card rounded-2xl border-b-4 border-r-4 transition-transform duration-300 group-hover:-translate-y-1 group-hover:shadow-lg",
                      item.color
                  )}>
                      <div className="flex flex-col items-center justify-center h-28">
                          <item.icon className="h-12 w-12 text-foreground/80 mb-3 transition-colors group-hover:text-primary" />
                          <span className="text-center text-sm font-semibold text-foreground/90 group-hover:text-primary transition-colors">
                              {item.label}
                          </span>
                      </div>
                  </div>
                </Link>
              ))}
              <InstallPwaButton />
            </div>
          </div>
      </section>

      <section className="pb-16 pt-12 bg-background">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <h2 className="text-4xl font-headline font-bold text-center mb-12 animate-fade-in-up">{translations.home.thematicRoutes}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {displayedRoutes.map((route, index) => (
              <RouteCard 
                key={route.id} 
                route={route} 
                delay={index * 150} 
                color={routeCardColors[index % routeCardColors.length]}
              />
            ))}
          </div>
        </div>
      </section>

      <VisitorCounter />
      
      <section className="py-16 px-4 md:px-8 bg-background">
        <div className="max-w-4xl mx-auto">
          <FeedbackSection isLimited={true} />
        </div>
      </section>
      
      <section className="py-12 bg-muted/50">
        <div className="container mx-auto px-4 text-center">
            <Image src="https://i.imgur.com/aQa6rQO.png" alt="Kula Belediyesi Logosu" width={100} height={100} className="mx-auto mb-4" />
            <p className="text-lg font-semibold text-foreground">
                {translations.home.municipalityInfo}
            </p>
        </div>
      </section>

      <section className="py-12 bg-muted/50">
        <div className="container mx-auto px-4 md:px-8 text-center">
            <h3 className="text-3xl font-bold font-headline text-foreground mb-8">
                {(translations.home as any).municipalityInNumbers || 'Rakamlarla Belediyemiz'}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                {stats.map((stat, index) => (
                    <div key={index} className="flex flex-col items-center justify-center p-4 text-center">
                        <stat.icon className="h-10 w-10 text-primary mb-3" strokeWidth={1.5} />
                        <p className="text-4xl font-bold font-headline">{stat.value}</p>
                        <p className="text-md font-semibold text-muted-foreground mt-1">{stat.label}</p>
                    </div>
                ))}
            </div>
        </div>
      </section>
    </div>
  );
}
