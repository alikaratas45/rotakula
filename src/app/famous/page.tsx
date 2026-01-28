"use client";

import { getStoryBySlug } from '@/lib/kula-data';
import { Story } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Image from 'next/image';
import Link from 'next/link';
import { getImageById } from '@/lib/placeholder-images';
import { Sparkles, ShieldCheck } from 'lucide-react';
import { useApp } from '@/context/app-context';
import { useEffect, useState } from 'react';
import { BackButton } from '@/components/back-button';
import { Badge } from '@/components/ui/badge';

const ProductCard = ({ story }: { story: Story }) => {
  const image = getImageById(story.imageId);
  const isGeographicallyIndicated = ['kula-halisi', 'kula-leblebisi'].includes(story.slug);
  const { translations } = useApp();

  return (
    <Link href={`/stories/${story.slug}`} className="group block">
      <Card className="h-full overflow-hidden transition-all duration-300 ease-in-out bg-card/50 hover:bg-card hover:shadow-xl hover:-translate-y-1">
        <CardHeader className="p-0">
          <div className="relative h-64 w-full overflow-hidden">
            {image && (
              <Image
                src={image.imageUrl}
                alt={image.description}
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-105"
                data-ai-hint={image.imageHint}
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent group-hover:from-black/70 transition-colors"></div>
             {isGeographicallyIndicated && (
                <Badge variant="secondary" className="absolute top-3 right-3 text-sm">
                    <ShieldCheck className="mr-2 h-4 w-4 text-green-500" />
                    {(translations.nav as any).geographicallyIndicated || 'Coğrafi İşaretli Ürün'}
                </Badge>
             )}
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <CardTitle className="font-headline text-2xl mb-2 group-hover:text-primary transition-colors">{story.title}</CardTitle>
          <CardDescription className="text-md">{story.excerpt}</CardDescription>
        </CardContent>
      </Card>
    </Link>
  );
};

export default function FamousProductsPage() {
  const { language, translations } = useApp();
  const [products, setProducts] = useState<Story[]>([]);

  useEffect(() => {
    async function fetchData() {
      const carpetStory = await getStoryBySlug('kula-halisi', language);
      const leblebiStory = await getStoryBySlug('kula-leblebisi', language);
      const breadStory = await getStoryBySlug('eksimayali-kula-ekmegi', language);
      const halvaStory = await getStoryBySlug('tahin-helvasi', language);
      const pideStory = await getStoryBySlug('sekerli-pide', language);
      const fetchedProducts = [carpetStory, leblebiStory, breadStory, halvaStory, pideStory].filter((p): p is Story => !!p);
      setProducts(fetchedProducts);
    }
    fetchData();
  }, [language]);

  return (
    <div className="container px-4 py-8 md:py-12">
        <BackButton className="mb-8" />
        <div className="flex items-center gap-4 mb-8">
            <Sparkles className="h-8 w-8 text-primary" />
            <h1 className="text-3xl md:text-4xl font-headline font-bold">{(translations.nav as any).famousProducts || "Meşhur Ürünler"}</h1>
        </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {products.map(product => (
          <ProductCard key={product.id} story={product} />
        ))}
      </div>
    </div>
  );
}
