import { getFeaturedRoute, getRoutes } from '@/lib/kula-data';
import { ThematicRoute } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Image from 'next/image';
import Link from 'next/link';
import { getImageById } from '@/lib/placeholder-images';
import { ArrowRight, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

const RouteCard = ({ route, isFeatured = false }: { route: ThematicRoute, isFeatured?: boolean }) => {
  const image = getImageById(route.imageId);
  return (
    <Link href={`/routes/${route.slug}`} className="group block perspective-1000">
      <Card className="h-full overflow-hidden transition-all duration-300 ease-in-out hover:shadow-xl hover:-translate-y-1 preserve-3d">
        <CardHeader className="p-0">
          <div className="relative h-48 w-full animate-uncrumple-in">
            {image && (
              <Image
                src={image.imageUrl}
                alt={image.description}
                fill
                className="object-cover transition-transform duration-300 group-hover:scale-105"
                data-ai-hint={image.imageHint}
              />
            )}
            {isFeatured && (
              <div className="absolute top-2 right-2 flex items-center gap-1 rounded-full bg-accent px-3 py-1 text-xs font-semibold text-accent-foreground">
                <Star className="h-4 w-4" />
                <span>Haftanın Rotası</span>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-4">
          <CardTitle className="font-headline text-xl mb-2">{route.title}</CardTitle>
          <CardDescription className="text-sm">{route.description}</CardDescription>
        </CardContent>
      </Card>
    </Link>
  );
};

export default async function Home() {
  const allRoutes = await getRoutes();
  const featuredRoute = await getFeaturedRoute();
  const heroImage = getImageById('hero-home');

  return (
    <div className="flex flex-col">
      <section className="relative h-[60vh] md:h-[80vh] w-full flex items-center justify-center text-center text-white">
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
        <div className="absolute inset-0 bg-black/50" />
        <div className="relative z-10 max-w-4xl p-4">
          <h1 className="font-headline text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight drop-shadow-lg">
            Kula'nın Saklı Hazinelerini Keşfedin
          </h1>
          <p className="mt-4 text-lg md:text-xl max-w-2xl mx-auto drop-shadow-md">
            UNESCO Global Jeoparkı'ndan tarihi evlere, eşsiz lezzetlerden doğal güzelliklere uzanan bir macera sizi bekliyor.
          </p>
          {featuredRoute && (
            <Button asChild size="lg" className="mt-8 font-bold text-lg">
              <Link href={`/routes/${featuredRoute.slug}`}>
                Hemen Keşfet <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          )}
        </div>
      </section>

      <section className="py-16 px-4 md:px-8 bg-background">
        <div className="max-w-7xl mx-auto">
          {featuredRoute && (
            <div className="mb-16">
              <h2 className="text-3xl font-headline font-bold text-center mb-8">Haftanın Rotası</h2>
              <div className="max-w-2xl mx-auto">
                 <RouteCard route={featuredRoute} isFeatured />
              </div>
            </div>
          )}
          
          <Separator className="my-12" />

          <h2 className="text-3xl font-headline font-bold text-center mb-8">Tematik Rotalar</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {allRoutes.map(route => (
              <RouteCard key={route.id} route={route} isFeatured={featuredRoute?.id === route.id} />
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
